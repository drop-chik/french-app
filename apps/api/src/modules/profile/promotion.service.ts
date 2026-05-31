/**
 * Auto-promotion service.
 *
 * Triggered after a user masters a word. Checks whether the user's
 * mastery on their current CEFR level reached the promotion threshold
 * (≥ 80% of words at that level marked as `mastered`). If so, sets
 * `users.level` to the next CEFR level and logs a row in
 * `placement_tests` with answers={} and resultLevel=new level, so the
 * promotion shows up in the user's placement history.
 *
 * Idempotent: only promotes one step per call; subsequent calls re-
 * evaluate against the new (higher) level.
 *
 * Returns the new level if a promotion happened, else null.
 */
import { and, eq, sql, count } from 'drizzle-orm';
import type { DB } from '../../db/index.js';
import { users, words, wordProgress, placementTests } from '../../db/schema/index.js';
import { recordActivity } from '../social/activity.service.js';

const ORDER = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as const;
type Level = typeof ORDER[number];

const THRESHOLD = 0.8;
const MIN_TOTAL = 50; // require at least 50 words on the level to even consider promotion

export async function checkAndPromote(db: DB, userId: string): Promise<Level | null> {
  const [user] = await db.select({ id: users.id, level: users.level }).from(users).where(eq(users.id, userId));
  if (!user) return null;
  const currentIdx = ORDER.indexOf(user.level as Level);
  if (currentIdx < 0) {
    // Corrupted users.level (out-of-band write, broken migration etc.)
    // — refuse to "promote" from an unknown state. Surface in logs.
    console.warn(`[promotion] user ${userId} has unknown level "${user.level}", skipping`);
    return null;
  }
  if (currentIdx === ORDER.length - 1) return null; // already C2

  const currentLevel = ORDER[currentIdx]!;
  const nextLevel = ORDER[currentIdx + 1]!;

  const [totals] = await db
    .select({ n: count() })
    .from(words)
    .where(and(eq(words.level, currentLevel), eq(words.isActive, true)));
  const total = Number(totals?.n ?? 0);
  if (total < MIN_TOTAL) return null;

  const [mastered] = await db
    .select({ n: count() })
    .from(wordProgress)
    .innerJoin(words, eq(wordProgress.wordId, words.id))
    .where(and(
      eq(wordProgress.userId, userId),
      eq(wordProgress.status, 'mastered'),
      eq(words.level, currentLevel),
      eq(words.isActive, true),
    ));
  const masteredCount = Number(mastered?.n ?? 0);

  const ratio = masteredCount / total;
  if (ratio < THRESHOLD) return null;

  // Promote
  await db.update(users).set({ level: nextLevel }).where(eq(users.id, userId));

  // Log promotion (so it appears in placement history)
  await db.insert(placementTests).values({
    userId,
    answers: { autoPromoted: true, fromLevel: currentLevel, masteredCount, total, ratio: ratio.toFixed(3) } as unknown as Record<string, string>,
    resultLevel: nextLevel,
  });

  // Friends-feed event — high-value milestone, also fans out as push
  // to followers via recordActivity's notifyFollowers hook.
  await recordActivity(
    db, userId, 'cefr_promoted',
    { from: currentLevel, to: nextLevel, via: 'auto' },
    `cefr:${currentLevel}->${nextLevel}`,
  );

  return nextLevel;
}

// Cheap query for the dashboard — returns mastery ratio for the user's
// current level + the next level slug. UI can show a "ready to advance"
// hint.
export async function getCurrentLevelMastery(db: DB, userId: string) {
  const [user] = await db.select({ level: users.level }).from(users).where(eq(users.id, userId));
  if (!user) return null;
  const currentIdx = ORDER.indexOf(user.level as Level);
  if (currentIdx === -1) return null;

  const [totalsRow] = await db
    .select({ n: count() })
    .from(words)
    .where(and(eq(words.level, user.level as Level), eq(words.isActive, true)));
  const total = Number(totalsRow?.n ?? 0);

  const [masteredRow] = await db
    .select({ n: count() })
    .from(wordProgress)
    .innerJoin(words, eq(wordProgress.wordId, words.id))
    .where(and(
      eq(wordProgress.userId, userId),
      eq(wordProgress.status, 'mastered'),
      eq(words.level, user.level as Level),
      eq(words.isActive, true),
    ));
  const masteredCount = Number(masteredRow?.n ?? 0);

  const ratio = total > 0 ? masteredCount / total : 0;
  const nextLevel = currentIdx < ORDER.length - 1 ? ORDER[currentIdx + 1] : null;
  return {
    current: user.level,
    next: nextLevel,
    masteredCount,
    total,
    ratio,
    eligibleForPromotion: ratio >= THRESHOLD && total >= MIN_TOTAL && nextLevel !== null,
  };
}
