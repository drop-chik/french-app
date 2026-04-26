import type { GrammarTopic } from './grammar-a1.js';

export const grammarTopicsA1Extra: GrammarTopic[] = [
  {
    slug: 'futur-proche',
    titleRu: 'Futur proche (ближайшее будущее)',
    titleEn: 'Futur proche (Near Future)',
    titleFr: 'Le futur proche',
    category: 'verbs',
    orderNum: 21,
    content: [
      {
        type: 'paragraph',
        text: 'Futur proche выражает ближайшее или запланированное будущее. Это самый распространённый способ говорить о будущем в разговорном французском. Образуется: глагол aller (настоящее время) + инфинитив основного глагола.',
      },
      {
        type: 'table',
        title: 'Спряжение: aller + инфинитив',
        headers: ['Лицо', 'aller', 'Пример'],
        rows: [
          ['je', 'vais', 'Je vais manger. — Я собираюсь поесть.'],
          ['tu', 'vas', 'Tu vas partir. — Ты собираешься уйти.'],
          ['il / elle', 'va', 'Il va travailler. — Он собирается работать.'],
          ['nous', 'allons', 'Nous allons voyager. — Мы собираемся путешествовать.'],
          ['vous', 'allez', 'Vous allez finir. — Вы собираетесь закончить.'],
          ['ils / elles', 'vont', 'Ils vont arriver. — Они собираются приехать.'],
        ],
      },
      {
        type: 'rule_list',
        title: 'Правила использования:',
        rules: [
          'Утверждение: Je vais acheter du pain. (Я собираюсь купить хлеб.)',
          'Отрицание: Je ne vais pas partir. (Я не собираюсь уходить.) — ne...pas окружают глагол aller.',
          'Вопрос: Est-ce que tu vas venir ? (Ты придёшь?)',
          'Используется для запланированных действий: Demain, nous allons visiter Paris.',
          'Употребляется чаще, чем futur simple в разговорной речи.',
        ],
      },
      {
        type: 'example_list',
        title: 'Примеры',
        items: [
          { fr: 'Ce soir, je vais regarder un film.', ru: 'Сегодня вечером я собираюсь посмотреть фильм.', en: 'Tonight, I am going to watch a film.' },
          { fr: 'Elle va appeler sa mère.', ru: 'Она собирается позвонить маме.', en: 'She is going to call her mother.' },
          { fr: 'Nous allons apprendre le français.', ru: 'Мы собираемся учить французский.', en: 'We are going to learn French.' },
          { fr: 'Il ne va pas venir à la fête.', ru: 'Он не придёт на вечеринку.', en: 'He is not going to come to the party.' },
        ],
      },
    ],
    contentEn: [
      {
        type: 'paragraph',
        text: 'The futur proche expresses a near or planned future event. It is the most common way to talk about the future in spoken French. It is formed with: aller (present tense) + infinitive of the main verb.',
      },
      {
        type: 'table',
        title: 'Conjugation: aller + infinitive',
        headers: ['Person', 'aller', 'Example'],
        rows: [
          ['je', 'vais', 'Je vais manger. — I am going to eat.'],
          ['tu', 'vas', 'Tu vas partir. — You are going to leave.'],
          ['il / elle', 'va', 'Il va travailler. — He is going to work.'],
          ['nous', 'allons', 'Nous allons voyager. — We are going to travel.'],
          ['vous', 'allez', 'Vous allez finir. — You are going to finish.'],
          ['ils / elles', 'vont', 'Ils vont arriver. — They are going to arrive.'],
        ],
      },
      {
        type: 'rule_list',
        title: 'Usage rules:',
        rules: [
          'Affirmative: Je vais acheter du pain. (I am going to buy bread.)',
          'Negative: Je ne vais pas partir. (I am not going to leave.) — ne...pas surrounds the verb aller.',
          'Question: Est-ce que tu vas venir? (Are you going to come?)',
          'Used for planned actions: Demain, nous allons visiter Paris.',
          'More common than futur simple in everyday speech.',
        ],
      },
      {
        type: 'example_list',
        title: 'Examples',
        items: [
          { fr: 'Ce soir, je vais regarder un film.', ru: 'Сегодня вечером я собираюсь посмотреть фильм.', en: 'Tonight, I am going to watch a film.' },
          { fr: 'Elle va appeler sa mère.', ru: 'Она собирается позвонить маме.', en: 'She is going to call her mother.' },
          { fr: 'Nous allons apprendre le français.', ru: 'Мы собираемся учить французский.', en: 'We are going to learn French.' },
          { fr: 'Il ne va pas venir à la fête.', ru: 'Он не придёт на вечеринку.', en: 'He is not going to come to the party.' },
        ],
      },
    ],
  },

  {
    slug: 'contractions',
    titleRu: 'Слияние артиклей: du, au, des, aux',
    titleEn: 'Contractions: du, au, des, aux',
    titleFr: 'Les contractions: du, au, des, aux',
    category: 'articles',
    orderNum: 22,
    content: [
      {
        type: 'paragraph',
        text: 'Во французском языке предлоги de и à обязательно сливаются с определёнными артиклями le и les. С артиклями la и l\' слияния не происходит.',
      },
      {
        type: 'table',
        title: 'Таблица слияний',
        headers: ['Предлог', '+ le (м.р.)', '+ la (ж.р.)', '+ les (мн.ч.)', '+ l\' (перед гласной)'],
        rows: [
          ['à', 'au → Je vais au cinéma.', 'à la → Je vais à la gare.', 'aux → Je parle aux enfants.', 'à l\' → Je vais à l\'école.'],
          ['de', 'du → Je viens du marché.', 'de la → Je viens de la banque.', 'des → Je parle des enfants.', 'de l\' → Je viens de l\'hôpital.'],
        ],
      },
      {
        type: 'rule_list',
        title: 'Правила:',
        rules: [
          'à + le = au (ОБЯЗАТЕЛЬНО): Je parle au professeur. (Нельзя: *à le professeur)',
          'à + les = aux (ОБЯЗАТЕЛЬНО): Nous allons aux musées.',
          'de + le = du (ОБЯЗАТЕЛЬНО): Il revient du travail.',
          'de + les = des (ОБЯЗАТЕЛЬНО): Elle parle des films.',
          'à la и de la не меняются: Je vais à la plage. / Il vient de la ville.',
          'à l\' и de l\' перед гласными/h: Il va à l\'opéra. / Elle vient de l\'université.',
        ],
      },
      {
        type: 'example_list',
        title: 'Примеры',
        items: [
          { fr: 'Je vais au supermarché.', ru: 'Я иду в супермаркет.', en: 'I am going to the supermarket.' },
          { fr: 'Elle parle aux étudiants.', ru: 'Она разговаривает со студентами.', en: 'She is talking to the students.' },
          { fr: 'Il revient du bureau.', ru: 'Он возвращается из офиса.', en: 'He is coming back from the office.' },
          { fr: 'Nous parlons des vacances.', ru: 'Мы говорим об отпуске.', en: 'We are talking about the holidays.' },
        ],
      },
    ],
    contentEn: [
      {
        type: 'paragraph',
        text: 'In French, the prepositions de and à must contract with the definite articles le and les. No contraction occurs with la or l\'.',
      },
      {
        type: 'table',
        title: 'Contraction table',
        headers: ['Preposition', '+ le (m.)', '+ la (f.)', '+ les (pl.)', '+ l\' (before vowel)'],
        rows: [
          ['à', 'au → Je vais au cinéma.', 'à la → Je vais à la gare.', 'aux → Je parle aux enfants.', 'à l\' → Je vais à l\'école.'],
          ['de', 'du → Je viens du marché.', 'de la → Je viens de la banque.', 'des → Je parle des enfants.', 'de l\' → Je viens de l\'hôpital.'],
        ],
      },
      {
        type: 'rule_list',
        title: 'Rules:',
        rules: [
          'à + le = au (REQUIRED): Je parle au professeur. (Cannot say: *à le professeur)',
          'à + les = aux (REQUIRED): Nous allons aux musées.',
          'de + le = du (REQUIRED): Il revient du travail.',
          'de + les = des (REQUIRED): Elle parle des films.',
          'à la and de la do not change: Je vais à la plage. / Il vient de la ville.',
          'à l\' and de l\' before vowels/h: Il va à l\'opéra. / Elle vient de l\'université.',
        ],
      },
      {
        type: 'example_list',
        title: 'Examples',
        items: [
          { fr: 'Je vais au supermarché.', ru: 'Я иду в супермаркет.', en: 'I am going to the supermarket.' },
          { fr: 'Elle parle aux étudiants.', ru: 'Она разговаривает со студентами.', en: 'She is talking to the students.' },
          { fr: 'Il revient du bureau.', ru: 'Он возвращается из офиса.', en: 'He is coming back from the office.' },
          { fr: 'Nous parlons des vacances.', ru: 'Мы говорим об отпуске.', en: 'We are talking about the holidays.' },
        ],
      },
    ],
  },

  {
    slug: 'verbes-irreguliers',
    titleRu: 'Неправильные глаголы настоящего времени',
    titleEn: 'Irregular Verbs in the Present Tense',
    titleFr: 'Les verbes irréguliers au présent',
    category: 'verbs',
    orderNum: 23,
    content: [
      {
        type: 'paragraph',
        text: 'Четыре важнейших неправильных глагола французского языка — faire (делать), pouvoir (мочь), vouloir (хотеть), prendre (брать). Они не следуют стандартным правилам спряжения и встречаются в каждом разговоре.',
      },
      {
        type: 'table',
        title: 'Спряжение неправильных глаголов',
        headers: ['', 'faire (делать)', 'pouvoir (мочь)', 'vouloir (хотеть)', 'prendre (брать)'],
        rows: [
          ['je', 'fais', 'peux', 'veux', 'prends'],
          ['tu', 'fais', 'peux', 'veux', 'prends'],
          ['il / elle', 'fait', 'peut', 'veut', 'prend'],
          ['nous', 'faisons', 'pouvons', 'voulons', 'prenons'],
          ['vous', 'faites', 'pouvez', 'voulez', 'prenez'],
          ['ils / elles', 'font', 'peuvent', 'veulent', 'prennent'],
        ],
      },
      {
        type: 'rule_list',
        title: 'Особенности:',
        rules: [
          'faire: nous faisons (не *faisisons), vous faites (особая форма)',
          'pouvoir и vouloir: je/tu — peux/veux (оканчиваются на -x, не на -s)',
          'pouvoir + infinitif: Je peux venir. (Я могу прийти.)',
          'vouloir + infinitif: Je veux manger. (Я хочу поесть.)',
          'prendre: ils prennent — двойное n в 3-м лице мн.ч.',
          'Глаголы comprendre и apprendre спрягаются как prendre.',
        ],
      },
      {
        type: 'example_list',
        title: 'Примеры',
        items: [
          { fr: 'Qu\'est-ce que tu fais ce soir ?', ru: 'Что ты делаешь сегодня вечером?', en: 'What are you doing tonight?' },
          { fr: 'Je ne peux pas venir demain.', ru: 'Я не могу прийти завтра.', en: 'I cannot come tomorrow.' },
          { fr: 'Vous voulez du café ?', ru: 'Вы хотите кофе?', en: 'Do you want coffee?' },
          { fr: 'Elle prend le bus tous les jours.', ru: 'Она ездит на автобусе каждый день.', en: 'She takes the bus every day.' },
        ],
      },
    ],
    contentEn: [
      {
        type: 'paragraph',
        text: 'The four most important irregular French verbs are faire (to do/make), pouvoir (to be able to), vouloir (to want), and prendre (to take). They do not follow standard conjugation patterns and appear in every conversation.',
      },
      {
        type: 'table',
        title: 'Conjugation of irregular verbs',
        headers: ['', 'faire (to do)', 'pouvoir (can)', 'vouloir (to want)', 'prendre (to take)'],
        rows: [
          ['je', 'fais', 'peux', 'veux', 'prends'],
          ['tu', 'fais', 'peux', 'veux', 'prends'],
          ['il / elle', 'fait', 'peut', 'veut', 'prend'],
          ['nous', 'faisons', 'pouvons', 'voulons', 'prenons'],
          ['vous', 'faites', 'pouvez', 'voulez', 'prenez'],
          ['ils / elles', 'font', 'peuvent', 'veulent', 'prennent'],
        ],
      },
      {
        type: 'rule_list',
        title: 'Key points:',
        rules: [
          'faire: nous faisons (not *faisisons), vous faites (irregular form)',
          'pouvoir and vouloir: je/tu forms end in -x (peux/veux), not -s',
          'pouvoir + infinitive: Je peux venir. (I can come.)',
          'vouloir + infinitive: Je veux manger. (I want to eat.)',
          'prendre: ils prennent — double n in the 3rd person plural.',
          'Comprendre and apprendre are conjugated like prendre.',
        ],
      },
      {
        type: 'example_list',
        title: 'Examples',
        items: [
          { fr: 'Qu\'est-ce que tu fais ce soir ?', ru: 'Что ты делаешь сегодня вечером?', en: 'What are you doing tonight?' },
          { fr: 'Je ne peux pas venir demain.', ru: 'Я не могу прийти завтра.', en: 'I cannot come tomorrow.' },
          { fr: 'Vous voulez du café ?', ru: 'Вы хотите кофе?', en: 'Do you want coffee?' },
          { fr: 'Elle prend le bus tous les jours.', ru: 'Она ездит на автобусе каждый день.', en: 'She takes the bus every day.' },
        ],
      },
    ],
  },

  {
    slug: 'cest-il-est',
    titleRu: 'C\'est / Il est — как отличить',
    titleEn: 'C\'est vs Il est',
    titleFr: 'C\'est / Il est',
    category: 'grammar',
    orderNum: 24,
    content: [
      {
        type: 'paragraph',
        text: 'C\'est и il/elle est оба переводятся на русский как «это» или «он/она есть», но их употребление подчиняется чётким правилам. Это одна из самых частых ошибок у изучающих французский.',
      },
      {
        type: 'table',
        title: 'C\'est vs Il/Elle est',
        headers: ['Конструкция', 'Когда используется', 'Пример'],
        rows: [
          ['C\'est + артикль + существительное', 'Указание на что-либо, знакомство', 'C\'est un médecin. (Это врач.)'],
          ['C\'est + имя собственное', 'Называние человека', 'C\'est Marie. (Это Мари.)'],
          ['C\'est + прилагательное', 'Общая оценка ситуации/идеи', 'C\'est intéressant ! (Это интересно!)'],
          ['Il/Elle est + прилагательное', 'Описание конкретного человека/предмета', 'Elle est grande. (Она высокая.)'],
          ['Il/Elle est + профессия (без артикля)', 'Указание на профессию', 'Il est médecin. (Он врач.)'],
          ['C\'est + артикль + профессия', 'Акцент на личности', 'C\'est un bon médecin. (Это хороший врач.)'],
        ],
      },
      {
        type: 'rule_list',
        title: 'Главное правило:',
        rules: [
          'C\'est + АРТИКЛЬ (un, une, le, la, mon...) + существительное',
          'Il/Elle est + ПРИЛАГАТЕЛЬНОЕ без артикля: Il est grand.',
          'Il/Elle est + ПРОФЕССИЯ без артикля: Elle est professeure.',
          'C\'est + ПРИЛАГАТЕЛЬНОЕ = общая оценка: C\'est beau! (Как красиво!)',
          'Во множественном числе: Ce sont des amis. (Это друзья.)',
        ],
      },
      {
        type: 'example_list',
        title: 'Примеры',
        items: [
          { fr: 'C\'est un beau film !', ru: 'Это красивый фильм!', en: 'It\'s a beautiful film!' },
          { fr: 'Il est très intelligent.', ru: 'Он очень умный.', en: 'He is very intelligent.' },
          { fr: 'C\'est difficile d\'apprendre le russe.', ru: 'Сложно учить русский.', en: 'It\'s difficult to learn Russian.' },
          { fr: 'Elle est avocate.', ru: 'Она адвокат.', en: 'She is a lawyer.' },
        ],
      },
    ],
    contentEn: [
      {
        type: 'paragraph',
        text: 'C\'est and il/elle est both translate to "it is" or "he/she is", but their usage follows clear rules. This is one of the most common mistakes for French learners.',
      },
      {
        type: 'table',
        title: 'C\'est vs Il/Elle est',
        headers: ['Structure', 'When to use', 'Example'],
        rows: [
          ['C\'est + article + noun', 'Pointing out, introducing', 'C\'est un médecin. (He\'s a doctor.)'],
          ['C\'est + proper name', 'Naming a person', 'C\'est Marie. (That\'s Marie.)'],
          ['C\'est + adjective', 'General assessment of a situation', 'C\'est intéressant ! (That\'s interesting!)'],
          ['Il/Elle est + adjective', 'Describing a specific person/thing', 'Elle est grande. (She is tall.)'],
          ['Il/Elle est + profession (no article)', 'Stating a profession', 'Il est médecin. (He is a doctor.)'],
          ['C\'est + article + profession', 'Emphasizing the person', 'C\'est un bon médecin. (He\'s a good doctor.)'],
        ],
      },
      {
        type: 'rule_list',
        title: 'Key rule:',
        rules: [
          'C\'est + ARTICLE (un, une, le, la, mon...) + noun',
          'Il/Elle est + ADJECTIVE without article: Il est grand.',
          'Il/Elle est + PROFESSION without article: Elle est professeure.',
          'C\'est + ADJECTIVE = general comment: C\'est beau! (How beautiful!)',
          'Plural: Ce sont des amis. (These are friends.)',
        ],
      },
      {
        type: 'example_list',
        title: 'Examples',
        items: [
          { fr: 'C\'est un beau film !', ru: 'Это красивый фильм!', en: 'It\'s a beautiful film!' },
          { fr: 'Il est très intelligent.', ru: 'Он очень умный.', en: 'He is very intelligent.' },
          { fr: 'C\'est difficile d\'apprendre le russe.', ru: 'Сложно учить русский.', en: 'It\'s difficult to learn Russian.' },
          { fr: 'Elle est avocate.', ru: 'Она адвокат.', en: 'She is a lawyer.' },
        ],
      },
    ],
  },

  {
    slug: 'mots-interrogatifs',
    titleRu: 'Вопросительные слова',
    titleEn: 'Question Words',
    titleFr: 'Les mots interrogatifs',
    category: 'grammar',
    orderNum: 25,
    content: [
      {
        type: 'paragraph',
        text: 'Вопросительные слова указывают, какую информацию мы запрашиваем. Используются в начале вопроса — с конструкцией est-ce que или с инверсией.',
      },
      {
        type: 'table',
        title: 'Вопросительные слова',
        headers: ['Слово', 'Перевод', 'Пример'],
        rows: [
          ['où', 'где / куда', 'Où habites-tu ? — Где ты живёшь?'],
          ['quand', 'когда', 'Quand est-ce que tu pars ? — Когда ты уезжаешь?'],
          ['comment', 'как', 'Comment vas-tu ? — Как ты поживаешь?'],
          ['pourquoi', 'почему', 'Pourquoi tu pleures ? — Почему ты плачешь?'],
          ['combien (de)', 'сколько', 'Combien ça coûte ? — Сколько это стоит?'],
          ['qui', 'кто', 'Qui est-ce ? — Кто это?'],
          ['que / qu\'', 'что', 'Qu\'est-ce que tu fais ? — Что ты делаешь?'],
          ['quel / quelle', 'какой / какая', 'Quel âge as-tu ? — Сколько тебе лет?'],
        ],
      },
      {
        type: 'rule_list',
        title: 'Как строить вопрос:',
        rules: [
          'С est-ce que (разговорный стиль): Où est-ce que tu habites ?',
          'С инверсией (формальный стиль): Où habitez-vous ?',
          'Неформально — вопросительное слово в конце: Tu habites où ?',
          'combien de + существительное: Combien de frères as-tu ? (Сколько у тебя братьев?)',
          'quel согласуется с существительным: Quelle heure est-il ? / Quels livres lis-tu ?',
        ],
      },
      {
        type: 'example_list',
        title: 'Примеры',
        items: [
          { fr: 'Comment vous appelez-vous ?', ru: 'Как вас зовут?', en: 'What is your name?' },
          { fr: 'Pourquoi est-ce que tu es en retard ?', ru: 'Почему ты опоздал?', en: 'Why are you late?' },
          { fr: 'Combien de langues parles-tu ?', ru: 'На скольких языках ты говоришь?', en: 'How many languages do you speak?' },
          { fr: 'Quelle est ta couleur préférée ?', ru: 'Какой твой любимый цвет?', en: 'What is your favourite colour?' },
        ],
      },
    ],
    contentEn: [
      {
        type: 'paragraph',
        text: 'Question words indicate what type of information is being requested. They are placed at the beginning of the question — with est-ce que or with inversion.',
      },
      {
        type: 'table',
        title: 'Question words',
        headers: ['Word', 'Meaning', 'Example'],
        rows: [
          ['où', 'where', 'Où habites-tu ? — Where do you live?'],
          ['quand', 'when', 'Quand est-ce que tu pars ? — When are you leaving?'],
          ['comment', 'how', 'Comment vas-tu ? — How are you?'],
          ['pourquoi', 'why', 'Pourquoi tu pleures ? — Why are you crying?'],
          ['combien (de)', 'how much / how many', 'Combien ça coûte ? — How much does it cost?'],
          ['qui', 'who', 'Qui est-ce ? — Who is it?'],
          ['que / qu\'', 'what', 'Qu\'est-ce que tu fais ? — What are you doing?'],
          ['quel / quelle', 'which / what', 'Quel âge as-tu ? — How old are you?'],
        ],
      },
      {
        type: 'rule_list',
        title: 'How to form questions:',
        rules: [
          'With est-ce que (informal): Où est-ce que tu habites?',
          'With inversion (formal): Où habitez-vous?',
          'Informal — question word at the end: Tu habites où?',
          'combien de + noun: Combien de frères as-tu? (How many brothers do you have?)',
          'quel agrees with the noun: Quelle heure est-il? / Quels livres lis-tu?',
        ],
      },
      {
        type: 'example_list',
        title: 'Examples',
        items: [
          { fr: 'Comment vous appelez-vous ?', ru: 'Как вас зовут?', en: 'What is your name?' },
          { fr: 'Pourquoi est-ce que tu es en retard ?', ru: 'Почему ты опоздал?', en: 'Why are you late?' },
          { fr: 'Combien de langues parles-tu ?', ru: 'На скольких языках ты говоришь?', en: 'How many languages do you speak?' },
          { fr: 'Quelle est ta couleur préférée ?', ru: 'Какой твой любимый цвет?', en: 'What is your favourite colour?' },
        ],
      },
    ],
  },
];
