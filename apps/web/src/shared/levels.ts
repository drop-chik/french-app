/**
 * Canonical CEFR level palette — the single JS source of truth, mirroring
 * the CSS design tokens `--color-level-a1..c2` (identical in light + dark
 * themes). Use this everywhere a level colour is needed in JS/inline styles
 * instead of re-declaring a local map.
 *
 * Two competing palettes had drifted apart: the canonical orange/purple set
 * (CSS tokens, dashboard, reading, level pages, tier grid) vs a stale
 * amber/violet set (profile, conjugation). This is the canonical one; the
 * stale consumers now import from here.
 */
export const LEVEL_ORDER = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as const;
export type Level = (typeof LEVEL_ORDER)[number];

export const LEVEL_COLORS: Record<string, string> = {
  A1: '#22c55e', // green
  A2: '#3b82f6', // blue
  B1: '#f97316', // orange
  B2: '#a855f7', // purple
  C1: '#ec4899', // pink
  C2: '#ef4444', // red
};
