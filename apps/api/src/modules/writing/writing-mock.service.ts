import { eq, and, desc, isNull, sql } from 'drizzle-orm';
import type { DB } from '../../db/index.js';
import { writingMockAttempts, writingPrompts } from '../../db/schema/index.js';
import { saveSubmission, generateFeedback } from './writing.service.js';

type CefrLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';

// DELF PE durations (seconds), roughly matching the real grilles.
const TIME_BY_LEVEL: Record<CefrLevel, number> = {
  A1: 1800, A2: 2400, B1: 2700, B2: 3600, C1: 5400, C2: 7200,
};

export interface MockPrompt {
  id: string;
  level: CefrLevel;
  writingType: string;
  titleRu: string; titleEn: string;
  promptRu: string; promptEn: string; promptFr: string;
  tipsRu: string[]; tipsEn: string[];
  minWords: number; maxWords: number;
}

export interface ActiveAttempt {
  id: string;
  level: CefrLevel;
  startedAt: Date;
  timeLimitSeconds: number;
  remainingSeconds: number;
  prompt: MockPrompt;
}

function remainingSeconds(startedAt: Date, timeLimit: number): number {
  return Math.max(0, timeLimit - Math.floor((Date.now() - startedAt.getTime()) / 1000));
}

function toMockPrompt(p: typeof writingPrompts.$inferSelect): MockPrompt {
  return {
    id: p.id, level: p.level as CefrLevel, writingType: p.writingType,
    titleRu: p.titleRu, titleEn: p.titleEn,
    promptRu: p.promptRu, promptEn: p.promptEn, promptFr: p.promptFr,
    tipsRu: (p.tipsRu as string[]) ?? [], tipsEn: (p.tipsEn as string[]) ?? [],
    minWords: p.minWords, maxWords: p.maxWords,
  };
}

/** Start a timed attempt: a random curated prompt at the chosen level. */
export async function startMock(db: DB, userId: string, level: CefrLevel): Promise<ActiveAttempt> {
  const existing = await db
    .select({ id: writingMockAttempts.id })
    .from(writingMockAttempts)
    .where(and(eq(writingMockAttempts.userId, userId), isNull(writingMockAttempts.submittedAt)))
    .limit(1);
  if (existing.length > 0) throw new Error('ACTIVE_ATTEMPT_EXISTS');

  const candidates = await db
    .select()
    .from(writingPrompts)
    .where(and(eq(writingPrompts.level, level), eq(writingPrompts.isActive, true), eq(writingPrompts.isAiGenerated, false)));
  if (candidates.length === 0) throw new Error('NO_PROMPTS');

  const prompt = candidates[Math.floor(Math.random() * candidates.length)]!;
  const timeLimitSeconds = TIME_BY_LEVEL[level];

  const [attempt] = await db
    .insert(writingMockAttempts)
    .values({ userId, level, promptId: prompt.id, timeLimitSeconds })
    .returning();
  if (!attempt) throw new Error('Failed to create attempt');

  return {
    id: attempt.id, level, startedAt: attempt.startedAt,
    timeLimitSeconds, remainingSeconds: remainingSeconds(attempt.startedAt, timeLimitSeconds),
    prompt: toMockPrompt(prompt),
  };
}

export async function getActiveAttempt(db: DB, userId: string): Promise<ActiveAttempt | null> {
  const [attempt] = await db
    .select()
    .from(writingMockAttempts)
    .where(and(eq(writingMockAttempts.userId, userId), isNull(writingMockAttempts.submittedAt)))
    .limit(1);
  if (!attempt) return null;

  const [prompt] = await db.select().from(writingPrompts).where(eq(writingPrompts.id, attempt.promptId)).limit(1);
  if (!prompt) {
    // Prompt vanished (deactivated) — drop the orphaned attempt.
    await db.delete(writingMockAttempts).where(eq(writingMockAttempts.id, attempt.id));
    return null;
  }

  return {
    id: attempt.id, level: attempt.level as CefrLevel, startedAt: attempt.startedAt,
    timeLimitSeconds: attempt.timeLimitSeconds,
    remainingSeconds: remainingSeconds(attempt.startedAt, attempt.timeLimitSeconds),
    prompt: toMockPrompt(prompt),
  };
}

/**
 * Submit the essay: reuses the normal pipeline (saveSubmission +
 * generateFeedback, which charges Smart Credits and throws OUT_OF_CREDITS).
 * Records the composite score on the attempt for history. Returns the full
 * feedback + the created submission id (so the UI can deep-link to it).
 */
export async function submitMock(
  db: DB, userId: string, attemptId: string, text: string,
): Promise<{ feedback: Awaited<ReturnType<typeof generateFeedback>>; submissionId: string }> {
  const [attempt] = await db
    .select()
    .from(writingMockAttempts)
    .where(and(eq(writingMockAttempts.id, attemptId), eq(writingMockAttempts.userId, userId)))
    .limit(1);
  if (!attempt) throw new Error('NOT_FOUND');
  if (attempt.submittedAt) throw new Error('ALREADY_SUBMITTED');

  const submission = await saveSubmission(db, userId, attempt.promptId, text, attempt.level, 'submitted');
  if (!submission) throw new Error('Failed to save submission');

  // Charges credits internally; bubbles OUT_OF_CREDITS to the route.
  const feedback = await generateFeedback(db, userId, submission.id);
  const scores = feedback.scores as { total?: number; maxTotal?: number };

  await db.update(writingMockAttempts).set({
    submissionId: submission.id,
    submittedAt: sql`now()`,
    score: scores.total ?? null,
    maxScore: scores.maxTotal ?? null,
  }).where(eq(writingMockAttempts.id, attemptId));

  return { feedback, submissionId: submission.id };
}

export async function cancelAttempt(db: DB, userId: string, attemptId: string): Promise<void> {
  await db.delete(writingMockAttempts).where(and(
    eq(writingMockAttempts.id, attemptId),
    eq(writingMockAttempts.userId, userId),
    isNull(writingMockAttempts.submittedAt),
  ));
}

export interface MockHistoryItem {
  id: string; level: CefrLevel; score: number; maxScore: number; submittedAt: Date;
  durationSeconds: number; submissionId: string | null;
}

export async function getMockHistory(db: DB, userId: string, limit = 10): Promise<MockHistoryItem[]> {
  const rows = await db
    .select()
    .from(writingMockAttempts)
    .where(and(eq(writingMockAttempts.userId, userId), sql`${writingMockAttempts.submittedAt} IS NOT NULL`))
    .orderBy(desc(writingMockAttempts.submittedAt))
    .limit(limit);
  return rows
    .filter((r) => r.submittedAt && r.score !== null && r.maxScore !== null)
    .map((r) => ({
      id: r.id, level: r.level as CefrLevel, score: r.score!, maxScore: r.maxScore!,
      submittedAt: r.submittedAt!,
      durationSeconds: Math.floor((r.submittedAt!.getTime() - r.startedAt.getTime()) / 1000),
      submissionId: r.submissionId,
    }));
}
