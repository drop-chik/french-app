import bcrypt from 'bcrypt';
import { eq, count, sql, gte, lt, lte, and, or, asc, inArray } from 'drizzle-orm';
import type { DB } from '../../db/index.js';
import {
  users, words, wordProgress, grammarTopics, grammarProgress,
  listeningExercises, listeningProgress, conversationSessions,
  readingProgress, writingSubmissions, writingFeedback, writingPrompts,
  drillProgress, placementTests, userAchievements, pushSubscriptions,
  follows, activityEvents, activityReactions,
} from '../../db/schema/index.js';
import type { LanguageLevel } from '@french-app/shared-types';
import { targetForLevel } from '../../lib/level-targets.js';

const BCRYPT_ROUNDS = 12;

export async function getProfile(db: DB, userId: string) {
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
    columns: {
      id: true,
      email: true,
      emailVerifiedAt: true,
      name: true,
      level: true,
      avatarUrl: true,
      uiLanguage: true,
      placementTestDone: true,
      role: true,
      tag: true,
      dailyNewWordsLimit: true,
      dailyDueWordsLimit: true,
      createdAt: true,
    },
  });
  if (!user) throw new Error('USER_NOT_FOUND');
  return user;
}

export async function updateProfile(
  db: DB,
  userId: string,
  data: {
    name?: string;
    email?: string;
    uiLanguage?: string;
    tag?: string;
    dailyNewWordsLimit?: number;
    dailyDueWordsLimit?: number;
  },
) {
  // Check email uniqueness if changing
  if (data.email) {
    const existing = await db.query.users.findFirst({
      where: eq(users.email, data.email),
      columns: { id: true },
    });
    if (existing && existing.id !== userId) throw new Error('EMAIL_TAKEN');
  }

  // Validate + dedupe the public @tag. Normalize to lowercase first; the
  // regex enforces 3..30 chars, alnum ends, [a-z0-9_-] inside.
  let normalizedTag: string | undefined;
  if (data.tag !== undefined) {
    normalizedTag = data.tag.trim().toLowerCase();
    if (!/^[a-z0-9](?:[a-z0-9_-]{1,28}[a-z0-9])$/.test(normalizedTag)) {
      throw new Error('INVALID_TAG');
    }
    const taken = await db.query.users.findFirst({
      where: eq(users.tag, normalizedTag),
      columns: { id: true },
    });
    if (taken && taken.id !== userId) throw new Error('TAG_TAKEN');
  }

  // Clamp session limits to sensible bounds: 1..100 new, 1..200 due
  const newLimit = data.dailyNewWordsLimit !== undefined
    ? Math.max(1, Math.min(100, Math.round(data.dailyNewWordsLimit)))
    : undefined;
  const dueLimit = data.dailyDueWordsLimit !== undefined
    ? Math.max(1, Math.min(200, Math.round(data.dailyDueWordsLimit)))
    : undefined;

  const [updated] = await db
    .update(users)
    .set({
      ...(data.name !== undefined && { name: data.name }),
      ...(data.email !== undefined && { email: data.email }),
      ...(data.uiLanguage !== undefined && { uiLanguage: data.uiLanguage }),
      ...(normalizedTag !== undefined && { tag: normalizedTag }),
      ...(newLimit !== undefined && { dailyNewWordsLimit: newLimit }),
      ...(dueLimit !== undefined && { dailyDueWordsLimit: dueLimit }),
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId))
    .returning({
      id: users.id,
      email: users.email,
      name: users.name,
      level: users.level,
      avatarUrl: users.avatarUrl,
      uiLanguage: users.uiLanguage,
      placementTestDone: users.placementTestDone,
      tag: users.tag,
      dailyNewWordsLimit: users.dailyNewWordsLimit,
      dailyDueWordsLimit: users.dailyDueWordsLimit,
    });

  if (!updated) throw new Error('USER_NOT_FOUND');
  return updated;
}

