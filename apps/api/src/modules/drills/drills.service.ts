import { eq, and, sql } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import OpenAI from 'openai';
import type { DB } from '../../db/index.js';
import { drillSets, drillQuestions, drillProgress, grammarTopics, grammarProgress } from '../../db/schema/index.js';

// Static mapping: drill slug → grammar topic slug
const DRILL_GRAMMAR_MAP: Record<string, string> = {
  // A1
  'etre-avoir-present':        'verbs-etre-avoir',
  'mots-interrogatifs':        'questions',
  'pluriel-noms':              'nouns-plural',
  'articles-choix':            'articles-definite',
  'genre-des-noms':            'nouns-gender',
  'prepositions-lieu':         'prepositions-place',
  'accord-adjectifs':          'adjectives-agreement',
  // A2
  'verbes-groupe-3-present':   'verbs-present-regular',
  'etre-avoir-passe-compose':  'passe-compose-etre',
  'passe-compose-vs-imparfait':'imparfait',
  'pronoms-cod-coi':           'pronoms-cod-coi',
  'negation-avancee':          'negation-avancee',
  'verbes-pronominaux':        'verbes-pronominaux',
  'futur-simple':              'futur-simple',
  'comparatif-superlatif':     'comparatif-superlatif',
  // B1
  'subjonctif-conjugaison':    'subjonctif-present',
  'pronoms-y-en':              'pronoms-y-en',
  'accord-participe-passe':    'accord-participe-passe',
  'conditionnel-conjugaison':  'conditionnel-present',
  'gerondif':                  'gerondif',
  'subjonctif-usage':          'verbes-subjonctif-infinitif',
  'plus-que-parfait':          'plus-que-parfait',
  'discours-indirect':         'discours-indirect',
  'voix-passive':              'voix-passive',
  'pronoms-relatifs-composes': 'pronoms-relatifs-dont-ou',
  'si-hypothese':              'conditionnel-present',
  'connecteurs-logiques':      'expression-cause',
  // B2
  'subjonctif-passe':          'subjonctif-present',
  'concordance-temps':         'discours-indirect',
};

const openai = new OpenAI({ apiKey: process.env['OPENAI_API_KEY'] });

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

export async function getDrillSession(
  db: DB,
  slug: string,
  userId: string,
  lang: 'ru' | 'en' = 'ru',
) {
  const set = await db.query.drillSets.findFirst({ where: eq(drillSets.slug, slug) });
  if (!set) return null;

  const allQuestions = await db.query.drillQuestions.findMany({
    where: eq(drillQuestions.drillSetId, set.id),
  });

  // Pick 10 random questions
  const shuffled = allQuestions.sort(() => Math.random() - 0.5).slice(0, 10);

  // Resolve grammar link
  let grammarLink: { slug: string; title: string; status: string } | null = null;
  const grammarSlug = DRILL_GRAMMAR_MAP[set.slug];
  if (grammarSlug) {
    try {
      const [topic] = await db
        .select()
        .from(grammarTopics)
        .where(eq(grammarTopics.slug, grammarSlug))
        .limit(1);
      if (topic) {
        const [progress] = await db
          .select()
          .from(grammarProgress)
          .where(and(eq(grammarProgress.userId, userId), eq(grammarProgress.topicId, topic.id)))
          .limit(1);
        grammarLink = {
          slug: grammarSlug,
          title: lang === 'en' ? (topic.titleEn ?? topic.titleRu) : topic.titleRu,
          status: progress?.status ?? 'not_started',
        };
        console.log('[drill] grammarLink resolved:', JSON.stringify(grammarLink));
      } else {
        console.log('[drill] grammar topic NOT FOUND for slug:', grammarSlug);
      }
    } catch (err) {
      console.error('[drill] grammarLink error:', err);
    }
  }
  console.log('[drill] getDrillSession result grammarLink:', grammarLink);

  return {
    id: set.id,
    slug: set.slug,
    title: lang === 'en' ? set.titleEn : set.titleRu,
    description: lang === 'en' ? set.descriptionEn : set.descriptionRu,
    level: set.level,
    category: set.category,
    difficulty: set.difficulty,
    icon: set.icon,
    grammarLink,
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

type GeneratedQuestion = {
  id: string;
  type: 'fill_blank' | 'multiple_choice';
  question: Record<string, unknown>;
  answer: Record<string, unknown>;
  explanation: string | null;
};

export async function generateInfiniteQuestions(
  db: DB,
  slug: string,
): Promise<GeneratedQuestion[] | null> {
  const set = await db.query.drillSets.findFirst({ where: eq(drillSets.slug, slug) });
  if (!set) return null;

  const allQuestions = await db.query.drillQuestions.findMany({
    where: eq(drillQuestions.drillSetId, set.id),
  });

  // Pick 4 varied examples for the prompt (different types if possible)
  const shuffled = allQuestions.sort(() => Math.random() - 0.5);
  const mc = shuffled.filter((q) => q.type === 'multiple_choice').slice(0, 2);
  const fb = shuffled.filter((q) => q.type === 'fill_blank').slice(0, 2);
  const examples = [...mc, ...fb].slice(0, 4);

  const examplesJson = JSON.stringify(
    examples.map((q) => ({
      type: q.type,
      question: q.question,
      answer: q.answer,
      explanation: q.explanation,
    })),
    null,
    2,
  );

  const prompt = `You are a French grammar exercise generator. Create 10 new exercises for this drill.

Drill: "${set.titleEn}" (${set.titleRu})
Level: ${set.level} | Category: ${set.category}

Example questions from this drill (use as format reference — do NOT copy them):
${examplesJson}

Rules:
- Generate exactly 10 ORIGINAL questions, not copies of examples
- Mix "multiple_choice" and "fill_blank" types naturally
- multiple_choice: question has "text" + "options" (2-4 choices); answer has "correct"
- fill_blank: question has "text" (with ___ for blank) + "blanks" (count); answer has "values" (array of strings)
- explanations: short, in French, explain the grammar rule
- All French must be grammatically CORRECT and appropriate for level ${set.level}
- Vary the persons (je/tu/il/nous/vous/ils), tenses, and vocabulary

Return ONLY valid JSON: { "questions": [ ... ] }`;

  let content: string | null = null;
  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      response_format: { type: 'json_object' },
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.85,
      max_tokens: 2500,
    });
    content = completion.choices[0]?.message?.content ?? null;
  } catch {
    return null;
  }

  if (!content) return null;

  let parsed: { questions?: unknown[] };
  try {
    parsed = JSON.parse(content) as { questions?: unknown[] };
  } catch {
    return null;
  }

  if (!Array.isArray(parsed.questions)) return null;

  return parsed.questions.slice(0, 10).map((q) => {
    const raw = q as Record<string, unknown>;
    const type =
      raw['type'] === 'fill_blank' ? ('fill_blank' as const) : ('multiple_choice' as const);
    return {
      id: randomUUID(),
      type,
      question: (raw['question'] as Record<string, unknown>) ?? {},
      answer: (raw['answer'] as Record<string, unknown>) ?? {},
      explanation: typeof raw['explanation'] === 'string' ? raw['explanation'] : null,
    };
  });
}
