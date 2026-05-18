import bcrypt from 'bcrypt';
import { eq, count, sql, gte, lt, lte, and, or, asc, inArray } from 'drizzle-orm';
import type { DB } from '../../db/index.js';
import { users, words, wordProgress, grammarTopics, grammarProgress, listeningExercises, listeningProgress, conversationSessions } from '../../db/schema/index.js';
import type { LanguageLevel } from '@french-app/shared-types';

const BCRYPT_ROUNDS = 12;

export async function getProfile(db: DB, userId: string) {
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
    columns: {
      id: true,
      email: true,
      name: true,
      level: true,
      avatarUrl: true,
      uiLanguage: true,
      placementTestDone: true,
      role: true,
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
  // Basic validation: must be a data URL image
  if (!avatarDataUrl.startsWith('data:image/')) throw new Error('INVALID_AVATAR');
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

  const wordPct = wordStats.totalWords > 0 ? wordStats.masteredWords / wordStats.totalWords : 0;
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
      totalWords: wordStats.totalWords,
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
    .select({ status: wordProgress.status, nextReview: wordProgress.nextReview })
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
  for (const p of progressAtLevel) {
    if (p.status === 'mastered') mastered++;
    void now;
  }

  const totalWords = Number(totalResult?.cnt ?? 0);
  const newCount = Math.max(0, Math.min(totalWords - progressAtLevel.length, 20));

  return { totalWords, masteredWords: mastered, due, newCount };
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
  const LEVELS = ['A1', 'A2', 'B1', 'B2'] as const;

  const [totals, mastered] = await Promise.all([
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
  ]);

  const totalMap: Record<string, number> = {};
  for (const r of totals) totalMap[r.level] = Number(r.cnt);

  const masteredMap: Record<string, number> = {};
  for (const r of mastered) masteredMap[r.level] = Number(r.cnt);

  return LEVELS.map((level) => {
    const total = totalMap[level] ?? 0;
    const m = masteredMap[level] ?? 0;
    return {
      level,
      masteredWords: m,
      totalWords: total,
      percent: total > 0 ? Math.round((m / total) * 100) : 0,
    };
  });
}
