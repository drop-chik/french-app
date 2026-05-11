import 'dotenv/config';
import { db } from '../index.js';
import { words, grammarTopics, grammarExercises, listeningExercises, drillSets, drillQuestions, writingPrompts, readingTexts } from '../schema/index.js';
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
import { grammarExercisesA1Extra3 } from './grammar-exercises-a1-extra3.js';
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
import { writingPromptsData } from './writing-prompts.js';
import { readingTextsData } from './reading.js';
import { wordsReading } from './words-reading.js';

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

// ── 35 canonical categories ──────────────────────────────────────────────
// Group 1: Базовое (4)
// Group 2: Человек (4)
// Group 3: Быт (4)
// Group 4: Город и мир (5)
// Group 5: Внешний мир (4)
// Group 6: Общество (8)
// Group 7: Наука и ум (3)
// Group 8: Инструменты языка (4)
const CATEGORY_REMAP: Record<string, string> = {
  // ── Основы ──
  basics: 'basics', common_phrases: 'basics', daily_phrases: 'basics',
  question_words: 'basics', question_words_extra: 'basics', greetings_extra: 'basics',

  // ── Числа ──
  numbers: 'numbers', ordinal_numbers: 'numbers', numbers_stats: 'numbers', quantities: 'numbers',

  // ── Цвета ──
  colors: 'colors', colors_extra: 'colors',

  // ── Время ──
  time: 'time', time_extra: 'time', time_vocabulary_b1: 'time', time_expressions: 'time',

  // ── Семья ──
  family: 'family', relationships: 'family', relationships_b1: 'family',

  // ── Тело ──
  body: 'body', body_extra: 'body', body_detailed: 'body', body_medical_b1: 'body',

  // ── Здоровье ──
  health: 'health', health_basic: 'health', health_advanced: 'health',
  health_medicine_b1: 'health', medicine: 'health', mental_health: 'health',

  // ── Эмоции и характер ── (emotions + personality merged)
  emotions: 'emotions', emotions_b1: 'emotions',
  personality: 'emotions', personality_b1: 'emotions',

  // ── Еда ──
  food: 'food', food_extra: 'food', food_advanced: 'food',
  gastronomy: 'food', cooking: 'food', vegetables_fruits: 'food',

  // ── Дом ──
  home: 'home', house: 'home', housing: 'home', housing_b1: 'home',
  housing_detailed: 'home', housing_real_estate_b1: 'home',
  furniture: 'home', household_tasks: 'home',

  // ── Одежда ──
  clothes: 'clothes', clothes_extra: 'clothes', fashion_shopping_b1: 'clothes',

  // ── Покупки ── (money/finance → economy)
  shopping: 'shopping',
  money: 'economy', banking_money: 'economy', finance: 'economy',

  // ── Город ──
  city: 'city', urban: 'city', urban_life_b1: 'city',
  directions: 'city', directions_extra: 'city', places_basic: 'city',

  // ── Транспорт → объединён с Путешествиями ──
  transport: 'travel', travel_transport: 'travel',

  // ── Путешествия ──
  travel: 'travel', travel_advanced: 'travel', travel_detailed: 'travel',
  travel_tourism_b1: 'travel',

  // ── Природа ──
  nature: 'nature', nature_advanced: 'nature', nature_geography_b1: 'nature',

  // ── Страны и народы ──
  geography: 'geography', geography_b1: 'geography',
  countries: 'geography', nationalities: 'geography',

  // ── Экология ──
  environment: 'environment', environment_b1: 'environment', environment_extra: 'environment',

  // ── Погода ──
  weather: 'weather', weather_a1: 'weather', weather_detailed: 'weather',

  // ── Животные ──
  animals: 'animals',

  // ── Календарь (дни/месяцы/сезоны) — post-seed split from 'time' ──
  calendar: 'calendar',

  // ── Спорт ──
  sports: 'sports', sports_basic: 'sports', sports_detailed: 'sports',
  sports_leisure_b1: 'sports', leisure: 'sports',

  // ── Образование ──
  school: 'education', classroom: 'education', education: 'education',
  education_school_b1: 'education', education_advanced: 'education',
  academic: 'education', academic_writing_b1: 'education',

  // ── Работа ──
  work: 'work', work_advanced: 'work', hr: 'work', professions: 'work',

  // ── Экономика ── (economy + finance + business merged)
  economy: 'economy', economy_b1: 'economy', economy_business_b1: 'economy', economics: 'economy',
  business: 'economy', entrepreneurship: 'economy',

  // ── Политика ──
  politics: 'politics', politics_advanced: 'politics',

  // ── Право ──
  law: 'law', legal_b1: 'law', legal_civic_b1: 'law',

  // ── Общество ──
  society: 'society', society_b1: 'society', social: 'society',
  social_issues: 'society', social_issues_b1: 'society', sociology: 'society',

  // ── Искусство ── (arts + culture; celebrations → society)
  arts: 'arts', arts_culture: 'arts', arts_culture_b1: 'arts',
  arts_literature: 'arts', literature: 'arts', architecture: 'arts', instruments: 'arts',
  culture: 'arts', culture_b1: 'arts', history: 'arts',
  religion: 'arts', celebrations: 'society',

  // ── СМИ и общение ── (media + communication merged)
  media: 'media', media_news_b1: 'media', media_culture: 'media', media_modern: 'media',
  communication_b1: 'media', language: 'media',

  // ── Психология ── (psychology + philosophy merged)
  psychology: 'psychology', psychology_b1: 'psychology', psychology_mindset_b1: 'psychology',
  philosophy: 'psychology', ethics: 'psychology',

  // ── Технологии ──
  technology: 'technology', technology_b1: 'technology', technology_digital_b1: 'technology',

  // ── Наука ──
  science: 'science', science_b1: 'science', science_research_b1: 'science', materials: 'science',

  // ── Глаголы ── (все типы)
  verbs: 'verbs', verbs_b1: 'verbs', verbs_b1_extra: 'verbs', verbs_basic: 'verbs',
  verbs_extra: 'verbs', verbs_advanced: 'verbs', verbs_advanced_b1: 'verbs',
  verbs_movement: 'verbs', verbs_communication: 'verbs',
  verbs_opinion: 'verbs', verbs_opinion_extra: 'verbs',
  reflexive_verbs: 'verbs', reflexive_verbs_basic: 'verbs', reflexive_verbs_extra: 'verbs',

  // ── Прилагательные и описания ── (adjectives + adverbs + descriptions merged)
  adjectives: 'adjectives', adjectives_b1: 'adjectives', adjectives_b1_extra: 'adjectives',
  adjectives_extra: 'adjectives', adjectives_complex: 'adjectives',
  adjectives_b1_description: 'adjectives',
  adverbs: 'adjectives', adverbs_b1: 'adjectives',
  descriptions: 'adjectives', description: 'adjectives',

  // ── Выражения ── (expressions + abstract nouns)
  expressions: 'expressions', expressions_b1: 'expressions',
  expressions_faire: 'expressions', phrases_b1_extra: 'expressions',
  abstract_nouns: 'expressions', abstract_nouns_b1: 'expressions', nouns_b1_extra: 'expressions',

  // ── Связки → объединены с Выражениями ──
  connectors: 'expressions', connectors_b1: 'expressions',
  connectors_discourse_b1: 'expressions', connectors_formal: 'expressions',
  linking_words: 'expressions', prepositions: 'expressions',
};