export async function updatePassword(
  db: DB,
  userId: string,
  currentPassword: string,
  newPassword: string,
) {
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
    columns: { password: true },
  });
  if (!user || !user.password) throw new Error('INVALID_CREDENTIALS');

  const valid = await bcrypt.compare(currentPassword, user.password);
  if (!valid) throw new Error('INVALID_CREDENTIALS');

  const hashed = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
  await db.update(users).set({ password: hashed, updatedAt: new Date() }).where(eq(users.id, userId));
}

export async function updateAvatar(db: DB, userId: string, avatarDataUrl: string) {
  // Strict MIME whitelist — only the raster formats every browser renders
  // safely inside <img>. Rejecting svg etc. blocks the embedded-JS XSS
  // surface if the avatar is ever rendered outside an <img> element
  // (e.g. dragged into an Open Graph card).
  if (!/^data:image\/(png|jpeg|jpg|webp|gif);base64,/i.test(avatarDataUrl)) {
    throw new Error('INVALID_AVATAR');
  }
  // Limit size (base64 ~1.33× original, so 1MB base64 ≈ 750KB image)
  if (avatarDataUrl.length > 1_400_000) throw new Error('AVATAR_TOO_LARGE');

  const [updated] = await db
    .update(users)
    .set({ avatarUrl: avatarDataUrl, updatedAt: new Date() })
    .where(eq(users.id, userId))
    .returning({ avatarUrl: users.avatarUrl });

  return updated;
}

export async function getStats(db: DB, userId: string) {
  // Words stats
  const wordStats = await db
    .select({
      status: wordProgress.status,
      cnt: count(),
    })
    .from(wordProgress)
    .where(eq(wordProgress.userId, userId))
    .groupBy(wordProgress.status);

  const wordCounts = { new: 0, learning: 0, review: 0, mastered: 0 };
  for (const row of wordStats) {
    wordCounts[row.status as keyof typeof wordCounts] = Number(row.cnt);
  }
  const totalWords = Object.values(wordCounts).reduce((a, b) => a + b, 0);

  // Fast "Выучено" metric — at least one correct answer (repetitions ≥ 1).
  // Derived from the existing SM-2 counter, which resets to 0 on a wrong
  // answer — so this matches "currently remembered" not "ever seen", and the
  // count drops if you fail a previously-learned word. Day-1 wins: a fresh
  // session gives instant progress. No schema change.
  const [learnedResult] = await db
    .select({ cnt: count() })
    .from(wordProgress)
    .where(and(eq(wordProgress.userId, userId), gte(wordProgress.repetitions, 1)));
  const wordsLearned = Number(learnedResult?.cnt ?? 0);

  // Grammar stats
  const grammarStats = await db
    .select({ status: grammarProgress.status, cnt: count() })
    .from(grammarProgress)
    .where(eq(grammarProgress.userId, userId))
    .groupBy(grammarProgress.status);

  const grammarCounts = { locked: 0, available: 0, in_progress: 0, completed: 0 };
  for (const row of grammarStats) {
    grammarCounts[row.status as keyof typeof grammarCounts] = Number(row.cnt);
  }

  // Listening stats
  const [listeningResult] = await db
    .select({ completed: count() })
    .from(listeningProgress)
    .where(eq(listeningProgress.userId, userId));

  // Conversation stats
  const [convResult] = await db
    .select({ total: count() })
    .from(conversationSessions)
    .where(eq(conversationSessions.userId, userId));

  // Correct / incorrect answers total
  const [[correctResult], [incorrectResult]] = await Promise.all([
    db.select({ total: sql<number>`coalesce(sum(${wordProgress.correctCount}), 0)` })
      .from(wordProgress).where(eq(wordProgress.userId, userId)),
    db.select({ total: sql<number>`coalesce(sum(${wordProgress.incorrectCount}), 0)` })
      .from(wordProgress).where(eq(wordProgress.userId, userId)),
  ]);

  // Weekly trend: words reviewed this week vs previous week
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

  const [thisWeekResult, lastWeekResult] = await Promise.all([
    db.select({ cnt: count() }).from(wordProgress)
      .where(and(eq(wordProgress.userId, userId), gte(wordProgress.lastReviewed, weekAgo))),
    db.select({ cnt: count() }).from(wordProgress)
      .where(and(
        eq(wordProgress.userId, userId),
        gte(wordProgress.lastReviewed, twoWeeksAgo),
        lt(wordProgress.lastReviewed, weekAgo),
      )),
  ]);

  const thisWeek = Number(thisWeekResult[0]?.cnt ?? 0);
  const lastWeek = Number(lastWeekResult[0]?.cnt ?? 0);
  const weekTrend: number | null = lastWeek > 0
    ? Math.round(((thisWeek - lastWeek) / lastWeek) * 100)
    : (thisWeek > 0 ? 100 : null);

  // Words due for review today (nextReview <= now)
  const [dueResult] = await db
    .select({ cnt: count() })
    .from(wordProgress)
    .where(and(
      eq(wordProgress.userId, userId),
      lte(wordProgress.nextReview, now),
    ));
  const wordsDueToday = Number(dueResult?.cnt ?? 0);

  return {
    words: {
      total: totalWords,
      mastered: wordCounts.mastered,
      learned: wordsLearned,
      learning: wordCounts.learning + wordCounts.review,
      new: wordCounts.new,
    },
    grammar: {
      completed: grammarCounts.completed,
      inProgress: grammarCounts.in_progress,
    },
    listening: {
      completed: Number(listeningResult?.completed ?? 0),
    },
    conversations: Number(convResult?.total ?? 0),
    correctAnswers: Number(correctResult?.total ?? 0),
    incorrectAnswers: Number(incorrectResult?.total ?? 0),
    weekReviews: thisWeek,
    weekTrend,
    wordsDueToday,
  };
}

