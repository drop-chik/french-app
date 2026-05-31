import { eq } from 'drizzle-orm';
import type { DB } from '../../db/index.js';
import { users, placementTests } from '../../db/schema/index.js';
import { placementQuestions } from '../../db/seed/placement-test.js';
import { recordActivity } from '../social/activity.service.js';

export { placementQuestions };

export type AnswerMap = Record<string, string>; // questionId → chosen option

type Level = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
const ORDERED = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as const;
const VALID_LEVEL = new Set<Level>(ORDERED);

// Evaluate answers and determine level. Returns `null` when the answers
// set is so empty/sparse that no meaningful assessment is possible —
// the caller decides what to do (we keep the previous level rather than
// silently dropping the user to A1).
export function evaluateLevel(answers: AnswerMap, selfReportedLevel?: string): Level | null {
  const scores: Record<string, { correct: number; total: number }> = {
    A1: { correct: 0, total: 0 }, A2: { correct: 0, total: 0 },
    B1: { correct: 0, total: 0 }, B2: { correct: 0, total: 0 },
    C1: { correct: 0, total: 0 }, C2: { correct: 0, total: 0 },
  };

  const validIds = new Set(placementQuestions.map((q) => q.id));
  let totalAnswered = 0;
  for (const q of placementQuestions) {
    if (!(q.id in answers)) continue;
    totalAnswered++;
    scores[q.level]!.total++;
    if (answers[q.id] === q.correct) scores[q.level]!.correct++;
  }

  // Require a minimum sample. Fewer than 3 answers is treated as an
  // aborted/partial submit — return null so the caller keeps the
  // previous level instead of demoting to A1. selfReportedLevel still
  // wins (legitimate skip flow at onboarding).
  if (totalAnswered < 3) {
    if (VALID_LEVEL.has(selfReportedLevel as Level)) return selfReportedLevel as Level;
    return null;
  }

  // Defence against payload-padding with fake ids to inflate scores.
  for (const id of Object.keys(answers)) {
    if (!validIds.has(id)) delete answers[id];
  }

  for (const level of ['C2', 'C1', 'B2', 'B1', 'A2', 'A1'] as const) {
    const s = scores[level]!;
    if (s.total > 0 && s.correct / s.total >= 0.5) return level;
  }

  const tested = (['C2', 'C1', 'B2', 'B1', 'A2', 'A1'] as const).filter((l) => scores[l]!.total > 0);
  if (tested.length > 0) {
    const highest = tested[0]!;
    const idx = ORDERED.indexOf(highest);
    return ORDERED[Math.max(idx - 1, 0)] ?? 'A1';
  }

  if (VALID_LEVEL.has(selfReportedLevel as Level)) return selfReportedLevel as Level;
  return null;
}

// Save test result and update user level. Retake-aware: never demotes
// an existing user — placement test is for ASSESSMENT, not punishment.
// If the new evaluated level is lower than the user's current level
// (possible on retake or when partial answers), we record the test for
// audit but keep the higher previous level.
export async function savePlacementResult(
  db: DB,
  userId: string,
  answers: AnswerMap,
  selfReportedLevel?: string,
) {
  const evaluated = evaluateLevel(answers, selfReportedLevel);

  const [user] = await db.select({
    level: users.level,
    placementTestDone: users.placementTestDone,
  }).from(users).where(eq(users.id, userId));
  const previousLevel = (user?.level ?? 'A1') as Level;
  const prevIdx = ORDERED.indexOf(previousLevel);

  // Fallback when evaluator returned null (too few answers and no
  // self-report): keep the previous level untouched.
  if (!evaluated) {
    await db.update(users).set({ placementTestDone: true }).where(eq(users.id, userId));
    return { resultLevel: previousLevel, kept: true };
  }

  const newIdx = ORDERED.indexOf(evaluated);
  // No-demote rule: only move user UP. Record the test in any case.
  const resultLevel: Level = newIdx >= prevIdx ? evaluated : previousLevel;

  await db.insert(placementTests).values({
    userId,
    answers: { ...answers, _evaluated: evaluated, _previous: previousLevel } as unknown as Record<string, string>,
    resultLevel,
  });

  await db.update(users).set({ level: resultLevel, placementTestDone: true }).where(eq(users.id, userId));

  // Friends-feed: initial onboarding placement OR a retake bumped the user.
  if (!user?.placementTestDone) {
    // First placement — onboarding milestone
    await recordActivity(db, userId, 'placement_done', { level: resultLevel }, `placement:initial`);
  } else if (ORDERED.indexOf(resultLevel) > prevIdx) {
    // Retake actually moved the user up
    await recordActivity(
      db, userId, 'cefr_promoted',
      { from: previousLevel, to: resultLevel, via: 'placement' },
      `cefr:${previousLevel}->${resultLevel}`,
    );
  }

  return { resultLevel, kept: resultLevel !== evaluated };
}
