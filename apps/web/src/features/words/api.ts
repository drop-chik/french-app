import { apiRequest } from '../../lib/apiClient';
import { useI18n } from '../../shared/i18n';

export interface WordData {
  id: string;
  french: string;
  ipa: string | null;
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
  // NULL = ships with the seed; non-NULL = user added it via Dictionary
  // "+" button. Only owners can edit/delete.
  createdByUserId?: string | null;
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
  } | null;
}

export interface WordCategory {
  name: string;
  count: number;
  masteredCount: number;
  learnedCount: number;
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

  browse: (
    level: string | 'all',
    category: string | null,
    offset = 0,
    limit = 100,
    q?: string,
    sortBy?: 'alphabet' | 'level' | 'frequency' | 'status' | 'recent',
    statusFilter?: 'all' | 'not-started' | 'in-progress' | 'mastered' | 'mine',
  ) => {
    const cat = category ? `&category=${encodeURIComponent(category)}` : '';
    const search = q ? `&q=${encodeURIComponent(q)}` : '';
    const sort = sortBy ? `&sortBy=${sortBy}` : '';
    const filter = statusFilter ? `&statusFilter=${statusFilter}` : '';
    return apiRequest<{ words: BrowseWord[]; total: number }>(
      `/words/browse?level=${level}&lang=${getLang()}${cat}${search}${sort}${filter}&offset=${offset}&limit=${limit}`,
    );
  },

  markWord: (wordId: string, action: 'study' | 'mastered') =>
    apiRequest<{ ok: boolean }>(`/words/${wordId}/mark`, {
      method: 'POST',
      body: JSON.stringify({ action }),
    }),

  // Reset SRS progress and bring a mastered word back to active learning.
  // Used by the "Учить заново" button in WordDetailsModal.
  restartWord: (wordId: string) =>
    apiRequest<{ ok: boolean }>(`/words/${wordId}/restart`, { method: 'POST' }),

  // Apply the same action to many words at once. Used by Dictionary's
  // multi-select toolbar.
  bulkAction: (action: 'study' | 'mastered' | 'restart', wordIds: string[]) =>
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

  // Update a custom user-private word. Owner only — server checks.
  updateWord: (wordId: string, patch: Partial<{
    french: string;
    translation: string;
    level: string;
    category: string;
    partOfSpeech: string;
    gender: 'm' | 'f' | '';
    exampleFr: string;
    exampleRu: string;
  }>) =>
    apiRequest<{ ok: boolean }>(`/words/${wordId}`, {
      method: 'PATCH',
      body: JSON.stringify(patch),
    }),

  // Delete a custom user-private word. Owner only.
  deleteWord: (wordId: string) =>
    apiRequest<{ ok: boolean }>(`/words/${wordId}`, { method: 'DELETE' }),

  // Single-word full details — used by the Dictionary modal.
  getWord: (wordId: string) =>
    apiRequest<{ word: WordData }>(
      `/words/${wordId}?lang=${getLang()}`,
    ),

  // Lazy-fetch extra example sentences. First call generates via AI + caches
  // server-side; later calls return instantly. Used by WordDetailsModal's
  // "Показать ещё примеры" disclosure.
  getExtraExamples: (wordId: string) =>
    apiRequest<{ examples: Array<{ fr: string; ru: string; en: string }> }>(
      `/words/${wordId}/examples`,
      { method: 'POST' },
    ),
};
