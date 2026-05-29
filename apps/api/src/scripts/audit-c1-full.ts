import 'dotenv/config';
import { eq, sql, and, or, isNull } from 'drizzle-orm';
import { db } from '../db/index.js';
import {
  words, grammarTopics, grammarExercises, listeningExercises,
  readingTexts, drillSets, drillQuestions, writingPrompts,
} from '../db/schema/index.js';

const levels = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as const;

async function countByLevel(table: any, levelCol: any) {
  const out: Record<string, number> = {};
  for (const lv of levels) {
    const [r] = await db.select({ n: sql<number>`count(*)` }).from(table).where(eq(levelCol, lv));
    out[lv] = Number(r?.n ?? 0);
  }
  return out;
}

function row(label: string, counts: Record<string, number>) {
  const target = counts['B2'] ?? 0;
  const c1 = counts['C1'] ?? 0;
  const gap = c1 < target ? `(gap −${target - c1})` : c1 === 0 ? '(EMPTY)' : '';
  console.log(`  ${label.padEnd(28)}  A1=${String(counts['A1']).padStart(4)}  A2=${String(counts['A2']).padStart(4)}  B1=${String(counts['B1']).padStart(4)}  B2=${String(counts['B2']).padStart(4)}  C1=${String(c1).padStart(4)}  C2=${String(counts['C2']).padStart(4)}  ${gap}`);
}

console.log('=== Per-level content audit (all gated tables) ===\n');

row('words',               await countByLevel(words, words.level));
row('grammar_topics',      await countByLevel(grammarTopics, grammarTopics.level));
row('listening_exercises', await countByLevel(listeningExercises, listeningExercises.level));
row('reading_texts',       await countByLevel(readingTexts, readingTexts.level));
row('drill_sets',          await countByLevel(drillSets, drillSets.level));
row('writing_prompts',     await countByLevel(writingPrompts, writingPrompts.level));

console.log('\n=== Grammar exercises per C1 topic ===');
const c1Topics = await db.select({ id: grammarTopics.id, slug: grammarTopics.slug, category: grammarTopics.category }).from(grammarTopics).where(eq(grammarTopics.level, 'C1'));
for (const t of c1Topics) {
  const [c] = await db.select({ n: sql<number>`count(*)` }).from(grammarExercises).where(eq(grammarExercises.topicId, t.id));
  console.log(`  ${t.slug.padEnd(40)} (${t.category.padEnd(14)}) → ${c?.n ?? 0} ex`);
}

console.log('\n=== Drill questions per C1 set ===');
const c1Drills = await db.select({ id: drillSets.id, slug: drillSets.slug, questionCount: drillSets.questionCount, category: drillSets.category }).from(drillSets).where(eq(drillSets.level, 'C1'));
if (c1Drills.length === 0) console.log('  (no C1 drill sets — needs generation)');
for (const d of c1Drills) {
  const [c] = await db.select({ n: sql<number>`count(*)` }).from(drillQuestions).where(eq(drillQuestions.drillSetId, d.id));
  console.log(`  ${d.slug.padEnd(40)} target=${d.questionCount} actual=${c?.n ?? 0}`);
}

console.log('\n=== Listening audio coverage by level ===');
for (const lv of levels) {
  const [total] = await db.select({ n: sql<number>`count(*)` }).from(listeningExercises).where(eq(listeningExercises.level, lv));
  const [missing] = await db.select({ n: sql<number>`count(*)` }).from(listeningExercises).where(and(eq(listeningExercises.level, lv), or(eq(listeningExercises.audioUrl, ''), isNull(listeningExercises.audioUrl))));
  console.log(`  ${lv}: ${total?.n ?? 0} total, ${missing?.n ?? 0} without audio_url`);
}

console.log('\n=== Reading text wordMap completeness (C1) ===');
const c1Reads = await db.select({ slug: readingTexts.slug, title: readingTexts.title, contentFr: readingTexts.contentFr, wordMap: readingTexts.wordMap }).from(readingTexts).where(eq(readingTexts.level, 'C1'));
const SKIP_RE = /^[\d\s\p{P}]+$/u;
function clean(t: string): string {
  let s = t.toLowerCase();
  s = s.replace(/^["«»'(\[]+|["«»'(\[\.,!?:;)\]]+$/g, '');
  s = s.replace(/^(l|d|qu|m|s|n|j|c|t)['']/, '');
  return s;
}
for (const r of c1Reads) {
  const tokens = new Set<string>();
  for (const t of r.contentFr.split(/\s+/)) {
    if (!t || SKIP_RE.test(t)) continue;
    const c = clean(t);
    if (c && !SKIP_RE.test(c)) tokens.add(c);
  }
  const wm = r.wordMap as Record<string, unknown>;
  let missing = 0;
  for (const t of tokens) if (!wm[t]) missing++;
  console.log(`  ${r.slug.padEnd(36)} tokens=${tokens.size}  wm=${Object.keys(wm).length}  missing=${missing}`);
}

console.log('\n=== Writing prompt types per C1 ===');
const c1Writes = await db.select({ slug: writingPrompts.slug, writingType: writingPrompts.writingType }).from(writingPrompts).where(eq(writingPrompts.level, 'C1'));
if (c1Writes.length === 0) console.log('  (none)');
for (const w of c1Writes) console.log(`  ${w.slug.padEnd(40)} type=${w.writingType}`);

process.exit(0);
