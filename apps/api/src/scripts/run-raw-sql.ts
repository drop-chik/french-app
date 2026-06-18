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
    // Only swallow the specific "already applied" Postgres error codes, not
    // any message containing "already exists" — a broad text match could
    // mask a genuinely failed migration as skipped. Codes:
    //   42P07 duplicate_table, 42701 duplicate_column,
    //   42710 duplicate_object (constraint/index), 42P06 duplicate_schema,
    //   42723 duplicate_function, 42P16 invalid_table_definition (rare dup)
    const code = (err as { code?: string }).code;
    const APPLIED_CODES = new Set(['42P07', '42701', '42710', '42P06', '42723']);
    if (code && APPLIED_CODES.has(code)) {
      console.log(`    skipped (already applied — ${code})`);
    } else {
      throw err;
    }
  }
}
console.log('[run-raw-sql] done');
process.exit(0);
