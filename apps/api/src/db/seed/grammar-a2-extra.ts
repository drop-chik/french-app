import type { GrammarTopic } from './grammar-a1.js';

export const grammarTopicsA2Extra: GrammarTopic[] = [
  {
    slug: 'imparfait-vs-passe-compose',
    titleRu: 'Imparfait vs Passé composé: когда что',
    titleEn: 'Imparfait vs Passé composé: When to Use Each',
    titleFr: 'Imparfait vs Passé composé',
    category: 'temps',
    orderNum: 11,
    content: [
      {
        type: 'paragraph',
        text: 'Различение imparfait и passé composé — ключевой навык уровня A2. Оба времени описывают прошлое, но выполняют разные функции в рассказе.',
      },
      {
        type: 'table',
        title: 'Сравнение двух времён',
        headers: ['', 'Passé composé', 'Imparfait'],
        rows: [
          ['Функция', 'Завершённые действия, события', 'Фон, описание, привычки'],
          ['Вопрос', 'Что случилось?', 'Какой была ситуация?'],
          ['Длительность', 'Ограниченная, однократная', 'Незаконченная, повторяющаяся'],
          ['Маркеры', 'hier, soudain, une fois, d\'abord', 'toujours, souvent, quand j\'étais...'],
          ['Пример', 'Il a appelé. (Он позвонил.)', 'Il faisait chaud. (Было жарко.)'],
        ],
      },
      {
        type: 'rule_list',
        title: 'Правила:',
        rules: [
          'Фон (imparfait) + событие (passé composé): Il dormait quand le téléphone a sonné.',
          'Привычка в прошлом → imparfait: Quand j\'étais enfant, je jouais au foot tous les jours.',
          'Последовательность завершённых событий → passé composé: Je suis entré, j\'ai vu Marie et je lui ai parlé.',
          'Описание состояния, погоды, чувств → imparfait: Il faisait beau, j\'étais content.',
          'Прерывание одного действия другим: Je lisais (imparfait) quand il est arrivé (passé composé).',
        ],
      },
      {
        type: 'example_list',
        title: 'Примеры в контексте',
        items: [
          { fr: 'Hier, il pleuvait quand je suis sorti.', ru: 'Вчера шёл дождь, когда я вышел.', en: 'Yesterday it was raining when I went out.' },
          { fr: 'Avant, je mangeais toujours au restaurant.', ru: 'Раньше я всегда ел в ресторане.', en: 'Before, I always used to eat at restaurants.' },
          { fr: 'Soudain, elle a crié.', ru: 'Вдруг она закричала.', en: 'Suddenly, she screamed.' },
          { fr: 'Je regardais la télé quand mon ami a appelé.', ru: 'Я смотрел телевизор, когда позвонил друг.', en: 'I was watching TV when my friend called.' },
        ],
      },
    ],
    contentEn: [
      {
        type: 'paragraph',
        text: 'Distinguishing between the imparfait and the passé composé is a key A2 skill. Both tenses describe the past but serve different narrative functions.',
      },
      {
        type: 'table',
        title: 'Comparison of the two tenses',
        headers: ['', 'Passé composé', 'Imparfait'],
        rows: [
          ['Function', 'Completed actions, events', 'Background, description, habits'],
          ['Question', 'What happened?', 'What was the situation like?'],
          ['Duration', 'Limited, one-time', 'Ongoing, repeated'],
          ['Markers', 'hier, soudain, une fois, d\'abord', 'toujours, souvent, quand j\'étais...'],
          ['Example', 'Il a appelé. (He called.)', 'Il faisait chaud. (It was hot.)'],
        ],
      },
      {
        type: 'rule_list',
        title: 'Rules:',
        rules: [
          'Background (imparfait) + event (passé composé): Il dormait quand le téléphone a sonné.',
          'Past habit → imparfait: Quand j\'étais enfant, je jouais au foot tous les jours.',
          'Sequence of completed events → passé composé: Je suis entré, j\'ai vu Marie et je lui ai parlé.',
          'Describing a state, weather, feelings → imparfait: Il faisait beau, j\'étais content.',
          'One action interrupted by another: Je lisais (imparfait) quand il est arrivé (passé composé).',
        ],
      },
      {
        type: 'example_list',
        title: 'Examples in context',
        items: [
          { fr: 'Hier, il pleuvait quand je suis sorti.', ru: 'Вчера шёл дождь, когда я вышел.', en: 'Yesterday it was raining when I went out.' },
          { fr: 'Avant, je mangeais toujours au restaurant.', ru: 'Раньше я всегда ел в ресторане.', en: 'Before, I always used to eat at restaurants.' },
          { fr: 'Soudain, elle a crié.', ru: 'Вдруг она закричала.', en: 'Suddenly, she screamed.' },
          { fr: 'Je regardais la télé quand mon ami a appelé.', ru: 'Я смотрел телевизор, когда позвонил друг.', en: 'I was watching TV when my friend called.' },
        ],
      },
    ],
  },

  {
    slug: 'pronoms-y-en',
    titleRu: 'Местоимения y и en',
    titleEn: 'Pronouns y and en',
    titleFr: 'Les pronoms y et en',
    category: 'pronoms',
    orderNum: 12,
    content: [
      {
        type: 'paragraph',
        text: 'Местоимения y и en заменяют группы слов с предлогами à/en и de соответственно. Они очень частотны в разговорном французском и делают речь естественной.',
      },
      {
        type: 'table',
        title: 'Y vs En',
        headers: ['Местоимение', 'Заменяет', 'Позиция', 'Пример'],
        rows: [
          ['y', 'à/en/dans + место', 'перед глаголом', 'Je vais à Paris → J\'y vais.'],
          ['y', 'à + неодушевлённое', 'перед глаголом', 'Il pense à ce problème → Il y pense.'],
          ['en', 'de + место', 'перед глаголом', 'Je viens de France → J\'en viens.'],
          ['en', 'du/de la/des + сущ.', 'перед глаголом', 'Tu veux du café ? → Oui, j\'en veux.'],
          ['en', 'числительное + сущ.', 'перед глаголом', 'J\'ai deux chats → J\'en ai deux.'],
        ],
      },
      {
        type: 'rule_list',
        title: 'Порядок в предложении:',
        rules: [
          'Утверждение: J\'y vais. / J\'en mange.',
          'Отрицание: Je n\'y vais pas. / Je n\'en mange pas.',
          'Повелительное (утв.): Vas-y ! / Manges-en ! (добавляется -s для благозвучия)',
          'Повелительное (отриц.): N\'y va pas ! / N\'en mange pas !',
          'y и en стоят ПОСЛЕ других местоимений: Je lui en parle. (Я говорю ему об этом.)',
          'y и en не заменяют людей: Je pense à Marie → Je pense à elle. (НЕ: *J\'y pense)',
        ],
      },
      {
        type: 'example_list',
        title: 'Примеры',
        items: [
          { fr: 'Tu vas au gymnase ? — Oui, j\'y vais tous les jours.', ru: 'Ты ходишь в спортзал? — Да, я хожу туда каждый день.', en: 'Do you go to the gym? — Yes, I go there every day.' },
          { fr: 'Tu veux de la tarte ? — Oui, j\'en veux bien.', ru: 'Хочешь пирога? — Да, с удовольствием.', en: 'Do you want some pie? — Yes, I\'d love some.' },
          { fr: 'Il a des frères ? — Il en a trois.', ru: 'У него есть братья? — У него их трое.', en: 'Does he have brothers? — He has three of them.' },
          { fr: 'Elle pense à ses vacances. Elle y pense souvent.', ru: 'Она думает об отпуске. Она часто об этом думает.', en: 'She thinks about her holidays. She thinks about it often.' },
        ],
      },
    ],
    contentEn: [
      {
        type: 'paragraph',
        text: 'The pronouns y and en replace noun phrases introduced by à/en and de respectively. They are very frequent in spoken French and make speech sound natural.',
      },
      {
        type: 'table',
        title: 'Y vs En',
        headers: ['Pronoun', 'Replaces', 'Position', 'Example'],
        rows: [
          ['y', 'à/en/dans + place', 'before the verb', 'Je vais à Paris → J\'y vais.'],
          ['y', 'à + inanimate noun', 'before the verb', 'Il pense à ce problème → Il y pense.'],
          ['en', 'de + place', 'before the verb', 'Je viens de France → J\'en viens.'],
          ['en', 'du/de la/des + noun', 'before the verb', 'Tu veux du café? → Oui, j\'en veux.'],
          ['en', 'number + noun', 'before the verb', 'J\'ai deux chats → J\'en ai deux.'],
        ],
      },
      {
        type: 'rule_list',
        title: 'Word order:',
        rules: [
          'Affirmative: J\'y vais. / J\'en mange.',
          'Negative: Je n\'y vais pas. / Je n\'en mange pas.',
          'Imperative (affirmative): Vas-y! / Manges-en! (add -s for euphony)',
          'Imperative (negative): N\'y va pas! / N\'en mange pas!',
          'y and en come AFTER other object pronouns: Je lui en parle.',
          'y and en do NOT replace people: Je pense à Marie → Je pense à elle. (NOT: *J\'y pense)',
        ],
      },
      {
        type: 'example_list',
        title: 'Examples',
        items: [
          { fr: 'Tu vas au gymnase ? — Oui, j\'y vais tous les jours.', ru: 'Ты ходишь в спортзал? — Да, я хожу туда каждый день.', en: 'Do you go to the gym? — Yes, I go there every day.' },
          { fr: 'Tu veux de la tarte ? — Oui, j\'en veux bien.', ru: 'Хочешь пирога? — Да, с удовольствием.', en: 'Do you want some pie? — Yes, I\'d love some.' },
          { fr: 'Il a des frères ? — Il en a trois.', ru: 'У него есть братья? — У него их трое.', en: 'Does he have brothers? — He has three of them.' },
          { fr: 'Elle pense à ses vacances. Elle y pense souvent.', ru: 'Она думает об отпуске. Она часто об этом думает.', en: 'She thinks about her holidays. She thinks about it often.' },
        ],
      },
    ],
  },

  {
    slug: 'conditionnel-present',
    titleRu: 'Conditionnel présent (условное наклонение)',
    titleEn: 'The Present Conditional',
    titleFr: 'Le conditionnel présent',
    category: 'verbes',
    orderNum: 13,
    content: [
      {
        type: 'paragraph',
        text: 'Conditionnel présent — вежливая форма, гипотезы и нереальные условия. Образуется: основа futur simple + окончания imparfait.',
      },
      {
        type: 'table',
        title: 'Образование и окончания',
        headers: ['Лицо', 'Окончание', 'vouloir (voudр-)', 'pouvoir (pourр-)', 'être (ser-)', 'avoir (aur-)'],
        rows: [
          ['je', '-ais', 'voudrais', 'pourrais', 'serais', 'aurais'],
          ['tu', '-ais', 'voudrais', 'pourrais', 'serais', 'aurais'],
          ['il / elle', '-ait', 'voudrait', 'pourrait', 'serait', 'aurait'],
          ['nous', '-ions', 'voudrions', 'pourrions', 'serions', 'aurions'],
          ['vous', '-iez', 'voudriez', 'pourriez', 'seriez', 'auriez'],
          ['ils / elles', '-aient', 'voudraient', 'pourraient', 'seraient', 'auraient'],
        ],
      },
      {
        type: 'rule_list',
        title: 'Когда используется:',
        rules: [
          'Вежливая просьба: Je voudrais un café, s\'il vous plaît. (Я бы хотел кофе, пожалуйста.)',
          'Совет: Tu devrais consulter un médecin. (Тебе следует обратиться к врачу.)',
          'Гипотеза (si + imparfait → conditionnel): Si j\'avais le temps, je voyagerais. (Если бы у меня было время, я бы путешествовал.)',
          'Сомнение, предположение: Il serait malade. (Говорят, он болен.)',
          'Нереальное условие в настоящем: Si j\'étais riche, j\'achèterais une villa.',
        ],
      },
      {
        type: 'example_list',
        title: 'Примеры',
        items: [
          { fr: 'Pourriez-vous m\'aider, s\'il vous plaît ?', ru: 'Не могли бы вы мне помочь, пожалуйста?', en: 'Could you help me, please?' },
          { fr: 'Je voudrais réserver une table pour deux.', ru: 'Я бы хотел забронировать столик на двоих.', en: 'I would like to book a table for two.' },
          { fr: 'Si elle étudiait plus, elle réussirait.', ru: 'Если бы она больше занималась, она бы сдала.', en: 'If she studied more, she would succeed.' },
          { fr: 'Tu devrais appeler ta mère.', ru: 'Тебе следует позвонить маме.', en: 'You should call your mother.' },
        ],
      },
    ],
    contentEn: [
      {
        type: 'paragraph',
        text: 'The present conditional is used for polite requests, hypotheses, and unreal conditions. It is formed using the futur simple stem + imparfait endings.',
      },
      {
        type: 'table',
        title: 'Formation and endings',
        headers: ['Person', 'Ending', 'vouloir (voudр-)', 'pouvoir (pourр-)', 'être (ser-)', 'avoir (aur-)'],
        rows: [
          ['je', '-ais', 'voudrais', 'pourrais', 'serais', 'aurais'],
          ['tu', '-ais', 'voudrais', 'pourrais', 'serais', 'aurais'],
          ['il / elle', '-ait', 'voudrait', 'pourrait', 'serait', 'aurait'],
          ['nous', '-ions', 'voudrions', 'pourrions', 'serions', 'aurions'],
          ['vous', '-iez', 'voudriez', 'pourriez', 'seriez', 'auriez'],
          ['ils / elles', '-aient', 'voudraient', 'pourraient', 'seraient', 'auraient'],
        ],
      },
      {
        type: 'rule_list',
        title: 'When to use it:',
        rules: [
          'Polite request: Je voudrais un café, s\'il vous plaît. (I would like a coffee, please.)',
          'Advice: Tu devrais consulter un médecin. (You should see a doctor.)',
          'Hypothesis (si + imparfait → conditionnel): Si j\'avais le temps, je voyagerais.',
          'Doubt, supposition: Il serait malade. (He is said to be ill.)',
          'Unreal present condition: Si j\'étais riche, j\'achèterais une villa.',
        ],
      },
      {
        type: 'example_list',
        title: 'Examples',
        items: [
          { fr: 'Pourriez-vous m\'aider, s\'il vous plaît ?', ru: 'Не могли бы вы мне помочь, пожалуйста?', en: 'Could you help me, please?' },
          { fr: 'Je voudrais réserver une table pour deux.', ru: 'Я бы хотел забронировать столик на двоих.', en: 'I would like to book a table for two.' },
          { fr: 'Si elle étudiait plus, elle réussirait.', ru: 'Если бы она больше занималась, она бы сдала.', en: 'If she studied more, she would succeed.' },
          { fr: 'Tu devrais appeler ta mère.', ru: 'Тебе следует позвонить маме.', en: 'You should call your mother.' },
        ],
      },
    ],
  },

  {
    slug: 'adverbes-formation',
    titleRu: 'Образование наречий на -ment',
    titleEn: 'Forming Adverbs with -ment',
    titleFr: 'La formation des adverbes en -ment',
    category: 'syntaxe',
    orderNum: 14,
    content: [
      {
        type: 'paragraph',
        text: 'Большинство французских наречий образуется от прилагательного женского рода с добавлением суффикса -ment. Аналог русских наречий на -о/-е и английских на -ly.',
      },
      {
        type: 'table',
        title: 'Правило образования',
        headers: ['Прилагательное (м.р.)', 'Прилагательное (ж.р.)', 'Наречие', 'Перевод'],
        rows: [
          ['lent', 'lente', 'lentement', 'медленно'],
          ['rapide', 'rapide', 'rapidement', 'быстро'],
          ['heureux', 'heureuse', 'heureusement', 'к счастью / счастливо'],
          ['doux', 'douce', 'doucement', 'тихо / нежно'],
          ['sérieux', 'sérieuse', 'sérieusement', 'серьёзно'],
          ['facile', 'facile', 'facilement', 'легко'],
          ['simple', 'simple', 'simplement', 'просто'],
          ['difficile', 'difficile', 'difficilement', 'с трудом'],
        ],
      },
      {
        type: 'rule_list',
        title: 'Исключения и особые случаи:',
        rules: [
          'Прилагательные на -ant/-ent → -amment/-emment: constant → constamment, évident → évidemment.',
          'Нерегулярные наречия: bon → bien (хорошо), mauvais → mal (плохо), vite (быстро — от устар. прил.).',
          'Позиция: наречие стоит ПОСЛЕ глагола: Elle parle lentement.',
          'Перед прилагательным/наречием для усиления: très rapidement, vraiment bien.',
          'В сложных временах: короткие наречия (bien, mal, vite) стоят между auxiliaire и participe: Il a bien travaillé.',
        ],
      },
      {
        type: 'example_list',
        title: 'Примеры',
        items: [
          { fr: 'Il parle très lentement, je comprends tout.', ru: 'Он говорит очень медленно, я всё понимаю.', en: 'He speaks very slowly, I understand everything.' },
          { fr: 'Heureusement, il n\'a pas plu.', ru: 'К счастью, не было дождя.', en: 'Fortunately, it didn\'t rain.' },
          { fr: 'Elle a répondu poliment.', ru: 'Она ответила вежливо.', en: 'She answered politely.' },
          { fr: 'Il travaille sérieusement.', ru: 'Он работает серьёзно.', en: 'He works seriously.' },
        ],
      },
    ],
    contentEn: [
      {
        type: 'paragraph',
        text: 'Most French adverbs are formed from the feminine adjective by adding the suffix -ment. They are the equivalent of English adverbs ending in -ly.',
      },
      {
        type: 'table',
        title: 'Formation rule',
        headers: ['Adjective (m.)', 'Adjective (f.)', 'Adverb', 'Meaning'],
        rows: [
          ['lent', 'lente', 'lentement', 'slowly'],
          ['rapide', 'rapide', 'rapidement', 'quickly'],
          ['heureux', 'heureuse', 'heureusement', 'fortunately / happily'],
          ['doux', 'douce', 'doucement', 'gently / quietly'],
          ['sérieux', 'sérieuse', 'sérieusement', 'seriously'],
          ['facile', 'facile', 'facilement', 'easily'],
          ['simple', 'simple', 'simplement', 'simply'],
          ['difficile', 'difficile', 'difficilement', 'with difficulty'],
        ],
      },
      {
        type: 'rule_list',
        title: 'Exceptions and special cases:',
        rules: [
          'Adjectives ending in -ant/-ent → -amment/-emment: constant → constamment, évident → évidemment.',
          'Irregular adverbs: bon → bien (well), mauvais → mal (badly), vite (quickly).',
          'Position: the adverb comes AFTER the verb: Elle parle lentement.',
          'Before adjectives/adverbs for emphasis: très rapidement, vraiment bien.',
          'In compound tenses: short adverbs (bien, mal, vite) go between auxiliary and participle: Il a bien travaillé.',
        ],
      },
      {
        type: 'example_list',
        title: 'Examples',
        items: [
          { fr: 'Il parle très lentement, je comprends tout.', ru: 'Он говорит очень медленно, я всё понимаю.', en: 'He speaks very slowly, I understand everything.' },
          { fr: 'Heureusement, il n\'a pas plu.', ru: 'К счастью, не было дождя.', en: 'Fortunately, it didn\'t rain.' },
          { fr: 'Elle a répondu poliment.', ru: 'Она ответила вежливо.', en: 'She answered politely.' },
          { fr: 'Il travaille sérieusement.', ru: 'Он работает серьёзно.', en: 'He works seriously.' },
        ],
      },
    ],
  },

  {
    slug: 'passe-recent',
    titleRu: 'Passé récent: venir de + инфинитив',
    titleEn: 'Passé récent: venir de + Infinitive',
    titleFr: 'Le passé récent: venir de + infinitif',
    category: 'temps',
    orderNum: 15,
    content: [
      {
        type: 'paragraph',
        text: 'Passé récent выражает действие, которое только что завершилось. Образуется: venir (настоящее время) + de + инфинитив. Вместе с futur proche и настоящим временем образует «трио» для описания связанных действий.',
      },
      {
        type: 'table',
        title: 'Спряжение: venir de + инфинитив',
        headers: ['Лицо', 'venir de', 'Пример'],
        rows: [
          ['je', 'viens de', 'Je viens de manger. — Я только что поел.'],
          ['tu', 'viens de', 'Tu viens de finir. — Ты только что закончил.'],
          ['il / elle', 'vient de', 'Il vient d\'arriver. — Он только что приехал.'],
          ['nous', 'venons de', 'Nous venons de décider. — Мы только что решили.'],
          ['vous', 'venez de', 'Vous venez d\'appeler. — Вы только что позвонили.'],
          ['ils / elles', 'viennent de', 'Elles viennent de partir. — Они только что ушли.'],
        ],
      },
      {
        type: 'rule_list',
        title: 'Трио времён:',
        rules: [
          'Passé récent (только что): Je viens de manger. (Я только что поел.)',
          'Présent (сейчас): Je mange. (Я ем.)',
          'Futur proche (скоро): Je vais manger. (Я собираюсь поесть.)',
          'Перед гласной de → d\': Il vient d\'arriver. / Elle vient d\'écrire.',
          'Отрицание: Je ne viens pas de finir. (окружает venir)',
          'Также в imparfait для «только что в прошлом»: Il venait de partir quand tu as appelé.',
        ],
      },
      {
        type: 'example_list',
        title: 'Примеры',
        items: [
          { fr: 'Je viens de voir ce film — c\'est excellent !', ru: 'Я только что посмотрел этот фильм — это превосходно!', en: 'I have just watched this film — it\'s excellent!' },
          { fr: 'Elle vient de terminer ses études.', ru: 'Она только что окончила учёбу.', en: 'She has just finished her studies.' },
          { fr: 'Nous venons d\'apprendre la nouvelle.', ru: 'Мы только что узнали новость.', en: 'We have just heard the news.' },
          { fr: 'Il venait de sortir quand il a commencé à pleuvoir.', ru: 'Он только что вышел, когда начался дождь.', en: 'He had just gone out when it started raining.' },
        ],
      },
    ],
    contentEn: [
      {
        type: 'paragraph',
        text: 'The passé récent expresses an action that has just been completed. It is formed with: venir (present tense) + de + infinitive. Together with the futur proche and the present tense, it forms a "trio" for describing related actions.',
      },
      {
        type: 'table',
        title: 'Conjugation: venir de + infinitive',
        headers: ['Person', 'venir de', 'Example'],
        rows: [
          ['je', 'viens de', 'Je viens de manger. — I have just eaten.'],
          ['tu', 'viens de', 'Tu viens de finir. — You have just finished.'],
          ['il / elle', 'vient de', 'Il vient d\'arriver. — He has just arrived.'],
          ['nous', 'venons de', 'Nous venons de décider. — We have just decided.'],
          ['vous', 'venez de', 'Vous venez d\'appeler. — You have just called.'],
          ['ils / elles', 'viennent de', 'Elles viennent de partir. — They have just left.'],
        ],
      },
      {
        type: 'rule_list',
        title: 'The tense trio:',
        rules: [
          'Passé récent (just happened): Je viens de manger. (I have just eaten.)',
          'Présent (now): Je mange. (I am eating.)',
          'Futur proche (about to): Je vais manger. (I am going to eat.)',
          'Before a vowel, de → d\': Il vient d\'arriver. / Elle vient d\'écrire.',
          'Negative: Je ne viens pas de finir. (ne...pas surrounds venir)',
          'Also used in imparfait for "had just" in the past: Il venait de partir quand tu as appelé.',
        ],
      },
      {
        type: 'example_list',
        title: 'Examples',
        items: [
          { fr: 'Je viens de voir ce film — c\'est excellent !', ru: 'Я только что посмотрел этот фильм — это превосходно!', en: 'I have just watched this film — it\'s excellent!' },
          { fr: 'Elle vient de terminer ses études.', ru: 'Она только что окончила учёбу.', en: 'She has just finished her studies.' },
          { fr: 'Nous venons d\'apprendre la nouvelle.', ru: 'Мы только что узнали новость.', en: 'We have just heard the news.' },
          { fr: 'Il venait de sortir quand il a commencé à pleuvoir.', ru: 'Он только что вышел, когда начался дождь.', en: 'He had just gone out when it started raining.' },
        ],
      },
    ],
  },

  {
    slug: 'questions-indirectes',
    titleRu: 'Косвенные вопросы',
    titleEn: 'Indirect Questions',
    titleFr: 'Les questions indirectes',
    category: 'syntaxe',
    orderNum: 16,
    content: [
      {
        type: 'paragraph',
        text: 'Косвенный вопрос — это вопрос, встроенный в другое предложение после глаголов demander (спрашивать), savoir (знать), se demander (задаваться вопросом) и других. В отличие от прямого вопроса, здесь нет инверсии и вопросительного знака.',
      },
      {
        type: 'table',
        title: 'Прямой вопрос → Косвенный вопрос',
        headers: ['Прямой вопрос', 'Косвенный вопрос', 'Изменения'],
        rows: [
          ['Où habites-tu ?', 'Je ne sais pas où tu habites.', 'où остаётся, инверсия → прямой порядок'],
          ['Quand est-ce qu\'il part ?', 'Je me demande quand il part.', 'est-ce que убирается'],
          ['Est-ce qu\'il est là ?', 'Je veux savoir s\'il est là.', 'est-ce que → si (ли)'],
          ['Qu\'est-ce qu\'elle fait ?', 'Je sais ce qu\'elle fait.', 'qu\'est-ce que → ce que'],
          ['Qui est-ce qui vient ?', 'Je me demande qui vient.', 'qui est-ce qui → qui'],
        ],
      },
      {
        type: 'rule_list',
        title: 'Правила:',
        rules: [
          'Порядок слов: ПРЯМОЙ (нет инверсии): Je sais où elle habite. (НЕ: *où habite-elle)',
          'est-ce que → исчезает: Quand est-ce qu\'il vient ? → Je sais quand il vient.',
          'Для да/нет вопросов: est-ce que → si: Est-ce qu\'il vient ? → Je me demande s\'il vient.',
          'Qu\'est-ce que → ce que: Je ne sais pas ce qu\'elle veut.',
          'Qu\'est-ce qui → ce qui: Je me demande ce qui se passe. (что происходит)',
          'Нет вопросительного знака в конце косвенного вопроса.',
        ],
      },
      {
        type: 'example_list',
        title: 'Примеры',
        items: [
          { fr: 'Je ne sais pas où il est allé.', ru: 'Я не знаю, куда он пошёл.', en: 'I don\'t know where he went.' },
          { fr: 'Dis-moi si tu viens à la fête.', ru: 'Скажи мне, придёшь ли ты на вечеринку.', en: 'Tell me if you\'re coming to the party.' },
          { fr: 'Elle se demande ce que tu penses.', ru: 'Она задаётся вопросом, что ты думаешь.', en: 'She wonders what you think.' },
          { fr: 'Je voudrais savoir quand le train arrive.', ru: 'Я бы хотел знать, когда прибывает поезд.', en: 'I would like to know when the train arrives.' },
        ],
      },
    ],
    contentEn: [
      {
        type: 'paragraph',
        text: 'An indirect question is a question embedded inside another sentence, after verbs like demander (to ask), savoir (to know), or se demander (to wonder). Unlike direct questions, there is no inversion and no question mark.',
      },
      {
        type: 'table',
        title: 'Direct question → Indirect question',
        headers: ['Direct question', 'Indirect question', 'Changes'],
        rows: [
          ['Où habites-tu ?', 'Je ne sais pas où tu habites.', 'où stays, inversion → normal order'],
          ['Quand est-ce qu\'il part ?', 'Je me demande quand il part.', 'est-ce que is removed'],
          ['Est-ce qu\'il est là ?', 'Je veux savoir s\'il est là.', 'est-ce que → si (whether)'],
          ['Qu\'est-ce qu\'elle fait ?', 'Je sais ce qu\'elle fait.', 'qu\'est-ce que → ce que'],
          ['Qui est-ce qui vient ?', 'Je me demande qui vient.', 'qui est-ce qui → qui'],
        ],
      },
      {
        type: 'rule_list',
        title: 'Rules:',
        rules: [
          'Word order: NORMAL (no inversion): Je sais où elle habite. (NOT: *où habite-elle)',
          'est-ce que → disappears: Quand est-ce qu\'il vient? → Je sais quand il vient.',
          'For yes/no questions: est-ce que → si: Est-ce qu\'il vient? → Je me demande s\'il vient.',
          'Qu\'est-ce que → ce que: Je ne sais pas ce qu\'elle veut.',
          'Qu\'est-ce qui → ce qui: Je me demande ce qui se passe.',
          'No question mark at the end of an indirect question.',
        ],
      },
      {
        type: 'example_list',
        title: 'Examples',
        items: [
          { fr: 'Je ne sais pas où il est allé.', ru: 'Я не знаю, куда он пошёл.', en: 'I don\'t know where he went.' },
          { fr: 'Dis-moi si tu viens à la fête.', ru: 'Скажи мне, придёшь ли ты на вечеринку.', en: 'Tell me if you\'re coming to the party.' },
          { fr: 'Elle se demande ce que tu penses.', ru: 'Она задаётся вопросом, что ты думаешь.', en: 'She wonders what you think.' },
          { fr: 'Je voudrais savoir quand le train arrive.', ru: 'Я бы хотел знать, когда прибывает поезд.', en: 'I would like to know when the train arrives.' },
        ],
      },
    ],
  },
];
