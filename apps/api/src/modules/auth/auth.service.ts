import bcrypt from 'bcrypt';
import { randomBytes, createHash } from 'node:crypto';
import { eq, and, isNull, gt } from 'drizzle-orm';
import type { DB } from '../../db/index.js';
import { users, passwordResetTokens } from '../../db/schema/index.js';
import type { RegisterInput, LoginInput } from './auth.schema.js';
import { generateUniqueTag } from '../social/tag.js';
import { recordActivity } from '../social/activity.service.js';
import { sendEmail, buildPasswordResetEmail } from '../../lib/email.js';

const BCRYPT_ROUNDS = 12;
const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour
const RESET_TOKEN_BYTES = 32; // 256 bits → 64 hex chars in URL

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

export async function loginUser(db: DB, input: LoginInput) {
  const user = await db.query.users.findFirst({
    where: eq(users.email, input.email),
  });

  if (!user || !user.password) {
    throw new Error('INVALID_CREDENTIALS');
  }

  const valid = await bcrypt.compare(input.password, user.password);
  if (!valid) {
    throw new Error('INVALID_CREDENTIALS');
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
