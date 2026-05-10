import OpenAI from 'openai';
import { eq, desc, and, sql } from 'drizzle-orm';
import type { DB } from '../../db/index.js';
import {
  writingPrompts,
  writingSubmissions,
  writingFeedback,
  writingProgress,
} from '../../db/schema/index.js';

const openai = new OpenAI({ apiKey: process.env['OPENAI_API_KEY'] });

// ── Types ─────────────────────────────────────────────────────────────────────

export interface WritingCorrection {
  original: string;
  corrected: string;
  type: 'grammar' | 'vocabulary' | 'spelling' | 'style' | 'agreement';
  severity: 'high' | 'medium' | 'low';
  explanation: string;
}

export interface WritingMetrics {
  ttr: number;
  connectorCount: number;
  avgSentenceLen: number;
  wordCount: number;
}

export interface WritingScores {
  taskCompletion: number;
  coherence: number;
  vocabulary: number;
  grammar: number;
  total: number;
  maxTotal: number;
  taskMax: number;
  cohMax: number;
  vocMax: number;
  gramMax: number;
}

export interface WritingFeedbackData {
  scores: WritingScores;
  corrections: WritingCorrection[];
  metrics: WritingMetrics;
  suggestions: Array<{ type: string; suggestion: string; reason: string }>;
  overallComment: string;
  strengths: string[];
  improvements: string[];
}

// ── Connectors list for metric computation ────────────────────────────────────

const CONNECTORS = [
  'donc', 'mais', 'cependant', 'néanmoins', 'pourtant', 'toutefois',
  'en outre', 'de plus', 'par ailleurs', 'qui plus est', 'en revanche',
  'par conséquent', 'd\'abord', 'ensuite', 'enfin', 'finalement',
  'premièrement', 'deuxièmement', 'en premier lieu', 'en second lieu',
  'en effet', 'par exemple', 'notamment', 'c\'est-à-dire', 'ainsi',
  'alors', 'bien que', 'même si', 'malgré', 'grâce à', 'à cause de',
  'certes', 'il est vrai que', 'd\'une part', 'd\'autre part',
  'en conclusion', 'pour conclure', 'en résumé', 'bref', 'en somme',
  'dès lors', 'désormais', 'auparavant', 'par la suite',
  'à cet égard', 'du point de vue', 'en ce qui concerne',
];

// ── Local metric computation ──────────────────────────────────────────────────

function computeMetrics(content: string): WritingMetrics {
  const words = content.trim().split(/\s+/).filter(Boolean);
  const wordCount = words.length;

  const uniqueWords = new Set(words.map(w => w.toLowerCase().replace(/[^a-zàâæçéèêëîïôùûü]/gi, '')));
  const ttr = wordCount > 0 ? Math.round((uniqueWords.size / wordCount) * 100) / 100 : 0;

  const lowerContent = content.toLowerCase();
  const connectorCount = CONNECTORS.filter(c => lowerContent.includes(c)).length;

  const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const avgSentenceLen = sentences.length > 0
    ? Math.round(wordCount / sentences.length)
    : 0;

  return { ttr, connectorCount, avgSentenceLen, wordCount };
}

// ── Score ranges per DELF level ──────────────────────────────────────────────

const SCORE_RANGES: Record<string, { max: number; taskMax: number; cohMax: number; vocMax: number; gramMax: number }> = {
  A1: { max: 20, taskMax: 8, cohMax: 6, vocMax: 4, gramMax: 2 },
  A2: { max: 25, taskMax: 8, cohMax: 8, vocMax: 5, gramMax: 4 },
  B1: { max: 25, taskMax: 8, cohMax: 8, vocMax: 5, gramMax: 4 },
  B2: { max: 50, taskMax: 16, cohMax: 16, vocMax: 10, gramMax: 8 },
};

// ── AI system prompt ──────────────────────────────────────────────────────────

