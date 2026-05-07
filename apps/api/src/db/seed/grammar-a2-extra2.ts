import type { GrammarTopic } from './grammar-a1.js';

export const grammarTopicsA2Extra2: GrammarTopic[] = [

  // ─────────────────────────────────────────────────────────────
  // 1. Les verbes modaux
  // ─────────────────────────────────────────────────────────────
  {
    slug: 'verbes-modaux',
    titleRu: 'Модальные глаголы (pouvoir, vouloir, devoir, falloir)',
    titleEn: 'Modal Verbs (pouvoir, vouloir, devoir, falloir)',
    titleFr: 'Les verbes modaux',
    category: 'verbes',
    orderNum: 17,
    content: [
      {
        type: 'paragraph',
        text: 'Модальные глаголы выражают способность, желание, обязанность или необходимость. Они всегда стоят перед инфинитивом другого глагола. Все четыре — неправильные.',
      },
      {
        type: 'table',
        title: 'Спряжение в présent de l\'indicatif',
        headers: ['Лицо', 'pouvoir (мочь)', 'vouloir (хотеть)', 'devoir (должен)', 'savoir (уметь)'],
        rows: [
          ['je', 'peux', 'veux', 'dois', 'sais'],
          ['tu', 'peux', 'veux', 'dois', 'sais'],
          ['il/elle', 'peut', 'veut', 'doit', 'sait'],
          ['nous', 'pouvons', 'voulons', 'devons', 'savons'],
          ['vous', 'pouvez', 'voulez', 'devez', 'savez'],
          ['ils/elles', 'peuvent', 'veulent', 'doivent', 'savent'],
        ],
      },
      {
        type: 'table',
        title: 'Il faut (falloir) — только безличная форма',
        headers: ['Форма', 'Значение', 'Пример'],
        rows: [
          ['il faut + inf.', 'нужно, необходимо', 'Il faut étudier. (Нужно учиться.)'],
          ['il ne faut pas + inf.', 'нельзя, не нужно', 'Il ne faut pas fumer ici.'],
          ['il faut que + subj.', 'нужно, чтобы (B1)', 'Il faut que tu viennes.'],
        ],
      },
      {
        type: 'rule_list',
        title: 'Значения и употребление:',
        rules: [
          'pouvoir = физическая возможность или разрешение: Je peux venir. / Tu peux partir maintenant.',
          'savoir = умение, приобретённый навык: Il sait nager. / Elle sait parler chinois.',
          'pouvoir vs savoir: Je peux conduire (есть машина). / Je sais conduire (умею водить).',
          'vouloir = желание: Je veux un café. / Nous voulons partir tôt.',
          'devoir = обязанность или вероятность: Tu dois finir ça. / Il doit être tard.',
          'il faut = необходимость (безлично): Il faut manger pour vivre.',
        ],
      },
      {
        type: 'example_list',
        title: 'Примеры',
        items: [
          { fr: 'Est-ce que je peux ouvrir la fenêtre?', ru: 'Можно открыть окно?', en: 'Can I open the window?' },
          { fr: 'Tu dois rendre ce livre avant vendredi.', ru: 'Ты должен вернуть эту книгу до пятницы.', en: 'You must return this book before Friday.' },
          { fr: 'Ils veulent visiter le Louvre demain.', ru: 'Они хотят посетить Лувр завтра.', en: 'They want to visit the Louvre tomorrow.' },
          { fr: 'Il faut réserver à l\'avance.', ru: 'Нужно бронировать заранее.', en: 'You need to book in advance.' },
          { fr: 'Elle sait jouer du piano depuis l\'âge de cinq ans.', ru: 'Она умеет играть на пианино с пяти лет.', en: 'She has known how to play the piano since the age of five.' },
        ],
      },
    ],
    contentEn: [
      {
        type: 'paragraph',
        text: 'Modal verbs express ability, desire, obligation, or necessity. They are always followed by an infinitive. All four are irregular.',
      },
      {
        type: 'rule_list',
        title: 'Meanings:',
        rules: [
          'pouvoir = physical ability or permission: Je peux venir.',
          'savoir = learned skill/knowledge: Elle sait parler chinois.',
          'pouvoir vs savoir: Je peux conduire (I have access to a car) vs Je sais conduire (I know how to drive).',
          'vouloir = wish/desire: Je veux un café.',
          'devoir = obligation or probability: Tu dois finir ça. / Il doit être tard.',
          'il faut = impersonal necessity: Il faut manger pour vivre.',
        ],
      },
      {
        type: 'example_list',
        title: 'Examples',
        items: [
          { fr: 'Est-ce que je peux ouvrir la fenêtre?', ru: 'Can I open the window?' },
          { fr: 'Tu dois rendre ce livre avant vendredi.', ru: 'You must return this book before Friday.' },
          { fr: 'Il faut réserver à l\'avance.', ru: 'You need to book in advance.' },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────
  // 2. Les connecteurs simples
  // ─────────────────────────────────────────────────────────────
  {
    slug: 'connecteurs-simples',
    titleRu: 'Простые коннекторы и союзы',
    titleEn: 'Basic Connectors and Conjunctions',
    titleFr: 'Les connecteurs simples',
    category: 'syntaxe',
    orderNum: 18,
    content: [
      {
        type: 'paragraph',
        text: 'Коннекторы связывают слова, предложения и части текста. На уровне A2 нужно уверенно использовать базовые союзы для выражения причины, следствия, противопоставления и добавления.',
      },
      {
        type: 'table',
        title: 'Базовые коннекторы по функции',
        headers: ['Функция', 'Коннектор', 'Пример'],
        rows: [
          ['Добавление', 'et, aussi, de plus, en plus', 'Il parle français et anglais.'],
          ['Противопоставление', 'mais, pourtant, cependant', 'C\'est cher, mais c\'est bon.'],
          ['Выбор / альтернатива', 'ou, ou bien', 'Tu veux du café ou du thé?'],
          ['Причина', 'parce que, car, puisque, comme', 'Je reste parce qu\'il pleut.'],
          ['Следствие', 'donc, alors, c\'est pourquoi, du coup', 'Il était fatigué, donc il a dormi.'],
          ['Время', 'quand, lorsque, avant de, après', 'Appelle-moi quand tu arrives.'],
          ['Цель', 'pour + infinitif, pour que', 'Il travaille pour gagner de l\'argent.'],
          ['Уступка (A2)', 'même si, malgré', 'Même s\'il pleut, on sort.'],
        ],
      },
      {
        type: 'rule_list',
        title: 'Тонкости:',
        rules: [
          'Parce que отвечает на вопрос «почему?»: Pourquoi tu es triste? — Parce que je suis fatigué.',
          'Car — более книжный вариант parce que, не в начале предложения.',
          'Puisque — «раз уж, поскольку» (причина известна собеседнику): Puisque tu es là, aide-moi.',
          'Comme (причина) ставится в начале: Comme il faisait beau, nous avons fait un pique-nique.',
          'Donc vs alors: donc — логический вывод; alors — последовательность или разговорный вариант donc.',
          'Du coup — разговорный эквивалент donc: Il était absent, du coup on a annulé.',
        ],
      },
      {
        type: 'example_list',
        title: 'Примеры',
        items: [
          { fr: 'Elle aime la France, donc elle étudie le français.', ru: 'Она любит Францию, поэтому учит французский.', en: 'She loves France, so she is learning French.' },
          { fr: 'Comme il était en retard, la réunion a commencé sans lui.', ru: 'Поскольку он опоздал, собрание началось без него.', en: 'As he was late, the meeting started without him.' },
          { fr: 'Je ne veux pas sortir parce que je suis fatigué.', ru: 'Я не хочу выходить, потому что я устал.', en: 'I don\'t want to go out because I am tired.' },
          { fr: 'C\'est cher, mais la qualité est excellente.', ru: 'Это дорого, но качество превосходное.', en: 'It is expensive, but the quality is excellent.' },
        ],
      },
    ],
    contentEn: [
      {
        type: 'paragraph',
        text: 'Connectors link words, clauses, and sentences. At A2 level, master the basic ones for cause, consequence, contrast, and addition.',
      },
      {
        type: 'table',
        title: 'Basic connectors by function',
        headers: ['Function', 'Connectors'],
        rows: [
          ['Addition', 'et, aussi, de plus'],
          ['Contrast', 'mais, pourtant, cependant'],
          ['Cause', 'parce que, car, puisque, comme'],
          ['Consequence', 'donc, alors, c\'est pourquoi, du coup'],
          ['Purpose', 'pour + infinitif'],
        ],
      },
      {
        type: 'example_list',
        title: 'Examples',
        items: [
          { fr: 'Elle aime la France, donc elle étudie le français.', ru: 'She loves France, so she is learning French.' },
          { fr: 'Je ne veux pas sortir parce que je suis fatigué.', ru: 'I don\'t want to go out because I am tired.' },
        ],
      },
    ],
  },
];
