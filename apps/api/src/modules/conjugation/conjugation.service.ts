import { conjugateRegular, type TenseSet } from './regular.js';
import { IRREGULAR_VERBS } from './irregular.js';

export interface ConjugationResult {
  infinitive: string;
  isIrregular: boolean;
  tenses: TenseSet;
}

/**
 * Conjugate any French verb. Returns null if the verb isn't a recognised
 * regular pattern AND isn't in the irregular table.
 */
export function conjugate(verb: string): ConjugationResult | null {
  const v = verb.toLowerCase().trim();

  // Irregular verbs take priority — many of them end in -ir or -re and would
  // otherwise be mistakenly conjugated by the regular fallback.
  if (IRREGULAR_VERBS[v]) {
    return {
      infinitive: v,
      isIrregular: true,
      tenses: IRREGULAR_VERBS[v]!,
    };
  }

  const regular = conjugateRegular(v);
  if (regular) {
    return {
      infinitive: v,
      isIrregular: false,
      tenses: regular,
    };
  }

  return null;
}

/** List all infinitives we have either an irregular entry or a regular rule for. */
export function listIrregularVerbs(): string[] {
  return Object.keys(IRREGULAR_VERBS).sort();
}
