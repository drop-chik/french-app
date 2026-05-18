import { and, eq, ne, or, ilike, inArray, gte, sql, desc, count } from 'drizzle-orm';
import type { DB } from '../../db/index.js';
import {
  users,
  follows,
  activityEvents,
  activityReactions,
  wordProgress,
} from '../../db/schema/index.js';
import {
  getStats,
  getStreak,
  getCharts,
  getLevelsProgress,
} from '../profile/profile.service.js';
import { levelFromXp } from '../achievements/xp.js';
import { sendToUser } from '../push/push.service.js';

export interface UserCard {
  id: string;
  tag: string;
  name: string;
  avatarUrl: string | null;
  level: string;
  xpLevel: number;
  isFollowing: boolean;
}

// ── Search ──────────────────────────────────────────────────────────────────
// Case-insensitive over tag + name, excluding the viewer. Each result carries
// whether the viewer already follows them so the button renders correctly.
export async function searchUsers(
  db: DB,
  viewerId: string,
  q: string,
): Promise<UserCard[]> {
  const term = q.trim();
  if (term.length < 2) return [];

  const rows = await db
    .select({
      id: users.id,
      tag: users.tag,
      name: users.name,
      avatarUrl: users.avatarUrl,
      level: users.level,
      xp: users.xp,
    })
    .from(users)
    .where(
      and(
        ne(users.id, viewerId),
        or(ilike(users.tag, `%${term}%`), ilike(users.name, `%${term}%`)),
      ),
    )
    .orderBy(desc(users.xp))
    .limit(20);

  return decorateWithFollowing(db, viewerId, rows);
}

// ── Public profile ──────────────────────────────────────────────────────────
// Read-only "view their progress". Reuses the profile.service aggregates
// (same as the admin module) but exposes ONLY public fields — never email,
// role, or session limits.
export async function getPublicProfile(db: DB, viewerId: string, tag: string) {
  const target = await db.query.users.findFirst({
    where: eq(users.tag, tag),
    columns: {
      id: true,
      tag: true,
      name: true,
      level: true,
      avatarUrl: true,
      xp: true,
      createdAt: true,
    },
  });
  if (!target) return null;

  const [stats, streak, charts, levels, social, recent] = await Promise.all([
    getStats(db, target.id).catch(() => null),
    getStreak(db, target.id).catch(() => null),
    getCharts(db, target.id).catch(() => null),
    getLevelsProgress(db, target.id).catch(() => null),
    getSocialCounts(db, viewerId, target.id),
    db
      .select({
        id: activityEvents.id,
        type: activityEvents.type,
        payload: activityEvents.payload,
        createdAt: activityEvents.createdAt,
      })
      .from(activityEvents)
      .where(eq(activityEvents.userId, target.id))
      .orderBy(desc(activityEvents.createdAt))
      .limit(20),
  ]);

  return {
    profile: {
      id: target.id,
      tag: target.tag,
      name: target.name,
      level: target.level,
      avatarUrl: target.avatarUrl,
      xpLevel: levelFromXp(target.xp),
      createdAt: target.createdAt,
    },
    stats,
    streak,
    charts,
    levels,
    social,
    recentActivity: recent,
    isSelf: target.id === viewerId,
  };
}

async function getSocialCounts(db: DB, viewerId: string, targetId: string) {
  const [followers, following, mine] = await Promise.all([
    db.select({ c: count() }).from(follows).where(eq(follows.followeeId, targetId)),
    db.select({ c: count() }).from(follows).where(eq(follows.followerId, targetId)),
    db
      .select({ c: count() })
      .from(follows)
      .where(and(eq(follows.followerId, viewerId), eq(follows.followeeId, targetId))),
  ]);
  return {
    followers: Number(followers[0]?.c ?? 0),
    following: Number(following[0]?.c ?? 0),
    isFollowing: Number(mine[0]?.c ?? 0) > 0,
  };
}

