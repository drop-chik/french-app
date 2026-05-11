import { eq, and, count, sql, inArray } from 'drizzle-orm';
import type { DB } from '../../db/index.js';
import {
  users,
  userAchievements,
  wordProgress,
  grammarProgress,
  listeningProgress,
  conversationSessions,
  readingProgress,
} from '../../db/schema/index.js';
import { ACHIEVEMENTS, type AchievementMetric, type AchievementDef } from './registry.js';
import { describeProgress, levelFromXp } from './xp.js';

export interface UserMetrics {
  wordsMastered: number;
  wordsLearning: number;
  streakDays: number;
  grammarCompleted: number;
  listeningCompleted: number;
  conversationsCount: number;
  readingTextsCompleted: number;
  correctAnswersTotal: number;
  totalXp: number;
}

const ZERO_METRICS: UserMetrics = {
  wordsMastered: 0,
  wordsLearning: 0,
  streakDays: 0,
  grammarCompleted: 0,
  listeningCompleted: 0,
  conversationsCount: 0,
  readingTextsCompleted: 0,
  correctAnswersTotal: 0,
  totalXp: 0,
};

/**
 * Fetch every metric the achievement engine cares about in one round of
 * queries. `streakDays` is passed in explicitly because the streak calc lives
 * in profile.service and we don't want a circular import.
 */
export async function collectMetrics(
  db: DB,
  userId: string,
  opts: { streakDays?: number } = {},
): Promise<UserMetrics> {
  const [
    masteredRow,
    learningRow,
    grammarRow,
    listeningRow,
    convRow,
    readingRow,
    correctRow,
    userRow,
  ] = await Promise.all([
    db.select({ cnt: count() }).from(wordProgress)
      .where(and(eq(wordProgress.userId, userId), eq(wordProgress.status, 'mastered'))),
    db.select({ cnt: count() }).from(wordProgress)
      .where(eq(wordProgress.userId, userId)),
    db.select({ cnt: count() }).from(grammarProgress)
      .where(and(eq(grammarProgress.userId, userId), eq(grammarProgress.status, 'completed'))),
    db.select({ cnt: count() }).from(listeningProgress)
      .where(and(eq(listeningProgress.userId, userId), eq(listeningProgress.completed, true))),
    db.select({ cnt: count() }).from(conversationSessions)
      .where(eq(conversationSessions.userId, userId)),
    db.select({ cnt: count() }).from(readingProgress)
      .where(eq(readingProgress.userId, userId)),
    db.select({ total: sql<number>`coalesce(sum(${wordProgress.correctCount}), 0)` })
      .from(wordProgress).where(eq(wordProgress.userId, userId)),
    db.query.users.findFirst({ where: eq(users.id, userId), columns: { xp: true } }),
  ]);

  return {
    ...ZERO_METRICS,
    wordsMastered: Number(masteredRow[0]?.cnt ?? 0),
    wordsLearning: Number(learningRow[0]?.cnt ?? 0),
    streakDays: opts.streakDays ?? 0,
    grammarCompleted: Number(grammarRow[0]?.cnt ?? 0),
    listeningCompleted: Number(listeningRow[0]?.cnt ?? 0),
    conversationsCount: Number(convRow[0]?.cnt ?? 0),
    readingTextsCompleted: Number(readingRow[0]?.cnt ?? 0),
    correctAnswersTotal: Number(correctRow[0]?.total ?? 0),
    totalXp: userRow?.xp ?? 0,
  };
}

/**
 * Given a metrics snapshot, return the IDs of achievements whose threshold is
 * met. Pure function — easy to test, no DB.
 */
export function evaluateAchievements(metrics: UserMetrics): string[] {
  const earned: string[] = [];
  for (const a of ACHIEVEMENTS) {
    if (metrics[a.metric as keyof UserMetrics] >= a.threshold) {
      earned.push(a.id);
    }
  }
  return earned;
}

/**
 * Returns IDs the user already has unlocked.
 */
export async function getUnlockedIds(db: DB, userId: string): Promise<Set<string>> {
  const rows = await db
    .select({ id: userAchievements.achievementId })
    .from(userAchievements)
    .where(eq(userAchievements.userId, userId));
  return new Set(rows.map((r) => r.id));
}

/**
 * Check all metrics, persist any newly-earned achievements, return their full
 * AchievementDef objects so callers can react (e.g. toast).
 */
