import { eq, and, desc, isNull, inArray, sql } from 'drizzle-orm';
import type { DB } from '../../db/index.js';
import { readingMockAttempts, readingTexts } from '../../db/schema/index.js';
import type { ReadingQuestion, StoredWordEntry, WordEntry } from './reading.service.js';

const TIME_LIMIT_SECONDS = 2700; // 45 minutes — DELF reading-section format
const TEXTS_PER_MOCK = 3;

type CefrLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';

interface StoredAnswer {
  textId: string;
  questionId: string;
  answer: string;
}

/** Public-facing question — no `correct` / `explanation` leaked during attempt. */
interface MaskedQuestion {
  id: string;
  question: string;
  options: string[];
}

/** Text shape sent during an active attempt — questions are masked. */
export interface MockText {
  id: string;
  slug: string;
  title: string;
  level: CefrLevel;
  contentFr: string;
  wordMap: Record<string, WordEntry>;
  questions: MaskedQuestion[];
  estimatedMinutes: number;
}

export interface ActiveAttempt {
  id: string;
  level: CefrLevel;
  startedAt: Date;
  timeLimitSeconds: number;
  remainingSeconds: number;
  texts: MockText[];
  answers: StoredAnswer[];
}

export interface MockResult {
  id: string;
  level: CefrLevel;
  score: number;
  maxScore: number;
  finalizedAt: Date;
  breakdown: Array<{
    textId: string;
    slug: string;
    title: string;
    correct: number;
    total: number;
    questions: Array<{
      id: string;
      question: string;
      options: string[];
      userAnswer: string | null;
      correctAnswer: string;
      explanation: string;
      isCorrect: boolean;
    }>;
  }>;
}

/**
 * Normalises wordMap entries to the caller's language (mirrors the reading
 * service so the runtime popover shape is identical to free reading).
 */
function normalizeWordMap(raw: unknown, lang: 'ru' | 'en'): Record<string, WordEntry> {
  if (!raw || typeof raw !== 'object') return {};
  const stored = raw as Record<string, StoredWordEntry>;
  const out: Record<string, WordEntry> = {};
  for (const [k, v] of Object.entries(stored)) {
    const tr =
      lang === 'en' && v.tr_en && v.tr_en.trim() ? v.tr_en : v.tr;
    out[k] = { tr, pos: v.pos, ...(v.ipa ? { ipa: v.ipa } : {}) };
  }
  return out;
}

function maskQuestions(questions: ReadingQuestion[]): MaskedQuestion[] {
  return questions.map((q) => ({ id: q.id, question: q.question, options: q.options }));
}

function remainingSeconds(startedAt: Date, timeLimit: number): number {
  const elapsed = Math.floor((Date.now() - startedAt.getTime()) / 1000);
  return Math.max(0, timeLimit - elapsed);
}

/**
 * Start a new mock attempt. Picks 3 random active texts at the chosen level;
 * falls back to adjacent levels if fewer than 3 exist. Rejects if the user
 * already has an unfinalized attempt — the caller should resume that instead.
 */
export async function startMock(
  db: DB,
  userId: string,
  level: CefrLevel,
  lang: 'ru' | 'en',
): Promise<ActiveAttempt> {
  const existing = await db
    .select({ id: readingMockAttempts.id })
    .from(readingMockAttempts)
    .where(and(eq(readingMockAttempts.userId, userId), isNull(readingMockAttempts.finalizedAt)))
    .limit(1);
  if (existing.length > 0) {
    throw new Error('ACTIVE_ATTEMPT_EXISTS');
  }

  const candidates = await db
    .select()
    .from(readingTexts)
    .where(and(eq(readingTexts.level, level), eq(readingTexts.isActive, true)));

  if (candidates.length < TEXTS_PER_MOCK) {
    throw new Error('NOT_ENOUGH_TEXTS');
  }

  // Shuffle and pick the first 3 — gives variety across attempts.
  const shuffled = [...candidates].sort(() => Math.random() - 0.5);
  const picked = shuffled.slice(0, TEXTS_PER_MOCK);
  const textIds = picked.map((p) => p.id);

  const [attempt] = await db
    .insert(readingMockAttempts)
    .values({
      userId,
      level,
      textIds,
      timeLimitSeconds: TIME_LIMIT_SECONDS,
    })
    .returning();
  if (!attempt) throw new Error('Failed to create attempt');

  const texts: MockText[] = picked.map((t) => ({
    id: t.id,
    slug: t.slug,
    title: t.title,
    level: t.level as CefrLevel,
    contentFr: t.contentFr,
    wordMap: normalizeWordMap(t.wordMap, lang),
    questions: maskQuestions(t.questions as ReadingQuestion[]),
    estimatedMinutes: t.estimatedMinutes,
  }));

  return {
    id: attempt.id,
    level: attempt.level as CefrLevel,
    startedAt: attempt.startedAt,
    timeLimitSeconds: attempt.timeLimitSeconds,
    remainingSeconds: remainingSeconds(attempt.startedAt, attempt.timeLimitSeconds),
    texts,
    answers: [],
  };
}

