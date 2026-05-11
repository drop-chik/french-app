import { eq, and, desc, ilike, or } from 'drizzle-orm';
import type { DB } from '../../db/index.js';
import { readingTexts, readingProgress, words, wordProgress } from '../../db/schema/index.js';

export interface ReadingQuestion {
  id: string;
  question: string;
  options: string[];
  correct: string;
  explanation: string;
}

export interface WordEntry {
  tr: string;
  pos: string;
}

export async function getTexts(
  db: DB,
  userId: string,
  level?: string,
  topic?: string,
) {
  const conditions = [eq(readingTexts.isActive, true)];
  if (level) conditions.push(eq(readingTexts.level, level as 'A1' | 'A2' | 'B1' | 'B2'));
  if (topic) conditions.push(eq(readingTexts.topic, topic));

  const textRows = await db
    .select({
      id: readingTexts.id,
      slug: readingTexts.slug,
      title: readingTexts.title,
      level: readingTexts.level,
      topic: readingTexts.topic,
      estimatedMinutes: readingTexts.estimatedMinutes,
      createdAt: readingTexts.createdAt,
    })
    .from(readingTexts)
    .where(and(...conditions))
    .orderBy(readingTexts.level, readingTexts.topic);

  if (textRows.length === 0) return [];

  const textIds = textRows.map((t) => t.id);
  const progressRows = await db
    .select({
      textId: readingProgress.textId,
      score: readingProgress.score,
      totalQuestions: readingProgress.totalQuestions,
      completedAt: readingProgress.completedAt,
    })
    .from(readingProgress)
    .where(eq(readingProgress.userId, userId));

  const progressMap = new Map(progressRows.map((p) => [p.textId, p]));

  return textRows.map((t) => {
    const prog = progressMap.get(t.id);
    return {
      ...t,
      completed: !!prog?.completedAt,
      score: prog?.score ?? null,
      totalQuestions: prog?.totalQuestions ?? null,
    };
  });
}

export async function getTextBySlug(db: DB, userId: string, slug: string) {
  const text = await db.query.readingTexts.findFirst({
    where: and(eq(readingTexts.slug, slug), eq(readingTexts.isActive, true)),
  });
  if (!text) return null;

  const prog = await db.query.readingProgress.findFirst({
    where: and(
      eq(readingProgress.userId, userId),
      eq(readingProgress.textId, text.id),
    ),
  });

  return {
    ...text,
    wordMap: text.wordMap as Record<string, WordEntry>,
    questions: text.questions as ReadingQuestion[],
    progress: prog
      ? {
          completedAt: prog.completedAt,
          score: prog.score,
          totalQuestions: prog.totalQuestions,
          wordsLookedUp: prog.wordsLookedUp as string[],
          wordsSaved: prog.wordsSaved as string[],
        }
      : null,
  };
}

export async function saveProgress(
  db: DB,
  userId: string,
  textId: string,
  score: number,
  totalQuestions: number,
  wordsLookedUp: string[],
  wordsSaved: string[],
) {
  await db
    .insert(readingProgress)
    .values({
      userId,
      textId,
      score,
      totalQuestions,
      wordsLookedUp,
      wordsSaved,
      completedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: [readingProgress.userId, readingProgress.textId],
      set: {
        score,
        totalQuestions,
        wordsLookedUp,
        wordsSaved,
        completedAt: new Date(),
      },
    });
}

export async function saveWordToVocab(db: DB, userId: string, wordFr: string) {
  // Find the word in our words table (case-insensitive, try exact then ilike)
  let word = await db.query.words.findFirst({
    where: eq(words.french, wordFr),
  });

  if (!word) {
    word = await db.query.words.findFirst({
      where: ilike(words.french, wordFr),
    });
  }

  if (!word) return { added: false, reason: 'Word not in dictionary' };

  const existing = await db.query.wordProgress.findFirst({
    where: and(eq(wordProgress.userId, userId), eq(wordProgress.wordId, word.id)),
  });

  if (existing) return { added: false, reason: 'Already in vocabulary' };

  const now = new Date();
  await db.insert(wordProgress).values({
    userId,
    wordId: word.id,
    status: 'learning',
    easinessFactor: '2.50',
    interval: 1,
    repetitions: 0,
    nextReview: now,
    lastReviewed: now,
    correctCount: 0,
    incorrectCount: 0,
  });

  return { added: true, wordId: word.id };
}

export async function getUserStats(db: DB, userId: string) {
  const completed = await db
    .select({ textId: readingProgress.textId, score: readingProgress.score, totalQuestions: readingProgress.totalQuestions })
    .from(readingProgress)
    .where(and(eq(readingProgress.userId, userId)))
    .orderBy(desc(readingProgress.completedAt));

  return {
    totalCompleted: completed.filter((r) => r.score !== null).length,
    texts: completed,
  };
}
