/**
 * Conjugates regular French verbs: -er (1st group), -ir (2nd group), -re (3rd group regular).
 *
 * Each tense returns 6 forms in the canonical pronoun order:
 *   [je, tu, il/elle/on, nous, vous, ils/elles]
 *
 * Impératif returns only [tu, nous, vous].
 *
 * Spelling rules are intentionally limited to the basic regular patterns —
 * stem-changing -er verbs (acheter, appeler, espérer, manger, commencer, …)
 * and irregular verbs are handled separately in irregular.ts.
 */

export type Pronouns = readonly [string, string, string, string, string, string];

export interface TenseSet {
  present: Pronouns;
  passeCompose: Pronouns;
  imparfait: Pronouns;
  futurSimple: Pronouns;
  conditionnel: Pronouns;
  subjonctif: Pronouns;
  imperatif: readonly [string, string, string]; // tu, nous, vous
}

export type VerbGroup = 'er' | 'ir' | 're';

/** Detects the regular group of a verb by its infinitive ending. */
export function detectRegularGroup(infinitive: string): VerbGroup | null {
  if (infinitive.endsWith('er')) return 'er';
  if (infinitive.endsWith('ir')) return 'ir';
  if (infinitive.endsWith('re')) return 're';
  return null;
}

/** Auxiliary used in compound tenses (passé composé etc.). All regular verbs
 *  use "avoir" except a small list of motion verbs — those are irregulars and
 *  handled separately. */
const AUX_AVOIR: Pronouns = ['ai', 'as', 'a', 'avons', 'avez', 'ont'];

function withAvoir(participle: string): Pronouns {
  return AUX_AVOIR.map((aux) => `${aux} ${participle}`) as unknown as Pronouns;
}

// ── 1st group: -er (parler, aimer, regarder, …) ─────────────────────────────

function conjugateER(infinitive: string): TenseSet {
  const stem = infinitive.slice(0, -2); // parler → parl
  const futureStem = infinitive;        // future/conditionnel keep the -er

  return {
    present: [
      `${stem}e`, `${stem}es`, `${stem}e`,
      `${stem}ons`, `${stem}ez`, `${stem}ent`,
    ],
    passeCompose: withAvoir(`${stem}é`),
    imparfait: [
      `${stem}ais`, `${stem}ais`, `${stem}ait`,
      `${stem}ions`, `${stem}iez`, `${stem}aient`,
    ],
    futurSimple: [
      `${futureStem}ai`, `${futureStem}as`, `${futureStem}a`,
      `${futureStem}ons`, `${futureStem}ez`, `${futureStem}ont`,
    ],
    conditionnel: [
      `${futureStem}ais`, `${futureStem}ais`, `${futureStem}ait`,
      `${futureStem}ions`, `${futureStem}iez`, `${futureStem}aient`,
    ],
    subjonctif: [
      `${stem}e`, `${stem}es`, `${stem}e`,
      `${stem}ions`, `${stem}iez`, `${stem}ent`,
    ],
    imperatif: [`${stem}e`, `${stem}ons`, `${stem}ez`],
  };
}

// ── 2nd group: regular -ir (finir, choisir, réussir, …) ─────────────────────
// Distinguished by the -iss- infix in plural present, imparfait, etc.

function conjugateIR(infinitive: string): TenseSet {
  const stem = infinitive.slice(0, -2); // finir → fin
  const futureStem = infinitive;

  return {
    present: [
      `${stem}is`, `${stem}is`, `${stem}it`,
      `${stem}issons`, `${stem}issez`, `${stem}issent`,
    ],
    passeCompose: withAvoir(`${stem}i`),
    imparfait: [
      `${stem}issais`, `${stem}issais`, `${stem}issait`,
      `${stem}issions`, `${stem}issiez`, `${stem}issaient`,
    ],
    futurSimple: [
      `${futureStem}ai`, `${futureStem}as`, `${futureStem}a`,
      `${futureStem}ons`, `${futureStem}ez`, `${futureStem}ont`,
    ],
    conditionnel: [
      `${futureStem}ais`, `${futureStem}ais`, `${futureStem}ait`,
      `${futureStem}ions`, `${futureStem}iez`, `${futureStem}aient`,
    ],
    subjonctif: [
      `${stem}isse`, `${stem}isses`, `${stem}isse`,
      `${stem}issions`, `${stem}issiez`, `${stem}issent`,
    ],
    imperatif: [`${stem}is`, `${stem}issons`, `${stem}issez`],
  };
}

// ── 3rd group regular -re (vendre, attendre, descendre, perdre, …) ──────────

function conjugateRE(infinitive: string): TenseSet {
  const stem = infinitive.slice(0, -2); // vendre → vend
  const futureStem = infinitive.slice(0, -1); // vendr (drop final e)

  return {
    present: [
      `${stem}s`, `${stem}s`, stem,
      `${stem}ons`, `${stem}ez`, `${stem}ent`,
    ],
    passeCompose: withAvoir(`${stem}u`),
    imparfait: [
      `${stem}ais`, `${stem}ais`, `${stem}ait`,
      `${stem}ions`, `${stem}iez`, `${stem}aient`,
    ],
    futurSimple: [
      `${futureStem}ai`, `${futureStem}as`, `${futureStem}a`,
      `${futureStem}ons`, `${futureStem}ez`, `${futureStem}ont`,
    ],
    conditionnel: [
      `${futureStem}ais`, `${futureStem}ais`, `${futureStem}ait`,
      `${futureStem}ions`, `${futureStem}iez`, `${futureStem}aient`,
    ],
    subjonctif: [
      `${stem}e`, `${stem}es`, `${stem}e`,
      `${stem}ions`, `${stem}iez`, `${stem}ent`,
    ],
    imperatif: [`${stem}s`, `${stem}ons`, `${stem}ez`],
  };
}

export function conjugateRegular(infinitive: string): TenseSet | null {
  const group = detectRegularGroup(infinitive);
  if (!group) return null;
  if (group === 'er') return conjugateER(infinitive);
  if (group === 'ir') return conjugateIR(infinitive);
  return conjugateRE(infinitive);
}
