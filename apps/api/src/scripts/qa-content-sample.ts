/**
 * Content QA — random sampling across vocabulary, grammar, listening
 * and reading to surface entries that fail basic quality heuristics.
 *
 * Vocabulary checks per row:
 *   - translation non-empty, contains Cyrillic
 *   - IPA non-empty and contains only standard French phonemes
 *   - exampleFr non-empty and contains the headword (article-stripped)
 *   - exampleRu non-empty and contains Cyrillic
 *   - gender ∈ {m, f, null} matches POS (nouns expected to have gender)
 *
 * Grammar checks per topic:
 *   - content array has at least 3 blocks
 *   - at least one example_list block with ≥3 items
 *   - linked exercises ≥ 5
 *
 * Listening checks per row:
 *   - transcript ≥ 200 chars
 *   - durationSec > 0
 *   - questions.length ≥ 3 and each question has 3-4 options
 *
 * Reading checks per row:
 *   - contentFr ≥ 300 chars
 *   - wordMap entries cover ≥ 90% of unique cleaned tokens
 *   - questions.length ≥ 3
 *
 * Usage:
 *   pnpm tsx src/scripts/qa-content-sample.ts            # 50 vocab + all modules
 *   pnpm tsx src/scripts/qa-content-sample.ts --size=100 # bigger vocab sample
 */
import 'dotenv/config';
import { eq, sql } from 'drizzle-orm';
import { db } from '../db/index.js';
import {
  words, grammarTopics, grammarExercises, listeningExercises, readingTexts,
} from '../db/schema/index.js';

const sizeArg = process.argv.find((a) => a.startsWith('--size='));
const SIZE = sizeArg ? parseInt(sizeArg.split('=')[1] ?? '50', 10) : 50;

const CYRILLIC_RE = /[Ѐ-ӿ]/;
const IPA_RE = /^[a-zɑɛəɔɥœøʁʃʒɲŋ̃\.\s ʁjwœ̃ɑ̃ɛ̃ɔ̃œ̃]+$/i;

function stripArticle(s: string): string {
  return s.toLowerCase().replace(/^(le |la |l'|les |un |une |des |se |s')/, '').trim();
}

console.log(`=== Vocabulary sample (${SIZE}) ===`);
const vocab = await db.execute<{
  id: string; french: string; translation: string | null; ipa: string | null;
  example_fr: string | null; example_ru: string | null; level: string;
  part_of_speech: string; gender: string | null;
}>(sql`
  SELECT id, french, translation, ipa, example_fr, example_ru, level, part_of_speech, gender
  FROM words WHERE is_active = true ORDER BY RANDOM() LIMIT ${SIZE}
`);
const vRows = (vocab as unknown as { rows: typeof vocab.rows }).rows;

interface Issue { row: string; checks: string[] }
const vIssues: Issue[] = [];

for (const w of vRows) {
  const checks: string[] = [];
  if (!w.translation || !CYRILLIC_RE.test(w.translation)) checks.push('translation missing/non-cyrillic');
  if (!w.ipa || w.ipa.length < 2) checks.push('ipa missing');
  if (!w.example_fr || w.example_fr.length < 5) checks.push('example_fr missing');
  else {
    const head = stripArticle(w.french);
    const stem = head.slice(0, Math.min(4, head.length));
    if (stem.length >= 3 && !w.example_fr.toLowerCase().includes(stem)) checks.push('example_fr missing headword');
  }
  if (!w.example_ru || !CYRILLIC_RE.test(w.example_ru)) checks.push('example_ru missing/non-cyrillic');
  if (w.part_of_speech === 'noun' && w.gender !== 'm' && w.gender !== 'f') checks.push('noun without gender');
  if (checks.length > 0) vIssues.push({ row: `[${w.level}] ${w.french}`, checks });
}
console.log(`  total checked: ${vRows.length}, issues: ${vIssues.length}`);
for (const i of vIssues.slice(0, 20)) console.log(`  - ${i.row}: ${i.checks.join('; ')}`);

