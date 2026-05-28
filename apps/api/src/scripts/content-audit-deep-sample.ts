/**
 * Pulls deeper samples for the round-2 content quality audit:
 *
 *   1) 30 random grammar exercises stratified by level (so we don't
 *      over-index on whichever level has more exercises).
 *   2) 10 random reading texts out of 32 — close to 1/3 coverage.
 *   3) 200 random active words across all levels for the CEFR-level
 *      appropriateness cross-check.
 *
 * Outputs are JSON in apps/api/tmp/content-audit/round2/.
 */
import 'dotenv/config';
import { writeFileSync, mkdirSync } from 'node:fs';
import { eq, sql, and } from 'drizzle-orm';
import { db } from '../db/index.js';
import { words, grammarExercises, grammarTopics, readingTexts } from '../db/schema/index.js';

const OUT = 'tmp/content-audit/round2';
mkdirSync(OUT, { recursive: true });

console.log('=== ROUND 2 SAMPLES ===\n');

// 1) Grammar exercises — stratified random by level
console.log('1) Grammar exercises (stratified 7-8 per level)...');
const levels = ['A1', 'A2', 'B1', 'B2'] as const;
const grammarRows: Array<Record<string, unknown>> = [];
for (const lvl of levels) {
  const rows = await db.select({
    eid: grammarExercises.id,
    type: grammarExercises.type,
    question: grammarExercises.question,
    answer: grammarExercises.answer,
    explanation: grammarExercises.explanation,
    topicSlug: grammarTopics.slug,
    topicTitleFr: grammarTopics.titleFr,
    topicTitleRu: grammarTopics.titleRu,
    level: grammarTopics.level,
  })
    .from(grammarExercises)
    .innerJoin(grammarTopics, eq(grammarExercises.topicId, grammarTopics.id))
    .where(eq(grammarTopics.level, lvl))
    .orderBy(sql`RANDOM()`)
    .limit(8);
  grammarRows.push(...rows);
  console.log(`  ${lvl}: ${rows.length}`);
}
writeFileSync(`${OUT}/grammar-exercises.json`, JSON.stringify(grammarRows, null, 2));

// 2) Reading — 10 random texts (excluding any we already audited if possible — just RANDOM)
console.log('\n2) Reading texts (10 random)...');
const reading = await db.select({
  id: readingTexts.id,
  slug: readingTexts.slug,
  title: readingTexts.title,
  level: readingTexts.level,
  topic: readingTexts.topic,
  contentFr: readingTexts.contentFr,
  questions: readingTexts.questions,
})
  .from(readingTexts)
  .where(eq(readingTexts.isActive, true))
  .orderBy(sql`RANDOM()`)
  .limit(10);
console.log(`  ${reading.length} texts`);
writeFileSync(`${OUT}/reading-texts.json`, JSON.stringify(reading, null, 2));

// 3) CEFR-level cross-check — 200 random words, balanced by level
console.log('\n3) CEFR cross-check sample (50 per level = 200 total)...');
const cefrSample: Record<string, unknown[]> = {};
for (const lvl of levels) {
  const rows = await db.select({
    id: words.id,
    french: words.french,
    translation: words.translation,
    translationEn: words.translationEn,
    partOfSpeech: words.partOfSpeech,
    level: words.level,
    category: words.category,
  })
    .from(words)
    .where(and(eq(words.level, lvl), eq(words.isActive, true)))
    .orderBy(sql`RANDOM()`)
    .limit(50);
  cefrSample[lvl] = rows;
  console.log(`  ${lvl}: ${rows.length}`);
}
writeFileSync(`${OUT}/cefr-words.json`, JSON.stringify(cefrSample, null, 2));

console.log(`\n✓ Round-2 samples written to ${OUT}/`);
process.exit(0);
