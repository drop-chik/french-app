/**
 * Pre-generate TTS audio for all listening exercises that don't have cached audio.
 * Stores MP3 binary in the audio_data column and sets audioUrl as the serve path.
 *
 * Run once (or after adding new exercises):
 *   pnpm --filter api generate-audio
 *
 * Safe to re-run: exercises that already have audioUrl set are skipped.
 */
import 'dotenv/config';
import { eq } from 'drizzle-orm';
import { db } from '../db/index.js';
import { listeningExercises } from '../db/schema/index.js';
import { generateTTS } from '../modules/listening/tts.service.js';
import { audioPath } from '../services/audio.service.js';

const exercises = await db.query.listeningExercises.findMany({
  columns: { audioData: false },
});
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

    await db
      .update(listeningExercises)
      .set({ audioUrl: path, audioData: buffer })
      .where(eq(listeningExercises.id, exercise.id));

    console.log(`✅  ${buffer.length} bytes → /api${path}`);
    generated++;
  } catch (err) {
    console.error(`❌  ${err instanceof Error ? err.message : String(err)}`);
  }
}

console.log(`\nDone. Generated: ${generated}, skipped: ${skipped}`);
process.exit(0);
