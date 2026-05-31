/**
 * Run a raw SQL file against the connected database. Used when
 * drizzle-kit's schema-derived migrations miss a hand-written file
 * (e.g. when we need indexes or columns that we authored as raw SQL).
 *
 * Usage:  pnpm tsx src/scripts/run-raw-sql.ts <path-to-sql>
 */
import 'dotenv/config';
import { readFileSync } from 'node:fs';
import { sql } from 'drizzle-orm';
import { db } from '../db/index.js';

const file = process.argv[2];
if (!file) { console.error('Usage: run-raw-sql <file>'); process.exit(1); }

const raw = readFileSync(file, 'utf8');
// Strip line comments first so a header `--` block doesn't make the
// whole statement look like a comment to the filter below.
const cleaned = raw
  .split('\n')
  .filter((l) => !l.trim().startsWith('--'))
  .join('\n');
const statements = cleaned
  .split(/;\s*\n/)
  .map((s) => s.trim())
  .filter((s) => s.length > 0);

console.log(`[run-raw-sql] ${statements.length} statements from ${file}`);
for (const stmt of statements) {
  const preview = stmt.replace(/\s+/g, ' ').slice(0, 80);
  console.log(`  ► ${preview}…`);
  try {
    await db.execute(sql.raw(stmt));
  } catch (err) {
    const msg = (err as Error).message;
    if (/already exists|duplicate column/i.test(msg)) {
      console.log(`    skipped (already applied)`);
    } else {
      throw err;
    }
  }
}
console.log('[run-raw-sql] done');
process.exit(0);
