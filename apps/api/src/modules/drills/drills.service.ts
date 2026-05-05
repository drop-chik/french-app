import { eq, sql } from 'drizzle-orm';
import type { DB } from '../../db/index.js';
import { drillSets, drillQuestions, drillProgress } from '../../db/schema/index.js';

export async function getDrills(db: DB, userId: string, lang: 'ru' | 'en' = 'ru') {
  const sets = await db.query.drillSets.findMany({ orderBy: drillSets.difficulty });

  const progressRecords = await db.query.drillProgress.findMany({
    where: eq(drillProgress.userId, userId),
  });
  const progressMap = new Map(progressRecords.map((p) => [p.drillSetId, p]));

  return sets.map((s) => {
    const p = progressMap.get(s.id);
    return {
      id: s.id,
      slug: s.slug,
      title: lang === 'en' ? s.titleEn : s.titleRu,
      description: lang === 'en' ? s.descriptionEn : s.descriptionRu,
      level: s.level,
      category: s.category,
      difficulty: s.difficulty,
      questionCount: s.questionCount,
      icon: s.icon,
      bestScore: p?.bestScore ?? 0,
      totalSessions: p?.totalSessions ?? 0,
      lastPlayedAt: p?.lastPlayedAt ?? null,
    };
  });
}

export async function getDrillSession(db: DB, slug: string, lang: 'ru' | 'en' = 'ru') {
  const set = await db.query.drillSets.findFirst({ where: eq(drillSets.slug, slug) });
  if (!set) return null;

  const allQuestions = await db.query.drillQuestions.findMany({
    where: eq(drillQuestions.drillSetId, set.id),
  });

  // Pick 10 random questions
  const shuffled = allQuestions.sort(() => Math.random() - 0.5).slice(0, 10);

  return {
    id: set.id,
    slug: set.slug,
    title: lang === 'en' ? set.titleEn : set.titleRu,
    description: lang === 'en' ? set.descriptionEn : set.descriptionRu,
    level: set.level,
    category: set.category,
    difficulty: set.difficulty,
    icon: set.icon,
    questions: shuffled.map((q) => ({
      id: q.id,
      type: q.type,
      question: q.question,
      answer: q.answer,
      explanation: q.explanation,
    })),
  };
}

export async function submitDrillSession(
  db: DB,
  userId: string,
  slug: string,
  answers: Record<string, unknown>,
) {
  const set = await db.query.drillSets.findFirst({ where: eq(drillSets.slug, slug) });
  if (!set) return null;

  const questionIds = Object.keys(answers);
  if (questionIds.length === 0) return null;

  const questions = await db.query.drillQuestions.findMany({
    where: eq(drillQuestions.drillSetId, set.id),
  });
  const qMap = new Map(questions.map((q) => [q.id, q]));

  let correct = 0;
  const results: Record<string, { isCorrect: boolean; correctAnswer: unknown }> = {};

  for (const [qId, userAnswer] of Object.entries(answers)) {
    const q = qMap.get(qId);
    if (!q) continue;

    const ans = q.answer as Record<string, unknown>;
    let isCorrect = false;

    if (q.type === 'multiple_choice') {
      isCorrect = String(userAnswer).trim().toLowerCase() === String(ans.correct).trim().toLowerCase();
      results[qId] = { isCorrect, correctAnswer: ans.correct };
    } else if (q.type === 'fill_blank') {
      const values = ans.values as string[];
      const userValues = Array.isArray(userAnswer) ? userAnswer : [userAnswer];
      isCorrect = values.every((v, i) =>
        String(userValues[i] ?? '').trim().toLowerCase() === v.trim().toLowerCase()
      );
      results[qId] = { isCorrect, correctAnswer: values };
    }

    if (isCorrect) correct++;
  }

  const total = questionIds.length;
  const score = Math.round((correct / total) * 100);

  // Upsert progress
  const existing = await db.query.drillProgress.findFirst({
    where: (t) => sql`${t.userId} = ${userId} AND ${t.drillSetId} = ${set.id}`,
  });

  if (existing) {
    await db
      .update(drillProgress)
      .set({
        bestScore: Math.max(existing.bestScore, score),
        totalSessions: existing.totalSessions + 1,
        lastPlayedAt: new Date(),
      })
      .where(eq(drillProgress.id, existing.id));
  } else {
    await db.insert(drillProgress).values({
      userId,
      drillSetId: set.id,
      bestScore: score,
      totalSessions: 1,
      lastPlayedAt: new Date(),
    });
  }

  return { score, correct, total, results };
}