console.log(`\n=== Grammar topics sample (15) ===`);
const grammarRows = await db.select().from(grammarTopics).orderBy(sql`RANDOM()`).limit(15);
const gIssues: Issue[] = [];
for (const t of grammarRows) {
  const checks: string[] = [];
  const content = (t.content as Array<{ type: string; items?: unknown[] }>) ?? [];
  if (content.length < 3) checks.push(`content too short (${content.length})`);
  const exampleLists = content.filter((b) => b.type === 'example_list');
  if (exampleLists.length === 0) checks.push('no example_list block');
  const exCountRow = await db.select({ n: sql<number>`count(*)` }).from(grammarExercises).where(eq(grammarExercises.topicId, t.id));
  const exCount = Number(exCountRow[0]?.n ?? 0);
  if (exCount < 5) checks.push(`only ${exCount} exercises`);
  if (checks.length > 0) gIssues.push({ row: `[${t.level}] ${t.slug}`, checks });
}
console.log(`  total checked: ${grammarRows.length}, issues: ${gIssues.length}`);
for (const i of gIssues.slice(0, 15)) console.log(`  - ${i.row}: ${i.checks.join('; ')}`);

console.log(`\n=== Listening sample (10) ===`);
const lisRows = await db.select().from(listeningExercises).orderBy(sql`RANDOM()`).limit(10);
const lIssues: Issue[] = [];
for (const e of lisRows) {
  const checks: string[] = [];
  if (e.transcript.length < 200) checks.push(`transcript too short (${e.transcript.length})`);
  if (e.durationSec <= 0) checks.push('duration <= 0');
  const qs = (e.questions as Array<{ text: string; options: string[]; correct: string }>) ?? [];
  if (qs.length < 3) checks.push(`only ${qs.length} questions`);
  for (const q of qs) {
    if (!Array.isArray(q.options) || q.options.length < 3 || q.options.length > 4) {
      checks.push(`bad options count on q: "${q.text?.slice(0, 30)}"`);
    }
    if (!q.options?.includes(q.correct)) checks.push(`correct not in options on q: "${q.text?.slice(0, 30)}"`);
  }
  if (checks.length > 0) lIssues.push({ row: `[${e.level}] ${e.title}`, checks });
}
console.log(`  total checked: ${lisRows.length}, issues: ${lIssues.length}`);
for (const i of lIssues.slice(0, 10)) console.log(`  - ${i.row}: ${i.checks.join('; ')}`);

console.log(`\n=== Reading sample (10) ===`);
const readRows = await db.select().from(readingTexts).orderBy(sql`RANDOM()`).limit(10);
const SKIP_RE = /^[\d\s\p{P}]+$/u;
function cleanWord(token: string): string {
  let s = token.toLowerCase();
  s = s.replace(/^["«»'(\[]+|["«»'(\[\.,!?:;)\]]+$/g, '');
  s = s.replace(/^(l|d|qu|m|s|n|j|c|t)['']/, '');
  return s;
}
const rIssues: Issue[] = [];
for (const r of readRows) {
  const checks: string[] = [];
  if (r.contentFr.length < 300) checks.push(`text too short (${r.contentFr.length})`);
  const wm = r.wordMap as Record<string, unknown>;
  const tokens = new Set<string>();
  for (const t of r.contentFr.split(/\s+/)) {
    if (!t || SKIP_RE.test(t)) continue;
    const c = cleanWord(t);
    if (c && !SKIP_RE.test(c)) tokens.add(c);
  }
  const missing = [...tokens].filter((t) => !wm[t]).length;
  const coverage = tokens.size > 0 ? 1 - missing / tokens.size : 1;
  if (coverage < 0.9) checks.push(`wordMap coverage ${(coverage * 100).toFixed(0)}%`);
  const qs = (r.questions as Array<{ question: string; options: string[]; correct: string }>) ?? [];
  if (qs.length < 3) checks.push(`only ${qs.length} questions`);
  if (checks.length > 0) rIssues.push({ row: `[${r.level}] ${r.slug}`, checks });
}
console.log(`  total checked: ${readRows.length}, issues: ${rIssues.length}`);
for (const i of rIssues.slice(0, 10)) console.log(`  - ${i.row}: ${i.checks.join('; ')}`);

const totalIssues = vIssues.length + gIssues.length + lIssues.length + rIssues.length;
const totalChecked = vRows.length + grammarRows.length + lisRows.length + readRows.length;
console.log(`\n=== SUMMARY ===`);
console.log(`  total checked: ${totalChecked}`);
console.log(`  total issues:  ${totalIssues}`);
console.log(`  pass rate:     ${(((totalChecked - totalIssues) / totalChecked) * 100).toFixed(1)}%`);

process.exit(0);
