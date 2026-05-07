import type { GrammarTopic } from './grammar-a1.js';

export const grammarTopicsB2Extra: GrammarTopic[] = [

  // ─────────────────────────────────────────────────────────────
  // 1. Les registres de langue
  // ─────────────────────────────────────────────────────────────
  {
    slug: 'registres-langue',
    titleRu: 'Регистры языка (разговорный / нейтральный / книжный)',
    titleEn: 'Language Registers (Formal, Neutral, Informal)',
    titleFr: 'Les registres de langue',
    category: 'lexique',
    orderNum: 13,
    content: [
      {
        type: 'paragraph',
        text: 'Французский язык имеет три основных регистра: familier (разговорный/фамильярный), courant (нейтральный/стандартный) и soutenu (книжный/высокий). Умение переключаться между ними — ключевой навык B2.',
      },
      {
        type: 'table',
        title: 'Лексические различия по регистрам',
        headers: ['Familier (разг.)', 'Courant (нейтр.)', 'Soutenu (книжн.)'],
        rows: [
          ['un mec', 'un homme', 'un individu / un homme'],
          ['une nana / une meuf', 'une femme', 'une dame / une femme'],
          ['un gosse / un gamin', 'un enfant', 'un enfant / une progéniture'],
          ['un bouquin', 'un livre', 'un ouvrage / un volume'],
          ['la fac', 'l\'université', 'l\'université / l\'établissement'],
          ['sympa', 'agréable', 'plaisant / aimable'],
          ['super / top / génial', 'excellent / très bien', 'remarquable / exceptionnel'],
          ['bosser', 'travailler', 'exercer / œuvrer'],
          ['kiffer', 'aimer', 'apprécier / affectionner'],
          ['se casser', 'partir', 'se retirer / quitter les lieux'],
        ],
      },
      {
        type: 'table',
        title: 'Грамматические различия по регистрам',
        headers: ['Familier', 'Courant', 'Soutenu'],
        rows: [
          ['on (= nous)', 'nous', 'nous'],
          ['C\'est moi qui l\'ai fait.', 'Je l\'ai fait.', 'C\'est moi qui ai accompli cela.'],
          ['T\'as vu? (t\'= tu)', 'Tu as vu?', 'Avez-vous vu? / As-tu vu?'],
          ['Je sais pas.', 'Je ne sais pas.', 'Je l\'ignore. / Je ne le sais point.'],
          ['Y a pas de problème.', 'Il n\'y a pas de problème.', 'Il n\'est point de problème.'],
          ['Pourquoi tu ris?', 'Pourquoi ris-tu? / Pourquoi est-ce que tu ris?', 'Pour quelle raison riez-vous?'],
        ],
      },
      {
        type: 'rule_list',
        title: 'Когда использовать каждый регистр:',
        rules: [
          'Familier: разговоры с друзьями, SMS, неформальные ситуации.',
          'Courant: повседневное общение, пресса, деловые письма, учёба.',
          'Soutenu: официальные тексты, литература, академическое письмо, выступления.',
          'En fait ≠ en effet: en fait = «на самом деле» (поправка); en effet = «действительно» (подтверждение).',
          'Признаки familier: выпадение ne в отрицании, on вместо nous, усечённые слова (télé, boulot, stylo).',
        ],
      },
      {
        type: 'example_list',
        title: 'Примеры',
        items: [
          { fr: 'Familier: «T\'as vu ce bouquin? C\'est trop bien!»', ru: 'Разговорный: «Ты видел эту книжку? Она такая классная!»', en: 'Informal: "Have you seen this book? It\'s so great!"' },
          { fr: 'Courant: «As-tu vu ce livre? Il est très bien.»', ru: 'Нейтральный: «Ты видел эту книгу? Она очень хорошая.»', en: 'Neutral: "Have you seen this book? It is very good."' },
          { fr: 'Soutenu: «Avez-vous pris connaissance de cet ouvrage? Il est remarquable.»', ru: 'Книжный: «Были ли вы знакомы с этим трудом? Он замечателен.»', en: 'Formal: "Have you acquainted yourself with this work? It is remarkable."' },
        ],
      },
    ],
    contentEn: [
      {
        type: 'paragraph',
        text: 'French has three main registers: familier (informal), courant (standard/neutral), and soutenu (formal/literary). Switching appropriately is a B2-level skill.',
      },
      {
        type: 'table',
        title: 'Key grammatical markers by register',
        headers: ['Familier', 'Courant', 'Soutenu'],
        rows: [
          ['on (= nous)', 'nous', 'nous'],
          ['Je sais pas. (ne dropped)', 'Je ne sais pas.', 'Je l\'ignore.'],
          ['T\'as vu? (tu → t\')', 'Tu as vu?', 'Avez-vous vu?'],
        ],
      },
      {
        type: 'example_list',
        title: 'Examples',
        items: [
          { fr: 'Familier: «T\'as vu ce bouquin? C\'est trop bien!»', ru: 'Informal: "Have you seen this book? It\'s so great!"' },
          { fr: 'Soutenu: «Avez-vous pris connaissance de cet ouvrage? Il est remarquable.»', ru: 'Formal: "Have you acquainted yourself with this work? It is remarkable."' },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────
  // 2. Les propositions participiales
  // ─────────────────────────────────────────────────────────────
  {
    slug: 'propositions-participiales',
    titleRu: 'Причастные обороты',
    titleEn: 'Participial Clauses',
    titleFr: 'Les propositions participiales',
    category: 'syntaxe',
    orderNum: 14,
    content: [
      {
        type: 'paragraph',
        text: 'Причастный оборот (proposition participiale) заменяет придаточное предложение, делая текст более компактным и литературным. Используется с причастием настоящего (-ant) или прошедшего времени. Особенно характерен для письменного французского уровня B2–C1.',
      },
      {
        type: 'table',
        title: 'Типы причастных оборотов',
        headers: ['Тип', 'Структура', 'Значение', 'Пример'],
        rows: [
          ['Причастие настоящего (одновременность)', 'sujet + participe présent', 'одновременное действие', 'Ayant faim, il a mangé rapidement.'],
          ['Причастие прошедшего (предшествование)', 'sujet + participe passé', 'предшествующее действие', 'La réunion terminée, ils sont partis.'],
          ['Абсолютная конструкция (разные подлежащие)', 'sujet propre + participe', 'условие, причина, время', 'Le soleil étant couché, nous sommes rentrés.'],
          ['Participe passé пассивный', 'participe passé seul', 'качество / состояние', 'Épuisé par le voyage, il s\'est endormi.'],
        ],
      },
      {
        type: 'rule_list',
        title: 'Правила и особенности:',
        rules: [
          'Простой причастный оборот: подлежащее = подлежащее главного предложения. Épuisé, il s\'est couché. (Он, измученный, лёг спать.)',
          'Абсолютная конструкция: у причастия своё подлежащее, отличное от главного. Le train parti, les quais se sont vidés. (Когда поезд ушёл, перроны опустели.)',
          'Ayant + participe passé = предшествующее действие: Ayant fini son travail, elle est sortie. (Закончив работу, она вышла.)',
          'Étant + participe/adjectif: Étant malade, il n\'a pas pu venir. (Будучи болен, он не смог прийти.)',
          'В письменном французском причастный оборот заменяет: причинные, временные, уступительные придаточные.',
        ],
      },
      {
        type: 'example_list',
        title: 'Примеры',
        items: [
          { fr: 'Ayant fini ses devoirs, Marie est allée se promener.', ru: 'Закончив домашнее задание, Мари пошла на прогулку.', en: 'Having finished her homework, Marie went for a walk.' },
          { fr: 'La réunion terminée, tout le monde a quitté la salle.', ru: 'Когда собрание закончилось, все покинули зал.', en: 'The meeting over, everyone left the room.' },
          { fr: 'Le soleil se couchant, les couleurs du ciel changeaient.', ru: 'Когда солнце садилось, цвета неба менялись.', en: 'The sun setting, the colours of the sky were changing.' },
          { fr: 'Épuisé par la marche, il s\'est assis sur un banc.', ru: 'Измученный ходьбой, он сел на скамейку.', en: 'Exhausted by the walk, he sat down on a bench.' },
        ],
      },
    ],
    contentEn: [
      {
        type: 'paragraph',
        text: 'Participial clauses replace subordinate clauses, making the text more concise and literary. They use the present or past participle and are especially common in written French at B2–C1 level.',
      },
      {
        type: 'rule_list',
        title: 'Key rules:',
        rules: [
          'Simple participial clause: subject = main clause subject. Épuisé, il s\'est couché.',
          'Absolute construction: the participle has its OWN subject, different from the main clause. Le train parti, les quais se sont vidés.',
          'Ayant + past participle = prior action: Ayant fini son travail, elle est sortie.',
        ],
      },
      {
        type: 'example_list',
        title: 'Examples',
        items: [
          { fr: 'Ayant fini ses devoirs, Marie est allée se promener.', ru: 'Having finished her homework, Marie went for a walk.' },
          { fr: 'La réunion terminée, tout le monde a quitté la salle.', ru: 'The meeting over, everyone left the room.' },
        ],
      },
    ],
  },
];
