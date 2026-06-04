import { eq } from 'drizzle-orm';
import type { DB } from '../../db/index.js';
import { users } from '../../db/schema/index.js';
import { targetForLevel } from '../../lib/level-targets.js';
import type { LanguageLevel } from '@french-app/shared-types';

export type ExamType = 'DELF' | 'DALF' | 'TCF' | 'TEF';
const VALID_TYPES: ExamType[] = ['DELF', 'DALF', 'TCF', 'TEF'];

export interface ExamPlanInput {
  examDate: string;     // ISO date
  examType: ExamType;
  examTargetLevel: LanguageLevel;
}

export interface ExamPlan {
  examDate: string;
  examType: ExamType;
  examTargetLevel: LanguageLevel;
  daysRemaining: number;
  /** Words the user still needs to learn at the target level to reach mastery. */
  wordsToLearn: number;
  /** Recommended words-per-day pace to hit the date. Floored at 5. */
  wordsPerDay: number;
  /** Same idea but for grammar topics — count of topics still untouched at this level. */
  grammarPerWeek: number;
  /** Friendly status: 'plenty' (≥60d), 'tight' (30-60d), 'urgent' (<30d). */
  status: 'plenty' | 'tight' | 'urgent';
}

function daysBetween(a: Date, b: Date): number {
  const ms = b.getTime() - a.getTime();
  return Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24)));
}

/**
 * Read the user's exam plan (if any) and compute the live recommendations.
 * Pure-read; safe to call on every dashboard fetch.
 */
export async function getExamPlan(
  db: DB,
  userId: string,
  learnedWordsAtTarget: number,
): Promise<ExamPlan | null> {
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
    columns: {
      examDate: true,
      examType: true,
      examTargetLevel: true,
    },
  });
  if (!user || !user.examDate || !user.examType || !user.examTargetLevel) return null;

  const target = targetForLevel(user.examTargetLevel);
  const remaining = Math.max(0, target - learnedWordsAtTarget);
  const days = daysBetween(new Date(), user.examDate);
  const wordsPerDay = days > 0
    ? Math.max(5, Math.ceil(remaining / days))
    : remaining;
  const grammarPerWeek = days > 0
    ? Math.max(1, Math.ceil(20 / Math.max(1, Math.floor(days / 7))))
    : 5;
  const status: ExamPlan['status'] = days >= 60 ? 'plenty' : days >= 30 ? 'tight' : 'urgent';

  return {
    examDate: user.examDate.toISOString(),
    examType: user.examType as ExamType,
    examTargetLevel: user.examTargetLevel as LanguageLevel,
    daysRemaining: days,
    wordsToLearn: remaining,
    wordsPerDay,
    grammarPerWeek,
    status,
  };
}

/** Validate + persist an exam plan. Replaces any existing plan for this user. */
export async function setExamPlan(
  db: DB,
  userId: string,
  input: ExamPlanInput,
): Promise<void> {
  if (!VALID_TYPES.includes(input.examType)) {
    throw new Error('INVALID_TYPE');
  }
  const date = new Date(input.examDate);
  if (Number.isNaN(date.getTime())) throw new Error('INVALID_DATE');
  // Reject dates in the past or too far in the future — the recommendation
  // math becomes meaningless either way.
  const now = new Date();
  if (date.getTime() < now.getTime()) throw new Error('PAST_DATE');
  const twoYears = 1000 * 60 * 60 * 24 * 730;
  if (date.getTime() - now.getTime() > twoYears) throw new Error('TOO_FAR');

  await db
    .update(users)
    .set({
      examDate: date,
      examType: input.examType,
      examTargetLevel: input.examTargetLevel,
    })
    .where(eq(users.id, userId));
}

export async function clearExamPlan(db: DB, userId: string): Promise<void> {
  await db
    .update(users)
    .set({ examDate: null, examType: null, examTargetLevel: null })
    .where(eq(users.id, userId));
}
