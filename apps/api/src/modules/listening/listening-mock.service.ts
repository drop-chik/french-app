import { eq, and, desc, isNull, inArray, sql } from 'drizzle-orm';
import type { DB } from '../../db/index.js';
import { listeningMockAttempts, listeningExercises } from '../../db/schema/index.js';

// DELF CO (Compréhension Orale): a few recordings, ~25 min total.
const TIME_LIMIT_SECONDS = 1500; // 25 minutes
const EXERCISES_PER_MOCK = 3;

type CefrLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';

interface ListeningQuestion {
  id: string;
  question: string;
  options: string[];
  correct: string;
}

interface StoredAnswer {
  exerciseId: string;
  questionId: string;
  answer: string;
}

interface MaskedQuestion {
  id: string;
  question: string;
  options: string[];
}

/** Exercise shape sent during an active attempt — no transcript, no answers. */
export interface MockExercise {
  id: string;
  title: string;
  level: CefrLevel;
  durationSec: number;
  questions: MaskedQuestion[];
}

export interface ActiveAttempt {
  id: string;
  level: CefrLevel;
  startedAt: Date;
  timeLimitSeconds: number;
  remainingSeconds: number;
  exercises: MockExercise[];
  answers: StoredAnswer[];
}

export interface MockResult {
  id: string;
  level: CefrLevel;
  score: number;
  maxScore: number;
  finalizedAt: Date;
  breakdown: Array<{
    exerciseId: string;
    title: string;
    correct: number;
    total: number;
    questions: Array<{
      id: string;
      question: string;
      options: string[];
      userAnswer: string | null;
      correctAnswer: string;
      isCorrect: boolean;
    }>;
  }>;
}

function maskQuestions(questions: ListeningQuestion[]): MaskedQuestion[] {
  return questions.map((q) => ({ id: q.id, question: q.question, options: q.options }));
}

function remainingSeconds(startedAt: Date, timeLimit: number): number {
  const elapsed = Math.floor((Date.now() - startedAt.getTime()) / 1000);
  return Math.max(0, timeLimit - elapsed);
}

/**
 * Start a new attempt: 3 random active exercises at the chosen level. Rejects
 * if an unfinalized attempt already exists (caller should resume it).
 */
export async function startMock(db: DB, userId: string, level: CefrLevel): Promise<ActiveAttempt> {
  const existing = await db
    .select({ id: listeningMockAttempts.id })
    .from(listeningMockAttempts)
    .where(and(eq(listeningMockAttempts.userId, userId), isNull(listeningMockAttempts.finalizedAt)))
    .limit(1);
  if (existing.length > 0) throw new Error('ACTIVE_ATTEMPT_EXISTS');

  const candidates = await db
    .select({ id: listeningExercises.id, title: listeningExercises.title, level: listeningExercises.level, durationSec: listeningExercises.durationSec, questions: listeningExercises.questions })
    .from(listeningExercises)
    .where(eq(listeningExercises.level, level));
  if (candidates.length < EXERCISES_PER_MOCK) throw new Error('NOT_ENOUGH_EXERCISES');

  const picked = [...candidates].sort(() => Math.random() - 0.5).slice(0, EXERCISES_PER_MOCK);
  const exerciseIds = picked.map((p) => p.id);

  const [attempt] = await db
    .insert(listeningMockAttempts)
    .values({ userId, level, exerciseIds, timeLimitSeconds: TIME_LIMIT_SECONDS })
    .returning();
  if (!attempt) throw new Error('Failed to create attempt');

  return {
    id: attempt.id,
    level: attempt.level as CefrLevel,
    startedAt: attempt.startedAt,
    timeLimitSeconds: attempt.timeLimitSeconds,
    remainingSeconds: remainingSeconds(attempt.startedAt, attempt.timeLimitSeconds),
    exercises: picked.map((e) => ({
      id: e.id, title: e.title, level: e.level as CefrLevel, durationSec: e.durationSec,
      questions: maskQuestions(e.questions as ListeningQuestion[]),
    })),
    answers: [],
  };
}

export async function getActiveAttempt(
  db: DB,
  userId: string,
): Promise<ActiveAttempt | { autoFinalized: MockResult } | null> {
  const [attempt] = await db
    .select()
    .from(listeningMockAttempts)
    .where(and(eq(listeningMockAttempts.userId, userId), isNull(listeningMockAttempts.finalizedAt)))
    .limit(1);
  if (!attempt) return null;

  const remaining = remainingSeconds(attempt.startedAt, attempt.timeLimitSeconds);
  if (remaining === 0) {
    const result = await finalizeAttempt(db, attempt.id, userId);
    return { autoFinalized: result };
  }

  const exerciseIds = attempt.exerciseIds as string[];
  const rows = await db
    .select({ id: listeningExercises.id, title: listeningExercises.title, level: listeningExercises.level, durationSec: listeningExercises.durationSec, questions: listeningExercises.questions })
    .from(listeningExercises)
    .where(inArray(listeningExercises.id, exerciseIds));
  const byId = new Map(rows.map((r) => [r.id, r]));
  const ordered = exerciseIds.map((id) => byId.get(id)).filter((x): x is NonNullable<typeof x> => Boolean(x));

  return {
    id: attempt.id,
    level: attempt.level as CefrLevel,
    startedAt: attempt.startedAt,
    timeLimitSeconds: attempt.timeLimitSeconds,
    remainingSeconds: remaining,
    exercises: ordered.map((e) => ({
      id: e.id, title: e.title, level: e.level as CefrLevel, durationSec: e.durationSec,
      questions: maskQuestions(e.questions as ListeningQuestion[]),
    })),
    answers: attempt.answers as StoredAnswer[],
  };
}