export function _calcStreakFromDates(dates: string[]): number {
  let streak = 0;
  let prevDate: Date | null = null;
  for (const dateStr of dates) {
    const d = new Date(dateStr + 'T00:00:00Z');
    if (prevDate === null) {
      streak = 1;
      prevDate = d;
    } else {
      const diffDays = Math.round((prevDate.getTime() - d.getTime()) / 86_400_000);
      if (diffDays === 1) { streak++; prevDate = d; }
      else break;
    }
  }
  return streak;
}

// Daily streak: consecutive days with at least one word reviewed
export async function getStreak(db: DB, userId: string): Promise<{
  streak: number;
  todayCompleted: boolean;
  repairAvailable: boolean;
  savedStreak: number;
  last7Days: { date: string; active: boolean }[];
}> {
  const [user, rows] = await Promise.all([
    db.query.users.findFirst({
      where: eq(users.id, userId),
      columns: { streakRepairUsedAt: true, streakRepairSavedValue: true },
    }),
    db
      .select({ day: sql<string>`to_char(DATE(${wordProgress.lastReviewed}), 'YYYY-MM-DD')` })
      .from(wordProgress)
      .where(and(eq(wordProgress.userId, userId), sql`${wordProgress.lastReviewed} IS NOT NULL`))
      .groupBy(sql`DATE(${wordProgress.lastReviewed})`)
      .orderBy(sql`DATE(${wordProgress.lastReviewed}) DESC`),
  ]);

  const dates = rows.map((r) => r.day).filter(Boolean) as string[];

  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().slice(0, 10);
  const twoDaysAgo = new Date(today);
  twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
  const twoDaysAgoStr = twoDaysAgo.toISOString().slice(0, 10);

  const todayCompleted = dates[0] === todayStr;

  // Repair is "active" if used within last 48 hours → inject yesterday as virtual study day
  const repairUsedRecently = user?.streakRepairUsedAt
    ? (Date.now() - user.streakRepairUsedAt.getTime()) < 48 * 3_600_000
    : false;

  let effectiveDates = dates;
  if (repairUsedRecently && !dates.includes(yesterdayStr)) {
    const dateSet = new Set([...dates, yesterdayStr]);
    effectiveDates = Array.from(dateSet).sort().reverse();
  }

  const streakAlive =
    effectiveDates.length > 0 &&
    (effectiveDates[0] === todayStr || effectiveDates[0] === yesterdayStr);

  const streak = streakAlive ? _calcStreakFromDates(effectiveDates) : 0;

  // Repair available: streak just broke (most recent real date was 2 days ago),
  // cooldown expired (30 days since last use or never used)
  const streakJustBroke = dates.length > 0 && dates[0] === twoDaysAgoStr;
  const cooldownOver =
    !user?.streakRepairUsedAt ||
    Date.now() - user.streakRepairUsedAt.getTime() > 30 * 24 * 3_600_000;
  const repairAvailable = streakJustBroke && cooldownOver && !repairUsedRecently;
  const savedStreak = repairAvailable ? _calcStreakFromDates(dates) : (user?.streakRepairSavedValue ?? 0);

  // Build last 7 days array (from 6 days ago to today)
  const dateSet = new Set(dates);
  const last7Days: { date: string; active: boolean }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().slice(0, 10);
    last7Days.push({ date: dateStr, active: dateSet.has(dateStr) });
  }

  return { streak, todayCompleted, repairAvailable, savedStreak, last7Days };
}

