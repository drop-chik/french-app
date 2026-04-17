import { apiRequest } from '../../lib/apiClient';
import { useI18n } from '../../shared/i18n';

export interface WordData {
  id: string;
  french: string;
  translation: string;
  level: string;
  category: string;
  exampleFr: string | null;
  exampleRu: string | null;
  audioUrl: string | null;
  imageUrl: string | null;
  progress: {
    status: string;
    easinessFactor: string;
    interval: number;
    repetitions: number;
    nextReview: string;
    correctCount: number;
    incorrectCount: number;
  } | null;
}

function getLang(): string {
  return useI18n.getState().lang;
}

export const wordsApi = {
  getSession: () =>
    apiRequest<{ words: WordData[]; total: number }>(`/words/session?lang=${getLang()}`),

  recordAnswer: (wordId: string, grade: number) =>
    apiRequest<{ nextReview: string; interval: number }>(`/words/${wordId}/answer`, {
      method: 'POST',
      body: JSON.stringify({ grade }),
    }),

  getDictionary: () =>
    apiRequest<{ words: unknown[] }>(`/words/dictionary?lang=${getLang()}`),

  getDistractors: (wordId: string) =>
    apiRequest<{ distractors: WordData[] }>(`/words/${wordId}/distractors?lang=${getLang()}`),

  requestImage: (wordId: string) =>
    apiRequest<{ imageUrl: string | null; generating: boolean }>(`/words/${wordId}/image`, {
      method: 'POST',
    }),
};