function normalizeCategory(cat: string): string {
  return CATEGORY_REMAP[cat] ?? cat;
}

// Manual CEFR level corrections applied after seeding.
// Source: DELF A1–B2 official vocabulary lists + FLELex (UCLouvain corpus)
// These override whatever level the seed files assign.
const LEVEL_CORRECTIONS: Record<string, 'A1' | 'A2' | 'B1' | 'B2'> = {
  // ── A1 → A2 ── (not survival vocab, officially A2 in DELF curricula)
  'accordéon': 'A2', 'clarinette': 'A2', 'harpe': 'A2',
  'saxophone': 'A2', 'tambour': 'A2', 'trompette': 'A2', 'brumeux': 'A2',

  // ── A2 → B1 ── Politics (civic discourse — DELF B1 theme)
  'citoyen': 'B1', 'démocratie': 'B1', 'gouvernement': 'B1',
  'impôt': 'B1', 'ministre': 'B1', 'parlement': 'B1', 'parti': 'B1',
  // A2 → B1: Environment (technical DELF B1 "développement durable")
  'biodiversité': 'B1', 'combustible': 'B1', 'durabilité': 'B1',
  'empreinte carbone': 'B1', 'extinction': 'B1',
  // A2 → B1: Science (academic register — school subjects B1)
  'atome': 'B1', 'chimie': 'B1', 'formule': 'B1', 'gravité': 'B1', 'laboratoire': 'B1',
  // A2 → B1: Connectors (formal discourse markers — DELF B1 writing)
  'néanmoins': 'B1', 'toutefois': 'B1', 'en outre': 'B1', "d'ailleurs": 'B1',
  'en revanche': 'B1', 'par conséquent': 'B1', "d'une part... d'autre part": 'B1',
  'cependant': 'B1', 'notamment': 'B1',
  // A2 → B1: Economy (business register — DELF B1 professional topics)
  'bénéfice': 'B1', 'concurrence': 'B1', 'investissement': 'B1',
  'recrutement': 'B1', 'stratégie': 'B1', 'rapport': 'B1', 'responsable': 'B1',
  // A2 → B1: Stats / Banking
  'statistique': 'B1', 'taux': 'B1', 'le taux de change': 'B1', 'le virement': 'B1',
  // A2 → B1: Arts
  "le chef-d'œuvre": 'B1', "l'opéra": 'B1',

  // ── B2 → B1 ── Health (essential French social system — DELF B1 "santé")
  'la mutuelle': 'B1', 'la sécurité sociale': 'B1', 'le médecin traitant': 'B1',
  'le spécialiste': 'B1', 'la vaccination': 'B1', 'la pandémie': 'B1', 'le dépistage': 'B1',
  // B2 → B1: Economy (universally known in France)
  'la TVA': 'B1', 'le PIB': 'B1', 'la mondialisation': 'B1', 'la start-up': 'B1',
  'la startup': 'B1', 'le management': 'B1', "le chiffre d'affaires": 'B1',
  "l'investissement": 'B1', 'le salaire minimum': 'B1',
  // B2 → B1: Politics (news vocabulary — DELF B1 current events)
  'la corruption': 'B1', 'la propagande': 'B1', 'les réfugiés': 'B1',
  'le réfugié': 'B1', 'le référendum': 'B1', "l'ONG": 'B1', 'les sanctions': 'B1',
  "l'ambassade": 'B1', "l'ambassadeur": 'B1',
  // B2 → B1: Psychology (everyday discourse in French)
  'la procrastination': 'B1', 'la souffrance': 'B1', 'la morale': 'B1',
  'le deuil': 'B1', 'le dilemme': 'B1', 'le trauma': 'B1', 'la vulnérabilité': 'B1',
  // B2 → B1: Science (secondary school level)
  'la molécule': 'B1', 'la photosynthèse': 'B1', 'la sélection naturelle': 'B1',
  'la chaîne alimentaire': 'B1', 'la probabilité': 'B1', 'la statistique': 'B1', 'le neurone': 'B1',
  // B2 → B1: Society (core French social concepts — DELF B1 "vie en société")
  'la solidarité': 'B1', 'la migration': 'B1', 'la laïcité': 'B1', 'la précarité': 'B1',
  'le harcèlement moral': 'B1', 'le harcèlement sexuel': 'B1',
  'le sans-abri': 'B1', 'le bénévole': 'B1', 'le SDF (sans domicile fixe)': 'B1',
  'la parité': 'B1', 'le congé parental': 'B1', 'la revendication': 'B1',
  // B2 → B1: Sports (basic reporting vocabulary)
  'la blessure': 'B1', "la médaille d'or": 'B1', 'les Jeux olympiques': 'B1',
  'le dopage': 'B1', 'la compétition': 'B1', 'le classement': 'B1', 'la finale': 'B1',
  // B2 → B1: Technology (modern everyday vocabulary)
  'le logiciel': 'B1', 'la voiture électrique': 'B1', 'la réalité virtuelle': 'B1',
  // B2 → B1: Work (common French workplace)
  'le burn-out': 'B1', 'les ressources humaines': 'B1', "l'entretien d'embauche": 'B1',
  'le candidat': 'B1', "l'intérim": 'B1', 'la productivité': 'B1', 'le recrutement': 'B1',
  // B2 → B1: Home / Geography / Environment
  'le HLM (habitation à loyer modéré)': 'B1', 'la colocation': 'B1',
  'la métropole': 'B1', 'la forêt tropicale': 'B1', 'le col': 'B1',
  'le changement climatique': 'B1', 'le greenwashing': 'B1',

  // ── B1 → A2 ── (too common to be B1 — appear in A2 DELF texts)
  'la paix': 'A2', 'le respect': 'A2', 'la crise': 'A2', 'la décision': 'A2',

  // ── B1 → B2 ── (overestimated in B1 files — specialized vocabulary)
  'la gentrification': 'B2', 'actionnaire': 'B2', 'déficitaire': 'B2',
};

