/**
 * C2 expansion using broader authoritative sources than Beacco hybrid.
 *
 *   1. Beacco raw level=C2  (2290 entries) — without hybrid override
 *      so single-isolated C2 words are not pushed down.
 *   2. CRF freq_c2 > 0       (4261 entries) — broader coverage.
 *
 * Two operations:
 *   - GENERATE new entries for words missing from DB entirely.
 *   - RELEVEL existing entries that are tagged below C2 but are
 *     in the C2 source set. This corrects the "hybrid downgrade"
 *     applied during the earlier Beacco import.
 *
 * Both gated behind --apply.
 */
import 'dotenv/config';
import OpenAI from 'openai';
import { eq, inArray } from 'drizzle-orm';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { db } from '../db/index.js';
import { words } from '../db/schema/index.js';

const apiKey = process.env['OPENAI_API_KEY'];
if (!apiKey) { console.error('OPENAI_API_KEY missing'); process.exit(1); }
const openai = new OpenAI({ apiKey });

const APPLY = process.argv.includes('--apply');
const RELEVEL = process.argv.includes('--relevel');
const OUT_DIR = 'tmp/c2-expansion';
if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });

const BEACCO = 'tmp/flelex/FleLex_TT_Beacco.tsv';
const CRF = 'tmp/flelex/FleLex_CRF.csv';

function normalize(s: string): string {
  return s.toLowerCase().trim()
    .replace(/^(le |la |l'|l'|les |un |une |des )/, '')
    .replace(/^(se |s'|s')/, '')
    .trim();
}

// ─── source sets ────────────────────────────────────────────────────────
function loadBeaccoRawC2(): Set<string> {
  const set = new Set<string>();
  const text = readFileSync(BEACCO, 'utf8');
  const lines = text.split(/\r?\n/);
  const header = lines[0]!.split('\t');
  const iWord = header.indexOf('word');
  const iLevel = header.indexOf('level');
  for (let i = 1; i < lines.length; i++) {
    const parts = lines[i]!.split('\t');
    if (parts.length < header.length) continue;
    const word = (parts[iWord] ?? '').toLowerCase().trim();
    const flLevel = (parts[iLevel] ?? '').toUpperCase().trim();
    if (word && flLevel === 'C2') set.add(word);
  }
  return set;
}

function loadCrfC2(): Set<string> {
  const set = new Set<string>();
  const text = readFileSync(CRF, 'utf8');
  const lines = text.split(/\r?\n/);
  const header = lines[0]!.split('\t');
  const iWord = header.indexOf('word');
  const iC2 = header.indexOf('freq_c2');
  if (iC2 < 0) return set;
  for (let i = 1; i < lines.length; i++) {
    const parts = lines[i]!.split('\t');
    if (parts.length < header.length) continue;
    const word = (parts[iWord] ?? '').toLowerCase().trim();
    const f = parseFloat(parts[iC2] ?? '0');
    if (word && f > 0) set.add(word);
  }
  return set;
}

const beaccoRaw = loadBeaccoRawC2();
const crfC2 = loadCrfC2();
const union = new Set<string>([...beaccoRaw, ...crfC2]);
console.log(`Sources: Beacco raw C2 = ${beaccoRaw.size}, CRF C2 = ${crfC2.size}, union = ${union.size}\n`);

// ─── DB index ───────────────────────────────────────────────────────────
const rows = await db.select({ id: words.id, french: words.french, level: words.level }).from(words);
const byKey = new Map<string, { id: string; french: string; level: string }>();
for (const r of rows) {
  byKey.set(r.french.toLowerCase().trim(), r);
  byKey.set(normalize(r.french), r);
}

// ─── classify each union entry ──────────────────────────────────────────
const missing: string[] = [];
const wrongLevel: Array<{ id: string; french: string; current: string; source: string }> = [];
for (const w of union) {
  const hit = byKey.get(w) ?? byKey.get(normalize(w));
  if (!hit) { missing.push(w); continue; }
  if (hit.level !== 'C2') {
    const inBeacco = beaccoRaw.has(w);
    const inCrf = crfC2.has(w);
    wrongLevel.push({ id: hit.id, french: hit.french, current: hit.level, source: inBeacco && inCrf ? 'Beacco+CRF' : inBeacco ? 'Beacco' : 'CRF' });
  }
}
console.log(`Missing entries to GENERATE: ${missing.length}`);
console.log(`Existing entries to RELEVEL → C2: ${wrongLevel.length}`);

// Show top distribution
const byCurrent: Record<string, number> = {};
for (const w of wrongLevel) byCurrent[w.current] = (byCurrent[w.current] ?? 0) + 1;
console.log('  Distribution by current level:');
for (const [lv, n] of Object.entries(byCurrent).sort()) console.log(`    ${lv}: ${n}`);

