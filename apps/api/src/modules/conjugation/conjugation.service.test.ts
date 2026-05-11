import { describe, it, expect } from 'vitest';
import { conjugate, listIrregularVerbs } from './conjugation.service.js';
import { conjugateRegular, detectRegularGroup } from './regular.js';

describe('detectRegularGroup', () => {
  it('detects -er verbs', () => {
    expect(detectRegularGroup('parler')).toBe('er');
    expect(detectRegularGroup('manger')).toBe('er');
  });
  it('detects -ir verbs', () => {
    expect(detectRegularGroup('finir')).toBe('ir');
  });
  it('detects -re verbs', () => {
    expect(detectRegularGroup('vendre')).toBe('re');
  });
  it('returns null for non-verbs', () => {
    expect(detectRegularGroup('chat')).toBeNull();
    expect(detectRegularGroup('maison')).toBeNull();
  });
});

describe('conjugateRegular — -er verbs', () => {
  it('parler — présent', () => {
    const t = conjugateRegular('parler')!;
    expect(t.present).toEqual(['parle', 'parles', 'parle', 'parlons', 'parlez', 'parlent']);
  });
  it('parler — imparfait', () => {
    const t = conjugateRegular('parler')!;
    expect(t.imparfait).toEqual(['parlais', 'parlais', 'parlait', 'parlions', 'parliez', 'parlaient']);
  });
  it('parler — futur simple', () => {
    const t = conjugateRegular('parler')!;
    expect(t.futurSimple).toEqual(['parlerai', 'parleras', 'parlera', 'parlerons', 'parlerez', 'parleront']);
  });
  it('parler — passé composé uses avoir + parlé', () => {
    const t = conjugateRegular('parler')!;
    expect(t.passeCompose).toEqual([
      'ai parlé', 'as parlé', 'a parlé',
      'avons parlé', 'avez parlé', 'ont parlé',
    ]);
  });
  it('parler — conditionnel', () => {
    const t = conjugateRegular('parler')!;
    expect(t.conditionnel[0]).toBe('parlerais');
    expect(t.conditionnel[5]).toBe('parleraient');
  });
  it('parler — subjonctif', () => {
    const t = conjugateRegular('parler')!;
    expect(t.subjonctif).toEqual(['parle', 'parles', 'parle', 'parlions', 'parliez', 'parlent']);
  });
  it('parler — impératif (3 forms)', () => {
    const t = conjugateRegular('parler')!;
    expect(t.imperatif).toEqual(['parle', 'parlons', 'parlez']);
  });

  it('aimer — présent (another -er verb)', () => {
    const t = conjugateRegular('aimer')!;
    expect(t.present).toEqual(['aime', 'aimes', 'aime', 'aimons', 'aimez', 'aiment']);
  });
});

describe('conjugateRegular — -ir verbs (2nd group)', () => {
  it('finir — présent (with -iss- in plural)', () => {
    const t = conjugateRegular('finir')!;
    expect(t.present).toEqual(['finis', 'finis', 'finit', 'finissons', 'finissez', 'finissent']);
  });
  it('finir — imparfait keeps -iss-', () => {
    const t = conjugateRegular('finir')!;
    expect(t.imparfait[0]).toBe('finissais');
    expect(t.imparfait[3]).toBe('finissions');
  });
  it('finir — passé composé', () => {
    const t = conjugateRegular('finir')!;
    expect(t.passeCompose[0]).toBe('ai fini');
  });
  it('finir — futur simple uses the full infinitive', () => {
    const t = conjugateRegular('finir')!;
    expect(t.futurSimple[0]).toBe('finirai');
  });
  it('choisir — présent', () => {
    const t = conjugateRegular('choisir')!;
    expect(t.present).toEqual(['choisis', 'choisis', 'choisit', 'choisissons', 'choisissez', 'choisissent']);
  });
});

