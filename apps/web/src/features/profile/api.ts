import { apiRequest } from '../../lib/apiClient';
import { useAuthStore } from '../auth/authStore';

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  level: string;
  avatarUrl: string | null;
  uiLanguage: string;
  placementTestDone: boolean;
  createdAt: string;
}

export interface LearningStats {
  words: { total: number; mastered: number; learning: number; new: number };
  grammar: { completed: number; inProgress: number };
  listening: { completed: number };
  conversations: number;
  correctAnswers: number;
  incorrectAnswers: number;
  weekReviews: number;
  weekTrend: number | null;
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
  totalWords: number;
  percent: number;
}

export const profileApi = {
  getProfile: () => apiRequest<UserProfile>('/profile'),

  updateProfile: (data: { name?: string; email?: string; uiLanguage?: string }) =>
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
    apiRequest<{ streak: number; todayCompleted: boolean; repairAvailable: boolean; savedStreak: number }>(
      '/profile/streak',
    ),

  repairStreak: () =>
    apiRequest<{ ok: boolean; newStreak: number }>('/profile/streak/repair', { method: 'POST' }),

  getHomeData: () => apiRequest<HomeData>('/profile/home'),

  getLevelsProgress: () => apiRequest<{ levels: LevelProgressData[] }>('/profile/levels-progress'),

  logout: () =>
    apiRequest<{ ok: boolean }>('/auth/logout', { method: 'POST' }).catch(() => {
      // Ignore server errors on logout — we clear auth regardless
    }),
};
