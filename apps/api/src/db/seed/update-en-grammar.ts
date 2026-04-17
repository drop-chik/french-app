/**
 * Скрипт обновляет titleEn, contentEn для grammar_topics
 * и explanationEn для grammar_exercises в БД.
 * Запускать: npx tsx src/db/seed/update-en-grammar.ts
 */
import 'dotenv/config';
import { db } from '../index.js';
import { grammarTopics, grammarExercises } from '../schema/index.js';
import { eq } from 'drizzle-orm';
import { grammarTopicsA1 } from './grammar-a1.js';
import { grammarExercisesA1 } from './grammar-exercises-a1.js';

async function updateEnGrammar() {
  // --- Update grammar topics ---
  console.log(`Updating EN content for ${grammarTopicsA1.length} grammar topics...`);
  let topicsUpdated = 0;

  for (const topic of grammarTopicsA1) {
    await db
      .update(grammarTopics)
      .set({
        titleEn: topic.titleEn,
        contentEn: topic.contentEn as any,
      })
      .where(eq(grammarTopics.slug, topic.slug));
    topicsUpdated++;
  }

  console.log(`Topics updated: ${topicsUpdated}`);

  // --- Update grammar exercises ---
  console.log(`Updating explanationEn for ${grammarExercisesA1.length} exercises...`);
  let exercisesUpdated = 0;
  let exercisesSkipped = 0;

  for (const ex of grammarExercisesA1) {
    if (!ex.explanationEn) {
      exercisesSkipped++;
      continue;
    }

    // Match by topicSlug + question JSON (since there's no unique slug per exercise)
    const questionJson = JSON.stringify(ex.question);

    // Find exercises for this topic and update the one matching the question
    const existing = await db
      .select({ id: grammarExercises.id, question: grammarExercises.question })
      .from(grammarExercises)
      .innerJoin(
        grammarTopics,
        eq(grammarExercises.topicId, grammarTopics.id),
      )
      .where(eq(grammarTopics.slug, ex.topicSlug));

    const match = existing.find(
      (row) => JSON.stringify(row.question) === questionJson,
    );

    if (match) {
      await db
        .update(grammarExercises)
        .set({ explanationEn: ex.explanationEn })
        .where(eq(grammarExercises.id, match.id));
      exercisesUpdated++;
    } else {
      console.warn(`  No match for topic "${ex.topicSlug}", question: ${questionJson.slice(0, 60)}...`);
      exercisesSkipped++;
    }
  }

  console.log(`Exercises updated: ${exercisesUpdated}, skipped: ${exercisesSkipped}`);
  console.log('Done!');
  process.exit(0);
}

updateEnGrammar().catch((err) => {
  console.error(err);
  process.exit(1);
});
