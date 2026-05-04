/**
 * Pre-generate TTS audio for all listening exercises that don't have cached audio.
 * Stores MP3 binary in audio_data (bytea) via raw SQL and sets audioUrl as the path.
 *
 * Run once (or after adding new exercises):
 *   pnpm --filter api generate-audio
 *
 * Safe to re-run: exercises with audioUrl already set are skipped.
 */
import 'dotenv/config';
import { sql } from 'drizzle-orm';
import { eq } from 'drizzle-orm';
import { db } from '../db/index.js';
import { listeningExercises } from '../db/schema/index.js';
import { generateTTS } from '../modules/listening/tts.service.js';
import { audioPath } from '../services/audio.service.js';

const exercises = await db
  .select({
    id: listeningExercises.id,
    title: listeningExercises.title,
    audioUrl: listeningExercises.audioUrl,
    transcript: listeningExercises.transcript,
  })
  .from(listeningExercises);

console.log(`Found ${exercises.length} exercise(s)\n`);

let generated = 0;
let skipped = 0;

for (const exercise of exercises) {
  if (exercise.audioUrl) {
    console.log(`⏭  [skip] ${exercise.title}`);
    skipped++;
    continue;
  }

  process.stdout.write(`🔊  Generating: ${exercise.title} ... `);
  try {
    const buffer = await generateTTS(exercise.transcript);
    const path = audioPath(exercise.id);

    await db.execute(
      sql`UPDATE listening_exercises SET audio_url = ${path}, audio_data = ${buffer} WHERE id = ${exercise.id}`,
    );

    console.log(`✅  ${buffer.length} bytes → /api${path}`);
    generated++;
  } catch (err) {
    console.error(`❌  ${err instanceof Error ? err.message : String(err)}`);
  }
}

console.log(`\nDone. Generated: ${generated}, skipped: ${skipped}`);
process.exit(0);
