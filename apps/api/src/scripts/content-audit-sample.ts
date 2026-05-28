/**
 * Content quality audit — pulls representative samples from prod DB
 * for manual cross-checking against authoritative sources (CNRTL,
 * Larousse, Le Robert, Wiktionary, Bescherelle, CEFR Référentiel).
 *
 * Strategy: stratified random sample per category × level so the
 * audit covers everything proportionally rather than over-indexing
 * on whichever category happens to dominate the DB.
 *
 * Outputs three JSON files in /tmp ready to feed into the auditor
 * (me, via WebFetch lookups):
 *   - vocab-sample.json  (~30 words per level)
 *   - grammar-sample.json (all topics across levels — small set)
 *   - listening-sample.json (5 random with full transcript)
 *
 * Usage:
 *   $env:DATABASE_URL = (railway variables --service french-app --json | ConvertFrom-Json).DATABASE_URL
 *   pnpm tsx src/scripts/content-audit-sample.ts
 */
import 'dotenv/config';
import { writeFileSync, mkdirSync } from 'node:fs';
import { eq, sql, and } from 'drizzle-orm';
import { db } from '../db/index.js';
import {
  words, grammarTopics, grammarExercises,
  listeningExercises, readingTexts,
} from '../db/schema/index.js';

const LEVELS = ['A1', 'A2', 'B1', 'B2'] as const;
const SAMPLE_PER_LEVEL = 30;
const OUT_DIR = 'tmp/content-audit';

mkdirSync(OUT_DIR, { recursive: true });

console.log('=== CONTENT AUDIT SAMPLE EXTRACTION ===\n');

// -------------------- Vocabulary --------------------
console.log('1. Vocabulary samples (30 random / level)...');
const vocabSamples: Record<string, unknown[]> = {};
for (const lvl of LEVELS) {
  const rows = await db.select({
    id: words.id,
    french: words.french,
    translation: words.translation,
    translationEn: words.translationEn,
    partOfSpeech: words.partOfSpeech,
    gender: words.gender,
    category: words.category,
    ipa: words.ipa,
    grammarTag: words.grammarTag,
    exampleFr: words.exampleFr,
    exampleRu: words.exampleRu,
    exampleEn: words.exampleEn,
    level: words.level,
  })
    .from(words)
    .where(and(eq(words.level, lvl), eq(words.isActive, true)))
    .orderBy(sql`RANDOM()`)
    .limit(SAMPLE_PER_LEVEL);
  vocabSamples[lvl] = rows;
  console.log(`  ${lvl}: ${rows.length}`);
}
writeFileSync(`${OUT_DIR}/vocab-sample.json`, JSON.stringify(vocabSamples, null, 2));

// -------------------- Counts of categories per level (for ratio sanity) --------------------
console.log('\n2. Vocabulary distribution per level (sanity check)...');
const dist = await db.select({
  level: words.level,
  partOfSpeech: words.partOfSpeech,
  count: sql<number>`count(*)::int`,
})
  .from(words)
  .where(eq(words.isActive, true))
  .groupBy(words.level, words.partOfSpeech);
const distGrouped: Record<string, Record<string, number>> = {};
for (const r of dist) {
  if (!distGrouped[r.level]) distGrouped[r.level] = {};
  distGrouped[r.level]![r.partOfSpeech ?? '(null)'] = Number(r.count);
}
console.table(distGrouped);

// -------------------- Grammar topics (all + 3 exercises each) --------------------
console.log('\n3. Grammar topics + 3 sample exercises each...');
const topics = await db.select().from(grammarTopics);
const grammarSamples: Array<Record<string, unknown>> = [];
for (const t of topics) {
  const exs = await db.select({
    id: grammarExercises.id,
    type: grammarExercises.type,
    question: grammarExercises.question,
    answer: grammarExercises.answer,
    explanation: grammarExercises.explanation,
  })
    .from(grammarExercises)
    .where(eq(grammarExercises.topicId, t.id))
    .orderBy(sql`RANDOM()`)
    .limit(3);
  grammarSamples.push({
    id: t.id, slug: t.slug, titleFr: t.titleFr, titleRu: t.titleRu,
    level: t.level, category: t.category,
    content: t.content,
    sampleExercises: exs,
  });
}
console.log(`  ${grammarSamples.length} topics × 3 exercises = ${grammarSamples.length * 3} exercises`);
writeFileSync(`${OUT_DIR}/grammar-sample.json`, JSON.stringify(grammarSamples, null, 2));

// -------------------- Listening — 5 random with transcript --------------------
console.log('\n4. Listening — 5 random exercises with full transcript...');
const listeningRows = await db.select({
  id: listeningExercises.id,
  title: listeningExercises.title,
  level: listeningExercises.level,
  transcript: listeningExercises.transcript,
  questions: listeningExercises.questions,
  durationSec: listeningExercises.durationSec,
})
  .from(listeningExercises)
  .orderBy(sql`RANDOM()`)
  .limit(5);
writeFileSync(`${OUT_DIR}/listening-sample.json`, JSON.stringify(listeningRows, null, 2));
console.log(`  ${listeningRows.length} exercises`);

// -------------------- Reading — 3 random texts --------------------
console.log('\n5. Reading — 3 random texts (full content + wordMap snippet)...');
const readingRows = await db.select({
  id: readingTexts.id,
  slug: readingTexts.slug,
  title: readingTexts.title,
  level: readingTexts.level,
  contentFr: readingTexts.contentFr,
  questions: readingTexts.questions,
  wordMap: readingTexts.wordMap,
})
  .from(readingTexts)
  .where(eq(readingTexts.isActive, true))
  .orderBy(sql`RANDOM()`)
  .limit(3);
// Trim wordMap to a 20-entry preview so the file isn't huge
const trimmed = readingRows.map((r) => {
  const wm = (r.wordMap as Record<string, unknown>) ?? {};
  const keys = Object.keys(wm).slice(0, 20);
  const sample: Record<string, unknown> = {};
  for (const k of keys) sample[k] = wm[k];
  return { ...r, wordMap: sample, wordMapKeyCount: Object.keys(wm).length };
});
writeFileSync(`${OUT_DIR}/reading-sample.json`, JSON.stringify(trimmed, null, 2));
console.log(`  ${readingRows.length} texts`);

console.log(`\n✓ Samples written to ${OUT_DIR}/`);
process.exit(0);