export async function checkAndAwardAchievements(
  db: DB,
  userId: string,
  metrics: UserMetrics,
): Promise<AchievementDef[]> {
  const earnedIds = evaluateAchievements(metrics);
  if (earnedIds.length === 0) return [];

  const alreadyUnlocked = await getUnlockedIds(db, userId);
  const newlyUnlocked = earnedIds.filter((id) => !alreadyUnlocked.has(id));
  if (newlyUnlocked.length === 0) return [];

  // Bulk insert. ON CONFLICT DO NOTHING — race-safe.
  await db
    .insert(userAchievements)
    .values(newlyUnlocked.map((id) => ({ userId, achievementId: id })))
    .onConflictDoNothing();

  return ACHIEVEMENTS.filter((a) => newlyUnlocked.includes(a.id));
}

/**
 * Add XP to the user. Returns the new total and whether the user just leveled up.
 */
export async function awardXp(
  db: DB,
  userId: string,
  amount: number,
): Promise<{ totalXp: number; level: number; leveledUp: boolean }> {
  if (amount <= 0) {
    const u = await db.query.users.findFirst({ where: eq(users.id, userId), columns: { xp: true } });
    const xp = u?.xp ?? 0;
    return { totalXp: xp, level: levelFromXp(xp), leveledUp: false };
  }

  const before = await db.query.users.findFirst({
    where: eq(users.id, userId),
    columns: { xp: true },
  });
  const oldXp = before?.xp ?? 0;
  const oldLevel = levelFromXp(oldXp);
  const newXp = oldXp + amount;
  const newLevel = levelFromXp(newXp);

  await db.update(users).set({ xp: newXp }).where(eq(users.id, userId));

  return { totalXp: newXp, level: newLevel, leveledUp: newLevel > oldLevel };
}

/**
 * Combined helper called from action handlers (answer a word, submit a topic,
 * etc.). Awards XP, then re-evaluates achievements. Best-effort: never throw
 * to the caller — the gamification layer must not break user-facing flows.
 */
export async function recordAction(
  db: DB,
  userId: string,
  xpDelta: number,
  opts: { streakDays?: number } = {},
): Promise<{
  totalXp: number;
  level: number;
  leveledUp: boolean;
  newlyUnlocked: AchievementDef[];
}> {
  try {
    const xp = await awardXp(db, userId, xpDelta);
    const metrics = await collectMetrics(db, userId, opts);
    metrics.totalXp = xp.totalXp;
    const newlyUnlocked = await checkAndAwardAchievements(db, userId, metrics);
    return { ...xp, newlyUnlocked };
  } catch (err) {
    console.error('[achievements] recordAction failed (non-fatal):', err);
    return { totalXp: 0, level: 1, leveledUp: false, newlyUnlocked: [] };
  }
}

/**
 * Build the full catalog response for the achievements page: every entry with
 * a flag indicating whether it's unlocked, and the user's current progress
 * toward the threshold.
 */
export async function getAchievementsForUser(
  db: DB,
  userId: string,
  metrics: UserMetrics,
) {
  const unlocked = await getUnlockedIds(db, userId);
  const unlockedTimes = await db
    .select({ id: userAchievements.achievementId, at: userAchievements.unlockedAt })
    .from(userAchievements)
    .where(and(
      eq(userAchievements.userId, userId),
      inArray(userAchievements.achievementId, [...unlocked]),
    ));
  const timeMap = new Map(unlockedTimes.map((r) => [r.id, r.at]));

  return ACHIEVEMENTS.map((a) => {
    const current = metrics[a.metric as keyof UserMetrics] ?? 0;
    const isUnlocked = unlocked.has(a.id);
    return {
      id: a.id,
      category: a.category,
      icon: a.icon,
      rarity: a.rarity,
      titleRu: a.titleRu,
      titleEn: a.titleEn,
      descRu: a.descRu,
      descEn: a.descEn,
      metric: a.metric,
      threshold: a.threshold,
      current: Math.min(current, a.threshold),
      pct: a.threshold > 0 ? Math.min(100, Math.round((current / a.threshold) * 100)) : 100,
      unlocked: isUnlocked,
      unlockedAt: timeMap.get(a.id) ?? null,
    };
  });
}

/** Summary stats for the profile XP bar — single round trip. */
export async function getXpSummary(db: DB, userId: string) {
  const u = await db.query.users.findFirst({
    where: eq(users.id, userId),
    columns: { xp: true },
  });
  const xp = u?.xp ?? 0;
  return describeProgress(xp);
}
