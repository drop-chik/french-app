import { eq } from 'drizzle-orm';
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
} as const;

export type CreditAction = keyof typeof COST;

export interface CreditState {
  used: number;
  total: number;
  remaining: number;
  resetAt: string;     // ISO timestamp of next reset
  hoursUntilReset: number;
}

function nextMidnightUtc(): Date {
  const d = new Date();
  d.setUTCHours(24, 0, 0, 0); // tomorrow 00:00:00 UTC
  return d;
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
  if (user.aiCreditsResetAt.getTime() <= now.getTime()) {
    const newReset = nextMidnightUtc();
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
  const remaining = Math.max(0, DAILY_LIMIT - row.used);
  const hours = Math.max(0, Math.ceil((row.resetAt.getTime() - Date.now()) / (1000 * 60 * 60)));
  return {
    used: row.used,
    total: DAILY_LIMIT,
    remaining,
    resetAt: row.resetAt.toISOString(),
    hoursUntilReset: hours,
  };
}

/**
 * Try to spend `cost` credits for an action. Returns true on success
 * (counter advanced), false when the user is out of quota. Throws on
 * missing user — same convention as the rest of the profile module.
 *
 * Race-safe-enough: the SET reads the column with the latest committed
 * value, so two concurrent calls don't double-debit; if the second slips
 * in before the first commits, we'd over-debit by at most one cost
 * (acceptable for a daily quota counter).
 */
export async function tryConsume(
  db: DB,
  userId: string,
  action: CreditAction,
): Promise<{ ok: boolean; state: CreditState }> {
  const cost = COST[action];
  const row = await readWithReset(db, userId);
  if (!row) throw new Error('USER_NOT_FOUND');

  if (row.used + cost > DAILY_LIMIT) {
    return {
      ok: false,
      state: {
        used: row.used,
        total: DAILY_LIMIT,
        remaining: Math.max(0, DAILY_LIMIT - row.used),
        resetAt: row.resetAt.toISOString(),
        hoursUntilReset: Math.max(0, Math.ceil((row.resetAt.getTime() - Date.now()) / (1000 * 60 * 60))),
      },
    };
  }

  const newUsed = row.used + cost;
  await db.update(users).set({ aiCreditsUsed: newUsed }).where(eq(users.id, userId));

  return {
    ok: true,
    state: {
      used: newUsed,
      total: DAILY_LIMIT,
      remaining: DAILY_LIMIT - newUsed,
      resetAt: row.resetAt.toISOString(),
      hoursUntilReset: Math.max(0, Math.ceil((row.resetAt.getTime() - Date.now()) / (1000 * 60 * 60))),
    },
  };
}
