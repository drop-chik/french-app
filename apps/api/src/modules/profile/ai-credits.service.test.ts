import { describe, it, expect } from 'vitest';
import {
  _nextMidnightUtc, _isResetDue, _hoursUntilReset, _remaining,
  COST, DAILY_LIMIT,
} from './ai-credits.service.js';

describe('_nextMidnightUtc', () => {
  it('returns the next 00:00 UTC after a mid-day time', () => {
    const now = new Date('2026-06-18T15:30:00.000Z');
    expect(_nextMidnightUtc(now).toISOString()).toBe('2026-06-19T00:00:00.000Z');
  });

  it('rolls to the NEXT day even when called exactly at midnight', () => {
    const now = new Date('2026-06-18T00:00:00.000Z');
    expect(_nextMidnightUtc(now).toISOString()).toBe('2026-06-19T00:00:00.000Z');
  });

  it('handles a month boundary', () => {
    const now = new Date('2026-06-30T23:59:59.000Z');
    expect(_nextMidnightUtc(now).toISOString()).toBe('2026-07-01T00:00:00.000Z');
  });
});

describe('_isResetDue', () => {
  const now = new Date('2026-06-18T12:00:00.000Z');
  it('is due when the reset timestamp is in the past', () => {
    expect(_isResetDue(new Date('2026-06-18T11:59:59.000Z'), now)).toBe(true);
  });
  it('is due exactly at the boundary', () => {
    expect(_isResetDue(new Date('2026-06-18T12:00:00.000Z'), now)).toBe(true);
  });
  it('is NOT due when the reset timestamp is in the future', () => {
    expect(_isResetDue(new Date('2026-06-18T12:00:01.000Z'), now)).toBe(false);
  });
});

describe('_hoursUntilReset', () => {
  const now = new Date('2026-06-18T12:00:00.000Z');
  it('rounds partial hours up', () => {
    expect(_hoursUntilReset(new Date('2026-06-18T13:30:00.000Z'), now)).toBe(2); // 1.5h → 2
  });
  it('is exact on whole hours', () => {
    expect(_hoursUntilReset(new Date('2026-06-18T15:00:00.000Z'), now)).toBe(3);
  });
  it('never goes negative for a past reset', () => {
    expect(_hoursUntilReset(new Date('2026-06-18T06:00:00.000Z'), now)).toBe(0);
  });
});

describe('_remaining', () => {
  it('returns the gap under the limit', () => {
    expect(_remaining(30, 100)).toBe(70);
  });
  it('clamps to 0 at the limit', () => {
    expect(_remaining(100, 100)).toBe(0);
  });
  it('clamps to 0 past the limit (never negative)', () => {
    expect(_remaining(140, 100)).toBe(0);
  });
});

// Guard the quota config itself: every action must be affordable within a day
// (cost ≤ limit) and cost a positive amount — otherwise an action is either
// free or permanently impossible, both bugs.
describe('COST / DAILY_LIMIT invariants', () => {
  it('every action costs a positive integer', () => {
    for (const [action, cost] of Object.entries(COST)) {
      expect(cost, action).toBeGreaterThan(0);
      expect(Number.isInteger(cost), action).toBe(true);
    }
  });
  it('no single action exceeds the daily limit', () => {
    for (const [action, cost] of Object.entries(COST)) {
      expect(cost, action).toBeLessThanOrEqual(DAILY_LIMIT);
    }
  });
});
