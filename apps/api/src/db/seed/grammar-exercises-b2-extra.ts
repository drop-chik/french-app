import type { ExerciseSeed } from './grammar-exercises-a1.js';

export const grammarExercisesB2Extra: ExerciseSeed[] = [

  // ═══════════════════════════════════════════════════════════
  // registres-langue
  // ═══════════════════════════════════════════════════════════
  {
    topicSlug: 'registres-langue',
    type: 'multiple_choice',
    question: { text: 'Quel mot appartient au registre soutenu?', options: ['un ouvrage', 'un bouquin', 'un livre', 'un boukin'] },
    answer: { correct: 'un ouvrage' },
    explanation: 'Un ouvrage = книжный/высокий регистр. Un livre = нейтральный. Un bouquin = разговорный.',
    explanationEn: 'Un ouvrage = formal register. Un livre = neutral. Un bouquin = informal.',
  },
  {
    topicSlug: 'registres-langue',
    type: 'multiple_choice',
    question: { text: 'Quelle phrase est en registre familier?', options: ['T\'as vu ce film?', 'As-tu vu ce film?', 'Avez-vous vu ce film?', 'Auriez-vous vu ce film?'] },
    answer: { correct: 'T\'as vu ce film?' },
    explanation: 'T\'as = tu as (усечение) + выпадение ne в отрицании — признаки familier.',
    explanationEn: 'T\'as = tu as (contraction) — typical feature of the familier register.',
  },
  {
    topicSlug: 'registres-langue',
    type: 'multiple_choice',
    question: { text: 'En registre courant, «on» remplace souvent ___', options: ['nous', 'ils', 'vous', 'eux'] },
    answer: { correct: 'nous' },
    explanation: 'Dans le registre courant et familier, «on» remplace souvent «nous»: On est allés au cinéma.',
    explanationEn: 'In courant and familier registers, on often replaces nous: On est allés au cinéma.',
  },
  {
    topicSlug: 'registres-langue',
    type: 'multiple_choice',
    question: { text: 'Quel équivalent soutenu de «bosser» est correct?', options: ['travailler / exercer', 'kiffer', 'se casser', 'un mec'] },
    answer: { correct: 'travailler / exercer' },
    explanation: 'Bosser (fam.) = travailler (courant) = exercer (soutenu).',
    explanationEn: 'Bosser (informal) = travailler (neutral) = exercer (formal).',
  },
  {
    topicSlug: 'registres-langue',
    type: 'multiple_choice',
    question: { text: '«Je sais pas» est une marque de quel registre?', options: ['familier', 'courant', 'soutenu', 'littéraire'] },
    answer: { correct: 'familier' },
    explanation: 'La suppression du «ne» est une marque du registre familier: «Je sais pas» au lieu de «Je ne sais pas».',
    explanationEn: 'Dropping ne is a hallmark of the familier register: Je sais pas instead of Je ne sais pas.',
  },
  {
    topicSlug: 'registres-langue',
    type: 'multiple_choice',
    question: { text: 'Reformulez en registre soutenu: «C\'est super comme livre!»', options: ['Cet ouvrage est remarquable.', 'Ce bouquin est top!', 'Ce livre est très bien.', 'C\'est un bon livre.'] },
    answer: { correct: 'Cet ouvrage est remarquable.' },
    explanation: 'Soutenu: ouvrage (≠ livre/bouquin), remarquable (≠ super/bien).',
    explanationEn: 'Formal register uses: ouvrage (not livre/bouquin), remarquable (not super/bien).',
  },

  // ═══════════════════════════════════════════════════════════
  // propositions-participiales
  // ═══════════════════════════════════════════════════════════
  {
    topicSlug: 'propositions-participiales',
    type: 'fill_blank',
    question: { text: '___ (avoir fini) ses devoirs, Marie est allée se promener.', blanks: 1 },
    answer: { values: ['Ayant fini'] },
    explanation: 'Ayant + participe passé = participe composé для предшествующего действия.',
    explanationEn: 'Ayant + past participle = compound participle for a prior action.',
  },
  {
    topicSlug: 'propositions-participiales',
    type: 'multiple_choice',
    question: { text: 'La réunion ___, tout le monde est parti.', options: ['terminée', 'terminant', 'a terminé', 'terminé'] },
    answer: { correct: 'terminée' },
    explanation: 'Конструкция абсолютного причастия: La réunion terminée (réunion f. → terminée с согласованием).',
    explanationEn: 'Absolute participial construction: La réunion terminée — the participle agrees with its own subject (réunion, f.).',
  },
  {
    topicSlug: 'propositions-participiales',
    type: 'fill_blank',
    question: { text: '___ (être) malade, il n\'a pas pu venir à la réunion.', blanks: 1 },
    answer: { values: ['Étant'] },
    explanation: 'Étant + adjectif/participe = cause. Étant malade = parce qu\'il était malade.',
    explanationEn: 'Étant + adjective = cause. Étant malade = because he was ill.',
  },
  {
    topicSlug: 'propositions-participiales',
    type: 'multiple_choice',
    question: { text: '___ par le voyage, il s\'est endormi immédiatement.', options: ['Épuisé', 'Épuisant', 'Ayant épuisé', 'Étant épuisant'] },
    answer: { correct: 'Épuisé' },
    explanation: 'Participe passé seul comme adjectif-cause: Épuisé = parce qu\'il était épuisé.',
    explanationEn: 'Past participle as causal adjective: Épuisé = because he was exhausted.',
  },
  {
    topicSlug: 'propositions-participiales',
    type: 'multiple_choice',
    question: { text: 'Le soleil ___, les touristes ont quitté la plage.', options: ['se couchant', 'se couché', 'se coucher', 's\'étant couchant'] },
    answer: { correct: 'se couchant' },
    explanation: 'Абсолютная конструкция с participe présent: Le soleil se couchant = quand le soleil se couchait.',
    explanationEn: 'Absolute construction with participe présent: Le soleil se couchant = as the sun was setting.',
  },
  {
    topicSlug: 'propositions-participiales',
    type: 'fill_blank',
    question: { text: '___ (ne pas savoir) quoi répondre, elle a gardé le silence.', blanks: 1 },
    answer: { values: ['Ne sachant pas'] },
    explanation: 'Negation du participe présent: ne + participe + pas. Ne sachant pas = не зная.',
    explanationEn: 'Negation of participe présent: ne + participle + pas. Ne sachant pas = not knowing.',
  },
];
