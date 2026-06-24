/**
 * Idempotent raw-SQL schema sync — the second layer of this project's
 * migration story.
 *
 * Layer 1: drizzle's `migrate()` applies the schema-derived migrations tracked
 * in `meta/_journal.json` (idx 0000–0029 here).
 * Layer 2 (this module): later migrations (0030+) are hand-authored raw SQL,
 * applied outside drizzle-kit. `syncRawSchema()` brings any such untracked
 * `.sql` file to the database, exactly once, recording what it applied in a
 * small `_raw_sql_applied` table.
 *
 * Re-applying is safe regardless of the tracker: each statement runs once, and
 * the Postgres "object already exists" error codes are swallowed so a
 * partially-applied or already-current database is a no-op. Called at server
 * boot right after `migrate()`, so a freshly-provisioned environment self-heals
 * to the full schema with no manual run-raw-sql steps.
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { sql } from 'drizzle-orm';
import { db } from './index.js';

// Postgres error codes meaning "this object is already there" — i.e. the
// statement landed on a previous run. Anything else is a real failure and must
// surface (don't mask a broken migration as skipped). Codes:
//   42P07 duplicate_table (also CREATE INDEX on an existing relation name),
//   42701 duplicate_column, 42710 duplicate_object (constraint/index/type),
//   42P06 duplicate_schema, 42723 duplicate_function, 42P16 (rare dup table def)
const ALREADY_APPLIED = new Set(['42P07', '42701', '42710', '42P06', '42723', '42P16']);

function splitStatements(rawSql: string): string[] {
  // Strip line comments first so a leading `--` header block isn't treated as
  // part of the first statement, then split on a semicolon that ends a line.
  const cleaned = rawSql
    .split('\n')
    .filter((l) => !l.trim().startsWith('--'))
    .join('\n');
  return cleaned
    .split(/;\s*\n/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

/**
 * Apply one SQL document's statements, swallowing "already applied" errors.
 * Returns counts so callers can log what actually changed.
 */
export async function applySqlIdempotent(
  rawSql: string,
  label: string,
): Promise<{ ran: number; skipped: number }> {
  let ran = 0;
  let skipped = 0;
  for (const stmt of splitStatements(rawSql)) {
    try {
      await db.execute(sql.raw(stmt));
      ran++;
    } catch (err) {
      const code = (err as { code?: string }).code;
      if (code && ALREADY_APPLIED.has(code)) {
        skipped++;
      } else {
        console.error(`[sync-schema] ${label}: statement failed —`, (err as Error).message);
        throw err;
      }
    }
  }
  return { ran, skipped };
}

/**
 * Apply every migration `.sql` file that neither drizzle's journal nor the
 * `_raw_sql_applied` tracker already covers, in filename order. Idempotent and
 * safe to call on every boot.
 */
export async function syncRawSchema(migrationsFolder: string): Promise<void> {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS _raw_sql_applied (
      tag varchar(255) PRIMARY KEY,
      applied_at timestamp NOT NULL DEFAULT now()
    )
  `);

  // Files drizzle already owns (its journal) — leave those to migrate().
  let journalTags = new Set<string>();
  try {
    const journal = JSON.parse(
      readFileSync(join(migrationsFolder, 'meta', '_journal.json'), 'utf8'),
    ) as { entries: { tag: string }[] };
    journalTags = new Set(journal.entries.map((e) => e.tag));
  } catch {
    // No journal readable → fall back to applying all raw files (still
    // idempotent; the tracker still prevents re-runs).
  }

  const already = await db.execute<{ tag: string }>(sql`SELECT tag FROM _raw_sql_applied`);
  const appliedTags = new Set(already.rows.map((r) => r.tag));

  const pending = readdirSync(migrationsFolder)
    .filter((f) => f.endsWith('.sql'))
    .sort() // zero-padded prefixes sort chronologically
    .filter((f) => {
      const tag = f.replace(/\.sql$/, '');
      return !journalTags.has(tag) && !appliedTags.has(tag);
    });
  if (pending.length === 0) return;

  let totalRan = 0;
  for (const file of pending) {
    const tag = file.replace(/\.sql$/, '');
    const { ran, skipped } = await applySqlIdempotent(
      readFileSync(join(migrationsFolder, file), 'utf8'),
      file,
    );
    await db.execute(sql`
      INSERT INTO _raw_sql_applied (tag) VALUES (${tag})
      ON CONFLICT (tag) DO NOTHING
    `);
    totalRan += ran;
    console.log(`[sync-schema] ${file}: ${ran} applied, ${skipped} already present`);
  }
  console.log(`[sync-schema] ${pending.length} untracked file(s) synced, ${totalRan} statement(s) applied`);
}
