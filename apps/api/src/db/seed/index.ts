import 'dotenv/config';
import { db } from '../index.js';
import { words, grammarTopics, grammarExercises, listeningExercises, drillSets, drillQuestions } from '../schema/index.js';
import { eq, inArray, sql } from 'drizzle-orm';
import { wordsA1 } from './words-a1.js';
import { wordsA1Extra } from './words-a1-extra.js';
import { wordsA2 } from './words-a2.js';
import { wordsA2Extra } from './words-a2-extra.js';
import { wordsA2Extra2 } from './words-a2-extra2.js';
import { wordsA1Extra2 } from './words-a1-extra2.js';
import { wordsA1Extra3 } from './words-a1-extra3.js';
import { wordsA1Extra4 } from './words-a1-extra4.js';
import { wordsA2Extra3 } from './words-a2-extra3.js';
import { wordsA2Extra4 } from './words-a2-extra4.js';
import { wordsA2Extra5 } from './words-a2-extra5.js';
import { wordsA1Extra5 } from './words-a1-extra5.js';
import { wordsA2Extra6 } from './words-a2-extra6.js';
import { wordsB1 } from './words-b1.js';
import { wordsB1Extra } from './words-b1-extra.js';
import { wordsB1Extra2 } from './words-b1-extra2.js';
import { wordsB1Extra3 } from './words-b1-extra3.js';
import { wordsB1Extra4 } from './words-b1-extra4.js';
import { wordsB1Extra5 } from './words-b1-extra5.js';
import { wordsB1Extra6 } from './words-b1-extra6.js';
import { wordsB1Extra7 } from './words-b1-extra7.js';
import { wordsB1Extra8 } from './words-b1-extra8.js';
import { wordsB1Extra9 } from './words-b1-extra9.js';
import { wordsB1Extra10 } from './words-b1-extra10.js';
import { wordsB1Extra11 } from './words-b1-extra11.js';
import { wordsB1Extra12 } from './words-b1-extra12.js';
import { wordsB1Extra13 } from './words-b1-extra13.js';
import { wordsB1Extra14 } from './words-b1-extra14.js';
import { wordsB1Extra15 } from './words-b1-extra15.js';
import { wordsB1Extra16 } from './words-b1-extra16.js';
import { wordsB1Extra17 } from './words-b1-extra17.js';
import { wordsB1Extra18 } from './words-b1-extra18.js';
import { wordsB1Extra19 } from './words-b1-extra19.js';
import { wordsB1Extra20 } from './words-b1-extra20.js';
import { wordsB1Extra21 } from './words-b1-extra21.js';
import { wordsB1Extra22 } from './words-b1-extra22.js';
import { wordsB1Extra23 } from './words-b1-extra23.js';
import { wordsB1Extra24 } from './words-b1-extra24.js';
import { wordsB1Extra25 } from './words-b1-extra25.js';
import { wordsB1Extra26 } from './words-b1-extra26.js';
import { wordsB1Extra27 } from './words-b1-extra27.js';
import { wordsB1Extra28 } from './words-b1-extra28.js';
import { wordsB2 } from './words-b2.js';
import { wordsB2Extra } from './words-b2-extra.js';
import { wordsB2Extra2 } from './words-b2-extra2.js';
import { wordsB2Extra3 } from './words-b2-extra3.js';
import { wordsB2Extra4 } from './words-b2-extra4.js';
import { wordsB2Extra5 } from './words-b2-extra5.js';
import { wordsB2Extra6 } from './words-b2-extra6.js';
import { wordsB2Extra7 } from './words-b2-extra7.js';
import { wordsB2Extra8 } from './words-b2-extra8.js';
import { wordsB2Extra9 } from './words-b2-extra9.js';
import { wordsB2Extra10 } from './words-b2-extra10.js';
import { wordsB2Extra11 } from './words-b2-extra11.js';
import { wordsB2Extra12 } from './words-b2-extra12.js';
import { wordsB2Extra13 } from './words-b2-extra13.js';
import { wordsB2Extra14 } from './words-b2-extra14.js';
import { wordsB2Extra15 } from './words-b2-extra15.js';
import { wordsB2Extra16 } from './words-b2-extra16.js';
import { wordsB2Extra17 } from './words-b2-extra17.js';
import { wordsB2Extra18 } from './words-b2-extra18.js';
import { wordsB2Extra19 } from './words-b2-extra19.js';
import { wordsB2Extra20 } from './words-b2-extra20.js';
import { wordsB2Extra21 } from './words-b2-extra21.js';
import { wordsB2Extra22 } from './words-b2-extra22.js';
import { wordsB2Extra23 } from './words-b2-extra23.js';
import { wordsB2Extra24 } from './words-b2-extra24.js';
import { wordsB2Extra25 } from './words-b2-extra25.js';
import { wordsB2Extra26 } from './words-b2-extra26.js';
import { wordsB2Extra27 } from './words-b2-extra27.js';
import { grammarTopicsA1 } from './grammar-a1.js';
import { grammarTopicsA1Extra } from './grammar-a1-extra.js';
import { grammarTopicsA1Extra2 } from './grammar-a1-extra2.js';
import { grammarTopicsA2 } from './grammar-a2.js';
import { grammarTopicsA2Extra } from './grammar-a2-extra.js';
import { grammarTopicsA2Extra2 } from './grammar-a2-extra2.js';
import { grammarTopicsB1 } from './grammar-b1.js';
import { grammarTopicsB1Extra } from './grammar-b1-extra.js';
import { grammarTopicsB2 } from './grammar-b2.js';
import { grammarTopicsB2Extra } from './grammar-b2-extra.js';
import { grammarTopicsB2Extra2 } from './grammar-b2-extra2.js';
import { grammarExercisesA1 } from './grammar-exercises-a1.js';
import { grammarExercisesA1Extra } from './grammar-exercises-a1-extra.js';
import { grammarExercisesA1Extra2 } from './grammar-exercises-a1-extra2.js';
import { grammarExercisesA2 } from './grammar-exercises-a2.js';
import { grammarExercisesA2Extra } from './grammar-exercises-a2-extra.js';
import { grammarExercisesA2Extra2 } from './grammar-exercises-a2-extra2.js';
import { grammarExercisesB1 } from './grammar-exercises-b1.js';
import { grammarExercisesB1Extra } from './grammar-exercises-b1-extra.js';
import { grammarExercisesB2 } from './grammar-exercises-b2.js';
import { grammarExercisesB2Extra } from './grammar-exercises-b2-extra.js';
import { grammarExercisesB2Extra2 } from './grammar-exercises-b2-extra2.js';
import { listeningExercisesA1 } from './listening-a1.js';
import { listeningExercisesA1Extra } from './listening-a1-extra.js';
import { listeningExercisesA2 } from './listening-a2.js';
import { listeningExercisesB1 } from './listening-b1.js';
import { listeningExercisesB2 } from './listening-b2.js';
import { drillsData } from './drills.js';
import { drillsData2 } from './drills2.js';

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

