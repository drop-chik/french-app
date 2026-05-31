import { apiRequest } from '../../lib/apiClient';

export interface LevelTestQuestion {
  id: string;
  level: string;
  type: string;
  question: string;
  options: string[];
}

export interface LevelTestStartResponse {
  questions: LevelTestQuestion[];
  fromLevel: string;
  passThreshold: number;
}

export interface LevelTestResult {
  passed: boolean;
  score: number;
  correct: number;
  total: number;
  fromLevel: string;
  toLevel: string | null;
  promoted: boolean;
  weakAreas: Array<{ level: string; type: string; missed: number }>;
}

export const progressionApi = {
  startLevelTest: () =>
    apiRequest<LevelTestStartResponse>('/progression/level-test/start'),

  submitLevelTest: (answers: Record<string, string>) =>
    apiRequest<LevelTestResult>('/progression/level-test/submit', {
      method: 'POST',
      body: JSON.stringify({ answers }),
    }),
};
