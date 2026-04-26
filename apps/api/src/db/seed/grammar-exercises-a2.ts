import type { ExerciseSeed } from './grammar-exercises-a1.js';

export const grammarExercisesA2: ExerciseSeed[] = [

  // ═══════════════════════════════════════════════════════════
  // passe-compose-avoir
  // ═══════════════════════════════════════════════════════════
  {
    topicSlug: 'passe-compose-avoir',
    type: 'fill_blank',
    question: { text: "Hier, j'___ (manger) une pizza avec mes amis.", blanks: 1 },
    answer: { values: ['ai mangé'] },
    explanation: 'Passé composé с avoir: j\'ai + participe passé. manger → mangé.',
    explanationEn: 'Passé composé with avoir: j\'ai + past participle. manger → mangé.',
  },
  {
    topicSlug: 'passe-compose-avoir',
    type: 'multiple_choice',
    question: { text: 'Nous ___ le film hier soir.', options: ['avons vu', 'ont vu', 'avez vu', 'as vu'] },
    answer: { correct: 'avons vu' },
    explanation: 'Nous → avons. voir → vu (irrégulier).',
    explanationEn: 'Nous → avons. voir → vu (irregular past participle).',
  },
  {
    topicSlug: 'passe-compose-avoir',
    type: 'multiple_choice',
    question: { text: 'Tu ___ tes devoirs ce matin ?', options: ['as fait', 'ai fait', 'avons fait', 'avez fait'] },
    answer: { correct: 'as fait' },
    explanation: 'Tu → as. faire → fait (irrégulier).',
    explanationEn: 'Tu → as. faire → fait (irregular past participle).',
  },
  {
    topicSlug: 'passe-compose-avoir',
    type: 'translate',
    question: { text: 'Они выпили кофе утром.', from: 'ru', to: 'fr' },
    answer: { text: 'Ils ont bu du café ce matin.' },
    explanation: 'boire → bu (irrégulier). Ils → ont.',
    explanationEn: 'boire → bu (irregular). Ils → ont.',
  },

  // ═══════════════════════════════════════════════════════════
  // passe-compose-etre
  // ═══════════════════════════════════════════════════════════
  {
    topicSlug: 'passe-compose-etre',
    type: 'fill_blank',
    question: { text: 'Marie ___ (arriver) à 9 heures.', blanks: 1 },
    answer: { values: ['est arrivée'] },
    explanation: 'arriver — глагол движения, вспомогательный être. Marie — женского рода → arrivée.',
    explanationEn: 'arriver uses être. Marie is feminine → past participle agrees: arrivée.',
  },
  {
    topicSlug: 'passe-compose-etre',
    type: 'multiple_choice',
    question: { text: 'Les enfants ___ au parc hier.', options: ['sont allés', 'ont allé', 'sont allé', 'avons allé'] },
    answer: { correct: 'sont allés' },
    explanation: 'aller → être. Les enfants (мн.ч. м.р.) → allés.',
    explanationEn: 'aller uses être. Les enfants (masculine plural) → allés.',
  },
  {
    topicSlug: 'passe-compose-etre',
    type: 'multiple_choice',
    question: { text: 'Nous ___ du cinéma à minuit.', options: ["sommes sortis", "avons sorti", "sont sortis", "êtes sortis"] },
    answer: { correct: 'sommes sortis' },
    explanation: 'sortir — avec être. Nous (мн.ч.) → sommes sortis.',
    explanationEn: 'sortir uses être. Nous (plural) → sommes sortis.',
  },
  {
    topicSlug: 'passe-compose-etre',
    type: 'translate',
    question: { text: 'Она ушла рано утром.', from: 'ru', to: 'fr' },
    answer: { text: 'Elle est partie tôt le matin.' },
    explanation: 'partir → être. Elle (ж.р.) → partie.',
    explanationEn: 'partir uses être. Elle (feminine) → partie.',
  },

  // ═══════════════════════════════════════════════════════════
  // imparfait
  // ═══════════════════════════════════════════════════════════
  {
    topicSlug: 'imparfait',
    type: 'fill_blank',
    question: { text: "Quand j'___ (être) enfant, je ___ (jouer) au foot.", blanks: 2 },
    answer: { values: ['étais', 'jouais'] },
    explanation: 'Имперфект для привычных действий в прошлом. être → étais, jouer → jouais.',
    explanationEn: 'Imperfect for habitual past actions. être → étais, jouer → jouais.',
  },
  {
    topicSlug: 'imparfait',
    type: 'multiple_choice',
    question: { text: 'Il ___ fatigué et il ___ dormir.', options: ['était / voulait', 'a été / a voulu', 'est / veut', 'était / a voulu'] },
    answer: { correct: 'était / voulait' },
    explanation: 'Описание состояния в прошлом → imparfait для обоих глаголов.',
    explanationEn: 'Describing a past state → imperfect for both verbs.',
  },
  {
    topicSlug: 'imparfait',
    type: 'multiple_choice',
    question: { text: 'Je lisais quand le téléphone ___...', options: ['a sonné', 'sonnait', 'sonne', 'sonnera'] },
    answer: { correct: 'a sonné' },
    explanation: 'Прерванное действие (lisais — imparfait) + конкретное событие (a sonné — passé composé).',
    explanationEn: 'Background action (imparfait) + interrupting event (passé composé).',
  },
  {
    topicSlug: 'imparfait',
    type: 'translate',
    question: { text: 'Раньше мы часто ходили в кино.', from: 'ru', to: 'fr' },
    answer: { text: 'Avant, nous allions souvent au cinéma.' },
    explanation: 'Повторяющееся действие в прошлом → imparfait.',
    explanationEn: 'Habitual past action → imperfect.',
  },

  // ═══════════════════════════════════════════════════════════
  // futur-simple
  // ═══════════════════════════════════════════════════════════
  {
    topicSlug: 'futur-simple',
    type: 'fill_blank',
    question: { text: "Demain, nous ___ (aller) à la mer.", blanks: 1 },
    answer: { values: ['irons'] },
    explanation: 'aller — неправильная основа futur: ir-. Nous → irons.',
    explanationEn: 'aller has irregular futur stem: ir-. Nous → irons.',
  },
  {
    topicSlug: 'futur-simple',
    type: 'multiple_choice',
    question: { text: "L'année prochaine, je ___ en France.", options: ['irai', 'vais aller', 'suis allé', 'allais'] },
    answer: { correct: 'irai' },
    explanation: "Futur simple pour une prévision précise. aller → ir- + ai → irai.",
    explanationEn: "Simple future for a specific future prediction. aller → ir- + ai → irai.",
  },
  {
    topicSlug: 'futur-simple',
    type: 'multiple_choice',
    question: { text: 'Il ___ beau ce week-end.', options: ['fera', 'fait', 'a fait', 'faisait'] },
    answer: { correct: 'fera' },
    explanation: 'faire — неправильная основа futur: fer-. Il → fera.',
    explanationEn: 'faire has irregular futur stem: fer-. Il → fera.',
  },
  {
    topicSlug: 'futur-simple',
    type: 'translate',
    question: { text: 'Они вернутся домой завтра вечером.', from: 'ru', to: 'fr' },
    answer: { text: 'Ils rentreront à la maison demain soir.' },
    explanation: 'rentrer — правильный глагол: rentrer → rentrer- + ont → rentreront.',
    explanationEn: 'rentrer is regular: infinitive + -ont = rentreront.',
  },

  // ═══════════════════════════════════════════════════════════
  // comparatif-superlatif
  // ═══════════════════════════════════════════════════════════
  {
    topicSlug: 'comparatif-superlatif',
    type: 'fill_blank',
    question: { text: 'Paris est ___ grand ___ Lyon. (больше)', blanks: 2 },
    answer: { values: ['plus', 'que'] },
    explanation: 'Превосходство: plus + прилагательное + que.',
    explanationEn: 'Superiority: plus + adjective + que.',
  },
  {
    topicSlug: 'comparatif-superlatif',
    type: 'multiple_choice',
    question: { text: "C'est ___ restaurant de la ville.", options: ['le meilleur', 'le plus bon', 'le mieux', 'plus bon'] },
    answer: { correct: 'le meilleur' },
    explanation: 'bon → meilleur (иррегулярно). Превосходная степень: le meilleur.',
    explanationEn: 'bon → meilleur (irregular). Superlative: le meilleur.',
  },
  {
    topicSlug: 'comparatif-superlatif',
    type: 'multiple_choice',
    question: { text: 'Elle chante ___ bien ___ moi.', options: ['aussi / que', 'plus / que', 'autant / que', 'moins / que'] },
    answer: { correct: 'aussi / que' },
    explanation: 'Равенство с наречием: aussi + наречие + que.',
    explanationEn: 'Equality with adverb: aussi + adverb + que.',
  },
  {
    topicSlug: 'comparatif-superlatif',
    type: 'translate',
    question: { text: 'Это самая лёгкая задача в классе.', from: 'ru', to: 'fr' },
    answer: { text: "C'est l'exercice le plus facile de la classe." },
    explanation: 'Превосходная степень: le plus + прилагательное + de.',
    explanationEn: 'Superlative: le plus + adjective + de.',
  },

  // ═══════════════════════════════════════════════════════════
  // pronoms-relatifs
  // ═══════════════════════════════════════════════════════════
  {
    topicSlug: 'pronoms-relatifs',
    type: 'multiple_choice',
    question: { text: "L'homme ___ parle est mon professeur.", options: ['qui', 'que', "qu'", 'dont'] },
    answer: { correct: 'qui' },
    explanation: 'qui = подлежащее: l\'homme parle → qui (субъект глагола).',
    explanationEn: 'qui = subject: the man speaks → qui (subject of verb).',
  },
  {
    topicSlug: 'pronoms-relatifs',
    type: 'multiple_choice',
    question: { text: 'Le film ___ j\'ai vu était super.', options: ["que", 'qui', 'qu', 'dont'] },
    answer: { correct: 'que' },
    explanation: "que = прямое дополнение: j'ai vu le film → que (объект глагола).",
    explanationEn: "que = direct object: I saw the film → que (object of verb).",
  },
  {
    topicSlug: 'pronoms-relatifs',
    type: 'fill_blank',
    question: { text: "C'est la fille ___ habite à côté de chez moi.", blanks: 1 },
    answer: { values: ['qui'] },
    explanation: 'Глагол habite нуждается в подлежащем → qui.',
    explanationEn: 'The verb habite needs a subject → qui.',
  },
  {
    topicSlug: 'pronoms-relatifs',
    type: 'translate',
    question: { text: 'Книга, которую я читаю, очень интересна.', from: 'ru', to: 'fr' },
    answer: { text: "Le livre que je lis est très intéressant." },
    explanation: 'je lis le livre — le livre является прямым дополнением → que.',
    explanationEn: 'je lis le livre — le livre is the direct object → que.',
  },

  // ═══════════════════════════════════════════════════════════
  // pronoms-cod-coi
  // ═══════════════════════════════════════════════════════════
  {
    topicSlug: 'pronoms-cod-coi',
    type: 'multiple_choice',
    question: { text: 'Tu vois Marie ? — Oui, je ___ vois tous les jours.', options: ['la', 'le', 'lui', 'les'] },
    answer: { correct: 'la' },
    explanation: 'Marie — прямое дополнение (COD), ж.р. → la.',
    explanationEn: 'Marie is a direct object (COD), feminine → la.',
  },
  {
    topicSlug: 'pronoms-cod-coi',
    type: 'multiple_choice',
    question: { text: 'Tu parles à Paul ? — Oui, je ___ parle souvent.', options: ['lui', 'le', 'la', 'y'] },
    answer: { correct: 'lui' },
    explanation: "parler à quelqu'un → COI (косвенное). Paul (м.р. ед.ч.) → lui.",
    explanationEn: "parler à quelqu'un → COI (indirect). Paul (masculine sg.) → lui.",
  },
  {
    topicSlug: 'pronoms-cod-coi',
    type: 'fill_blank',
    question: { text: "J'ai vu les enfants hier. Je ___ ai vus au parc.", blanks: 1 },
    answer: { values: ['les'] },
    explanation: 'les enfants — прямое дополнение мн.ч. → les. Participe passé согласуется: vus.',
    explanationEn: 'les enfants is a plural direct object → les. Past participle agrees: vus.',
  },
  {
    topicSlug: 'pronoms-cod-coi',
    type: 'translate',
    question: { text: 'Я говорю ей каждый день.', from: 'ru', to: 'fr' },
    answer: { text: 'Je lui parle tous les jours.' },
    explanation: 'parler à elle → COI → lui. Место: перед глаголом.',
    explanationEn: 'parler à elle → COI → lui. Position: before the verb.',
  },

  // ═══════════════════════════════════════════════════════════
  // negation-avancee
  // ═══════════════════════════════════════════════════════════
  {
    topicSlug: 'negation-avancee',
    type: 'fill_blank',
    question: { text: 'Il ne fume ___ depuis deux ans.', blanks: 1 },
    answer: { values: ['plus'] },
    explanation: 'ne...plus = больше не / уже не.',
    explanationEn: 'ne...plus = no longer / not anymore.',
  },
  {
    topicSlug: 'negation-avancee',
    type: 'multiple_choice',
    question: { text: 'Elle ne mange ___ le matin.', options: ['jamais', 'plus', 'rien', 'pas'] },
    answer: { correct: 'jamais' },
    explanation: 'jamais = никогда. Подходит по смыслу «она никогда не ест утром».',
    explanationEn: 'jamais = never. She never eats in the morning.',
  },
  {
    topicSlug: 'negation-avancee',
    type: 'fill_blank',
    question: { text: "Je n'entends ___. Tout est silencieux.", blanks: 1 },
    answer: { values: ['rien'] },
    explanation: 'rien = ничего. Je n\'entends rien = Я ничего не слышу.',
    explanationEn: 'rien = nothing. Je n\'entends rien = I hear nothing.',
  },
  {
    topicSlug: 'negation-avancee',
    type: 'translate',
    question: { text: 'Я больше не хочу кофе.', from: 'ru', to: 'fr' },
    answer: { text: 'Je ne veux plus de café.' },
    explanation: 'ne...plus = больше не. После отрицания артикль меняется на de.',
    explanationEn: 'ne...plus = no longer. After negation, article becomes de.',
  },

  // ═══════════════════════════════════════════════════════════
  // verbes-pronominaux
  // ═══════════════════════════════════════════════════════════
  {
    topicSlug: 'verbes-pronominaux',
    type: 'fill_blank',
    question: { text: 'Chaque matin, je ___ (se lever) à 7 heures.', blanks: 1 },
    answer: { values: ['me lève'] },
    explanation: 'se lever → je me lève. Возвратное местоимение me перед глаголом.',
    explanationEn: 'se lever → je me lève. Reflexive pronoun me goes before the verb.',
  },
  {
    topicSlug: 'verbes-pronominaux',
    type: 'multiple_choice',
    question: { text: 'Hier soir, elle ___ très tard.', options: ["s'est couchée", "se couche", "s'est couché", "s'a couchée"] },
    answer: { correct: "s'est couchée" },
    explanation: 'Passé composé возвратного глагола: être + participe. Elle (ж.р.) → couchée.',
    explanationEn: 'Passé composé of reflexive verb: être + participle. Elle (feminine) → couchée.',
  },
  {
    topicSlug: 'verbes-pronominaux',
    type: 'fill_blank',
    question: { text: 'Vous ___ (se dépêcher) ! Le train part dans 5 minutes.', blanks: 1 },
    answer: { values: ['vous dépêchez'] },
    explanation: 'se dépêcher → vous vous dépêchez.',
    explanationEn: 'se dépêcher → vous vous dépêchez.',
  },
  {
    topicSlug: 'verbes-pronominaux',
    type: 'translate',
    question: { text: 'Мы прогуливаемся в парке каждое воскресенье.', from: 'ru', to: 'fr' },
    answer: { text: 'Nous nous promenons dans le parc chaque dimanche.' },
    explanation: 'se promener → nous nous promenons.',
    explanationEn: 'se promener → nous nous promenons.',
  },

  // ═══════════════════════════════════════════════════════════
  // expressions-temps
  // ═══════════════════════════════════════════════════════════
  {
    topicSlug: 'expressions-temps',
    type: 'multiple_choice',
    question: { text: "J'apprends le russe ___ trois ans.", options: ['depuis', 'pendant', 'il y a', 'pour'] },
    answer: { correct: 'depuis' },
    explanation: 'depuis + présent = действие началось 3 года назад и продолжается сейчас.',
    explanationEn: 'depuis + présent = action started 3 years ago and is still ongoing.',
  },
  {
    topicSlug: 'expressions-temps',
    type: 'multiple_choice',
    question: { text: "Il a vécu à Rome ___ deux ans.", options: ['pendant', 'depuis', 'il y a', 'en'] },
    answer: { correct: 'pendant' },
    explanation: 'pendant + passé composé = завершённый период в прошлом.',
    explanationEn: 'pendant + passé composé = completed period in the past.',
  },
  {
    topicSlug: 'expressions-temps',
    type: 'fill_blank',
    question: { text: "Elle est partie ___ une semaine.", blanks: 1 },
    answer: { values: ['il y a'] },
    explanation: 'il y a + passé composé = указывает момент в прошлом (неделю назад).',
    explanationEn: 'il y a + passé composé = indicates a specific past moment (a week ago).',
  },
  {
    topicSlug: 'expressions-temps',
    type: 'translate',
    question: { text: 'Я живу в этом городе уже пять лет.', from: 'ru', to: 'fr' },
    answer: { text: "J'habite dans cette ville depuis cinq ans." },
    explanation: 'depuis + présent = живу и сейчас. depuis cinq ans = уже пять лет.',
    explanationEn: 'depuis + présent = still living there. depuis cinq ans = for five years.',
  },
];
