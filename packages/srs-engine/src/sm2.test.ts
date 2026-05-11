import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  createCard,
  calculateNextReview,
  isDueForReview,
  isMastered,
  getStatus,
  type SRSCard,
  type SRSGrade,
} from './sm2.js';

describe('createCard', () => {
  it('returns initial state with easiness 2.5, interval 0, repetitions 0', () => {
    const card = createCard();
    expect(card.easinessFactor).toBe(2.5);
    expect(card.interval).toBe(0);
    expect(card.repetitions).toBe(0);
    expect(card.nextReview).toBeInstanceOf(Date);
  });

  it('starts immediately due (nextReview <= now)', () => {
    const card = createCard();
    expect(card.nextReview.getTime()).toBeLessThanOrEqual(Date.now() + 5);
  });
});

describe('calculateNextReview — correct answers (grade >= 3)', () => {
  it('first correct review sets interval to 1 day', () => {
    const card = createCard();
    const r = calculateNextReview(card, 5);
    expect(r.wasCorrect).toBe(true);
    expect(r.interval).toBe(1);
    expect(r.repetitions).toBe(1);
  });

  it('second correct review sets interval to 6 days', () => {
    const card: SRSCard = {
      easinessFactor: 2.5,
      interval: 1,
      repetitions: 1,
      nextReview: new Date(),
    };
    const r = calculateNextReview(card, 5);
    expect(r.interval).toBe(6);
    expect(r.repetitions).toBe(2);
  });

  it('third+ correct review multiplies interval by easinessFactor', () => {
    const card: SRSCard = {
      easinessFactor: 2.5,
      interval: 6,
      repetitions: 2,
      nextReview: new Date(),
    };
    const r = calculateNextReview(card, 5);
    expect(r.interval).toBe(Math.round(6 * 2.5)); // 15
    expect(r.repetitions).toBe(3);
  });

  it('intervals grow exponentially over many correct reviews', () => {
    let card = createCard();
    const intervals: number[] = [];
    for (let i = 0; i < 6; i++) {
      const r = calculateNextReview(card, 5);
      intervals.push(r.interval);
      card = { ...r };
    }
    // After 6 correct reviews intervals should be strictly increasing
    for (let i = 1; i < intervals.length; i++) {
      expect(intervals[i]).toBeGreaterThan(intervals[i - 1]!);
    }
    // And the last interval should comfortably exceed 21 days (mastered threshold)
    expect(intervals[intervals.length - 1]).toBeGreaterThan(50);
  });

  it('grade 3 (correct but difficult) reduces easinessFactor', () => {
    const card = createCard();
    const r = calculateNextReview(card, 3);
    expect(r.wasCorrect).toBe(true);
    expect(r.easinessFactor).toBeLessThan(2.5);
  });

  it('grade 5 (perfect) keeps or grows easinessFactor', () => {
    const card = createCard();
    const r = calculateNextReview(card, 5);
    expect(r.easinessFactor).toBeGreaterThanOrEqual(2.5);
  });

  it('grade 4 changes easinessFactor only slightly', () => {
    const card = createCard();
    const r = calculateNextReview(card, 4);
    expect(Math.abs(r.easinessFactor - 2.5)).toBeLessThan(0.1);
  });
});

describe('calculateNextReview — wrong answers (grade < 3)', () => {
  it('grade 0 resets repetitions to 0', () => {
    const card: SRSCard = {
      easinessFactor: 2.5,
      interval: 60,
      repetitions: 5,
      nextReview: new Date(),
    };
    const r = calculateNextReview(card, 0);
    expect(r.wasCorrect).toBe(false);
    expect(r.repetitions).toBe(0);
    expect(r.interval).toBe(1);
  });

  it('grade 2 (almost correct) still resets progress', () => {
    const card: SRSCard = {
      easinessFactor: 2.5,
      interval: 30,
      repetitions: 4,
      nextReview: new Date(),
    };
    const r = calculateNextReview(card, 2);
    expect(r.wasCorrect).toBe(false);
    expect(r.repetitions).toBe(0);
  });

  it('wrong answer significantly lowers easinessFactor', () => {
    const card = createCard();
    const r = calculateNextReview(card, 0);
    expect(r.easinessFactor).toBeLessThan(2.5);
  });
});

