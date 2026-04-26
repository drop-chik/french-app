import type { ExerciseSeed } from './grammar-exercises-a1.js';

export const grammarExercisesA2Extra: ExerciseSeed[] = [
  // === imparfait-vs-passe-compose ===
  {
    topicSlug: 'imparfait-vs-passe-compose',
    type: 'multiple_choice',
    question: {
      text: 'Quand j\'___ enfant, j\'aimais beaucoup les bonbons.',
      options: ['étais', 'ai été', 'suis', 'était'],
    },
    answer: { correct: 'étais' },
    explanation: 'Описание состояния/возраста в прошлом → imparfait. «Когда я был ребёнком» — длящееся состояние.',
    explanationEn: 'Describing a state/age in the past → imparfait. "When I was a child" is an ongoing state.',
  },
  {
    topicSlug: 'imparfait-vs-passe-compose',
    type: 'fill_blank',
    question: { text: 'Hier soir, nous ___ (aller) au cinéma voir un thriller.', blanks: 1 },
    answer: { values: ['sommes allés'] },
    explanation: 'Завершённое однократное событие вчера → passé composé с être (aller — глагол движения).',
    explanationEn: 'A completed one-time event yesterday → passé composé with être (aller is a movement verb).',
  },
  {
    topicSlug: 'imparfait-vs-passe-compose',
    type: 'multiple_choice',
    question: {
      text: 'Je ___ (lire) quand mon téléphone ___ (sonner).',
      options: ['lisais / a sonné', 'ai lu / sonnait', 'lisais / sonnait', 'ai lu / a sonné'],
    },
    answer: { correct: 'lisais / a sonné' },
    explanation: 'Фоновое действие (читал) → imparfait; прерывающее событие (зазвонил) → passé composé.',
    explanationEn: 'Background action (was reading) → imparfait; interrupting event (rang) → passé composé.',
  },
  {
    topicSlug: 'imparfait-vs-passe-compose',
    type: 'translate',
    question: { text: 'Я читал книгу, когда вдруг зазвонил телефон.' },
    answer: { text: 'Je lisais un livre quand le téléphone a sonné.' },
    explanation: 'lisais — imparfait (фон); a sonné — passé composé (событие). Soudain/quand часто маркирует переключение.',
    explanationEn: 'lisais — imparfait (background); a sonné — passé composé (event). Soudain/quand often signals the switch.',
  },

  // === pronoms-y-en ===
  {
    topicSlug: 'pronoms-y-en',
    type: 'multiple_choice',
    question: {
      text: 'Tu vas souvent à la piscine ? — Oui, j\'___ vais deux fois par semaine.',
      options: ['y', 'en', 'lui', 'le'],
    },
    answer: { correct: 'y' },
    explanation: 'y заменяет «à la piscine» (место). J\'y vais = Je vais à la piscine.',
    explanationEn: 'y replaces «à la piscine» (place). J\'y vais = Je vais à la piscine.',
  },
  {
    topicSlug: 'pronoms-y-en',
    type: 'fill_blank',
    question: { text: 'Tu veux du gâteau ? — Oui, j\'___ veux bien, merci.', blanks: 1 },
    answer: { values: ['en'] },
    explanation: 'en заменяет «du gâteau» (de + артикль + существительное).',
    explanationEn: 'en replaces «du gâteau» (de + article + noun).',
  },
  {
    topicSlug: 'pronoms-y-en',
    type: 'multiple_choice',
    question: {
      text: 'Il a des sœurs ? — Oui, il ___ a deux.',
      options: ['en', 'y', 'les', 'lui'],
    },
    answer: { correct: 'en' },
    explanation: 'en заменяет «des sœurs» и позволяет указать количество: il en a deux.',
    explanationEn: 'en replaces «des sœurs» and allows the quantity to be stated: il en a deux.',
  },
  {
    topicSlug: 'pronoms-y-en',
    type: 'translate',
    question: { text: 'Ты думаешь об этой проблеме? — Да, я часто об этом думаю.' },
    answer: { text: 'Tu penses à ce problème ? — Oui, j\'y pense souvent.' },
    explanation: 'y заменяет «à ce problème» (à + неодушевлённое). Человека заменяли бы через «à lui/à elle».',
    explanationEn: 'y replaces «à ce problème» (à + inanimate). For a person, you would use «à lui/à elle» instead.',
  },

  // === conditionnel-present ===
  {
    topicSlug: 'conditionnel-present',
    type: 'fill_blank',
    question: { text: 'Je ___ (vouloir) un café, s\'il vous plaît.', blanks: 1 },
    answer: { values: ['voudrais'] },
    explanation: 'Вежливая просьба → conditionnel: voudrais (основа voudр- + окончание -ais).',
    explanationEn: 'Polite request → conditionnel: voudrais (stem voudр- + ending -ais).',
  },
  {
    topicSlug: 'conditionnel-present',
    type: 'multiple_choice',
    question: {
      text: 'Si j\'avais plus de temps, je ___ voyager autour du monde.',
      options: ['voyagerais', 'vais voyager', 'voyagerai', 'voyage'],
    },
    answer: { correct: 'voyagerais' },
    explanation: 'Структура нереального условия: si + imparfait → conditionnel. voyagerais = основа voyager + -ais.',
    explanationEn: 'Unreal condition structure: si + imparfait → conditionnel. voyagerais = stem voyager + -ais.',
  },
  {
    topicSlug: 'conditionnel-present',
    type: 'fill_blank',
    question: { text: 'Tu ___ (devoir) faire plus de sport, c\'est bon pour la santé.', blanks: 1 },
    answer: { values: ['devrais'] },
    explanation: 'Совет → conditionnel de devoir: devrais (основа devr- + -ais).',
    explanationEn: 'Advice → conditionnel of devoir: devrais (stem devr- + -ais).',
  },
  {
    topicSlug: 'conditionnel-present',
    type: 'translate',
    question: { text: 'Не могли бы вы мне помочь, пожалуйста?' },
    answer: { text: 'Pourriez-vous m\'aider, s\'il vous plaît ?' },
    explanation: 'Вежливый вопрос с инверсией: pourriez-vous (conditionnel de pouvoir, vous). m\'aider = мне помочь.',
    explanationEn: 'Polite question with inversion: pourriez-vous (conditionnel of pouvoir, vous). m\'aider = to help me.',
  },

  // === adverbes-formation ===
  {
    topicSlug: 'adverbes-formation',
    type: 'fill_blank',
    question: { text: 'Elle parle très ___ (lent) pour que je comprenne.', blanks: 1 },
    answer: { values: ['lentement'] },
    explanation: 'lent → lente (ж.р.) + -ment = lentement. Наречие стоит после глагола.',
    explanationEn: 'lent → lente (feminine) + -ment = lentement. The adverb follows the verb.',
  },
  {
    topicSlug: 'adverbes-formation',
    type: 'multiple_choice',
    question: {
      text: 'Il a répondu ___ à toutes mes questions.',
      options: ['patiemment', 'patientement', 'patiencement', 'patient'],
    },
    answer: { correct: 'patiemment' },
    explanation: 'patient → окончание -ent → наречие на -emment: patiemment. (évident → évidemment).',
    explanationEn: 'patient → adjective ending in -ent → adverb ending in -emment: patiemment.',
  },
  {
    topicSlug: 'adverbes-formation',
    type: 'fill_blank',
    question: { text: '___ (heureux), il n\'y avait pas de bouchon sur l\'autoroute.', blanks: 1 },
    answer: { values: ['Heureusement'] },
    explanation: 'heureux → heureuse (ж.р.) + -ment = heureusement. В начале предложения = «к счастью».',
    explanationEn: 'heureux → heureuse (feminine) + -ment = heureusement. At the start of a sentence = "fortunately".',
  },
  {
    topicSlug: 'adverbes-formation',
    type: 'translate',
    question: { text: 'Он хорошо говорит по-французски.' },
    answer: { text: 'Il parle bien le français.' },
    explanation: 'bon → bien (нерегулярное наречие). Il parle bien = он говорит хорошо.',
    explanationEn: 'bon → bien (irregular adverb). Il parle bien = he speaks well.',
  },

  // === passe-recent ===
  {
    topicSlug: 'passe-recent',
    type: 'fill_blank',
    question: { text: 'Elle ___ (venir de) finir ses devoirs — elle est épuisée.', blanks: 1 },
    answer: { values: ['vient de'] },
    explanation: 'elle + venir de → vient de. Действие только что завершилось.',
    explanationEn: 'elle + venir de → vient de. The action has just been completed.',
  },
  {
    topicSlug: 'passe-recent',
    type: 'multiple_choice',
    question: {
      text: 'Nous ___ de prendre une grande décision.',
      options: ['venons', 'vient', 'viennent', 'venez'],
    },
    answer: { correct: 'venons' },
    explanation: 'nous + venir → venons. Passé récent: venons de + infinitif.',
    explanationEn: 'nous + venir → venons. Passé récent: venons de + infinitive.',
  },
  {
    topicSlug: 'passe-recent',
    type: 'fill_blank',
    question: { text: 'Je ___ ___ voir ce film — il est fantastique !', blanks: 2 },
    answer: { values: ['viens', 'de'] },
    explanation: 'je viens de + infinitif. «Только что посмотреть» = viens de voir.',
    explanationEn: 'je viens de + infinitive. "Have just watched" = viens de voir.',
  },
  {
    topicSlug: 'passe-recent',
    type: 'translate',
    question: { text: 'Я только что узнал эту новость.' },
    answer: { text: 'Je viens d\'apprendre cette nouvelle.' },
    explanation: 'viens de + apprendre (перед гласной: de → d\'). Cette nouvelle = эту новость.',
    explanationEn: 'viens de + apprendre (before vowel: de → d\'). Cette nouvelle = this news.',
  },

  // === questions-indirectes ===
  {
    topicSlug: 'questions-indirectes',
    type: 'multiple_choice',
    question: {
      text: 'Je ne sais pas ___ il est parti.',
      options: ['où', 'est-ce que', 'qu\'est-ce que', 'si où'],
    },
    answer: { correct: 'où' },
    explanation: 'В косвенном вопросе где используем où без est-ce que и без инверсии.',
    explanationEn: 'In an indirect question, use où without est-ce que and without inversion.',
  },
  {
    topicSlug: 'questions-indirectes',
    type: 'fill_blank',
    question: { text: 'Demande-lui ___ il veut du café ou du thé.', blanks: 1 },
    answer: { values: ['s\'il'] },
    explanation: 'Да/нет вопрос в косвенной речи → si. s\'il = si + il (элизия перед il).',
    explanationEn: 'Yes/no question in indirect speech → si. s\'il = si + il (elision before il).',
  },
  {
    topicSlug: 'questions-indirectes',
    type: 'multiple_choice',
    question: {
      text: 'Elle veut savoir ___ tu penses de son idée.',
      options: ['ce que', 'qu\'est-ce que', 'que', 'quoi que'],
    },
    answer: { correct: 'ce que' },
    explanation: 'Qu\'est-ce que → ce que в косвенном вопросе. Elle veut savoir ce que tu penses.',
    explanationEn: 'Qu\'est-ce que → ce que in indirect questions. Elle veut savoir ce que tu penses.',
  },
  {
    topicSlug: 'questions-indirectes',
    type: 'translate',
    question: { text: 'Я не знаю, будет ли он дома завтра.' },
    answer: { text: 'Je ne sais pas s\'il sera à la maison demain.' },
    explanation: 'Да/нет вопрос (будет ли) → si. Прямой порядок слов: s\'il sera (нет инверсии).',
    explanationEn: 'Yes/no question (whether) → si. Normal word order: s\'il sera (no inversion).',
  },
];
