import { apiRequest } from '../../lib/apiClient';
import type {
  LearningStats,
  ChartsData,
  LevelProgressData,
} from '../profile/api';

export interface UserCard {
  id: string;
  tag: string;
  name: string;
  avatarUrl: string | null;
  level: string;
  xpLevel: number;
  isFollowing: boolean;
}

export interface ActivityEvent {
  id: string;
  type: 'joined' | 'achievement' | 'level_up' | 'streak' | 'cefr_promoted' | 'placement_done' | string;
  payload: Record<string, unknown>;
  createdAt: string;
}

export interface FeedItem extends ActivityEvent {
  actor: { id: string; tag: string; name: string; avatarUrl: string | null };
  reactionCount: number;
  myReacted: boolean;
}

export interface StreakData {
  streak: number;
  todayCompleted: boolean;
  last7Days: { date: string; active: boolean }[];
}

export interface PublicProfile {
  profile: {
    id: string;
    tag: string;
    name: string;
    level: string;
    avatarUrl: string | null;
    xpLevel: number;
    createdAt: string;
  };
  stats: LearningStats | null;
  streak: StreakData | null;
  charts: ChartsData | null;
  levels: LevelProgressData[] | null;
  social: { followers: number; following: number; isFollowing: boolean };
  recentActivity: ActivityEvent[];
  isSelf: boolean;
}

export interface LeaderboardRow {
  id: string;
  tag: string;
  name: string;
  avatarUrl: string | null;
  xpLevel: number;
  weekScore: number;
  isMe: boolean;
}

export const socialApi = {
  search: (q: string) =>
    apiRequest<{ results: UserCard[] }>(`/social/search?q=${encodeURIComponent(q)}`),

  getProfile: (tag: string) =>
    apiRequest<PublicProfile>(`/social/users/${encodeURIComponent(tag)}`),

  follow: (userId: string) =>
    apiRequest<{ ok: boolean; isNew: boolean }>(`/social/follow/${userId}`, { method: 'POST' }),

  unfollow: (userId: string) =>
    apiRequest<{ ok: boolean }>(`/social/follow/${userId}`, { method: 'DELETE' }),

  following: () => apiRequest<{ users: UserCard[] }>('/social/following'),

  followers: () => apiRequest<{ users: UserCard[] }>('/social/followers'),

  leaderboard: () => apiRequest<{ board: LeaderboardRow[] }>('/social/leaderboard'),

  feed: (cursor?: string) =>
    apiRequest<{ items: FeedItem[]; nextCursor: string | null }>(
      `/social/feed${cursor ? `?cursor=${encodeURIComponent(cursor)}` : ''}`,
    ),

  react: (eventId: string) =>
    apiRequest<{ ok: boolean }>(`/social/feed/${eventId}/react`, { method: 'POST' }),

  unreact: (eventId: string) =>
    apiRequest<{ ok: boolean }>(`/social/feed/${eventId}/react`, { method: 'DELETE' }),
};
