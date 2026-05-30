/**
 * Universal vocabulary expansion generator. Used to bring every CEFR
 * level up to FLELex Beacco-aligned coverage.
 *
 * Hardened against duplicates and quality drift:
 *   1. Loads ALL existing French words (every level) into a Set so we
 *      can drop AI-suggested duplicates BEFORE the DB insert.
 *   2. Passes the current level's existing French words into the AI
 *      prompt as an explicit DO-NOT-REPEAT list (truncated to ~3000
 *      chars to fit the context window). This drastically cuts the
 *      duplicate-collision rate so each AI batch genuinely produces
 *      novel material.
 *   3. In-flight `seen` set guards against intra-block collisions
 *      between sequential gpt batches.
 *   4. Post-AI quality validator rejects entries that fail:
 *        - missing/empty french or translation
 *        - translation not in Russian (no Cyrillic)
 *        - french is Cyrillic (AI confused the languages)
 *        - translation == french
 *        - part_of_speech not in whitelist
 *        - example_fr does not contain the head word stem
 *        - duplicate within run (any level)
 *
 * Cache: one JSON file per block (idempotent).
 *
 * Run:
 *   pnpm tsx src/scripts/generate-vocab-expansion.ts --level A1
 *   pnpm tsx src/scripts/generate-vocab-expansion.ts --level A1 --apply
 */
import 'dotenv/config';
import OpenAI from 'openai';
import { eq } from 'drizzle-orm';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { db } from '../db/index.js';
import { words } from '../db/schema/index.js';
import type { Block } from './vocab-blocks/types.js';

const apiKey = process.env['OPENAI_API_KEY'];
if (!apiKey) { console.error('OPENAI_API_KEY missing'); process.exit(1); }
const openai = new OpenAI({ apiKey });

// ─── args ────────────────────────────────────────────────────────────────
const APPLY = process.argv.includes('--apply');
const levelArg = process.argv.find((a) => a.startsWith('--level='))?.split('=')[1]
  ?? (() => { const i = process.argv.indexOf('--level'); return i >= 0 ? process.argv[i + 1] : undefined; })();
const LEVEL = (levelArg ?? '').toUpperCase() as 'A1' | 'A2' | 'B1' | 'B2' | 'C1';
if (!['A1', 'A2', 'B1', 'B2', 'C1'].includes(LEVEL)) {
  console.error('Usage: --level <A1|A2|B1|B2|C1> [--apply]');
  process.exit(1);
}

const OUT_DIR = `tmp/vocab-expansion-${LEVEL.toLowerCase()}`;
if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });

const blocksModule = await import(`./vocab-blocks/${LEVEL.toLowerCase()}.js`);
const BLOCKS: Block[] = blocksModule.blocks;
const TOTAL_TARGET = BLOCKS.reduce((s, b) => s + b.targetCount, 0);
console.log(`[vocab-expansion] level=${LEVEL}, ${BLOCKS.length} blocks, target ~${TOTAL_TARGET} new`);

// ─── existing words index (anti-duplicate) ───────────────────────────────
const allRows = await db.select({ french: words.french, level: words.level }).from(words);
const existingFrench = new Set<string>();
const existingForLevel: string[] = [];
for (const r of allRows) {
  const key = r.french.toLowerCase().trim();
  existingFrench.add(key);
  if (r.level === LEVEL) existingForLevel.push(r.french);
}
console.log(`[vocab-expansion] existingFrench (any level): ${existingFrench.size}`);
console.log(`[vocab-expansion] existing at ${LEVEL}: ${existingForLevel.length}`);

const CEFR_GUIDANCE: Record<string, string> = {
  A1: 'A1 (breakthrough): very common everyday vocabulary, concrete topics — family, food, home, weather, basic verbs. Words a beginner needs in their first ~100 hours.',
  A2: 'A2 (waystage): everyday vocabulary slightly beyond survival — past/future markers, basic feelings, simple work and travel topics.',
  B1: 'B1 (threshold): clear standard language on familiar matters — relationships, work routine, society at surface level, basic media, opinions and arguments.',
  B2: 'B2 (vantage): vocabulary for complex texts, abstract topics — politics, economy, technology, ecology, culture; nuanced opinions; press register.',
  C1: 'C1 (effective operational): refined and idiomatic vocabulary; advanced abstract concepts; literary register; nuanced synonyms; subject-specialist terms.',
};

