import type { GrammarTopic } from './grammar-a1.js';

export const grammarTopicsB2Extra2: GrammarTopic[] = [

  // ─────────────────────────────────────────────────────────────
  // 1. La construction causative (faire + infinitif)
  // ─────────────────────────────────────────────────────────────
  {
    slug: 'faire-causatif',
    titleRu: 'Каузативная конструкция (faire + инфинитив)',
    titleEn: 'Causative Construction (faire + infinitive)',
    titleFr: 'La construction causative (faire + infinitif)',
    category: 'syntaxe',
    orderNum: 15,
    content: [
      {
        type: 'paragraph',
        text: 'Каузативная конструкция faire + infinitif выражает то, что подлежащее не выполняет действие само, а заставляет или позволяет кому-то другому сделать это. Аналоги: laisser + inf (позволять), envoyer + inf (посылать).',
      },
      {
        type: 'table',
        title: 'Структура каузативной конструкции',
        headers: ['Структура', 'Значение', 'Пример'],
        rows: [
          ['faire + inf (без дополнения)', 'заставить что-то произойти', 'Cette nouvelle m\'a fait pleurer.'],
          ['faire + inf + COD', 'заставить кого-то сделать что-то', 'Il fait travailler ses élèves.'],
          ['faire + inf + à qqn', 'заставить кого-то (косв. доп.)', 'Elle fait chanter les enfants.'],
          ['faire + inf + par qqn', 'заставить кого-то (исполнитель)', 'Il fait réparer la voiture par un mécanicien.'],
          ['se faire + inf', 'заставить себя / подвергнуться', 'Elle s\'est fait couper les cheveux.'],
          ['laisser + inf', 'позволить, дать возможность', 'Il laisse ses enfants jouer dehors.'],
        ],
      },
      {
        type: 'rule_list',
        title: 'Правила:',
        rules: [
          'Инфинитив после faire всегда стоит непосредственно за ним, без разделения: Je fais réparer ma voiture. (НЕ: Je fais ma voiture réparer.)',
          'Местоимения ставятся перед faire: Je la fais chanter. / Il le fait travailler.',
          'Se faire + inf: действие направлено на подлежащее (часто пассивный смысл): Il s\'est fait voler son portefeuille. (У него украли кошелёк.)',
          'Participe passé fait в конструкции se faire + inf не согласуется: Elle s\'est fait couper les cheveux. (не coupés)',
          'Faire faire = заказывать: Je fais faire une robe chez le couturier. (Я заказываю платье у портного.)',
        ],
      },
      {
        type: 'example_list',
        title: 'Примеры',
        items: [
          { fr: 'Le professeur fait lire les étudiants à voix haute.', ru: 'Преподаватель заставляет студентов читать вслух.', en: 'The teacher makes the students read aloud.' },
          { fr: 'Elle a fait repeindre son appartement.', ru: 'Она заказала покраску своей квартиры (наняла маляров).', en: 'She had her apartment repainted.' },
          { fr: 'Il s\'est fait licencier à cause de ses retards.', ru: 'Его уволили из-за опозданий.', en: 'He got himself fired because of his lateness.' },
          { fr: 'Cette musique me fait penser à mon enfance.', ru: 'Эта музыка напоминает мне о детстве.', en: 'This music makes me think of my childhood.' },
          { fr: 'Laisse-moi finir, s\'il te plaît.', ru: 'Позволь мне закончить, пожалуйста.', en: 'Let me finish, please.' },
        ],
      },
    ],
    contentEn: [
      {
        type: 'paragraph',
        text: 'The causative construction faire + infinitive means the subject causes or has someone else perform the action. Related: laisser + inf (let/allow), envoyer + inf (send to do).',
      },
      {
        type: 'rule_list',
        title: 'Key rules:',
        rules: [
          'The infinitive follows faire immediately: Je fais réparer ma voiture.',
          'Object pronouns go before faire: Je la fais chanter.',
          'Se faire + inf: passive-like meaning — Il s\'est fait voler son portefeuille. (He had his wallet stolen.)',
          'Faire faire = have something made/done: Je fais faire une robe. (I\'m having a dress made.)',
        ],
      },
      {
        type: 'example_list',
        title: 'Examples',
        items: [
          { fr: 'Elle a fait repeindre son appartement.', ru: 'She had her apartment repainted.' },
          { fr: 'Il s\'est fait licencier à cause de ses retards.', ru: 'He got himself fired because of his lateness.' },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────
  // 2. Les nuances du conditionnel
  // ─────────────────────────────────────────────────────────────
  {
    slug: 'nuances-conditionnel',
    titleRu: 'Оттенки условного наклонения',
    titleEn: 'Nuances of the Conditional',
    titleFr: 'Les nuances du conditionnel',
    category: 'temps',
    orderNum: 16,
    content: [
      {
        type: 'paragraph',
        text: 'На уровне B2 условное наклонение (conditionnel) используется не только для гипотез, но и для выражения непроверенных сведений в прессе, вежливых просьб, сожаления и советов.',
      },
      {
        type: 'table',
        title: 'Употребление conditionnel présent',
        headers: ['Значение', 'Структура / контекст', 'Пример'],
        rows: [
          ['Гипотеза (si тип 2)', 'si + imparfait → cond.', 'Si j\'avais le temps, je voyagerais.'],
          ['Журналистский conditionnel', 'слухи, непроверенные факты', 'Le président serait hospitalisé.'],
          ['Вежливая просьба', 'modal + infinitif', 'Pourriez-vous m\'aider?'],
          ['Совет / рекомендация', 'devoir au conditionnel', 'Tu devrais consulter un médecin.'],
          ['Сожаление / упрёк', 'cond. passé + mais', 'J\'aurais aimé venir, mais...'],
          ['Возможность / doute', 'pouvoir au conditionnel', 'Cela pourrait être vrai.'],
          ['Futur dans le passé', 'après verbe passé', 'Il a dit qu\'il viendrait.'],
        ],
      },
      {
        type: 'rule_list',
        title: 'Журналистский conditionnel — ключевое для B2:',
        rules: [
          'Conditionnel présent/passé без si для выражения непроверенной информации: Selon nos sources, il y aurait eu un accident. (По нашим источникам, произошла авария.)',
          'Часто с маркерами: selon, d\'après, il paraît que, aux dires de: D\'après le témoin, la voiture aurait brûlé un feu rouge.',
          'Conditionnel passé для действий, которые, возможно, уже произошли: Le suspect se serait enfui à l\'étranger.',
          'В официальных документах и прессе: Le gouvernement envisagerait de nouvelles réformes.',
        ],
      },
      {
        type: 'example_list',
        title: 'Примеры',
        items: [
          { fr: 'Selon les médias, le Premier ministre aurait démissionné.', ru: 'По данным СМИ, премьер-министр, предположительно, ушёл в отставку.', en: 'According to the media, the Prime Minister is reported to have resigned.' },
          { fr: 'Vous devriez prendre rendez-vous au plus tôt.', ru: 'Вам следует записаться как можно скорее.', en: 'You should make an appointment as soon as possible.' },
          { fr: 'Pourriez-vous me passer le sel, s\'il vous plaît?', ru: 'Не могли бы вы передать мне соль?', en: 'Could you pass me the salt, please?' },
          { fr: 'J\'aurais dû partir plus tôt — j\'ai raté mon train.', ru: 'Мне следовало уйти раньше — я пропустил свой поезд.', en: 'I should have left earlier — I missed my train.' },
        ],
      },
    ],
    contentEn: [
      {
        type: 'paragraph',
        text: 'At B2 level, the conditional is used not only for hypotheses but also for journalistic reported speech (unverified information), polite requests, advice, and regret.',
      },
      {
        type: 'rule_list',
        title: 'Journalistic conditional (key B2 skill):',
        rules: [
          'Used to report unverified information: Selon nos sources, il y aurait eu un accident.',
          'Often with: selon, d\'après, il paraît que, aux dires de.',
          'Conditionnel passé for possibly completed events: Le suspect se serait enfui à l\'étranger.',
        ],
      },
      {
        type: 'example_list',
        title: 'Examples',
        items: [
          { fr: 'Selon les médias, le Premier ministre aurait démissionné.', ru: 'According to the media, the Prime Minister is reported to have resigned.' },
          { fr: 'Vous devriez prendre rendez-vous au plus tôt.', ru: 'You should make an appointment as soon as possible.' },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────
  // 3. Le style indirect libre
  // ─────────────────────────────────────────────────────────────
  {
    slug: 'style-indirect-libre',
    titleRu: 'Свободная косвенная речь',
    titleEn: 'Free Indirect Speech',
    titleFr: 'Le style indirect libre',
    category: 'syntaxe',
    orderNum: 17,
    content: [
      {
        type: 'paragraph',
        text: 'Свободная косвенная речь (style indirect libre) — приём, при котором мысли или слова персонажа передаются без вводных слов (il dit que, il pensa que), но с сохранением сдвигов времён и местоимений. Широко используется в литературе и журналистике.',
      },
      {
        type: 'table',
        title: 'Сравнение трёх способов передачи речи',
        headers: ['Тип', 'Пример', 'Признаки'],
        rows: [
          ['Прямая речь', '«Je suis fatigué», dit-il.', 'кавычки, тире, глагол речи'],
          ['Косвенная речь', 'Il dit qu\'il était fatigué.', 'que, сдвиг времён, изменение местоимений'],
          ['Свободная косвенная', 'Il était fatigué. Pourquoi continuer?', 'нет глагола речи, нет que, но сдвиги сохранены'],
        ],
      },
      {
        type: 'rule_list',
        title: 'Признаки свободной косвенной речи:',
        rules: [
          'Нет вводного глагола (pas de «il dit que», «il pensa que»).',
          'Местоимения и притяжательные — третьего лица: «je» → «il/elle».',
          'Времена сдвинуты как в косвенной речи (imparfait, conditionnel).',
          'Вопросительные и восклицательные предложения сохраняются, но без кавычек: Était-il vraiment coupable?',
          'Часто в imparfait: Elle était épuisée. À quoi bon continuer? Personne ne l\'aidait.',
          'Узнаётся по контексту: нет кавычек, нет que, но явно чужая мысль.',
        ],
      },
      {
        type: 'example_list',
        title: 'Примеры',
        items: [
          { fr: 'Il regardait la lettre. Tout était fini. Comment avait-il pu se tromper à ce point?', ru: 'Он смотрел на письмо. Всё было кончено. Как он мог так ошибиться? (мысли персонажа без глагола речи)', en: 'He stared at the letter. It was all over. How could he have been so wrong? (character\'s thoughts without reporting verb)' },
          { fr: 'Elle hésitait. Devait-elle lui dire la vérité? Ce serait peut-être trop cruel.', ru: 'Она колебалась. Стоило ли говорить ему правду? Это, пожалуй, было бы слишком жестоко.', en: 'She hesitated. Should she tell him the truth? It might be too cruel.' },
          { fr: 'Dans la presse: Le ministre a rencontré les syndicats. Des avancées auraient été réalisées. Un accord serait imminent.', ru: 'В прессе: Министр встретился с профсоюзами. Якобы был достигнут прогресс. Соглашение, по слухам, близко.', en: 'In the press: The minister met the unions. Progress is said to have been made. A deal is reportedly imminent.' },
        ],
      },
    ],
    contentEn: [
      {
        type: 'paragraph',
        text: 'Free indirect speech (style indirect libre) blends the narrator\'s voice with a character\'s thoughts without a reporting verb or que. Tenses and pronouns shift as in indirect speech, but there are no quotation marks or introductory clauses.',
      },
      {
        type: 'rule_list',
        title: 'How to recognise it:',
        rules: [
          'No reporting verb (no «il dit que», «il pensa que»).',
          'Third-person pronouns instead of first person.',
          'Tenses are backshifted (imparfait, conditionnel).',
          'Questions and exclamations remain but without quotes: Était-il vraiment coupable?',
        ],
      },
      {
        type: 'example_list',
        title: 'Examples',
        items: [
          { fr: 'Il regardait la lettre. Tout était fini. Comment avait-il pu se tromper à ce point?', ru: 'He stared at the letter. It was all over. How could he have been so wrong?' },
          { fr: 'Elle hésitait. Devait-elle lui dire la vérité?', ru: 'She hesitated. Should she tell him the truth?' },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────
  // 4. Les verbes attributifs
  // ─────────────────────────────────────────────────────────────
  {
    slug: 'verbes-attributifs',
    titleRu: 'Глаголы-связки (sembler, paraître, avoir l\'air…)',
    titleEn: 'Attributive Verbs (sembler, paraître, avoir l\'air…)',
    titleFr: "Les verbes attributifs",
    category: 'verbes',
    orderNum: 18,
    content: [
      {
        type: 'paragraph',
        text: 'Глаголы-связки (verbes attributifs) связывают подлежащее с характеристикой-атрибутом, выраженной прилагательным или существительным. Помимо être, на B2 необходимо знать: sembler, paraître, avoir l\'air, rester, devenir, demeurer, se révéler.',
      },
      {
        type: 'table',
        title: 'Основные глаголы-связки',
        headers: ['Глагол', 'Значение', 'Пример'],
        rows: [
          ['être', 'быть', 'Il est intelligent.'],
          ['sembler + adj/inf', 'казаться', 'Elle semble fatiguée. / Il semble hésiter.'],
          ['paraître + adj', 'казаться, выглядеть (формальнее sembler)', 'Cette solution paraît efficace.'],
          ['avoir l\'air + adj', 'выглядеть, казаться (внешность)', 'Tu as l\'air inquiet.'],
          ['rester + adj', 'оставаться', 'Il reste calme malgré tout.'],
          ['devenir + adj/nom', 'становиться', 'Elle est devenue médecin.'],
          ['se révéler + adj', 'оказываться (результат)', 'Ce plan s\'est révélé inefficace.'],
          ['demeurer + adj', 'оставаться (книжн.)', 'La situation demeure préoccupante.'],
        ],
      },
      {
        type: 'rule_list',
        title: 'Тонкости:',
        rules: [
          'Sembler + infinitif (без que): Il semble comprendre. (Кажется, он понимает.) — элегантнее, чем Il semble qu\'il comprenne.',
          'Il semble que + subjonctif: Il semble qu\'il y ait un problème.',
          'Il me semble que + indicatif: Il me semble qu\'il a raison. (мне кажется, что...)',
          'Avoir l\'air: прилагательное может согласовываться с подлежащим (Elle a l\'air fatiguée) или с l\'air (Elle a l\'air fatigué) — оба варианта приемлемы.',
          'Se révéler + adj/nom: выражает итог, часто неожиданный: Le projet s\'est révélé un échec.',
        ],
      },
      {
        type: 'example_list',
        title: 'Примеры',
        items: [
          { fr: 'Cette proposition semble raisonnable à première vue.', ru: 'Это предложение на первый взгляд кажется разумным.', en: 'This proposal seems reasonable at first glance.' },
          { fr: 'Il paraît peu convaincu par vos arguments.', ru: 'Он выглядит не очень убеждённым вашими аргументами.', en: 'He seems little convinced by your arguments.' },
          { fr: 'La situation demeure préoccupante malgré les efforts.', ru: 'Ситуация остаётся тревожной, несмотря на усилия.', en: 'The situation remains worrying despite the efforts.' },
          { fr: 'Sa stratégie s\'est révélée payante sur le long terme.', ru: 'Его стратегия в долгосрочной перспективе оказалась выгодной.', en: 'His strategy proved to pay off in the long run.' },
        ],
      },
    ],
    contentEn: [
      {
        type: 'paragraph',
        text: 'Attributive verbs (verbes attributifs) link a subject to a descriptive attribute. Beyond être, B2 requires: sembler, paraître, avoir l\'air, rester, devenir, se révéler, demeurer.',
      },
      {
        type: 'rule_list',
        title: 'Key nuances:',
        rules: [
          'Sembler + infinitive: Il semble comprendre. (more elegant than Il semble qu\'il comprenne.)',
          'Il semble que + subjonctif vs Il me semble que + indicatif.',
          'Se révéler = turn out to be (often unexpected result): Le projet s\'est révélé un échec.',
        ],
      },
      {
        type: 'example_list',
        title: 'Examples',
        items: [
          { fr: 'Cette proposition semble raisonnable à première vue.', ru: 'This proposal seems reasonable at first glance.' },
          { fr: 'Sa stratégie s\'est révélée payante sur le long terme.', ru: 'His strategy proved to pay off in the long run.' },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────
  // 5. La restriction et la nuance (ne...que, sauf, hormis…)
  // ─────────────────────────────────────────────────────────────
  {
    slug: 'expression-restriction-nuance',
    titleRu: 'Выражение ограничения и оговорки',
    titleEn: 'Expressing Restriction and Qualification',
    titleFr: 'La restriction et la nuance',
    category: 'syntaxe',
    orderNum: 19,
    content: [
      {
        type: 'paragraph',
        text: 'На уровне B2 важно точно выражать ограничение, исключение и оговорку. Базовое ne...que дополняется более сложными структурами: sauf que, à condition que, à moins que, hormis, excepté, quitte à.',
      },
      {
        type: 'table',
        title: 'Конструкции ограничения и исключения',
        headers: ['Конструкция', 'Значение', 'Пример'],
        rows: [
          ['ne...que', 'только (ограничение)', 'Il ne parle que français.'],
          ['sauf + nom/inf', 'кроме, за исключением', 'Tout va bien, sauf ce détail.'],
          ['sauf que + ind.', 'только вот, кроме того что', 'C\'est une bonne idée, sauf qu\'elle coûte cher.'],
          ['hormis / excepté', 'за исключением (книжн.)', 'Hormis quelques erreurs, le texte est excellent.'],
          ['à condition de/que', 'при условии (если)', 'Je viendrai, à condition d\'être libre.'],
          ['à moins de/que', 'если только не', 'Il réussira, à moins qu\'il ne renonce.'],
          ['quitte à + inf', 'даже если придётся, пусть и', 'Il ira, quitte à rater son cours.'],
          ['pour peu que + subj.', 'стоит только, при малейшем', 'Pour peu qu\'il pleuve, ils annulent tout.'],
        ],
      },
      {
        type: 'rule_list',
        title: 'Правила и оттенки:',
        rules: [
          'Ne...que = seulement: Il ne boit que de l\'eau. = Il boit seulement de l\'eau.',
          'Sauf que вводит оговорку/ограничение к предыдущей мысли: Tout est parfait, sauf que le prix est élevé.',
          'À moins que + subjonctif (+ ne explétif в письменном): Il viendra à moins qu\'il ne soit malade.',
          'Quitte à + infinitif: принятие негативного следствия ради цели: Elle dira la vérité, quitte à blesser.',
          'Pour peu que + subjonctif: минимальное условие: Pour peu qu\'on l\'encourage, il fait des merveilles.',
        ],
      },
      {
        type: 'example_list',
        title: 'Примеры',
        items: [
          { fr: 'Il accepte tout, sauf qu\'on lui mente.', ru: 'Он принимает всё, кроме лжи.', en: 'He accepts everything, except being lied to.' },
          { fr: 'Hormis quelques imprécisions, ce rapport est excellent.', ru: 'За исключением нескольких неточностей, этот доклад отличный.', en: 'Apart from a few inaccuracies, this report is excellent.' },
          { fr: 'Je signerai le contrat, à condition que les délais soient respectés.', ru: 'Я подпишу договор при условии, что сроки будут соблюдены.', en: 'I will sign the contract, provided the deadlines are met.' },
          { fr: 'Elle a tout dit, quitte à déplaire à ses supérieurs.', ru: 'Она сказала всё, даже рискуя не угодить начальству.', en: 'She said everything, even at the risk of displeasing her superiors.' },
        ],
      },
    ],
    contentEn: [
      {
        type: 'paragraph',
        text: 'B2-level restriction expressions go beyond ne...que. Key additions: sauf que (except that), hormis/excepté (except, literary), à condition que (provided that), à moins que (unless), quitte à (even if it means), pour peu que (if only).',
      },
      {
        type: 'rule_list',
        title: 'Key structures:',
        rules: [
          'Sauf que + indicatif: introduces a reservation — C\'est parfait, sauf que c\'est trop cher.',
          'À moins que + subjonctif (+ ne explétif in formal writing).',
          'Quitte à + infinitif: accepting a negative consequence — Elle dira la vérité, quitte à blesser.',
          'Pour peu que + subjonctif: minimal condition — Pour peu qu\'on l\'encourage, il fait des merveilles.',
        ],
      },
      {
        type: 'example_list',
        title: 'Examples',
        items: [
          { fr: 'Hormis quelques imprécisions, ce rapport est excellent.', ru: 'Apart from a few inaccuracies, this report is excellent.' },
          { fr: 'Elle a tout dit, quitte à déplaire à ses supérieurs.', ru: 'She said everything, even at the risk of displeasing her superiors.' },
        ],
      },
    ],
  },
];
