import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { orderByFrequency } from './frequency-order.js';

describe('orderByFrequency', () => {
  beforeEach(() => {
    // Pin Math.random so every test run is reproducible.
    vi.spyOn(Math, 'random').mockReturnValue(0.5);
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns empty array unchanged', () => {
    expect(orderByFrequency([])).toEqual([]);
  });

  it('sorts by frequencyRank ascending with constant jitter', () => {
    const items = [
      { id: 'c', frequencyRank: 100 },
      { id: 'a', frequencyRank: 5 },
      { id: 'b', frequencyRank: 50 },
    ];
    expect(orderByFrequency(items).map((i) => i.id)).toEqual(['a', 'b', 'c']);
  });

  it('pushes null-ranked words to the end', () => {
    const items = [
      { id: 'unknown', frequencyRank: null },
      { id: 'common', frequencyRank: 1 },
      { id: 'rare', frequencyRank: 9_000 },
    ];
    expect(orderByFrequency(items).map((i) => i.id)).toEqual(['common', 'rare', 'unknown']);
  });

  it('does not mutate the input array', () => {
    const items = [
      { id: 'b', frequencyRank: 200 },
      { id: 'a', frequencyRank: 10 },
    ];
    const before = items.map((i) => i.id);
    orderByFrequency(items);
    expect(items.map((i) => i.id)).toEqual(before);
  });

  it('can swap two words within the jitter window', () => {
    // Two adjacent ranks (10 and 50, diff 40 < jitter 80). With random=0.99
    // for the first and 0.01 for the second, the second wins despite higher rank.
    vi.spyOn(Math, 'random')
      .mockReturnValueOnce(0.99) // applied to id=a (rank 10) → key ≈ 89
      .mockReturnValueOnce(0.01); // applied to id=b (rank 50) → key ≈ 51
    const result = orderByFrequency([
      { id: 'a', frequencyRank: 10 },
      { id: 'b', frequencyRank: 50 },
    ]);
    expect(result.map((i) => i.id)).toEqual(['b', 'a']);
  });

  it('almost never swaps words far apart in rank', () => {
    // Even with max jitter (0.99 → +79) word with rank=1 stays before word
    // with rank=1000. Verify with a few iterations.
    vi.restoreAllMocks();
    const items = [
      { id: 'rare', frequencyRank: 1_000 },
      { id: 'common', frequencyRank: 1 },
    ];
    for (let i = 0; i < 20; i++) {
      const first = orderByFrequency(items)[0];
      expect(first?.id).toBe('common');
    }
  });
});
