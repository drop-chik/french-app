export const LEVEL_ORDER = ['A1', 'A2', 'B1', 'B2'] as const;

export const LEVEL_COLORS: Record<string, string> = {
  A1: '#22c55e',
  A2: '#3b82f6',
  B1: '#f59e0b',
  B2: '#8b5cf6',
};

export const LEVEL_COLORS_DARK: Record<string, string> = {
  A1: '#16a34a',
  A2: '#2563eb',
  B1: '#d97706',
  B2: '#7c3aed',
};

export const LEVEL_GRADIENTS: Record<string, string> = {
  A1: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
  A2: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
  B1: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
  B2: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
};

// Weekly goal: number of word reviews per week (10/day × 7 days)
export const WEEKLY_GOAL_TARGET = 70;
