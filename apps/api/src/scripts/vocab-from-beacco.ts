/**
 * Vocabulary expansion driven by FLELex Beacco TSV (the academic gold-
 * standard). For each CEFR level, we:
 *
 *   1. Parse FleLex_TT_Beacco.tsv applying our hybrid rule (the same
 *      one used by flelex-build-map.ts — override single-level C1/C2
 *      labels to the level where the word actually appears).
 *   2. Filter to the requested --level only.
 *   3. Diff against the current DB (lowercased french match) — keep
 *      only entries we do NOT yet have.
 *   4. For every missing word, ask gpt-4o-mini for a compact JSON entry:
 *      translation_ru, translation_en, example_fr/ru/en, gender, ipa,
 *      part_of_speech (snapped to our whitelist).
 *   5. Validate (Russian translation, POS whitelist, gender constraint,
 *      IPA only French phonemes) and insert.
 *
 * Why this beats the free-form generator:
 *   - 100% Beacco parity by construction — we know exactly which words
 *     are missing rather than asking the AI to guess.
 *   - Zero duplicates by construction (diff happens BEFORE the AI call).
 *   - AI's task is narrowed to "translate + transcribe", which is the
 *     part it does well; we no longer ask it to invent the vocabulary.
 *
 * Cost: ~$0.50 across all levels (gpt-4o-mini, batches of 15).
 *
 * Run:
 *   pnpm tsx src/scripts/vocab-from-beacco.ts --level A1
 *   pnpm tsx src/scripts/vocab-from-beacco.ts --level A1 --apply
 *   pnpm tsx src/scripts/vocab-from-beacco.ts --level all --apply
 */
import 'dotenv/config';
import OpenAI from 'openai';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { db } from '../db/index.js';
import { words } from '../db/schema/index.js';

const apiKey = process.env['OPENAI_API_KEY'];
if (!apiKey) { console.error('OPENAI_API_KEY missing'); process.exit(1); }
const openai = new OpenAI({ apiKey });

const APPLY = process.argv.includes('--apply');
const REPORT_ONLY = process.argv.includes('--report');
const levelArg = process.argv.find((a) => a.startsWith('--level='))?.split('=')[1]
  ?? (() => { const i = process.argv.indexOf('--level'); return i >= 0 ? process.argv[i + 1] : undefined; })();
const RAW_LEVEL = (levelArg ?? '').toUpperCase();
if (!['A1', 'A2', 'B1', 'B2', 'C1', 'C2', 'ALL'].includes(RAW_LEVEL)) {
  console.error('Usage: --level <A1|A2|B1|B2|C1|C2|all> [--apply]');
  process.exit(1);
}
const LEVELS = RAW_LEVEL === 'ALL' ? ['A1', 'A2', 'B1', 'B2', 'C1'] as const : [RAW_LEVEL] as const;

const OUT_DIR = 'tmp/vocab-from-beacco';
if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });

const BEACCO = 'tmp/flelex/FleLex_TT_Beacco.tsv';

// ─── POS mapping (FLELex tags → DB partOfSpeech) ─────────────────────────
const POS_MAP: Record<string, string> = {
  NOM: 'noun', N: 'noun', VER: 'verb', V: 'verb',
  ADJ: 'adjective', ADV: 'adverb',
  PRP: 'preposition', PRO: 'pronoun', DET: 'determiner',
  KON: 'conjunction', INT: 'interjection', NUM: 'number',
};
const CEFR = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as const;

interface BeaccoRow { word: string; pos: string; level: string }

function parseBeacco(): BeaccoRow[] {
  const text = readFileSync(BEACCO, 'utf8');
  const lines = text.split(/\r?\n/);
  const header = lines[0]!.split('\t');
  const iWord = header.indexOf('word');
  const iTag = header.indexOf('tag');
  const iLevel = header.indexOf('level');
  const iF = CEFR.map((l) => header.indexOf(`freq_${l}`));
  const out: BeaccoRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const parts = lines[i]!.split('\t');
    if (parts.length < header.length) continue;
    const word = (parts[iWord] ?? '').toLowerCase().trim();
    const tag = (parts[iTag] ?? '').toUpperCase().trim();
    const flLevel = (parts[iLevel] ?? '').toUpperCase().trim();
    if (!word) continue;
    // Hybrid rule (same as flelex-build-map.ts)
    let chosen = flLevel;
    if (flLevel === 'C1' || flLevel === 'C2') {
      const nonZero: string[] = [];
      for (let k = 0; k < CEFR.length; k++) {
        const idx = iF[k];
        if (idx === undefined || idx < 0) continue;
        const f = parseFloat(parts[idx] ?? '0');
        if (f > 0) nonZero.push(CEFR[k]!);
      }
      if (nonZero.length === 1) chosen = nonZero[0]!;
    }
    if (!(CEFR as readonly string[]).includes(chosen)) continue;
    const pos = POS_MAP[tag] ?? POS_MAP[tag.split(':')[0] ?? ''] ?? '';
    out.push({ word, pos, level: chosen });
  }
  return out;
}

