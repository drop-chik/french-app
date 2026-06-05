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
  /** Register / tone / sociolinguistic appropriateness. New in the 7-category rubric. */
  sociolinguistic?: number;
  /** Orthography — spelling + punctuation. New in the 7-category rubric. */
  spelling?: number;
  /** Presentation — paragraphing + layout. New in the 7-category rubric. */
  presentation?: number;
  total: number;
  maxTotal: number;
  taskMax: number;
  cohMax: number;
  vocMax: number;
  gramMax: number;
  socioMax?: number;
  spellMax?: number;
  presMax?: number;
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

/**
 * 7-category rubric, deeper than the canonical DELF 4-5 grille — extra
 * weight on sociolinguistic register, spelling, and presentation gives
 * the marketing surface a real "we grade on 7 dimensions" claim and
 * gives the learner a more granular diagnostic. Sums match the original
 * max totals to keep historical scores comparable.
 */
const SCORE_RANGES: Record<string, {
  max: number;
  taskMax: number; cohMax: number; vocMax: number; gramMax: number;
  socioMax: number; spellMax: number; presMax: number;
}> = {
  A1: { max: 20, taskMax: 6,  cohMax: 4,  vocMax: 3,  gramMax: 2, socioMax: 2, spellMax: 2, presMax: 1 },
  A2: { max: 25, taskMax: 7,  cohMax: 6,  vocMax: 4,  gramMax: 3, socioMax: 2, spellMax: 2, presMax: 1 },
  B1: { max: 25, taskMax: 6,  cohMax: 6,  vocMax: 4,  gramMax: 3, socioMax: 2, spellMax: 2, presMax: 2 },
  B2: { max: 50, taskMax: 12, cohMax: 12, vocMax: 8,  gramMax: 8, socioMax: 4, spellMax: 4, presMax: 2 },
};

// ── AI system prompt ──────────────────────────────────────────────────────────

function buildSystemPrompt(level: string, writingType: string, promptFr: string, minWords: number, maxWords: number) {
  const scoreRanges = SCORE_RANGES;
  const s = scoreRanges[level] ?? scoreRanges['B1']!;

  return `Tu es un correcteur expert du DELF niveau ${level}, spécialisé dans l'évaluation des productions écrites.

TÂCHE D'ÉCRITURE : ${writingType}
CONSIGNE ORIGINALE : ${promptFr}
LONGUEUR ATTENDUE : ${minWords}-${maxWords} mots

Évalue la production de l'étudiant STRICTEMENT selon la grille en 7 critères :
- Réalisation de la tâche (0-${s.taskMax}) : tous les éléments demandés présents ?
- Cohérence et cohésion (0-${s.cohMax}) : organisation, connecteurs logiques, progression ?
- Étendue du vocabulaire (0-${s.vocMax}) : richesse, précision, diversité ?
- Maîtrise grammaticale (0-${s.gramMax}) : conjugaison, accords, syntaxe ?
- Sociolinguistique (0-${s.socioMax}) : registre, ton, politesse, adaptation au destinataire ?
- Orthographe (0-${s.spellMax}) : justesse orthographique, ponctuation, accents ?
- Mise en forme (0-${s.presMax}) : paragraphes, mise en page, structure visuelle du texte ?

Réponds UNIQUEMENT avec ce JSON (sans markdown, sans texte avant/après) :
{
  "scores": {
    "taskCompletion":   <0-${s.taskMax}>,
    "coherence":        <0-${s.cohMax}>,
    "vocabulary":       <0-${s.vocMax}>,
    "grammar":          <0-${s.gramMax}>,
    "sociolinguistic":  <0-${s.socioMax}>,
    "spelling":         <0-${s.spellMax}>,
    "presentation":     <0-${s.presMax}>,
    "total": <somme des 7>,
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
- TU DOIS retourner TOUS les 7 scores (taskCompletion, coherence, vocabulary, grammar, sociolinguistic, spelling, presentation). Aucun ne peut manquer. Aucun ne peut être null.
- Si un critère ne s'applique vraiment pas, mets quand même une note (minimum 50% du max si la production est moyenne).
- "total" = la somme exacte des 7 scores. Vérifie l'addition avant de répondre.
- Maximum 8 corrections (les plus importantes seulement)
- Maximum 3 suggestions
- Sois précis et bienveillant
- Les corrections doivent citer le texte EXACT de l'étudiant
- severity "high" = change le sens ou incompréhensible, "medium" = erreur notable, "low" = style
`.trim();
}

