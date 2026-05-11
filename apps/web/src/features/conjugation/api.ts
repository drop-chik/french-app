import { apiRequest } from '../../lib/apiClient';

type Pronouns = [string, string, string, string, string, string];

export interface ConjugationResult {
  infinitive: string;
  isIrregular: boolean;
  tenses: {
    present: Pronouns;
    passeCompose: Pronouns;
    imparfait: Pronouns;
    futurSimple: Pronouns;
    conditionnel: Pronouns;
    subjonctif: Pronouns;
    imperatif: [string, string, string];
  };
}

export const conjugationApi = {
  conjugate: (verb: string) =>
    apiRequest<ConjugationResult>(`/conjugation/${encodeURIComponent(verb.trim())}`),
  listIrregular: () => apiRequest<{ verbs: string[] }>(`/conjugation/irregular`),
};
