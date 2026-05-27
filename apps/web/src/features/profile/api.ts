import { apiRequest } from '../../lib/apiClient';
import { useAuthStore } from '../auth/authStore';

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  level: string;
  tag: string;
  avatarUrl: string | null;
  uiLanguage: string;
  placementTestDone: boolean;
  dailyNewWordsLimit: number;
  dailyDueWordsLimit: number;
  createdAt: string;
}

export interface LearningStats {
  words: { total: number; mastered: number; learned: number; learning: number; new: number };
  grammar: { completed: number; inProgress: number };
  listening: { completed: number };
  conversations: number;
  correctAnswers: number;
  incorrectAnswers: number;
  weekReviews: number;
  weekTrend: number | null;
  wordsDueToday: number;
}

export interface DayActivity {
  date: string;
  reviewed: number;
  correct: number;
  incorrect: number;
}

export interface WeeklyAccuracy {
  week: string;
  correct: number;
  incorrect: number;
  accuracy: number;
}

export interface ChartsData {
  activity: DayActivity[];
  statusBreakdown: Record<string, number>;
  weekly: WeeklyAccuracy[];
}

export interface HomeData {
  streak: number;
  todayCompleted: boolean;
  levelProgress: {
    level: string;
    percent: number;
    masteredWords: number;
    learnedWords: number;
    totalWords: number;
    completedGrammar: number;
    totalGrammar: number;
    completedListening: number;
    totalListening: number;
  };
  todayPlan: {
    wordsDue: number;
    wordsNew: number;
    nextGrammar: { slug: string; title: string; status: string } | null;
    nextListening: { id: string; title: string; durationSec: number } | null;
  };
}

export interface LevelProgressData {
  level: string;
  masteredWords: number;
  learnedWords: number;
  totalWords: number;
  percent: number;
}

export const profileApi = {
  getProfile: () => apiRequest<UserProfile>('/profile'),

  updateProfile: (data: {
    name?: string;
    email?: string;
    uiLanguage?: string;
    tag?: string;
    dailyNewWordsLimit?: number;
    dailyDueWordsLimit?: number;
  }) =>
    apiRequest<UserProfile>('/profile', {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  updatePassword: (currentPassword: string, newPassword: string) =>
    apiRequest<{ ok: boolean }>('/profile/password', {
      method: 'PATCH',
      body: JSON.stringify({ currentPassword, newPassword }),
    }),

  uploadAvatar: (avatar: string) =>
    apiRequest<{ avatarUrl: string | null }>('/profile/avatar', {
      method: 'POST',
      body: JSON.stringify({ avatar }),
    }),

  getStats: () => apiRequest<LearningStats>('/profile/stats'),

  getCharts: () => apiRequest<ChartsData>('/profile/charts'),

  getStreak: () =>
    apiRequest<{
      streak: number;
      todayCompleted: boolean;
      repairAvailable: boolean;
      savedStreak: number;
      last7Days: { date: string; active: boolean }[];
    }>('/profile/streak'),

  repairStreak: () =>
    apiRequest<{ ok: boolean; newStreak: number }>('/profile/streak/repair', { method: 'POST' }),

  getHomeData: () => apiRequest<HomeData>('/profile/home'),

  getLevelsProgress: () => apiRequest<{ levels: LevelProgressData[] }>('/profile/levels-progress'),

  logout: () =>
    apiRequest<{ ok: boolean }>('/auth/logout', { method: 'POST' }).catch(() => {
      // Ignore server errors on logout — we clear auth regardless
    }),

  // GDPR Art 15: download all my data as a JSON file. We use a manual fetch
  // (not apiRequest) because apiRequest expects JSON and we want to stream
  // straight to a Blob → File download via <a download>.
  exportData: async (): Promise<void> => {
    const { accessToken } = useAuthStore.getState();
    const res = await fetch('/api/profile/export', {
      headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
      credentials: 'include',
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Export failed' }));
      throw new Error((err as { error?: string }).error ?? 'Export failed');
    }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    // Backend sends Content-Disposition with filename; some browsers honour
    // that, others use the anchor's download attribute. Belt + braces.
    a.download = `frenchup-export-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  },

  // GDPR Art 17: permanently delete the account. Returns void on success;
  // throws on the LAST_ADMIN guard or 4xx. Caller is responsible for
  // clearing local auth state + redirecting.
  deleteAccount: () =>
    apiRequest<{ ok: boolean }>('/profile', {
      method: 'DELETE',
      body: JSON.stringify({ confirmation: 'DELETE' }),
    }),
};