function buildSystemPrompt(level: string, writingType: string, promptFr: string, minWords: number, maxWords: number) {
  const scoreRanges = SCORE_RANGES;
  const s = scoreRanges[level] ?? scoreRanges['B1']!;

  return `Tu es un correcteur expert du DELF niveau ${level}, spécialisé dans l'évaluation des productions écrites.

TÂCHE D'ÉCRITURE : ${writingType}
CONSIGNE ORIGINALE : ${promptFr}
LONGUEUR ATTENDUE : ${minWords}-${maxWords} mots

Évalue la production de l'étudiant STRICTEMENT selon la grille DELF :
- Réalisation de la tâche (0-${s.taskMax}) : tous les éléments demandés présents ? registre approprié ?
- Cohérence et cohésion (0-${s.cohMax}) : organisation, connecteurs logiques, progression ?
- Étendue du vocabulaire (0-${s.vocMax}) : richesse, précision, diversité ?
- Maîtrise grammaticale (0-${s.gramMax}) : conjugaison, accords, syntaxe ?

Réponds UNIQUEMENT avec ce JSON (sans markdown, sans texte avant/après) :
{
  "scores": {
    "taskCompletion": <0-${s.taskMax}>,
    "coherence": <0-${s.cohMax}>,
    "vocabulary": <0-${s.vocMax}>,
    "grammar": <0-${s.gramMax}>,
    "total": <somme>,
    "maxTotal": ${s.max}
  },
  "corrections": [
    {
      "original": "texte exact de l'étudiant",
      "corrected": "version corrigée",
      "type": "grammar|vocabulary|spelling|style|agreement",
      "severity": "high|medium|low",
      "explanation": "explication courte EN RUSSE (max 15 mots)"
    }
  ],
  "suggestions": [
    {
      "type": "connector|vocabulary|tense|sentence_structure|register",
      "suggestion": "suggestion concrète EN RUSSE",
      "reason": "pourquoi EN RUSSE (max 12 mots)"
    }
  ],
  "overallComment": "commentaire général encourageant EN RUSSE (2-3 phrases)",
  "strengths": ["point fort 1 EN RUSSE", "point fort 2 EN RUSSE"],
  "improvements": ["priorité 1 EN RUSSE", "priorité 2 EN RUSSE"]
}

RÈGLES STRICTES :
- Maximum 8 corrections (les plus importantes seulement)
- Maximum 3 suggestions
- Sois précis et bienveillant
- Les corrections doivent citer le texte EXACT de l'étudiant
- severity "high" = change le sens ou incompréhensible, "medium" = erreur notable, "low" = style
`.trim();
}

// ── Service functions ─────────────────────────────────────────────────────────

export async function getPrompts(db: DB, level?: string, writingType?: string) {
  const conditions = [eq(writingPrompts.isActive, true)];
  if (level) conditions.push(eq(writingPrompts.level, level as 'A1' | 'A2' | 'B1' | 'B2'));
  if (writingType) conditions.push(eq(writingPrompts.writingType, writingType as 'postcard'));

  return db.query.writingPrompts.findMany({
    where: and(...conditions),
    orderBy: [writingPrompts.level, writingPrompts.writingType],
  });
}

export async function getPromptBySlug(db: DB, slug: string) {
  return db.query.writingPrompts.findFirst({
    where: eq(writingPrompts.slug, slug),
  });
}

export async function getPromptById(db: DB, id: string) {
  return db.query.writingPrompts.findFirst({
    where: eq(writingPrompts.id, id),
  });
}

export async function saveSubmission(
  db: DB,
  userId: string,
  promptId: string,
  content: string,
  level: string,
  status: 'draft' | 'submitted',
  submissionId?: string,
) {
  const wordCount = content.trim().split(/\s+/).filter(Boolean).length;

  if (submissionId) {
    const [updated] = await db
      .update(writingSubmissions)
      .set({
        content,
        wordCount,
        status,
        updatedAt: new Date(),
        submittedAt: status === 'submitted' ? new Date() : undefined,
      })
      .where(and(eq(writingSubmissions.id, submissionId), eq(writingSubmissions.userId, userId)))
      .returning();
    return updated;
  }

  const [created] = await db
    .insert(writingSubmissions)
    .values({
      userId,
      promptId,
      content,
      wordCount,
      level: level as 'A1' | 'A2' | 'B1' | 'B2',
      status,
      submittedAt: status === 'submitted' ? new Date() : null,
    })
    .returning();
  return created;
}

export async function getUserSubmissions(db: DB, userId: string) {
  return db.query.writingSubmissions.findMany({
    where: eq(writingSubmissions.userId, userId),
    orderBy: [desc(writingSubmissions.createdAt)],
    with: { prompt: true, feedback: true },
  });
}

export async function getSubmissionById(db: DB, userId: string, submissionId: string) {
  return db.query.writingSubmissions.findFirst({
    where: and(
      eq(writingSubmissions.id, submissionId),
      eq(writingSubmissions.userId, userId),
    ),
    with: { prompt: true, feedback: true },
  });
}

