/**
 * Targeted IPA generation — runs only on words that don't have IPA yet.
 * Used after inserting new vocabulary (e.g. C1/C2 expansions) so we
 * don't rerun the full 3900-word regen pass when only ~1300 new rows
 * need IPA.
 *
 * Same prompt as fix-content-step5-ipa-regen.ts (the calibrated one
 * that achieved 5/5 Wiktionary accuracy on the original audit).
 */
import 'dotenv/config';
import OpenAI from 'openai';
import { eq, and, isNull } from 'drizzle-orm';
import { db } from '../db/index.js';
import { words } from '../db/schema/index.js';

const apiKey = process.env['OPENAI_API_KEY'];
if (!apiKey) { console.error('OPENAI_API_KEY missing'); process.exit(1); }
const openai = new OpenAI({ apiKey });

const SYSTEM_PROMPT = `You are a French phonetician. The user lists French
words numbered "1: word", "2: word"... For each line, output exactly one
line "N: <ipa>" giving the IPA transcription.

Strict rules:
- Output IPA of the BARE WORD only. If the input includes an article
  (le, la, l', les, un, une, des), do NOT include the article in the IPA.
  Example: "le chat" → "1: ʃa" (NOT "lə ʃa").
- No surrounding slashes or brackets. No stress marks (ˈ, ˌ). French does
  not use lexical stress.
- Use only standard IPA characters: a ɑ e ɛ ə i o ɔ u y ø œ ɛ̃ ɑ̃ œ̃ ɔ̃
  b d f g k l m n ɲ ŋ p ʁ s ʃ t v z ʒ j ɥ w.
- Glide accuracy is critical:
  - "ui" before vowel → ɥi (e.g. "conduire" → kɔ̃.dɥiʁ, "huit" → ɥit)
  - "i" before vowel often → j (e.g. "quatrième" → ka.tʁi.jɛm)
  - "ou" before vowel → w (e.g. "ouest" → wɛst)
- Vowel accuracy: u in French is /y/ (closed front rounded), NOT /u/.
  "tu" is /ty/, "rue" is /ʁy/. /u/ is "ou" as in "tour" /tuʁ/.
- Nasal vowels: bien is /bjɛ̃/, bon is /bɔ̃/, banc is /bɑ̃/, brun is /bʁœ̃/
  (younger speakers merge brun and brin to /bʁɛ̃/, accept either).
- Consonant clusters: never drop letters. "toxicologie" → tɔk.si.kɔ.lɔ.ʒi.
  "exact" → ɛɡ.zakt. "exception" → ɛk.sɛp.sjɔ̃.
- Suffix -ant/-ent at end of adjectives = nasal /ɑ̃/: "dissonant" → di.sɔ.nɑ̃.
- Suffix -tion = /sjɔ̃/: "réflexion" → ʁe.flɛk.sjɔ̃.
- For multi-word entries, join word IPAs with a single space.
- Syllable separation with "." for 3+ syllable words.
- Output exactly N lines in order. No prose.`;

interface Row { id: string; french: string }

async function ipaBatch(items: Row[]): Promise<(string | null)[]> {
  const userMsg = items.map((it, i) => `${i + 1}: ${it.french}`).join('\n');
  const resp = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    temperature: 0,
    max_tokens: 800,
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

const targets = await db.select({ id: words.id, french: words.french })
  .from(words)
  .where(and(eq(words.isActive, true), isNull(words.ipa)));

console.log(`[ipa-missing] ${targets.length} rows with NULL ipa`);
if (targets.length === 0) { console.log('nothing to do'); process.exit(0); }

const BATCH = 20;
let updated = 0;
let skipped = 0;
const startedAt = Date.now();

for (let i = 0; i < targets.length; i += BATCH) {
  const slice = targets.slice(i, i + BATCH);
  try {
    const ipas = await ipaBatch(slice);
    for (let j = 0; j < slice.length; j++) {
      const ipa = ipas[j];
      if (ipa) {
        await db.update(words).set({ ipa }).where(eq(words.id, slice[j]!.id));
        updated++;
      } else { skipped++; }
    }
    if ((i / BATCH) % 5 === 0) {
      const elapsed = ((Date.now() - startedAt) / 1000).toFixed(0);
      console.log(`  ${i + slice.length}/${targets.length} (upd=${updated} skip=${skipped}) ${elapsed}s`);
    }
  } catch (err) {
    console.error(`  batch ${i} failed:`, err instanceof Error ? err.message : err);
    skipped += slice.length;
  }
}

console.log(`\n[ipa-missing] done — updated ${updated}, skipped ${skipped}`);
process.exit(0);
