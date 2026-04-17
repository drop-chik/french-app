import type { LanguageLevel } from './user.js';

export type ExerciseType = 'fill_blank' | 'multiple_choice' | 'reorder' | 'translate';

export interface GrammarTopicContent {
  theory: Array<
    | { type: 'paragraph'; text: string }
    | { type: 'table'; headers: string[]; rows: string[][] }
    | { type: 'example'; fr: string; ru: string; note?: string }
  >;
  keyPoints: string[];
  commonMistakes: string[];
}

export interface GrammarTopic {
  id: string;
  slug: string;
  titleRu: string;
  titleFr: string;
  level: LanguageLevel;
  category: string;
  orderNum: number;
  content: GrammarTopicContent;
}

export interface GrammarExercise {
  id: string;
  topicId: string;
  type: ExerciseType;
  question: Record<string, unknown>;
  answer: Record<string, unknown>;
  explanation: string | null;
}

export type GrammarTopicStatus = 'locked' | 'available' | 'in_progress' | 'completed';

export interface GrammarProgress {
  topicId: string;
  status: GrammarTopicStatus;
  score: number;
  attempts: number;
  completedAt: string | null;
}
