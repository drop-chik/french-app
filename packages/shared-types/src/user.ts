export type LanguageLevel = 'A1' | 'A2' | 'B1' | 'B2';

export interface User {
  id: string;
  email: string;
  name: string;
  level: LanguageLevel;
  placementTestDone: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UserProfile {
  id: string;
  name: string;
  level: LanguageLevel;
  wordsLearned: number;
  grammarTopicsCompleted: number;
  streakDays: number;
}