// ─── GENERATE missing ──────────────────────────────────────────────────
const SYSTEM_PROMPT = `You are a French CEFR vocabulary curator producing
mastery-level (C2) lexical entries. The user gives you a numbered list of
French words. For each, output a JSON object {"entries":[...]} where each
entry mirrors the input index:
  "n":             integer matching the line
  "french":        the headword (with article for nouns when applicable)
  "translation":   Russian translation (Cyrillic)
  "translation_en": English translation
  "example_fr":    short French sentence using the word
  "example_ru":    Russian translation of the sentence
  "example_en":    English translation
  "part_of_speech": noun/verb/adjective/adverb/pronoun/preposition/
                    conjunction/determiner/interjection/number/expression
  "gender":         "m"/"f" for nouns, null otherwise
  "ipa":            IPA without slashes/stress marks; u=/y/; -tion=/sjɔ̃/;
                    nasals: an/en=ɑ̃, in/im/ain=ɛ̃, on/om=ɔ̃, un=œ̃

Strict:
- Russian fields Cyrillic, French fields Latin.
- Nouns prefer article form ("le pain").
- C2 register expected (literary, technical, formal vocabulary).
- Output ONLY {"entries":[...]}.`;

interface AIEntry {
  n: number; french: string; translation: string; translation_en: string;
  example_fr: string; example_ru: string; example_en: string;
  part_of_speech: string; gender: 'm' | 'f' | null; ipa: string;
}

const POS_OK = new Set(['noun', 'verb', 'adjective', 'adverb', 'pronoun', 'preposition', 'conjunction', 'determiner', 'interjection', 'number', 'expression']);
const CYRILLIC_RE = /[Ѐ-ӿ]/;

function validate(e: AIEntry, original: string): string | null {
  if (!e.french || typeof e.french !== 'string') return 'no french';
  if (!CYRILLIC_RE.test(e.translation ?? '')) return 'translation not russian';
  if (CYRILLIC_RE.test(e.french)) return 'french cyrillic';
  if (!POS_OK.has(e.part_of_speech)) return `pos invalid (${e.part_of_speech})`;
  const stem = original.slice(0, Math.min(4, original.length));
  const stripped = e.french.toLowerCase().replace(/^(le |la |l'|les |un |une |des )/i, '').trim();
  if (!stripped.includes(stem)) return `head mismatch (${e.french} vs ${original})`;
  if (!e.ipa) return 'no ipa';
  return null;
}

async function aiBatch(items: string[]): Promise<AIEntry[]> {
  const userMsg = `Level: C2 (mastery)\n\n` + items.map((w, i) => `${i + 1}: ${w}`).join('\n');
  const resp = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    response_format: { type: 'json_object' },
    temperature: 0.3,
    max_tokens: 4000,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: userMsg },
    ],
  });
  const raw = resp.choices[0]?.message?.content ?? '{}';
  let parsed: { entries?: AIEntry[] };
  try { parsed = JSON.parse(raw); } catch { return []; }
  return Array.isArray(parsed.entries) ? parsed.entries : [];
}

interface InsertCandidate extends AIEntry { sourceWord: string }
const cacheFile = `${OUT_DIR}/missing.json`;
let candidates: InsertCandidate[];
if (existsSync(cacheFile)) {
  candidates = JSON.parse(readFileSync(cacheFile, 'utf8'));
  console.log(`\n[cache] ${candidates.length} candidates`);
} else {
  candidates = [];
  const BATCH = 15;
  const rejects: Record<string, number> = {};
  for (let i = 0; i < missing.length; i += BATCH) {
    const slice = missing.slice(i, i + BATCH);
    try {
      const entries = await aiBatch(slice);
      for (const e of entries) {
        const orig = slice[e.n - 1];
        if (!orig) { rejects['bad_n'] = (rejects['bad_n'] ?? 0) + 1; continue; }
        const r = validate(e, orig);
        if (r) { rejects[r] = (rejects[r] ?? 0) + 1; continue; }
        candidates.push({ ...e, sourceWord: orig });
      }
      process.stdout.write('.');
    } catch (err) {
      console.warn(`\n  batch ${i} error: ${(err as Error).message.slice(0, 80)}`);
    }
  }
  writeFileSync(cacheFile, JSON.stringify(candidates, null, 2));
  console.log(`\n  ${candidates.length}/${missing.length} validated (rejects: ${JSON.stringify(rejects)})`);
}

console.log(`\n[summary]`);
console.log(`  to INSERT (new): ${candidates.length}`);
console.log(`  to RELEVEL → C2: ${wrongLevel.length}`);

if (!APPLY) { console.log(`\n[dry-run] pass --apply to INSERT, optionally --relevel to also move existing entries to C2`); process.exit(0); }

let ins = 0; let insFail = 0;
for (const e of candidates) {
  try {
    await db.insert(words).values({
      french: e.french, translation: e.translation, translationEn: e.translation_en,
      level: 'C2', category: 'beacco-c2', partOfSpeech: e.part_of_speech, gender: e.gender,
      ipa: e.ipa, exampleFr: e.example_fr ?? null, exampleRu: e.example_ru ?? null, exampleEn: e.example_en ?? null,
    });
    ins++;
  } catch (err) {
    insFail++;
    if (insFail <= 5) console.warn(`  ins failed ${e.french}: ${(err as Error).message.slice(0, 100)}`);
  }
}
console.log(`[apply] inserted ${ins}, failed ${insFail}`);

if (RELEVEL) {
  console.log(`\n[relevel] moving ${wrongLevel.length} entries to C2…`);
  let upd = 0;
  for (const w of wrongLevel) {
    try {
      await db.update(words).set({ level: 'C2' }).where(eq(words.id, w.id));
      upd++;
    } catch (err) {
      console.warn(`  relevel failed ${w.french}: ${(err as Error).message.slice(0, 80)}`);
    }
  }
  console.log(`[relevel] updated ${upd}`);
}

process.exit(0);
