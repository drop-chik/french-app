import { apiRequest } from '../../lib/apiClient';
import type { LanguageLevel, UserRole } from '@french-app/shared-types';

export interface AdminUserRow {
  id: string;
  email: string;
  name: string;
  level: LanguageLevel;
  role: UserRole;
  xp: number;
  createdAt: string;
  lastActive: string | null;
  wordsMastered: number;
}

export interface AdminUserDetail {
  profile: {
    id: string;
    email: string;
    name: string;
    level: LanguageLevel;
    role: UserRole;
    avatarUrl: string | null;
    uiLanguage: string;
    placementTestDone: boolean;
    createdAt: string;
  };
  stats: {
    words: { total: number; mastered: number; learning: number; new: number };
    grammar: { completed: number; inProgress: number };
    listening: { completed: number };
    conversations: number;
    correctAnswers: number;
    incorrectAnswers: number;
    weekReviews: number;
    wordsDueToday: number;
  } | null;
  streak: { streak: number; todayCompleted: boolean } | null;
  charts: {
    activity: Array<{ date: string; reviewed: number; correct: number; incorrect: number }>;
  } | null;
  levels: unknown;
  lastActiveAt: string | null;
}

export interface AdminMetrics {
  totals: { total: number; new7d: number; new30d: number };
  active: { dau: number; wau: number; mau: number };
  timeseries: Array<{ date: string; users: number }>;
  featureUsage: {
    vocab: number; grammar: number; listening: number; writing: number;
    conversation: number; reading: number; drills: number;
  };
  retention: Array<{ week: string; size: number; d1: number; d7: number; d30: number }>;
  backlog: { avgOverdue: number; medianOverdue: number; usersWithBacklog: number; maxOverdue: number };
  accuracy: number;
}

export type AdminUserSort = 'created' | 'lastActive' | 'level' | 'name';

export const adminApi = {
  listUsers: (params: { q?: string; sort?: AdminUserSort; offset?: number; limit?: number }) => {
    const qs = new URLSearchParams();
    if (params.q) qs.set('q', params.q);
    if (params.sort) qs.set('sort', params.sort);
    if (params.offset != null) qs.set('offset', String(params.offset));
    if (params.limit != null) qs.set('limit', String(params.limit));
    const s = qs.toString();
    return apiRequest<{ users: AdminUserRow[]; total: number }>(
      `/admin/users${s ? `?${s}` : ''}`,
    );
  },

  getUser: (id: string) =>
    apiRequest<AdminUserDetail>(`/admin/users/${id}`),

  updateUser: (
    id: string,
    patch: { level?: LanguageLevel; role?: UserRole; name?: string; email?: string },
  ) =>
    apiRequest<{ user: AdminUserRow }>(`/admin/users/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(patch),
    }),

  resetProgress: (id: string) =>
    apiRequest<{ deleted: number }>(`/admin/users/${id}/reset-progress`, {
      method: 'POST',
    }),

  metrics: () => apiRequest<AdminMetrics>('/admin/metrics/overview'),
};
