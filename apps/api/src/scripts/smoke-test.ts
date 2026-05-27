/**
 * CI smoke test — boot the Fastify server far enough to register every
 * plugin + route, then exit. Catches the class of bugs that crashed prod
 * for ~24h on 2026-05-27 (commit 923db9e): a malformed `response` schema
 * passes tsc but throws `FST_ERR_SCH_SERIALIZATION_BUILD` at runtime when
 * Fastify builds the serializer, AFTER deployment.
 *
 * `tsc --noEmit` can't catch these because Fastify validates schemas at
 * runtime, not at the type level. This script exercises the same code
 * path Railway runs on deploy, in CI, before merge.
 *
 * We use noop env values so the script can run without a real DB / OpenAI:
 *   - DATABASE_URL: only used by the migrator + pool; we never connect here
 *   - skipMigrations=1 → skip the `migrate()` call at server boot
 *
 * To skip the DB hit cleanly the server checks `SMOKE_TEST=1` and bypasses
 * migrations + the audio_data ALTER. Everything route-level still happens.
 *
 * Run locally: `SMOKE_TEST=1 pnpm --filter @french-app/api smoke`
 * Run in CI:   added to .github/workflows/ci.yml after typecheck.
 */
import 'dotenv/config';

// Set BEFORE importing the server so the gates kick in.
process.env['SMOKE_TEST'] = '1';
process.env['NODE_ENV'] = process.env['NODE_ENV'] ?? 'development';
// Required by the fail-fast assert in production builds. We deliberately
// use dev env above so the asserts skip, but pre-fill anyway in case
// someone sets NODE_ENV=production for the smoke run.
process.env['JWT_SECRET'] = process.env['JWT_SECRET'] ?? 'smoke-jwt-secret-not-real';
process.env['JWT_REFRESH_SECRET'] = process.env['JWT_REFRESH_SECRET'] ?? 'smoke-refresh-not-real';
process.env['FRONTEND_URL'] = process.env['FRONTEND_URL'] ?? 'http://localhost:5173';
// Use a dummy DATABASE_URL — pg pool defers actual connection, so this is OK.
process.env['DATABASE_URL'] = process.env['DATABASE_URL'] ?? 'postgresql://smoke:smoke@127.0.0.1:1/smoke';
// words.service.ts instantiates `new OpenAI({ apiKey: process.env['OPENAI_API_KEY'] })`
// at module load — without a value, the OpenAI SDK throws synchronously and the
// smoke import fails before any route registers. The key is never actually used.
process.env['OPENAI_API_KEY'] = process.env['OPENAI_API_KEY'] ?? 'sk-smoke-test-not-real';

const TIMEOUT_MS = 30_000;
const watchdog = setTimeout(() => {
  console.error(`[smoke] timeout after ${TIMEOUT_MS}ms — server didn't reach .ready()`);
  process.exit(1);
}, TIMEOUT_MS);

try {
  // Dynamic import so any top-level error inside server.ts is caught here
  // with a clean message rather than crashing Node before we log anything.
  await import('../server.js');
  // If the import resolves without throwing, every plugin registered, every
  // route attached its schema cleanly. That's the win we want.
  console.log('[smoke] OK — Fastify booted with all routes and schemas valid');
  clearTimeout(watchdog);
  // Server has already called .listen() in server.ts. We don't want it
  // listening in a CI runner — just exit. The OS reclaims the port.
  process.exit(0);
} catch (err) {
  clearTimeout(watchdog);
  console.error('[smoke] FAILED — server boot error:');
  console.error(err);
  process.exit(1);
}
