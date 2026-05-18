import type { DB } from '../../db/index.js';
import { activityEvents } from '../../db/schema/index.js';

export type ActivityType = 'joined' | 'achievement' | 'level_up' | 'streak';

/**
 * Append an activity-feed event. Best-effort by design: the social layer must
 * never break a user-facing flow, so every failure is swallowed. `dedupeKey`
 * (combined with the partial unique index `uq_activity_dedupe`) makes
 * milestone emits idempotent — calling this repeatedly for the same
 * achievement / level / streak produces exactly one feed row.
 */
export async function recordActivity(
  db: DB,
  userId: string,
  type: ActivityType,
  payload: Record<string, unknown> = {},
  dedupeKey?: string,
): Promise<void> {
  try {
    await db
      .insert(activityEvents)
      .values({ userId, type, payload, ...(dedupeKey ? { dedupeKey } : {}) })
      .onConflictDoNothing();
  } catch (err) {
    console.error('[social] recordActivity failed (non-fatal):', err);
  }
}