export async function generateFeedback(
  db: DB,
  userId: string,
  submissionId: string,
): Promise<WritingFeedbackData> {
  const submission = await db.query.writingSubmissions.findFirst({
    where: and(
      eq(writingSubmissions.id, submissionId),
      eq(writingSubmissions.userId, userId),
    ),
    with: { prompt: true },
  });

  if (!submission) throw new Error('Submission not found');
  if (!submission.prompt) throw new Error('Prompt not found');

  const metrics = computeMetrics(submission.content);

  const systemPrompt = buildSystemPrompt(
    submission.level,
    submission.prompt.writingType,
    submission.prompt.promptFr,
    submission.prompt.minWords,
    submission.prompt.maxWords,
  );

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: submission.content },
    ],
    temperature: 0.3,
    response_format: { type: 'json_object' },
  });

  const raw = response.choices[0]?.message?.content ?? '{}';
  const parsed = JSON.parse(raw) as WritingFeedbackData;

  const s = SCORE_RANGES[submission.level] ?? SCORE_RANGES['B1']!;

  const feedbackData: WritingFeedbackData = {
    scores: {
      ...parsed.scores,
      taskMax: s.taskMax,
      cohMax: s.cohMax,
      vocMax: s.vocMax,
      gramMax: s.gramMax,
    },
    corrections: parsed.corrections ?? [],
    metrics,
    suggestions: parsed.suggestions ?? [],
    overallComment: parsed.overallComment ?? '',
    strengths: parsed.strengths ?? [],
    improvements: parsed.improvements ?? [],
  };

  // Upsert feedback
  await db
    .insert(writingFeedback)
    .values({
      submissionId,
      scores: feedbackData.scores,
      corrections: feedbackData.corrections,
      metrics: feedbackData.metrics,
      suggestions: feedbackData.suggestions,
      overallComment: feedbackData.overallComment,
      strengths: feedbackData.strengths,
      improvements: feedbackData.improvements,
    })
    .onConflictDoUpdate({
      target: writingFeedback.submissionId,
      set: {
        scores: feedbackData.scores,
        corrections: feedbackData.corrections,
        metrics: feedbackData.metrics,
        suggestions: feedbackData.suggestions,
        overallComment: feedbackData.overallComment,
        strengths: feedbackData.strengths,
        improvements: feedbackData.improvements,
        generatedAt: new Date(),
      },
    });

  // Update writing progress
  await updateWritingProgress(db, userId);

  return feedbackData;
}

async function updateWritingProgress(db: DB, userId: string) {
  const submissions = await db.query.writingSubmissions.findMany({
    where: and(
      eq(writingSubmissions.userId, userId),
      eq(writingSubmissions.status, 'submitted'),
    ),
    with: { feedback: true },
  });

  const withFeedback = submissions.filter(s => s.feedback);
  if (withFeedback.length === 0) return;

  const avgScore = withFeedback.reduce((sum, s) => {
    const fb = s.feedback;
    if (!fb) return sum;
    const scores = fb.scores as WritingScores;
    return sum + (scores.total / scores.maxTotal) * 100;
  }, 0) / withFeedback.length;

  const avgWordCount = submissions.reduce((sum, s) => sum + s.wordCount, 0) / submissions.length;

  // Compute area scores from all feedback
  const areaScores = withFeedback.reduce(
    (acc, s) => {
      const scores = (s.feedback!.scores as WritingScores);
      acc.taskCompletion += (scores.taskCompletion / (scores.maxTotal * 0.32)) * 100;
      acc.coherence += (scores.coherence / (scores.maxTotal * 0.32)) * 100;
      acc.vocabulary += (scores.vocabulary / (scores.maxTotal * 0.2)) * 100;
      acc.grammar += (scores.grammar / (scores.maxTotal * 0.16)) * 100;
      return acc;
    },
    { taskCompletion: 0, coherence: 0, vocabulary: 0, grammar: 0 },
  );
  Object.keys(areaScores).forEach(k => {
    (areaScores as Record<string, number>)[k] = Math.round((areaScores as Record<string, number>)[k]! / withFeedback.length);
  });

  await db
    .insert(writingProgress)
    .values({
      userId,
      totalSubmissions: submissions.length,
      avgScore: avgScore.toFixed(2),
      avgWordCount: avgWordCount.toFixed(1),
      areaScores,
      lastWritingAt: new Date(),
    })
    .onConflictDoUpdate({
      target: writingProgress.userId,
      set: {
        totalSubmissions: submissions.length,
        avgScore: sql`${avgScore.toFixed(2)}`,
        avgWordCount: sql`${avgWordCount.toFixed(1)}`,
        areaScores,
        lastWritingAt: new Date(),
        updatedAt: new Date(),
      },
    });
}

export async function getUserStats(db: DB, userId: string) {
  const progress = await db.query.writingProgress.findFirst({
    where: eq(writingProgress.userId, userId),
  });

  const recentSubmissions = await db.query.writingSubmissions.findMany({
    where: eq(writingSubmissions.userId, userId),
    orderBy: [desc(writingSubmissions.createdAt)],
    limit: 10,
    with: { feedback: true, prompt: true },
  });

  return { progress, recentSubmissions };
}
