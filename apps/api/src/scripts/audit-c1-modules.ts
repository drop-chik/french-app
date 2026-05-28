import 'dotenv/config';
import { eq, sql } from 'drizzle-orm';
import { db } from '../db/index.js';
import { words, grammarTopics, listeningExercises, readingTexts } from '../db/schema/index.js';

const levels = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as const;

console.log('=== Words by level ===');
for (const lv of levels) {
  const [r] = await db.select({ n: sql<number>`count(*)` }).from(words).where(eq(words.level, lv));
  console.log(`  ${lv}: ${r?.n ?? 0}`);
}

console.log('\n=== Grammar topics by level ===');
for (const lv of levels) {
  const [r] = await db.select({ n: sql<number>`count(*)` }).from(grammarTopics).where(eq(grammarTopics.level, lv));
  console.log(`  ${lv}: ${r?.n ?? 0}`);
}

console.log('\n=== Listening exercises by level ===');
for (const lv of levels) {
  const [r] = await db.select({ n: sql<number>`count(*)` }).from(listeningExercises).where(eq(listeningExercises.level, lv));
  console.log(`  ${lv}: ${r?.n ?? 0}`);
}

console.log('\n=== Reading texts by level ===');
for (const lv of levels) {
  const [r] = await db.select({ n: sql<number>`count(*)` }).from(readingTexts).where(eq(readingTexts.level, lv));
  console.log(`  ${lv}: ${r?.n ?? 0}`);
}

process.exit(0);