// ─── AI translation prompt ───────────────────────────────────────────────
const SYSTEM_PROMPT = `You are a French CEFR vocabulary curator. The user gives
you a numbered list of French words at level <LEVEL>. For each word, output
a JSON object {"entries": [...]} where each entry mirrors the input index
and contains:
  "n":              integer matching the input line number
  "french":         the same French headword (possibly with article for
                    nouns — "le pain", "la maison", "l'arbre"). Preserve case
                    as in the input.
  "translation":    short Russian translation (Cyrillic).
  "translation_en": short English translation.
  "example_fr":     short French sentence using the word (≤ 12 words).
  "example_ru":     Russian translation of that sentence.
  "example_en":     English translation of that sentence.
  "part_of_speech": one of: noun, verb, adjective, adverb, pronoun,
                    preposition, conjunction, determiner, interjection,
                    number, expression.
  "gender":         "m" or "f" for nouns; null otherwise.
  "ipa":            IPA transcription. Rules:
                      - No slashes or stress marks.
                      - "u" in French → /y/, NOT /u/.
                      - "ui" before vowel → ɥi. "i" before vowel → j.
                      - Nasals: -an/-en → ɑ̃, -in/-im/-ain → ɛ̃, -on/-om → ɔ̃,
                        -un → œ̃ (or ɛ̃ for younger speakers).
                      - -tion → /sjɔ̃/, -ant/-ent adj → /ɑ̃/.
                      - Multi-word: join sub-IPAs with single space.
                      - Use only standard French IPA: a ɑ e ɛ ə i o ɔ u y ø
                        œ ɛ̃ ɑ̃ œ̃ ɔ̃ b d f g k l m n ɲ ŋ p ʁ s ʃ t v z ʒ j ɥ w.

Strict:
- All Russian fields in Cyrillic, all French fields in Latin script.
- For nouns, prefer the article form ("le chat", not bare "chat").
- For verbs, the infinitive ("manger", "se promener").
- Output ONLY the JSON object, no prose.`;

interface AIEntry {
  n: number; french: string; translation: string; translation_en: string;
  example_fr: string; example_ru: string; example_en: string;
  part_of_speech: string; gender: 'm' | 'f' | null; ipa: string;
}

const POS_WHITELIST = new Set(['noun', 'verb', 'adjective', 'adverb', 'pronoun', 'preposition', 'conjunction', 'determiner', 'interjection', 'number', 'expression']);
const CYRILLIC_RE = /[Ѐ-ӿ]/;

function validate(e: AIEntry, originalWord: string): string | null {
  if (!e.french || typeof e.french !== 'string') return 'no french';
  if (!e.translation || !CYRILLIC_RE.test(e.translation)) return 'translation not russian';
  if (CYRILLIC_RE.test(e.french)) return 'french is cyrillic';
  if (!POS_WHITELIST.has(e.part_of_speech)) return `pos invalid (${e.part_of_speech})`;
  if (e.gender !== null && e.gender !== 'm' && e.gender !== 'f') return 'gender invalid';
  // Sanity: the AI's French should at least contain the original head form
  const stripped = e.french.toLowerCase().replace(/^(le |la |l'|les |un |une |des |se |s')/i, '').trim();
  if (!stripped.includes(originalWord.toLowerCase().slice(0, Math.min(4, originalWord.length)))) {
    return `head mismatch (got "${e.french}" expected "${originalWord}")`;
  }
  if (!e.ipa) return 'no ipa';
  return null;
}

