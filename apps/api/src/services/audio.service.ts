import { sql } from 'drizzle-orm';
import type { DB } from '../db/index.js';
import { generateTTS } from '../modules/listening/tts.service.js';

const AUDIO_PATH_PREFIX = '/listening/exercises';

export function audioPath(exerciseId: string) {
  return `${AUDIO_PATH_PREFIX}/${exerciseId}/audio`;
}

/**
 * Ensures audio MP3 is stored in DB for the given exercise.
 * Uses raw SQL so the audio_data bytea column stays outside the Drizzle schema
 * (prevents accidental SELECT of large binary in list/get queries).
 *
 * Returns the client-facing URL (/api/... prefix for Vite proxy + Vercel rewrite).
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

  await db.execute(
    sql`UPDATE listening_exercises SET audio_url = ${path}, audio_data = ${buffer} WHERE id = ${exerciseId}`,
  );

  return `/api${path}`;
}

/**
 * Reads raw audio bytes from DB for serving via HTTP.
 * Returns null if not found or column missing.
 */
export async function getAudioData(
  db: DB,
  exerciseId: string,
): Promise<Buffer | null> {
  const rows = await db.execute(
    sql`SELECT audio_data FROM listening_exercises WHERE id = ${exerciseId} LIMIT 1`,
  );
  const row = rows.rows[0] as { audio_data: Buffer | null } | undefined;
  return row?.audio_data ?? null;
}