const CATEGORY_REMAP: Record<string, string> = {
  // Basics
  basics: 'basics', common_phrases: 'basics', daily_phrases: 'basics',
  question_words: 'basics', question_words_extra: 'basics', greetings_extra: 'basics',

  // Numbers
  numbers: 'numbers', ordinal_numbers: 'numbers', numbers_stats: 'numbers', quantities: 'numbers',

  // Colors
  colors: 'colors', colors_extra: 'colors',

  // Time
  time: 'time', time_extra: 'time', time_vocabulary_b1: 'time', time_expressions: 'time',

  // Family
  family: 'family', relationships: 'family', relationships_b1: 'family',

  // Body
  body: 'body', body_extra: 'body', body_detailed: 'body', body_medical_b1: 'body',

  // Health
  health: 'health', health_basic: 'health', health_advanced: 'health',
  health_medicine_b1: 'health', medicine: 'health', mental_health: 'health',

  // Emotions & Personality
  emotions: 'emotions', emotions_b1: 'emotions',
  personality: 'personality', personality_b1: 'personality',

  // Food
  food: 'food', food_extra: 'food', food_advanced: 'food',
  gastronomy: 'food', cooking: 'food', vegetables_fruits: 'food',

  // Home
  home: 'home', house: 'home', housing: 'home', housing_b1: 'home',
  housing_detailed: 'home', housing_real_estate_b1: 'home',
  furniture: 'home', household_tasks: 'home',

  // Clothes
  clothes: 'clothes', clothes_extra: 'clothes', fashion_shopping_b1: 'clothes',

  // Shopping & Finance
  shopping: 'shopping',
  money: 'finance', banking_money: 'finance', finance: 'finance',

  // City & Places
  city: 'city', urban: 'city', urban_life_b1: 'city',
  directions: 'city', directions_extra: 'city', places_basic: 'city',

  // Travel
  travel: 'travel', travel_advanced: 'travel', travel_detailed: 'travel',
  travel_tourism_b1: 'travel', travel_transport: 'travel',

  // Transport
  transport: 'transport',

  // Nature
  nature: 'nature', nature_advanced: 'nature', nature_geography_b1: 'nature',

  // Environment
  environment: 'environment', environment_b1: 'environment', environment_extra: 'environment',

  // Weather
  weather: 'weather', weather_a1: 'weather', weather_detailed: 'weather',

  // Animals
  animals: 'animals',

  // Sports & Leisure
  sports: 'sports', sports_basic: 'sports', sports_detailed: 'sports',
  sports_leisure_b1: 'sports', leisure: 'sports',

  // Education
  school: 'education', classroom: 'education', education: 'education',
  education_school_b1: 'education', education_advanced: 'education',
  academic: 'education', academic_writing_b1: 'education',

  // Work & Professions
  work: 'work', work_advanced: 'work', hr: 'work', professions: 'work',

  // Technology
  technology: 'technology', technology_b1: 'technology', technology_digital_b1: 'technology',

  // Science
  science: 'science', science_b1: 'science', science_research_b1: 'science', materials: 'science',

  // Geography
  geography: 'geography', geography_b1: 'geography',
  countries: 'geography', nationalities: 'geography',

  // Politics
  politics: 'politics', politics_advanced: 'politics',

  // Law
  law: 'law', legal_b1: 'law', legal_civic_b1: 'law',

  // Economy & Business
  economy: 'economy', economy_b1: 'economy', economy_business_b1: 'economy', economics: 'economy',
  business: 'business', entrepreneurship: 'business',

  // Society
  society: 'society', society_b1: 'society', social: 'society',
  social_issues: 'society', social_issues_b1: 'society', sociology: 'society',

  // Arts & Culture
  arts: 'arts', arts_culture: 'arts', arts_culture_b1: 'arts',
  arts_literature: 'arts', literature: 'arts', architecture: 'arts',
  instruments: 'arts',
  culture: 'culture', culture_b1: 'culture',
  history: 'culture', religion: 'culture', celebrations: 'culture',

  // Media & Communication
  media: 'media', media_news_b1: 'media', media_culture: 'media', media_modern: 'media',
  communication_b1: 'communication', language: 'communication',

  // Psychology & Philosophy
  psychology: 'psychology', psychology_b1: 'psychology', psychology_mindset_b1: 'psychology',
  philosophy: 'philosophy', ethics: 'philosophy',

  // Verbs (all types → one category)
  verbs: 'verbs', verbs_b1: 'verbs', verbs_b1_extra: 'verbs', verbs_basic: 'verbs',
  verbs_extra: 'verbs', verbs_advanced: 'verbs', verbs_advanced_b1: 'verbs',
  verbs_movement: 'verbs', verbs_communication: 'verbs',
  verbs_opinion: 'verbs', verbs_opinion_extra: 'verbs',
  reflexive_verbs: 'verbs', reflexive_verbs_basic: 'verbs', reflexive_verbs_extra: 'verbs',

  // Adjectives
  adjectives: 'adjectives', adjectives_b1: 'adjectives', adjectives_b1_extra: 'adjectives',
  adjectives_extra: 'adjectives', adjectives_complex: 'adjectives',
  adjectives_b1_description: 'adjectives',

  // Adverbs
  adverbs: 'adverbs', adverbs_b1: 'adverbs',

  // Prepositions
  prepositions: 'prepositions',

  // Connectors
  connectors: 'connectors', connectors_b1: 'connectors',
  connectors_discourse_b1: 'connectors', connectors_formal: 'connectors',
  linking_words: 'connectors',

  // Expressions & Phrases
  expressions: 'expressions', expressions_b1: 'expressions',
  expressions_faire: 'expressions', phrases_b1_extra: 'expressions',

  // Descriptions
  descriptions: 'descriptions', description: 'descriptions',

  // Nouns
  abstract_nouns: 'nouns', abstract_nouns_b1: 'nouns', nouns_b1_extra: 'nouns',
};

