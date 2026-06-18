// LEVEL_ORDER + LEVEL_COLORS now come from the canonical shared source
// (mirrors the CSS --color-level-* tokens). Re-exported so existing
// importers of this module keep working.
export { LEVEL_ORDER, LEVEL_COLORS } from '../../shared/levels';

// Darker shades + gradients are profile-specific visual treatments, aligned
// to the canonical orange/purple hues (B1 orange, B2 purple) so they match
// the rest of the app instead of the old amber/violet.
export const LEVEL_COLORS_DARK: Record<string, string> = {
  A1: '#16a34a',
  A2: '#2563eb',
  B1: '#c2410c',
  B2: '#7c3aed',
  C1: '#db2777',
  C2: '#dc2626',
};

export const LEVEL_GRADIENTS: Record<string, string> = {
  A1: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
  A2: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
  B1: 'linear-gradient(135deg, #f97316 0%, #c2410c 100%)',
  B2: 'linear-gradient(135deg, #a855f7 0%, #7c3aed 100%)',
  C1: 'linear-gradient(135deg, #ec4899 0%, #db2777 100%)',
  C2: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
};

// Weekly goal: number of word reviews per week (10/day × 7 days)
export const WEEKLY_GOAL_TARGET = 70;
