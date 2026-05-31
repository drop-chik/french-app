import { eq } from 'drizzle-orm';
import type { DB } from '../../db/index.js';
import { users, placementTests } from '../../db/schema/index.js';
import { placementQuestions } from '../../db/seed/placement-test.js';

export { placementQuestions };

export type AnswerMap = Record<string, string>; // questionId → chosen option

type Level = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';

// Evaluate answers and determine level
export function evaluateLevel(answers: AnswerMap, selfReportedLevel?: string): Level {
  const ORDERED = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as const;
  const scores: Record<string, { correct: number; total: number }> = {
    A1: { correct: 0, total: 0 },
    A2: { correct: 0, total: 0 },
    B1: { correct: 0, total: 0 },
    B2: { correct: 0, total: 0 },
    C1: { correct: 0, total: 0 },
    C2: { correct: 0, total: 0 },
  };

  for (const q of placementQuestions) {
    if (!(q.id in answers)) continue;
    scores[q.level]!.total++;
    if (answers[q.id] === q.correct) scores[q.level]!.correct++;
  }

  // Highest level with >= 50% correct (only for levels that were actually tested)
  for (const level of ['C2', 'C1', 'B2', 'B1', 'A2', 'A1'] as const) {
    const s = scores[level]!;
    if (s.total > 0 && s.correct / s.total >= 0.5) return level;
  }

  // Nothing passed 50% — use highest tested level minus one step
  const tested = (['C2', 'C1', 'B2', 'B1', 'A2', 'A1'] as const).filter(l => scores[l]!.total > 0);
  if (tested.length > 0) {
    const highest = tested[0]!;
    const idx = ORDERED.indexOf(highest);
    return ORDERED[Math.max(idx - 1, 0)] ?? 'A1';
  }

  // No answers (skipped test) — use self-reported level or A1
  if ((['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as const).includes(selfReportedLevel as Level)) {
    return selfReportedLevel as Level;
  }
  return 'A1';
}

// Save test result and update user level
export async function savePlacementResult(
  db: DB,
  userId: string,
  answers: AnswerMap,
  selfReportedLevel?: string,
) {
  const resultLevel = evaluateLevel(answers, selfReportedLevel);

  // Save test record
  await db.insert(placementTests).values({
    userId,
    answers,
    resultLevel,
  });

  // Update user level
  await db.update(users).set({ level: resultLevel, placementTestDone: true }).where(eq(users.id, userId));

  return { resultLevel };
}
