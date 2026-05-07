import type { ExerciseSeed } from './grammar-exercises-a1.js';

export const grammarExercisesA1Extra2: ExerciseSeed[] = [

  // ═══════════════════════════════════════════════════════════
  // expressions-quantite
  // ═══════════════════════════════════════════════════════════
  {
    topicSlug: 'expressions-quantite',
    type: 'fill_blank',
    question: { text: 'Il y a ___ touristes à Paris en été. (много)', blanks: 1 },
    answer: { values: ['beaucoup de'] },
    explanation: 'Beaucoup de + nom: много туристов. Артикль des заменяется на de после beaucoup.',
    explanationEn: 'Beaucoup de + noun. The article des is replaced by de after quantity expressions.',
  },
  {
    topicSlug: 'expressions-quantite',
    type: 'multiple_choice',
    question: { text: 'J\'ai ___ temps libre cette semaine.', options: ['peu de', 'peu des', 'peu du', 'peu d\'un'] },
    answer: { correct: 'peu de' },
    explanation: 'Peu de + nom: мало. После выражений количества → de (без артикля).',
    explanationEn: 'Peu de + noun: little/few. Quantity expressions are followed by de (no article).',
  },
  {
    topicSlug: 'expressions-quantite',
    type: 'fill_blank',
    question: { text: 'Tu bois ___ café, ce n\'est pas bon pour la santé. (слишком много)', blanks: 1 },
    answer: { values: ['trop de'] },
    explanation: 'Trop de + nom: слишком много. Без артикля после trop de.',
    explanationEn: 'Trop de + noun: too much/too many. No article after trop de.',
  },
  {
    topicSlug: 'expressions-quantite',
    type: 'multiple_choice',
    question: { text: 'Ajoute ___ sucre dans le thé, s\'il te plaît. (немного)', options: ['un peu de', 'peu de', 'un peu du', 'beaucoup de'] },
    answer: { correct: 'un peu de' },
    explanation: 'Un peu de = немного (некоторое количество). Peu de = мало (недостаточно).',
    explanationEn: 'Un peu de = a little (some). Peu de = few/little (not enough).',
  },
  {
    topicSlug: 'expressions-quantite',
    type: 'fill_blank',
    question: { text: 'Tu as ___ patience pour apprendre une langue étrangère? (достаточно)', blanks: 1 },
    answer: { values: ['assez de'] },
    explanation: 'Assez de + nom = достаточно. Без артикля.',
    explanationEn: 'Assez de + noun = enough. No article.',
  },
  {
    topicSlug: 'expressions-quantite',
    type: 'multiple_choice',
    question: { text: 'Il mange ___. Il a toujours faim. (без существительного)', options: ['beaucoup', 'beaucoup de', 'trop de', 'peu de'] },
    answer: { correct: 'beaucoup' },
    explanation: 'Beaucoup без de при использовании с глаголом (без существительного).',
    explanationEn: 'Beaucoup without de when used with a verb (no following noun).',
  },
  {
    topicSlug: 'expressions-quantite',
    type: 'fill_blank',
    question: { text: 'La plupart ___ étudiants ont réussi l\'examen.', blanks: 1 },
    answer: { values: ['des'] },
    explanation: 'La plupart de garde l\'article: la plupart des étudiants (большинство студентов).',
    explanationEn: 'La plupart de keeps the article: la plupart des étudiants (most students).',
  },

  // ═══════════════════════════════════════════════════════════
  // prepositions-pays
  // ═══════════════════════════════════════════════════════════
  {
    topicSlug: 'prepositions-pays',
    type: 'multiple_choice',
    question: { text: 'Elle habite ___ France depuis dix ans.', options: ['en', 'au', 'à', 'aux'] },
    answer: { correct: 'en' },
    explanation: 'La France → féminin → en France.',
    explanationEn: 'La France → feminine country → en France.',
  },
  {
    topicSlug: 'prepositions-pays',
    type: 'fill_blank',
    question: { text: 'Mon ami est né ___ Japon et habite ___ Tokyo.', blanks: 2 },
    answer: { values: ['au', 'à'] },
    explanation: 'Le Japon → masculin → au Japon. Ville → à Tokyo.',
    explanationEn: 'Le Japon → masculine country → au Japon. City → à Tokyo.',
  },
  {
    topicSlug: 'prepositions-pays',
    type: 'multiple_choice',
    question: { text: 'Ils vont ___ États-Unis cet été.', options: ['aux', 'au', 'en', 'à'] },
    answer: { correct: 'aux' },
    explanation: 'Les États-Unis → pluriel → aux États-Unis.',
    explanationEn: 'Les États-Unis → plural country → aux États-Unis.',
  },
  {
    topicSlug: 'prepositions-pays',
    type: 'fill_blank',
    question: { text: 'Elle vient ___ Espagne et son mari vient ___ Mexique.', blanks: 2 },
    answer: { values: ['d\'', 'du'] },
    explanation: 'Origine: l\'Espagne (f.) → d\'Espagne; le Mexique (m.) → du Mexique.',
    explanationEn: 'Origin: l\'Espagne (f.) → d\'Espagne; le Mexique (m.) → du Mexique.',
  },
  {
    topicSlug: 'prepositions-pays',
    type: 'multiple_choice',
    question: { text: 'Nous partons ___ Italie la semaine prochaine.', options: ['en', 'au', 'à', 'aux'] },
    answer: { correct: 'en' },
    explanation: 'L\'Italie → féminin → en Italie.',
    explanationEn: 'L\'Italie → feminine country → en Italie.',
  },
  {
    topicSlug: 'prepositions-pays',
    type: 'fill_blank',
    question: { text: 'Il habite ___ Canada mais travaille souvent ___ New York.', blanks: 2 },
    answer: { values: ['au', 'à'] },
    explanation: 'Le Canada → masculin → au Canada. Ville → à New York.',
    explanationEn: 'Le Canada → masculine country → au Canada. City → à New York.',
  },
  {
    topicSlug: 'prepositions-pays',
    type: 'multiple_choice',
    question: { text: 'Ce vin vient ___ Portugal.', options: ['du', 'de', 'd\'', 'au'] },
    answer: { correct: 'du' },
    explanation: 'Origine: le Portugal → masculin → du Portugal.',
    explanationEn: 'Origin: le Portugal → masculine country → du Portugal.',
  },
];
