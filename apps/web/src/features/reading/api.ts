import { apiRequest } from '../../lib/apiClient';
import { useI18n } from '../../shared/i18n';

function getLang(): string {
  return useI18n.getState().lang;
}

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
  baseForm?: string | null;
  ipa?: string | null;
}

export interface ReadingTextSummary {
  id: string;
  slug: string;
  title: string;
  level: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
  topic: string;
  estimatedMinutes: number;
  completed: boolean;
  score: number | null;
  totalQuestions: number | null;
}

export interface ReadingTextDetail {
  id: string;
  slug: string;
  title: string;
  level: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
  topic: string;
  contentFr: string;
  wordMap: Record<string, WordEntry>;
  questions: ReadingQuestion[];
  estimatedMinutes: number;
  progress: {
    completedAt: string | null;
    score: number | null;
    totalQuestions: number | null;
    wordsLookedUp: string[];
    wordsSaved: string[];
  } | null;
}

export interface SaveProgressPayload {
  score: number;
  totalQuestions: number;
  wordsLookedUp: string[];
  wordsSaved: string[];
}

export const readingApi = {
  getTexts: (level?: string, topic?: string) => {
    const params = new URLSearchParams();
    if (level) params.set('level', level);
    if (topic) params.set('topic', topic);
    const qs = params.toString();
    return apiRequest<{ texts: ReadingTextSummary[] }>(`/reading/texts${qs ? `?${qs}` : ''}`);
  },

  getTextBySlug: (slug: string) =>
    apiRequest<{ text: ReadingTextDetail }>(`/reading/texts/${slug}?lang=${getLang()}`),

  saveProgress: (textId: string, payload: SaveProgressPayload) =>
    apiRequest<{ ok: boolean }>(`/reading/progress/${textId}`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  saveWord: (word: string) =>
    apiRequest<{ added: boolean; reason?: string }>('/reading/words/save', {
      method: 'POST',
      body: JSON.stringify({ word }),
    }),

  translate: (word: string) =>
    apiRequest<{ result: { fr: string; tr: string; pos: string; level: string; baseForm: string | null; ipa: string | null } | null }>(
      `/reading/translate?word=${encodeURIComponent(word)}&lang=${getLang()}`,
    ),
};

// ── Mock test API ────────────────────────────────────────────────────────────

export type CefrLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';

export interface MockMaskedQuestion {
  id: string;
  question: string;
  options: string[];
}

export interface MockText {
  id: string;
  slug: string;
  title: string;
  level: CefrLevel;
  contentFr: string;
  wordMap: Record<string, WordEntry>;
  questions: MockMaskedQuestion[];
  estimatedMinutes: number;
}

export interface MockStoredAnswer {
  textId: string;
  questionId: string;
  answer: string;
}

export interface MockActiveAttempt {
  id: string;
  level: CefrLevel;
  startedAt: string;
  timeLimitSeconds: number;
  remainingSeconds: number;
  texts: MockText[];
  answers: MockStoredAnswer[];
}

export interface MockResult {
  id: string;
  level: CefrLevel;
  score: number;
  maxScore: number;
  finalizedAt: string;
  breakdown: Array<{
    textId: string;
    slug: string;
    title: string;
    correct: number;
    total: number;
    questions: Array<{
      id: string;
      question: string;
      options: string[];
      userAnswer: string | null;
      correctAnswer: string;
      explanation: string;
      isCorrect: boolean;
    }>;
  }>;
}

export interface MockHistoryItem {
  id: string;
  level: CefrLevel;
  score: number;
  maxScore: number;
  finalizedAt: string;
  durationSeconds: number;
}

export const mockApi = {
  start: (level: CefrLevel) =>
    apiRequest<{ attempt: MockActiveAttempt }>(`/reading/mock/start?lang=${getLang()}`, {
      method: 'POST',
      body: JSON.stringify({ level }),
    }),

  active: () =>
    apiRequest<{ active: MockActiveAttempt | { autoFinalized: MockResult } | null }>(
      `/reading/mock/active?lang=${getLang()}`,
    ),

  answer: (attemptId: string, payload: MockStoredAnswer) =>
    apiRequest<{ ok: true }>(`/reading/mock/${attemptId}/answer`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  finalize: (attemptId: string) =>
    apiRequest<{ result: MockResult }>(`/reading/mock/${attemptId}/finalize`, {
      method: 'POST',
    }),

  cancel: (attemptId: string) =>
    apiRequest<{ ok: true }>(`/reading/mock/${attemptId}`, { method: 'DELETE' }),

  history: () =>
    apiRequest<{ items: MockHistoryItem[] }>(`/reading/mock/history`),
};
