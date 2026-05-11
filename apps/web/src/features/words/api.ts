import { apiRequest } from '../../lib/apiClient';
import { useI18n } from '../../shared/i18n';

export interface WordData {
  id: string;
  french: string;
  translation: string;
  level: string;
  category: string;
  partOfSpeech: string;
  gender: string | null;
  frequencyRank: number | null;
  grammarTag: string | null;
  isActive: boolean;
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

export interface BrowseWord {
  id: string;
  french: string;
  translation: string;
  level: string;
  category: string;
  partOfSpeech: string;
  exampleFr: string | null;
  exampleRu: string | null;
  progress: { status: string } | null;
}

export interface WordCategory {
  name: string;
  count: number;
  masteredCount: number;
}

export const wordsApi = {
  getSession: () =>
    apiRequest<{ words: WordData[]; total: number }>(`/words/session?lang=${getLang()}`),

  recordAnswer: (wordId: string, grade: number) =>
    apiRequest<{ nextReview: string; interval: number }>(`/words/${wordId}/answer`, {
      method: 'POST',
      body: JSON.stringify({ grade }),
    }),

  getDictionary: (offset = 0, limit = 200) =>
    apiRequest<{ words: unknown[] }>(`/words/dictionary?lang=${getLang()}&offset=${offset}&limit=${limit}`),

  getDistractors: (wordId: string) =>
    apiRequest<{ distractors: WordData[] }>(`/words/${wordId}/distractors?lang=${getLang()}`),

  requestImage: (wordId: string) =>
    apiRequest<{ imageUrl: string | null; generating: boolean }>(`/words/${wordId}/image`, {
      method: 'POST',
    }),

  getCategories: (level: string) =>
    apiRequest<{ categories: WordCategory[] }>(`/words/categories?level=${level}`),

  browse: (level: string | 'all', category: string | null, offset = 0, limit = 100, q?: string) => {
    const cat = category ? `&category=${encodeURIComponent(category)}` : '';
    const search = q ? `&q=${encodeURIComponent(q)}` : '';
    return apiRequest<{ words: BrowseWord[]; total: number }>(
      `/words/browse?level=${level}&lang=${getLang()}${cat}${search}&offset=${offset}&limit=${limit}`,
    );
  },

  markWord: (wordId: string, action: 'study' | 'mastered') =>
    apiRequest<{ ok: boolean }>(`/words/${wordId}/mark`, {
      method: 'POST',
      body: JSON.stringify({ action }),
    }),
};
