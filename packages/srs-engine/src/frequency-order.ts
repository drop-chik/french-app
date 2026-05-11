/**
 * Frequency-weighted ordering for study sessions.
 *
 * Words with a lower `frequencyRank` (1 = most common) are pushed toward the
 * front of the session, but with enough jitter that two sessions in a row
 * don't feel identical. The intuition: the user sees a high-frequency word
 * early *most of the time*, but order isn't deterministic.
 *
 * Words with `frequencyRank === null` (i.e. A1 base vocab, or words we never
 * tagged) are treated as "last by default" — they're still sprinkled in via
 * the jitter, but won't crowd out a tagged frequent word.
 */

const NULL_RANK = 100_000;

export interface RankedItem {
  frequencyRank: number | null;
}

/**
 * Returns a new array, sorted by frequency with small random jitter.
 *
 * @param jitter — how much variance two adjacent ranks can have. With the
 *   default 80, two words within 80 rank points of each other can swap; words
 *   further apart almost never will. Tune up for more chaos, down for more
 *   determinism.
 */
export function orderByFrequency<T extends RankedItem>(
  items: readonly T[],
  jitter = 80,
): T[] {
  return items
    .map((w) => ({
      w,
      key: (w.frequencyRank ?? NULL_RANK) + Math.random() * jitter,
    }))
    .sort((a, b) => a.key - b.key)
    .map(({ w }) => w);
}
