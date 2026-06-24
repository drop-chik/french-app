/**
 * Bring the connected database to the full current schema: drizzle's tracked
 * migrations are already applied at server boot, but this runs the same
 * idempotent raw-SQL sync (0030+ tail) on demand — for provisioning a fresh
 * database, or as a pre-flight check that an environment is fully migrated.
 *
 * Usage:
 *   pnpm tsx src/scripts/sync-schema-cli.ts
 *   # or, against prod:
 *   $env:DATABASE_URL = (railway variables --json | ConvertFrom-Json).DATABASE_PUBLIC_URL
 *   pnpm --filter @french-app/api tsx src/scripts/sync-schema-cli.ts
 */
import 'dotenv/config';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { syncRawSchema } from '../db/sync-schema.js';

const here = dirname(fileURLToPath(import.meta.url));
// .sql files live only in src/ (tsc doesn't copy them to dist/), so point at
// the source folder — resolves the same from src/scripts (tsx) and
// dist/scripts (compiled), mirroring server.ts.
const migrationsFolder = join(here, '../../src/db/migrations');

console.log(`[db:sync] syncing raw-SQL tail from ${migrationsFolder}`);
await syncRawSchema(migrationsFolder);
console.log('[db:sync] done');
process.exit(0);
