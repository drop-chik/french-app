import 'dotenv/config';
import { db } from '../index.js';
import { words, grammarTopics, grammarExercises, listeningExercises } from '../schema/index.js';
import { eq, inArray } from 'drizzle-orm';
import { wordsA1 } from './words-a1.js';
import { wordsA1Extra } from './words-a1-extra.js';
import { wordsA2 } from './words-a2.js';
import { wordsA2Extra } from './words-a2-extra.js';
import { wordsA2Extra2 } from './words-a2-extra2.js';
import { grammarTopicsA1 } from './grammar-a1.js';
import { grammarTopicsA1Extra } from './grammar-a1-extra.js';
import { grammarTopicsA2 } from './grammar-a2.js';
import { grammarTopicsA2Extra } from './grammar-a2-extra.js';
import { grammarTopicsB1 } from './grammar-b1.js';
import { grammarExercisesA1 } from './grammar-exercises-a1.js';
import { grammarExercisesA1Extra } from './grammar-exercises-a1-extra.js';
import { grammarExercisesA2 } from './grammar-exercises-a2.js';
import { grammarExercisesA2Extra } from './grammar-exercises-a2-extra.js';
import { grammarExercisesB1 } from './grammar-exercises-b1.js';
import { listeningExercisesA1 } from './listening-a1.js';
import { listeningExercisesA1Extra } from './listening-a1-extra.js';
import { listeningExercisesA2 } from './listening-a2.js';

type WordInput = {
  french: string;
  translation: string;
  translationEn?: string;
  category: string;
  partOfSpeech?: string;
  gender?: string;
  frequencyRank?: number;
  grammarTag?: string;
  exampleFr?: string | null;
  exampleRu?: string | null;
  exampleEn?: string | null;
};

function buildWordRows(items: WordInput[], level: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2') {
  return items.map((w) => ({
    french: w.french,
    translation: w.translation,
    translationEn: w.translationEn ?? undefined,
    level,
    category: w.category,
    partOfSpeech: w.partOfSpeech ?? undefined,
    gender: w.gender ?? undefined,
    frequencyRank: w.frequencyRank ?? undefined,
    grammarTag: w.grammarTag ?? undefined,
    exampleFr: w.exampleFr ?? null,
    exampleRu: w.exampleRu ?? null,
    exampleEn: w.exampleEn ?? null,
    audioUrl: null,
    imageUrl: null,
    imageGenerating: false,
  }));
}

async function seedWordsBatch(
  rows: ReturnType<typeof buildWordRows>,
  label: string,
) {
  const BATCH = 50;
  let inserted = 0;
  for (let i = 0; i < rows.length; i += BATCH) {
    const batch = rows.slice(i, i + BATCH);
    await db.insert(words).values(batch).onConflictDoNothing();
    inserted += batch.length;
    console.log(`  ${label}: ${inserted}/${rows.length}`);
  }
}

async function seedGrammarTopics(
  topics: typeof grammarTopicsA1,
  level: 'A1' | 'A2' | 'B1',
) {
  for (const topic of topics) {
    await db
      .insert(grammarTopics)
      .values({
        slug: topic.slug,
        titleRu: topic.titleRu,
        titleEn: topic.titleEn,
        titleFr: topic.titleFr,
        level,
        category: topic.category,
        orderNum: topic.orderNum,
        content: topic.content,
        contentEn: topic.contentEn ?? null,
      })
      .onConflictDoNothing();
    console.log(`  Topic: ${topic.slug}`);
  }
}

async function seedGrammarExercises(
  exercises: typeof grammarExercisesA1,
  slugToId: Map<string, string>,
  label: string,
) {
  // Collect all topic IDs that have exercises in this batch
  const topicIds = [...new Set(
    exercises.map(ex => slugToId.get(ex.topicSlug)).filter(Boolean) as string[]
  )];

  // Delete existing exercises for these topics to ensure idempotency
  if (topicIds.length > 0) {
    await db.delete(grammarExercises).where(inArray(grammarExercises.topicId, topicIds));
  }

  let inserted = 0;
  for (const ex of exercises) {
    const topicId = slugToId.get(ex.topicSlug);
    if (!topicId) {
      console.warn(`  WARNING: topic not found for slug "${ex.topicSlug}", skipping`);
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
        explanationEn: ex.explanationEn ?? null,
      });
    inserted++;
  }
  console.log(`  ${label}: ${inserted} exercises inserted`);
}

