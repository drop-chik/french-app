import { eq, and } from 'drizzle-orm';
import type { DB } from '../../db/index.js';
import { listeningExercises, listeningProgress } from '../../db/schema/index.js';
import type { LanguageLevel } from '@french-app/shared-types';

// Get all exercises for a level
export async function getExercises(db: DB, level: LanguageLevel) {
  return db.query.listeningExercises.findMany({
    where: eq(listeningExercises.level, level),
  });
}

// Get single exercise (without correct answers in questions)
export async function getExercise(db: DB, userId: string, exerciseId: string) {
  const exercise = await db.query.listeningExercises.findFirst({
    where: eq(listeningExercises.id, exerciseId),
  });
  if (!exercise) return null;

  const progress = await db.query.listeningProgress.findFirst({
    where: and(
      eq(listeningProgress.userId, userId),
      eq(listeningProgress.exerciseId, exerciseId),
    ),
  });

  // Strip correct answers from questions for client
  const questions = (exercise.questions as Array<{
    id: string;
    text: string;
    options: string[];
    correct: string;
  }>).map(({ correct: _, ...q }) => q);

  return {
    id: exercise.id,
    title: exercise.title,
    level: exercise.level,
    audioUrl: exercise.audioUrl,
    transcript: exercise.transcript,
    durationSec: exercise.durationSec,
    questions,
    progress: progress
      ? { completed: progress.completed, score: progress.score }
      : null,
  };
}

// Check answers and save progress
export async function submitAnswers(
  db: DB,
  userId: string,
  exerciseId: string,
  answers: Record<string, string>,
) {
  const exercise = await db.query.listeningExercises.findFirst({
    where: eq(listeningExercises.id, exerciseId),
  });
  if (!exercise) throw new Error('Exercise not found');

  const questions = exercise.questions as Array<{
    id: string;
    text: string;
    options: string[];
    correct: string;
  }>;

  let correct = 0;
  const results: Record<string, { isCorrect: boolean; correctAnswer: string }> = {};

  for (const q of questions) {
    const isCorrect = answers[q.id] === q.correct;
    if (isCorrect) correct++;
    results[q.id] = { isCorrect, correctAnswer: q.correct };
  }

  const score = Math.round((correct / questions.length) * 100);
  const completed = score >= 50;

  // Upsert progress
  const existing = await db.query.listeningProgress.findFirst({
    where: and(
      eq(listeningProgress.userId, userId),
      eq(listeningProgress.exerciseId, exerciseId),
    ),
  });

  if (existing) {
    await db
      .update(listeningProgress)
      .set({
        completed: completed || existing.completed,
        score: Math.max(score, existing.score ?? 0),
        completedAt: completed && !existing.completed ? new Date() : existing.completedAt,
      })
      .where(eq(listeningProgress.id, existing.id));
  } else {
    await db.insert(listeningProgress).values({
      userId,
      exerciseId,
      completed,
      score,
      completedAt: completed ? new Date() : null,
    });
  }

  return { score, correct, total: questions.length, results };
}
