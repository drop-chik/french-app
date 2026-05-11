/**
 * XP / level mapping. Pure functions, deterministic, easy to test.
 *
 * Curve: level N is reached at xpRequiredForLevel(N) total XP.
 * xpForLevel(level) = (level - 1)^2 * BASE
 *   Level 1: 0
 *   Level 2: 50
 *   Level 3: 200
 *   Level 4: 450
 *   Level 5: 800
 *   Level 10: 4 050
 *   Level 20: 18 050
 *   Level 30: 42 050
 *
 * This is a gentle quadratic — fast early levels for motivation, longer
 * grinds at higher levels. Comparable to Duolingo's curve (they're a bit slower).
 */

const BASE = 50;

export function xpForLevel(level: number): number {
  if (level <= 1) return 0;
  return Math.floor((level - 1) ** 2 * BASE);
}

export function levelFromXp(xp: number): number {
  if (xp < 0) return 1;
  // Inverse of (L-1)^2 * BASE = xp  →  L = 1 + sqrt(xp / BASE)
  return Math.floor(1 + Math.sqrt(xp / BASE));
}

/**
 * Progress info for the current XP value: which level the user is on, how
 * much they have within that level, and how much they need to reach the next.
 */
export interface XpProgress {
  xp: number;
  level: number;
  xpAtLevel: number;     // XP earned past the current level threshold
  xpForNextLevel: number; // XP gap between current level and next
  pctToNext: number;     // 0..100
}

export function describeProgress(xp: number): XpProgress {
  const level = levelFromXp(xp);
  const lower = xpForLevel(level);
  const upper = xpForLevel(level + 1);
  const xpAtLevel = xp - lower;
  const xpForNextLevel = upper - lower;
  const pctToNext = xpForNextLevel > 0
    ? Math.min(100, Math.round((xpAtLevel / xpForNextLevel) * 100))
    : 0;
  return { xp, level, xpAtLevel, xpForNextLevel, pctToNext };
}

/**
 * XP awards per action — single source of truth so we can tune it without
 * hunting through routes.
 */
export const XP_REWARDS = {
  // Vocabulary
  WORD_CORRECT: 5,        // grade >= 3
  WORD_INCORRECT: 1,      // grade < 3 (still attempt counts)
  WORD_MASTERED: 10,      // bonus when a word transitions to 'mastered'
  // Grammar
  GRAMMAR_EXERCISE: 3,
  GRAMMAR_TOPIC_DONE: 50,
  // Listening
  LISTENING_DONE: 25,
  // Reading
  READING_DONE: 20,
  // Conversation
  CONVERSATION_MESSAGE: 2,
  // Drills
  DRILL_DONE: 15,
  // Writing
  WRITING_SUBMITTED: 30,
  // Streak milestones (one-time bonuses, see registry)
  STREAK_3: 30,
  STREAK_7: 100,
  STREAK_30: 500,
} as const;
