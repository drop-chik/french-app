import type { LanguageLevel } from './user.js';

export interface Word {
  id: string;
  french: string;
  translation: string;
  level: LanguageLevel;
  category: string;
  exampleFr: string | null;
  exampleRu: string | null;
  audioUrl: string | null;
  imageUrl: string | null;
  createdAt: string;
}

export type WordStatus = 'new' | 'learning' | 'review' | 'mastered';

export interface WordProgress {
  wordId: string;
  status: WordStatus;
  easinessFactor: number;
  interval: number;
  repetitions: number;
  nextReview: string;
  lastReviewed: string | null;
  correctCount: number;
  incorrectCount: number;
}

export interface WordWithProgress extends Word {
  progress: WordProgress | null;
}

export type SRSGrade = 0 | 1 | 2 | 3 | 4 | 5;
