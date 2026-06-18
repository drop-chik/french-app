import { eq, and, sql } from 'drizzle-orm';
import type { DB } from '../../db/index.js';
import { users } from '../../db/schema/index.js';

/**
 * Smart Credits — single universal AI quota the user sees in the header.
 *
 * Per-feature limits (writing X/day, chat Y messages) create a 'which of
 * my counters did I burn' mental load. A single number is cleaner and
 * easier to ramp into a paid tier later. We pick costs that approximate
 * actual OpenAI spend so the budget translates to a real $/user/day cap.
 *
 * COSTS (in credits):
 *  - 25 ... AI essay scoring (gpt-4o)
 *  -  3 ... AI conversation message
 *  -  1 ... AI translation fallback (rare path; usually free from wordMap)
 *  -  5 ... AI prompt generation in writing
 *
 * FREE TIER: 100 credits/day. That's ~4 essays + a chat session — enough
 * for serious daily practice, hits the wall on power-use days.
 *
 * Reset: lazy — on first read after aiCreditsResetAt < now, we reset
 * used=0 and bump resetAt to next midnight UTC. No cron needed.
 */
export const DAILY_LIMIT = 100;

export const COST = {
  writingFeedback:    25,
  conversationMsg:     3,
  translationFallback: 1,
  promptGeneration:    5,
  imageGeneration:    10,  // DALL-E 3 standard ~$0.04/image
  drillGeneration:     5,  // gpt-4o batch of fresh drill questions
  wordTts:             1,  // tts-1-hd, charged only on cache-miss (novel word)
} as const;

export type CreditAction = keyof typeof COST;

export interface CreditState {
  used: number;
  total: number;
  remaining: number;
  resetAt: string;     // ISO timestamp of next reset
  hoursUntilReset: number;
}

// ── Pure quota math (unit-tested in ai-credits.service.test.ts) ──────────────
/** Next 00:00:00 UTC strictly after `now`. The daily reset boundary. */
export function _nextMidnightUtc(now: Date): Date {
  const d = new Date(now.getTime());
  d.setUTCHours(24, 0, 0, 0); // tomorrow 00:00:00 UTC
  return d;
}
/** Whether the stored reset timestamp has been reached (counter should zero). */
export function _isResetDue(resetAt: Date, now: Date): boolean {
  return resetAt.getTime() <= now.getTime();
}
/** Whole hours until reset, never negative. */
export function _hoursUntilReset(resetAt: Date, now: Date): number {
  return Math.max(0, Math.ceil((resetAt.getTime() - now.getTime()) / (1000 * 60 * 60)));
}
/** Credits left in the daily budget, never negative. */
export function _remaining(used: number, limit: number): number {
  return Math.max(0, limit - used);
}

async function readWithReset(db: DB, userId: string) {
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
    columns: { aiCreditsUsed: true, aiCreditsResetAt: true },
  });
  if (!user) return null;

  const now = new Date();
  // If we crossed the reset boundary while the user was idle, zero the
  // counter and push resetAt to the next midnight. One round-trip update.
  if (_isResetDue(user.aiCreditsResetAt, now)) {
    const newReset = _nextMidnightUtc(now);
    await db
      .update(users)
      .set({ aiCreditsUsed: 0, aiCreditsResetAt: newReset })
      .where(eq(users.id, userId));
    return { used: 0, resetAt: newReset };
  }
  return { used: user.aiCreditsUsed, resetAt: user.aiCreditsResetAt };
}

export async function getCredits(db: DB, userId: string): Promise<CreditState | null> {
  const row = await readWithReset(db, userId);
  if (!row) return null;
  return {
    used: row.used,
    total: DAILY_LIMIT,
    remaining: _remaining(row.used, DAILY_LIMIT),
    resetAt: row.resetAt.toISOString(),
    hoursUntilReset: _hoursUntilReset(row.resetAt, new Date()),
  };
}

/**
 * Try to spend `cost` credits for an action. Returns true on success
 * (counter advanced), false when the user is out of quota. Throws on
 * missing user — same convention as the rest of the profile module.
 *
 * Atomic: the debit is a single conditional UPDATE guarded in its WHERE
 * clause, so concurrent calls (e.g. parallel SSE streams) can't both pass
 * when only one fits under the limit, and none are silently dropped. The
 * old read-then-write with an absolute SET lost debits under concurrency.
 */
export async function tryConsume(
  db: DB,
  userId: string,
  action: CreditAction,
): Promise<{ ok: boolean; state: CreditState }> {
  const cost = COST[action];
  // Lazy daily reset first (low-contention — only fires at the day boundary).
  const row = await readWithReset(db, userId);
  if (!row) throw new Error('USER_NOT_FOUND');

  const resetAtIso = row.resetAt.toISOString();
  const hoursUntilReset = _hoursUntilReset(row.resetAt, new Date());

  // Atomic check-and-debit. WHERE enforces the limit; RETURNING gives the
  // post-increment value. 0 rows back ⇒ the increment would exceed the cap.
  const updated = await db
    .update(users)
    .set({ aiCreditsUsed: sql`${users.aiCreditsUsed} + ${cost}` })
    .where(and(eq(users.id, userId), sql`${users.aiCreditsUsed} + ${cost} <= ${DAILY_LIMIT}`))
    .returning({ used: users.aiCreditsUsed });

  if (updated.length === 0) {
    return {
      ok: false,
      state: {
        used: row.used,
        total: DAILY_LIMIT,
        remaining: _remaining(row.used, DAILY_LIMIT),
        resetAt: resetAtIso,
        hoursUntilReset,
      },
    };
  }

  const newUsed = updated[0]!.used;
  return {
    ok: true,
    state: {
      used: newUsed,
      total: DAILY_LIMIT,
      remaining: _remaining(newUsed, DAILY_LIMIT),
      resetAt: resetAtIso,
      hoursUntilReset,
    },
  };
}
