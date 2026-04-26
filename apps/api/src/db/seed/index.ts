import 'dotenv/config';
import { db } from '../index.js';
import { words, grammarTopics, grammarExercises, listeningExercises } from '../schema/index.js';
import { wordsA1 } from './words-a1.js';
import { wordsA1Extra } from './words-a1-extra.js';
import { grammarTopicsA1 } from './grammar-a1.js';
import { grammarExercisesA1 } from './grammar-exercises-a1.js';
import { listeningExercisesA1 } from './listening-a1.js';
import { eq } from 'drizzle-orm';

async function seed() {
  // ===== Words =====
  console.log('Seeding words A1...');

  const allWords = [...wordsA1, ...wordsA1Extra];
  const wordRows = allWords.map((w) => ({
    french: w.french,
    translation: w.translation,
    level: 'A1' as const,
    category: w.category,
    partOfSpeech: (w as Record<string, unknown>)['partOfSpeech'] as string | null ?? null,
    gender: (w as Record<string, unknown>)['gender'] as string | null ?? null,
    frequencyRank: (w as Record<string, unknown>)['frequencyRank'] as number | null ?? null,
    grammarTag: (w as Record<string, unknown>)['grammarTag'] as string | null ?? null,
    exampleFr: w.exampleFr ?? null,
    exampleRu: w.exampleRu ?? null,
    audioUrl: null,
    imageUrl: null,
    imageGenerating: false,
  }));

  const BATCH = 50;
  let inserted = 0;
  for (let i = 0; i < wordRows.length; i += BATCH) {
    const batch = wordRows.slice(i, i + BATCH);
    await db.insert(words).values(batch).onConflictDoNothing();
    inserted += batch.length;
    console.log(`  Words: ${inserted}/${wordRows.length}`);
  }
  console.log(`Words done! Total: ${wordRows.length} (A1: ${wordsA1.length} + Extra: ${wordsA1Extra.length})`);

  // ===== Grammar Topics =====
  console.log('\nSeeding grammar topics A1...');

  for (const topic of grammarTopicsA1) {
    await db
      .insert(grammarTopics)
      .values({
        slug: topic.slug,
        titleRu: topic.titleRu,
        titleFr: topic.titleFr,
        level: 'A1' as const,
        category: topic.category,
        orderNum: topic.orderNum,
        content: topic.content,
      })
      .onConflictDoNothing();
    console.log(`  Topic: ${topic.slug}`);
  }
  console.log(`Grammar topics done! Total: ${grammarTopicsA1.length}`);

  // ===== Grammar Exercises =====
  console.log('\nSeeding grammar exercises A1...');

  // Build slug → id map
  const topicRows = await db.select({ id: grammarTopics.id, slug: grammarTopics.slug }).from(grammarTopics);
  const slugToId = new Map(topicRows.map((r) => [r.slug, r.id]));

  let exInserted = 0;
  for (const ex of grammarExercisesA1) {
    const topicId = slugToId.get(ex.topicSlug);
    if (!topicId) {
      console.warn(`  WARNING: topic not found for slug "${ex.topicSlug}", skipping exercise`);
      continue;
    }
    await db
      .insert(grammarExercises)
      .values({
        topicId,
        type: ex.type,
        question: ex.question,
        answer: ex.answer,
        explanation: ex.explanation ?? null,
      });
    exInserted++;
  }
  console.log(`Grammar exercises done! Total: ${exInserted}`);

  // ===== Listening Exercises =====
  console.log('\nSeeding listening exercises A1...');

  for (const ex of listeningExercisesA1) {
    await db
      .insert(listeningExercises)
      .values({
        title: ex.title,
        level: 'A1' as const,
        audioUrl: '',
        transcript: ex.transcript,
        questions: ex.questions,
        durationSec: ex.durationSec,
      })
      .onConflictDoNothing();
    console.log(`  Listening: ${ex.title}`);
  }
  console.log(`Listening exercises done! Total: ${listeningExercisesA1.length}`);

  console.log('\nAll seed complete!');
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
