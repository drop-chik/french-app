// One-off bootstrap: grant the founder account the 'admin' role. Run once
// against prod after migration 0018. After this, roles are managed from the
// admin panel UI itself.
//
//   $env:DATABASE_URL = "<postgres url>"
//   npx tsx src/db/seed/set-admin.ts [email]
//
// Defaults to the.lord.kraid@gmail.com if no email arg is passed.
import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import { eq } from 'drizzle-orm';
import { users } from '../schema/index.js';
import * as schema from '../schema/index.js';

const { Pool } = pg;

async function main() {
  const url = process.env['DATABASE_URL'];
  if (!url) throw new Error('DATABASE_URL is required');
  const email = process.argv[2] ?? 'the.lord.kraid@gmail.com';

  const pool = new Pool({ connectionString: url });
  const db = drizzle(pool, { schema });

  const result = await db
    .update(users)
    .set({ role: 'admin' })
    .where(eq(users.email, email))
    .returning({ id: users.id, email: users.email, role: users.role });

  if (result.length === 0) {
    console.error(`No user found with email ${email}`);
  } else {
    console.log(`Granted admin: ${result[0]!.email} (${result[0]!.id}) role=${result[0]!.role}`);
  }
  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
