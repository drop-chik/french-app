import 'dotenv/config';
import { eq, sql, and } from 'drizzle-orm';
import { db } from '../db/index.js';
import { grammarTopics, grammarExercises, listeningExercises, readingTexts } from '../db/schema/index.js';

console.log('=== Sample B2 grammar topic + 2 exercises ===');
const [topic] = await db.select().from(grammarTopics).where(eq(grammarTopics.level, 'B2')).limit(1);
if (topic) {
  console.log(JSON.stringify({ slug: topic.slug, titleRu: topic.titleRu, titleFr: topic.titleFr, category: topic.category, orderNum: topic.orderNum, content: topic.content }, null, 2).slice(0, 2500));
  const exs = await db.select().from(grammarExercises).where(eq(grammarExercises.topicId, topic.id)).limit(2);
  console.log('\n--- exercises ---');
  for (const ex of exs) {
    console.log(JSON.stringify({ type: ex.type, question: ex.question, answer: ex.answer, explanation: ex.explanation }, null, 2));
  }
}

console.log('\n=== Sample B2 listening (transcript head + Qs) ===');
const [lis] = await db.select().from(listeningExercises).where(eq(listeningExercises.level, 'B2')).limit(1);
if (lis) {
  console.log(JSON.stringify({ title: lis.title, durationSec: lis.durationSec, transcript: lis.transcript.slice(0, 500), questions: lis.questions }, null, 2).slice(0, 2500));
}

console.log('\n=== Sample B2 reading text (head + wordMap sample + Qs) ===');
const [rd] = await db.select().from(readingTexts).where(eq(readingTexts.level, 'B2')).limit(1);
if (rd) {
  const wm = rd.wordMap as Record<string, unknown>;
  const sample: Record<string, unknown> = {};
  Object.keys(wm).slice(0, 5).forEach(k => sample[k] = wm[k]);
  console.log(JSON.stringify({ slug: rd.slug, title: rd.title, topic: rd.topic, contentFr: rd.contentFr.slice(0, 400), wordMapSample: sample, wordMapSize: Object.keys(wm).length, questions: rd.questions }, null, 2).slice(0, 3000));
}

process.exit(0);
