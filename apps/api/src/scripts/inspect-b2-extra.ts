import 'dotenv/config';
import { eq, sql } from 'drizzle-orm';
import { db } from '../db/index.js';
import { writingPrompts, drillSets, drillQuestions } from '../db/schema/index.js';

console.log('=== Sample B2 writing prompts (2) ===');
const wps = await db.select().from(writingPrompts).where(eq(writingPrompts.level, 'B2')).limit(2);
for (const w of wps) {
  console.log(JSON.stringify({
    slug: w.slug, titleRu: w.titleRu, writingType: w.writingType,
    promptRu: (w.promptRu ?? '').slice(0, 200), promptFr: (w.promptFr ?? '').slice(0, 200),
    tipsRu: w.tipsRu, minWords: w.minWords, maxWords: w.maxWords,
    requiredElements: w.requiredElements,
  }, null, 2).slice(0, 1600));
}

console.log('\n=== B2 drill sets (all) ===');
const ds = await db.select().from(drillSets).where(eq(drillSets.level, 'B2'));
for (const d of ds) {
  console.log(JSON.stringify({ slug: d.slug, titleRu: d.titleRu, descriptionRu: d.descriptionRu.slice(0, 200), category: d.category, difficulty: d.difficulty, questionCount: d.questionCount, icon: d.icon }, null, 2));
  const qs = await db.select().from(drillQuestions).where(eq(drillQuestions.drillSetId, d.id)).limit(2);
  for (const q of qs) {
    console.log('  Q:', JSON.stringify({ type: q.type, question: q.question, answer: q.answer, explanation: (q.explanation ?? '').slice(0, 150) }, null, 2));
  }
}

console.log('\n=== B1 drill set example (more samples available) ===');
const [ds2] = await db.select().from(drillSets).where(eq(drillSets.level, 'B1')).limit(1);
if (ds2) {
  console.log(JSON.stringify({ slug: ds2.slug, titleRu: ds2.titleRu, category: ds2.category, icon: ds2.icon, questionCount: ds2.questionCount }, null, 2));
  const qs = await db.select().from(drillQuestions).where(eq(drillQuestions.drillSetId, ds2.id)).limit(3);
  for (const q of qs) {
    console.log('  Q:', JSON.stringify({ type: q.type, question: q.question, answer: q.answer }, null, 2));
  }
}

process.exit(0);
