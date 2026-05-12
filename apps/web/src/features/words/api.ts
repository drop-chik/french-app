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
  progress: {
    status: string;
    interval: number;
    repetitions: number;
    dismissed: boolean;
  } | null;
}

export interface WordCategory {
  name: string;
  count: number;
  masteredCount: number;
}

export const wordsApi = {
  getSession: () =>
    apiRequest<{ words: WordData[]; total: number }>(`/words/session?lang=${getLang()}`),

  // Words tagged with a specific grammar topic. Powers the
  // "practice this topic's vocabulary" CTA on GrammarTopicPage.
  getByGrammarTag: (tag: string) =>
    apiRequest<{ words: WordData[]; total: number }>(`/words/by-tag/${encodeURIComponent(tag)}?lang=${getLang()}`),

  // Words in a vocabulary category. Powers the Dictionary drawer's
  // "practice this category" button.
  getByCategory: (category: string) =>
    apiRequest<{ words: WordData[]; total: number }>(`/words/by-category/${encodeURIComponent(category)}?lang=${getLang()}`),

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

  // "I already know this, never show me again" — kept as a separate endpoint
  // from `mark` because the semantics differ (mastered = passed SRS, dismissed
  // = manually excluded). Backend records a dismissed_at timestamp.
  dismissWord: (wordId: string) =>
    apiRequest<{ ok: boolean }>(`/words/${wordId}/dismiss`, { method: 'POST' }),
  undismissWord: (wordId: string) =>
    apiRequest<{ ok: boolean }>(`/words/${wordId}/undismiss`, { method: 'POST' }),

  // Reset SRS progress and bring a mastered/dismissed word back to active
  // learning. Used by the "Учить заново" button in WordDetailsModal.
  restartWord: (wordId: string) =>
    apiRequest<{ ok: boolean }>(`/words/${wordId}/restart`, { method: 'POST' }),

  // Apply the same action to many words at once. Used by Dictionary's
  // multi-select toolbar.
  bulkAction: (action: 'study' | 'mastered' | 'dismiss' | 'restart', wordIds: string[]) =>
    apiRequest<{ ok: number; failed: number }>('/words/bulk', {
      method: 'POST',
      body: JSON.stringify({ action, wordIds }),
    }),

  // Custom user-private word — added via Dictionary's "+" button. Only the
  // creator sees it. Behaves like any other word in SRS sessions.
  createWord: (data: {
    french: string;
    translation: string;
    level?: string;
    category?: string;
    partOfSpeech?: string;
    gender?: 'm' | 'f' | '';
    exampleFr?: string;
    exampleRu?: string;
  }) =>
    apiRequest<{ word: WordData }>('/words', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Delete a custom user-private word. Owner only.
  deleteWord: (wordId: string) =>
    apiRequest<{ ok: boolean }>(`/words/${wordId}`, { method: 'DELETE' }),

  // Single-word full details — used by the Dictionary modal.
  getWord: (wordId: string) =>
    apiRequest<{ word: WordData & { isDismissed: boolean } }>(
      `/words/${wordId}?lang=${getLang()}`,
    ),
};
