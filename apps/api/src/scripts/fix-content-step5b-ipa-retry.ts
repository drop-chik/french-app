/**
 * Step 5b — retry IPA regeneration on the 180 rows that step 5 skipped
 * due to the varchar(30) limit. The column is now TEXT (migration 0029)
 * so the long multi-word IPAs will fit.
 *
 * Strategy: re-run the same prompt only on rows where the french column is
 * a multi-word entry (>= 2 tokens) — that's where the long IPAs come from.
 * Safe because the prompt is identical to step 5, so re-running on a row
 * that succeeded the first time just rewrites the same value.
 */
import 'dotenv/config';
import OpenAI from 'openai';
import { and, eq, sql } from 'drizzle-orm';
import { db } from '../db/index.js';
import { words } from '../db/schema/index.js';

const apiKey = process.env['OPENAI_API_KEY'];
if (!apiKey) { console.error('OPENAI_API_KEY missing'); process.exit(1); }
const openai = new OpenAI({ apiKey });

const SYSTEM_PROMPT = `You are a French phonetician. The user lists French
words numbered "1: word"... For each line output exactly one line "N: <ipa>".
Strict rules:
- Bare-word IPA only — strip articles (le, la, l', les, un, une, des).
- No slashes, no stress marks ˈ ˌ.
- Standard IPA: a ɑ e ɛ ə i o ɔ u y ø œ ɛ̃ ɑ̃ œ̃ ɔ̃ b d f g k l m n ɲ ŋ p ʁ s ʃ t v z ʒ j ɥ w.
- Glides: "ui"→ɥi (conduire→kɔ̃.dɥiʁ), "ie"→jɛ (quatrième→ka.tʁi.jɛm).
- u in French is /y/ — "tu"=/ty/, NOT /tu/.
- Multi-word entries: join with spaces.
- Use "." between syllables for 3+-syllable words.
- N lines in order, no prose.`;

async function batch(items: { id: string; french: string }[]): Promise<(string | null)[]> {
  const userMsg = items.map((it, i) => `${i + 1}: ${it.french}`).join('\n');
  const resp = await openai.chat.completions.create({
    model: 'gpt-4o-mini', temperature: 0, max_tokens: 800,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: userMsg },
    ],
  });
  const raw = resp.choices[0]?.message?.content ?? '';
  const result: (string | null)[] = new Array(items.length).fill(null);
  for (const line of raw.split(/\r?\n/)) {
    const m = line.match(/^\s*(\d+)\s*[:.\-]\s*(.+?)\s*$/);
    if (!m) continue;
    const idx = Number(m[1]) - 1;
    let ipa = m[2]!.trim().replace(/[\/ˈˌ\[\]\\]/g, '').trim();
    if (idx >= 0 && idx < items.length && ipa.length > 0) result[idx] = ipa;
  }
  return result;
}

// Multi-word entries — these are where the column-size errors clustered.
const targets = await db.select({ id: words.id, french: words.french })
  .from(words)
  .where(and(eq(words.isActive, true), sql`${words.french} ~ '\\s'`));

console.log(`[step5b] retrying IPA for ${targets.length} multi-word rows…`);

const BATCH = 15;
let updated = 0;
let skipped = 0;
for (let i = 0; i < targets.length; i += BATCH) {
  const slice = targets.slice(i, i + BATCH);
  try {
    const ipas = await batch(slice);
    for (let j = 0; j < slice.length; j++) {
      const ipa = ipas[j];
      if (ipa) {
        await db.update(words).set({ ipa }).where(eq(words.id, slice[j]!.id));
        updated++;
      } else skipped++;
    }
    if ((i / BATCH) % 10 === 0) console.log(`  ${i + slice.length}/${targets.length}`);
  } catch (err) {
    console.error(`  batch ${i} failed:`, err instanceof Error ? err.message : err);
    skipped += slice.length;
  }
}

console.log(`\n[step5b] done — updated ${updated}, skipped ${skipped}`);
process.exit(0);
