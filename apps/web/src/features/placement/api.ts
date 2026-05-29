import { apiRequest } from '../../lib/apiClient';

export interface PlacementQuestion {
  id: string;
  level: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
  type: 'vocabulary' | 'grammar' | 'comprehension';
  question: string;
  options: string[];
  correct: string;
}

export const placementApi = {
  getQuestions: () =>
    apiRequest<{ questions: PlacementQuestion[] }>('/placement/questions'),

  submit: (answers: Record<string, string>, selfReportedLevel?: string) =>
    apiRequest<{ resultLevel: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2' }>('/placement/submit', {
      method: 'POST',
      body: JSON.stringify({ answers, selfReportedLevel }),
    }),
};
