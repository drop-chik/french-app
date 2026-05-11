import { describe, it, expect } from 'vitest';
import { tryVerbStem, tryNounStem } from './reading.service.js';

describe('tryVerbStem — French verb lemmatization', () => {
  // The function returns CANDIDATES, not a guaranteed lemma. Tests check that
  // the correct infinitive is present in the candidate list.

  it('handles -er present tense conjugations', () => {
    expect(tryVerbStem('parlons')).toContain('parler');
    expect(tryVerbStem('parlez')).toContain('parler');
    expect(tryVerbStem('parlent')).toContain('parler');
    expect(tryVerbStem('parles')).toContain('parler');
    expect(tryVerbStem('parle')).toContain('parler');
  });

  it('handles -ir present tense conjugations', () => {
    expect(tryVerbStem('finissons')).toContain('finir');
    expect(tryVerbStem('finissez')).toContain('finir');
    expect(tryVerbStem('finissent')).toContain('finir');
    expect(tryVerbStem('finit')).toContain('finir');
    expect(tryVerbStem('finis')).toContain('finir');
  });

  it('handles passé composé endings', () => {
    expect(tryVerbStem('aimé')).toContain('aimer');
    expect(tryVerbStem('aimée')).toContain('aimer');
    expect(tryVerbStem('aimés')).toContain('aimer');
    expect(tryVerbStem('aimées')).toContain('aimer');
  });

  it('handles present participle -ant (both -er and -ir guesses)', () => {
    const candidates = tryVerbStem('marchant');
    expect(candidates).toContain('marcher');
    // also offers the -ir alternative
    expect(candidates).toContain('marchir');
  });

  it('handles -issant present participle as -ir verb', () => {
    expect(tryVerbStem('finissant')).toContain('finir');
  });

  it('handles imparfait endings', () => {
    expect(tryVerbStem('aimait')).toContain('aimer');
    expect(tryVerbStem('aimais')).toContain('aimer');
    expect(tryVerbStem('aimaient')).toContain('aimer');
    expect(tryVerbStem('aimions')).toContain('aimer');
  });

  it('filters out candidates shorter than 4 chars (too short to be infinitives)', () => {
    // 'ai' has -i, becomes 'r' (1 char) — should be filtered
    const candidates = tryVerbStem('ai');
    expect(candidates.every((c) => c.length >= 4)).toBe(true);
  });

  it('does not return the input word itself', () => {
    const candidates = tryVerbStem('aimer');
    expect(candidates).not.toContain('aimer');
  });

  it('returns deduplicated candidates', () => {
    const candidates = tryVerbStem('marchons');
    const set = new Set(candidates);
    expect(candidates.length).toBe(set.size);
  });
});

describe('tryNounStem — noun/adjective lemmatization', () => {
  it('strips plural -s → singular', () => {
    expect(tryNounStem('mots')).toContain('mot');
    expect(tryNounStem('chats')).toContain('chat');
  });

  it('strips plural -es → singular ending in -e', () => {
    expect(tryNounStem('langues')).toContain('langue');
    expect(tryNounStem('problèmes')).toContain('problème');
  });

  it('handles -eaux → -eau plural', () => {
    expect(tryNounStem('tableaux')).toContain('tableau');
    expect(tryNounStem('chapeaux')).toContain('chapeau');
  });

  it('handles -aux → -al plural (NOT -eaux)', () => {
    expect(tryNounStem('journaux')).toContain('journal');
    expect(tryNounStem('nationaux')).toContain('national');
  });

  it('handles feminine -elle → masculine -el', () => {
    expect(tryNounStem('culturelle')).toContain('culturel');
    expect(tryNounStem('traditionnelle')).toContain('traditionnel');
  });

  it('handles feminine plural -elles → masculine singular -el', () => {
    expect(tryNounStem('culturelles')).toContain('culturel');
  });

  it('handles feminine -ive → masculine -if', () => {
    expect(tryNounStem('créative')).toContain('créatif');
    expect(tryNounStem('actives')).toContain('actif');
  });

  it('handles feminine -ière → masculine -ier', () => {
    expect(tryNounStem('première')).toContain('premier');
    expect(tryNounStem('dernières')).toContain('dernier');
  });

  it('handles feminine -euse → masculine -eur', () => {
    expect(tryNounStem('heureuse')).toContain('heureux');
    expect(tryNounStem('chanteuses')).toContain('chanteur');
  });

  it('handles -rice → -eur (actrice → acteur)', () => {
    expect(tryNounStem('actrice')).toContain('acteur');
    expect(tryNounStem('directrices')).toContain('directeur');
  });

  it('handles -ale → -al feminine', () => {
    expect(tryNounStem('nationale')).toContain('national');
    expect(tryNounStem('générales')).toContain('général');
  });

  it('does not return the input word itself', () => {
    const candidates = tryNounStem('mot');
    expect(candidates).not.toContain('mot');
  });

  it('filters out too-short candidates', () => {
    const candidates = tryNounStem('xx');
    expect(candidates.every((c) => c.length >= 3)).toBe(true);
  });

  it('returns deduplicated candidates', () => {
    const candidates = tryNounStem('langues');
    const set = new Set(candidates);
    expect(candidates.length).toBe(set.size);
  });
});
