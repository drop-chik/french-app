import { apiRequest } from '../../lib/apiClient';

export interface DrillSet {
  id: string;
  slug: string;
  title: string;
  description: string;
  level: string;
  category: string;
  difficulty: number;
  questionCount: number;
  icon: string;
  grammarTopicSlug: string | null;
  bestScore: number;
  totalSessions: number;
  lastPlayedAt: string | null;
}

export interface DrillQuestion {
  id: string;
  type: 'fill_blank' | 'multiple_choice';
  question: Record<string, unknown>;
  answer: Record<string, unknown>;
  explanation: string | null;
}

export interface GrammarLink {
  slug: string;
  title: string;
  status: 'not_started' | 'in_progress' | 'completed' | 'locked';
}

export interface DrillSession {
  id: string;
  slug: string;
  title: string;
  description: string;
  level: string;
  category: string;
  difficulty: number;
  icon: string;
  grammarLink: GrammarLink | null;
  questions: DrillQuestion[];
}

export interface SubmitResult {
  score: number;
  correct: number;
  total: number;
  results: Record<string, { isCorrect: boolean; correctAnswer: unknown }>;
}

export const drillsApi = {
  getDrills: (lang?: string) =>
    apiRequest<{ drills: DrillSet[] }>(`/drills${lang ? `?lang=${lang}` : ''}`),

  getSession: (slug: string, lang?: string) =>
    apiRequest<{ drill: DrillSession }>(`/drills/${slug}${lang ? `?lang=${lang}` : ''}`),

  submit: (slug: string, answers: Record<string, unknown>) =>
    apiRequest<SubmitResult>(`/drills/${slug}/submit`, {
      method: 'POST',
      body: JSON.stringify({ answers }),
    }),

  generateInfinite: (slug: string) =>
    apiRequest<{ questions: DrillQuestion[] }>(`/drills/${slug}/infinite`, {
      method: 'POST',
    }),
};
