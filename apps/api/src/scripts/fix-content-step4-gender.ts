/**
 * Step 4 of the content remediation plan.
 *
 * Backfill `words.gender` for nouns currently storing NULL. Two cohorts:
 *
 *   a) 62 elided-article nouns (`l'X`) — article in the `french` column is
 *      'l'' which doesn't reveal gender. The gender is normally inferable
 *      from a dictionary lookup.
 *   b) 55 bare-form nouns (`septembre`, `air`, ...) — no article at all,
 *      gender simply not stored.
 *
 * Approach: batch the words to gpt-4o-mini with a strict prompt. The model
 * returns 'm' or 'f' for each; we only write back if the value is one of
 * those two literals. Anything else is rejected (no rare-case 'epicene'
 * leak).
 *
 * Cost: ~117 words / 25-batch × ~$0.00005 ≈ <$0.001 total. Idempotent —
 * only operates on `gender IS NULL AND part_of_speech = 'noun'`.
 *
 * Run:
 *   $env:DATABASE_URL = (railway variables --service french-app --json | ConvertFrom-Json).DATABASE_URL
 *   $env:OPENAI_API_KEY = (railway variables --service french-app --json | ConvertFrom-Json).OPENAI_API_KEY
 *   pnpm tsx src/scripts/fix-content-step4-gender.ts
 */
import 'dotenv/config';
import OpenAI from 'openai';
import { and, eq, isNull, inArray } from 'drizzle-orm';
import { db } from '../db/index.js';
import { words } from '../db/schema/index.js';

const apiKey = process.env['OPENAI_API_KEY'];
if (!apiKey) {
  console.error('OPENAI_API_KEY missing');
  process.exit(1);
}
const openai = new OpenAI({ apiKey });

const SYSTEM_PROMPT = `You are a French grammar reference. The user lists
French nouns numbered "1: word", "2: word"... For each line, output a
single line "N: m" or "N: f" giving the noun's grammatical gender.

Rules:
- Use exactly lowercase "m" (masculin) or "f" (féminin).
- Months and weekdays are always masculine: "1: m".
- For multi-word entries (l'addition, le pouvoir d'achat), use the head
  noun's gender — strip articles mentally.
- For words with both genders depending on meaning (e.g. "tour"), pick
  the more common A1-B2 meaning.
- Output exactly N lines, one per input number, in order. No prose, no
  blank lines.`;

async function genderBatch(items: Array<{ french: string; translation: string }>): Promise<(string | null)[]> {
  // Numbered prompt — eliminates the array-length drift that pure JSON
  // batching produces. Model writes a single "N: m" or "N: f" per line.
  const userMsg = items.map((it, i) => `${i + 1}: ${it.french}`).join('\n');
  const resp = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    temperature: 0,
    max_tokens: 200,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: userMsg },
    ],
  });
  const raw = resp.choices[0]?.message?.content ?? '';
  // Parse 'N: m' / 'N: f' lines. Map by index.
  const result: (string | null)[] = new Array(items.length).fill(null);
  for (const line of raw.split(/\r?\n/)) {
    const m = line.match(/^\s*(\d+)\s*[:.\-]\s*([mfMF])\b/);
    if (!m) continue;
    const idx = Number(m[1]) - 1;
    const g = m[2]!.toLowerCase();
    if (idx >= 0 && idx < items.length) result[idx] = g;
  }
  return result;
}

const targets = await db.select({
  id: words.id,
  french: words.french,
  translation: words.translation,
}).from(words)
  .where(and(eq(words.partOfSpeech, 'noun'), isNull(words.gender)));

console.log(`[step4] ${targets.length} noun rows with gender=null`);
if (targets.length === 0) {
  console.log('[step4] nothing to do');
  process.exit(0);
}

const BATCH = 25;
let filled = 0;
let skipped = 0;
for (let i = 0; i < targets.length; i += BATCH) {
  const slice = targets.slice(i, i + BATCH);
  const items = slice.map((s) => ({ french: s.french, translation: s.translation }));
  try {
    const genders = await genderBatch(items);
    for (let j = 0; j < slice.length; j++) {
      const g = genders[j];
      if (g === 'm' || g === 'f') {
        await db.update(words).set({ gender: g }).where(eq(words.id, slice[j]!.id));
        filled++;
      } else {
        skipped++;
      }
    }
    console.log(`  batch ${i}-${i + slice.length}: filled ${filled}, skipped ${skipped}`);
  } catch (err) {
    console.error(`  batch ${i} failed:`, err instanceof Error ? err.message : err);
    skipped += slice.length;
  }
}

console.log(`\n[step4] done — filled ${filled}, skipped ${skipped} (of ${targets.length})`);
process.exit(0);
