/**
 * Count FLELex Beacco entries per CEFR level — using the same hybrid
 * derivation rule as flelex-build-map.ts (which was applied in the
 * earlier CEFR audit). This gives us the academic Beacco-aligned
 * benchmark for "how many lexical entries should a learner know per
 * level" against which to compare our DB content.
 */
import { existsSync, readFileSync } from 'node:fs';

const BEACCO = 'tmp/flelex/FleLex_TT_Beacco.tsv';
if (!existsSync(BEACCO)) {
  console.error(`Missing ${BEACCO}. Run flelex-build-map first.`);
  process.exit(1);
}

const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as const;

const text = readFileSync(BEACCO, 'utf8');
const lines = text.split(/\r?\n/);
const header = lines[0]!.split('\t');
const idxLevel = header.indexOf('level');
const idxF = LEVELS.map((l) => header.indexOf(`freq_${l}`));

// Two views:
//  - "raw": count by FLELex's published level column
//  - "hybrid": apply our flelex-build-map override (C1/C2 with single
//    non-zero level reassigned to that level) — closer to a learner-
//    facing CEFR distribution.
const rawCount: Record<string, number> = {};
const hybridCount: Record<string, number> = {};
// Cumulative count: how many entries you should know BY this level
// (sum of A1 + ... + this level).
const cumulativeRaw: Record<string, number> = {};
const cumulativeHybrid: Record<string, number> = {};

let totalEntries = 0;

for (let i = 1; i < lines.length; i++) {
  const parts = lines[i]!.split('\t');
  if (parts.length < header.length) continue;
  const flLevel = (parts[idxLevel] ?? '').toUpperCase().trim();
  if (!LEVELS.includes(flLevel as typeof LEVELS[number])) continue;

  totalEntries++;
  rawCount[flLevel] = (rawCount[flLevel] ?? 0) + 1;

  // Hybrid override
  let chosen = flLevel;
  if (flLevel === 'C1' || flLevel === 'C2') {
    const nonZero: string[] = [];
    let earliest: string | null = null;
    for (let k = 0; k < LEVELS.length; k++) {
      const idx = idxF[k];
      if (idx === undefined || idx < 0) continue;
      const f = parseFloat(parts[idx] ?? '0');
      if (f > 0) {
        nonZero.push(LEVELS[k]!);
        if (!earliest) earliest = LEVELS[k]!;
      }
    }
    if (nonZero.length === 1 && earliest) chosen = earliest;
  }
  hybridCount[chosen] = (hybridCount[chosen] ?? 0) + 1;
}

console.log(`FLELex Beacco — ${totalEntries} entries\n`);
console.log('Per-level distribution (entries introduced AT that level):');
console.log('  level    raw    hybrid');
let runningRaw = 0; let runningHybrid = 0;
for (const lv of LEVELS) {
  const r = rawCount[lv] ?? 0;
  const h = hybridCount[lv] ?? 0;
  runningRaw += r; runningHybrid += h;
  cumulativeRaw[lv] = runningRaw;
  cumulativeHybrid[lv] = runningHybrid;
  console.log(`  ${lv}     ${String(r).padStart(5)}   ${String(h).padStart(5)}`);
}

console.log('\nCumulative (how many entries known BY end of that level):');
for (const lv of LEVELS) {
  console.log(`  ${lv}     raw=${String(cumulativeRaw[lv]).padStart(5)}   hybrid=${String(cumulativeHybrid[lv]).padStart(5)}`);
}

console.log('\n--- Interpretation for FrenchUp DB ---');
console.log('Our current per-level (active words):');
console.log('  A1=870  A2=865  B1=1206  B2=983  C1=983');
console.log('Our cumulative:');
const ourCum = { A1: 870, A2: 1735, B1: 2941, B2: 3924, C1: 4907 };
for (const lv of LEVELS) {
  if (ourCum[lv as keyof typeof ourCum] !== undefined) {
    const ours = ourCum[lv as keyof typeof ourCum];
    const ref = cumulativeHybrid[lv] ?? 0;
    const delta = ours - ref;
    console.log(`  ${lv}  ours=${String(ours).padStart(5)}  ref=${String(ref).padStart(5)}  Δ=${delta > 0 ? '+' : ''}${delta}`);
  }
}

process.exit(0);
