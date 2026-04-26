import type { GrammarTopic } from './grammar-a1.js';

export const grammarTopicsA2: GrammarTopic[] = [
  // ─────────────────────────────────────────────────────────────
  // 1. Passé composé (avec avoir)
  // ─────────────────────────────────────────────────────────────
  {
    slug: 'passe-compose-avoir',
    titleRu: 'Passé composé с avoir',
    titleEn: 'Passé composé with avoir',
    titleFr: 'Le passé composé avec avoir',
    category: 'temps',
    orderNum: 1,
    content: [
      {
        type: 'paragraph',
        text: 'Passé composé — основное прошедшее время во французском языке. Образуется с помощью вспомогательного глагола avoir (иметь) в настоящем времени + причастие прошедшего времени (participe passé).',
      },
      {
        type: 'table',
        title: 'Образование: avoir + participe passé',
        headers: ['Лицо', 'avoir', 'Пример'],
        rows: [
          ['je', 'ai', "j'ai mangé (я поел)"],
          ['tu', 'as', 'tu as parlé (ты поговорил)'],
          ['il/elle', 'a', 'il a fini (он закончил)'],
          ['nous', 'avons', 'nous avons vu (мы видели)'],
          ['vous', 'avez', 'vous avez pris (вы взяли)'],
          ['ils/elles', 'ont', 'ils ont eu (они имели)'],
        ],
      },
      {
        type: 'rule_list',
        title: 'Образование participe passé:',
        rules: [
          '-ER глаголы → é: manger → mangé, parler → parlé, acheter → acheté',
          '-IR глаголы → i: finir → fini, choisir → choisi, partir → parti',
          '-RE глаголы → u: attendre → attendu, répondre → répondu, perdre → perdu',
          'Неправильные: avoir → eu, être → été, faire → fait, prendre → pris, voir → vu, savoir → su, pouvoir → pu, vouloir → voulu, venir → venu, dire → dit',
        ],
      },
      {
        type: 'example_list',
        title: 'Примеры',
        items: [
          { fr: "J'ai mangé une pomme.", ru: 'Я съел яблоко.', en: 'I ate an apple.' },
          { fr: "Il a fini son travail.", ru: 'Он закончил свою работу.', en: 'He finished his work.' },
          { fr: "Nous avons pris le train.", ru: 'Мы сели на поезд.', en: 'We took the train.' },
          { fr: "Tu as vu ce film ?", ru: 'Ты видел этот фильм?', en: 'Did you see this movie?' },
        ],
      },
    ],
    contentEn: [
      {
        type: 'paragraph',
        text: 'Passé composé is the main past tense in French. It is formed with the auxiliary verb avoir (to have) in the present tense + past participle (participe passé).',
      },
      {
        type: 'rule_list',
        title: 'Forming the participe passé:',
        rules: [
          '-ER verbs → é: manger → mangé, parler → parlé',
          '-IR verbs → i: finir → fini, choisir → choisi',
          '-RE verbs → u: attendre → attendu, répondre → répondu',
          'Irregular: avoir → eu, être → été, faire → fait, prendre → pris, voir → vu',
        ],
      },
      {
        type: 'example_list',
        title: 'Examples',
        items: [
          { fr: "J'ai mangé une pomme.", ru: 'Я съел яблоко.', en: 'I ate an apple.' },
          { fr: "Il a fini son travail.", ru: 'Он закончил свою работу.', en: 'He finished his work.' },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────
  // 2. Passé composé (avec être)
  // ─────────────────────────────────────────────────────────────
  {
    slug: 'passe-compose-etre',
    titleRu: 'Passé composé с être',
    titleEn: 'Passé composé with être',
    titleFr: 'Le passé composé avec être',
    category: 'temps',
    orderNum: 2,
    content: [
      {
        type: 'paragraph',
        text: 'Часть глаголов образует passé composé со вспомогательным глаголом être (быть), а не avoir. Это глаголы движения и изменения состояния, а также все возвратные (pronominal) глаголы.',
      },
      {
        type: 'rule_list',
        title: '17 глаголов с être (мнемоника «Дом Dr. and Mrs. Vandertramp»):',
        rules: [
          'aller (aller → allé), venir (venu), arriver (arrivé), partir (parti)',
          'entrer (entré), sortir (sorti), monter (monté), descendre (descendu)',
          'naître (né), mourir (mort), rester (resté), tomber (tombé)',
          'retourner (retourné), rentrer (rentré), revenir (revenu)',
          'passer (passé) — в значении «заходить», devenir (devenu)',
          'Важно: причастие согласуется с подлежащим в роде и числе!',
        ],
      },
      {
        type: 'table',
        title: 'Согласование причастия',
        headers: ['Подлежащее', 'Пример'],
        rows: [
          ['il', 'Il est allé au cinéma.'],
          ['elle', 'Elle est allée au cinéma.'],
          ['ils', 'Ils sont allés au cinéma.'],
          ['elles', 'Elles sont allées au cinéma.'],
        ],
      },
      {
        type: 'example_list',
        title: 'Примеры',
        items: [
          { fr: 'Elle est arrivée à 10h.', ru: 'Она приехала в 10 часов.', en: 'She arrived at 10.' },
          { fr: 'Nous sommes partis tôt.', ru: 'Мы уехали рано.', en: 'We left early.' },
          { fr: 'Il est né en 1990.', ru: 'Он родился в 1990 году.', en: 'He was born in 1990.' },
        ],
      },
    ],
    contentEn: [
      {
        type: 'paragraph',
        text: 'Some verbs form the passé composé with être instead of avoir. These are verbs of motion/change of state and all reflexive (pronominal) verbs. The past participle must agree in gender and number with the subject.',
      },
      {
        type: 'example_list',
        title: 'Examples',
        items: [
          { fr: 'Elle est arrivée à 10h.', ru: 'Она приехала в 10 часов.', en: 'She arrived at 10.' },
          { fr: 'Nous sommes partis tôt.', ru: 'Мы уехали рано.', en: 'We left early.' },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────
  // 3. L'imparfait
  // ─────────────────────────────────────────────────────────────
  {
    slug: 'imparfait',
    titleRu: 'Imparfait (прошедшее несовершённое)',
    titleEn: 'The Imperfect Tense',
    titleFr: "L'imparfait",
    category: 'temps',
    orderNum: 3,
    content: [
      {
        type: 'paragraph',
        text: "Imparfait — прошедшее время, которое описывает привычные действия в прошлом, состояния и фон для другого действия. Образуется от основы глагола в форме «nous» + окончания.",
      },
      {
        type: 'table',
        title: 'Окончания imparfait',
        headers: ['Лицо', 'Окончание', 'parler (nous parlons → parl-)'],
        rows: [
          ['je', '-ais', 'je parlais'],
          ['tu', '-ais', 'tu parlais'],
          ['il/elle', '-ait', 'il parlait'],
          ['nous', '-ions', 'nous parlions'],
          ['vous', '-iez', 'vous parliez'],
          ['ils/elles', '-aient', 'ils parlaient'],
        ],
      },
      {
        type: 'rule_list',
        title: 'Когда используется imparfait:',
        rules: [
          'Привычные или повторяющиеся действия в прошлом: Quand j\'étais enfant, je jouais au foot. (В детстве я играл в футбол.)',
          'Описание состояния или фона: Il faisait beau et les oiseaux chantaient. (Была хорошая погода, и птицы пели.)',
          'Продолжавшееся действие, прерванное другим (в сочетании с passé composé): Je lisais quand il est arrivé. (Я читал, когда он пришёл.)',
          'Вежливая просьба: Je voulais vous demander… (Я хотел спросить вас…)',
        ],
      },
      {
        type: 'example_list',
        title: 'Примеры',
        items: [
          { fr: 'Avant, je travaillais à Paris.', ru: 'Раньше я работал в Париже.', en: 'Before, I worked in Paris.' },
          { fr: "Il était fatigué et il dormait.", ru: 'Он был уставшим и спал.', en: 'He was tired and he was sleeping.' },
          { fr: "Quand j'étais jeune, j'aimais le chocolat.", ru: 'Когда я был молодым, я любил шоколад.', en: 'When I was young, I liked chocolate.' },
        ],
      },
    ],
    contentEn: [
      {
        type: 'paragraph',
        text: "The imperfect is used for habitual past actions, descriptions, and background context. Formed from the nous stem + imperfect endings (-ais, -ais, -ait, -ions, -iez, -aient).",
      },
      {
        type: 'example_list',
        title: 'Examples',
        items: [
          { fr: 'Avant, je travaillais à Paris.', ru: 'Раньше я работал в Париже.', en: 'Before, I worked in Paris.' },
          { fr: "Quand j'étais jeune, j'aimais le chocolat.", ru: 'Когда я был молодым, я любил шоколад.', en: 'When I was young, I liked chocolate.' },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────
  // 4. Le futur simple
  // ─────────────────────────────────────────────────────────────
  {
    slug: 'futur-simple',
    titleRu: 'Futur simple (простое будущее)',
    titleEn: 'The Simple Future Tense',
    titleFr: 'Le futur simple',
    category: 'temps',
    orderNum: 4,
    content: [
      {
        type: 'paragraph',
        text: "Futur simple используется для планов и предсказаний будущего. Образуется от инфинитива глагола + окончания (-ai, -as, -a, -ons, -ez, -ont). Для -RE глаголов e в конце убирается.",
      },
      {
        type: 'table',
        title: 'Окончания futur simple',
        headers: ['Лицо', 'parler', 'finir', 'prendre'],
        rows: [
          ['je', 'je parlerai', 'je finirai', 'je prendrai'],
          ['tu', 'tu parleras', 'tu finiras', 'tu prendras'],
          ['il/elle', 'il parlera', 'il finira', 'il prendra'],
          ['nous', 'nous parlerons', 'nous finirons', 'nous prendrons'],
          ['vous', 'vous parlerez', 'vous finirez', 'vous prendrez'],
          ['ils/elles', 'ils parleront', 'ils finiront', 'ils prendront'],
        ],
      },
      {
        type: 'rule_list',
        title: 'Неправильные основы futur simple:',
        rules: [
          'être → ser- (je serai)',
          'avoir → aur- (j\'aurai)',
          'aller → ir- (j\'irai)',
          'faire → fer- (je ferai)',
          'pouvoir → pourr- (je pourrai)',
          'vouloir → voudr- (je voudrai)',
          'venir → viendr- (je viendrai)',
          'voir → verr- (je verrai)',
          'savoir → saur- (je saurai)',
        ],
      },
      {
        type: 'example_list',
        title: 'Примеры',
        items: [
          { fr: 'Demain, je travaillerai à la maison.', ru: 'Завтра я буду работать дома.', en: 'Tomorrow I will work at home.' },
          { fr: "L'année prochaine, nous irons en France.", ru: 'В следующем году мы поедем во Францию.', en: 'Next year, we will go to France.' },
          { fr: 'Il fera beau ce week-end.', ru: 'На этих выходных будет хорошая погода.', en: 'The weather will be nice this weekend.' },
        ],
      },
    ],
    contentEn: [
      {
        type: 'paragraph',
        text: "The simple future is used for future plans and predictions. Formed from the infinitive + endings (-ai, -as, -a, -ons, -ez, -ont). -RE verbs drop the final e before adding endings.",
      },
      {
        type: 'example_list',
        title: 'Examples',
        items: [
          { fr: 'Demain, je travaillerai à la maison.', ru: 'Завтра я буду работать дома.', en: 'Tomorrow I will work at home.' },
          { fr: "L'année prochaine, nous irons en France.", ru: 'В следующем году мы поедем во Францию.', en: 'Next year, we will go to France.' },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────
  // 5. Le comparatif et le superlatif
  // ─────────────────────────────────────────────────────────────
  {
    slug: 'comparatif-superlatif',
    titleRu: 'Сравнительная и превосходная степень',
    titleEn: 'Comparative and Superlative',
    titleFr: 'Le comparatif et le superlatif',
    category: 'adjectifs',
    orderNum: 5,
    content: [
      {
        type: 'paragraph',
        text: 'Для сравнения прилагательных и наречий используются конструкции plus... que (более... чем), moins... que (менее... чем), aussi... que (так же... как).',
      },
      {
        type: 'table',
        title: 'Comparatif',
        headers: ['Тип', 'Конструкция', 'Пример'],
        rows: [
          ['Превосходство', 'plus + adj + que', 'Il est plus grand que moi. (Он выше меня.)'],
          ['Недостаточность', 'moins + adj + que', 'Elle est moins rapide que lui. (Она медленнее его.)'],
          ['Равенство', 'aussi + adj + que', 'Je suis aussi fort que toi. (Я такой же сильный, как ты.)'],
        ],
      },
      {
        type: 'table',
        title: 'Superlatif (превосходная степень)',
        headers: ['Тип', 'Конструкция', 'Пример'],
        rows: [
          ['Наивысший', 'le/la/les plus + adj', "C'est le plus grand bâtiment. (Это самое высокое здание.)"],
          ['Наименьший', 'le/la/les moins + adj', "C'est la moins chère. (Это самая дешёвая.)"],
        ],
      },
      {
        type: 'rule_list',
        title: 'Исключения:',
        rules: [
          'bon → meilleur (лучший), le meilleur (самый лучший)',
          'mauvais → pire (худший), le pire (самый худший)',
          'bien → mieux (лучше), le mieux (лучше всего)',
          'beaucoup → plus (больше), le plus (больше всего)',
        ],
      },
      {
        type: 'example_list',
        title: 'Примеры',
        items: [
          { fr: 'Paris est plus grand que Lyon.', ru: 'Париж больше Лиона.', en: 'Paris is bigger than Lyon.' },
          { fr: "C'est le meilleur restaurant de la ville.", ru: 'Это лучший ресторан в городе.', en: "It's the best restaurant in the city." },
          { fr: 'Elle chante aussi bien que lui.', ru: 'Она поёт так же хорошо, как он.', en: 'She sings as well as him.' },
        ],
      },
    ],
    contentEn: [
      {
        type: 'paragraph',
        text: 'To compare adjectives and adverbs, use: plus... que (more... than), moins... que (less... than), aussi... que (as... as). Exceptions: bon → meilleur, mauvais → pire.',
      },
      {
        type: 'example_list',
        title: 'Examples',
        items: [
          { fr: 'Paris est plus grand que Lyon.', ru: 'Париж больше Лиона.', en: 'Paris is bigger than Lyon.' },
          { fr: "C'est le meilleur restaurant de la ville.", ru: 'Это лучший ресторан в городе.', en: "It's the best restaurant in the city." },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────
  // 6. Les pronoms relatifs (qui, que)
  // ─────────────────────────────────────────────────────────────
  {
    slug: 'pronoms-relatifs',
    titleRu: 'Относительные местоимения qui и que',
    titleEn: 'Relative Pronouns qui and que',
    titleFr: 'Les pronoms relatifs qui et que',
    category: 'pronoms',
    orderNum: 6,
    content: [
      {
        type: 'paragraph',
        text: 'Относительные местоимения qui и que связывают два предложения, заменяя существительное. Qui = подлежащее (кто/который), que = дополнение (которого/которую).',
      },
      {
        type: 'table',
        title: 'Qui vs Que',
        headers: ['Местоимение', 'Функция', 'Пример'],
        rows: [
          ['qui', 'подлежащее (субъект)', "L'homme qui parle est mon père. (Мужчина, который говорит — мой отец.)"],
          ['que (qu\')', 'прямое дополнение (объект)', "Le livre que je lis est intéressant. (Книга, которую я читаю, интересна.)"],
        ],
      },
      {
        type: 'rule_list',
        title: 'Правила:',
        rules: [
          'Qui никогда не сокращается перед гласной.',
          "Que сокращается в qu' перед гласной или h: le film qu'il regarde.",
          'После que глагол в passé composé может согласовываться с заменяемым существительным: La fille que j\'ai vue. (Девушка, которую я видел.)',
        ],
      },
      {
        type: 'example_list',
        title: 'Примеры',
        items: [
          { fr: "C'est l'ami qui m'aide.", ru: 'Это друг, который мне помогает.', en: 'This is the friend who helps me.' },
          { fr: "Voici le gâteau qu'elle a préparé.", ru: 'Вот пирог, который она приготовила.', en: 'Here is the cake that she prepared.' },
          { fr: "La ville où j'habite est belle.", ru: 'Город, в котором я живу, красивый.', en: 'The city where I live is beautiful.' },
        ],
      },
    ],
    contentEn: [
      {
        type: 'paragraph',
        text: 'Relative pronouns qui and que connect two clauses. Qui = subject (who/which as subject), que = direct object (which/whom as object). Que becomes qu\' before a vowel.',
      },
      {
        type: 'example_list',
        title: 'Examples',
        items: [
          { fr: "C'est l'ami qui m'aide.", ru: 'Это друг, который мне помогает.', en: 'This is the friend who helps me.' },
          { fr: "Voici le gâteau qu'elle a préparé.", ru: 'Вот пирог, который она приготовила.', en: 'Here is the cake that she prepared.' },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────
  // 7. Les pronoms COD et COI
  // ─────────────────────────────────────────────────────────────
  {
    slug: 'pronoms-cod-coi',
    titleRu: 'Местоимения COD и COI',
    titleEn: 'Direct and Indirect Object Pronouns',
    titleFr: 'Les pronoms COD et COI',
    category: 'pronoms',
    orderNum: 7,
    content: [
      {
        type: 'paragraph',
        text: 'Местоимения заменяют существительные-дополнения в предложении. COD (complément d\'objet direct) — прямое дополнение, COI (complément d\'objet indirect) — косвенное (с предлогом à).',
      },
      {
        type: 'table',
        title: 'Таблица местоимений',
        headers: ['Лицо', 'COD (прямое)', 'COI (косвенное, à + кто)'],
        rows: [
          ['1 ед.', 'me (m\')', 'me (m\')'],
          ['2 ед.', 'te (t\')', 'te (t\')'],
          ['3 ед. м.', 'le (l\')', 'lui'],
          ['3 ед. ж.', 'la (l\')', 'lui'],
          ['1 мн.', 'nous', 'nous'],
          ['2 мн.', 'vous', 'vous'],
          ['3 мн.', 'les', 'leur'],
        ],
      },
      {
        type: 'rule_list',
        title: 'Место в предложении:',
        rules: [
          'Перед глаголом: Je le vois. (Я его вижу.)',
          'В passé composé — перед вспомогательным глаголом: Je l\'ai vu. (Я его видел.)',
          'В отрицании: Je ne le vois pas.',
          'С инфинитивом — перед инфинитивом: Je veux le voir. (Я хочу его видеть.)',
        ],
      },
      {
        type: 'example_list',
        title: 'Примеры',
        items: [
          { fr: 'Tu me connais ? — Oui, je te connais.', ru: 'Ты меня знаешь? — Да, я тебя знаю.', en: 'Do you know me? — Yes, I know you.' },
          { fr: 'Je lui parle tous les jours.', ru: 'Я говорю с ним каждый день.', en: 'I talk to him every day.' },
          { fr: 'Il les a vus au cinéma.', ru: 'Он видел их в кино.', en: 'He saw them at the cinema.' },
        ],
      },
    ],
    contentEn: [
      {
        type: 'paragraph',
        text: 'Object pronouns replace noun complements. COD = direct object (me, te, le, la, nous, vous, les). COI = indirect object with à (me, te, lui, nous, vous, leur). They go before the verb (or auxiliary in compound tenses).',
      },
      {
        type: 'example_list',
        title: 'Examples',
        items: [
          { fr: 'Je lui parle tous les jours.', ru: 'Я говорю с ним каждый день.', en: 'I talk to him every day.' },
          { fr: 'Il les a vus au cinéma.', ru: 'Он видел их в кино.', en: 'He saw them at the cinema.' },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────
  // 8. La négation avancée
  // ─────────────────────────────────────────────────────────────
  {
    slug: 'negation-avancee',
    titleRu: 'Расширенное отрицание',
    titleEn: 'Advanced Negation',
    titleFr: 'La négation avancée',
    category: 'syntaxe',
    orderNum: 8,
    content: [
      {
        type: 'paragraph',
        text: 'Кроме базового ne...pas существуют другие отрицательные конструкции. Частица ne всегда остаётся, меняется только вторая часть.',
      },
      {
        type: 'table',
        title: 'Отрицательные конструкции',
        headers: ['Конструкция', 'Значение', 'Пример'],
        rows: [
          ['ne...pas', 'не', 'Je ne mange pas de viande.'],
          ['ne...plus', 'больше не, уже не', 'Il ne travaille plus ici.'],
          ['ne...jamais', 'никогда', 'Elle ne ment jamais.'],
          ['ne...rien', 'ничего', "Je n'entends rien."],
          ['ne...personne', 'никого', 'Je ne vois personne.'],
          ['ne...que', 'только (ограничение)', "Je n'ai qu'un euro."],
          ['ne...ni...ni', 'ни...ни', 'Il ne mange ni viande ni poisson.'],
        ],
      },
      {
        type: 'rule_list',
        title: 'Важно:',
        rules: [
          'После ne...rien и ne...personne артикль de не используется: Je ne mange rien de spécial.',
          'Rien и personne могут быть подлежащим: Rien ne va. Personne n\'est venu.',
          'В разговорном языке ne часто опускается: Je sais pas. (= Je ne sais pas.)',
        ],
      },
      {
        type: 'example_list',
        title: 'Примеры',
        items: [
          { fr: "Je ne fume plus depuis deux ans.", ru: 'Я больше не курю уже два года.', en: "I haven't smoked for two years." },
          { fr: "Il n'a rien dit.", ru: 'Он ничего не сказал.', en: 'He said nothing.' },
          { fr: "Elle ne parle qu'à ses amis.", ru: 'Она разговаривает только со своими друзьями.', en: 'She only talks to her friends.' },
        ],
      },
    ],
    contentEn: [
      {
        type: 'paragraph',
        text: 'Beyond ne...pas, French has other negative constructions: ne...plus (no longer), ne...jamais (never), ne...rien (nothing), ne...personne (nobody), ne...que (only). The ne stays; only the second element changes.',
      },
      {
        type: 'example_list',
        title: 'Examples',
        items: [
          { fr: "Je ne fume plus depuis deux ans.", ru: 'Я больше не курю уже два года.', en: "I haven't smoked for two years." },
          { fr: "Il n'a rien dit.", ru: 'Он ничего не сказал.', en: 'He said nothing.' },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────
  // 9. Les verbes pronominaux
  // ─────────────────────────────────────────────────────────────
  {
    slug: 'verbes-pronominaux',
    titleRu: 'Возвратные глаголы (verbes pronominaux)',
    titleEn: 'Reflexive Verbs',
    titleFr: 'Les verbes pronominaux',
    category: 'verbes',
    orderNum: 9,
    content: [
      {
        type: 'paragraph',
        text: 'Возвратные глаголы содержат возвратное местоимение (me, te, se, nous, vous, se), которое показывает, что действие направлено на само подлежащее. В passé composé они используют être.',
      },
      {
        type: 'table',
        title: 'Спряжение se lever (вставать) в présent',
        headers: ['Лицо', 'Форма'],
        rows: [
          ['je', 'je me lève'],
          ['tu', 'tu te lèves'],
          ['il/elle', 'il/elle se lève'],
          ['nous', 'nous nous levons'],
          ['vous', 'vous vous levez'],
          ['ils/elles', 'ils/elles se lèvent'],
        ],
      },
      {
        type: 'rule_list',
        title: 'Распространённые возвратные глаголы:',
        rules: [
          'Se lever — вставать, Se coucher — ложиться, Se laver — мыться',
          "S'habiller — одеваться, Se réveiller — просыпаться",
          "S'appeler — называться/звать, Se promener — прогуливаться",
          "S'excuser — извиняться, Se souvenir — вспоминать",
          "Se dépêcher — торопиться, Se reposer — отдыхать",
        ],
      },
      {
        type: 'example_list',
        title: 'Примеры',
        items: [
          { fr: 'Je me réveille à 7 heures.', ru: 'Я просыпаюсь в 7 часов.', en: 'I wake up at 7.' },
          { fr: "Elle s'est couchée tard hier soir.", ru: 'Она легла поздно вчера вечером.', en: 'She went to bed late last night.' },
          { fr: "Nous nous promenons dans le parc.", ru: 'Мы прогуливаемся в парке.', en: 'We take a walk in the park.' },
        ],
      },
    ],
    contentEn: [
      {
        type: 'paragraph',
        text: 'Reflexive verbs include a reflexive pronoun (me, te, se, nous, vous, se) showing the action is directed back at the subject. In passé composé they use être. Common examples: se lever, se coucher, se laver, s\'habiller.',
      },
      {
        type: 'example_list',
        title: 'Examples',
        items: [
          { fr: 'Je me réveille à 7 heures.', ru: 'Я просыпаюсь в 7 часов.', en: 'I wake up at 7.' },
          { fr: "Elle s'est couchée tard hier soir.", ru: 'Она легла поздно вчера вечером.', en: 'She went to bed late last night.' },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────
  // 10. Expressions de temps (depuis, pendant, il y a)
  // ─────────────────────────────────────────────────────────────
  {
    slug: 'expressions-temps',
    titleRu: 'Выражения времени: depuis, pendant, il y a',
    titleEn: 'Time Expressions: depuis, pendant, il y a',
    titleFr: 'Les expressions de temps',
    category: 'syntaxe',
    orderNum: 10,
    content: [
      {
        type: 'paragraph',
        text: 'Три ключевые конструкции для выражения времени в прошлом и настоящем: depuis, pendant и il y a — часто вызывают путаницу из-за разных временных форм глагола.',
      },
      {
        type: 'table',
        title: 'Depuis vs Pendant vs Il y a',
        headers: ['Конструкция', 'Значение', 'Время глагола', 'Пример'],
        rows: [
          ['depuis + durée/moment', 'с / уже (продолжается)', 'présent или imparfait', "J'habite ici depuis 3 ans. (Я живу здесь 3 года — и сейчас тоже.)"],
          ['pendant + durée', 'в течение (завершено)', 'passé composé', "J'ai vécu à Paris pendant 2 ans. (Я жил в Париже 2 года — больше нет.)"],
          ['il y a + durée', 'назад (момент в прошлом)', 'passé composé', "Il est parti il y a une heure. (Он ушёл час назад.)"],
        ],
      },
      {
        type: 'rule_list',
        title: 'Ключевое отличие:',
        rules: [
          'Depuis + présent = действие началось в прошлом и продолжается сейчас.',
          'Pendant + passé composé = действие полностью завершено в прошлом.',
          'Il y a = указывает, когда именно произошло действие (сколько времени назад).',
        ],
      },
      {
        type: 'example_list',
        title: 'Примеры',
        items: [
          { fr: "J'apprends le français depuis six mois.", ru: 'Я учу французский уже шесть месяцев.', en: "I've been learning French for six months." },
          { fr: "Il a travaillé là-bas pendant deux ans.", ru: 'Он работал там два года.', en: 'He worked there for two years.' },
          { fr: "Je l'ai rencontré il y a trois jours.", ru: 'Я встретил его три дня назад.', en: 'I met him three days ago.' },
        ],
      },
    ],
    contentEn: [
      {
        type: 'paragraph',
        text: 'Three key time expressions: depuis (since/for — ongoing, use présent), pendant (for — completed, use passé composé), il y a (ago — specific past moment, use passé composé).',
      },
      {
        type: 'example_list',
        title: 'Examples',
        items: [
          { fr: "J'apprends le français depuis six mois.", ru: 'Я учу французский уже шесть месяцев.', en: "I've been learning French for six months." },
          { fr: "Il a travaillé là-bas pendant deux ans.", ru: 'Он работал там два года.', en: 'He worked there for two years.' },
          { fr: "Je l'ai rencontré il y a trois jours.", ru: 'Я встретил его три дня назад.', en: 'I met him three days ago.' },
        ],
      },
    ],
  },
];
