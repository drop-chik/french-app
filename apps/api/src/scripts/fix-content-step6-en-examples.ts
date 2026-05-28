/**
 * Step 6 of the content remediation plan.
 *
 * Backfill three Optional columns whenever they're NULL:
 *   - translation_en
 *   - example_fr
 *   - example_ru
 *
 * (example_en is also filled when missing, since rows that lack
 * translation_en typically lack the entire English side.)
 *
 * 347 rows are missing each of the above per the full-scan audit. We send
 * a numbered-line batch to gpt-4o-mini with strict instructions to keep
 * examples short, A1-B2 appropriate, and contextually consistent across
 * languages.
 *
 * Cost estimate: 347 / 10-batch = ~35 calls × ~$0.001 ≈ $0.04.
 * Idempotent — only writes when the column is NULL.
 *
 * Run:
 *   $env:DATABASE_URL = (railway variables --service french-app --json | ConvertFrom-Json).DATABASE_URL
 *   $env:OPENAI_API_KEY = (railway variables --service french-app --json | ConvertFrom-Json).OPENAI_API_KEY
 *   pnpm tsx src/scripts/fix-content-step6-en-examples.ts
 */
import 'dotenv/config';
import OpenAI from 'openai';
import { and, eq, or, isNull } from 'drizzle-orm';
import { db } from '../db/index.js';
import { words } from '../db/schema/index.js';

const apiKey = process.env['OPENAI_API_KEY'];
if (!apiKey) { console.error('OPENAI_API_KEY missing'); process.exit(1); }
const openai = new OpenAI({ apiKey });

const SYSTEM_PROMPT = `You are a French textbook editor. For each French
entry the user gives, produce four fields in JSON:

{
  "results": [
    {
      "translation_en": "<english translation, 1-4 words>",
      "example_fr": "<one short French sentence, 4-12 words, illustrating
        the word naturally at A1-B2 level>",
      "example_ru": "<faithful Russian translation of example_fr>",
      "example_en": "<faithful English translation of example_fr>"
    },
    ...
  ]
}

Rules:
- Output exactly N result objects in the SAME order as input.
- Examples should use the SAME word as in the input (or its inflection).
- Examples must be A1-B2 simple. No idioms, no slang.
- translation_en is a brief gloss, not a sentence.
- For proper nouns (months, weekdays, names), translation_en is the
  obvious capitalised equivalent.
- Russian translations use modern usage.
- No prose outside the JSON.`;

interface AiResult {
  translation_en: string;
  example_fr: string;
  example_ru: string;
  example_en: string;
}

async function batchFill(items: Array<{ french: string; translation: string; level: string }>): Promise<(AiResult | null)[]> {
  const userMsg = JSON.stringify(items.map((it, i) => ({
    n: i + 1,
    french: it.french,
    translation_ru: it.translation,
    level: it.level,
  })));
  const resp = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    response_format: { type: 'json_object' },
    temperature: 0.2,
    max_tokens: 2000,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: userMsg },
    ],
  });
  const raw = resp.choices[0]?.message?.content ?? '{}';
  let parsed: { results?: AiResult[] };
  try { parsed = JSON.parse(raw); }
  catch { parsed = {}; }
  const results = Array.isArray(parsed.results) ? parsed.results : [];
  const aligned: (AiResult | null)[] = new Array(items.length).fill(null);
  for (let i = 0; i < Math.min(items.length, results.length); i++) {
    const r = results[i];
    if (r && typeof r.translation_en === 'string' && typeof r.example_fr === 'string') {
      aligned[i] = r;
    }
  }
  return aligned;
}

// Pick rows where AT LEAST one of the target columns is NULL.
const all = await db.select({
  id: words.id,
  french: words.french,
  translation: words.translation,
  translationEn: words.translationEn,
  exampleFr: words.exampleFr,
  exampleRu: words.exampleRu,
  exampleEn: words.exampleEn,
  level: words.level,
}).from(words)
  .where(and(
    eq(words.isActive, true),
    or(isNull(words.translationEn), isNull(words.exampleFr), isNull(words.exampleRu)),
  ));

console.log(`[step6] ${all.length} rows missing en/examples`);
if (all.length === 0) {
  console.log('[step6] nothing to do'); process.exit(0);
}

const BATCH = 10;
let filled = 0;
let skipped = 0;
const startedAt = Date.now();

for (let i = 0; i < all.length; i += BATCH) {
  const slice = all.slice(i, i + BATCH);
  try {
    const results = await batchFill(slice.map((s) => ({
      french: s.french, translation: s.translation, level: s.level,
    })));
    for (let j = 0; j < slice.length; j++) {
      const r = results[j];
      const row = slice[j]!;
      if (!r) { skipped++; continue; }
      // Only set fields that are currently null — don't overwrite.
      const patch: Record<string, string> = {};
      if (!row.translationEn && r.translation_en) patch['translationEn'] = r.translation_en;
      if (!row.exampleFr && r.example_fr) patch['exampleFr'] = r.example_fr;
      if (!row.exampleRu && r.example_ru) patch['exampleRu'] = r.example_ru;
      if (!row.exampleEn && r.example_en) patch['exampleEn'] = r.example_en;
      if (Object.keys(patch).length > 0) {
        await db.update(words).set(patch).where(eq(words.id, row.id));
        filled++;
      } else {
        skipped++;
      }
    }
    if ((i / BATCH) % 5 === 0) {
      const elapsed = ((Date.now() - startedAt) / 1000).toFixed(0);
      console.log(`  ${i + slice.length}/${all.length} (filled=${filled} skipped=${skipped}) ${elapsed}s`);
    }
  } catch (err) {
    console.error(`  batch ${i} failed:`, err instanceof Error ? err.message : err);
    skipped += slice.length;
  }
}

console.log(`\n[step6] done — filled ${filled}, skipped ${skipped} of ${all.length}`);
process.exit(0);