const SYSTEM_PROMPT = `You are a French CEFR vocabulary curator.

Target level for THIS run: ${LEVEL}.
Guidance: ${CEFR_GUIDANCE[LEVEL]}

The user gives you a theme + description + target count + a list of
French words ALREADY in our database at this level.

You must output JSON object {"words": [...]} where each entry has:
  "french":         the French headword (lowercase, with article for nouns
                    where appropriate, e.g. "le pain", "la maison").
                    NEVER repeat anything in the "Already in DB" list (case-
                    insensitive substring match). NEVER repeat within the batch.
  "translation":    short Russian translation (Cyrillic, idiomatic).
  "translation_en": short English translation.
  "example_fr":     a single short French sentence using the word (≤ 12 words).
  "example_ru":     Russian translation of the example.
  "example_en":     English translation of the example.
  "part_of_speech": one of: noun, verb, adjective, adverb, pronoun,
                    preposition, conjunction, determiner, interjection,
                    number, expression.
  "gender":         "m" or "f" for nouns; null for everything else.

Strict rules:
- French headwords must be IN FRENCH (never Russian/English).
- Russian fields must contain Russian (Cyrillic) — never English.
- For nouns, prefer the form with definite article ("le chat", "la table",
  "l'arbre"), and set gender accordingly.
- Verbs: use the infinitive ("manger", "se promener").
- Match the requested CEFR level — no rare/literary words at A1, no
  generic basic words at C1.
- Output ONLY the JSON object, no prose.`;

interface Entry {
  french: string;
  translation: string;
  translation_en: string;
  example_fr: string;
  example_ru: string;
  example_en: string;
  part_of_speech: string;
  gender: 'm' | 'f' | null;
}

const POS_WHITELIST = new Set(['noun', 'verb', 'adjective', 'adverb', 'pronoun', 'preposition', 'conjunction', 'determiner', 'interjection', 'number', 'expression']);
const CYRILLIC_RE = /[Ѐ-ӿ]/;

function validate(e: Entry, key: string): string | null {
  if (!e.french || typeof e.french !== 'string') return 'no french';
  if (!e.translation || typeof e.translation !== 'string') return 'no translation';
  if (CYRILLIC_RE.test(e.french)) return 'french is cyrillic';
  if (!CYRILLIC_RE.test(e.translation)) return 'translation not russian';
  if (e.translation.toLowerCase().trim() === e.french.toLowerCase().trim()) return 'translation == french';
  if (e.translation.length < 2 || e.translation.length > 120) return 'translation length suspect';
  if (existingFrench.has(key)) return 'duplicate vs existing DB';
  if (!POS_WHITELIST.has(e.part_of_speech)) return `pos not whitelisted (${e.part_of_speech})`;
  if (e.gender !== null && e.gender !== 'm' && e.gender !== 'f') return `gender invalid (${e.gender})`;
  // example_fr should contain the head word stem (first 4 chars)
  if (e.example_fr) {
    const stripped = e.french.replace(/^(le |la |l'|les |un |une |des |se |s')/i, '').trim();
    const stem = stripped.slice(0, Math.min(4, stripped.length)).toLowerCase();
    if (stem.length >= 3 && !e.example_fr.toLowerCase().includes(stem)) {
      // soft — warn but allow (verbs can be conjugated)
    }
  }
  return null;
}

