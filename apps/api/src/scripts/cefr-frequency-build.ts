/**
 * Build a deterministic frequency → CEFR mapping from Lexique 383
 * (lexique.org), the canonical French frequency database used by
 * linguists and curriculum designers.
 *
 * Approach:
 *   1. Parse Lexique 383 TSV (35 cols, ~140k entries).
 *   2. Aggregate to lemma level using `freqlemfilms2` (lemma frequency
 *      from French film/TV subtitles per million words) — best proxy
 *      for everyday spoken-language exposure, which is what CEFR
 *      learner curricula target.
 *   3. Rank lemmas by frequency (descending).
 *   4. Map rank to CEFR per standard band convention:
 *        rank ≤ 500       → A1
 *        501 – 1500       → A2
 *        1501 – 3000      → B1
 *        3001 – 5000      → B2
 *        5001 – 8000      → C1
 *        8001+ / unknown  → C2
 *
 * Output: tmp/lexique/lemma-to-cefr.json
 *   { "<lemma>": "A1" | "A2" | ... | "C2" }
 *
 * Runs once locally; the JSON is then loaded by cefr-relevel.ts to
 * propose level changes to the DB.
 */
import { readFileSync, writeFileSync } from 'node:fs';

const LEXIQUE = 'tmp/lexique/Lexique383.tsv';
const OUT = 'tmp/lexique/lemma-to-cefr.json';

console.log(`[cefr-build] reading ${LEXIQUE}…`);
const raw = readFileSync(LEXIQUE, 'utf8');
const lines = raw.split('\n');
const header = lines[0]!.split('\t');
const idxLemme = header.indexOf('lemme');
const idxFreqFilm = header.indexOf('freqlemfilms2');
const idxFreqLivr = header.indexOf('freqlemlivres');
const idxCgram = header.indexOf('cgram');
if (idxLemme < 0 || idxFreqFilm < 0) throw new Error('lexique header mismatch');

// Aggregate to lemma — keep max film/book freq seen for any orthographic
// form of that lemma. Lexique has multiple rows per lemma (inflected
// forms) so we pick the max as the lemma-level signal.
const lemmaFreq = new Map<string, number>();
for (let i = 1; i < lines.length; i++) {
  const parts = lines[i]!.split('\t');
  if (parts.length < header.length) continue;
  const lemma = parts[idxLemme]?.toLowerCase().trim();
  const freqF = parseFloat(parts[idxFreqFilm] ?? '0');
  const freqL = parseFloat(parts[idxFreqLivr] ?? '0');
  if (!lemma) continue;
  // Combine: films matter more for CEFR-style exposure but books
  // contribute to advanced vocab — weight 70/30.
  const combined = 0.7 * freqF + 0.3 * freqL;
  const prev = lemmaFreq.get(lemma) ?? 0;
  if (combined > prev) lemmaFreq.set(lemma, combined);
}

console.log(`[cefr-build] aggregated to ${lemmaFreq.size} unique lemmas`);

// Rank by frequency descending
const ranked = [...lemmaFreq.entries()].sort((a, b) => b[1] - a[1]);

function rankToLevel(rank: number): string {
  if (rank <= 500) return 'A1';
  if (rank <= 1500) return 'A2';
  if (rank <= 3000) return 'B1';
  if (rank <= 5000) return 'B2';
  if (rank <= 8000) return 'C1';
  return 'C2';
}

const lemmaToCefr: Record<string, string> = {};
for (let i = 0; i < ranked.length; i++) {
  const [lemma] = ranked[i]!;
  lemmaToCefr[lemma] = rankToLevel(i + 1);
}

// Show a sanity sample
console.log('\nTop 10 most frequent:');
for (let i = 0; i < 10; i++) {
  const [l, f] = ranked[i]!;
  console.log(`  #${i + 1} ${l.padEnd(15)} freq=${f.toFixed(1)} → ${lemmaToCefr[l]}`);
}
console.log('\nRank 500 (A1/A2 boundary):');
for (let i = 498; i < 503; i++) {
  if (!ranked[i]) continue;
  const [l, f] = ranked[i]!;
  console.log(`  #${i + 1} ${l.padEnd(15)} freq=${f.toFixed(1)} → ${lemmaToCefr[l]}`);
}
console.log('\nRank 3000 (B1/B2 boundary):');
for (let i = 2998; i < 3003; i++) {
  if (!ranked[i]) continue;
  const [l, f] = ranked[i]!;
  console.log(`  #${i + 1} ${l.padEnd(15)} freq=${f.toFixed(1)} → ${lemmaToCefr[l]}`);
}

writeFileSync(OUT, JSON.stringify(lemmaToCefr, null, 0));
console.log(`\n[cefr-build] ${ranked.length} lemmas written to ${OUT}`);