/**
 * Return the user's active attempt (if any), with masked questions and the
 * remaining time the client should show. If the deadline has passed, this
 * also auto-finalizes the attempt so the client moves to the result screen.
 */
export async function getActiveAttempt(
  db: DB,
  userId: string,
  lang: 'ru' | 'en',
): Promise<ActiveAttempt | { autoFinalized: MockResult } | null> {
  const [attempt] = await db
    .select()
    .from(readingMockAttempts)
    .where(and(eq(readingMockAttempts.userId, userId), isNull(readingMockAttempts.finalizedAt)))
    .limit(1);
  if (!attempt) return null;

  const remaining = remainingSeconds(attempt.startedAt, attempt.timeLimitSeconds);
  if (remaining === 0) {
    // Time ran out while the user was offline — finalize on read.
    const result = await finalizeAttempt(db, attempt.id, userId);
    return { autoFinalized: result };
  }

  const textIds = attempt.textIds as string[];
  const rows = await db
    .select()
    .from(readingTexts)
    .where(inArray(readingTexts.id, textIds));
  // Restore the stored order — Postgres doesn't preserve IN order.
  const byId = new Map(rows.map((r) => [r.id, r]));
  const ordered = textIds.map((id) => byId.get(id)).filter((x): x is NonNullable<typeof x> => Boolean(x));

  const texts: MockText[] = ordered.map((t) => ({
    id: t.id,
    slug: t.slug,
    title: t.title,
    level: t.level as CefrLevel,
    contentFr: t.contentFr,
    wordMap: normalizeWordMap(t.wordMap, lang),
    questions: maskQuestions(t.questions as ReadingQuestion[]),
    estimatedMinutes: t.estimatedMinutes,
  }));

  return {
    id: attempt.id,
    level: attempt.level as CefrLevel,
    startedAt: attempt.startedAt,
    timeLimitSeconds: attempt.timeLimitSeconds,
    remainingSeconds: remaining,
    texts,
    answers: attempt.answers as StoredAnswer[],
  };
}

/**
 * Record (or replace) the user's answer to a single question. Stored as the
 * option string, not an index — robust to the question order in the source
 * being shuffled later. Rejects writes to a finalized attempt.
 */
export async function submitAnswer(
  db: DB,
  attemptId: string,
  userId: string,
  textId: string,
  questionId: string,
  answer: string,
): Promise<void> {
  const [attempt] = await db
    .select()
    .from(readingMockAttempts)
    .where(and(eq(readingMockAttempts.id, attemptId), eq(readingMockAttempts.userId, userId)))
    .limit(1);
  if (!attempt) throw new Error('NOT_FOUND');
  if (attempt.finalizedAt) throw new Error('ALREADY_FINALIZED');
  if (remainingSeconds(attempt.startedAt, attempt.timeLimitSeconds) === 0) {
    throw new Error('TIME_EXPIRED');
  }

  const prev = (attempt.answers as StoredAnswer[]) ?? [];
  const next = prev.filter((a) => !(a.textId === textId && a.questionId === questionId));
  next.push({ textId, questionId, answer });

  await db
    .update(readingMockAttempts)
    .set({ answers: next })
    .where(eq(readingMockAttempts.id, attemptId));
}

