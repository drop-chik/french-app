/**
 * Conservative CEFR relevel — combines Lexique 383 frequency signal
 * with AI second-opinion, applies only when BOTH sources agree on a
 * downgrade. This filters out false positives from:
 *   - categorical vocab (foods, countries, ordinals are A1 by curriculum
 *     but rare in films → Lexique alone over-rates them)
 *   - multi-word idioms (first-token lookup misses the idiom level)
 *   - contextual polysemy (regard, valoir, accord)
 *
 * Process:
 *   1. Read the cefr-relevel-proposals.json (Lexique-derived).
 *   2. Take ONLY single-word downgrade candidates (mag ≤ -2).
 *   3. Ask gpt-4o-mini "what level is this word in standard French
 *      learner curricula?" — same calibrated prompt as the earlier
 *      cefr-check.
 *   4. APPLY the level change only if AI agrees the stored level is
 *      too high (AI's answer ≤ stored level).
 *
 * This double-check filters AI's +1 bias (only downgrades survive the
 * filter because AI's bias works AGAINST downgrade decisions, so if AI
 * still suggests a downgrade despite its bias, we trust it).
 */
import 'dotenv/config';
import OpenAI from 'openai';
import { readFileSync, writeFileSync } from 'node:fs';
import { eq } from 'drizzle-orm';
import { db } from '../db/index.js';
import { words } from '../db/schema/index.js';

const APPLY = process.argv.includes('--apply');
const apiKey = process.env['OPENAI_API_KEY'];
if (!apiKey) { console.error('OPENAI_API_KEY missing'); process.exit(1); }
const openai = new OpenAI({ apiKey });

const LEVEL_ORDER = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

const SYSTEM_PROMPT = `You are a French DELF/DALF examiner. For each word
the user lists "N: word", reply on its own line "N: <level>" where level
is one of A1, A2, B1, B2, C1, C2.

Reference points (calibration anchors):
  A1: bonjour, manger, eau, chat, hier, beaucoup
  A2: cuisiner, semaine, déjà, vraiment, propre
  B1: éviter, expérience, vraisemblable, néanmoins
  B2: bouleverser, recensement, contournement, manifestement
  C1: prépondérant, atavique, viscéralement
  C2: subreptice, alacrité

Consider standard learner curricula coverage, NOT raw film frequency.
A word like 'galette' is A1 in food vocabulary even though rare in films.
A word like 'autour' (around) is A1 because it's a basic spatial preposition.

Output exactly N lines, no prose.`;

interface Proposal {
  id: string; french: string; stored: string; lexique: string; mag: number;
}

async function aiVote(items: Proposal[]): Promise<(string | null)[]> {
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

const proposals = JSON.parse(readFileSync('tmp/content-audit/round2/cefr-relevel-proposals.json', 'utf8'));
const candidates: Proposal[] = proposals.delta2plus.filter(
  (d: Proposal) => d.mag < 0 && !d.french.includes(' ')
);

console.log(`[apply-conservative] ${candidates.length} single-word downgrade candidates`);

// Get AI vote on all candidates
const BATCH = 25;
const aiVotes: Record<string, string> = {};
for (let i = 0; i < candidates.length; i += BATCH) {
  const slice = candidates.slice(i, i + BATCH);
  const votes = await aiVote(slice);
  for (let j = 0; j < slice.length; j++) {
    if (votes[j]) aiVotes[slice[j]!.id] = votes[j]!;
  }
  console.log(`  ${i + slice.length}/${candidates.length} AI votes collected`);
}

// Apply rule: AI must agree the level should be LOWER (or equal to Lexique)
const toApply: Array<{ id: string; french: string; from: string; to: string; ai: string; lex: string }> = [];
const skipped: Array<{ french: string; stored: string; ai: string; lex: string; reason: string }> = [];

for (const c of candidates) {
  const ai = aiVotes[c.id];
  if (!ai) {
    skipped.push({ french: c.french, stored: c.stored, ai: '?', lex: c.lexique, reason: 'no AI vote' });
    continue;
  }
  const storedIdx = LEVEL_ORDER.indexOf(c.stored);
  const aiIdx = LEVEL_ORDER.indexOf(ai);
  if (aiIdx < storedIdx) {
    // AI agrees stored is too high — apply AI's suggestion (more conservative
    // than Lexique's typically lower suggestion).
    toApply.push({
      id: c.id, french: c.french, from: c.stored, to: ai, ai, lex: c.lexique,
    });
  } else {
    skipped.push({
      french: c.french, stored: c.stored, ai, lex: c.lexique,
      reason: `AI says ${ai} (≥ stored ${c.stored}), keep`,
    });
  }
}

console.log(`\n=== Filter result ===`);
console.log(`  candidates:        ${candidates.length}`);
console.log(`  to apply:          ${toApply.length}  (AI confirms stored is too high)`);
console.log(`  skipped:           ${skipped.length}  (AI disagrees with Lexique)`);

console.log('\n=== To apply (sorted by stored level) ===');
toApply.sort((a, b) => a.from.localeCompare(b.from));
for (const t of toApply) {
  console.log(`  ${t.from} → ${t.to.padEnd(3)} ${t.french.padEnd(20)} (Lexique said ${t.lex})`);
}

writeFileSync('tmp/content-audit/round2/cefr-apply-plan.json',
  JSON.stringify({ toApply, skipped }, null, 2));

if (!APPLY) {
  console.log(`\n[dry-run] pass --apply to UPDATE ${toApply.length} rows`);
  process.exit(0);
}

console.log(`\n[apply] updating ${toApply.length} rows…`);
for (const t of toApply) {
  await db.update(words)
    .set({ level: t.to as 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2' })
    .where(eq(words.id, t.id));
}
console.log(`[apply] done`);
process.exit(0);