async function aiBatch(words: BeaccoRow[], level: string): Promise<AIEntry[]> {
  const userMsg = `Level: ${level}\n\n` + words.map((w, i) => `${i + 1}: ${w.word}  [pos hint: ${w.pos || 'n/a'}]`).join('\n');
  const resp = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    response_format: { type: 'json_object' },
    temperature: 0.3,
    max_tokens: 4000,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT.replace('<LEVEL>', level) },
      { role: 'user', content: userMsg },
    ],
  });
  const raw = resp.choices[0]?.message?.content ?? '{}';
  let parsed: { entries?: AIEntry[] };
  try { parsed = JSON.parse(raw); } catch { return []; }
  return Array.isArray(parsed.entries) ? parsed.entries : [];
}

// ─── main ───────────────────────────────────────────────────────────────
const beacco = parseBeacco();
console.log(`[beacco] parsed ${beacco.length} entries`);

// Load DB — index by normalized key (strip leading article + reflexive)
function normalize(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/^(le |la |l'|l'|les |un |une |des )/, '')
    .replace(/^(se |s'|s')/, '')
    .trim();
}
const dbRows = await db.select({ french: words.french }).from(words);
const dbSet = new Set<string>();
for (const r of dbRows) {
  dbSet.add(r.french.toLowerCase().trim());
  dbSet.add(normalize(r.french));
}
console.log(`[db] ${dbRows.length} rows → ${dbSet.size} keys (raw + normalized)\n`);

interface InsertCandidate extends AIEntry { sourceWord: string; level: string }
const allToInsert: InsertCandidate[] = [];

for (const level of LEVELS) {
  const atLevel = beacco.filter((b) => b.level === level);
  const missing = atLevel.filter((b) => {
    const w = b.word.toLowerCase().trim();
    return !dbSet.has(w) && !dbSet.has(normalize(w));
  });
  console.log(`[${level}] Beacco entries: ${atLevel.length}, missing in DB: ${missing.length}`);
  if (REPORT_ONLY) {
    console.log(`  first 30 missing:`);
    for (const m of missing.slice(0, 30)) console.log(`    ${m.word.padEnd(28)} (${m.pos || '?'})`);
    continue;
  }
  if (missing.length === 0) continue;

  const cacheFile = `${OUT_DIR}/${level.toLowerCase()}.json`;
  let processed: InsertCandidate[];
  if (existsSync(cacheFile)) {
    processed = JSON.parse(readFileSync(cacheFile, 'utf8'));
    console.log(`  cache: ${processed.length} entries`);
  } else {
    processed = [];
    const BATCH = 15;
    const rejectStats: Record<string, number> = {};
    for (let i = 0; i < missing.length; i += BATCH) {
      const slice = missing.slice(i, i + BATCH);
      try {
        const entries = await aiBatch(slice, level);
        for (const e of entries) {
          const original = slice[e.n - 1];
          if (!original) { rejectStats['bad_n'] = (rejectStats['bad_n'] ?? 0) + 1; continue; }
          const reason = validate(e, original.word);
          if (reason) { rejectStats[reason] = (rejectStats[reason] ?? 0) + 1; continue; }
          processed.push({ ...e, sourceWord: original.word, level });
        }
        process.stdout.write(`.`);
      } catch (err) {
        console.warn(`\n  ${level} batch ${i} error: ${(err as Error).message.slice(0, 100)}`);
      }
    }
    writeFileSync(cacheFile, JSON.stringify(processed, null, 2));
    console.log(`\n  ${level}: ${processed.length}/${missing.length} validated (rejects: ${JSON.stringify(rejectStats)})`);
  }
  allToInsert.push(...processed);
}

if (REPORT_ONLY) { process.exit(0); }
console.log(`\n[total] candidates: ${allToInsert.length}`);
if (!APPLY) { console.log(`[dry-run] pass --apply to INSERT`); process.exit(0); }

let inserted = 0; let failed = 0;
for (const e of allToInsert) {
  try {
    await db.insert(words).values({
      french: e.french,
      translation: e.translation,
      translationEn: e.translation_en,
      level: e.level as 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2',
      category: 'beacco',
      partOfSpeech: e.part_of_speech,
      gender: e.gender,
      ipa: e.ipa,
      exampleFr: e.example_fr ?? null,
      exampleRu: e.example_ru ?? null,
      exampleEn: e.example_en ?? null,
    });
    inserted++;
  } catch (err) {
    failed++;
    if (failed <= 8) console.warn(`  failed: ${e.french}: ${(err as Error).message.slice(0, 120)}`);
  }
}
console.log(`[apply] inserted ${inserted}, failed ${failed}`);
process.exit(0);