// ── Service functions ─────────────────────────────────────────────────────────

export async function getPrompts(db: DB, level?: string, writingType?: string) {
  // Curated prompts only — AI-generated prompts are listed separately via
  // getAiPrompts() to keep the curated DELF library uncluttered.
  const conditions = [
    eq(writingPrompts.isActive, true),
    eq(writingPrompts.isAiGenerated, false),
  ];
  if (level) conditions.push(eq(writingPrompts.level, level as 'A1' | 'A2' | 'B1' | 'B2'));
  if (writingType) conditions.push(eq(writingPrompts.writingType, writingType as 'postcard'));

  return db.query.writingPrompts.findMany({
    where: and(...conditions),
    orderBy: [writingPrompts.level, writingPrompts.writingType],
  });
}

// User's own AI-generated prompts — ordered by most recent first.
export async function getAiPrompts(db: DB, userId: string) {
  return db.query.writingPrompts.findMany({
    where: and(
      eq(writingPrompts.isAiGenerated, true),
      eq(writingPrompts.createdByUserId, userId),
    ),
    orderBy: [desc(writingPrompts.createdAt)],
  });
}

// AI-generated prompts are user-private. Resolvers below take the caller's
// userId and refuse to return another user's AI prompt. Curated prompts
// (isAiGenerated=false) are visible to everyone.
export async function getPromptBySlug(db: DB, slug: string, userId?: string) {
  const prompt = await db.query.writingPrompts.findFirst({
    where: eq(writingPrompts.slug, slug),
  });
  if (!prompt) return null;
  if (prompt.isAiGenerated && prompt.createdByUserId !== userId) return null;
  return prompt;
}

