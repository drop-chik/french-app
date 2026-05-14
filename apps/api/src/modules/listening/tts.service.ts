import OpenAI from 'openai';
import { createHash } from 'node:crypto';
import { eq } from 'drizzle-orm';
import { db } from '../../db/index.js';
import { ttsCache } from '../../db/schema/index.js';

const openai = new OpenAI({ apiKey: process.env['OPENAI_API_KEY'] });

// Quality settings. `tts-1-hd` is noticeably more natural than the cheap
// `tts-1` (especially on French phonemes — nasal vowels, liaisons). Among
// OpenAI's voices, `nova` is the most consistent on French — `alloy` came
// across robotic, `fable` had a heavy British accent on French.
const TTS_MODEL = 'tts-1-hd';
const TTS_VOICE = 'nova';

function cacheKey(text: string, voice: string, model: string): string {
  return createHash('sha256').update(`${model}::${voice}::${text}`).digest('hex');
}

/**
 * Generate TTS audio. Cached in `tts_cache` table — first hit on a given
 * (text, voice, model) tuple talks to OpenAI; subsequent hits return the
 * stored bytes directly (typically <10ms).
 */
export async function generateTTS(text: string): Promise<Buffer> {
  const hash = cacheKey(text, TTS_VOICE, TTS_MODEL);

  // 1. Try the cache.
  const hit = await db.query.ttsCache.findFirst({
    where: eq(ttsCache.textHash, hash),
  });
  if (hit) {
    // node-postgres returns Buffer for bytea — Drizzle types may still
    // narrow to a generic; ensure Buffer at the boundary.
    return Buffer.isBuffer(hit.audioData) ? hit.audioData : Buffer.from(hit.audioData);
  }

  // 2. Cache miss — generate via OpenAI.
  const response = await openai.audio.speech.create({
    model: TTS_MODEL,
    voice: TTS_VOICE,
    input: text,
    response_format: 'mp3',
  });
  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // 3. Store for future hits. onConflictDoNothing in case of a race where
  // two requests for the same text arrive simultaneously.
  try {
    await db.insert(ttsCache).values({
      textHash: hash,
      text,
      voice: TTS_VOICE,
      model: TTS_MODEL,
      audioData: buffer,
      byteSize: buffer.length,
    }).onConflictDoNothing();
  } catch (err) {
    // Don't fail the response if caching fails; just log and serve fresh bytes.
    console.error('[tts] cache insert failed:', err instanceof Error ? err.message : err);
  }

  return buffer;
}
