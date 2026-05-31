import { eq } from 'drizzle-orm';
import type { DB } from '../../db/index.js';
import { activityEvents, follows, users } from '../../db/schema/index.js';
import { sendToUser } from '../push/push.service.js';

export type ActivityType =
  | 'joined'
  | 'achievement'
  | 'level_up'         // in-game XP level (1, 2, 3…)
  | 'streak'
  | 'cefr_promoted'    // CEFR jump A1→A2, B1→B2 etc — both auto-promote + manual test
  | 'placement_done';  // initial placement test completed (onboarding milestone)

// Only the high-value milestones fan out as a push to followers — ordinary
// words/lessons never push (would be spam). The feed still records everything.
function isHighValue(type: ActivityType, payload: Record<string, unknown>): boolean {
  if (type === 'level_up') return true;
  if (type === 'cefr_promoted') return true;
  if (type === 'placement_done') return true;
  if (type === 'achievement') {
    return payload['rarity'] === 'gold' || payload['rarity'] === 'legendary';
  }
  if (type === 'streak') {
    return [30, 100, 365].includes(Number(payload['days']));
  }
  return false;
}

function buildMessage(
  tag: string,
  type: ActivityType,
  payload: Record<string, unknown>,
): { title: string; body: string } {
  switch (type) {
    case 'achievement':
      return {
        title: 'Достижение друга',
        body: `@${tag} получил достижение: ${String(payload['titleRu'] ?? 'новое достижение')}`,
      };
    case 'level_up':
      return { title: 'Друг растёт', body: `@${tag} достиг уровня ${payload['level']}!` };
    case 'cefr_promoted':
      return {
        title: 'Новый уровень языка 🎉',
        body: `@${tag} перешёл с ${payload['from']} на ${payload['to']}!`,
      };
    case 'placement_done':
      return {
        title: 'Начало пути',
        body: `@${tag} прошёл тест уровня — стартовый уровень: ${payload['level']}`,
      };
    case 'streak':
      return { title: 'Стрик друга', body: `@${tag} — серия ${payload['days']} дней подряд!` };
    default:
      return { title: 'FrenchUp', body: `@${tag}` };
  }
}

// Push a milestone to everyone who follows the actor. Best-effort and
// independent of the feed write — never blocks the action path meaningfully
// (high-value milestones are rare).
async function notifyFollowers(
  db: DB,
  actorId: string,
  type: ActivityType,
  payload: Record<string, unknown>,
): Promise<void> {
  const actor = await db.query.users.findFirst({
    where: eq(users.id, actorId),
    columns: { tag: true },
  });
  if (!actor) return;

  const followerRows = await db
    .select({ id: follows.followerId })
    .from(follows)
    .where(eq(follows.followeeId, actorId));
  if (followerRows.length === 0) return;

  const { title, body } = buildMessage(actor.tag, type, payload);
  await Promise.all(
    followerRows.map((f) =>
      sendToUser(db, f.id, { title, body, url: '/friends', tag: 'friend-activity' }),
    ),
  );
}

/**
 * Append an activity-feed event. Best-effort by design: the social layer must
 * never break a user-facing flow, so every failure is swallowed. `dedupeKey`
 * (combined with the partial unique index `uq_activity_dedupe`) makes
 * milestone emits idempotent — calling this repeatedly for the same
 * achievement / level / streak produces exactly one feed row, and exactly
 * one follower push (the fan-out only runs when a row was actually inserted).
 */
export async function recordActivity(
  db: DB,
  userId: string,
  type: ActivityType,
  payload: Record<string, unknown> = {},
  dedupeKey?: string,
): Promise<void> {
  try {
    const inserted = await db
      .insert(activityEvents)
      .values({ userId, type, payload, ...(dedupeKey ? { dedupeKey } : {}) })
      .onConflictDoNothing()
      .returning({ id: activityEvents.id });

    if (inserted.length > 0 && isHighValue(type, payload)) {
      await notifyFollowers(db, userId, type, payload);
    }
  } catch (err) {
    console.error('[social] recordActivity failed (non-fatal):', err);
  }
}