export async function submitAnswer(
  db: DB, attemptId: string, userId: string, exerciseId: string, questionId: string, answer: string,
): Promise<void> {
  const [attempt] = await db
    .select()
    .from(listeningMockAttempts)
    .where(and(eq(listeningMockAttempts.id, attemptId), eq(listeningMockAttempts.userId, userId)))
    .limit(1);
  if (!attempt) throw new Error('NOT_FOUND');
  if (attempt.finalizedAt) throw new Error('ALREADY_FINALIZED');
  if (remainingSeconds(attempt.startedAt, attempt.timeLimitSeconds) === 0) throw new Error('TIME_EXPIRED');

  const prev = (attempt.answers as StoredAnswer[]) ?? [];
  const next = prev.filter((a) => !(a.exerciseId === exerciseId && a.questionId === questionId));
  next.push({ exerciseId, questionId, answer });
  await db.update(listeningMockAttempts).set({ answers: next }).where(eq(listeningMockAttempts.id, attemptId));
}

export async function finalizeAttempt(db: DB, attemptId: string, userId: string): Promise<MockResult> {
  const [attempt] = await db
    .select()
    .from(listeningMockAttempts)
    .where(and(eq(listeningMockAttempts.id, attemptId), eq(listeningMockAttempts.userId, userId)))
    .limit(1);
  if (!attempt) throw new Error('NOT_FOUND');

  const exerciseIds = attempt.exerciseIds as string[];
  const rows = await db
    .select({ id: listeningExercises.id, title: listeningExercises.title, questions: listeningExercises.questions })
    .from(listeningExercises)
    .where(inArray(listeningExercises.id, exerciseIds));
  const byId = new Map(rows.map((r) => [r.id, r]));

  const answers = (attempt.answers as StoredAnswer[]) ?? [];
  const key = (e: string, q: string) => `${e}|${q}`;
  const answerMap = new Map(answers.map((a) => [key(a.exerciseId, a.questionId), a.answer]));

  let total = 0;
  let correct = 0;
  const breakdown: MockResult['breakdown'] = [];

  for (const exerciseId of exerciseIds) {
    const row = byId.get(exerciseId);
    if (!row) continue;
    const qs = row.questions as ListeningQuestion[];
    let exCorrect = 0;
    const questions = qs.map((q) => {
      total++;
      const userAnswer = answerMap.get(key(exerciseId, q.id)) ?? null;
      const isCorrect = userAnswer === q.correct;
      if (isCorrect) { correct++; exCorrect++; }
      return { id: q.id, question: q.question, options: q.options, userAnswer, correctAnswer: q.correct, isCorrect };
    });
    breakdown.push({ exerciseId: row.id, title: row.title, correct: exCorrect, total: qs.length, questions });
  }

  if (!attempt.finalizedAt) {
    await db.update(listeningMockAttempts)
      .set({ score: correct, maxScore: total, finalizedAt: sql`now()` })
      .where(eq(listeningMockAttempts.id, attemptId));
  }

  return {
    id: attempt.id,
    level: attempt.level as CefrLevel,
    score: correct,
    maxScore: total,
    finalizedAt: attempt.finalizedAt ?? new Date(),
    breakdown,
  };
}

export async function cancelAttempt(db: DB, attemptId: string, userId: string): Promise<void> {
  await db.delete(listeningMockAttempts).where(and(
    eq(listeningMockAttempts.id, attemptId),
    eq(listeningMockAttempts.userId, userId),
    isNull(listeningMockAttempts.finalizedAt),
  ));
}

export interface MockHistoryItem {
  id: string; level: CefrLevel; score: number; maxScore: number; finalizedAt: Date; durationSeconds: number;
}

export async function getMockHistory(db: DB, userId: string, limit = 10): Promise<MockHistoryItem[]> {
  const rows = await db
    .select({ id: listeningMockAttempts.id, level: listeningMockAttempts.level, score: listeningMockAttempts.score, maxScore: listeningMockAttempts.maxScore, startedAt: listeningMockAttempts.startedAt, finalizedAt: listeningMockAttempts.finalizedAt })
    .from(listeningMockAttempts)
    .where(and(eq(listeningMockAttempts.userId, userId), sql`${listeningMockAttempts.finalizedAt} IS NOT NULL`))
    .orderBy(desc(listeningMockAttempts.finalizedAt))
    .limit(limit);
  return rows
    .filter((r) => r.finalizedAt && r.score !== null && r.maxScore !== null)
    .map((r) => ({
      id: r.id, level: r.level as CefrLevel, score: r.score!, maxScore: r.maxScore!,
      finalizedAt: r.finalizedAt!,
      durationSeconds: Math.floor((r.finalizedAt!.getTime() - r.startedAt.getTime()) / 1000),
    }));
}
