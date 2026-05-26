/**
 * Backfill listening_exercises.sentence_timestamps with REAL per-sentence
 * start times by running each exercise's stored MP3 through OpenAI Whisper
 * with word-level timestamps, then aligning word timings back to the
 * transcript's sentence boundaries.
 *
 * Why: the frontend currently estimates sentence boundaries by weighting
 * cumulative word counts against total duration. That's ±1s on long texts.
 * Real Whisper word-timestamps give sub-100ms accuracy — clicking a
 * sentence in the transcript actually lands on it.
 *
 * Sentence boundary matching uses the SAME splitSentences regex as the
 * frontend (lookbehind /(?<=[.!?])\s+/), then for each sentence we find
 * its first content word in the Whisper word list (starting from the
 * cursor of the previous sentence) and record that word's `start` time.
 * First sentence is always 0.0 (clean reading entry).
 *
 * Idempotent: skips rows that already have sentence_timestamps populated.
 *
 * Cost: Whisper ≈ $0.006/min. ~45 exercises × ~30s average = ~22 minutes
 * total ≈ $0.13.
 *
 * Run:
 *   $env:DATABASE_URL   = (railway variables --service french-app --json | ConvertFrom-Json).DATABASE_URL
 *   $env:OPENAI_API_KEY = (railway variables --service french-app --json | ConvertFrom-Json).OPENAI_API_KEY
 *   cd apps/api
 *   npx tsx src/scripts/backfill-listening-timestamps.ts
 */
import 'dotenv/config';
import { eq, sql, isNull } from 'drizzle-orm';
import OpenAI from 'openai';
import { db } from '../db/index.js';
import { listeningExercises } from '../db/schema/index.js';

const openai = new OpenAI({ apiKey: process.env['OPENAI_API_KEY'] });
const SLEEP_MS = 400; // be gentle to the Whisper endpoint

// Mirror the frontend splitter exactly so the array indices line up with
// what ListeningExercisePage renders.
function splitSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

// Strip punctuation + lowercase for matching against Whisper's word.word
// (which usually arrives without trailing punctuation but sometimes with it).
function normWord(s: string): string {
  return s
    .toLowerCase()
    .replace(/^[«»""''.,!?;:()[\]—–\-]+/, '')
    .replace(/[«»""''.,!?;:()[\]—–\-]+$/, '');
}

interface WhisperWord { word: string; start: number; end: number }

/**
 * Walk through the transcript sentence-by-sentence; for each sentence find
 * its first content word in the Whisper word list (continuing from
 * `cursor` so we never seek backwards). The matched word's `start` time
 * becomes the sentence's start.
 *
 * Returns the timestamps array. First entry forced to 0.0 — most readings
 * start with a tiny lead-in that's part of the sentence anyway.
 */
function alignToSentences(sentences: string[], whWords: WhisperWord[]): number[] {
  const times: number[] = [];
  let cursor = 0;
  for (let i = 0; i < sentences.length; i++) {
    if (i === 0) {
      times.push(0);
      // Advance cursor past the first sentence's words so sentence 2 starts
      // looking from after them.
      const wordsInSentence = (sentences[0] ?? '').split(/\s+/).filter(Boolean).length;
      cursor += wordsInSentence;
      continue;
    }
    const sentence = sentences[i] ?? '';
    const firstToken = sentence.split(/\s+/).filter(Boolean)[0] ?? '';
    const target = normWord(firstToken);
    if (!target) {
      // Fallback: linearly interpolate from previous timestamp + best guess.
      const prev = times[i - 1] ?? 0;
      times.push(prev + 1.0);
      continue;
    }
    // Find target in Whisper words starting at cursor. Allow some slack: 30
    // tokens ahead is generous and avoids over-running into the next sentence
    // on a mismatch.
    const start = cursor;
    const end = Math.min(whWords.length, start + 60);
    let foundAt = -1;
    for (let j = start; j < end; j++) {
      const w = whWords[j];
      if (!w) continue;
      if (normWord(w.word) === target) { foundAt = j; break; }
    }
    if (foundAt === -1) {
      // Couldn't align — fall back to extrapolating from previous + average
      // word duration so the array stays monotonic.
      const prev = times[i - 1] ?? 0;
      const avgPerWord = whWords.length > 0
        ? (whWords[whWords.length - 1]?.end ?? prev + 1) / whWords.length
        : 0.4;
      const wordsInPrev = (sentences[i - 1] ?? '').split(/\s+/).filter(Boolean).length;
      times.push(prev + wordsInPrev * avgPerWord);
      // Best-guess cursor advance.
      const wordsInThis = sentence.split(/\s+/).filter(Boolean).length;
      cursor += wordsInThis;
      continue;
    }
    const t = whWords[foundAt]?.start ?? 0;
    times.push(t);
    // Advance cursor by this sentence's word count so we don't re-find the
    // same first-word later on.
    const wordsInThis = sentence.split(/\s+/).filter(Boolean).length;
    cursor = foundAt + wordsInThis;
  }
  // Enforce monotonic non-decreasing — safety net against alignment glitches.
  for (let i = 1; i < times.length; i++) {
    const prev = times[i - 1] ?? 0;
    const cur = times[i] ?? prev;
    if (cur < prev) times[i] = prev;
  }
  return times;
}