function normalizeCategory(cat: string): string {
  return CATEGORY_REMAP[cat] ?? cat;
}

function buildWordRows(items: WordInput[], level: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2') {
  return items.map((w) => ({
    french: w.french,
    translation: w.translation,
    translationEn: w.translationEn ?? undefined,
    level,
    category: normalizeCategory(w.category),
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
    await db.insert(words).values(batch).onConflictDoUpdate({
      target: words.french,
      set: {
        category: sql`excluded.category`,
        translationEn: sql`excluded.translation_en`,
        exampleEn: sql`excluded.example_en`,
      },
    });
    inserted += batch.length;
    console.log(`  ${label}: ${inserted}/${rows.length}`);
  }
}

async function seedGrammarTopics(
  topics: typeof grammarTopicsA1,
  level: 'A1' | 'A2' | 'B1' | 'B2',
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
  const a1Rows = buildWordRows([...wordsA1, ...wordsA1Extra, ...wordsA1Extra2, ...wordsA1Extra3, ...wordsA1Extra4, ...wordsA1Extra5] as WordInput[], 'A1');
  await seedWordsBatch(a1Rows, 'A1 words');
  console.log(`Words A1 done! Total: ${a1Rows.length}`);

  // ===== Words A2 =====
  console.log('\nSeeding words A2...');
  const a2Rows = buildWordRows([...wordsA2, ...wordsA2Extra, ...wordsA2Extra2, ...wordsA2Extra3, ...wordsA2Extra4, ...wordsA2Extra5, ...wordsA2Extra6] as WordInput[], 'A2');
  await seedWordsBatch(a2Rows, 'A2 words');
  console.log(`Words A2 done! Total: ${a2Rows.length}`);

  // ===== Words B1 =====
  console.log('\nSeeding words B1...');
  const b1Rows = buildWordRows([
    ...wordsB1, ...wordsB1Extra, ...wordsB1Extra2, ...wordsB1Extra3,
    ...wordsB1Extra4, ...wordsB1Extra5, ...wordsB1Extra6, ...wordsB1Extra7,
    ...wordsB1Extra8, ...wordsB1Extra9, ...wordsB1Extra10, ...wordsB1Extra11,
    ...wordsB1Extra12, ...wordsB1Extra13, ...wordsB1Extra14, ...wordsB1Extra15,
    ...wordsB1Extra16, ...wordsB1Extra17,
    ...wordsB1Extra18, ...wordsB1Extra19, ...wordsB1Extra20,
    ...wordsB1Extra21, ...wordsB1Extra22,
    ...wordsB1Extra23, ...wordsB1Extra24, ...wordsB1Extra25,
    ...wordsB1Extra26, ...wordsB1Extra27, ...wordsB1Extra28,
  ] as WordInput[], 'B1');
  await seedWordsBatch(b1Rows, 'B1 words');
  console.log(`Words B1 done! Total: ${b1Rows.length}`);

  // ===== Words B2 =====
  console.log('\nSeeding words B2...');
  const b2Rows = buildWordRows([
    ...wordsB2, ...wordsB2Extra, ...wordsB2Extra2, ...wordsB2Extra3,
    ...wordsB2Extra4, ...wordsB2Extra5, ...wordsB2Extra6, ...wordsB2Extra7,
    ...wordsB2Extra8, ...wordsB2Extra9,
    ...wordsB2Extra10, ...wordsB2Extra11, ...wordsB2Extra12, ...wordsB2Extra13,
    ...wordsB2Extra14, ...wordsB2Extra15, ...wordsB2Extra16, ...wordsB2Extra17,
    ...wordsB2Extra18, ...wordsB2Extra19, ...wordsB2Extra20, ...wordsB2Extra21,
    ...wordsB2Extra22, ...wordsB2Extra23, ...wordsB2Extra24, ...wordsB2Extra25,
    ...wordsB2Extra26, ...wordsB2Extra27,
  ] as WordInput[], 'B2');
  await seedWordsBatch(b2Rows, 'B2 words');
  console.log(`Words B2 done! Total: ${b2Rows.length}`);

  // ===== Grammar Topics =====
  console.log('\nSeeding grammar topics A1...');
  await seedGrammarTopics([...grammarTopicsA1, ...grammarTopicsA1Extra, ...grammarTopicsA1Extra2], 'A1');
  console.log(`Grammar topics A1 done! Total: ${grammarTopicsA1.length + grammarTopicsA1Extra.length + grammarTopicsA1Extra2.length}`);

  console.log('\nSeeding grammar topics A2...');
  await seedGrammarTopics([...grammarTopicsA2, ...grammarTopicsA2Extra, ...grammarTopicsA2Extra2], 'A2');
  console.log(`Grammar topics A2 done! Total: ${grammarTopicsA2.length + grammarTopicsA2Extra.length + grammarTopicsA2Extra2.length}`);

  // ===== Grammar Exercises =====
  console.log('\nSeeding grammar exercises...');
  const topicRows = await db.select({ id: grammarTopics.id, slug: grammarTopics.slug }).from(grammarTopics);
  const slugToId = new Map(topicRows.map((r) => [r.slug, r.id]));

  await seedGrammarExercises(grammarExercisesA1, slugToId, 'A1 exercises');
  await seedGrammarExercises(grammarExercisesA1Extra, slugToId, 'A1 extra exercises');
  await seedGrammarExercises(grammarExercisesA1Extra2, slugToId, 'A1 extra2 exercises');
  await seedGrammarExercises(grammarExercisesA2, slugToId, 'A2 exercises');
  await seedGrammarExercises(grammarExercisesA2Extra, slugToId, 'A2 extra exercises');
  await seedGrammarExercises(grammarExercisesA2Extra2, slugToId, 'A2 extra2 exercises');

  console.log('\nSeeding grammar topics B1...');
  await seedGrammarTopics([...grammarTopicsB1, ...grammarTopicsB1Extra], 'B1');
  console.log(`Grammar topics B1 done! Total: ${grammarTopicsB1.length + grammarTopicsB1Extra.length}`);

  // Refresh slugToId to include B1 topics
  const topicRowsB1 = await db.select({ id: grammarTopics.id, slug: grammarTopics.slug }).from(grammarTopics);
  const slugToIdB1 = new Map(topicRowsB1.map((r) => [r.slug, r.id]));

  console.log('\nSeeding grammar exercises B1...');
  await seedGrammarExercises(grammarExercisesB1, slugToIdB1, 'B1 exercises');
  await seedGrammarExercises(grammarExercisesB1Extra, slugToIdB1, 'B1 extra exercises');

  console.log('\nSeeding grammar topics B2...');
  await seedGrammarTopics([...grammarTopicsB2, ...grammarTopicsB2Extra, ...grammarTopicsB2Extra2], 'B2');
  console.log(`Grammar topics B2 done! Total: ${grammarTopicsB2.length + grammarTopicsB2Extra.length + grammarTopicsB2Extra2.length}`);

  // Refresh slugToId to include B2 topics
  const topicRowsB2 = await db.select({ id: grammarTopics.id, slug: grammarTopics.slug }).from(grammarTopics);
  const slugToIdB2 = new Map(topicRowsB2.map((r) => [r.slug, r.id]));

  console.log('\nSeeding grammar exercises B2...');
  await seedGrammarExercises(grammarExercisesB2, slugToIdB2, 'B2 exercises');
  await seedGrammarExercises(grammarExercisesB2Extra, slugToIdB2, 'B2 extra exercises');
  await seedGrammarExercises(grammarExercisesB2Extra2, slugToIdB2, 'B2 extra2 exercises');

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

  console.log('\nSeeding listening exercises B1...');
  for (const ex of listeningExercisesB1) {
    await db
      .insert(listeningExercises)
      .values({
        title: ex.title,
        level: 'B1' as const,
        audioUrl: '',
        transcript: ex.transcript,
        questions: ex.questions,
        durationSec: ex.durationSec,
      })
      .onConflictDoNothing();
    console.log(`  Listening B1: ${ex.title}`);
  }
  console.log(`Listening B1 done! Total: ${listeningExercisesB1.length}`);

  console.log('\nSeeding listening exercises B2...');
  for (const ex of listeningExercisesB2) {
    await db
      .insert(listeningExercises)
      .values({
        title: ex.title,
        level: 'B2' as const,
        audioUrl: '',
        transcript: ex.transcript,
        questions: ex.questions,
        durationSec: ex.durationSec,
      })
      .onConflictDoNothing();
    console.log(`  Listening B2: ${ex.title}`);
  }
  console.log(`Listening B2 done! Total: ${listeningExercisesB2.length}`);

  // ===== Drills =====
  console.log('\nSeeding drills...');
  for (const drill of [...drillsData, ...drillsData2]) {
    const [insertedDrill] = await db
      .insert(drillSets)
      .values({
        slug: drill.slug,
        titleRu: drill.titleRu,
        titleEn: drill.titleEn,
        descriptionRu: drill.descriptionRu,
        descriptionEn: drill.descriptionEn,
        level: drill.level,
        category: drill.category,
        difficulty: drill.difficulty,
        questionCount: drill.questions.length,
        icon: drill.icon,
      })
      .onConflictDoNothing()
      .returning({ id: drillSets.id });

    if (!insertedDrill) {
      console.log(`  Drill [skip existing]: ${drill.slug}`);
      continue;
    }

    for (const q of drill.questions) {
      await db.insert(drillQuestions).values({
        drillSetId: insertedDrill.id,
        type: q.type,
        question: q.question,
        answer: q.answer,
        explanation: q.explanation ?? null,
      });
    }
    console.log(`  Drill: ${drill.slug} (${drill.questions.length} questions)`);
  }
  console.log(`Drills done! Total: ${drillsData.length + drillsData2.length}`);

  console.log('\nAll seed complete!');
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
