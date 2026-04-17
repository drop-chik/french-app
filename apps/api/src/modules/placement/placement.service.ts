import { eq } from 'drizzle-orm';
import type { DB } from '../../db/index.js';
import { users, placementTests } from '../../db/schema/index.js';
import { placementQuestions } from '../../db/seed/placement-test.js';

export { placementQuestions };

export type AnswerMap = Record<string, string>; // questionId → chosen option

// Evaluate answers and determine level
export function evaluateLevel(answers: AnswerMap): 'A1' | 'A2' | 'B1' | 'B2' {
  const levelScores: Record<string, { correct: number; total: number }> = {
    A1: { correct: 0, total: 0 },
    A2: { correct: 0, total: 0 },
    B1: { correct: 0, total: 0 },
    B2: { correct: 0, total: 0 },
  };

  for (const q of placementQuestions) {
    if (!(q.id in answers)) continue;
    levelScores[q.level]!.total++;
    if (answers[q.id] === q.correct) {
      levelScores[q.level]!.correct++;
    }
  }

  // Calculate % per level
  const pct = (level: string) => {
    const s = levelScores[level]!;
    return s.total === 0 ? 0 : s.correct / s.total;
  };

  // Logic: start from top, assign highest level with ≥50% correct
  if (pct('B2') >= 0.5) return 'B2';
  if (pct('B1') >= 0.5) return 'B1';
  if (pct('A2') >= 0.5) return 'A2';
  return 'A1';
}

// Save test result and update user level
export async function savePlacementResult(
  db: DB,
  userId: string,
  answers: AnswerMap,
) {
  const resultLevel = evaluateLevel(answers);

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
