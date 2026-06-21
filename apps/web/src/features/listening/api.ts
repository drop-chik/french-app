import { apiRequest, apiRequestBlob } from '../../lib/apiClient';

export interface ListeningQuestion {
  id: string;
  text: string;
  options: string[];
}

export interface ListeningExercise {
  id: string;
  title: string;
  level: string;
  audioUrl: string;
  transcript: string;
  durationSec: number;
  /** Real per-sentence start times (seconds, monotonic) from Whisper.
   *  Null on legacy exercises that haven't been backfilled — the frontend
   *  falls back to word-weighted estimates in that case. */
  sentenceTimestamps: number[] | null;
  questions: ListeningQuestion[];
  progress: { completed: boolean; score: number } | null;
}

export interface ListeningExerciseListItem {
  id: string;
  title: string;
  level: string;
  audioUrl: string;
  transcript: string;
  durationSec: number;
  questions: ListeningQuestion[];
  progress: { completed: boolean; score: number } | null;
}

export interface SubmitResult {
  score: number;
  correct: number;
  total: number;
  results: Record<string, { isCorrect: boolean; correctAnswer: string }>;
}

// ── Mock exam (DELF CO) ─────────────────────────────────────────────────────
export type CefrLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';

export interface MockMaskedQuestion { id: string; question: string; options: string[] }
export interface MockExercise {
  id: string; title: string; level: CefrLevel; durationSec: number; questions: MockMaskedQuestion[];
}
export interface MockStoredAnswer { exerciseId: string; questionId: string; answer: string }
export interface MockActiveAttempt {
  id: string; level: CefrLevel; startedAt: string; timeLimitSeconds: number;
  remainingSeconds: number; exercises: MockExercise[]; answers: MockStoredAnswer[];
}
export interface MockResult {
  id: string; level: CefrLevel; score: number; maxScore: number; finalizedAt: string;
  breakdown: Array<{
    exerciseId: string; title: string; correct: number; total: number;
    questions: Array<{ id: string; question: string; options: string[]; userAnswer: string | null; correctAnswer: string; isCorrect: boolean }>;
  }>;
}
export interface MockHistoryItem {
  id: string; level: CefrLevel; score: number; maxScore: number; finalizedAt: string; durationSeconds: number;
}

export const listeningMockApi = {
  start: (level: CefrLevel) =>
    apiRequest<{ attempt: MockActiveAttempt }>(`/listening/mock/start`, { method: 'POST', body: JSON.stringify({ level }) }),
  active: () =>
    apiRequest<{ active: MockActiveAttempt | { autoFinalized: MockResult } | null }>(`/listening/mock/active`),
  answer: (attemptId: string, payload: MockStoredAnswer) =>
    apiRequest<{ ok: true }>(`/listening/mock/${attemptId}/answer`, { method: 'POST', body: JSON.stringify(payload) }),
  finalize: (attemptId: string) =>
    apiRequest<{ result: MockResult }>(`/listening/mock/${attemptId}/finalize`, { method: 'POST' }),
  cancel: (attemptId: string) =>
    apiRequest<{ ok: true }>(`/listening/mock/${attemptId}`, { method: 'DELETE' }),
  history: () =>
    apiRequest<{ history: MockHistoryItem[] }>(`/listening/mock/history`),
};

export const listeningApi = {
  getExercises: (level = 'A1') =>
    apiRequest<{ exercises: ListeningExerciseListItem[] }>(`/listening/exercises?level=${level}`),

  getExercise: (id: string) =>
    apiRequest<{ exercise: ListeningExercise }>(`/listening/exercises/${id}`),

  submitAnswers: (id: string, answers: Record<string, string>) =>
    apiRequest<SubmitResult>(`/listening/exercises/${id}/submit`, {
      method: 'POST',
      body: JSON.stringify({ answers }),
    }),

  // Used by vocabulary modes (FlashcardMode, SpellingMode, ListeningRecallMode)
  // to play a single word on demand. Exercises use pre-cached R2 URLs instead.
  generateTTS: (text: string) =>
    apiRequestBlob('/listening/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    }),
};
