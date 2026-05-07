import type { ExerciseSeed } from './grammar-exercises-a1.js';

export const grammarExercisesB1Extra: ExerciseSeed[] = [

  // ═══════════════════════════════════════════════════════════
  // hypothese-si
  // ═══════════════════════════════════════════════════════════
  {
    topicSlug: 'hypothese-si',
    type: 'fill_blank',
    question: { text: 'Si tu travailles bien, tu ___ (réussir) ton examen.', blanks: 1 },
    answer: { values: ['réussiras'] },
    explanation: 'Тип 1 (реальное условие): si + présent → futur simple. Réussiras.',
    explanationEn: 'Type 1 (real condition): si + présent → futur simple. Réussiras.',
  },
  {
    topicSlug: 'hypothese-si',
    type: 'fill_blank',
    question: { text: 'Si j\'___ (avoir) de l\'argent, j\'achèterais une maison.', blanks: 1 },
    answer: { values: ['avais'] },
    explanation: 'Тип 2 (гипотетическое): si + imparfait → conditionnel présent. Avais.',
    explanationEn: 'Type 2 (hypothetical): si + imparfait → conditionnel présent. Avais.',
  },
  {
    topicSlug: 'hypothese-si',
    type: 'multiple_choice',
    question: { text: 'Si tu ___ à Paris, tu pourrais visiter le Louvre.', options: ['allais', 'vas', 'irais', 'seras allé'] },
    answer: { correct: 'allais' },
    explanation: 'Тип 2: si + imparfait. Pourrais = conditionnel présent → allais.',
    explanationEn: 'Type 2: si + imparfait. Main clause has conditionnel présent (pourrais) → allais.',
  },
  {
    topicSlug: 'hypothese-si',
    type: 'fill_blank',
    question: { text: 'S\'il ___ beau demain, on fera un pique-nique. (faire)', blanks: 1 },
    answer: { values: ['fait'] },
    explanation: 'Тип 1: si + présent → futur (on fera). S\'il fait beau.',
    explanationEn: 'Type 1: si + présent → futur. S\'il fait beau.',
  },
  {
    topicSlug: 'hypothese-si',
    type: 'multiple_choice',
    question: { text: 'Laquelle est correcte?', options: ['Si tu venais, je serais content.', 'Si tu viendrais, je serais content.', 'Si tu venais, je suis content.', 'Si tu viens, je serais content.'] },
    answer: { correct: 'Si tu venais, je serais content.' },
    explanation: 'Тип 2: si + imparfait → conditionnel présent. Никогда conditionnel после si.',
    explanationEn: 'Type 2: si + imparfait → conditionnel présent. Never conditionnel after si.',
  },
  {
    topicSlug: 'hypothese-si',
    type: 'fill_blank',
    question: { text: 'Si vous ___ (avoir) des questions, posez-les maintenant.', blanks: 1 },
    answer: { values: ['avez'] },
    explanation: 'Тип 1: si + présent. Impératif в главном → si + présent.',
    explanationEn: 'Type 1: si + présent. Imperative in the main clause → si + présent.',
  },
  {
    topicSlug: 'hypothese-si',
    type: 'multiple_choice',
    question: { text: 'Si j\'étais à ta place, je lui ___ la vérité.', options: ['dirais', 'dirai', 'dis', 'disais'] },
    answer: { correct: 'dirais' },
    explanation: 'Тип 2: si + imparfait (étais) → conditionnel présent: dirais.',
    explanationEn: 'Type 2: si + imparfait (étais) → conditionnel présent: dirais.',
  },
  {
    topicSlug: 'hypothese-si',
    type: 'fill_blank',
    question: { text: 'Si vous partez tôt, vous ___ (éviter) les embouteillages.', blanks: 1 },
    answer: { values: ['éviterez'] },
    explanation: 'Тип 1: si + présent → futur simple: éviterez.',
    explanationEn: 'Type 1: si + présent → futur simple: éviterez.',
  },

  // ═══════════════════════════════════════════════════════════
  // participe-present
  // ═══════════════════════════════════════════════════════════
  {
    topicSlug: 'participe-present',
    type: 'fill_blank',
    question: { text: 'Forme le participe présent: parler → ___', blanks: 1 },
    answer: { values: ['parlant'] },
    explanation: 'Основа nous parlons → parl- + -ant → parlant.',
    explanationEn: 'nous-stem parl- + -ant → parlant.',
  },
  {
    topicSlug: 'participe-present',
    type: 'fill_blank',
    question: { text: 'J\'ai rencontré une femme ___ (parler) quatre langues.', blanks: 1 },
    answer: { values: ['parlant'] },
    explanation: 'Participe présent заменяет qui parle: une femme parlant = une femme qui parle.',
    explanationEn: 'Participe présent replaces a relative clause: une femme parlant = une femme qui parle.',
  },
  {
    topicSlug: 'participe-present',
    type: 'multiple_choice',
    question: { text: 'Ne ___ pas la réponse, il a préféré se taire.', options: ['sachant', 'savoir', 'su', 'sache'] },
    answer: { correct: 'sachant' },
    explanation: 'Participe présent de savoir: sachant (неправильный). Ne sachant pas = не зная.',
    explanationEn: 'Present participle of savoir: sachant (irregular). Ne sachant pas = not knowing.',
  },
  {
    topicSlug: 'participe-present',
    type: 'multiple_choice',
    question: { text: 'Il écoute de la musique ___ travaillant.', options: ['en', 'de', 'par', 'avec'] },
    answer: { correct: 'en' },
    explanation: 'Gérondif = en + participe présent. En travaillant = одновременное действие.',
    explanationEn: 'Gérondif = en + présent participle. En travaillant = simultaneous action.',
  },
  {
    topicSlug: 'participe-present',
    type: 'fill_blank',
    question: { text: 'Forme le participe présent: avoir → ___', blanks: 1 },
    answer: { values: ['ayant'] },
    explanation: 'Avoir → ayant (неправильный). Les étudiants ayant fini... (которые закончили)',
    explanationEn: 'avoir → ayant (irregular). Les étudiants ayant fini... (students who have finished...)',
  },
  {
    topicSlug: 'participe-present',
    type: 'multiple_choice',
    question: { text: 'Les touristes ___ une carte cherchaient le musée.', options: ['tenant', 'tenants', 'tenu', 'tiennent'] },
    answer: { correct: 'tenant' },
    explanation: 'Participe présent не изменяется: tenant (не tenants). Tenir → ils tiennent → tien- → tenant.',
    explanationEn: 'Participe présent is invariable: tenant (not tenants). Tenir → ils tiennent → tien- + ant → tenant.',
  },
];