export async function repairStreak(db: DB, userId: string): Promise<{ ok: boolean; newStreak: number }> {
  const [user, rows] = await Promise.all([
    db.query.users.findFirst({
      where: eq(users.id, userId),
      columns: { streakRepairUsedAt: true },
    }),
    db
      .select({ day: sql<string>`to_char(DATE(${wordProgress.lastReviewed}), 'YYYY-MM-DD')` })
      .from(wordProgress)
      .where(and(eq(wordProgress.userId, userId), sql`${wordProgress.lastReviewed} IS NOT NULL`))
      .groupBy(sql`DATE(${wordProgress.lastReviewed})`)
      .orderBy(sql`DATE(${wordProgress.lastReviewed}) DESC`),
  ]);

  if (!user) throw new Error('USER_NOT_FOUND');

  // 30-day cooldown
  if (user.streakRepairUsedAt) {
    const daysSince = (Date.now() - user.streakRepairUsedAt.getTime()) / (24 * 3_600_000);
    if (daysSince < 30) throw new Error('REPAIR_COOLDOWN');
  }

  const dates = rows.map((r) => r.day).filter(Boolean) as string[];
  const twoDaysAgo = new Date();
  twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
  const twoDaysAgoStr = twoDaysAgo.toISOString().slice(0, 10);

  if (!dates[0] || dates[0] !== twoDaysAgoStr) throw new Error('NO_BROKEN_STREAK');

  const savedStreak = _calcStreakFromDates(dates);

  await db
    .update(users)
    .set({ streakRepairUsedAt: new Date(), streakRepairSavedValue: savedStreak, updatedAt: new Date() })
    .where(eq(users.id, userId));

  return { ok: true, newStreak: savedStreak };
}

