/**
 * Audit C2 lexicon size across multiple sources to size the real C2 gap.
 *
 * Sources:
 *   1. FLELex Beacco — `level` column raw (no hybrid override)
 *   2. FLELex Beacco — hybrid (current vocab-from-beacco rule)
 *   3. FLELex CRF — entries with non-zero freq_c2
 *
 * Diff each against the DB to see how much "real" C2 vocab is still
 * missing.
 */
import 'dotenv/config';
import { readFileSync } from 'node:fs';
import { db } from '../db/index.js';
import { words } from '../db/schema/index.js';

const CEFR = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as const;
const BEACCO = 'tmp/flelex/FleLex_TT_Beacco.tsv';
const CRF = 'tmp/flelex/FleLex_CRF.csv';

function normalize(s: string): string {
  return s.toLowerCase().trim()
    .replace(/^(le |la |l'|l'|les |un |une |des )/, '')
    .replace(/^(se |s'|s')/, '')
    .trim();
}

// Load DB
const rows = await db.select({ french: words.french, level: words.level }).from(words);
const dbAny = new Set<string>();
const dbAtC2 = new Set<string>();
for (const r of rows) {
  const k = r.french.toLowerCase().trim();
  dbAny.add(k);
  dbAny.add(normalize(k));
  if (r.level === 'C2') {
    dbAtC2.add(k);
    dbAtC2.add(normalize(k));
  }
}
console.log(`[db] ${rows.length} rows, ${dbAtC2.size / 2} are C2-labelled`);

// Beacco raw C2
const beaccoRawC2: string[] = [];
const beaccoHybridC2: string[] = [];
{
  const text = readFileSync(BEACCO, 'utf8');
  const lines = text.split(/\r?\n/);
  const header = lines[0]!.split('\t');
  const iWord = header.indexOf('word');
  const iLevel = header.indexOf('level');
  const iF = CEFR.map((l) => header.indexOf(`freq_${l}`));
  for (let i = 1; i < lines.length; i++) {
    const parts = lines[i]!.split('\t');
    if (parts.length < header.length) continue;
    const word = (parts[iWord] ?? '').toLowerCase().trim();
    const flLevel = (parts[iLevel] ?? '').toUpperCase().trim();
    if (!word) continue;
    if (flLevel === 'C2') {
      beaccoRawC2.push(word);
      // hybrid override
      let chosen = 'C2';
      const nonZero: string[] = [];
      for (let k = 0; k < CEFR.length; k++) {
        const idx = iF[k];
        if (idx === undefined || idx < 0) continue;
        const f = parseFloat(parts[idx] ?? '0');
        if (f > 0) nonZero.push(CEFR[k]!);
      }
      if (nonZero.length === 1) chosen = nonZero[0]!;
      if (chosen === 'C2') beaccoHybridC2.push(word);
    }
  }
}

// CRF C2 (entries with non-zero freq_c2)
const crfC2: string[] = [];
{
  const text = readFileSync(CRF, 'utf8');
  const lines = text.split(/\r?\n/);
  const header = lines[0]!.split('\t');
  const iWord = header.indexOf('word');
  const iC2 = header.indexOf('freq_c2');
  if (iC2 < 0) console.warn('CRF has no freq_c2 column');
  for (let i = 1; i < lines.length; i++) {
    const parts = lines[i]!.split('\t');
    if (parts.length < header.length) continue;
    const word = (parts[iWord] ?? '').toLowerCase().trim();
    const f = parseFloat(parts[iC2] ?? '0');
    if (word && f > 0) crfC2.push(word);
  }
}

function diff(src: string[]): { total: number; matched: number; missing: number; sample: string[] } {
  const missing: string[] = [];
  let matched = 0;
  const seen = new Set<string>();
  for (const w of src) {
    if (seen.has(w)) continue;
    seen.add(w);
    if (dbAny.has(w) || dbAny.has(normalize(w))) matched++;
    else missing.push(w);
  }
  return { total: seen.size, matched, missing: missing.length, sample: missing.slice(0, 20) };
}

console.log('\n=== C2 coverage by source ===');
const sources = [
  { name: 'Beacco raw level=C2',     data: beaccoRawC2 },
  { name: 'Beacco hybrid C2',        data: beaccoHybridC2 },
  { name: 'CRF freq_c2 > 0',         data: crfC2 },
];
for (const s of sources) {
  const d = diff(s.data);
  console.log(`\n  ${s.name}: ${d.total} unique`);
  console.log(`    matched in DB (any level): ${d.matched}`);
  console.log(`    missing in DB:             ${d.missing}`);
  console.log(`    sample missing: ${d.sample.join(', ')}`);
}

// Union — total C2 lexicon across all sources
const union = new Set<string>([...beaccoRawC2, ...crfC2]);
console.log(`\n=== Union (Beacco raw ∪ CRF) ===`);
const d = diff([...union]);
console.log(`  total unique:              ${d.total}`);
console.log(`  matched in DB (any level): ${d.matched}`);
console.log(`  missing in DB:             ${d.missing}`);

process.exit(0);
