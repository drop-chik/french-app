import type { LanguageLevel } from './user';

export interface DailySession {
  newWordsStudied: number;
  wordsReviewed: number;
  grammarExercisesCompleted: number;
  listeningMinutes: number;
  date: string;
}

export interface PlacementTestResult {
  level: LanguageLevel;
  score: number;
  completedAt: string;
}

export interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
  corrections?: Array<{
    wrong: string;
    correct: string;
    rule: string;
  }>;
  timestamp: string;
}

export interface ConversationSession {
  id: string;
  topic: string;
  level: LanguageLevel;
  messages: ConversationMessage[];
  startedAt: string;
  endedAt: string | null;
}