// Charts data: last 90 days of activity
export async function getCharts(db: DB, userId: string) {
  const since = new Date();
  since.setDate(since.getDate() - 89);
  since.setHours(0, 0, 0, 0);

  // Daily reviews: group by date of lastReviewed
  const reviewRows = await db
    .select({
      day: sql<string>`to_char(${wordProgress.lastReviewed}, 'YYYY-MM-DD')`,
      reviewed: count(),
      correct: sql<number>`coalesce(sum(${wordProgress.correctCount}), 0)`,
      incorrect: sql<number>`coalesce(sum(${wordProgress.incorrectCount}), 0)`,
    })
    .from(wordProgress)
    .where(
      and(
        eq(wordProgress.userId, userId),
        gte(wordProgress.lastReviewed, since),
      ),
    )
    .groupBy(sql`to_char(${wordProgress.lastReviewed}, 'YYYY-MM-DD')`);

  // Build 90-day array
  const activityMap = new Map(reviewRows.map((r) => [r.day, r]));
  const activity: Array<{ date: string; reviewed: number; correct: number; incorrect: number }> = [];

  for (let i = 89; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().slice(0, 10);
    const row = activityMap.get(dateStr);
    activity.push({
      date: dateStr,
      reviewed: row ? Number(row.reviewed) : 0,
      correct: row ? Number(row.correct) : 0,
      incorrect: row ? Number(row.incorrect) : 0,
    });
  }

  // Words mastered over time: count by status snapshot (simplified — total mastered now)
  // Word progress breakdown for donut
  const statusRows = await db
    .select({ status: wordProgress.status, cnt: count() })
    .from(wordProgress)
    .where(eq(wordProgress.userId, userId))
    .groupBy(wordProgress.status);

  const statusMap: Record<string, number> = {};
  for (const r of statusRows) {
    statusMap[r.status] = Number(r.cnt);
  }

  // Accuracy per week (last 4 weeks)
  const weeklyRows = await db
    .select({
      week: sql<string>`to_char(date_trunc('week', ${wordProgress.lastReviewed}), 'YYYY-MM-DD')`,
      correct: sql<number>`coalesce(sum(${wordProgress.correctCount}), 0)`,
      incorrect: sql<number>`coalesce(sum(${wordProgress.incorrectCount}), 0)`,
    })
    .from(wordProgress)
    .where(
      and(
        eq(wordProgress.userId, userId),
        gte(wordProgress.lastReviewed, new Date(Date.now() - 28 * 24 * 60 * 60 * 1000)),
      ),
    )
    .groupBy(sql`date_trunc('week', ${wordProgress.lastReviewed})`);

  const weekly = weeklyRows.map((r) => ({
    week: r.week,
    correct: Number(r.correct),
    incorrect: Number(r.incorrect),
    accuracy: r.correct + r.incorrect > 0
      ? Math.round((Number(r.correct) / (Number(r.correct) + Number(r.incorrect))) * 100)
      : 0,
  }));

  return { activity, statusBreakdown: statusMap, weekly };
}

// Home dashboard: aggregated data for the main page
export async function getHomeData(db: DB, userId: string, level: LanguageLevel, lang: 'ru' | 'en' = 'ru') {
  const [streak, wordStats, grammarData, listeningData] = await Promise.all([
    getStreak(db, userId),
    _getWordStats(db, userId, level),
    _getGrammarData(db, userId, level, lang),
    _getListeningData(db, userId, level),
  ]);

  // Level-progress bar uses the fast "Выучено" metric and is scaled against
  // the mastery target, not the raw DB total. With ~1859 A1 words, dividing
  // by total gave learners glacial bar movement; the target (1000 for A1)
  // is the real fluency threshold — extra words remain as enrichment but
  // don't gate progression.
  const wordTarget = targetForLevel(level);
  const wordPct = wordTarget > 0 ? Math.min(wordStats.learnedWords / wordTarget, 1) : 0;
  const grammarPct = grammarData.total > 0 ? grammarData.completed / grammarData.total : 0;
  const listeningPct = listeningData.total > 0 ? listeningData.completed / listeningData.total : 0;
  const levelPercent = Math.round((wordPct * 0.5 + grammarPct * 0.3 + listeningPct * 0.2) * 100);

  return {
    streak: streak.streak,
    todayCompleted: streak.todayCompleted,
    levelProgress: {
      level,
      percent: levelPercent,
      masteredWords: wordStats.masteredWords,
      learnedWords: wordStats.learnedWords,
      totalWords: wordStats.totalWords,
      targetWords: wordTarget,
      completedGrammar: grammarData.completed,
      totalGrammar: grammarData.total,
      completedListening: listeningData.completed,
      totalListening: listeningData.total,
    },
    todayPlan: {
      wordsDue: wordStats.due,
      wordsNew: wordStats.newCount,
      nextGrammar: grammarData.next,
      nextListening: listeningData.next,
    },
  };
}

// Levels at or below `current` — matches what getStudySession actually
// includes when picking due reviews. Without this, the sidebar badge
// would only count due words at the user's current level while sessions
// pull from all earlier levels too.
const LEVEL_ORDER: LanguageLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
function _levelsUpTo(level: LanguageLevel): LanguageLevel[] {
  const idx = LEVEL_ORDER.indexOf(level);
  return LEVEL_ORDER.slice(0, idx + 1);
}