async function transcribe(audioBuffer: Buffer): Promise<WhisperWord[]> {
  // The OpenAI SDK expects a File-like object. In Node, we can wrap the Buffer
  // in a Blob and then a File (both available since Node 20).
  const blob = new Blob([audioBuffer], { type: 'audio/mpeg' });
  const file = new File([blob], 'audio.mp3', { type: 'audio/mpeg' });
  const resp = await openai.audio.transcriptions.create({
    file,
    model: 'whisper-1',
    language: 'fr',
    response_format: 'verbose_json',
    timestamp_granularities: ['word'],
  });
  // verbose_json with word timestamps populates `words`.
  const words = (resp as unknown as { words?: WhisperWord[] }).words ?? [];
  return words;
}

async function main() {
  // We need audio_data which is not in the Drizzle schema — pull via raw SQL.
  const targets = await db
    .select({
      id: listeningExercises.id,
      title: listeningExercises.title,
      transcript: listeningExercises.transcript,
      sentenceTimestamps: listeningExercises.sentenceTimestamps,
    })
    .from(listeningExercises)
    .where(isNull(listeningExercises.sentenceTimestamps));

  console.log(`Exercises missing timestamps: ${targets.length}`);
  if (targets.length === 0) {
    console.log('Nothing to do.');
    return;
  }

  let ok = 0;
  let failed = 0;

  for (const ex of targets) {
    const sentences = splitSentences(ex.transcript);
    if (sentences.length === 0) {
      console.log(`  skip "${ex.title}": empty transcript`);
      continue;
    }
    if (sentences.length === 1) {
      // Single-sentence exercise — just store [0].
      await db
        .update(listeningExercises)
        .set({ sentenceTimestamps: [0] })
        .where(eq(listeningExercises.id, ex.id));
      ok++;
      console.log(`  "${ex.title}": single sentence → [0]`);
      continue;
    }

    // Load the binary audio. Column isn't in Drizzle schema by design.
    const audioRow = await db.execute(
      sql`select audio_data from listening_exercises where id = ${ex.id}`,
    );
    const rows = audioRow as unknown as { rows?: Array<{ audio_data: Buffer | Uint8Array | null }> };
    const buf = rows.rows?.[0]?.audio_data ?? null;
    if (!buf) {
      console.log(`  skip "${ex.title}": no audio_data`);
      failed++;
      continue;
    }
    const audioBuffer = Buffer.isBuffer(buf) ? buf : Buffer.from(buf);

    try {
      const whWords = await transcribe(audioBuffer);
      if (whWords.length === 0) {
        console.log(`  "${ex.title}": Whisper returned no words — skipping`);
        failed++;
        continue;
      }
      const times = alignToSentences(sentences, whWords);
      await db
        .update(listeningExercises)
        .set({ sentenceTimestamps: times })
        .where(eq(listeningExercises.id, ex.id));
      ok++;
      console.log(
        `  "${ex.title}": ${sentences.length} sentences → ` +
        `[${times.slice(0, 3).map((t) => t.toFixed(2)).join(', ')}${times.length > 3 ? ', …' : ''}]`,
      );
    } catch (err) {
      failed++;
      console.error(`  "${ex.title}" failed:`, err instanceof Error ? err.message : err);
    }

    await new Promise((r) => setTimeout(r, SLEEP_MS));
  }

  console.log(`\nDone. ok: ${ok}, failed: ${failed}.`);
}

main()
  .catch((err) => { console.error(err); process.exit(1); })
  .finally(() => process.exit(0));
