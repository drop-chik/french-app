/**
 * Apply Lexique 383 frequency-based CEFR levels to the vocabulary DB.
 *
 * Strategy:
 *   1. Load tmp/lexique/lemma-to-cefr.json (built by cefr-frequency-build).
 *   2. For each active DB word, derive its lookup form by:
 *      - lowercasing
 *      - stripping leading article (le/la/l'/les/un/une/des)
 *      - stripping "se "/"s'" for reflexive verbs
 *      - taking the first token for multi-word entries (rough heuristic)
 *   3. Look up frequency-derived CEFR.
 *   4. Compare against stored level. If different, log a proposed delta.
 *
 * Conservative apply rules:
 *   - Match → keep
 *   - |delta| == 1 → keep stored (Lexique frequency bands are coarse,
 *     a 1-band difference is curricular noise; many word levels are
 *     debatable across competing references)
 *   - |delta| ≥ 2 → APPLY the Lexique level (the word is clearly
 *     mis-leveled — e.g. a B2 word that's actually one of the top 500
 *     most common French words)
 *   - Word not found in Lexique → keep stored (no signal)
 *
 * Dry-run mode by default. Pass --apply to actually UPDATE the DB.
 */
import 'dotenv/config';
import { readFileSync, writeFileSync } from 'node:fs';
import { eq } from 'drizzle-orm';
import { db } from '../db/index.js';
import { words } from '../db/schema/index.js';

const APPLY = process.argv.includes('--apply');
const MAP_PATH = 'tmp/lexique/lemma-to-cefr.json';

console.log(`[relevel] loading ${MAP_PATH}…`);
const lemmaToCefr: Record<string, string> = JSON.parse(readFileSync(MAP_PATH, 'utf8'));
console.log(`[relevel] ${Object.keys(lemmaToCefr).length} lemmas in map`);

const LEVEL_ORDER = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

function deriveLookupKey(french: string): string[] {
  const candidates: string[] = [];
  let s = french.toLowerCase().trim();
  // Try the raw form first
  candidates.push(s);
  // Strip leading articles
  const articleStripped = s.replace(/^(le |la |l'|les |un |une |des )/, '');
  if (articleStripped !== s) candidates.push(articleStripped);
  // Reflexive verbs
  const reflStripped = articleStripped.replace(/^(se |s')/, '');
  if (reflStripped !== articleStripped) candidates.push(reflStripped);
  // For multi-word phrases, also try the head token (last for noun
  // phrases like "carte d'embarquement" is misleading; first for verb
  // phrases like "faire abstraction de"). Use first token as primary.
  if (reflStripped.includes(' ')) {
    candidates.push(reflStripped.split(/\s+/)[0]!);
  }
  return [...new Set(candidates)];
}

function lookup(french: string): string | null {
  const keys = deriveLookupKey(french);
  for (const k of keys) {
    if (lemmaToCefr[k]) return lemmaToCefr[k];
  }
  return null;
}

const rows = await db.select({
  id: words.id, french: words.french, level: words.level,
  partOfSpeech: words.partOfSpeech,
}).from(words).where(eq(words.isActive, true));

console.log(`[relevel] ${rows.length} active words to check`);

const noLookup: string[] = [];
const match: number[] = [];
const delta1: Array<{ french: string; stored: string; lexique: string }> = [];
const delta2plus: Array<{ id: string; french: string; stored: string; lexique: string; mag: number }> = [];

for (const r of rows) {
  const lex = lookup(r.french);
  if (!lex) { noLookup.push(r.french); continue; }
  if (lex === r.level) { match.push(1); continue; }
  const stIdx = LEVEL_ORDER.indexOf(r.level);
  const lxIdx = LEVEL_ORDER.indexOf(lex);
  const mag = lxIdx - stIdx;
  if (Math.abs(mag) === 1) delta1.push({ french: r.french, stored: r.level, lexique: lex });
  else delta2plus.push({ id: r.id, french: r.french, stored: r.level, lexique: lex, mag });
}

console.log('\n=== CEFR RELEVEL DRY RUN ===');
console.log(`  exact match (no change):    ${match.length}`);
console.log(`  not in Lexique (no signal): ${noLookup.length}`);
console.log(`  delta ±1 (kept stored):     ${delta1.length}`);
console.log(`  delta ≥2 (apply candidates): ${delta2plus.length}`);

// Big-delta distribution
const byMag: Record<string, number> = {};
for (const d of delta2plus) {
  const k = d.mag > 0 ? `+${d.mag}` : `${d.mag}`;
  byMag[k] = (byMag[k] ?? 0) + 1;
}
console.log('\nBig-delta distribution (Lexique vs DB):');
console.table(byMag);

console.log('\nFirst 20 |delta| ≥ 2 candidates (sorted by magnitude desc):');
delta2plus.sort((a, b) => Math.abs(b.mag) - Math.abs(a.mag));
for (const d of delta2plus.slice(0, 20)) {
  const arrow = d.mag > 0 ? '↑' : '↓';
  console.log(`  ${d.stored} → ${d.lexique}  ${arrow}${Math.abs(d.mag)}  ${d.french}`);
}

writeFileSync('tmp/content-audit/round2/cefr-relevel-proposals.json',
  JSON.stringify({ delta1, delta2plus, noLookupCount: noLookup.length }, null, 2));

if (!APPLY) {
  console.log(`\n[dry-run] pass --apply to UPDATE the ${delta2plus.length} delta≥2 rows`);
  process.exit(0);
}

console.log(`\n[apply] updating ${delta2plus.length} rows…`);
let applied = 0;
for (const d of delta2plus) {
  await db.update(words).set({ level: d.lexique as 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2' })
    .where(eq(words.id, d.id));
  applied++;
}
console.log(`[apply] ${applied} rows updated`);
process.exit(0);