async function _getWordStats(db: DB, userId: string, level: LanguageLevel) {
  // Total / mastered counts stay scoped to the user's CURRENT level — that's
  // what the level-progress UI reflects.
  const [totalResult] = await db
    .select({ cnt: count() })
    .from(words)
    .where(eq(words.level, level));

  const progressAtLevel = await db
    .select({
      status: wordProgress.status,
      nextReview: wordProgress.nextReview,
      repetitions: wordProgress.repetitions,
    })
    .from(wordProgress)
    .innerJoin(words, eq(wordProgress.wordId, words.id))
    .where(and(eq(wordProgress.userId, userId), eq(words.level, level)));

  // Due count is across ALL allowed levels (current and below), so it
  // matches what a learning session actually pulls. Previously the badge
  // would show, say, "2" while the session served 14 reviews — confusing.
  const allowedLevels = _levelsUpTo(level);
  const dueRowsAll = await db
    .select({ id: wordProgress.id })
    .from(wordProgress)
    .innerJoin(words, eq(wordProgress.wordId, words.id))
    .where(and(
      eq(wordProgress.userId, userId),
      lte(wordProgress.nextReview, new Date()),
      or(...allowedLevels.map((l) => eq(words.level, l))),
    ));
  const due = dueRowsAll.length;

  const now = new Date();
  let mastered = 0;
  let learned = 0;
  for (const p of progressAtLevel) {
    if (p.status === 'mastered') mastered++;
    if (p.repetitions >= 1) learned++;
    void now;
  }

  const totalWords = Number(totalResult?.cnt ?? 0);
  const newCount = Math.max(0, Math.min(totalWords - progressAtLevel.length, 20));

  return { totalWords, masteredWords: mastered, learnedWords: learned, due, newCount };
}

async function _getGrammarData(db: DB, userId: string, level: LanguageLevel, lang: 'ru' | 'en') {
  const topics = await db
    .select({ id: grammarTopics.id, slug: grammarTopics.slug, titleRu: grammarTopics.titleRu, titleEn: grammarTopics.titleEn, orderNum: grammarTopics.orderNum })
    .from(grammarTopics)
    .where(eq(grammarTopics.level, level))
    .orderBy(asc(grammarTopics.orderNum));

  if (topics.length === 0) return { total: 0, completed: 0, next: null };

  const progressRecords = await db
    .select({ topicId: grammarProgress.topicId, status: grammarProgress.status })
    .from(grammarProgress)
    .where(eq(grammarProgress.userId, userId));

  const progressMap = new Map(progressRecords.map((p) => [p.topicId, p.status]));

  let completed = 0;
  let next: { slug: string; title: string; status: string } | null = null;

  for (let i = 0; i < topics.length; i++) {
    const topic = topics[i]!;
    const status = progressMap.get(topic.id) ?? (i === 0 ? 'available' : 'locked');
    if (status === 'completed') completed++;
    if (!next && (status === 'in_progress' || status === 'available')) {
      next = {
        slug: topic.slug,
        title: lang === 'en' ? (topic.titleEn ?? topic.titleRu) : topic.titleRu,
        status,
      };
    }
  }

  return { total: topics.length, completed, next };
}

async function _getListeningData(db: DB, userId: string, level: LanguageLevel) {
  const exercises = await db
    .select({ id: listeningExercises.id, title: listeningExercises.title, durationSec: listeningExercises.durationSec })
    .from(listeningExercises)
    .where(eq(listeningExercises.level, level));

  if (exercises.length === 0) return { total: 0, completed: 0, next: null };

  const completedRecords = await db
    .select({ exerciseId: listeningProgress.exerciseId })
    .from(listeningProgress)
    .where(and(eq(listeningProgress.userId, userId), eq(listeningProgress.completed, true)));

  const completedSet = new Set(completedRecords.map((r) => r.exerciseId));
  const completed = exercises.filter((e) => completedSet.has(e.id)).length;
  const nextExercise = exercises.find((e) => !completedSet.has(e.id)) ?? null;

  return {
    total: exercises.length,
    completed,
    next: nextExercise ? { id: nextExercise.id, title: nextExercise.title, durationSec: nextExercise.durationSec } : null,
  };
}

