import 'dotenv/config';
import bcrypt from 'bcrypt';
import { eq } from 'drizzle-orm';
import { db } from '../db/index.js';
import { users } from '../db/schema/index.js';
import { generateUniqueTag } from '../modules/social/tag.js';

/**
 * Create (or refresh) a known test account so a human can log in and explore
 * the app without going through email verification.
 *
 * Idempotent: re-running resets the password + state instead of creating
 * duplicates. The credentials are intentionally hard-coded here (this is a
 * throwaway demo account, not a real user) so the script is the single source
 * of truth for "what are the test login details".
 *
 * State is tuned so the account is immediately useful AND can demo features:
 *   - emailVerifiedAt set  → no verification wall on first login.
 *   - level A2, placement done → real content unlocked, no placement test.
 *   - xp 445 → "Уровень 3", 5 XP short of level 4 (threshold 450). A single
 *     correct vocab answer (+5) tips it over and fires the level-up celebration
 *     so the user can see it on demand.
 */
const EMAIL = 'demo@frenchup.app';
const PASSWORD = 'FrenchUp2026';
const NAME = 'Демо аккаунт';

const hashed = await bcrypt.hash(PASSWORD, 12);

const existing = await db.query.users.findFirst({ where: eq(users.email, EMAIL) });

if (existing) {
  await db
    .update(users)
    .set({
      password: hashed,
      name: NAME,
      level: 'A2',
      placementTestDone: true,
      emailVerifiedAt: new Date(),
      xp: 445,
      // clear any lockout left over from failed login experiments
      failedLoginAttempts: 0,
      lockoutUntil: null,
      updatedAt: new Date(),
    })
    .where(eq(users.id, existing.id));
  console.log(`✓ Refreshed existing test account (id=${existing.id})`);
} else {
  const tag = await generateUniqueTag(db, NAME);
  const [created] = await db
    .insert(users)
    .values({
      email: EMAIL,
      password: hashed,
      name: NAME,
      tag,
      level: 'A2',
      placementTestDone: true,
      emailVerifiedAt: new Date(),
      xp: 445,
    })
    .returning({ id: users.id });
  console.log(`✓ Created test account (id=${created?.id})`);
}

console.log('');
console.log('  Login:    ' + EMAIL);
console.log('  Password: ' + PASSWORD);
console.log('  Level:    A2 · XP 445 (Уровень 3 — один верный ответ до Уровня 4)');
console.log('');
process.exit(0);