async function seed() {
  // ===== Words A1 =====
  console.log('Seeding words A1...');
  const a1Rows = buildWordRows([...wordsA1, ...wordsA1Extra] as WordInput[], 'A1');
  await seedWordsBatch(a1Rows, 'A1 words');
  console.log(`Words A1 done! Total: ${a1Rows.length}`);

  // ===== Words A2 =====
  console.log('\nSeeding words A2...');
  const a2Rows = buildWordRows([...wordsA2, ...wordsA2Extra, ...wordsA2Extra2] as WordInput[], 'A2');
  await seedWordsBatch(a2Rows, 'A2 words');
  console.log(`Words A2 done! Total: ${a2Rows.length}`);

  // ===== Grammar Topics =====
  console.log('\nSeeding grammar topics A1...');
  await seedGrammarTopics([...grammarTopicsA1, ...grammarTopicsA1Extra], 'A1');
  console.log(`Grammar topics A1 done! Total: ${grammarTopicsA1.length + grammarTopicsA1Extra.length}`);

  console.log('\nSeeding grammar topics A2...');
  await seedGrammarTopics([...grammarTopicsA2, ...grammarTopicsA2Extra], 'A2');
  console.log(`Grammar topics A2 done! Total: ${grammarTopicsA2.length + grammarTopicsA2Extra.length}`);

  // ===== Grammar Exercises =====
  console.log('\nSeeding grammar exercises...');
  const topicRows = await db.select({ id: grammarTopics.id, slug: grammarTopics.slug }).from(grammarTopics);
  const slugToId = new Map(topicRows.map((r) => [r.slug, r.id]));

  await seedGrammarExercises(grammarExercisesA1, slugToId, 'A1 exercises');
  await seedGrammarExercises(grammarExercisesA1Extra, slugToId, 'A1 extra exercises');
  await seedGrammarExercises(grammarExercisesA2, slugToId, 'A2 exercises');
  await seedGrammarExercises(grammarExercisesA2Extra, slugToId, 'A2 extra exercises');

  console.log('\nSeeding grammar topics B1...');
  await seedGrammarTopics(grammarTopicsB1, 'B1');
  console.log(`Grammar topics B1 done! Total: ${grammarTopicsB1.length}`);

  // Refresh slugToId to include B1 topics
  const topicRowsB1 = await db.select({ id: grammarTopics.id, slug: grammarTopics.slug }).from(grammarTopics);
  const slugToIdB1 = new Map(topicRowsB1.map((r) => [r.slug, r.id]));

  console.log('\nSeeding grammar exercises B1...');
  await seedGrammarExercises(grammarExercisesB1, slugToIdB1, 'B1 exercises');

  // ===== Listening Exercises =====
  console.log('\nSeeding listening exercises A1...');
  for (const ex of [...listeningExercisesA1, ...listeningExercisesA1Extra]) {
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
    console.log(`  Listening A1: ${ex.title}`);
  }
  console.log(`Listening A1 done! Total: ${listeningExercisesA1.length + listeningExercisesA1Extra.length}`);

  console.log('\nSeeding listening exercises A2...');
  for (const ex of listeningExercisesA2) {
    await db
      .insert(listeningExercises)
      .values({
        title: ex.title,
        level: 'A2' as const,
        audioUrl: '',
        transcript: ex.transcript,
        questions: ex.questions,
        durationSec: ex.durationSec,
      })
      .onConflictDoNothing();
    console.log(`  Listening A2: ${ex.title}`);
  }
  console.log(`Listening A2 done! Total: ${listeningExercisesA2.length}`);

  console.log('\nAll seed complete!');
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