// ── Follow / unfollow ───────────────────────────────────────────────────────
// Asymmetric, no approval. Returns isNew so the route only fires a push on a
// genuinely new follow (re-follow is a no-op).
export async function followUser(
  db: DB,
  followerId: string,
  followeeId: string,
): Promise<{ ok: boolean; isNew: boolean }> {
  if (followerId === followeeId) throw new Error('CANNOT_FOLLOW_SELF');

  const target = await db.query.users.findFirst({
    where: eq(users.id, followeeId),
    columns: { id: true },
  });
  if (!target) throw new Error('USER_NOT_FOUND');

  const inserted = await db
    .insert(follows)
    .values({ followerId, followeeId })
    .onConflictDoNothing()
    .returning({ followerId: follows.followerId });

  const isNew = inserted.length > 0;

  // Notify the followee — only on a genuinely new follow. Best-effort.
  if (isNew) {
    try {
      const follower = await db.query.users.findFirst({
        where: eq(users.id, followerId),
        columns: { tag: true },
      });
      if (follower) {
        await sendToUser(db, followeeId, {
          title: 'Новый подписчик',
          body: `@${follower.tag} подписался на вас`,
          url: '/friends',
          tag: 'follow',
        });
      }
    } catch (err) {
      console.error('[social] follow push failed (non-fatal):', err);
    }
  }

  return { ok: true, isNew };
}

export async function unfollowUser(
  db: DB,
  followerId: string,
  followeeId: string,
): Promise<{ ok: boolean }> {
  await db
    .delete(follows)
    .where(and(eq(follows.followerId, followerId), eq(follows.followeeId, followeeId)));
  return { ok: true };
}

// ── Following / followers lists ─────────────────────────────────────────────
export async function getFollowing(db: DB, viewerId: string): Promise<UserCard[]> {
  const rows = await db
    .select({
      id: users.id,
      tag: users.tag,
      name: users.name,
      avatarUrl: users.avatarUrl,
      level: users.level,
      xp: users.xp,
    })
    .from(follows)
    .innerJoin(users, eq(users.id, follows.followeeId))
    .where(eq(follows.followerId, viewerId))
    .orderBy(desc(follows.createdAt));
  return decorateWithFollowing(db, viewerId, rows);
}

export async function getFollowers(db: DB, viewerId: string): Promise<UserCard[]> {
  const rows = await db
    .select({
      id: users.id,
      tag: users.tag,
      name: users.name,
      avatarUrl: users.avatarUrl,
      level: users.level,
      xp: users.xp,
    })
    .from(follows)
    .innerJoin(users, eq(users.id, follows.followerId))
    .where(eq(follows.followeeId, viewerId))
    .orderBy(desc(follows.createdAt));
  return decorateWithFollowing(db, viewerId, rows);
}

// ── Leaderboard ─────────────────────────────────────────────────────────────
// XP has no time series, so "weekly score" = words reviewed in the last 7
// days (the proven weekReviews metric from profile.service.getStats). Scope:
// me + everyone I follow.
export async function getLeaderboard(db: DB, viewerId: string) {
  const followingRows = await db
    .select({ id: follows.followeeId })
    .from(follows)
    .where(eq(follows.followerId, viewerId));

  const ids = [viewerId, ...followingRows.map((r) => r.id)];

  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const scoreRows = await db
    .select({
      userId: wordProgress.userId,
      score: count(),
    })
    .from(wordProgress)
    .where(
      and(
        inArray(wordProgress.userId, ids),
        gte(wordProgress.lastReviewed, weekAgo),
      ),
    )
    .groupBy(wordProgress.userId);

  const scoreMap = new Map(scoreRows.map((r) => [r.userId, Number(r.score)]));

  const people = await db
    .select({
      id: users.id,
      tag: users.tag,
      name: users.name,
      avatarUrl: users.avatarUrl,
      xp: users.xp,
    })
    .from(users)
    .where(inArray(users.id, ids));

  return people
    .map((p) => ({
      id: p.id,
      tag: p.tag,
      name: p.name,
      avatarUrl: p.avatarUrl,
      xpLevel: levelFromXp(p.xp),
      weekScore: scoreMap.get(p.id) ?? 0,
      isMe: p.id === viewerId,
    }))
    .sort((a, b) => b.weekScore - a.weekScore || b.xpLevel - a.xpLevel);
}

// ── Activity feed ───────────────────────────────────────────────────────────
// Events from people I follow (self excluded — this is "friends' activity").
// Keyset pagination on (created_at, id) so it stays correct as new events
// arrive. Each row carries reaction count + whether I reacted.
const FEED_PAGE = 20;