describe('calculateNextReview — easinessFactor bounds', () => {
  it('never drops below 1.3 even after repeated wrong answers', () => {
    let card = createCard();
    for (let i = 0; i < 20; i++) {
      const r = calculateNextReview(card, 0);
      card = { ...r };
    }
    expect(card.easinessFactor).toBeGreaterThanOrEqual(1.3);
  });
});

describe('isDueForReview', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-05-11T12:00:00Z'));
  });

  it('returns true when nextReview is in the past', () => {
    const card: SRSCard = {
      easinessFactor: 2.5,
      interval: 1,
      repetitions: 1,
      nextReview: new Date('2026-05-10T00:00:00Z'),
    };
    expect(isDueForReview(card)).toBe(true);
  });

  it('returns true when nextReview equals now', () => {
    const card: SRSCard = {
      easinessFactor: 2.5,
      interval: 1,
      repetitions: 1,
      nextReview: new Date('2026-05-11T12:00:00Z'),
    };
    expect(isDueForReview(card)).toBe(true);
  });

  it('returns false when nextReview is in the future', () => {
    const card: SRSCard = {
      easinessFactor: 2.5,
      interval: 1,
      repetitions: 1,
      nextReview: new Date('2026-05-12T00:00:00Z'),
    };
    expect(isDueForReview(card)).toBe(false);
  });
});

describe('isMastered', () => {
  it('is true at interval 21+', () => {
    expect(isMastered({ easinessFactor: 2.5, interval: 21, repetitions: 4, nextReview: new Date() })).toBe(true);
    expect(isMastered({ easinessFactor: 2.5, interval: 100, repetitions: 8, nextReview: new Date() })).toBe(true);
  });

  it('is false at interval < 21', () => {
    expect(isMastered({ easinessFactor: 2.5, interval: 20, repetitions: 4, nextReview: new Date() })).toBe(false);
    expect(isMastered({ easinessFactor: 2.5, interval: 0,  repetitions: 0, nextReview: new Date() })).toBe(false);
  });
});

describe('getStatus', () => {
  const base = (overrides: Partial<SRSCard>): SRSCard => ({
    easinessFactor: 2.5,
    interval: 0,
    repetitions: 0,
    nextReview: new Date(),
    ...overrides,
  });

  it('"new" when never reviewed (repetitions=0 && interval=0)', () => {
    expect(getStatus(base({}))).toBe('new');
  });

  it('"learning" for early successful reviews (rep < 3)', () => {
    expect(getStatus(base({ interval: 1, repetitions: 1 }))).toBe('learning');
    expect(getStatus(base({ interval: 6, repetitions: 2 }))).toBe('learning');
  });

  it('"review" for rep >= 3 but interval < 21', () => {
    expect(getStatus(base({ interval: 15, repetitions: 3 }))).toBe('review');
    expect(getStatus(base({ interval: 20, repetitions: 4 }))).toBe('review');
  });

  it('"mastered" when interval >= 21', () => {
    expect(getStatus(base({ interval: 21, repetitions: 4 }))).toBe('mastered');
    expect(getStatus(base({ interval: 100, repetitions: 8 }))).toBe('mastered');
  });
});

describe('SM-2 integration — realistic study flow', () => {
  it('typical "I learned this word" trajectory: 5 perfect reviews leads to mastered', () => {
    let card: SRSCard = createCard();
    for (let i = 0; i < 5; i++) {
      const r = calculateNextReview(card, 5);
      card = { ...r };
    }
    expect(getStatus(card)).toBe('mastered');
  });

  it('forgetting in the middle resets repetitions but not easinessFactor floor', () => {
    let card: SRSCard = createCard();
    // 3 successful reviews
    for (let i = 0; i < 3; i++) {
      const r = calculateNextReview(card, 5);
      card = { ...r };
    }
    const efBefore = card.easinessFactor;
    // Now fail
    const r = calculateNextReview(card, 0);
    expect(r.repetitions).toBe(0);
    expect(r.interval).toBe(1);
    expect(r.easinessFactor).toBeLessThan(efBefore);
    expect(r.easinessFactor).toBeGreaterThanOrEqual(1.3);
  });

  it('grade values 0-5 are all accepted', () => {
    const card = createCard();
    for (let grade = 0 as SRSGrade; grade <= 5; grade = ((grade + 1) as SRSGrade)) {
      expect(() => calculateNextReview(card, grade)).not.toThrow();
    }
  });
});
