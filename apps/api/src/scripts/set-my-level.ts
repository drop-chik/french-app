import 'dotenv/config';
import { eq } from 'drizzle-orm';
import { db } from '../db/index.js';
import { users } from '../db/schema/index.js';

const newLevel = (process.argv[2] ?? 'C1') as 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
const email = process.argv[3] ?? 'the.lord.kraid@gmail.com';

const [r] = await db.update(users).set({ level: newLevel }).where(eq(users.email, email)).returning({ id: users.id, email: users.email, level: users.level });
console.log(r ? `set ${r.email} → ${r.level}` : `no user with email ${email}`);
process.exit(0);
