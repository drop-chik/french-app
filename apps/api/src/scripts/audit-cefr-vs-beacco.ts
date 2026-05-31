/**
 * Audit every DB word's stored CEFR level against the FLELex Beacco
 * authoritative reference (hybrid rule applied).
 *
 * For every DB word we look up its French headword in the Beacco map
 * (matching by raw lowercase AND by article-stripped form). If Beacco
 * disagrees with the stored level, we report the delta.
 *
 * Conservative apply (--apply):
 *   - delta = 0           → no-op
 *   - delta = 1           → curricular noise, keep stored
 *   - delta ≥ 2           → APPLY Beacco level (clear mis-leveling)
 *   - not in Beacco       → no signal, keep stored
 *
 * The ±1 carve-out matches our previous CEFR audits (cefr-relevel.ts,
 * flelex-relevel.ts) — pedagogical references disagree at the band
 * boundary often enough that we don't want to thrash on noise.
 */
import 'dotenv/config';
import { eq } from 'drizzle-orm';
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { db } from '../db/index.js';
import { words } from '../db/schema/index.js';

const APPLY = process.argv.includes('--apply');
const OUT = 'tmp/cefr-audit-beacco';
if (!existsSync(OUT)) mkdirSync(OUT, { recursive: true });

const BEACCO = 'tmp/flelex/FleLex_TT_Beacco.tsv';
const CEFR = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as const;
type Level = typeof CEFR[number];

function parseBeacco(): Map<string, Level> {
  const text = readFileSync(BEACCO, 'utf8');
  const lines = text.split(/\r?\n/);
  const header = lines[0]!.split('\t');
  const iWord = header.indexOf('word');
  const iLevel = header.indexOf('level');
  const iF = CEFR.map((l) => header.indexOf(`freq_${l}`));

  const map = new Map<string, Level>();
  for (let i = 1; i < lines.length; i++) {
    const parts = lines[i]!.split('\t');
    if (parts.length < header.length) continue;
    const word = (parts[iWord] ?? '').toLowerCase().trim();
    const flLevel = (parts[iLevel] ?? '').toUpperCase().trim() as Level;
    if (!word || !(CEFR as readonly string[]).includes(flLevel)) continue;
    let chosen: Level = flLevel;
    if (flLevel === 'C1' || flLevel === 'C2') {
      const nonZero: Level[] = [];
      for (let k = 0; k < CEFR.length; k++) {
        const idx = iF[k];
        if (idx === undefined || idx < 0) continue;
        const f = parseFloat(parts[idx] ?? '0');
        if (f > 0) nonZero.push(CEFR[k]!);
      }
      if (nonZero.length === 1) chosen = nonZero[0]!;
    }
    // Take the EARLIEST level we've seen for the same lemma — duplicates
    // exist with different POS tags; the lowest level is the safe answer.
    const prev = map.get(word);
    if (!prev || CEFR.indexOf(chosen) < CEFR.indexOf(prev)) {
      map.set(word, chosen);
    }
  }
  return map;
}

function normalize(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/^(le |la |l'|l'|les |un |une |des )/, '')
    .replace(/^(se |s'|s')/, '')
    .trim();
}

const beacco = parseBeacco();
console.log(`[beacco] ${beacco.size} unique lemmas`);

const rows = await db.select({ id: words.id, french: words.french, level: words.level }).from(words);
console.log(`[db] ${rows.length} active rows\n`);

interface Mismatch { id: string; french: string; stored: Level; beacco: Level; delta: number }
const stats = { match: 0, noBeacco: 0, delta1: 0, delta2plus: 0 };
const mismatches: Mismatch[] = [];

for (const r of rows) {
  const raw = r.french.toLowerCase().trim();
  const norm = normalize(raw);
  const beaccoLevel = beacco.get(raw) ?? beacco.get(norm);
  if (!beaccoLevel) { stats.noBeacco++; continue; }
  if (beaccoLevel === r.level) { stats.match++; continue; }
  const delta = CEFR.indexOf(beaccoLevel) - CEFR.indexOf(r.level as Level);
  if (Math.abs(delta) === 1) { stats.delta1++; continue; }
  stats.delta2plus++;
  mismatches.push({ id: r.id, french: r.french, stored: r.level as Level, beacco: beaccoLevel, delta });
}

console.log('Summary:');
console.log(`  exact match (Beacco = DB):       ${stats.match}`);
console.log(`  not in Beacco (no signal):       ${stats.noBeacco}`);
console.log(`  delta ±1 (kept stored):          ${stats.delta1}`);
console.log(`  delta ≥2 (APPLY candidates):     ${stats.delta2plus}\n`);

if (mismatches.length === 0) {
  console.log('Nothing to do.');
  process.exit(0);
}

// Breakdown by direction + magnitude
const byKey: Record<string, number> = {};
for (const m of mismatches) {
  const arrow = m.delta > 0 ? '↑' : '↓';
  const key = `${m.stored}→${m.beacco} (${arrow}${Math.abs(m.delta)})`;
  byKey[key] = (byKey[key] ?? 0) + 1;
}
console.log('Distribution (stored → Beacco):');
for (const [k, v] of Object.entries(byKey).sort((a, b) => b[1] - a[1])) {
  console.log(`  ${k.padEnd(20)} ${v}`);
}

console.log('\nFirst 30 |delta| ≥ 2 samples (sorted by magnitude desc):');
mismatches.sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));
for (const m of mismatches.slice(0, 30)) {
  const arrow = m.delta > 0 ? '↑' : '↓';
  console.log(`  ${m.stored} → ${m.beacco}  ${arrow}${Math.abs(m.delta)}  ${m.french}`);
}

writeFileSync(`${OUT}/proposals.json`, JSON.stringify({ stats, mismatches, byKey }, null, 2));
console.log(`\nSaved to ${OUT}/proposals.json`);

if (!APPLY) {
  console.log(`\n[dry-run] pass --apply to UPDATE ${mismatches.length} rows`);
  process.exit(0);
}

console.log(`\n[apply] updating ${mismatches.length} rows…`);
let updated = 0;
for (const m of mismatches) {
  try {
    await db.update(words).set({ level: m.beacco }).where(eq(words.id, m.id));
    updated++;
  } catch (err) {
    console.warn(`  failed ${m.french}: ${(err as Error).message.slice(0, 120)}`);
  }
}
console.log(`[apply] updated ${updated}`);
process.exit(0);
