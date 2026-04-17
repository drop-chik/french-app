import { eq, and, asc } from 'drizzle-orm';
import type { DB } from '../../db/index.js';
import { grammarTopics, grammarExercises, grammarProgress } from '../../db/schema/index.js';
import type { LanguageLevel } from '@french-app/shared-types';

// Get all grammar topics for a level with user's progress
export async function getTopics(
  db: DB,
  userId: string,
  level: LanguageLevel,
  lang: 'ru' | 'en' = 'ru',
) {
  const topics = await db.query.grammarTopics.findMany({
    where: eq(grammarTopics.level, level),
    orderBy: [asc(grammarTopics.orderNum)],
  });

  const progressRecords = await db.query.grammarProgress.findMany({
    where: eq(grammarProgress.userId, userId),
  });

  const progressMap = new Map(progressRecords.map((p) => [p.topicId, p]));

  return topics.map((topic, index) => {
    const progress = progressMap.get(topic.id);
    let status: 'locked' | 'available' | 'in_progress' | 'completed' =
      progress?.status ?? 'locked';

    // First topic is always available; unlock next when previous is completed
    if (index === 0 && status === 'locked') {
      status = 'available';
    }

    return {
      id: topic.id,
      slug: topic.slug,
      titleRu: topic.titleRu,
      titleEn: topic.titleEn,
      titleFr: topic.titleFr,
      title: lang === 'en' ? (topic.titleEn ?? topic.titleRu) : topic.titleRu,
      category: topic.category,
      orderNum: topic.orderNum,
      status,
      score: progress?.score ?? 0,
      attempts: progress?.attempts ?? 0,
      completedAt: progress?.completedAt ?? null,
    };
  });
}

// Get a single topic with its theory content
export async function getTopic(
  db: DB,
  userId: string,
  slug: string,
  lang: 'ru' | 'en' = 'ru',
) {
  const topic = await db.query.grammarTopics.findFirst({
    where: eq(grammarTopics.slug, slug),
  });
  if (!topic) return null;

  const progress = await db.query.grammarProgress.findFirst({
    where: and(
      eq(grammarProgress.userId, userId),
      eq(grammarProgress.topicId, topic.id),
    ),
  });

  return {
    id: topic.id,
    slug: topic.slug,
    titleRu: topic.titleRu,
    titleEn: topic.titleEn,
    titleFr: topic.titleFr,
    title: lang === 'en' ? (topic.titleEn ?? topic.titleRu) : topic.titleRu,
    level: topic.level,
    category: topic.category,
    orderNum: topic.orderNum,
    content: lang === 'en' && topic.contentEn ? topic.contentEn : topic.content,
    status: progress?.status ?? 'available',
    score: progress?.score ?? 0,
    attempts: progress?.attempts ?? 0,
  };
}

// Get exercises for a topic (without answers — only for client)
export async function getExercises(db: DB, topicSlug: string, lang: 'ru' | 'en' = 'ru') {
  const topic = await db.query.grammarTopics.findFirst({
    where: eq(grammarTopics.slug, topicSlug),
  });
  if (!topic) return null;

  const exercises = await db.query.grammarExercises.findMany({
    where: eq(grammarExercises.topicId, topic.id),
  });

  // Return exercises without answers (answer checked server-side)
  return exercises.map((ex) => ({
    id: ex.id,
    type: ex.type,
    question: ex.question,
    explanation: lang === 'en' ? (ex.explanationEn ?? ex.explanation) : ex.explanation,
  }));
}

// Check an answer for an exercise
export async function checkAnswer(
  db: DB,
  userId: string,
  exerciseId: string,
  userAnswer: unknown,
  lang: 'ru' | 'en' = 'ru',
): Promise<{ correct: boolean; explanation: string | null; correctAnswer: unknown }> {
  const exercise = await db.query.grammarExercises.findFirst({
    where: eq(grammarExercises.id, exerciseId),
  });
  if (!exercise) throw new Error('Exercise not found');

  const answer = exercise.answer as Record<string, unknown>;
  let correct = false;

  if (exercise.type === 'multiple_choice') {
    const userChoice = String(userAnswer).trim().toLowerCase();
    const correctChoice = String(answer['correct']).trim().toLowerCase();
    correct = userChoice === correctChoice;
  } else if (exercise.type === 'fill_blank') {
    const userValues = Array.isArray(userAnswer) ? userAnswer : [userAnswer];
    const correctValues = (answer['values'] as string[]) ?? [];
    correct = correctValues.every((val, i) => {
      const u = String(userValues[i] ?? '').trim().toLowerCase();
      const c = String(val).trim().toLowerCase();
      return u === c;
    });
  } else if (exercise.type === 'reorder') {
    const userStr = JSON.stringify(userAnswer);
    const correctStr = JSON.stringify(answer['order']);
    correct = userStr === correctStr;
  } else if (exercise.type === 'translate') {
    // Simple exact match (could be improved with fuzzy matching)
    const u = String(userAnswer).trim().toLowerCase();
    const c = String(answer['text']).trim().toLowerCase();
    correct = u === c;
  }

  const explanation =
    lang === 'en'
      ? (exercise.explanationEn ?? exercise.explanation)
      : exercise.explanation;

  return {
    correct,
    explanation,
    correctAnswer: answer['correct'] ?? answer['values'] ?? answer,
  };
}

// Submit exercise results and update progress
export async function submitTopicResults(
  db: DB,
  userId: string,
  topicSlug: string,
  score: number,
  total: number,
) {
  const topic = await db.query.grammarTopics.findFirst({
    where: eq(grammarTopics.slug, topicSlug),
  });
  if (!topic) throw new Error('Topic not found');

  const percentage = Math.round((score / total) * 100);
  const isCompleted = percentage >= 70;

  const existing = await db.query.grammarProgress.findFirst({
    where: and(
      eq(grammarProgress.userId, userId),
      eq(grammarProgress.topicId, topic.id),
    ),
  });

  if (existing) {
    await db
      .update(grammarProgress)
      .set({
        status: isCompleted ? 'completed' : 'in_progress',
        score: Math.max(existing.score, percentage),
        attempts: existing.attempts + 1,
        completedAt: isCompleted && !existing.completedAt ? new Date() : existing.completedAt,
      })
      .where(eq(grammarProgress.id, existing.id));
  } else {
    await db.insert(grammarProgress).values({
      userId,
      topicId: topic.id,
      status: isCompleted ? 'completed' : 'in_progress',
      score: percentage,
      attempts: 1,
      completedAt: isCompleted ? new Date() : null,
    });
  }

  // Unlock next topic if completed
  if (isCompleted) {
    const nextTopic = await db.query.grammarTopics.findFirst({
      where: and(
        eq(grammarTopics.level, topic.level),
        eq(grammarTopics.orderNum, topic.orderNum + 1),
      ),
    });
    if (nextTopic) {
      const nextProgress = await db.query.grammarProgress.findFirst({
        where: and(
          eq(grammarProgress.userId, userId),
          eq(grammarProgress.topicId, nextTopic.id),
        ),
      });
      if (!nextProgress) {
        await db.insert(grammarProgress).values({
          userId,
          topicId: nextTopic.id,
          status: 'available',
          score: 0,
          attempts: 0,
        });
      }
    }
  }

  return { percentage, isCompleted };
}
