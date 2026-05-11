import { describe, it, expect } from 'vitest';
import { _calcStreakFromDates } from './profile.service.js';

/**
 * Dates must be passed sorted DESC (most recent first) as the production query
 * does: `ORDER BY DATE(last_reviewed) DESC`. The function counts the contiguous
 * run from the first element backwards.
 */
describe('_calcStreakFromDates', () => {
  it('returns 0 for an empty array', () => {
    expect(_calcStreakFromDates([])).toBe(0);
  });

  it('returns 1 for a single date', () => {
    expect(_calcStreakFromDates(['2026-05-11'])).toBe(1);
  });

  it('counts contiguous consecutive days', () => {
    expect(_calcStreakFromDates([
      '2026-05-11',
      '2026-05-10',
      '2026-05-09',
    ])).toBe(3);
  });

  it('stops counting when a day is skipped', () => {
    // 11 → 10 → (skipped 9) → 8 — streak ends at 10
    expect(_calcStreakFromDates([
      '2026-05-11',
      '2026-05-10',
      '2026-05-08',
    ])).toBe(2);
  });

  it('counts a long unbroken streak', () => {
    const dates: string[] = [];
    for (let i = 0; i < 30; i++) {
      const d = new Date(Date.UTC(2026, 4, 11));
      d.setUTCDate(d.getUTCDate() - i);
      dates.push(d.toISOString().slice(0, 10));
    }
    expect(_calcStreakFromDates(dates)).toBe(30);
  });

  it('handles month boundary correctly (May 1 → April 30)', () => {
    expect(_calcStreakFromDates([
      '2026-05-01',
      '2026-04-30',
      '2026-04-29',
    ])).toBe(3);
  });

  it('handles year boundary correctly (Jan 1 → Dec 31)', () => {
    expect(_calcStreakFromDates([
      '2026-01-01',
      '2025-12-31',
      '2025-12-30',
    ])).toBe(3);
  });

  it('counts only the first contiguous block, even with later activity', () => {
    // 11→10 (streak), then big gap, then 1, 2, 3 days much earlier (not connected)
    expect(_calcStreakFromDates([
      '2026-05-11',
      '2026-05-10',
      '2026-04-15',
      '2026-04-14',
      '2026-04-13',
    ])).toBe(2);
  });

  it('treats duplicate consecutive dates correctly (diff 0 breaks streak)', () => {
    // Production query has GROUP BY DATE — dates should be unique. But if a
    // duplicate ever slipped through, the streak shouldn't silently inflate.
    // diff = 0 days → falls through to else → break.
    expect(_calcStreakFromDates([
      '2026-05-11',
      '2026-05-11',
      '2026-05-10',
    ])).toBe(1);
  });
});
