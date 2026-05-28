/**
 * CEFR-level appropriateness cross-check.
 *
 * For each sampled word, asks gpt-4o-mini to judge the appropriate CEFR
 * level (A1-C2) given explicit Référentiel CEFR / Profil français criteria.
 * Compares against the level currently stored in the DB. Flags mismatches
 * with magnitude so we can prioritise corrections (a B2 word stored at A1
 * is a much bigger problem than the reverse).
 *
 * Output: tmp/content-audit/round2/cefr-deltas.json + console summary.
 *
 * Sources baked into the prompt:
 *  - CEFR Référentiel A1-B2 thematic vocabulary lists (Conseil de l'Europe)
 *  - Profil français: thematic blocks per level
 *  - Lexique 383 frequency bands (high freq = early level)
 */
import 'dotenv/config';
import OpenAI from 'openai';
import { readFileSync, writeFileSync } from 'node:fs';

const apiKey = process.env['OPENAI_API_KEY'];
if (!apiKey) { console.error('OPENAI_API_KEY missing'); process.exit(1); }
const openai = new OpenAI({ apiKey });

const SYSTEM_PROMPT = `You are a CEFR-trained French textbook editor. For
each French word the user provides, identify the lowest CEFR level
(A1, A2, B1, B2, C1, or C2) where this word should appear in a learner's
vocabulary curriculum.

Reference criteria:
- A1: ~500 most frequent words. Survival vocabulary (greetings, days,
  numbers, basic family/food/body). Concrete and high-frequency.
- A2: ~1000-1500 frequent words. Everyday topics (work, travel, weather,
  past actions). Still concrete.
- B1: ~2500-3000 words. Abstract topics emerge (opinions, feelings,
  hypotheticals, news vocabulary).
- B2: ~4000-5000 words. Nuanced argumentation, abstract concepts,
  specialised registers (politics, environment, technology).
- C1: ~8000 words. Literary, academic, idiomatic.
- C2: 16000+ words. Native-near, archaic, regional.

Use Lexique 383 frequency as a tiebreaker:
- Top 500 freq → A1
- 501-1500 → A2
- 1501-3000 → B1
- 3001-5000 → B2
- 5001+ → C1+

The user gives numbered lines "N: word". Output exactly N lines, format:
"N: <level>". No prose, no explanation, just the level label.`;

interface Sample {
  id: string; french: string; level: string;
  partOfSpeech: string | null; category: string | null;
}

async function judgeBatch(items: Sample[]): Promise<(string | null)[]> {
  const userMsg = items.map((it, i) => `${i + 1}: ${it.french}`).join('\n');
  const resp = await openai.chat.completions.create({
    model: 'gpt-4o-mini', temperature: 0, max_tokens: 400,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: userMsg },
    ],
  });
  const raw = resp.choices[0]?.message?.content ?? '';
  const result: (string | null)[] = new Array(items.length).fill(null);
  for (const line of raw.split(/\r?\n/)) {
    const m = line.match(/^\s*(\d+)\s*[:.\-]\s*(A1|A2|B1|B2|C1|C2)\b/i);
    if (!m) continue;
    const idx = Number(m[1]) - 1;
    if (idx >= 0 && idx < items.length) result[idx] = m[2]!.toUpperCase();
  }
  return result;
}

const cefr = JSON.parse(readFileSync('tmp/content-audit/round2/cefr-words.json', 'utf8'));
const all: Sample[] = [];
for (const level of Object.keys(cefr)) {
  for (const r of cefr[level]) {
    all.push({
      id: r.id, french: r.french, level: r.level,
      partOfSpeech: r.partOfSpeech, category: r.category,
    });
  }
}

console.log(`[cefr] judging ${all.length} words...`);

const BATCH = 25;
const deltas: Array<{
  id: string; french: string; stored: string; suggested: string;
  magnitude: number; partOfSpeech: string | null;
}> = [];
const LEVEL_ORDER = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

for (let i = 0; i < all.length; i += BATCH) {
  const slice = all.slice(i, i + BATCH);
  try {
    const suggestions = await judgeBatch(slice);
    for (let j = 0; j < slice.length; j++) {
      const sug = suggestions[j];
      const row = slice[j]!;
      if (!sug) continue;
      if (sug !== row.level) {
        const idxStored = LEVEL_ORDER.indexOf(row.level);
        const idxSug = LEVEL_ORDER.indexOf(sug);
        const mag = idxSug - idxStored;
        deltas.push({
          id: row.id, french: row.french, stored: row.level,
          suggested: sug, magnitude: mag, partOfSpeech: row.partOfSpeech,
        });
      }
    }
    if ((i / BATCH) % 2 === 0) console.log(`  ${i + slice.length}/${all.length} (deltas so far: ${deltas.length})`);
  } catch (err) {
    console.error(`  batch ${i} failed:`, err instanceof Error ? err.message : err);
  }
}

// Sort by magnitude descending (biggest mismatches first)
deltas.sort((a, b) => Math.abs(b.magnitude) - Math.abs(a.magnitude));

// Summary
console.log('\n=== CEFR DELTA SUMMARY ===');
const byMag: Record<string, number> = {};
for (const d of deltas) {
  const m = d.magnitude > 0 ? `+${d.magnitude}` : `${d.magnitude}`;
  byMag[m] = (byMag[m] ?? 0) + 1;
}
console.table(byMag);

console.log('\n=== TOP 15 BIGGEST MISMATCHES ===');
for (const d of deltas.slice(0, 15)) {
  const arrow = d.magnitude > 0 ? '↑' : '↓';
  console.log(`  ${d.stored} → ${d.suggested} ${arrow}${Math.abs(d.magnitude)}  ${d.french.padEnd(30)} [${d.partOfSpeech}]`);
}

console.log(`\n[cefr] ${deltas.length}/${all.length} = ${((deltas.length / all.length) * 100).toFixed(1)}% mismatches`);
writeFileSync('tmp/content-audit/round2/cefr-deltas.json', JSON.stringify(deltas, null, 2));
process.exit(0);
