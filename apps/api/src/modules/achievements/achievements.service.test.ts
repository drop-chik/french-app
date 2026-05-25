import { describe, it, expect } from 'vitest';
import { xpForLevel, levelFromXp, describeProgress, XP_REWARDS } from './xp.js';
import { evaluateAchievements } from './achievements.service.js';
import type { UserMetrics } from './achievements.service.js';
import { ACHIEVEMENTS } from './registry.js';

const zero: UserMetrics = {
  wordsMastered: 0,
  wordsLearning: 0,
  streakDays: 0,
  grammarCompleted: 0,
  listeningCompleted: 0,
  conversationsCount: 0,
  readingTextsCompleted: 0,
  correctAnswersTotal: 0,
  totalXp: 0,
};

describe('xpForLevel / levelFromXp', () => {
  it('level 1 starts at 0 XP', () => {
    expect(xpForLevel(1)).toBe(0);
    expect(levelFromXp(0)).toBe(1);
  });

  it('level boundaries are inverse operations', () => {
    for (let lvl = 1; lvl < 30; lvl++) {
      const threshold = xpForLevel(lvl);
      expect(levelFromXp(threshold), `xp=${threshold} → level ${lvl}`).toBe(lvl);
    }
  });

  it('xp just below a threshold stays at the previous level', () => {
    for (let lvl = 2; lvl < 20; lvl++) {
      const threshold = xpForLevel(lvl);
      expect(levelFromXp(threshold - 1)).toBe(lvl - 1);
    }
  });

  it('thresholds grow quadratically', () => {
    expect(xpForLevel(2)).toBe(50);
    expect(xpForLevel(3)).toBe(200);
    expect(xpForLevel(5)).toBe(800);
    expect(xpForLevel(10)).toBe(4050);
  });

  it('clamps negative XP to level 1', () => {
    expect(levelFromXp(-100)).toBe(1);
  });
});

describe('describeProgress', () => {
  it('at exactly a threshold reports 0% to next', () => {
    const p = describeProgress(xpForLevel(5));
    expect(p.level).toBe(5);
    expect(p.xpAtLevel).toBe(0);
    expect(p.pctToNext).toBe(0);
  });

  it('halfway between two thresholds reports ~50%', () => {
    const lower = xpForLevel(3);
    const upper = xpForLevel(4);
    const halfway = lower + Math.floor((upper - lower) / 2);
    const p = describeProgress(halfway);
    expect(p.level).toBe(3);
    expect(p.pctToNext).toBeGreaterThanOrEqual(48);
    expect(p.pctToNext).toBeLessThanOrEqual(52);
  });

  it('always returns a level >= 1', () => {
    expect(describeProgress(0).level).toBe(1);
  });
});

describe('XP_REWARDS sanity', () => {
  it('all values are positive', () => {
    for (const [k, v] of Object.entries(XP_REWARDS)) {
      expect(v, `${k}`).toBeGreaterThan(0);
    }
  });

  it('mastered > correct > incorrect (motivation hierarchy)', () => {
    expect(XP_REWARDS.WORD_MASTERED).toBeGreaterThan(XP_REWARDS.WORD_CORRECT);
    expect(XP_REWARDS.WORD_CORRECT).toBeGreaterThan(XP_REWARDS.WORD_INCORRECT);
  });
});

describe('evaluateAchievements', () => {
  it('returns nothing for a fresh user', () => {
    expect(evaluateAchievements(zero)).toEqual([]);
  });

  it('unlocks first_word as soon as wordsLearning >= 1', () => {
    expect(evaluateAchievements({ ...zero, wordsLearning: 1 })).toContain('first_word');
  });

  it('does not unlock words_10 with only 5 learned', () => {
    const got = evaluateAchievements({ ...zero, wordsLearned: 5 });
    expect(got).not.toContain('words_10');
  });

  it('unlocks words_10, words_50 at the right thresholds', () => {
    expect(evaluateAchievements({ ...zero, wordsLearned: 10 })).toContain('words_10');
    expect(evaluateAchievements({ ...zero, wordsLearned: 49 })).not.toContain('words_50');
    expect(evaluateAchievements({ ...zero, wordsLearned: 50 })).toContain('words_50');
  });

  it('higher tiers do not unlock without meeting the threshold', () => {
    const got = evaluateAchievements({ ...zero, wordsLearned: 100 });
    expect(got).toContain('words_100');
    expect(got).not.toContain('words_500');
  });

  it('streak achievements gate independently', () => {
    expect(evaluateAchievements({ ...zero, streakDays: 3 })).toContain('streak_3');
    expect(evaluateAchievements({ ...zero, streakDays: 7 })).toContain('streak_7');
    expect(evaluateAchievements({ ...zero, streakDays: 30 })).toContain('streak_30');
  });

  it('a maxed-out user unlocks the entire catalog', () => {
    const maxed: UserMetrics = {
      wordsMastered: 9999,
      wordsLearned: 9999,
      wordsLearning: 9999,
      streakDays: 9999,
      grammarCompleted: 9999,
      listeningCompleted: 9999,
      conversationsCount: 9999,
      readingTextsCompleted: 9999,
      correctAnswersTotal: 99999,
      totalXp: 999999,
    };
    expect(evaluateAchievements(maxed)).toHaveLength(ACHIEVEMENTS.length);
  });
});

describe('Achievement registry integrity', () => {
  it('every achievement has a unique id', () => {
    const ids = ACHIEVEMENTS.map((a) => a.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('all thresholds are positive', () => {
    for (const a of ACHIEVEMENTS) {
      expect(a.threshold, `${a.id}`).toBeGreaterThan(0);
    }
  });

  it('catalog has at least 15 achievements (Phase A goal)', () => {
    expect(ACHIEVEMENTS.length).toBeGreaterThanOrEqual(15);
  });

  it('every required text field is non-empty', () => {
    for (const a of ACHIEVEMENTS) {
      expect(a.titleRu, `${a.id} titleRu`).toBeTruthy();
      expect(a.titleEn, `${a.id} titleEn`).toBeTruthy();
      expect(a.descRu, `${a.id} descRu`).toBeTruthy();
      expect(a.descEn, `${a.id} descEn`).toBeTruthy();
      expect(a.icon, `${a.id} icon`).toBeTruthy();
    }
  });
});
