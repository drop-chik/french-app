/**
 * One-off backfill for listening_exercises rows whose audio_data is NULL —
 * generates the MP3 via the existing TTS service and writes it to DB. Once
 * audio_data exists, backfill-listening-timestamps.ts (next run) can fill
 * sentence_timestamps for these rows.
 *
 * Idempotent: skips rows that already have audio_data.
 *
 * Cost: tts-1-hd ≈ $30/1M chars. 7 exercises × ~1500 chars ≈ 10k chars ≈ $0.30.
 *
 * Run:
 *   $env:DATABASE_URL   = (railway variables --service french-app --json | ConvertFrom-Json).DATABASE_URL
 *   $env:OPENAI_API_KEY = (railway variables --service french-app --json | ConvertFrom-Json).OPENAI_API_KEY
 *   cd apps/api
 *   npx tsx src/scripts/backfill-listening-audio.ts
 */
import 'dotenv/config';
import { sql } from 'drizzle-orm';
import { db } from '../db/index.js';
import { ensureAudio } from '../services/audio.service.js';

async function main() {
  // Find rows whose audio_data is NULL. The column isn't in Drizzle schema by
  // design (kept out to avoid SELECTing large binary by accident), so raw SQL.
  const rows = await db.execute(sql`
    SELECT id, title, transcript
    FROM listening_exercises
    WHERE audio_data IS NULL
    ORDER BY level, title;
  `);
  const list = (rows as unknown as {
    rows?: Array<{ id: string; title: string; transcript: string }>;
  }).rows ?? [];

  console.log(`Exercises without audio_data: ${list.length}`);
  if (list.length === 0) {
    console.log('Nothing to do.');
    return;
  }

  let ok = 0;
  let failed = 0;
  for (const ex of list) {
    try {
      console.log(`  TTS → "${ex.title}" (transcript ${ex.transcript.length} chars)`);
      await ensureAudio(db, ex.id, ex.transcript, '');
      ok++;
    } catch (err) {
      failed++;
      console.error(`  "${ex.title}" failed:`, err instanceof Error ? err.message : err);
    }
  }
  console.log(`\nDone. ok: ${ok}, failed: ${failed}.`);
}

main()
  .catch((err) => { console.error(err); process.exit(1); })
  .finally(() => process.exit(0));
