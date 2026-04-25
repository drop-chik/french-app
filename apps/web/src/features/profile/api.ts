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

  getStreak: () => apiRequest<{ streak: number }>('/profile/streak'),

  logout: () =>
    apiRequest<{ ok: boolean }>('/auth/logout', { method: 'POST' }).catch(() => {
      // Ignore server errors on logout — we clear auth regardless
    }),
};
