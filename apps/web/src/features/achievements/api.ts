import { apiRequest } from '../../lib/apiClient';
import type { paths } from '../../api/openapi.types';

// ── Types pulled straight from the OpenAPI spec ─────────────────────────────
// Backend changes the response shape? TypeScript catches it at compile time
// instead of letting the bug ship to production.
export type XpSummary =
  paths['/achievements/xp']['get']['responses']['200']['content']['application/json'];

// Categories and rarity are still local enums — they're frontend-only display
// concerns. The achievement item shape comes from prod stats and stays a
// hand-written contract for now (the OpenAPI schema for /achievements doesn't
// pin every field yet).
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

export interface AchievementsResponse {
  items: AchievementItem[];
  xp: XpSummary;
  metrics: Record<string, number>;
}

export const achievementsApi = {
  list: () => apiRequest<AchievementsResponse>('/achievements'),
  xp: () => apiRequest<XpSummary>('/achievements/xp'),
  recent: (limit = 5) => apiRequest<{ items: AchievementItem[] }>(`/achievements/recent?limit=${limit}`),
};
