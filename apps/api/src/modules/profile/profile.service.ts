import bcrypt from 'bcrypt';
import { eq, count, sql, gte, and } from 'drizzle-orm';
import type { DB } from '../../db/index.js';
import { users, wordProgress, grammarProgress, listeningProgress, conversationSessions } from '../../db/schema/index.js';

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
      createdAt: true,
    },
  });
  if (!user) throw new Error('USER_NOT_FOUND');
  return user;
}

export async function updateProfile(
  db: DB,
  userId: string,
  data: { name?: string; email?: string; uiLanguage?: string },
) {
  // Check email uniqueness if changing
  if (data.email) {
    const existing = await db.query.users.findFirst({
      where: eq(users.email, data.email),
      columns: { id: true },
    });
    if (existing && existing.id !== userId) throw new Error('EMAIL_TAKEN');
  }

  const [updated] = await db
    .update(users)
    .set({
      ...(data.name !== undefined && { name: data.name }),
      ...(data.email !== undefined && { email: data.email }),
      ...(data.uiLanguage !== undefined && { uiLanguage: data.uiLanguage }),
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

  // Correct answers total
  const [correctResult] = await db
    .select({ total: sql<number>`coalesce(sum(${wordProgress.correctCount}), 0)` })
    .from(wordProgress)
    .where(eq(wordProgress.userId, userId));

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
  };
}

// Daily streak: consecutive days with at least one word reviewed
export async function getStreak(db: DB, userId: string): Promise<{ streak: number; todayCompleted: boolean }> {
  const rows = await db
    .select({ day: sql<string>`to_char(DATE(${wordProgress.lastReviewed}), 'YYYY-MM-DD')` })
    .from(wordProgress)
    .where(and(eq(wordProgress.userId, userId), sql`${wordProgress.lastReviewed} IS NOT NULL`))
    .groupBy(sql`DATE(${wordProgress.lastReviewed})`)
    .orderBy(sql`DATE(${wordProgress.lastReviewed}) DESC`);

  const dates = rows.map((r) => r.day).filter(Boolean);
  if (dates.length === 0) return { streak: 0, todayCompleted: false };

  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().slice(0, 10);

  const todayCompleted = dates[0] === todayStr;

  // Streak is alive only if user has studied today or yesterday
  if (dates[0] !== todayStr && dates[0] !== yesterdayStr) return { streak: 0, todayCompleted: false };

  let streak = 0;
  let prevDate: Date | null = null;

  for (const dateStr of dates) {
    const d = new Date(dateStr + 'T00:00:00Z');
    if (prevDate === null) {
      streak = 1;
      prevDate = d;
    } else {
      const diffDays = Math.round((prevDate.getTime() - d.getTime()) / 86_400_000);
      if (diffDays === 1) {
        streak++;
        prevDate = d;
      } else {
        break;
      }
    }
  }

  return { streak, todayCompleted };
}

// Charts data: last 30 days of activity
export async function getCharts(db: DB, userId: string) {
  const since = new Date();
  since.setDate(since.getDate() - 29);
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

  // Build 30-day array
  const activityMap = new Map(reviewRows.map((r) => [r.day, r]));
  const activity: Array<{ date: string; reviewed: number; correct: number; incorrect: number }> = [];

  for (let i = 29; i >= 0; i--) {
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