export async function getPromptById(db: DB, id: string, userId?: string) {
  const prompt = await db.query.writingPrompts.findFirst({
    where: eq(writingPrompts.id, id),
  });
  if (!prompt) return null;
  if (prompt.isAiGenerated && prompt.createdByUserId !== userId) return null;
  return prompt;
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

  // Charge Smart Credits BEFORE the AI call so a depleted user can't bleed
  // OpenAI dollars. The thrown error bubbles to the route handler, which
  // maps OUT_OF_CREDITS to HTTP 402.
  const { tryConsume } = await import('../profile/ai-credits.service.js');
  const charge = await tryConsume(db, userId, 'writingFeedback');
  if (!charge.ok) {
    const err = new Error('OUT_OF_CREDITS');
    (err as Error & { resetAt?: string }).resetAt = charge.state.resetAt;
    throw err;
  }

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
      taskMax:  s.taskMax,
      cohMax:   s.cohMax,
      vocMax:   s.vocMax,
      gramMax:  s.gramMax,
      socioMax: s.socioMax,
      spellMax: s.spellMax,
      presMax:  s.presMax,
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

// ── AI-generated writing prompts ─────────────────────────────────────────────

export type WritingType =
  | 'postcard' | 'message' | 'letter_informal' | 'letter_formal'
  | 'email' | 'description' | 'blog_article' | 'essay' | 'narrative';

export interface AiGeneratedPrompt {
  titleRu: string;
  titleEn: string;
  promptFr: string;
  promptRu: string;
  promptEn: string;
  tipsRu: string[];
  tipsEn: string[];
  minWords: number;
  maxWords: number;
  requiredElements: string[];
}

// Per-level grammar/length constraints fed into the system prompt so the
// generator can't drift outside the user's pedagogical envelope.
const LEVEL_CONSTRAINTS: Record<string, string> = {
  A1: 'Grammaire: PRÉSENT UNIQUEMENT (jamais de passé composé, ni imparfait). Vocabulaire élémentaire (vie quotidienne, famille, nourriture, lieux simples). Phrases courtes et simples. Longueur typique: 30-70 mots selon le type.',
  A2: 'Grammaire: présent + passé composé + imparfait + futur proche. Pas de subjonctif, pas de conditionnel passé. Vocabulaire courant. Connecteurs simples (et, mais, parce que, alors). Longueur typique: 80-140 mots selon le type.',
  B1: 'Grammaire: tous les temps de l\'indicatif + subjonctif présent + conditionnel présent. Argumentation simple permise. Connecteurs variés (cependant, par exemple, en effet). Longueur typique: 150-220 mots selon le type.',
  B2: 'Grammaire: tous les temps et modes, y compris subjonctif passé, conditionnel passé, plus-que-parfait. Argumentation développée, idiomes, nuances. Connecteurs sophistiqués. Longueur typique: 250-400 mots selon le type.',
};

// Per-type guidance — what each écrit-type should look like.
const TYPE_GUIDANCE: Record<WritingType, string> = {
  postcard: 'Carte postale: ton amical, court, formules « Salut !... Bises ! ». Lieu + activité + émotion.',
  message: 'Message court (SMS, WhatsApp): très bref, ton familier, but pratique (rendez-vous, info, excuse).',
  letter_informal: 'Lettre informelle: salutation « Cher / Chère », ton amical, sujet personnel, signature simple.',
  letter_formal: 'Lettre formelle: « Madame, Monsieur », registre soutenu, formules de politesse obligatoires, signature complète.',
  email: 'Email: objet implicite, salutation appropriée (formelle ou semi-formelle selon le destinataire), corps clair, closing.',
  description: 'Description: focus sur les détails sensoriels et caractéristiques (lieu, personne, objet, atmosphère).',
  blog_article: 'Article de blog: titre accrocheur, ton personnel mais structuré, opinion ou expérience partagée.',
  essay: 'Essai argumentatif: thèse claire, arguments avec exemples, contre-arguments éventuels, conclusion.',
  narrative: 'Récit: arc narratif clair (situation, événement, dénouement), temps du passé, voix narrative.',
};

function buildPromptGeneratorSystemPrompt(level: string, writingType: WritingType, topicHint?: string) {
  const levelCons = LEVEL_CONSTRAINTS[level] ?? LEVEL_CONSTRAINTS['B1']!;
  const typeGuide = TYPE_GUIDANCE[writingType];
  const topicLine = topicHint
    ? `THÈME IMPOSÉ par l'utilisateur: « ${topicHint} » — respecte ce thème.`
    : `THÈME: libre — invente un sujet concret, original, ancré dans la vie quotidienne ou l'actualité. Évite les sujets scolaires usés (« mon week-end », « ma famille » sauf au A1).`;

  return `Tu génères une consigne de production écrite pour un étudiant de français langue étrangère.

NIVEAU CEFR: ${level}
TYPE D'ÉCRIT: ${writingType}
${typeGuide}

CONTRAINTES NIVEAU ${level}:
${levelCons}

${topicLine}

Réponds UNIQUEMENT avec ce JSON (sans markdown, sans texte avant/après):
{
  "titleRu": "заголовок темы на русском (3-6 слов)",
  "titleEn": "title in English (3-6 words)",
  "promptFr": "la consigne complète en français (1-3 phrases claires)",
  "promptRu": "та же consigne на русском",
  "promptEn": "the same consigne in English",
  "tipsRu": ["совет 1 на русском", "совет 2", "совет 3", "совет 4"],
  "tipsEn": ["tip 1 in English", "tip 2", "tip 3", "tip 4"],
  "minWords": <число>,
  "maxWords": <число>,
  "requiredElements": ["element1", "element2", "element3"]
}

RÈGLES:
- 3 à 5 tips. Les tips DOIVENT mentionner des formulations françaises concrètes (entre guillemets) que l'étudiant peut réutiliser.
- requiredElements: 3-5 mots-clés en anglais snake_case (ex: "greeting", "passé_composé", "opinion") qui décrivent ce que la production doit contenir.
- minWords/maxWords doivent respecter le niveau et le type. Exemples: postcard A1 = 30-50, essay B2 = 280-400.
- Le titre doit être ATTRAYANT mais court — pas générique.
- La consigne doit donner UN scénario clair (qui, quoi, pourquoi, à qui).
`.trim();
}

// Validate and sanitize the AI output — guard against malformed JSON,
// missing fields, and obviously-wrong word ranges.
function validateAiPrompt(raw: unknown, level: string): AiGeneratedPrompt {
  if (!raw || typeof raw !== 'object') throw new Error('AI returned invalid JSON');
  const p = raw as Record<string, unknown>;
  const requireStr = (k: string): string => {
    const v = p[k];
    if (typeof v !== 'string' || !v.trim()) throw new Error(`AI prompt missing or empty: ${k}`);
    return v.trim();
  };
  const requireArrStr = (k: string): string[] => {
    const v = p[k];
    if (!Array.isArray(v) || v.length === 0) throw new Error(`AI prompt missing or empty: ${k}`);
    return v.filter((x): x is string => typeof x === 'string' && x.trim().length > 0);
  };
  const requireInt = (k: string, min: number, max: number): number => {
    const v = Number(p[k]);
    if (!Number.isFinite(v) || v < min || v > max) {
      throw new Error(`AI prompt ${k} out of range [${min}, ${max}]: ${String(p[k])}`);
    }
    return Math.round(v);
  };

  const ranges: Record<string, [number, number]> = {
    A1: [20, 100],
    A2: [60, 180],
    B1: [120, 280],
    B2: [200, 500],
  };
  const [minLo, maxHi] = ranges[level] ?? ranges['B1']!;

  const minWords = requireInt('minWords', minLo, maxHi);
  const maxWords = requireInt('maxWords', minLo, maxHi);
  if (minWords >= maxWords) {
    throw new Error(`AI prompt range invalid: min ${minWords} >= max ${maxWords}`);
  }

  return {
    titleRu: requireStr('titleRu').slice(0, 200),
    titleEn: requireStr('titleEn').slice(0, 200),
    promptFr: requireStr('promptFr'),
    promptRu: requireStr('promptRu'),
    promptEn: requireStr('promptEn'),
    tipsRu: requireArrStr('tipsRu').slice(0, 6),
    tipsEn: requireArrStr('tipsEn').slice(0, 6),
    minWords,
    maxWords,
    requiredElements: requireArrStr('requiredElements').slice(0, 6),
  };
}

// Generate a fresh AI prompt for a user and persist it. Returns the inserted
// row so the frontend can immediately route to the editor.
export async function generateAiPrompt(
  db: DB,
  userId: string,
  params: { level: 'A1' | 'A2' | 'B1' | 'B2'; writingType: WritingType; topicHint?: string },
) {
  const systemPrompt = buildPromptGeneratorSystemPrompt(params.level, params.writingType, params.topicHint);

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: 'Génère maintenant la consigne en respectant strictement le format JSON demandé.' },
    ],
    temperature: 0.8,  // higher = more topical variety
    response_format: { type: 'json_object' },
  });

  const rawText = response.choices[0]?.message?.content ?? '{}';
  let parsed: unknown;
  try {
    parsed = JSON.parse(rawText);
  } catch {
    throw new Error('AI returned malformed JSON');
  }
  const data = validateAiPrompt(parsed, params.level);

  // Slug: "ai-<userShort>-<timestamp>-<random>" — unique enough to never
  // collide with curated slugs or other users' AI prompts.
  const slug = `ai-${userId.slice(0, 8)}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

  const [created] = await db
    .insert(writingPrompts)
    .values({
      slug,
      titleRu: data.titleRu,
      titleEn: data.titleEn,
      level: params.level,
      writingType: params.writingType,
      promptFr: data.promptFr,
      promptRu: data.promptRu,
      promptEn: data.promptEn,
      tipsRu: data.tipsRu,
      tipsEn: data.tipsEn,
      minWords: data.minWords,
      maxWords: data.maxWords,
      requiredElements: data.requiredElements,
      isActive: true,
      isAiGenerated: true,
      createdByUserId: userId,
    })
    .returning();

  return created;
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
