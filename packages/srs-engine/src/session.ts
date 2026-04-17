/**
 * Study session logic:
 * - Up to 20 new words per day
 * - All cards that are due for review
 */

import { isDueForReview } from './sm2';
import type { SRSCard } from './sm2';

export interface StudyItem<T> {
  data: T;
  card: SRSCard;
  isNew: boolean;
}

export function buildStudySession<T extends { id: string }>(
  items: Array<{ data: T; card: SRSCard | null }>,
  options: { maxNewPerDay?: number } = {},
): StudyItem<T>[] {
  const maxNew = options.maxNewPerDay ?? 20;

  const newItems: StudyItem<T>[] = [];
  const dueItems: StudyItem<T>[] = [];

  for (const item of items) {
    if (item.card === null) {
      newItems.push({ data: item.data, card: { easinessFactor: 2.5, interval: 0, repetitions: 0, nextReview: new Date() }, isNew: true });
    } else if (isDueForReview(item.card)) {
      dueItems.push({ data: item.data, card: item.card, isNew: false });
    }
  }

  // Mix: due reviews first, then new words (capped)
  const sessionNew = newItems.slice(0, maxNew);
  return shuffle([...dueItems, ...sessionNew]);
}

function shuffle<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    [arr[i], arr[j]] = [arr[j]!, arr[i]!];
  }
  return arr;
}
