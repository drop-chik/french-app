import { describe, it, expect, beforeEach, vi } from 'vitest';
import { buildStudySession } from './session.js';
import type { SRSCard } from './sm2.js';

const dueCard = (daysAgo: number): SRSCard => {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return { easinessFactor: 2.5, interval: 1, repetitions: 1, nextReview: d };
};

const futureCard = (daysAhead: number): SRSCard => {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  return { easinessFactor: 2.5, interval: 5, repetitions: 2, nextReview: d };
};

describe('buildStudySession', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-05-11T12:00:00Z'));
  });

  it('returns empty when no items', () => {
    expect(buildStudySession([])).toEqual([]);
  });

  it('includes due items', () => {
    const items = [
      { data: { id: 'a' }, card: dueCard(2) },
      { data: { id: 'b' }, card: dueCard(1) },
    ];
    const session = buildStudySession(items);
    expect(session).toHaveLength(2);
    expect(session.every((s) => !s.isNew)).toBe(true);
  });

  it('excludes items whose nextReview is in the future', () => {
    const items = [
      { data: { id: 'a' }, card: dueCard(1) },
      { data: { id: 'b' }, card: futureCard(3) },
    ];
    const session = buildStudySession(items);
    expect(session).toHaveLength(1);
    expect(session[0]!.data.id).toBe('a');
  });

  it('treats null cards as new items and includes them up to maxNewPerDay', () => {
    const items = Array.from({ length: 30 }, (_, i) => ({
      data: { id: `new-${i}` },
      card: null,
    }));
    const session = buildStudySession(items, { maxNewPerDay: 20 });
    expect(session).toHaveLength(20);
    expect(session.every((s) => s.isNew)).toBe(true);
  });

  it('defaults maxNewPerDay to 20', () => {
    const items = Array.from({ length: 50 }, (_, i) => ({
      data: { id: `new-${i}` },
      card: null,
    }));
    const session = buildStudySession(items);
    expect(session).toHaveLength(20);
  });

  it('mixes due reviews and new items', () => {
    const items = [
      ...Array.from({ length: 5 }, (_, i) => ({
        data: { id: `due-${i}` },
        card: dueCard(1),
      })),
      ...Array.from({ length: 10 }, (_, i) => ({
        data: { id: `new-${i}` },
        card: null,
      })),
    ];
    const session = buildStudySession(items, { maxNewPerDay: 5 });
    expect(session).toHaveLength(10); // 5 due + 5 new (capped)
    const newCount = session.filter((s) => s.isNew).length;
    const dueCount = session.filter((s) => !s.isNew).length;
    expect(newCount).toBe(5);
    expect(dueCount).toBe(5);
  });

  it('initialises new items with default SRS card state', () => {
    const session = buildStudySession([{ data: { id: 'x' }, card: null }]);
    expect(session[0]!.card.easinessFactor).toBe(2.5);
    expect(session[0]!.card.interval).toBe(0);
    expect(session[0]!.card.repetitions).toBe(0);
  });

  it('respects maxNewPerDay = 0 (no new items)', () => {
    const items = [
      { data: { id: 'due' }, card: dueCard(1) },
      { data: { id: 'new' }, card: null },
    ];
    const session = buildStudySession(items, { maxNewPerDay: 0 });
    expect(session).toHaveLength(1);
    expect(session[0]!.data.id).toBe('due');
  });
});