export async function getLevelsProgress(db: DB, userId: string) {
  const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as const;

  const [totals, mastered, learned] = await Promise.all([
    db
      .select({ level: words.level, cnt: count() })
      .from(words)
      .where(and(eq(words.isActive, true), inArray(words.level, [...LEVELS])))
      .groupBy(words.level),
    db
      .select({ level: words.level, cnt: count() })
      .from(wordProgress)
      .innerJoin(words, eq(wordProgress.wordId, words.id))
      .where(
        and(
          eq(wordProgress.userId, userId),
          eq(wordProgress.status, 'mastered'),
          inArray(words.level, [...LEVELS]),
        ),
      )
      .groupBy(words.level),
    db
      .select({ level: words.level, cnt: count() })
      .from(wordProgress)
      .innerJoin(words, eq(wordProgress.wordId, words.id))
      .where(
        and(
          eq(wordProgress.userId, userId),
          gte(wordProgress.repetitions, 1),
          inArray(words.level, [...LEVELS]),
        ),
      )
      .groupBy(words.level),
  ]);

  const totalMap: Record<string, number> = {};
  for (const r of totals) totalMap[r.level] = Number(r.cnt);

  const masteredMap: Record<string, number> = {};
  for (const r of mastered) masteredMap[r.level] = Number(r.cnt);

  const learnedMap: Record<string, number> = {};
  for (const r of learned) learnedMap[r.level] = Number(r.cnt);

  return LEVELS.map((level) => {
    const total = totalMap[level] ?? 0;
    const m = masteredMap[level] ?? 0;
    const l = learnedMap[level] ?? 0;
    const target = targetForLevel(level);
    return {
      level,
      masteredWords: m,
      learnedWords: l,
      totalWords: total,
      targetWords: target,
      // Percent is keyed off "learned" (the fast metric) against the mastery
      // target, not the raw total. Extra words past the target stay in the
      // pool as enrichment but don't slow the bar.
      percent: target > 0 ? Math.min(Math.round((l / target) * 100), 100) : 0,
    };
  });
}

