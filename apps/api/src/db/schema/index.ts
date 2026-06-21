import { sql } from 'drizzle-orm';
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
  uniqueIndex,
  customType,
  char,
  primaryKey,
} from 'drizzle-orm/pg-core';

// Postgres BYTEA — used by tts_cache to store generated MP3 bytes inline.
// node-postgres returns Buffer for bytea by default; on insert we pass a
// Buffer and let the driver bind it as bytea.
const bytea = customType<{ data: Buffer; default: false; notNull: true }>({
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
  // Timestamp when the user clicked the confirmation link from their email.
  // NULL = pending verification. Reset to NULL if the user changes their email.
  emailVerifiedAt: timestamp('email_verified_at'),
  password: varchar('password', { length: 255 }),
  name: varchar('name', { length: 255 }).notNull(),
  level: languageLevelEnum('level').default('A1').notNull(),
  avatarUrl: text('avatar_url'),
  uiLanguage: varchar('ui_language', { length: 10 }).default('ru').notNull(),
  placementTestDone: boolean('placement_test_done').default(false).notNull(),
  // 'user' (default) | 'admin' — gates the /admin panel and /admin API.
  role: varchar('role', { length: 20 }).default('user').notNull(),
  // Unique public @handle (e.g. "kraid-7f2a"). Backfilled in 0019 for
  // existing users; new users get one at registration. Editable in profile.
  tag: varchar('tag', { length: 30 }).unique().notNull(),
  streakRepairUsedAt: timestamp('streak_repair_used_at'),
  streakRepairSavedValue: integer('streak_repair_saved_value').default(0),
  xp: integer('xp').default(0).notNull(),
  // Per-user session size — defaults match Anki/Memrise common practice.
  dailyNewWordsLimit: integer('daily_new_words_limit').default(10).notNull(),
  dailyDueWordsLimit: integer('daily_due_words_limit').default(20).notNull(),
  // Weekly recap email — defaults ON, user can opt out from profile settings.
  // last_digest_sent_at lets the cron skip recently-emailed users when the
  // job retries on partial failure.
  digestEnabled: boolean('digest_enabled').default(true).notNull(),
  lastDigestSentAt: timestamp('last_digest_sent_at'),
  // Distributed-brute-force defence. /auth/login already rate-limits per-IP
  // (10/min), but an attacker on a botnet can rotate IPs to dodge that.
  // We track failures per *account* (email→user) and lock the account
  // after LOCKOUT_THRESHOLD failures in LOCKOUT_WINDOW.
  failedLoginAttempts: integer('failed_login_attempts').default(0).notNull(),
  lastFailedLoginAt: timestamp('last_failed_login_at'),
  lockoutUntil: timestamp('lockout_until'),
  // Optional exam-prep plan. When set, the dashboard surfaces a
  // countdown card and the daily-pace recommendation adjusts so the
  // user lands on the exam date with enough vocabulary mastered. Nullable
  // because most users learn without a fixed deadline.
  examDate: timestamp('exam_date'),
  examType: varchar('exam_type', { length: 10 }), // DELF | DALF | TCF | TEF
  examTargetLevel: languageLevelEnum('exam_target_level'),
  // Smart Credits — universal AI quota across writing/conversation/translation.
  // Single number shown to the user, simpler than per-feature limits.
  // Resets daily; refresh on first read after aiCreditsResetAt < now.
  aiCreditsUsed: integer('ai_credits_used').default(0).notNull(),
  aiCreditsResetAt: timestamp('ai_credits_reset_at').defaultNow().notNull(),
  // Bumped to invalidate all outstanding refresh tokens (password reset/change).
  // Embedded in refresh JWTs as `tv`; /auth/refresh rejects tv != this.
  tokenVersion: integer('token_version').default(0).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Web-push subscriptions — one row per browser/device. Identified by the
// endpoint URL the browser registers. Same user can have many subscriptions
// (laptop + phone). On unsubscribe / 410-Gone we delete the row.
export const pushSubscriptions = pgTable(
  'push_subscriptions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    endpoint: text('endpoint').notNull(),
    p256dh: text('p256dh').notNull(),
    auth: text('auth').notNull(),
    userAgent: varchar('user_agent', { length: 255 }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    lastUsedAt: timestamp('last_used_at'),
  },
  (t) => [
    unique('push_subscriptions_endpoint_uq').on(t.endpoint),
    index('idx_push_subs_user').on(t.userId),
  ],
);

// Achievements: one row per (userId, achievementId) when the user unlocks it.
// The catalog of achievement IDs lives in code (apps/api/src/modules/achievements/registry.ts),
// not in the DB — that way adding new achievements is just a code change.
export const userAchievements = pgTable(
  'user_achievements',
  {
    userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    achievementId: varchar('achievement_id', { length: 60 }).notNull(),
    unlockedAt: timestamp('unlocked_at').defaultNow().notNull(),
  },
  (t) => [
    unique('user_achievements_pk').on(t.userId, t.achievementId),
    index('idx_user_achievements_user').on(t.userId),
  ],
);

// One-time tokens for the "confirm your email" flow (migration 0025).
// Same shape as password-reset tokens — sha256 hashed in DB, expires in 7d.
export const emailVerificationTokens = pgTable(
  'email_verification_tokens',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    tokenHash: varchar('token_hash', { length: 255 }).notNull().unique(),
    expiresAt: timestamp('expires_at').notNull(),
    usedAt: timestamp('used_at'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (t) => [index('idx_email_verification_tokens_user').on(t.userId, t.usedAt)],
);

// One-time tokens for the "forgot password" flow. Raw token is mailed; we
// store only the bcrypt hash. Verified-by-hash, used-by-mark, expires in 1h.
export const passwordResetTokens = pgTable(
  'password_reset_tokens',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    tokenHash: varchar('token_hash', { length: 255 }).notNull().unique(),
    expiresAt: timestamp('expires_at').notNull(),
    usedAt: timestamp('used_at'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (t) => [index('idx_password_reset_tokens_user').on(t.userId, t.usedAt)],
);

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
    // IPA transcription (без слешей). Заполняется батч-скриптом через
    // gpt-4o-mini. Nullable — слова без IPA просто не рендерят строку.
    ipa: text('ipa'),
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
    // Optional cached array of 2-3 extra examples, generated lazily on demand
    // via gpt-4o-mini when the user opens word details and asks for more.
    // Shape: [{fr, ru, en}, ...]. NULL until first request.
    extraExamples: jsonb('extra_examples'),
    audioUrl: varchar('audio_url', { length: 500 }),
    imageUrl: varchar('image_url', { length: 500 }),
    imageGenerating: boolean('image_generating').default(false).notNull(),
    // NULL = global content from the seed; non-NULL = a user's private word.
    // Queries that list words filter to NULL OR equals current user.
    createdByUserId: uuid('created_by_user_id').references(() => users.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (t) => [
    // Uniqueness applies only to GLOBAL words (NULL owner). Custom user words
    // can collide with global french entries.
    uniqueIndex('uq_words_french_global').on(t.french).where(sql`${t.createdByUserId} IS NULL`),
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
    // How the word reached 'mastered': 'srs' (earned via answers), 'manual'
    // (mark/bulk button — excluded from CEFR auto-promotion to stop self-
    // promotion), or NULL (not mastered / legacy rows treated as earned).
    masteredVia: varchar('mastered_via', { length: 10 }),
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
// NOTE: audio_data bytea column exists in DB but is managed via raw SQL
// (not in Drizzle schema to avoid accidental SELECT of large binary data)
export const listeningExercises = pgTable('listening_exercises', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: varchar('title', { length: 255 }).notNull(),
  level: languageLevelEnum('level').notNull(),
  audioUrl: varchar('audio_url', { length: 500 }).notNull(),
  transcript: text('transcript').notNull(),
  questions: jsonb('questions').notNull(),
  durationSec: integer('duration_sec').notNull(),
  // Real per-sentence start times in seconds (monotonic float[]). Populated
  // by a one-off Whisper batch — null on legacy rows; frontend then falls
  // back to its word-weighted estimate.
  sentenceTimestamps: jsonb('sentence_timestamps'),
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

// Drill sets (trainers)
export const drillSets = pgTable('drill_sets', {
  id: uuid('id').primaryKey().defaultRandom(),
  slug: varchar('slug', { length: 100 }).unique().notNull(),
  titleRu: varchar('title_ru', { length: 255 }).notNull(),
  titleEn: varchar('title_en', { length: 255 }).notNull(),
  descriptionRu: text('description_ru').notNull(),
  descriptionEn: text('description_en').notNull(),
  level: languageLevelEnum('level').notNull(),
  category: varchar('category', { length: 100 }).notNull(),
  difficulty: integer('difficulty').notNull(),
  questionCount: integer('question_count').notNull(),
  icon: varchar('icon', { length: 50 }).notNull(),
  // Optional link to a grammar topic — when set, the drill UI shows a
  // "Read the theory" CTA pointing at /grammar/{slug}. References
  // grammarTopics.slug; left unenforced (no FK) so a typo doesn't
  // brick the migration.
  grammarTopicSlug: varchar('grammar_topic_slug', { length: 100 }),
});

// Drill questions
export const drillQuestions = pgTable(
  'drill_questions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    drillSetId: uuid('drill_set_id')
      .notNull()
      .references(() => drillSets.id, { onDelete: 'cascade' }),
    type: exerciseTypeEnum('type').notNull(),
    question: jsonb('question').notNull(),
    answer: jsonb('answer').notNull(),
    explanation: text('explanation'),
  },
  (t) => [index('idx_drill_questions_set').on(t.drillSetId)],
);

// Drill progress per user
export const drillProgress = pgTable(
  'drill_progress',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    drillSetId: uuid('drill_set_id')
      .notNull()
      .references(() => drillSets.id, { onDelete: 'cascade' }),
    bestScore: integer('best_score').default(0).notNull(),
    totalSessions: integer('total_sessions').default(0).notNull(),
    lastPlayedAt: timestamp('last_played_at'),
  },
  (t) => [unique().on(t.userId, t.drillSetId)],
);

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

// ─── Writing feature ────────────────────────────────────────────────────────

export const writingTypeEnum = pgEnum('writing_type', [
  'postcard',
  'message',
  'letter_informal',
  'letter_formal',
  'email',
  'description',
  'blog_article',
  'essay',
  'narrative',
]);

export const submissionStatusEnum = pgEnum('submission_status', [
  'draft',
  'submitted',
]);

// Writing prompts library (seeded)
export const writingPrompts = pgTable(
  'writing_prompts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    slug: varchar('slug', { length: 100 }).unique().notNull(),
    titleRu: varchar('title_ru', { length: 255 }).notNull(),
    titleEn: varchar('title_en', { length: 255 }).notNull(),
    level: languageLevelEnum('level').notNull(),
    writingType: writingTypeEnum('writing_type').notNull(),
    promptRu: text('prompt_ru').notNull(),
    promptEn: text('prompt_en').notNull(),
    promptFr: text('prompt_fr').notNull(),
    tipsRu: jsonb('tips_ru').default([]).notNull(),
    tipsEn: jsonb('tips_en').default([]).notNull(),
    minWords: integer('min_words').notNull(),
    maxWords: integer('max_words').notNull(),
    requiredElements: jsonb('required_elements').default([]).notNull(),
    isActive: boolean('is_active').default(true).notNull(),
    // AI-generated prompt — created on demand by a user via the writing
    // module. NULL/false = curated content shipped with the seed.
    isAiGenerated: boolean('is_ai_generated').default(false).notNull(),
    createdByUserId: uuid('created_by_user_id').references(() => users.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (t) => [
    index('idx_writing_prompts_level').on(t.level, t.writingType),
  ],
);

// User essay submissions
export const writingSubmissions = pgTable(
  'writing_submissions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    promptId: uuid('prompt_id')
      .notNull()
      .references(() => writingPrompts.id),
    content: text('content').notNull(),
    wordCount: integer('word_count').default(0).notNull(),
    level: languageLevelEnum('level').notNull(),
    status: submissionStatusEnum('status').default('draft').notNull(),
    submittedAt: timestamp('submitted_at'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (t) => [
    index('idx_writing_submissions_user').on(t.userId, t.createdAt),
  ],
);

// AI feedback for a submission (one-to-one with submissions)
export const writingFeedback = pgTable('writing_feedback', {
  id: uuid('id').primaryKey().defaultRandom(),
  submissionId: uuid('submission_id')
    .notNull()
    .unique()
    .references(() => writingSubmissions.id, { onDelete: 'cascade' }),
  // DELF rubric scores: { taskCompletion, coherence, vocabulary, grammar, total, maxTotal }
  scores: jsonb('scores').notNull(),
  // [{original, corrected, type, severity, explanation, position?}]
  corrections: jsonb('corrections').default([]).notNull(),
  // {ttr, connectorCount, avgSentenceLen, complexSentenceRatio, errorDensity, tensesUsed}
  metrics: jsonb('metrics').notNull(),
  // [{type, suggestion, reason}]
  suggestions: jsonb('suggestions').default([]).notNull(),
  overallComment: text('overall_comment').notNull(),
  strengths: jsonb('strengths').default([]).notNull(),
  improvements: jsonb('improvements').default([]).notNull(),
  generatedAt: timestamp('generated_at').defaultNow().notNull(),
});

// ─── Reading feature ────────────────────────────────────────────────────────

// Reading texts library (seeded)
export const readingTexts = pgTable(
  'reading_texts',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    slug: varchar('slug', { length: 100 }).notNull().unique(),
    title: varchar('title', { length: 200 }).notNull(),
    level: languageLevelEnum('level').notNull(),
    topic: varchar('topic', { length: 50 }).notNull(),
    contentFr: text('content_fr').notNull(),
    // Record<string, {tr: string, pos: string}> — lowercased word form → translation
    wordMap: jsonb('word_map').notNull(),
    // ReadingQuestion[] — embedded DELF-style questions
    questions: jsonb('questions').notNull(),
    estimatedMinutes: integer('estimated_minutes').notNull().default(3),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (t) => [index('idx_reading_texts_level').on(t.level, t.topic)],
);

// Reading progress per user
export const readingProgress = pgTable(
  'reading_progress',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    textId: uuid('text_id')
      .notNull()
      .references(() => readingTexts.id, { onDelete: 'cascade' }),
    completedAt: timestamp('completed_at'),
    score: integer('score'),
    totalQuestions: integer('total_questions'),
    wordsLookedUp: jsonb('words_looked_up').default([]).notNull(),
    wordsSaved: jsonb('words_saved').default([]).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (t) => [unique().on(t.userId, t.textId)],
);

// Mock-test attempts for reading (DELF-style: 3 texts, ~45 min, 25 pts).
// The DELF reading test trains the timer as much as it tests comprehension.
// A mock pulls 3 active texts at the chosen level, hides correct answers
// until finalize, and stores attempts in history. Server-authoritative
// timing: started_at + time_limit_seconds is the deadline; the server
// rejects late submissions and auto-finalizes overdue attempts.
export const readingMockAttempts = pgTable(
  'reading_mock_attempts',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    level: languageLevelEnum('level').notNull(),
    // Array<string> — text UUIDs in the order presented to the user.
    textIds: jsonb('text_ids').notNull(),
    startedAt: timestamp('started_at').defaultNow().notNull(),
    finalizedAt: timestamp('finalized_at'),
    timeLimitSeconds: integer('time_limit_seconds').notNull().default(2700),
    // Array<{textId, questionId, answer}> — the user's chosen option per
    // question, accumulated as they progress. Stored as text (the option
    // string itself) so we never need to re-fetch the question to interpret it.
    answers: jsonb('answers').notNull().default([]),
    score: integer('score'),
    maxScore: integer('max_score'),
  },
  (t) => [
    index('idx_reading_mock_user_finalized').on(t.userId, t.finalizedAt),
  ],
);

// Listening mock exam (DELF CO) — mirrors reading_mock_attempts.
export const listeningMockAttempts = pgTable(
  'listening_mock_attempts',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    level: languageLevelEnum('level').notNull(),
    // Array<string> — listening-exercise UUIDs in presentation order.
    exerciseIds: jsonb('exercise_ids').notNull(),
    startedAt: timestamp('started_at').defaultNow().notNull(),
    finalizedAt: timestamp('finalized_at'),
    timeLimitSeconds: integer('time_limit_seconds').notNull().default(1500),
    // Array<{exerciseId, questionId, answer}> — chosen option per question.
    answers: jsonb('answers').notNull().default([]),
    score: integer('score'),
    maxScore: integer('max_score'),
  },
  (t) => [
    index('idx_listening_mock_user_finalized').on(t.userId, t.finalizedAt),
  ],
);

// Aggregated writing progress per user
export const writingProgress = pgTable('writing_progress', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: 'cascade' }),
  totalSubmissions: integer('total_submissions').default(0).notNull(),
  avgScore: decimal('avg_score', { precision: 5, scale: 2 }).default('0').notNull(),
  avgWordCount: decimal('avg_word_count', { precision: 6, scale: 1 }).default('0').notNull(),
  // { grammar, vocabulary, coherence, connectors } — 0..100 each
  areaScores: jsonb('area_scores').default({}).notNull(),
  lastWritingAt: timestamp('last_writing_at'),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Server-side cache of OpenAI-generated TTS audio. Key includes voice and
// model so changing either invalidates without serving stale bytes.
export const ttsCache = pgTable('tts_cache', {
  textHash: char('text_hash', { length: 64 }).primaryKey(),
  text: text('text').notNull(),
  voice: varchar('voice', { length: 32 }).notNull(),
  model: varchar('model', { length: 32 }).notNull(),
  audioData: bytea('audio_data').notNull(),
  byteSize: integer('byte_size').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (t) => [
  index('idx_tts_cache_text').on(t.text),
]);

// ─── Social layer ───────────────────────────────────────────────────────────

// Follow graph. Asymmetric (Duolingo-style): follower_id follows followee_id,
// no approval. "Following" = whose activity shows in my feed.
export const follows = pgTable(
  'follows',
  {
    followerId: uuid('follower_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    followeeId: uuid('followee_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.followerId, t.followeeId] }),
    index('idx_follows_followee').on(t.followeeId),
    index('idx_follows_follower').on(t.followerId),
  ],
);

// Activity-feed events. `dedupeKey` + the partial unique index make
// milestone emits (streak/level/achievement) idempotent — recordActivity
// can be called repeatedly without producing duplicate feed rows.
export const activityEvents = pgTable(
  'activity_events',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    // 'joined' | 'achievement' | 'level_up' | 'streak'
    type: varchar('type', { length: 30 }).notNull(),
    payload: jsonb('payload').default({}).notNull(),
    dedupeKey: varchar('dedupe_key', { length: 80 }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (t) => [
    index('idx_activity_user_created').on(t.userId, t.createdAt),
    uniqueIndex('uq_activity_dedupe')
      .on(t.userId, t.type, t.dedupeKey)
      .where(sql`${t.dedupeKey} IS NOT NULL`),
  ],
);

// Reactions (👏) on feed events — one per (event, user).
export const activityReactions = pgTable(
  'activity_reactions',
  {
    eventId: uuid('event_id').notNull().references(() => activityEvents.id, { onDelete: 'cascade' }),
    userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.eventId, t.userId] }),
    index('idx_reactions_event').on(t.eventId),
  ],
);

// Append-only audit log for sensitive operations on users. See
// migration 0028_audit_log.sql for the rationale (queryable history of
// who-did-what when Railway log retention can't help).
export const auditLog = pgTable('audit_log', {
  id: uuid('id').primaryKey().defaultRandom(),
  actorUserId: uuid('actor_user_id').references(() => users.id, { onDelete: 'set null' }),
  action: varchar('action', { length: 64 }).notNull(),
  targetUserId: uuid('target_user_id'),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
