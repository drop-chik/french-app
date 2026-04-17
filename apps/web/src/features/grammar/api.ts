import { apiRequest } from '../../lib/apiClient';
import { useI18n } from '../../shared/i18n';

export type TopicStatus = 'locked' | 'available' | 'in_progress' | 'completed';

export interface GrammarTopic {
  id: string;
  slug: string;
  titleRu: string;
  titleEn: string | null;
  titleFr: string;
  title: string;
  category: string;
  orderNum: number;
  status: TopicStatus;
  score: number;
  attempts: number;
  completedAt: string | null;
}

export interface ContentBlock {
  type: 'paragraph' | 'table' | 'example_list' | 'rule_list';
  title?: string;
  text?: string;
  headers?: string[];
  rows?: string[][];
  items?: Array<{ fr: string; ru: string; en?: string; note?: string }>;
  rules?: string[];
}

export interface GrammarTopicDetail extends GrammarTopic {
  level: string;
  content: ContentBlock[];
}

export interface GrammarExercise {
  id: string;
  type: 'fill_blank' | 'multiple_choice' | 'reorder' | 'translate';
  question: {
    text?: string;
    blanks?: number;
    options?: string[];
  };
  explanation: string | null;
}

export interface CheckResult {
  correct: boolean;
  explanation: string | null;
  correctAnswer: unknown;
}

function getLang(): string {
  return useI18n.getState().lang;
}

export const grammarApi = {
  getTopics: (level = 'A1') =>
    apiRequest<{ topics: GrammarTopic[] }>(`/grammar/topics?level=${level}&lang=${getLang()}`),

  getTopic: (slug: string) =>
    apiRequest<{ topic: GrammarTopicDetail }>(`/grammar/topics/${slug}?lang=${getLang()}`),

  getExercises: (slug: string) =>
    apiRequest<{ exercises: GrammarExercise[] }>(
      `/grammar/topics/${slug}/exercises?lang=${getLang()}`,
    ),

  checkAnswer: (exerciseId: string, answer: unknown) =>
    apiRequest<CheckResult>(`/grammar/exercises/${exerciseId}/check?lang=${getLang()}`, {
      method: 'POST',
      body: JSON.stringify({ answer }),
    }),

  submitResults: (slug: string, score: number, total: number) =>
    apiRequest<{ percentage: number; isCompleted: boolean }>(
      `/grammar/topics/${slug}/submit`,
      {
        method: 'POST',
        body: JSON.stringify({ score, total }),
      },
    ),
};
