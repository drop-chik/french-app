/**
 * Step 5 of the content remediation plan.
 *
 * Regenerate the IPA column for every active word. The previous IPA
 * generation pass was 6/6 wrong on a Wiktionary spot-check — wrong
 * glides (j/ɥ/w), wrong vowels (u vs y), missing nasalisations.
 *
 * This pass uses a stricter prompt that:
 *   - Specifies bare-word output (no articles, no stress marks).
 *   - Calls out the glide and vowel distinctions that the model gets
 *     wrong by default.
 *   - Uses a numbered-line format (eliminates JSON-array length drift
 *     observed in the gender pass).
 *
 * Cost estimate: 3900 words / 20-batch = 195 calls × ~$0.0005 ≈ $0.10.
 * Idempotent — overwrites all IPA, so safe to re-run.
 *
 * After this script finishes, run scripts/verify-ipa-sample.ts to
 * cross-check ~20 random rows against Wiktionary.
 *
 * Run:
 *   $env:DATABASE_URL = (railway variables --service french-app --json | ConvertFrom-Json).DATABASE_URL
 *   $env:OPENAI_API_KEY = (railway variables --service french-app --json | ConvertFrom-Json).OPENAI_API_KEY
 *   pnpm tsx src/scripts/fix-content-step5-ipa-regen.ts
 */
import 'dotenv/config';
import OpenAI from 'openai';
import { eq } from 'drizzle-orm';
import { db } from '../db/index.js';
import { words } from '../db/schema/index.js';

const apiKey = process.env['OPENAI_API_KEY'];
if (!apiKey) {
  console.error('OPENAI_API_KEY missing'); process.exit(1);
}
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
- For multi-word entries (e.g. "rendez-vous médical"), join word IPAs
  with a single space.
- Syllable separation: use "." between syllables when the word has 3+
  syllables (e.g. ka.tʁi.jɛm). Single-syllable words: no dots.
- Output exactly N lines, one per input number, in order. No prose.`;

interface Row { id: string; french: string; level: string }

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
    let ipa = m[2]!.trim();
    // Final defensive scrub — strip any stray slashes or stress marks
    // even if the model ignored the system rules.
    ipa = ipa.replace(/[\/ˈˌ\[\]\\]/g, '').trim();
    if (idx >= 0 && idx < items.length && ipa.length > 0) result[idx] = ipa;
  }
  return result;
}

const all = await db.select({ id: words.id, french: words.french, level: words.level })
  .from(words)
  .where(eq(words.isActive, true));

console.log(`[step5] regenerating IPA for ${all.length} words…`);

const BATCH = 20;
let updated = 0;
let skipped = 0;
let unchanged = 0;
const startedAt = Date.now();

for (let i = 0; i < all.length; i += BATCH) {
  const slice = all.slice(i, i + BATCH);
  try {
    const ipas = await ipaBatch(slice);
    for (let j = 0; j < slice.length; j++) {
      const ipa = ipas[j];
      if (ipa) {
        await db.update(words).set({ ipa }).where(eq(words.id, slice[j]!.id));
        updated++;
      } else {
        skipped++;
      }
    }
    if ((i / BATCH) % 5 === 0) {
      const elapsed = ((Date.now() - startedAt) / 1000).toFixed(0);
      console.log(`  ${i + slice.length}/${all.length} (updated=${updated} skipped=${skipped}) ${elapsed}s`);
    }
  } catch (err) {
    console.error(`  batch ${i} failed:`, err instanceof Error ? err.message : err);
    skipped += slice.length;
  }
}

console.log(`\n[step5] done — updated ${updated}, skipped ${skipped} of ${all.length}`);
console.log(`[step5] elapsed: ${((Date.now() - startedAt) / 1000).toFixed(0)}s`);
process.exit(0);
