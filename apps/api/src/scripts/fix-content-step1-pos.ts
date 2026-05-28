/**
 * Step 1 of the content remediation plan from docs/CONTENT-AUDIT-2026-05-28.md.
 *
 * Normalise the partOfSpeech taxonomy: 89 rows carry the abbreviated
 * 'adj' while the rest of the DB uses the full 'adjective'. Single
 * UPDATE — zero risk, zero AI cost, instantaneous.
 *
 * Idempotent: rerunning is a no-op once the values are normalised.
 *
 * Run:
 *   $env:DATABASE_URL = (railway variables --service french-app --json | ConvertFrom-Json).DATABASE_URL
 *   pnpm tsx src/scripts/fix-content-step1-pos.ts
 */
import 'dotenv/config';
import { sql } from 'drizzle-orm';
import { db } from '../db/index.js';

const before = await db.execute(sql`
  SELECT COUNT(*) AS n FROM words WHERE part_of_speech = 'adj'
`);
const beforeCount = Number((before.rows[0] as { n: string }).n);
console.log(`[step1] rows with pos='adj' before: ${beforeCount}`);

if (beforeCount === 0) {
  console.log('[step1] nothing to do — already normalised.');
  process.exit(0);
}

const result = await db.execute(sql`
  UPDATE words
  SET part_of_speech = 'adjective'
  WHERE part_of_speech = 'adj'
`);

console.log(`[step1] updated ${result.rowCount ?? '?'} rows pos: 'adj' → 'adjective'`);

const after = await db.execute(sql`
  SELECT COUNT(*) AS n FROM words WHERE part_of_speech = 'adj'
`);
const afterCount = Number((after.rows[0] as { n: string }).n);
console.log(`[step1] rows with pos='adj' after: ${afterCount} (should be 0)`);

process.exit(0);
