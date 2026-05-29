import 'dotenv/config';
import { eq } from 'drizzle-orm';
import { db } from '../db/index.js';
import { users } from '../db/schema/index.js';

const all = await db.select({ id: users.id, email: users.email, level: users.level, role: users.role, name: users.name }).from(users);
console.log(`${all.length} users total`);
for (const u of all) {
  console.log(`  ${u.email.padEnd(40)} | level=${u.level} | role=${u.role} | ${u.name ?? ''}`);
}
process.exit(0);
