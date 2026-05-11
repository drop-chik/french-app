import { apiRequest } from '../../lib/apiClient';

export type AchievementRarity = 'bronze' | 'silver' | 'gold' | 'legendary';
export type AchievementCategory =
  | 'words' | 'streak' | 'grammar' | 'listening' | 'reading' | 'conversation' | 'general';

export interface AchievementItem {
  id: string;
  category: AchievementCategory;
  icon: string;
  rarity: AchievementRarity;
  titleRu: string;
  titleEn: string;
  descRu: string;
  descEn: string;
  metric: string;
  threshold: number;
  current: number;
  pct: number;
  unlocked: boolean;
  unlockedAt: string | null;
}

export interface XpSummary {
  xp: number;
  level: number;
  xpAtLevel: number;
  xpForNextLevel: number;
  pctToNext: number;
}

export interface AchievementsResponse {
  items: AchievementItem[];
  xp: XpSummary;
  metrics: Record<string, number>;
}

export const achievementsApi = {
  list: () => apiRequest<AchievementsResponse>('/achievements'),
  xp: () => apiRequest<XpSummary>('/achievements/xp'),
};
