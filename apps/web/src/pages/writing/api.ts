import { apiRequest } from '../../lib/apiClient';

export interface WritingPrompt {
  id: string;
  slug: string;
  titleRu: string;
  titleEn: string;
  level: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
  writingType: string;
  promptRu: string;
  promptEn: string;
  promptFr: string;
  tipsRu: string[];
  tipsEn: string[];
  minWords: number;
  maxWords: number;
  requiredElements: string[];
  isActive: boolean;
  isAiGenerated?: boolean;
  createdByUserId?: string | null;
  createdAt?: string;
}

export type WritingTypeId =
  | 'postcard' | 'message' | 'letter_informal' | 'letter_formal'
  | 'email' | 'description' | 'blog_article' | 'essay' | 'narrative';

export interface WritingSubmission {
  id: string;
  userId: string;
  promptId: string;
  content: string;
  wordCount: number;
  level: string;
  status: 'draft' | 'submitted';
  submittedAt: string | null;
  createdAt: string;
  updatedAt: string;
  prompt?: WritingPrompt;
  feedback?: WritingFeedback;
}

export interface WritingCorrection {
  original: string;
  corrected: string;
  type: 'grammar' | 'vocabulary' | 'spelling' | 'style' | 'agreement';
  severity: 'high' | 'medium' | 'low';
  explanation: string;
}

export interface WritingScores {
  taskCompletion: number;
  coherence: number;
  vocabulary: number;
  grammar: number;
  /** New in the 7-category rubric. Optional for backward compat with old saved feedback. */
  sociolinguistic?: number | null;
  spelling?: number | null;
  presentation?: number | null;
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

export interface WritingMetrics {
  ttr: number;
  connectorCount: number;
  avgSentenceLen: number;
  wordCount: number;
}

export interface WritingFeedback {
  id: string;
  submissionId: string;
  scores: WritingScores;
  corrections: WritingCorrection[];
  metrics: WritingMetrics;
  suggestions: Array<{ type: string; suggestion: string; reason: string }>;
  overallComment: string;
  strengths: string[];
  improvements: string[];
  generatedAt: string;
}

export interface WritingProgress {
  totalSubmissions: number;
  avgScore: string;
  avgWordCount: string;
  areaScores: {
    taskCompletion: number;
    coherence: number;
    vocabulary: number;
    grammar: number;
  };
  lastWritingAt: string;
}

// ── Mock exam (DELF PE) ─────────────────────────────────────────────────────
export type CefrLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';

export interface WritingMockPrompt {
  id: string; level: CefrLevel; writingType: string;
  titleRu: string; titleEn: string;
  promptRu: string; promptEn: string; promptFr: string;
  tipsRu: string[]; tipsEn: string[];
  minWords: number; maxWords: number;
}
export interface WritingMockAttempt {
  id: string; level: CefrLevel; startedAt: string;
  timeLimitSeconds: number; remainingSeconds: number; prompt: WritingMockPrompt;
}
export interface WritingMockHistoryItem {
  id: string; level: CefrLevel; score: number; maxScore: number;
  submittedAt: string; durationSeconds: number; submissionId: string | null;
}

export const writingMockApi = {
  start: (level: CefrLevel) =>
    apiRequest<{ attempt: WritingMockAttempt }>(`/writing/mock/start`, { method: 'POST', body: JSON.stringify({ level }) }),
  active: () =>
    apiRequest<{ active: WritingMockAttempt | null }>(`/writing/mock/active`),
  submit: (attemptId: string, text: string) =>
    apiRequest<{ feedback: WritingFeedback; submissionId: string }>(`/writing/mock/${attemptId}/submit`, { method: 'POST', body: JSON.stringify({ text }) }),
  cancel: (attemptId: string) =>
    apiRequest<{ ok: true }>(`/writing/mock/${attemptId}`, { method: 'DELETE' }),
  history: () =>
    apiRequest<{ history: WritingMockHistoryItem[] }>(`/writing/mock/history`),
};

export const writingApi = {
  getPrompts: (level?: string, type?: string) => {
    const params = new URLSearchParams();
    if (level) params.set('level', level);
    if (type) params.set('type', type);
    const qs = params.toString();
    return apiRequest<{ prompts: WritingPrompt[] }>(`/writing/prompts${qs ? `?${qs}` : ''}`);
  },

  getPromptBySlug: (slug: string) =>
    apiRequest<{ prompt: WritingPrompt }>(`/writing/prompts/${slug}`),

  saveSubmission: (data: {
    promptId: string;
    content: string;
    status: 'draft' | 'submitted';
    submissionId?: string;
  }) =>
    apiRequest<{ submission: WritingSubmission }>('/writing/submissions', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getSubmissions: () =>
    apiRequest<{ submissions: WritingSubmission[] }>('/writing/submissions'),

  getSubmissionById: (id: string) =>
    apiRequest<{ submission: WritingSubmission }>(`/writing/submissions/${id}`),

  generateFeedback: (id: string) =>
    apiRequest<{ feedback: WritingFeedback }>(`/writing/submissions/${id}/feedback`, {
      method: 'POST',
      // GPT-4o evaluation of a 200-word essay can take 30-60s.
      timeoutMs: 90_000,
    }),

  getStats: () =>
    apiRequest<{ progress: WritingProgress | null; recentSubmissions: WritingSubmission[] }>(
      '/writing/stats',
    ),

  // AI-generated prompts — owned by the calling user only.
  getAiPrompts: () =>
    apiRequest<{ prompts: WritingPrompt[] }>('/writing/prompts/ai'),

  generatePrompt: (params: { level: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2'; writingType: WritingTypeId; topicHint?: string }) =>
    apiRequest<{ prompt: WritingPrompt }>('/writing/prompts/generate', {
      method: 'POST',
      body: JSON.stringify(params),
      // Topic generation is shorter than feedback but still AI — give it 60s.
      timeoutMs: 60_000,
    }),
};
