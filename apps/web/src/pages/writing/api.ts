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
  total: number;
  maxTotal: number;
  taskMax: number;
  cohMax: number;
  vocMax: number;
  gramMax: number;
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
