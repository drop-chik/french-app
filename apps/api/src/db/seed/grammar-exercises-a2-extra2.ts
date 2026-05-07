import type { ExerciseSeed } from './grammar-exercises-a1.js';

export const grammarExercisesA2Extra2: ExerciseSeed[] = [

  // ═══════════════════════════════════════════════════════════
  // verbes-modaux
  // ═══════════════════════════════════════════════════════════
  {
    topicSlug: 'verbes-modaux',
    type: 'fill_blank',
    question: { text: 'Est-ce que je ___ (pouvoir) ouvrir la fenêtre?', blanks: 1 },
    answer: { values: ['peux'] },
    explanation: 'Pouvoir (je): je peux. Выражает разрешение или возможность.',
    explanationEn: 'pouvoir (je): je peux. Expresses permission or ability.',
  },
  {
    topicSlug: 'verbes-modaux',
    type: 'fill_blank',
    question: { text: 'Vous ___ (devoir) finir ce rapport avant vendredi.', blanks: 1 },
    answer: { values: ['devez'] },
    explanation: 'Devoir (vous): vous devez. Выражает обязанность.',
    explanationEn: 'devoir (vous): vous devez. Expresses obligation.',
  },
  {
    topicSlug: 'verbes-modaux',
    type: 'multiple_choice',
    question: { text: 'Ils ___ visiter le musée demain.', options: ['veulent', 'voulons', 'voulez', 'veut'] },
    answer: { correct: 'veulent' },
    explanation: 'Vouloir (ils): ils veulent.',
    explanationEn: 'vouloir (ils): ils veulent.',
  },
  {
    topicSlug: 'verbes-modaux',
    type: 'fill_blank',
    question: { text: '___ réserver à l\'avance pour ce restaurant. (il faut)', blanks: 1 },
    answer: { values: ['Il faut'] },
    explanation: 'Il faut + infinitif = необходимо. Безличная форма falloir.',
    explanationEn: 'Il faut + infinitive = it is necessary. Impersonal form of falloir.',
  },
  {
    topicSlug: 'verbes-modaux',
    type: 'multiple_choice',
    question: { text: 'Elle ___ parler trois langues — c\'est impressionnant!', options: ['sait', 'peut', 'doit', 'veut'] },
    answer: { correct: 'sait' },
    explanation: 'Savoir = умение/навык (приобретённое). Peut = физическая возможность.',
    explanationEn: 'Savoir = learned skill. Pouvoir = physical possibility/permission.',
  },
  {
    topicSlug: 'verbes-modaux',
    type: 'fill_blank',
    question: { text: 'Nous ___ (vouloir) partir en vacances en août.', blanks: 1 },
    answer: { values: ['voulons'] },
    explanation: 'Vouloir (nous): nous voulons.',
    explanationEn: 'vouloir (nous): nous voulons.',
  },
  {
    topicSlug: 'verbes-modaux',
    type: 'multiple_choice',
    question: { text: 'Je n\'___ pas conduire — je n\'ai jamais appris.', options: ['sais', 'peux', 'dois', 'veux'] },
    answer: { correct: 'sais' },
    explanation: 'Savoir = умение. «Я не умею водить» → Je ne sais pas conduire.',
    explanationEn: 'Savoir = ability (skill). "I don\'t know how to drive" → Je ne sais pas conduire.',
  },
  {
    topicSlug: 'verbes-modaux',
    type: 'fill_blank',
    question: { text: 'Tu ___ (devoir) être fatigué après ce long voyage.', blanks: 1 },
    answer: { values: ['dois'] },
    explanation: 'Devoir peut exprimer la probabilité: Tu dois être fatigué = tu es probablement fatigué.',
    explanationEn: 'Devoir can express probability: Tu dois être fatigué = you must be tired.',
  },

  // ═══════════════════════════════════════════════════════════
  // connecteurs-simples
  // ═══════════════════════════════════════════════════════════
  {
    topicSlug: 'connecteurs-simples',
    type: 'multiple_choice',
    question: { text: 'Elle aime la France, ___ elle étudie le français.', options: ['donc', 'mais', 'ou', 'car'] },
    answer: { correct: 'donc' },
    explanation: 'Donc = следовательно, поэтому. Выражает следствие.',
    explanationEn: 'Donc = therefore/so. Expresses consequence.',
  },
  {
    topicSlug: 'connecteurs-simples',
    type: 'fill_blank',
    question: { text: 'Je reste à la maison ___ il pleut.', blanks: 1 },
    answer: { values: ['parce que'] },
    explanation: 'Parce que = потому что. Отвечает на вопрос «почему?».',
    explanationEn: 'Parce que = because. Answers the question "why?".',
  },
  {
    topicSlug: 'connecteurs-simples',
    type: 'multiple_choice',
    question: { text: 'C\'est cher, ___ la qualité est bonne.', options: ['mais', 'donc', 'parce que', 'alors'] },
    answer: { correct: 'mais' },
    explanation: 'Mais = но. Выражает противопоставление.',
    explanationEn: 'Mais = but. Expresses contrast.',
  },
  {
    topicSlug: 'connecteurs-simples',
    type: 'fill_blank',
    question: { text: '___ il faisait beau, nous avons décidé de faire un pique-nique.', blanks: 1 },
    answer: { values: ['Comme'] },
    explanation: 'Comme = поскольку, так как (причина). Ставится в начале предложения.',
    explanationEn: 'Comme = since/as (cause). Goes at the beginning of the sentence.',
  },
  {
    topicSlug: 'connecteurs-simples',
    type: 'multiple_choice',
    question: { text: 'Il était absent, ___ on a annulé la réunion.', options: ['du coup', 'mais', 'parce que', 'ou'] },
    answer: { correct: 'du coup' },
    explanation: 'Du coup = разговорный эквивалент «donc» (следствие).',
    explanationEn: 'Du coup = informal equivalent of donc (consequence).',
  },
  {
    topicSlug: 'connecteurs-simples',
    type: 'fill_blank',
    question: { text: 'Tu veux du café ___ du thé?', blanks: 1 },
    answer: { values: ['ou'] },
    explanation: 'Ou = или. Альтернатива между двумя вариантами.',
    explanationEn: 'Ou = or. Alternative between two options.',
  },
  {
    topicSlug: 'connecteurs-simples',
    type: 'multiple_choice',
    question: { text: '___ tu es là, aide-moi à déplacer ce meuble.', options: ['Puisque', 'Donc', 'Mais', 'Alors'] },
    answer: { correct: 'Puisque' },
    explanation: 'Puisque = раз уж, поскольку (причина, известная собеседнику).',
    explanationEn: 'Puisque = since (reason already known to the listener).',
  },
];