// ── GDPR Article 15: right of access ────────────────────────────────────────
//
// Returns ALL personal data we hold about a single user, in JSON. Includes:
//   - profile fields
//   - learning progress (words, grammar, listening, reading, writing, drills)
//   - placement test history
//   - conversation sessions (we DON'T export message content — message rows
//     are huge and the conversation itself is on the OpenAI side; we just
//     list session metadata so the user knows what was created on their
//     account)
//   - social graph (follows in/out)
//   - activity events the user authored, reactions they gave
//   - push subscriptions (endpoints — not the encryption keys)
//   - achievements unlocked
//   - custom words the user added to their personal dictionary
//
// Heavy binary blobs (audio_data, image bytes) are intentionally excluded —
// the user can re-fetch them from the live URLs.
export async function exportUserData(db: DB, userId: string) {
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
    // Explicit columns — never accidentally include the password hash.
    columns: {
      id: true, email: true, name: true, level: true, avatarUrl: true,
      uiLanguage: true, placementTestDone: true, role: true, tag: true,
      dailyNewWordsLimit: true, dailyDueWordsLimit: true,
      xp: true,
      streakRepairUsedAt: true, streakRepairSavedValue: true,
      createdAt: true, updatedAt: true,
    },
  });
  if (!user) throw new Error('USER_NOT_FOUND');

  // Pull everything in parallel — it's small enough not to hurt the DB.
  const [
    wordProgressRows,
    grammarProgressRows,
    listeningProgressRows,
    readingProgressRows,
    writingSubmissionRows,
    writingFeedbackRows,
    writingPromptRows,
    drillProgressRows,
    placementHistoryRows,
    achievementRows,
    pushRows,
    followingRows,
    followerRows,
    activityRows,
    reactionRows,
    customWordRows,
    conversationRows,
  ] = await Promise.all([
    db.select().from(wordProgress).where(eq(wordProgress.userId, userId)),
    db.select().from(grammarProgress).where(eq(grammarProgress.userId, userId)),
    db.select().from(listeningProgress).where(eq(listeningProgress.userId, userId)),
    db.select().from(readingProgress).where(eq(readingProgress.userId, userId)),
    db.select().from(writingSubmissions).where(eq(writingSubmissions.userId, userId)),
    // Writing feedback joined to submissions implicitly through the
    // foreign key — fetch all rows whose submission belongs to the user.
    db
      .select()
      .from(writingFeedback)
      .innerJoin(writingSubmissions, eq(writingFeedback.submissionId, writingSubmissions.id))
      .where(eq(writingSubmissions.userId, userId)),
    db.select().from(writingPrompts).where(eq(writingPrompts.createdByUserId, userId)),
    db.select().from(drillProgress).where(eq(drillProgress.userId, userId)),
    db.select().from(placementTests).where(eq(placementTests.userId, userId)),
    db.select().from(userAchievements).where(eq(userAchievements.userId, userId)),
    // Push subscriptions — strip encryption keys, only keep endpoint URL +
    // metadata so the user sees what device tokens they granted.
    db.select({
      id: pushSubscriptions.id,
      endpoint: pushSubscriptions.endpoint,
      createdAt: pushSubscriptions.createdAt,
    }).from(pushSubscriptions).where(eq(pushSubscriptions.userId, userId)),
    db.select().from(follows).where(eq(follows.followerId, userId)),
    db.select().from(follows).where(eq(follows.followeeId, userId)),
    db.select().from(activityEvents).where(eq(activityEvents.userId, userId)),
    db.select().from(activityReactions).where(eq(activityReactions.userId, userId)),
    db.select().from(words).where(eq(words.createdByUserId, userId)),
    db.select({
      id: conversationSessions.id,
      topic: conversationSessions.topic,
      level: conversationSessions.level,
      startedAt: conversationSessions.startedAt,
      endedAt: conversationSessions.endedAt,
    }).from(conversationSessions).where(eq(conversationSessions.userId, userId)),
  ]);

  return {
    exportedAt: new Date().toISOString(),
    exportFormatVersion: 1,
    profile: user,
    progress: {
      words: wordProgressRows,
      grammar: grammarProgressRows,
      listening: listeningProgressRows,
      reading: readingProgressRows,
      drills: drillProgressRows,
    },
    writing: {
      submissions: writingSubmissionRows,
      feedback: writingFeedbackRows.map((r) => r.writing_feedback),
      customPrompts: writingPromptRows,
    },
    placementHistory: placementHistoryRows,
    achievements: achievementRows,
    pushSubscriptions: pushRows,
    social: {
      following: followingRows,
      followers: followerRows,
      activity: activityRows,
      reactions: reactionRows,
    },
    customWords: customWordRows,
    conversationSessions: conversationRows,
  };
}

// ── GDPR Article 17: right to erasure ───────────────────────────────────────
//
// Deletes the user row. All related tables use `onDelete: 'cascade'` on
// their user_id foreign keys, so word_progress, grammar_progress,
// listening_progress, reading_progress, writing_*, drill_progress,
// placement_tests, user_achievements, push_subscriptions, follows (both
// directions), activity_events, activity_reactions, oauth_accounts,
// password_reset_tokens, conversation_sessions and the user's custom words
// all vanish in a single statement.
//
// We DON'T delete: shared seed words (created_by_user_id IS NULL), grammar
// topics, reading texts, listening exercises — they're global content. We
// DO delete the user's reactions on someone else's activity (they belong to
// the user). We don't delete other users' activity events that happened to
// be about this user (e.g. someone followed them) — those are owned by the
// other user and form part of THEIR history.
//
// Safety: refuses to delete the last admin. Without this an admin who is
// the sole admin could lock everyone out by self-deleting.
export async function deleteUserAccount(db: DB, userId: string): Promise<void> {
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
    columns: { id: true, role: true },
  });
  if (!user) throw new Error('USER_NOT_FOUND');

  if (user.role === 'admin') {
    const adminCount = await db
      .select({ n: count() })
      .from(users)
      .where(eq(users.role, 'admin'));
    if ((adminCount[0]?.n ?? 0) <= 1) {
      throw new Error('LAST_ADMIN');
    }
  }

  await db.delete(users).where(eq(users.id, userId));
}