/**
 * Score and close the attempt. Idempotent — calling on a finalized attempt
 * returns the stored result.
 */
export async function finalizeAttempt(
  db: DB,
  attemptId: string,
  userId: string,
): Promise<MockResult> {
  const [attempt] = await db
    .select()
    .from(readingMockAttempts)
    .where(and(eq(readingMockAttempts.id, attemptId), eq(readingMockAttempts.userId, userId)))
    .limit(1);
  if (!attempt) throw new Error('NOT_FOUND');

  const textIds = attempt.textIds as string[];
  const rows = await db
    .select()
    .from(readingTexts)
    .where(inArray(readingTexts.id, textIds));
  const byId = new Map(rows.map((r) => [r.id, r]));

  const answers = (attempt.answers as StoredAnswer[]) ?? [];
  const answerKey = (textId: string, qid: string) => `${textId}|${qid}`;
  const answerMap = new Map(answers.map((a) => [answerKey(a.textId, a.questionId), a.answer]));

  let total = 0;
  let correct = 0;
  const breakdown: MockResult['breakdown'] = [];

  for (const textId of textIds) {
    const row = byId.get(textId);
    if (!row) continue;
    const qs = row.questions as ReadingQuestion[];
    let textCorrect = 0;
    const questionBreakdown = qs.map((q) => {
      total++;
      const userAnswer = answerMap.get(answerKey(textId, q.id)) ?? null;
      const isCorrect = userAnswer === q.correct;
      if (isCorrect) {
        correct++;
        textCorrect++;
      }
      return {
        id: q.id,
        question: q.question,
        options: q.options,
        userAnswer,
        correctAnswer: q.correct,
        explanation: q.explanation,
        isCorrect,
      };
    });
    breakdown.push({
      textId: row.id,
      slug: row.slug,
      title: row.title,
      correct: textCorrect,
      total: qs.length,
      questions: questionBreakdown,
    });
  }

  // Persist score / finalized_at unless already done (idempotent).
  if (!attempt.finalizedAt) {
    await db
      .update(readingMockAttempts)
      .set({ score: correct, maxScore: total, finalizedAt: sql`now()` })
      .where(eq(readingMockAttempts.id, attemptId));
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

/** Cancel an active attempt — deletes it entirely. No history record kept. */
export async function cancelAttempt(db: DB, attemptId: string, userId: string): Promise<void> {
  await db
    .delete(readingMockAttempts)
    .where(
      and(
        eq(readingMockAttempts.id, attemptId),
        eq(readingMockAttempts.userId, userId),
        isNull(readingMockAttempts.finalizedAt),
      ),
    );
}

export interface MockHistoryItem {
  id: string;
  level: CefrLevel;
  score: number;
  maxScore: number;
  finalizedAt: Date;
  durationSeconds: number;
}

export async function getMockHistory(
  db: DB,
  userId: string,
  limit = 10,
): Promise<MockHistoryItem[]> {
  const rows = await db
    .select({
      id: readingMockAttempts.id,
      level: readingMockAttempts.level,
      score: readingMockAttempts.score,
      maxScore: readingMockAttempts.maxScore,
      startedAt: readingMockAttempts.startedAt,
      finalizedAt: readingMockAttempts.finalizedAt,
    })
    .from(readingMockAttempts)
    .where(
      and(
        eq(readingMockAttempts.userId, userId),
        sql`${readingMockAttempts.finalizedAt} IS NOT NULL`,
      ),
    )
    .orderBy(desc(readingMockAttempts.finalizedAt))
    .limit(limit);

  return rows
    .filter((r) => r.finalizedAt && r.score !== null && r.maxScore !== null)
    .map((r) => ({
      id: r.id,
      level: r.level as CefrLevel,
      score: r.score!,
      maxScore: r.maxScore!,
      finalizedAt: r.finalizedAt!,
      durationSeconds: Math.floor((r.finalizedAt!.getTime() - r.startedAt.getTime()) / 1000),
    }));
}
