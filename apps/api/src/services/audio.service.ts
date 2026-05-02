import { eq } from 'drizzle-orm';
import type { DB } from '../db/index.js';
import { listeningExercises } from '../db/schema/index.js';
import { generateTTS } from '../modules/listening/tts.service.js';

const AUDIO_PATH_PREFIX = '/listening/exercises';

/**
 * Returns the internal path for an exercise's audio.
 * Used as both the DB flag and the base for the client-facing URL.
 */
export function audioPath(exerciseId: string) {
  return `${AUDIO_PATH_PREFIX}/${exerciseId}/audio`;
}

/**
 * Ensures audio is generated and stored in DB for the given exercise.
 *
 * - If audioUrl is already set (non-empty) → no-op, just returns the client URL.
 * - Otherwise: generates TTS → stores MP3 in audio_data → sets audioUrl as
 *   the path flag → returns the client URL.
 *
 * The client URL includes /api prefix so it works via Vite proxy (dev) and
 * Vercel rewrite (prod).
 */
export async function ensureAudio(
  db: DB,
  exerciseId: string,
  transcript: string,
  cachedUrl: string,
): Promise<string> {
  if (cachedUrl) return `/api${cachedUrl}`;

  const buffer = await generateTTS(transcript);
  const path = audioPath(exerciseId);

  await db
    .update(listeningExercises)
    .set({ audioUrl: path, audioData: buffer })
    .where(eq(listeningExercises.id, exerciseId));

  return `/api${path}`;
}