describe('conjugateRegular — -re verbs', () => {
  it('vendre — présent (3rd person no ending)', () => {
    const t = conjugateRegular('vendre')!;
    expect(t.present).toEqual(['vends', 'vends', 'vend', 'vendons', 'vendez', 'vendent']);
  });
  it('vendre — futur drops the final e', () => {
    const t = conjugateRegular('vendre')!;
    expect(t.futurSimple[0]).toBe('vendrai');
    expect(t.futurSimple[5]).toBe('vendront');
  });
  it('vendre — passé composé uses -u participle', () => {
    const t = conjugateRegular('vendre')!;
    expect(t.passeCompose[0]).toBe('ai vendu');
  });
  it('attendre — présent', () => {
    const t = conjugateRegular('attendre')!;
    expect(t.present).toEqual(['attends', 'attends', 'attend', 'attendons', 'attendez', 'attendent']);
  });
});

describe('conjugate — main entry point', () => {
  it('returns null for unknown patterns', () => {
    expect(conjugate('xxx')).toBeNull();
    expect(conjugate('chat')).toBeNull();
  });

  it('flags regular -er verb as not irregular', () => {
    const r = conjugate('parler')!;
    expect(r.isIrregular).toBe(false);
    expect(r.tenses.present[0]).toBe('parle');
  });

  it('returns irregular tense set for être', () => {
    const r = conjugate('être')!;
    expect(r.isIrregular).toBe(true);
    expect(r.tenses.present).toEqual(['suis', 'es', 'est', 'sommes', 'êtes', 'sont']);
    expect(r.tenses.futurSimple[0]).toBe('serai');
  });

  it('returns irregular tense set for avoir', () => {
    const r = conjugate('avoir')!;
    expect(r.isIrregular).toBe(true);
    expect(r.tenses.present).toEqual(['ai', 'as', 'a', 'avons', 'avez', 'ont']);
  });

  it('returns irregular for aller (note: ends in -er but irregular)', () => {
    const r = conjugate('aller')!;
    expect(r.isIrregular).toBe(true);
    expect(r.tenses.present).toEqual(['vais', 'vas', 'va', 'allons', 'allez', 'vont']);
    expect(r.tenses.futurSimple[0]).toBe('irai');
  });

  it('returns irregular for faire', () => {
    const r = conjugate('faire')!;
    expect(r.tenses.present[5]).toBe('font');
    expect(r.tenses.futurSimple[0]).toBe('ferai');
  });

  it('case-insensitive input', () => {
    const a = conjugate('PARLER')!;
    const b = conjugate('Parler')!;
    const c = conjugate('parler')!;
    expect(a.tenses.present).toEqual(b.tenses.present);
    expect(b.tenses.present).toEqual(c.tenses.present);
  });

  it('trims whitespace', () => {
    const r = conjugate('  finir  ')!;
    expect(r.tenses.present[0]).toBe('finis');
  });

  it('aller is irregular even though it ends with -er', () => {
    const aller = conjugate('aller')!;
    expect(aller.isIrregular).toBe(true);
    // make sure the regular -er rule didn't accidentally take over
    expect(aller.tenses.present[0]).toBe('vais');
    expect(aller.tenses.present[0]).not.toBe('alle');
  });

  it('venir is irregular even though it ends with -ir', () => {
    const venir = conjugate('venir')!;
    expect(venir.isIrregular).toBe(true);
    expect(venir.tenses.present[0]).toBe('viens');
    expect(venir.tenses.present[0]).not.toBe('venis');
  });
});

