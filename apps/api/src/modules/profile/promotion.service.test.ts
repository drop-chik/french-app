import { describe, it, expect } from 'vitest';
import { _evaluatePromotion, _masteryCountsTowardPromotion } from './promotion.service.js';

// Levels: A1(0) A2(1) B1(2) B2(3) C1(4) C2(5). THRESHOLD=0.8, MIN_TOTAL=50.
describe('_evaluatePromotion', () => {
  it('refuses an unknown / corrupted level index', () => {
    expect(_evaluatePromotion(-1, 999, 999)).toEqual({ promote: false, reason: 'unknown-level' });
  });

  it('refuses to promote past C2 (already at the top)', () => {
    expect(_evaluatePromotion(5, 5000, 5000)).toEqual({ promote: false, reason: 'already-c2' });
  });

  it('requires at least MIN_TOTAL (50) words on the level', () => {
    // 49 words, all mastered → still blocked by the minimum
    expect(_evaluatePromotion(0, 49, 49)).toEqual({ promote: false, reason: 'too-few-words' });
  });

  it('blocks just below the 80% threshold', () => {
    // 39/50 = 0.78
    expect(_evaluatePromotion(0, 39, 50)).toEqual({ promote: false, reason: 'below-threshold' });
  });

  it('promotes exactly at the 80% threshold', () => {
    // 40/50 = 0.80
    expect(_evaluatePromotion(0, 40, 50)).toEqual({ promote: true, reason: 'eligible' });
  });

  it('promotes comfortably above threshold', () => {
    expect(_evaluatePromotion(2, 95, 100).promote).toBe(true);
  });

  it('treats zero total as too-few-words (no divide-by-zero)', () => {
    expect(_evaluatePromotion(0, 0, 0)).toEqual({ promote: false, reason: 'too-few-words' });
  });
});

// This is the heart of the anti-cheat (review finding #2): manual "mark as
// mastered" must NOT count toward CEFR auto-promotion. The SQL filter
// `mastered_via IS DISTINCT FROM 'manual'` mirrors this predicate.
describe('_masteryCountsTowardPromotion (anti-self-promotion)', () => {
  it('does NOT count manually-marked mastery', () => {
    expect(_masteryCountsTowardPromotion('manual')).toBe(false);
  });

  it('counts SRS-earned mastery', () => {
    expect(_masteryCountsTowardPromotion('srs')).toBe(true);
  });

  it('counts legacy NULL mastery (pre-column rows treated as earned)', () => {
    expect(_masteryCountsTowardPromotion(null)).toBe(true);
  });

  it('counts any non-manual source by default', () => {
    expect(_masteryCountsTowardPromotion('import')).toBe(true);
  });
});
