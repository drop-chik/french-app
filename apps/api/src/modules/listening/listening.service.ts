import { eq, and } from 'drizzle-orm';
import type { DB } from '../../db/index.js';
import { listeningExercises, listeningProgress } from '../../db/schema/index.js';
import { ensureAudio } from '../../services/audio.service.js';
import type { LanguageLevel } from '@french-app/shared-types';

// Explicit column selection — never loads audio_data (large binary)
const exerciseCols = {
  id: listeningExercises.id,
  title: listeningExercises.title,
  level: listeningExercises.level,
  audioUrl: listeningExercises.audioUrl,
  transcript: listeningExercises.transcript,
  questions: listeningExercises.questions,
  durationSec: listeningExercises.durationSec,
  sentenceTimestamps: listeningExercises.sentenceTimestamps,
};

// Get all exercises for a level, with per-user progress joined in.
// `progress` is null when the user has never attempted that exercise.
export async function getExercises(db: DB, userId: string, level: LanguageLevel) {
  const rows = await db
    .select({
      ...exerciseCols,
      progressCompleted: listeningProgress.completed,
      progressScore: listeningProgress.score,
    })
    .from(listeningExercises)
    .leftJoin(
      listeningProgress,
      and(
        eq(listeningProgress.exerciseId, listeningExercises.id),
        eq(listeningProgress.userId, userId),
      ),
    )
    .where(eq(listeningExercises.level, level));

  return rows.map(({ progressCompleted, progressScore, ...ex }) => ({
    ...ex,
    progress: progressCompleted !== null
      ? { completed: progressCompleted, score: progressScore ?? 0 }
      : null,
  }));
}

// Get single exercise (without correct answers; audio_data not loaded)
export async function getExercise(db: DB, userId: string, exerciseId: string) {
  const rows = await db
    .select(exerciseCols)
    .from(listeningExercises)
    .where(eq(listeningExercises.id, exerciseId))
    .limit(1);

  const exercise = rows[0];
  if (!exercise) return null;

  const progress = await db.query.listeningProgress.findFirst({
    where: and(
      eq(listeningProgress.userId, userId),
      eq(listeningProgress.exerciseId, exerciseId),
    ),
  });

  // Return cached URL immediately; if audio not yet generated, trigger background TTS (non-blocking).
  const audioUrl = exercise.audioUrl ? `/api${exercise.audioUrl}` : '';
  if (!exercise.audioUrl) {
    ensureAudio(db, exerciseId, exercise.transcript, '').catch((err) =>
      console.error('[audio] background generation failed:', err),
    );
  }

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
    audioUrl,
    transcript: exercise.transcript,
    durationSec: exercise.durationSec,
    sentenceTimestamps: exercise.sentenceTimestamps as number[] | null,
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
  const rows = await db
    .select(exerciseCols)
    .from(listeningExercises)
    .where(eq(listeningExercises.id, exerciseId))
    .limit(1);

  const exercise = rows[0];
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
