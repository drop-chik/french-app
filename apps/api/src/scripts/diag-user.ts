/**
 * One-off diagnostic for a single user's auth + verification state.
 * Usage: pnpm tsx src/scripts/diag-user.ts <email>
 */
import 'dotenv/config';
import { db } from '../db/index.js';
import { users, emailVerificationTokens } from '../db/schema/index.js';
import { eq, desc } from 'drizzle-orm';

const email = process.argv[2];
if (!email) {
  console.error('Usage: tsx src/scripts/diag-user.ts <email>');
  process.exit(1);
}

const matches = await db
  .select({
    id: users.id,
    email: users.email,
    name: users.name,
    role: users.role,
    emailVerifiedAt: users.emailVerifiedAt,
    digestEnabled: users.digestEnabled,
    lastDigestSentAt: users.lastDigestSentAt,
    createdAt: users.createdAt,
  })
  .from(users)
  .where(eq(users.email, email));

console.log(`\n=== users matching email=${email} ===`);
console.log(JSON.stringify(matches, null, 2));

if (matches.length === 0) {
  console.log('\n(no rows)');
  process.exit(0);
}

for (const u of matches) {
  const tokens = await db
    .select({
      id: emailVerificationTokens.id,
      expiresAt: emailVerificationTokens.expiresAt,
      usedAt: emailVerificationTokens.usedAt,
      createdAt: emailVerificationTokens.createdAt,
    })
    .from(emailVerificationTokens)
    .where(eq(emailVerificationTokens.userId, u.id))
    .orderBy(desc(emailVerificationTokens.createdAt))
    .limit(5);

  console.log(`\n=== verification tokens for user=${u.id} (${u.email}) ===`);
  console.log(JSON.stringify(tokens, null, 2));
}

process.exit(0);
