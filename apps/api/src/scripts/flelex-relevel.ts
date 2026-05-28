/**
 * Apply CEFR levels from FLELex (Beacco/Conseil de l'Europe Référentiels)
 * to the vocabulary DB.
 *
 * FLELex is the authoritative academic source — the Beacco TSV is aligned
 * with the Conseil de l'Europe Référentiels (Beacco et al., Didier
 * 2004-2011 publications), which define the official CEFR vocabulary for
 * French as a foreign language.
 *
 * Strategy:
 *   1. Look up each DB word in FLELex via word|pos exact match.
 *   2. Fall back to word-only match if POS doesn't align (FLELex uses
 *      TreeTagger tags which sometimes split nouns/adjectives differently
 *      from our DB).
 *   3. Strip articles + reflexives + first-token for multi-word entries.
 *   4. Compare with stored level.
 *
 * Apply rules:
 *   - Exact match → keep.
 *   - Δ = ±1 (curricular noise band) → keep.
 *   - |Δ| ≥ 2 AND FLELex match was via word|pos → APPLY (high confidence).
 *   - |Δ| ≥ 2 AND only word-only match → APPLY only if FLELex says LOWER
 *     than stored (downgrade direction, safer side).
 *   - Not in FLELex → keep.
 *
 * Pass --apply to UPDATE the DB. Default is dry-run with report.
 */
import 'dotenv/config';
import { readFileSync, writeFileSync } from 'node:fs';
import { eq } from 'drizzle-orm';
import { db } from '../db/index.js';
import { words } from '../db/schema/index.js';

const APPLY = process.argv.includes('--apply');
const MAP_PATH = 'tmp/flelex/flelex-map.json';

interface FlelexMap { wordPos: Record<string, string>; word: Record<string, string> }
const flelex: FlelexMap = JSON.parse(readFileSync(MAP_PATH, 'utf8'));
console.log(`[relevel] FLELex: ${Object.keys(flelex.wordPos).length} word|pos + ${Object.keys(flelex.word).length} word entries`);

const LEVEL_ORDER = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

function lookupKeys(french: string): string[] {
  // Multi-word entries are looked up as a single canonical key only —
  // never reduce to the first token, because the first token's CEFR
  // level is almost never the same as the multi-word expression's
  // ('prendre' is A1 but 'prendre le taureau par les cornes' is B2).
  const out: string[] = [];
  const s = french.toLowerCase().trim();
  out.push(s);
  const noArt = s.replace(/^(le |la |l'|les |un |une |des )/, '');
  if (noArt !== s) out.push(noArt);
  const noRefl = noArt.replace(/^(se |s')/, '');
  if (noRefl !== noArt) out.push(noRefl);
  // No first-token fallback — see comment above.
  return [...new Set(out)];
}

function lookup(french: string, pos: string | null): { level: string; matchType: 'word|pos' | 'word' } | null {
  for (const k of lookupKeys(french)) {
    if (pos) {
      const key = `${k}|${pos}`;
      if (flelex.wordPos[key]) return { level: flelex.wordPos[key]!, matchType: 'word|pos' };
    }
    if (flelex.word[k]) return { level: flelex.word[k]!, matchType: 'word' };
  }
  return null;
}

const rows = await db.select({
  id: words.id, french: words.french, level: words.level,
  partOfSpeech: words.partOfSpeech, category: words.category,
}).from(words).where(eq(words.isActive, true));

console.log(`[relevel] ${rows.length} active DB words to evaluate`);

interface Delta {
  id: string; french: string; stored: string; flelex: string;
  mag: number; matchType: 'word|pos' | 'word'; partOfSpeech: string | null;
}
const noMatch: string[] = [];
let exactMatch = 0;
let pm1 = 0;
const deltaStrong: Delta[] = [];  // |mag| ≥ 2 with word|pos match
const deltaWeak: Delta[] = [];    // |mag| ≥ 2 with word-only match

for (const r of rows) {
  const m = lookup(r.french, r.partOfSpeech);
  if (!m) { noMatch.push(r.french); continue; }
  if (m.level === r.level) { exactMatch++; continue; }
  const stIdx = LEVEL_ORDER.indexOf(r.level);
  const fxIdx = LEVEL_ORDER.indexOf(m.level);
  const mag = fxIdx - stIdx;
  if (Math.abs(mag) <= 1) { pm1++; continue; }
  const d: Delta = {
    id: r.id, french: r.french, stored: r.level, flelex: m.level,
    mag, matchType: m.matchType, partOfSpeech: r.partOfSpeech,
  };
  if (m.matchType === 'word|pos') deltaStrong.push(d);
  else deltaWeak.push(d);
}

console.log('\n=== FLELex relevel summary ===');
console.log(`  exact match:       ${exactMatch}`);
console.log(`  ±1 (kept):         ${pm1}`);
console.log(`  not in FLELex:     ${noMatch.length}`);
console.log(`  strong delta ≥2 (word|pos match): ${deltaStrong.length}`);
console.log(`  weak delta ≥2 (word-only match):  ${deltaWeak.length}`);

// Conservative filter: skip ALL upgrades (categorical noise + AI bias),
// keep only downgrades, and ONLY when:
//   - single-word entry (multi-word already filtered upstream)
//   - magnitude exactly 2 (skip aggressive -3 cases like 'automatiser' →
//     A1 where FLELex's "B2-catch-all-for-rare-words" gave a misleading
//     signal)
//   - word|pos exact match (skip the word-only fallback)
const safe = deltaStrong.filter((d) =>
  d.mag === -2 && !d.french.includes(' ')
);
console.log(`    safe subset (single-word, |mag|=2, downgrade): ${safe.length}`);

const toApply = safe;
console.log(`\n  TOTAL to apply:    ${toApply.length}`);

// Distribution
const byMag: Record<string, number> = {};
for (const d of toApply) {
  const k = d.mag > 0 ? `+${d.mag}` : `${d.mag}`;
  byMag[k] = (byMag[k] ?? 0) + 1;
}
console.log('\nApply distribution:');
console.table(byMag);

console.log('\nFirst 20 strong-match corrections (|mag| ≥ 2, word|pos match):');
deltaStrong.sort((a, b) => Math.abs(b.mag) - Math.abs(a.mag));
for (const d of deltaStrong.slice(0, 20)) {
  const arrow = d.mag > 0 ? '↑' : '↓';
  console.log(`  ${d.stored} → ${d.flelex} ${arrow}${Math.abs(d.mag)}  ${d.french.padEnd(30)} [${d.partOfSpeech}]`);
}

writeFileSync('tmp/content-audit/round2/flelex-apply-plan.json',
  JSON.stringify({ deltaStrong, deltaWeak, toApply, noMatchCount: noMatch.length }, null, 2));

if (!APPLY) {
  console.log(`\n[dry-run] pass --apply to UPDATE ${toApply.length} rows`);
  process.exit(0);
}

console.log(`\n[apply] updating ${toApply.length} rows…`);
for (const d of toApply) {
  await db.update(words)
    .set({ level: d.flelex as 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2' })
    .where(eq(words.id, d.id));
}
console.log(`[apply] done`);
process.exit(0);