describe('IRREGULAR_VERBS table integrity', () => {
  it('every tense has exactly 6 forms (3 for impératif)', () => {
    for (const name of listIrregularVerbs()) {
      const r = conjugate(name)!;
      expect(r.tenses.present.length, `${name} present`).toBe(6);
      expect(r.tenses.passeCompose.length, `${name} passé composé`).toBe(6);
      expect(r.tenses.imparfait.length, `${name} imparfait`).toBe(6);
      expect(r.tenses.futurSimple.length, `${name} futur`).toBe(6);
      expect(r.tenses.conditionnel.length, `${name} conditionnel`).toBe(6);
      expect(r.tenses.subjonctif.length, `${name} subjonctif`).toBe(6);
      expect(r.tenses.imperatif.length, `${name} impératif`).toBe(3);
    }
  });

  it('has at least the 10 most common irregulars', () => {
    const must = ['être', 'avoir', 'aller', 'faire', 'dire', 'pouvoir', 'vouloir', 'devoir', 'savoir', 'venir'];
    const have = listIrregularVerbs();
    for (const v of must) {
      expect(have, `missing irregular: ${v}`).toContain(v);
    }
  });

  // ── Structural validation: every conjugation table must respect the
  //    canonical endings for each tense, otherwise we know there's a typo.

  it('imparfait endings are always -ais / -ais / -ait / -ions / -iez / -aient', () => {
    for (const name of listIrregularVerbs()) {
      const t = conjugate(name)!.tenses.imparfait;
      expect(t[0].endsWith('ais'),    `${name} imparfait je`).toBe(true);
      expect(t[1].endsWith('ais'),    `${name} imparfait tu`).toBe(true);
      expect(t[2].endsWith('ait'),    `${name} imparfait il`).toBe(true);
      expect(t[3].endsWith('ions'),   `${name} imparfait nous`).toBe(true);
      expect(t[4].endsWith('iez'),    `${name} imparfait vous`).toBe(true);
      expect(t[5].endsWith('aient'),  `${name} imparfait ils`).toBe(true);
    }
  });

  it('futur simple endings are always -ai / -as / -a / -ons / -ez / -ont', () => {
    for (const name of listIrregularVerbs()) {
      const t = conjugate(name)!.tenses.futurSimple;
      expect(t[0].endsWith('ai'),  `${name} futur je`).toBe(true);
      expect(t[1].endsWith('as'),  `${name} futur tu`).toBe(true);
      expect(t[2].endsWith('a'),   `${name} futur il`).toBe(true);
      expect(t[3].endsWith('ons'), `${name} futur nous`).toBe(true);
      expect(t[4].endsWith('ez'),  `${name} futur vous`).toBe(true);
      expect(t[5].endsWith('ont'), `${name} futur ils`).toBe(true);
    }
  });

  it('conditionnel endings are always -ais / -ais / -ait / -ions / -iez / -aient', () => {
    for (const name of listIrregularVerbs()) {
      const t = conjugate(name)!.tenses.conditionnel;
      expect(t[0].endsWith('ais'),    `${name} cond je`).toBe(true);
      expect(t[1].endsWith('ais'),    `${name} cond tu`).toBe(true);
      expect(t[2].endsWith('ait'),    `${name} cond il`).toBe(true);
      expect(t[3].endsWith('ions'),   `${name} cond nous`).toBe(true);
      expect(t[4].endsWith('iez'),    `${name} cond vous`).toBe(true);
      expect(t[5].endsWith('aient'),  `${name} cond ils`).toBe(true);
    }
  });

  it('conditionnel and futur share the same stem in every person', () => {
    // Each pair (futur_person, cond_person) must share the same stem.
    // Drop the canonical ending from each form and compare.
    const futurEndings = ['ai', 'as', 'a', 'ons', 'ez', 'ont'];
    const condEndings  = ['ais', 'ais', 'ait', 'ions', 'iez', 'aient'];
    for (const name of listIrregularVerbs()) {
      const fut = conjugate(name)!.tenses.futurSimple;
      const cond = conjugate(name)!.tenses.conditionnel;
      for (let i = 0; i < 6; i++) {
        const stemFut  = fut[i]!.slice(0, -futurEndings[i]!.length);
        const stemCond = cond[i]!.slice(0, -condEndings[i]!.length);
        expect(stemCond, `${name} cond[${i}] (${cond[i]}) stem must match futur[${i}] (${fut[i]})`).toBe(stemFut);
      }
    }
  });

  it('subjonctif present endings are always -e / -es / -e / -ions / -iez / -ent (with avoir/être exceptions)', () => {
    const exceptions = new Set(['avoir', 'être']); // aie, sois etc.
    for (const name of listIrregularVerbs()) {
      if (exceptions.has(name)) continue;
      const t = conjugate(name)!.tenses.subjonctif;
      expect(t[0].endsWith('e'),    `${name} subj je`).toBe(true);
      expect(t[1].endsWith('es'),   `${name} subj tu`).toBe(true);
      expect(t[2].endsWith('e'),    `${name} subj il`).toBe(true);
      expect(t[3].endsWith('ions'), `${name} subj nous`).toBe(true);
      expect(t[4].endsWith('iez'),  `${name} subj vous`).toBe(true);
      expect(t[5].endsWith('ent'),  `${name} subj ils`).toBe(true);
    }
  });
});
