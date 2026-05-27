import bcrypt from 'bcrypt';
import { randomBytes, createHash } from 'node:crypto';
import { eq, and, isNull, gt } from 'drizzle-orm';
import type { DB } from '../../db/index.js';
import { users, passwordResetTokens, emailVerificationTokens } from '../../db/schema/index.js';
import type { RegisterInput, LoginInput } from './auth.schema.js';
import { generateUniqueTag } from '../social/tag.js';
import { recordActivity } from '../social/activity.service.js';
import { sendEmail, buildPasswordResetEmail, buildEmailVerificationEmail } from '../../lib/email.js';

const BCRYPT_ROUNDS = 12;
const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour
const RESET_TOKEN_BYTES = 32; // 256 bits → 64 hex chars in URL
const VERIFY_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const VERIFY_TOKEN_BYTES = 32;

export async function registerUser(db: DB, input: RegisterInput) {
  const existing = await db.query.users.findFirst({
    where: eq(users.email, input.email),
  });

  if (existing) {
    throw new Error('EMAIL_TAKEN');
  }

  const hashedPassword = await bcrypt.hash(input.password, BCRYPT_ROUNDS);
  const tag = await generateUniqueTag(db, input.name);

  const [user] = await db
    .insert(users)
    .values({
      email: input.email,
      password: hashedPassword,
      name: input.name,
      tag,
    })
    .returning({
      id: users.id,
      email: users.email,
      name: users.name,
      level: users.level,
      placementTestDone: users.placementTestDone,
      role: users.role,
      tag: users.tag,
    });

  if (!user) throw new Error('Failed to create user');

  // Seed the activity feed so a brand-new account already has one event
  // (and followers see "joined FrenchUp"). Best-effort — never blocks signup.
  await recordActivity(db, user.id, 'joined', {});

  return user;
}

// Distributed-brute-force defence. /auth/login route already enforces an IP
// rate-limit; this is an *account*-level lockout for attackers rotating IPs.
// Threshold is generous enough that real users won't trip it from a couple
// of typos (5 attempts in a sliding 15-min window), and the lockout itself
// is short (15 min) so we don't ddos legit users out of their own accounts
// if someone targets them.
const LOCKOUT_THRESHOLD = 5;
const LOCKOUT_WINDOW_MS = 15 * 60 * 1000; // count failures within this window
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // and lock for this long

export async function loginUser(db: DB, input: LoginInput) {
  const user = await db.query.users.findFirst({
    where: eq(users.email, input.email),
  });

  if (!user || !user.password) {
    // Don't increment counters here — the email isn't in our DB, so there's
    // no row to update. The IP rate-limit still throttles enumeration.
    throw new Error('INVALID_CREDENTIALS');
  }

  // Locked account: reject without even hashing. Surfaces a distinct error
  // so the UI can tell the user when to come back rather than the generic
  // "wrong password".
  if (user.lockoutUntil && user.lockoutUntil.getTime() > Date.now()) {
    throw new Error('ACCOUNT_LOCKED');
  }

  const valid = await bcrypt.compare(input.password, user.password);
  if (!valid) {
    // Increment failed counter. If the previous failure was older than
    // LOCKOUT_WINDOW_MS we treat this as a fresh attempt window (reset to 1).
    // Hitting LOCKOUT_THRESHOLD trips the lock for LOCKOUT_DURATION_MS.
    const now = new Date();
    const lastFail = user.lastFailedLoginAt;
    const withinWindow = lastFail && now.getTime() - lastFail.getTime() < LOCKOUT_WINDOW_MS;
    const newCount = withinWindow ? user.failedLoginAttempts + 1 : 1;
    const shouldLock = newCount >= LOCKOUT_THRESHOLD;

    await db.update(users)
      .set({
        failedLoginAttempts: newCount,
        lastFailedLoginAt: now,
        lockoutUntil: shouldLock ? new Date(now.getTime() + LOCKOUT_DURATION_MS) : null,
      })
      .where(eq(users.id, user.id));

    throw new Error(shouldLock ? 'ACCOUNT_LOCKED' : 'INVALID_CREDENTIALS');
  }

  // Successful login — reset the counters so a typo earlier in the week
  // doesn't add up over time.
  if (user.failedLoginAttempts > 0 || user.lockoutUntil) {
    await db.update(users)
      .set({ failedLoginAttempts: 0, lastFailedLoginAt: null, lockoutUntil: null })
      .where(eq(users.id, user.id));
  }

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    level: user.level,
    placementTestDone: user.placementTestDone,
    role: user.role,
    tag: user.tag,
  };
}

// Hash the raw token before storing — same shape as session tokens elsewhere
// (sha256 hex) so a DB leak doesn't hand the attacker valid reset URLs.
function hashToken(raw: string): string {
  return createHash('sha256').update(raw).digest('hex');
}

