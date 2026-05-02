import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  integer,
  decimal,
  boolean,
  pgEnum,
  jsonb,
  index,
  unique,
  customType,
} from 'drizzle-orm/pg-core';

const bytea = customType<{ data: Buffer; driverData: Buffer }>({
  dataType() { return 'bytea'; },
});

// Enums
export const languageLevelEnum = pgEnum('language_level', ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']);
export const wordStatusEnum = pgEnum('word_status', ['new', 'learning', 'review', 'mastered']);
export const grammarTopicStatusEnum = pgEnum('grammar_topic_status', [
  'locked',
  'available',
  'in_progress',
  'completed',
]);
export const exerciseTypeEnum = pgEnum('exercise_type', [
  'fill_blank',
  'multiple_choice',
  'reorder',
  'translate',
]);

// Users
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).unique().notNull(),
  password: varchar('password', { length: 255 }),
  name: varchar('name', { length: 255 }).notNull(),
  level: languageLevelEnum('level').default('A1').notNull(),
  avatarUrl: text('avatar_url'),
  uiLanguage: varchar('ui_language', { length: 10 }).default('ru').notNull(),
  placementTestDone: boolean('placement_test_done').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// OAuth accounts (for future Google login)
export const oauthAccounts = pgTable(
  'oauth_accounts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    provider: varchar('provider', { length: 50 }).notNull(),
    providerId: varchar('provider_id', { length: 255 }).notNull(),
  },
  (t) => [unique().on(t.provider, t.providerId)],
);

// Words content (A1-B2 vocabulary)
export const words = pgTable(
  'words',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    french: varchar('french', { length: 255 }).notNull(),
    translation: varchar('translation', { length: 255 }).notNull(),
    level: languageLevelEnum('level').notNull(),
    category: varchar('category', { length: 100 }).notNull(),
    // Part of speech: verb / noun / adjective / adverb / preposition / conjunction / number / pronoun / expression
    partOfSpeech: varchar('part_of_speech', { length: 20 }).default('noun').notNull(),
    // Grammatical gender for nouns: 'm' or 'f' (null for non-nouns or ambiguous l' words)
    gender: varchar('gender', { length: 1 }),
    // Approximate rank in French frequency corpus (1 = most common). Lower → easier/more important.
    frequencyRank: integer('frequency_rank'),
    // Slug of the grammar topic this word illustrates (links word ↔ grammar)
    grammarTag: varchar('grammar_tag', { length: 100 }),
    // Soft-delete: set false to hide word from sessions without losing progress data
    isActive: boolean('is_active').default(true).notNull(),
    exampleFr: text('example_fr'),
    exampleRu: text('example_ru'),
    translationEn: varchar('translation_en', { length: 255 }),
    exampleEn: text('example_en'),
    audioUrl: varchar('audio_url', { length: 500 }),
    imageUrl: varchar('image_url', { length: 500 }),
    imageGenerating: boolean('image_generating').default(false).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (t) => [
    unique('uq_words_french').on(t.french),
    index('idx_words_level_category').on(t.level, t.category),
    index('idx_words_level_pos').on(t.level, t.partOfSpeech),
    index('idx_words_frequency').on(t.level, t.frequencyRank),
    index('idx_words_active').on(t.isActive, t.level, t.frequencyRank),
  ],
);

// Word learning progress per user (SRS data)
export const wordProgress = pgTable(
  'word_progress',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    wordId: uuid('word_id')
      .notNull()
      .references(() => words.id, { onDelete: 'cascade' }),
    status: wordStatusEnum('status').default('new').notNull(),
    easinessFactor: decimal('easiness_factor', { precision: 4, scale: 2 })
      .default('2.50')
      .notNull(),
    interval: integer('interval').default(0).notNull(),
    repetitions: integer('repetitions').default(0).notNull(),
    nextReview: timestamp('next_review').defaultNow().notNull(),
    lastReviewed: timestamp('last_reviewed'),
    correctCount: integer('correct_count').default(0).notNull(),
    incorrectCount: integer('incorrect_count').default(0).notNull(),
  },
  (t) => [
    unique().on(t.userId, t.wordId),
    index('idx_word_progress_next_review').on(t.userId, t.nextReview),
    index('idx_word_progress_status').on(t.userId, t.status),
  ],
);

// Grammar topics content
export const grammarTopics = pgTable(
  'grammar_topics',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    slug: varchar('slug', { length: 100 }).unique().notNull(),
    titleRu: varchar('title_ru', { length: 255 }).notNull(),
    titleEn: varchar('title_en', { length: 255 }),
    titleFr: varchar('title_fr', { length: 255 }).notNull(),
    level: languageLevelEnum('level').notNull(),
    category: varchar('category', { length: 100 }).notNull(),
    orderNum: integer('order_num').notNull(),
    content: jsonb('content').notNull(),
    contentEn: jsonb('content_en'),
  },
  (t) => [index('idx_grammar_topics_level').on(t.level, t.orderNum)],
);

// Grammar exercises
export const grammarExercises = pgTable('grammar_exercises', {
  id: uuid('id').primaryKey().defaultRandom(),
  topicId: uuid('topic_id')
    .notNull()
    .references(() => grammarTopics.id, { onDelete: 'cascade' }),
  type: exerciseTypeEnum('type').notNull(),
  question: jsonb('question').notNull(),
  answer: jsonb('answer').notNull(),
  explanation: text('explanation'),
  explanationEn: text('explanation_en'),
});

// Grammar progress per user
export const grammarProgress = pgTable(
  'grammar_progress',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    topicId: uuid('topic_id')
      .notNull()
      .references(() => grammarTopics.id, { onDelete: 'cascade' }),
    status: grammarTopicStatusEnum('status').default('locked').notNull(),
    score: integer('score').default(0).notNull(),
    attempts: integer('attempts').default(0).notNull(),
    completedAt: timestamp('completed_at'),
  },
  (t) => [unique().on(t.userId, t.topicId)],
);

// Listening exercises
export const listeningExercises = pgTable('listening_exercises', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: varchar('title', { length: 255 }).notNull(),
  level: languageLevelEnum('level').notNull(),
  audioUrl: varchar('audio_url', { length: 500 }).notNull(),
  audioData: bytea('audio_data'),
  transcript: text('transcript').notNull(),
  questions: jsonb('questions').notNull(),
  durationSec: integer('duration_sec').notNull(),
});

// Listening progress
export const listeningProgress = pgTable(
  'listening_progress',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    exerciseId: uuid('exercise_id')
      .notNull()
      .references(() => listeningExercises.id, { onDelete: 'cascade' }),
    completed: boolean('completed').default(false).notNull(),
    score: integer('score'),
    completedAt: timestamp('completed_at'),
  },
  (t) => [unique().on(t.userId, t.exerciseId)],
);

// AI conversation sessions
export const conversationSessions = pgTable('conversation_sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  topic: varchar('topic', { length: 255 }).notNull(),
  level: languageLevelEnum('level').notNull(),
  messages: jsonb('messages').default([]).notNull(),
  startedAt: timestamp('started_at').defaultNow().notNull(),
  endedAt: timestamp('ended_at'),
});

// Placement tests
export const placementTests = pgTable('placement_tests', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  answers: jsonb('answers').notNull(),
  resultLevel: languageLevelEnum('result_level').notNull(),
  completedAt: timestamp('completed_at').defaultNow().notNull(),
});
