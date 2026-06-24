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

/**
 * Gradient + tint variants of the canonical palette, for level hero cards and
 * stat strips. `from` mirrors LEVEL_COLORS, `to` is a darker shade of the same
 * hue, and `tint` is a ~12% wash for subtle backgrounds. Single source for the
 * grammar/listening level pages (previously two near-identical local copies).
 */
export const LEVEL_GRADIENTS: Record<Level, { from: string; to: string; tint: string }> = {
  A1: { from: '#22c55e', to: '#15803d', tint: 'rgba(34, 197, 94, 0.12)' },
  A2: { from: '#3b82f6', to: '#1d4ed8', tint: 'rgba(59, 130, 246, 0.12)' },
  B1: { from: '#f97316', to: '#c2410c', tint: 'rgba(249, 115, 22, 0.12)' },
  B2: { from: '#a855f7', to: '#7c3aed', tint: 'rgba(168, 85, 247, 0.12)' },
  C1: { from: '#ec4899', to: '#be185d', tint: 'rgba(236, 72, 153, 0.12)' },
  C2: { from: '#ef4444', to: '#b91c1c', tint: 'rgba(239, 68, 68, 0.12)' },
};