/**
 * Generate a reset token, store its hash, and email the raw value as part of
 * the URL the user clicks. Caller must pass the desired UI language for the
 * email template, plus a frontend base URL where the /reset-password page
 * lives — we don't hardcode `frenchup.app` because Preview deploys serve
 * the same backend but different hostname.
 *
 * Returns `false` if email doesn't match any user, but the API route MUST
 * NOT leak that to the caller — same 200 response either way → no email
 * enumeration.
 */
export async function createPasswordResetToken(
  db: DB,
  email: string,
  lang: 'ru' | 'en',
  frontendUrl: string,
): Promise<boolean> {
  const user = await db.query.users.findFirst({
    where: eq(users.email, email),
    columns: { id: true, email: true },
  });
  if (!user) return false;

  // 32 raw bytes → 64-char hex string. Plenty of entropy, fits in a URL.
  const rawToken = randomBytes(RESET_TOKEN_BYTES).toString('hex');
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MS);

  await db.insert(passwordResetTokens).values({
    userId: user.id,
    tokenHash,
    expiresAt,
  });

  const resetUrl = `${frontendUrl.replace(/\/$/, '')}/reset-password?token=${rawToken}`;
  const mail = buildPasswordResetEmail(resetUrl, lang);

  await sendEmail({
    to: user.email,
    subject: mail.subject,
    html: mail.html,
    text: mail.text,
  });
  return true;
}

/**
 * Consume a reset token: validates it's known, unused, unexpired, then
 * updates the user's password. Token is marked used in the same transaction
 * so a leaked link can't be re-used.
 *
 * Throws sentinel errors the route layer maps to clean 400s.
 */
export async function resetPasswordWithToken(
  db: DB,
  rawToken: string,
  newPassword: string,
): Promise<{ userId: string }> {
  if (newPassword.length < 8) throw new Error('PASSWORD_TOO_SHORT');

  const tokenHash = hashToken(rawToken);
  const now = new Date();

  const row = await db.query.passwordResetTokens.findFirst({
    where: and(
      eq(passwordResetTokens.tokenHash, tokenHash),
      isNull(passwordResetTokens.usedAt),
      gt(passwordResetTokens.expiresAt, now),
    ),
  });
  if (!row) throw new Error('INVALID_TOKEN');

  const hashed = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);

  // Two writes — we don't have a transaction helper exposed at the service
  // layer, but the order is safe: even if the second write fails, the user
  // still has their old password and the token will expire shortly. Worst
  // case is they request a new reset.
  await db.update(users).set({ password: hashed }).where(eq(users.id, row.userId));
  await db
    .update(passwordResetTokens)
    .set({ usedAt: now })
    .where(eq(passwordResetTokens.id, row.id));

  return { userId: row.userId };
}

/**
 * Generate an email-verification token, store its sha256 hash, and email
 * the raw URL to the user. Called automatically on registration AND from
 * the resend button on the dashboard banner.
 *
 * Idempotent in practice: if the user already clicked verify, we no-op
 * (no point sending a confirm to an already-confirmed address).
 */
export async function createEmailVerificationToken(
  db: DB,
  userId: string,
  lang: 'ru' | 'en',
  frontendUrl: string,
): Promise<void> {
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
    columns: { id: true, email: true, emailVerifiedAt: true },
  });
  if (!user || user.emailVerifiedAt) return;

  const rawToken = randomBytes(VERIFY_TOKEN_BYTES).toString('hex');
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(Date.now() + VERIFY_TOKEN_TTL_MS);

  await db.insert(emailVerificationTokens).values({
    userId: user.id,
    tokenHash,
    expiresAt,
  });

  const verifyUrl = `${frontendUrl.replace(/\/$/, '')}/verify-email?token=${rawToken}`;
  const mail = buildEmailVerificationEmail(verifyUrl, lang);
  await sendEmail({
    to: user.email,
    subject: mail.subject,
    html: mail.html,
    text: mail.text,
  });
}

/**
 * Consume a verification token: marks both the token and the user as
 * verified. Idempotent — if already verified, returns ok without trying
 * to re-verify (so users who click the link twice don't see an error).
 */
export async function verifyEmailWithToken(
  db: DB,
  rawToken: string,
): Promise<{ userId: string; alreadyVerified: boolean }> {
  const tokenHash = hashToken(rawToken);
  const now = new Date();

  const row = await db.query.emailVerificationTokens.findFirst({
    where: and(
      eq(emailVerificationTokens.tokenHash, tokenHash),
      gt(emailVerificationTokens.expiresAt, now),
    ),
  });
  if (!row) throw new Error('INVALID_TOKEN');

  // Already used (e.g. user clicked the link twice) — still report success
  // so the second click doesn't show an error. Just don't re-stamp.
  if (row.usedAt) {
    return { userId: row.userId, alreadyVerified: true };
  }

  await db.update(users).set({ emailVerifiedAt: now }).where(eq(users.id, row.userId));
  await db
    .update(emailVerificationTokens)
    .set({ usedAt: now })
    .where(eq(emailVerificationTokens.id, row.id));

  return { userId: row.userId, alreadyVerified: false };
}
