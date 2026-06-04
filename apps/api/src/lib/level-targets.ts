/**
 * Per-CEFR-level vocabulary mastery targets.
 *
 * The DB holds far more words per level than the target — A1 has 1859
 * words, B1 has 4699, etc. Showing the raw total as the denominator on
 * the dashboard ("120 / 1859") demoralises learners: even a focused
 * month of work moves the bar a few percent. Real CEFR-fluency
 * thresholds (the SavoirX-style "you actually know A1 when you own
 * ~1000 words") let us frame the percentage around the learnable goal
 * while keeping the extra words available as enrichment.
 *
 * Numbers chosen to match the SavoirX positioning where possible. For
 * C1/C2 the targets are below SavoirX's 6000/7500 because our current
 * pool only has 2137/2684 words at those levels — re-leveling
 * B1 → C1/C2 is tracked as a separate content task.
 *
 * Used by:
 *  - profile.service.ts to compute wordPct against the target, not the total
 *  - the level pages on the frontend to show the public mastery goal
 */
export const LEVEL_TARGETS = {
  A1: 1000,
  A2: 1500,
  B1: 2500,
  B2: 4500,
  C1: 1800,
  C2: 2400,
} as const;

export type LevelKey = keyof typeof LEVEL_TARGETS;

export function targetForLevel(level: string): number {
  return LEVEL_TARGETS[level as LevelKey] ?? 1000;
}