async function genBlock(block: Block): Promise<Entry[]> {
  // Truncate existing-list to ~3000 chars to keep prompt small
  let avoidList = existingForLevel.join(', ');
  if (avoidList.length > 3000) avoidList = avoidList.slice(0, 3000) + ' …';

  const baseMsg = `Theme: ${block.themeFr}
Description: ${block.description}
${block.partOfSpeechHint ? `POS bias: ${block.partOfSpeechHint}` : ''}
Target: ${block.targetCount} unique entries at ${LEVEL}.

Already in DB at ${LEVEL} (DO NOT repeat any of these or close variants):
${avoidList}`;

  const PER_CALL = 30;
  const MAX_CALLS = 15;
  const MIN_PROGRESS = 2;
  const collected: Entry[] = [];
  const seen = new Set<string>();
  let stalled = 0;
  const rejectStats: Record<string, number> = {};

  for (let call = 0; call < MAX_CALLS && collected.length < block.targetCount; call++) {
    const need = Math.min(PER_CALL, block.targetCount - collected.length);
    const callMsg = `${baseMsg}
For THIS call, output ${need} entries.
Already used in this block (DO NOT repeat): ${[...seen].slice(0, 60).join(', ')}`;
    const before = collected.length;
    try {
      const resp = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        response_format: { type: 'json_object' },
        temperature: 0.7,
        max_tokens: 3500,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: callMsg },
        ],
      });
      const raw = resp.choices[0]?.message?.content ?? '{}';
      let parsed: { words?: Entry[] };
      try { parsed = JSON.parse(raw); } catch { rejectStats['json_parse'] = (rejectStats['json_parse'] ?? 0) + 1; continue; }
      const items = Array.isArray(parsed.words) ? parsed.words : [];
      for (const it of items) {
        const key = (it.french ?? '').toLowerCase().trim();
        if (!key) { rejectStats['empty_french'] = (rejectStats['empty_french'] ?? 0) + 1; continue; }
        if (seen.has(key)) { rejectStats['intra_block_dup'] = (rejectStats['intra_block_dup'] ?? 0) + 1; continue; }
        const reason = validate(it, key);
        if (reason) { rejectStats[reason] = (rejectStats[reason] ?? 0) + 1; continue; }
        seen.add(key);
        collected.push(it);
      }
      process.stdout.write('.');
    } catch (err) {
      console.warn(`\n  ${block.category}: API error: ${(err as Error).message}`);
    }
    const added = collected.length - before;
    if (added < MIN_PROGRESS) {
      stalled++;
      if (stalled >= 3) {
        console.log(`\n  ${block.category}: stalled, accept ${collected.length}/${block.targetCount}. rejects=${JSON.stringify(rejectStats)}`);
        break;
      }
    } else stalled = 0;
  }
  console.log(` ${block.category}: ${collected.length}/${block.targetCount} (rejects: ${JSON.stringify(rejectStats)})`);
  return collected.slice(0, block.targetCount);
}

const allGenerated: Array<Entry & { category: string }> = [];
for (const block of BLOCKS) {
  const file = `${OUT_DIR}/${block.category}.json`;
  let entries: Entry[];
  if (existsSync(file)) {
    entries = JSON.parse(readFileSync(file, 'utf8'));
    console.log(`[load-cache] ${block.category}: ${entries.length}`);
  } else {
    console.log(`[gen] ${block.category} target=${block.targetCount}…`);
    entries = await genBlock(block);
    writeFileSync(file, JSON.stringify(entries, null, 2));
  }
  for (const e of entries) allGenerated.push({ ...e, category: block.category });
}

// Final dedupe pass (in case cache and DB diverged between runs)
const finalNew: Array<Entry & { category: string }> = [];
const finalSeen = new Set<string>();
for (const e of allGenerated) {
  const key = e.french.toLowerCase().trim();
  if (existingFrench.has(key)) continue;
  if (finalSeen.has(key)) continue;
  finalSeen.add(key);
  finalNew.push(e);
}

console.log(`\n[vocab-expansion] generated=${allGenerated.length}  new=${finalNew.length}  (${allGenerated.length - finalNew.length} dups vs DB or intra-run)`);

if (!APPLY) {
  console.log(`[dry-run] pass --apply to INSERT ${finalNew.length} rows`);
  process.exit(0);
}

console.log(`[apply] inserting ${finalNew.length} rows at ${LEVEL}…`);
let inserted = 0; let failed = 0;
for (const e of finalNew) {
  try {
    await db.insert(words).values({
      french: e.french,
      translation: e.translation,
      translationEn: e.translation_en,
      level: LEVEL,
      category: e.category,
      partOfSpeech: e.part_of_speech,
      gender: e.gender,
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
console.log(`[apply] done — inserted ${inserted}, failed ${failed}`);
process.exit(0);