// C1+ words accidentally placed in B2 files — deactivated after seeding
const DEACTIVATE_WORDS = new Set([
  'la mécanique quantique',
  'le nihilisme',
  'la dialectique',
  'la métaphysique',
  "l'ontologie",
  'la Cour de cassation',
  'imprescriptible',
  'se pourvoir en cassation',
  'la dissonance cognitive',
  'la phénoménologie',
  "l'épistémologie",
  "l'herméneutique",
  'le solipsisme',
  'le dogmatisme',
  'le logocentrisme',
  'la téléologie',
  "l'eschatologie",
  'le déterminisme',
  "l'empirisme transcendantal",
  'la scolastique',
]);

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
        level: sql`excluded.level`,
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
  // Upsert by slug — re-seeding overwrites titles/content/order, but keeps
  // user-progress rows (they reference topic_id, which is preserved).
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
      .onConflictDoUpdate({
        target: grammarTopics.slug,
        set: {
          titleRu: topic.titleRu,
          titleEn: topic.titleEn,
          titleFr: topic.titleFr,
          level,
          category: topic.category,
          orderNum: topic.orderNum,
          content: topic.content,
          contentEn: topic.contentEn ?? null,
        },
      });
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
  // Words seeded in REVERSE CEFR order (B2→B1→A2→A1) so that each word
  // ends up at its LOWEST mentioned level — simpler vocab always wins.

  // ===== Words B2 (first — lowest priority) =====
  console.log('Seeding words B2...');
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

  // ===== Words A2 =====
  console.log('\nSeeding words A2...');
  const a2Rows = buildWordRows([...wordsA2, ...wordsA2Extra, ...wordsA2Extra2, ...wordsA2Extra3, ...wordsA2Extra4, ...wordsA2Extra5, ...wordsA2Extra6] as WordInput[], 'A2');
  await seedWordsBatch(a2Rows, 'A2 words');
  console.log(`Words A2 done! Total: ${a2Rows.length}`);

  // ===== Words A1 (last — highest priority, always wins) =====
  console.log('\nSeeding words A1...');
  const a1Rows = buildWordRows([...wordsA1, ...wordsA1Extra, ...wordsA1Extra2, ...wordsA1Extra3, ...wordsA1Extra4, ...wordsA1Extra5] as WordInput[], 'A1');
  await seedWordsBatch(a1Rows, 'A1 words');
  console.log(`Words A1 done! Total: ${a1Rows.length}`);

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

  // Merge all batches per level — seedGrammarExercises deletes-then-inserts
  // by topic, so a topic appearing in multiple batches would lose its earlier
  // exercises. Single combined call avoids that.
  await seedGrammarExercises(
    [...grammarExercisesA1, ...grammarExercisesA1Extra, ...grammarExercisesA1Extra2, ...grammarExercisesA1Extra3],
    slugToId,
    'A1 exercises (combined)',
  );
  await seedGrammarExercises(
    [...grammarExercisesA2, ...grammarExercisesA2Extra, ...grammarExercisesA2Extra2],
    slugToId,
    'A2 exercises (combined)',
  );

  console.log('\nSeeding grammar topics B1...');
  await seedGrammarTopics([...grammarTopicsB1, ...grammarTopicsB1Extra], 'B1');
  console.log(`Grammar topics B1 done! Total: ${grammarTopicsB1.length + grammarTopicsB1Extra.length}`);

  // Refresh slugToId to include B1 topics
  const topicRowsB1 = await db.select({ id: grammarTopics.id, slug: grammarTopics.slug }).from(grammarTopics);
  const slugToIdB1 = new Map(topicRowsB1.map((r) => [r.slug, r.id]));

  console.log('\nSeeding grammar exercises B1...');
  await seedGrammarExercises(
    [...grammarExercisesB1, ...grammarExercisesB1Extra],
    slugToIdB1,
    'B1 exercises (combined)',
  );

  console.log('\nSeeding grammar topics B2...');
  await seedGrammarTopics([...grammarTopicsB2, ...grammarTopicsB2Extra, ...grammarTopicsB2Extra2], 'B2');
  console.log(`Grammar topics B2 done! Total: ${grammarTopicsB2.length + grammarTopicsB2Extra.length + grammarTopicsB2Extra2.length}`);

  // Refresh slugToId to include B2 topics
  const topicRowsB2 = await db.select({ id: grammarTopics.id, slug: grammarTopics.slug }).from(grammarTopics);
  const slugToIdB2 = new Map(topicRowsB2.map((r) => [r.slug, r.id]));

  console.log('\nSeeding grammar exercises B2...');
  await seedGrammarExercises(
    [...grammarExercisesB2, ...grammarExercisesB2Extra, ...grammarExercisesB2Extra2],
    slugToIdB2,
    'B2 exercises (combined)',
  );

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

  // ===== Apply manual CEFR level corrections =====
  console.log('\nApplying CEFR level corrections...');
  let corrected = 0;
  for (const [french, level] of Object.entries(LEVEL_CORRECTIONS)) {
    await db.update(words).set({ level }).where(eq(words.french, french));
    corrected++;
  }
  console.log(`Applied ${corrected} level corrections.`);

  // ===== Apply category corrections (split merged categories back into specific ones) =====
  console.log('\nApplying category corrections...');

  // Calendar words: split from 'time' into dedicated 'calendar' category
  const CALENDAR_WORDS = [
    'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche',
    'janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août',
    'septembre', 'octobre', 'novembre', 'décembre',
    'le printemps', "l'été", "l'automne", "l'hiver", 'la saison',
    "l'année", 'le mois', 'la semaine', 'agenda',
    'annuel', 'hebdomadaire', 'mensuel', 'quotidien', 'semestre', 'trimestre',
    'décennie', 'siècle', 'le siècle',
  ];
  await db.update(words).set({ category: 'calendar' }).where(inArray(words.french, CALENDAR_WORDS));

  // Color words: ensure dedicated 'colors' category even if seed file used 'adjectives'
  const COLOR_WORDS = [
    'blanc', 'bleu', 'jaune', 'noir', 'rouge', 'vert', 'orange', 'violet', 'rose',
    'gris', 'marron', 'beige', 'bordeaux', 'brun', 'roux', 'argenté', 'doré', 'blond', 'foncé',
  ];
  await db.update(words).set({ category: 'colors' }).where(inArray(words.french, COLOR_WORDS));

  // Animal words: ensure dedicated 'animals' category
  const ANIMAL_WORDS = [
    'canard', 'chat', 'le chat', 'cheval', 'chien', 'le chien', 'cochon', 'éléphant',
    'grenouille', 'lapin', 'lion', "l'animal", "l'oiseau", 'loup', 'mouton', 'oiseau',
    'ours', 'papillon', 'poisson', 'renard', 'serpent', 'singe', 'tigre', 'vache',
    'faune', 'la faune',
  ];
  await db.update(words).set({ category: 'animals' }).where(inArray(words.french, ANIMAL_WORDS));

  // Weather words: ensure dedicated 'weather' category (not 'nature')
  const WEATHER_WORDS = [
    'chaleur', 'ciel', 'le ciel', 'couvert', 'frais', 'humide', 'la neige', 'la pluie',
    'le nuage', 'le soleil', 'le vent', 'neigeux', 'orageux', 'pluvieux', 'sec', 'venteux',
    'arc-en-ciel', 'brumeux', 'canicule', 'degré', 'ensoleillé', 'foudre', 'gel', 'humidité',
    'il fait beau', 'il fait chaud', 'il fait froid', 'il neige', 'il pleut', 'inondation',
    'la météo', 'la température', 'le brouillard', 'météo', 'nuageux', 'prévision', 'sécheresse',
    'la sécheresse', 'tempête', 'verglas', 'le séisme', "l'éruption volcanique", "l'inondation",
    'tremblement de terre',
  ];
  await db.update(words).set({ category: 'weather' }).where(inArray(words.french, WEATHER_WORDS));

  // Ecology words: ensure 'environment' category (not 'nature')
  const ECOLOGY_WORDS = [
    'la biodiversité', 'la conservation', 'déforestation', 'la déforestation',
    'la ressource naturelle', "l'écosystème", 'le développement durable',
    "l'effet de serre", "l'empreinte carbone", "l'énergie éolienne", "l'énergie solaire",
    'le réchauffement climatique', 'polluer', 'préserver', 'protection de la nature',
    'reboisement', 'pollinisation', 'flore', 'la flore',
  ];
  await db.update(words).set({ category: 'environment' }).where(inArray(words.french, ECOLOGY_WORDS));

  // Fix misplaced word
  await db.update(words).set({ category: 'body' }).where(eq(words.french, 'les cheveux'));

  console.log('Category corrections applied.');

  // ===== Deactivate C1+ words misplaced in B2 files =====
  console.log('\nDeactivating C1+ words from B2 files...');
  const deactivateList = [...DEACTIVATE_WORDS];
  await db
    .update(words)
    .set({ isActive: false })
    .where(inArray(words.french, deactivateList));
  console.log(`Deactivated ${deactivateList.length} C1+ words.`);

  // ===== Writing prompts =====
  console.log('\nSeeding writing prompts...');
  for (const prompt of writingPromptsData) {
    await db
      .insert(writingPrompts)
      .values({
        slug: prompt.slug,
        titleRu: prompt.titleRu,
        titleEn: prompt.titleEn,
        level: prompt.level,
        writingType: prompt.writingType,
        promptFr: prompt.promptFr,
        promptRu: prompt.promptRu,
        promptEn: prompt.promptEn,
        tipsRu: prompt.tipsRu,
        tipsEn: prompt.tipsEn,
        minWords: prompt.minWords,
        maxWords: prompt.maxWords,
        requiredElements: prompt.requiredElements,
      })
      .onConflictDoUpdate({
        target: writingPrompts.slug,
        set: {
          titleRu: prompt.titleRu,
          titleEn: prompt.titleEn,
          promptFr: prompt.promptFr,
          promptRu: prompt.promptRu,
          promptEn: prompt.promptEn,
          tipsRu: prompt.tipsRu,
          tipsEn: prompt.tipsEn,
          minWords: prompt.minWords,
          maxWords: prompt.maxWords,
        },
      });
  }
  console.log(`Writing prompts done! Total: ${writingPromptsData.length}`);

  // ===== Reading vocabulary (words found in reading texts, missing from main DB) =====
  console.log('\nSeeding reading vocabulary...');
  let readingWordsAdded = 0;
  for (const w of wordsReading) {
    const result = await db
      .insert(words)
      .values({
        french: w.french,
        translation: w.translation,
        level: w.level,
        category: 'vocabulary',
        partOfSpeech: w.partOfSpeech,
        gender: w.gender ?? null,
      })
      .onConflictDoNothing();
    if ((result.rowCount ?? 0) > 0) readingWordsAdded++;
  }
  console.log(`  Reading vocabulary: ${readingWordsAdded} new words added (${wordsReading.length} total)`);

  // ===== Reading texts =====
  console.log('\nSeeding reading texts...');
  for (const rt of readingTextsData) {
    await db
      .insert(readingTexts)
      .values({
        slug: rt.slug,
        title: rt.title,
        level: rt.level,
        topic: rt.topic,
        contentFr: rt.contentFr,
        wordMap: rt.wordMap,
        questions: rt.questions,
        estimatedMinutes: rt.estimatedMinutes,
      })
      .onConflictDoUpdate({
        target: readingTexts.slug,
        set: {
          title: rt.title,
          contentFr: rt.contentFr,
          wordMap: rt.wordMap,
          questions: rt.questions,
          estimatedMinutes: rt.estimatedMinutes,
        },
      });
    console.log(`  Reading: ${rt.slug}`);
  }
  console.log(`Reading texts done! Total: ${readingTextsData.length}`);

  console.log('\nAll seed complete!');
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
