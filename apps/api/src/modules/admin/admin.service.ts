import { eq, or, ilike, sql, desc, asc, count, max } from 'drizzle-orm';
import type { DB } from '../../db/index.js';
import {
  users, wordProgress,
  grammarProgress, listeningProgress, readingProgress, drillProgress,
  userAchievements,
} from '../../db/schema/index.js';
import {
  getProfile,
  getStats,
  getStreak,
  getCharts,
  getLevelsProgress,
} from '../profile/profile.service.js';
import type { LanguageLevel } from '@french-app/shared-types';

export type UserSort = 'created' | 'lastActive' | 'level' | 'name';

// Paginated user list for the admin table. lastActiveAt = the most recent
// word review (the dominant activity signal); wordsMastered = count of
// mastered progress rows. Search is case-insensitive over name + email.
export async function listUsers(
  db: DB,
  opts: { q?: string; sort?: UserSort; offset?: number; limit?: number },
) {
  const q = opts.q?.trim();
  const limit = Math.min(100, Math.max(1, opts.limit ?? 50));
  const offset = Math.max(0, opts.offset ?? 0);

  const whereClause = q
    ? or(ilike(users.name, `%${q}%`), ilike(users.email, `%${q}%`))
    : undefined;

  const orderBy = (() => {
    switch (opts.sort) {
      case 'level': return [asc(users.level), asc(users.name)];
      case 'name': return [asc(users.name)];
      case 'lastActive': return [desc(sql`last_active`)];
      case 'created':
      default: return [desc(users.createdAt)];
    }
  })();

  const rows = await db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      level: users.level,
      role: users.role,
      xp: users.xp,
      avatarUrl: users.avatarUrl,
      createdAt: users.createdAt,
      lastActive: sql<string | null>`max(${wordProgress.lastReviewed})`.as('last_active'),
      wordsMastered: sql<number>`count(case when ${wordProgress.status} = 'mastered' then 1 end)`,
    })
    .from(users)
    .leftJoin(wordProgress, eq(wordProgress.userId, users.id))
    .where(whereClause)
    .groupBy(users.id)
    .orderBy(...orderBy)
    .limit(limit)
    .offset(offset);

  const [totalRow] = await db
    .select({ total: count() })
    .from(users)
    .where(whereClause);

  return {
    users: rows.map((r) => ({
      ...r,
      wordsMastered: Number(r.wordsMastered ?? 0),
    })),
    total: Number(totalRow?.total ?? 0),
  };
}

// Full per-user detail — this IS the read-only "view as user": everything
// the user themselves would see on their dashboard/profile, reusing the
// existing profile.service aggregates so we never duplicate stat logic.
export async function getUserDetail(db: DB, userId: string) {
  const profile = await getProfile(db, userId).catch(() => null);
  if (!profile) return null;

  const [stats, streak, charts, levels] = await Promise.all([
    getStats(db, userId).catch(() => null),
    getStreak(db, userId).catch(() => null),
    getCharts(db, userId).catch(() => null),
    getLevelsProgress(db, userId).catch(() => null),
  ]);

  const [lastActiveRow] = await db
    .select({ lastActive: max(wordProgress.lastReviewed) })
    .from(wordProgress)
    .where(eq(wordProgress.userId, userId));

  return {
    profile,
    stats,
    streak,
    charts,
    levels,
    lastActiveAt: lastActiveRow?.lastActive ?? null,
  };
}

export async function updateUser(
  db: DB,
  userId: string,
  patch: { level?: LanguageLevel; role?: 'user' | 'admin'; name?: string; email?: string },
) {
  const target = await db.query.users.findFirst({
    where: eq(users.id, userId),
    columns: { id: true, role: true },
  });
  if (!target) throw new Error('USER_NOT_FOUND');

  // Email uniqueness check (mirror profile.service.updateProfile).
  if (patch.email) {
    const clash = await db.query.users.findFirst({
      where: eq(users.email, patch.email),
      columns: { id: true },
    });
    if (clash && clash.id !== userId) throw new Error('EMAIL_TAKEN');
  }

  // Never let the last admin be demoted — otherwise nobody can administer.
  if (patch.role === 'user' && target.role === 'admin') {
    const [adminCount] = await db
      .select({ c: count() })
      .from(users)
      .where(eq(users.role, 'admin'));
    if (Number(adminCount?.c ?? 0) <= 1) {
      throw new Error('LAST_ADMIN');
    }
  }

  const updates: Record<string, unknown> = { updatedAt: new Date() };
  if (patch.level !== undefined) updates['level'] = patch.level;
  if (patch.role !== undefined) updates['role'] = patch.role;
  if (patch.name !== undefined) updates['name'] = patch.name.trim().slice(0, 255);
  if (patch.email !== undefined) updates['email'] = patch.email.trim().toLowerCase();

  const [updated] = await db
    .update(users)
    .set(updates)
    .where(eq(users.id, userId))
    .returning({
      id: users.id,
      email: users.email,
      name: users.name,
      level: users.level,
      role: users.role,
    });
  return updated;
}

// Dangerous — wipes the user's entire learning state across every
// module (vocab SRS, grammar, listening, reading, drills, achievements,
// XP). Used to reset test accounts or help a user start completely
// over. Caller (route) guards with explicit confirmation.
//
// Note: this is COMPREHENSIVE. The earlier version only deleted
// wordProgress, which left grammarProgress/listeningProgress/etc behind
// and produced an inconsistent state where "the dashboard says 5
// grammar topics done but the vocabulary is empty". One audit-driven
// expansion of the cascade.
export async function resetUserProgress(db: DB, userId: string) {
  const wp = await db.delete(wordProgress).where(eq(wordProgress.userId, userId));
  const gp = await db.delete(grammarProgress).where(eq(grammarProgress.userId, userId));
  const lp = await db.delete(listeningProgress).where(eq(listeningProgress.userId, userId));
  const rp = await db.delete(readingProgress).where(eq(readingProgress.userId, userId));
  const dp = await db.delete(drillProgress).where(eq(drillProgress.userId, userId));
  const ua = await db.delete(userAchievements).where(eq(userAchievements.userId, userId));
  // Reset XP + level + placement on the user row itself. Streak is
  // derived from word_progress activity so it resets automatically once
  // wordProgress is gone — no streak column to touch.
  await db.update(users).set({
    xp: 0, level: 'A1', placementTestDone: false,
  }).where(eq(users.id, userId));
  return {
    wordProgress: wp.rowCount ?? 0,
    grammarProgress: gp.rowCount ?? 0,
    listeningProgress: lp.rowCount ?? 0,
    readingProgress: rp.rowCount ?? 0,
    drillProgress: dp.rowCount ?? 0,
    userAchievements: ua.rowCount ?? 0,
  };
}

