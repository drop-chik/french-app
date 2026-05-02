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
}

export interface SubmitResult {
  score: number;
  correct: number;
  total: number;
  results: Record<string, { isCorrect: boolean; correctAnswer: string }>;
}

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
