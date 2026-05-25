/**
 * Batch-generate IPA transcriptions for every active word missing one.
 *
 * Idempotent: only touches rows where `ipa IS NULL`. Re-running after the
 * seed adds new words is safe — just picks up the new ones.
 *
 * Uses gpt-4o-mini in chunks of 20 words per request. Cost ≈ $0.05 for the
 * full ~3500-word catalog. The OpenAI key is read from env (the same key
 * the rest of the app uses).
 *
 * Run:
 *   $env:DATABASE_URL = (railway variables --json | ConvertFrom-Json).DATABASE_URL
 *   $env:OPENAI_API_KEY = "<key>"
 *   cd apps/api
 *   npx tsx src/scripts/generate-ipa-batch.ts
 */
import 'dotenv/config';
import { eq, and, isNull } from 'drizzle-orm';
import OpenAI from 'openai';
import { db } from '../db/index.js';
import { words } from '../db/schema/index.js';

const openai = new OpenAI({ apiKey: process.env['OPENAI_API_KEY'] });
const CHUNK = 20;
const SLEEP_MS = 200;

const SYSTEM_PROMPT =
  'You are a French phonetics expert. Given a JSON array of French words or short phrases, ' +
  'return a JSON object {"ipa": [...]} where each entry is the IPA transcription of the ' +
  'corresponding input. ' +
  'Use the modern Parisian standard. Do NOT include surrounding slashes or brackets. ' +
  'Use proper IPA characters (ʁ, ɑ̃, ɔ̃, ɛ̃, œ̃, ø, œ, ɥ, ɲ, ʃ, ʒ, etc.). ' +
  'For nouns, transcribe the bare noun without article. ' +
  'For multi-word phrases, separate words with a single space and respect liaison. ' +
  'Keep each transcription concise (≤30 chars). Return ONLY the JSON object.';

interface IpaResponse {
  ipa: string[];
}

async function transcribeChunk(frenchWords: string[]): Promise<string[]> {
  const resp = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    response_format: { type: 'json_object' },
    temperature: 0,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: JSON.stringify(frenchWords) },
    ],
  });
  const raw = resp.choices[0]?.message?.content ?? '{}';
  let parsed: IpaResponse;
  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    throw new Error(`Bad JSON from model: ${raw}`);
  }
  if (!Array.isArray(parsed.ipa) || parsed.ipa.length !== frenchWords.length) {
    throw new Error(
      `Length mismatch: expected ${frenchWords.length}, got ${parsed.ipa?.length}`,
    );
  }
  return parsed.ipa.map((s) => String(s).trim().slice(0, 30));
}

async function main() {
  const rows = await db
    .select({ id: words.id, french: words.french })
    .from(words)
    .where(and(isNull(words.ipa), eq(words.isActive, true)));

  console.log(`Words missing IPA: ${rows.length}`);
  if (rows.length === 0) {
    console.log('Nothing to do.');
    return;
  }

  let done = 0;
  let failed = 0;

  for (let i = 0; i < rows.length; i += CHUNK) {
    const batch = rows.slice(i, i + CHUNK);
    const frenchInputs = batch.map((r) => r.french);
    try {
      const ipas = await transcribeChunk(frenchInputs);
      for (let j = 0; j < batch.length; j++) {
        const row = batch[j]!;
        const ipa = ipas[j];
        if (!ipa) continue;
        await db.update(words).set({ ipa }).where(eq(words.id, row.id));
      }
      done += batch.length;
      console.log(`  ${done} / ${rows.length}  (last: ${batch[0]!.french} → ${ipas[0]})`);
    } catch (err) {
      failed += batch.length;
      console.error(`  chunk failed at offset ${i}:`, err instanceof Error ? err.message : err);
    }
    if (i + CHUNK < rows.length) await new Promise((r) => setTimeout(r, SLEEP_MS));
  }

  console.log(`Done. Updated: ${done}, failed: ${failed}.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => process.exit(0));
