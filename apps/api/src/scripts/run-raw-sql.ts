/**
 * Run a single raw SQL file against the connected database, idempotently
 * (the "object already exists" Postgres codes are swallowed). Used for an
 * ad-hoc one-off file; to sync the whole untracked tail use `db:sync`.
 *
 * Usage:  pnpm tsx src/scripts/run-raw-sql.ts <path-to-sql>
 */
import 'dotenv/config';
import { readFileSync } from 'node:fs';
import { applySqlIdempotent } from '../db/sync-schema.js';

const file = process.argv[2];
if (!file) {
  console.error('Usage: run-raw-sql <file>');
  process.exit(1);
}

const { ran, skipped } = await applySqlIdempotent(readFileSync(file, 'utf8'), file);
console.log(`[run-raw-sql] ${file}: ${ran} applied, ${skipped} already present`);
process.exit(0);
