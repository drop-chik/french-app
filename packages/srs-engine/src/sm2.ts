/**
 * SM-2 (SuperMemo 2) Spaced Repetition Algorithm
 *
 * Grade scale (0-5):
 *  0 - Complete blackout, wrong answer
 *  1 - Wrong answer, correct was easy to recall
 *  2 - Wrong answer, but upon seeing correct it felt familiar
 *  3 - Correct answer with significant difficulty
 *  4 - Correct answer after hesitation
 *  5 - Perfect recall
 */

export type SRSGrade = 0 | 1 | 2 | 3 | 4 | 5;

export interface SRSCard {
  easinessFactor: number; // 1.3 – 2.5+, default 2.5
  interval: number;       // days until next review
  repetitions: number;    // number of successful consecutive reviews
  nextReview: Date;
}

export interface SRSResult extends SRSCard {
  wasCorrect: boolean;
}

const MIN_EASINESS = 1.3;
const DEFAULT_EASINESS = 2.5;

export function createCard(): SRSCard {
  return {
    easinessFactor: DEFAULT_EASINESS,
    interval: 0,
    repetitions: 0,
    nextReview: new Date(),
  };
}

export function calculateNextReview(card: SRSCard, grade: SRSGrade): SRSResult {
  let { easinessFactor, interval, repetitions } = card;
  const wasCorrect = grade >= 3;

  if (wasCorrect) {
    if (repetitions === 0) {
      interval = 1;
    } else if (repetitions === 1) {
      interval = 6;
    } else {
      interval = Math.round(interval * easinessFactor);
    }
    repetitions += 1;
  } else {
    // Wrong answer — reset progress
    repetitions = 0;
    interval = 1;
  }

  // Update easiness factor based on grade
  easinessFactor = Math.max(
    MIN_EASINESS,
    easinessFactor + 0.1 - (5 - grade) * (0.08 + (5 - grade) * 0.02),
  );

  const nextReview = new Date();
  nextReview.setDate(nextReview.getDate() + interval);

  return {
    easinessFactor,
    interval,
    repetitions,
    nextReview,
    wasCorrect,
  };
}

export function isDueForReview(card: SRSCard): boolean {
  return new Date() >= card.nextReview;
}

export function isMastered(card: SRSCard): boolean {
  return card.interval >= 21;
}

export function getStatus(card: SRSCard): 'new' | 'learning' | 'review' | 'mastered' {
  if (card.repetitions === 0 && card.interval === 0) return 'new';
  if (isMastered(card)) return 'mastered';
  if (card.repetitions < 3) return 'learning';
  return 'review';
}
