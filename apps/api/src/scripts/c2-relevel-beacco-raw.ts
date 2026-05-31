/**
 * Conservative C2 relevel: ONLY entries whose Beacco raw level column
 * is "C2" — single authoritative signal, ignoring CRF (which has many
 * false-positive C2 entries because of textbook artifacts).
 *
 * For each Beacco raw C2 word that exists in our DB but is currently
 * labelled below C2, UPDATE level = C2.
 *
 * --apply gate. --report shows which words and their current levels.
 */
import 'dotenv/config';
import { eq } from 'drizzle-orm';
import { readFileSync } from 'node:fs';
import { db } from '../db/index.js';
import { words } from '../db/schema/index.js';

const APPLY = process.argv.includes('--apply');
const REPORT = process.argv.includes('--report');
const BEACCO = 'tmp/flelex/FleLex_TT_Beacco.tsv';

function normalize(s: string): string {
  return s.toLowerCase().trim()
    .replace(/^(le |la |l'|l'|les |un |une |des )/, '')
    .replace(/^(se |s'|s')/, '')
    .trim();
}

const beaccoRawC2 = new Set<string>();
{
  const text = readFileSync(BEACCO, 'utf8');
  const lines = text.split(/\r?\n/);
  const header = lines[0]!.split('\t');
  const iWord = header.indexOf('word');
  const iLevel = header.indexOf('level');
  for (let i = 1; i < lines.length; i++) {
    const parts = lines[i]!.split('\t');
    if (parts.length < header.length) continue;
    const word = (parts[iWord] ?? '').toLowerCase().trim();
    const fl = (parts[iLevel] ?? '').toUpperCase().trim();
    if (word && fl === 'C2') beaccoRawC2.add(word);
  }
}
console.log(`[beacco raw C2] ${beaccoRawC2.size} words\n`);

const rows = await db.select({ id: words.id, french: words.french, level: words.level }).from(words);
const byKey = new Map<string, { id: string; french: string; level: string }>();
for (const r of rows) {
  byKey.set(r.french.toLowerCase().trim(), r);
  byKey.set(normalize(r.french), r);
}

interface Cand { id: string; french: string; current: string }
const toRelevel: Cand[] = [];
for (const w of beaccoRawC2) {
  const hit = byKey.get(w) ?? byKey.get(normalize(w));
  if (!hit) continue;
  if (hit.level === 'C2') continue;
  toRelevel.push({ id: hit.id, french: hit.french, current: hit.level });
}

const dist: Record<string, number> = {};
for (const t of toRelevel) dist[t.current] = (dist[t.current] ?? 0) + 1;

console.log(`Entries to relevel → C2: ${toRelevel.length}`);
console.log('Distribution by current level:');
for (const [lv, n] of Object.entries(dist).sort()) console.log(`  ${lv}: ${n}`);

if (REPORT) {
  console.log('\nFirst 30 candidates:');
  for (const t of toRelevel.slice(0, 30)) {
    console.log(`  ${t.current} → C2  ${t.french}`);
  }
  process.exit(0);
}

if (!APPLY) {
  console.log(`\n[dry-run] pass --apply to UPDATE ${toRelevel.length} rows`);
  process.exit(0);
}

let upd = 0;
for (const t of toRelevel) {
  try {
    await db.update(words).set({ level: 'C2' }).where(eq(words.id, t.id));
    upd++;
  } catch (err) {
    console.warn(`  failed ${t.french}: ${(err as Error).message.slice(0, 80)}`);
  }
}
console.log(`[apply] updated ${upd}`);
process.exit(0);