export interface FeedItem {
  id: string;
  type: string;
  payload: unknown;
  createdAt: Date;
  actor: { id: string; tag: string; name: string; avatarUrl: string | null };
  reactionCount: number;
  myReacted: boolean;
}

export async function getFeed(
  db: DB,
  viewerId: string,
  cursor?: string,
): Promise<{ items: FeedItem[]; nextCursor: string | null }> {
  const followeeRows = await db
    .select({ id: follows.followeeId })
    .from(follows)
    .where(eq(follows.followerId, viewerId));
  const followeeIds = followeeRows.map((r) => r.id);
  if (followeeIds.length === 0) return { items: [], nextCursor: null };

  // cursor = "<ISO createdAt>__<uuid id>" — the last item of the prev page.
  let cursorCond;
  if (cursor) {
    const sep = cursor.lastIndexOf('__');
    const ts = cursor.slice(0, sep);
    const id = cursor.slice(sep + 2);
    cursorCond = sql`(${activityEvents.createdAt}, ${activityEvents.id}) < (${ts}::timestamp, ${id}::uuid)`;
  }

  const rows = await db
    .select({
      id: activityEvents.id,
      type: activityEvents.type,
      payload: activityEvents.payload,
      createdAt: activityEvents.createdAt,
      actorId: users.id,
      actorTag: users.tag,
      actorName: users.name,
      actorAvatar: users.avatarUrl,
      reactionCount: sql<number>`(select count(*)::int from ${activityReactions} r where r.event_id = ${activityEvents.id})`,
      myReacted: sql<boolean>`exists(select 1 from ${activityReactions} r where r.event_id = ${activityEvents.id} and r.user_id = ${viewerId})`,
    })
    .from(activityEvents)
    .innerJoin(users, eq(users.id, activityEvents.userId))
    .where(and(inArray(activityEvents.userId, followeeIds), cursorCond))
    .orderBy(desc(activityEvents.createdAt), desc(activityEvents.id))
    .limit(FEED_PAGE + 1);

  const hasMore = rows.length > FEED_PAGE;
  const page = rows.slice(0, FEED_PAGE);
  const last = page[page.length - 1];
  const nextCursor =
    hasMore && last ? `${last.createdAt.toISOString()}__${last.id}` : null;

  return {
    items: page.map((r) => ({
      id: r.id,
      type: r.type,
      payload: r.payload,
      createdAt: r.createdAt,
      actor: { id: r.actorId, tag: r.actorTag, name: r.actorName, avatarUrl: r.actorAvatar },
      reactionCount: Number(r.reactionCount ?? 0),
      myReacted: Boolean(r.myReacted),
    })),
    nextCursor,
  };
}

export async function reactToEvent(
  db: DB,
  userId: string,
  eventId: string,
): Promise<{ ok: boolean }> {
  const event = await db.query.activityEvents.findFirst({
    where: eq(activityEvents.id, eventId),
    columns: { id: true },
  });
  if (!event) throw new Error('EVENT_NOT_FOUND');
  await db.insert(activityReactions).values({ eventId, userId }).onConflictDoNothing();
  return { ok: true };
}

export async function unreactToEvent(
  db: DB,
  userId: string,
  eventId: string,
): Promise<{ ok: boolean }> {
  await db
    .delete(activityReactions)
    .where(and(eq(activityReactions.eventId, eventId), eq(activityReactions.userId, userId)));
  return { ok: true };
}

// ── shared helper ───────────────────────────────────────────────────────────
async function decorateWithFollowing(
  db: DB,
  viewerId: string,
  rows: Array<{
    id: string;
    tag: string;
    name: string;
    avatarUrl: string | null;
    level: string;
    xp: number;
  }>,
): Promise<UserCard[]> {
  if (rows.length === 0) return [];
  const followed = await db
    .select({ id: follows.followeeId })
    .from(follows)
    .where(
      and(
        eq(follows.followerId, viewerId),
        inArray(
          follows.followeeId,
          rows.map((r) => r.id),
        ),
      ),
    );
  const followedSet = new Set(followed.map((f) => f.id));
  return rows.map((r) => ({
    id: r.id,
    tag: r.tag,
    name: r.name,
    avatarUrl: r.avatarUrl,
    level: r.level,
    xpLevel: levelFromXp(r.xp),
    isFollowing: followedSet.has(r.id),
  }));
}
