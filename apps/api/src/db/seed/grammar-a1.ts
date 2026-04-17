// Grammar topics A1 with exercises

export interface GrammarContentBlock {
  type: 'paragraph' | 'table' | 'example_list' | 'rule_list';
  title?: string;
  text?: string;
  headers?: string[];
  rows?: string[][];
  items?: Array<{ fr: string; ru: string; en?: string; note?: string }>;
  rules?: string[];
}

export interface GrammarTopic {
  slug: string;
  titleRu: string;
  titleEn: string;
  titleFr: string;
  category: string;
  orderNum: number;
  content: GrammarContentBlock[];
  contentEn: GrammarContentBlock[];
}

export interface GrammarExercise {
  topicSlug: string;
  type: 'fill_blank' | 'multiple_choice' | 'reorder' | 'translate';
  question: unknown;
  answer: unknown;
  explanation?: string;
  explanationEn?: string;
}

export const grammarTopicsA1: GrammarTopic[] = [
  {
    slug: 'articles-definite',
    titleRu: 'Определённый артикль',
    titleEn: 'The Definite Article',
    titleFr: 'L\'article défini',
    category: 'articles',
    orderNum: 1,
    content: [
      {
        type: 'paragraph',
        text: 'Определённый артикль во французском языке указывает на конкретный, известный предмет. Он изменяется по роду и числу существительного.',
      },
      {
        type: 'table',
        title: 'Формы определённого артикля',
        headers: ['', 'Мужской род', 'Женский род', 'Множественное число'],
        rows: [
          ['Перед согласной', 'le (le chat)', 'la (la maison)', 'les (les enfants)'],
          ['Перед гласной/h', 'l\' (l\'arbre)', 'l\' (l\'école)', 'les (les arbres)'],
        ],
      },
      {
        type: 'rule_list',
        title: 'Когда используется определённый артикль:',
        rules: [
          'Когда предмет уже упоминался или известен обоим собеседникам: Le livre est sur la table. (Книга на столе.)',
          'С существительными в общем смысле: J\'aime le café. (Я люблю кофе — вообще.)',
          'С названиями языков и наук: Le français est beau. (Французский красив.)',
          'С днями недели в повторяющемся смысле: Le lundi, je travaille. (По понедельникам я работаю.)',
        ],
      },
      {
        type: 'example_list',
        title: 'Примеры',
        items: [
          { fr: 'Le chien aboie.', ru: 'Собака лает.', en: 'The dog barks.' },
          { fr: 'La fille chante.', ru: 'Девочка поёт.', en: 'The girl sings.' },
          { fr: 'Les enfants jouent.', ru: 'Дети играют.', en: 'The children play.' },
          { fr: 'J\'aime l\'été.', ru: 'Я люблю лето.', en: 'I love summer.' },
        ],
      },
    ],
    contentEn: [
      {
        type: 'paragraph',
        text: 'The definite article in French refers to a specific, known noun. It changes depending on the gender and number of the noun.',
      },
      {
        type: 'table',
        title: 'Forms of the definite article',
        headers: ['', 'Masculine', 'Feminine', 'Plural'],
        rows: [
          ['Before consonant', 'le (le chat)', 'la (la maison)', 'les (les enfants)'],
          ['Before vowel/h', 'l\' (l\'arbre)', 'l\' (l\'école)', 'les (les arbres)'],
        ],
      },
      {
        type: 'rule_list',
        title: 'When to use the definite article:',
        rules: [
          'When the noun has already been mentioned or is known to both speakers: Le livre est sur la table. (The book is on the table.)',
          'With nouns used in a general sense: J\'aime le café. (I like coffee — in general.)',
          'With names of languages and sciences: Le français est beau. (French is beautiful.)',
          'With days of the week expressing habitual actions: Le lundi, je travaille. (On Mondays, I work.)',
        ],
      },
      {
        type: 'example_list',
        title: 'Examples',
        items: [
          { fr: 'Le chien aboie.', ru: 'Собака лает.', en: 'The dog barks.' },
          { fr: 'La fille chante.', ru: 'Девочка поёт.', en: 'The girl sings.' },
          { fr: 'Les enfants jouent.', ru: 'Дети играют.', en: 'The children play.' },
          { fr: 'J\'aime l\'été.', ru: 'Я люблю лето.', en: 'I love summer.' },
        ],
      },
    ],
  },
  {
    slug: 'articles-indefinite',
    titleRu: 'Неопределённый артикль',
    titleEn: 'The Indefinite Article',
    titleFr: 'L\'article indéfini',
    category: 'articles',
    orderNum: 2,
    content: [
      {
        type: 'paragraph',
        text: 'Неопределённый артикль указывает на неизвестный или впервые упоминаемый предмет. Соответствует русским словам «один», «какой-то» или отсутствию артикля.',
      },
      {
        type: 'table',
        title: 'Формы неопределённого артикля',
        headers: ['Мужской род', 'Женский род', 'Множественное число'],
        rows: [
          ['un (un ami)', 'une (une amie)', 'des (des amis)'],
        ],
      },
      {
        type: 'rule_list',
        title: 'Когда используется:',
        rules: [
          'Когда предмет упоминается впервые: J\'ai un chat. (У меня есть кот.)',
          'Когда предмет неизвестен или неважно какой: Je cherche une maison. (Я ищу дом — какой-нибудь.)',
          'В отрицании un/une/des → de (d\'): Je n\'ai pas de chien. (У меня нет собаки.)',
        ],
      },
      {
        type: 'example_list',
        title: 'Примеры',
        items: [
          { fr: 'C\'est un garçon.', ru: 'Это мальчик.', en: 'This is a boy.' },
          { fr: 'J\'ai une sœur.', ru: 'У меня есть сестра.', en: 'I have a sister.' },
          { fr: 'Il y a des fleurs.', ru: 'Есть цветы.', en: 'There are flowers.' },
          { fr: 'Je n\'ai pas d\'animal.', ru: 'У меня нет животного.', en: 'I do not have a pet.' },
        ],
      },
    ],
    contentEn: [
      {
        type: 'paragraph',
        text: 'The indefinite article refers to an unknown or first-mentioned noun. It is similar to "a" or "an" in English.',
      },
      {
        type: 'table',
        title: 'Forms of the indefinite article',
        headers: ['Masculine', 'Feminine', 'Plural'],
        rows: [
          ['un (un ami)', 'une (une amie)', 'des (des amis)'],
        ],
      },
      {
        type: 'rule_list',
        title: 'When to use:',
        rules: [
          'When a noun is mentioned for the first time: J\'ai un chat. (I have a cat.)',
          'When the specific identity does not matter: Je cherche une maison. (I am looking for a house.)',
          'In negation, un/une/des → de (d\'): Je n\'ai pas de chien. (I do not have a dog.)',
        ],
      },
      {
        type: 'example_list',
        title: 'Examples',
        items: [
          { fr: 'C\'est un garçon.', ru: 'Это мальчик.', en: 'This is a boy.' },
          { fr: 'J\'ai une sœur.', ru: 'У меня есть сестра.', en: 'I have a sister.' },
          { fr: 'Il y a des fleurs.', ru: 'Есть цветы.', en: 'There are flowers.' },
          { fr: 'Je n\'ai pas d\'animal.', ru: 'У меня нет животного.', en: 'I do not have a pet.' },
        ],
      },
    ],
  },
  {
    slug: 'articles-partitive',
    titleRu: 'Частичный артикль',
    titleEn: 'The Partitive Article',
    titleFr: 'L\'article partitif',
    category: 'articles',
    orderNum: 3,
    content: [
      {
        type: 'paragraph',
        text: 'Частичный артикль используется с неисчисляемыми существительными, обозначая часть целого, некоторое количество чего-то. В русском переводе чаще всего не переводится или передаётся словами «немного», «какое-то количество».',
      },
      {
        type: 'table',
        title: 'Формы частичного артикля',
        headers: ['Мужской род', 'Женский род', 'Перед гласной'],
        rows: [
          ['du (du pain)', 'de la (de la viande)', 'de l\' (de l\'eau)'],
        ],
      },
      {
        type: 'example_list',
        title: 'Примеры',
        items: [
          { fr: 'Je mange du pain.', ru: 'Я ем хлеб (немного хлеба).', en: 'I eat (some) bread.' },
          { fr: 'Il boit de la bière.', ru: 'Он пьёт пиво.', en: 'He drinks (some) beer.' },
          { fr: 'Tu veux de l\'eau ?', ru: 'Хочешь воды?', en: 'Do you want some water?' },
          { fr: 'Elle a de la patience.', ru: 'У неё есть терпение.', en: 'She has patience.' },
          { fr: 'Je ne mange pas de viande.', ru: 'Я не ем мяса.', en: 'I do not eat meat.' },
        ],
      },
      {
        type: 'rule_list',
        title: 'Важно:',
        rules: [
          'В отрицательных предложениях du/de la/de l\' заменяются на de (d\')',
          'После выражений количества (beaucoup de, un peu de, assez de) артикль не используется: beaucoup de pain (много хлеба)',
        ],
      },
    ],
    contentEn: [
      {
        type: 'paragraph',
        text: 'The partitive article is used with uncountable nouns to indicate an unspecified quantity of something. It is similar to "some" or "any" in English.',
      },
      {
        type: 'table',
        title: 'Forms of the partitive article',
        headers: ['Masculine', 'Feminine', 'Before vowel'],
        rows: [
          ['du (du pain)', 'de la (de la viande)', 'de l\' (de l\'eau)'],
        ],
      },
      {
        type: 'example_list',
        title: 'Examples',
        items: [
          { fr: 'Je mange du pain.', ru: 'Я ем хлеб.', en: 'I eat some bread.' },
          { fr: 'Il boit de la bière.', ru: 'Он пьёт пиво.', en: 'He drinks some beer.' },
          { fr: 'Tu veux de l\'eau ?', ru: 'Хочешь воды?', en: 'Do you want some water?' },
          { fr: 'Elle a de la patience.', ru: 'У неё есть терпение.', en: 'She has patience.' },
          { fr: 'Je ne mange pas de viande.', ru: 'Я не ем мяса.', en: 'I do not eat meat.' },
        ],
      },
      {
        type: 'rule_list',
        title: 'Important:',
        rules: [
          'In negative sentences, du/de la/de l\' change to de (d\')',
          'After quantity expressions (beaucoup de, un peu de, assez de) no article is used: beaucoup de pain (a lot of bread)',
        ],
      },
    ],
  },
  {
    slug: 'nouns-gender',
    titleRu: 'Род существительных',
    titleEn: 'Gender of Nouns',
    titleFr: 'Le genre des noms',
    category: 'nouns',
    orderNum: 4,
    content: [
      {
        type: 'paragraph',
        text: 'Во французском языке все существительные имеют род — мужской (masculin) или женский (féminin). Род часто нужно просто запоминать, но есть типичные окончания.',
      },
      {
        type: 'table',
        title: 'Типичные мужские окончания',
        headers: ['Окончание', 'Пример', 'Перевод'],
        rows: [
          ['-age', 'le village', 'деревня'],
          ['-ment', 'le gouvernement', 'правительство'],
          ['-eur', 'le moteur', 'мотор'],
          ['-isme', 'le tourisme', 'туризм'],
          ['-eau', 'le gâteau', 'торт'],
        ],
      },
      {
        type: 'table',
        title: 'Типичные женские окончания',
        headers: ['Окончание', 'Пример', 'Перевод'],
        rows: [
          ['-tion/-sion', 'la nation', 'нация'],
          ['-té/-tié', 'la liberté', 'свобода'],
          ['-ure', 'la culture', 'культура'],
          ['-ance/-ence', 'la France', 'Франция'],
          ['-ette', 'la baguette', 'багет'],
        ],
      },
      {
        type: 'rule_list',
        title: 'Советы:',
        rules: [
          'Учите слова сразу с артиклем: не просто "table", а "la table"',
          'Слова на -e в большинстве женского рода (но есть исключения!)',
          'Профессии часто имеют мужскую и женскую форму: un acteur / une actrice',
        ],
      },
    ],
    contentEn: [
      {
        type: 'paragraph',
        text: 'In French, all nouns have a gender — masculine (masculin) or feminine (féminin). Gender often needs to be memorised, but typical endings can help.',
      },
      {
        type: 'table',
        title: 'Typical masculine endings',
        headers: ['Ending', 'Example', 'Translation'],
        rows: [
          ['-age', 'le village', 'village'],
          ['-ment', 'le gouvernement', 'government'],
          ['-eur', 'le moteur', 'motor'],
          ['-isme', 'le tourisme', 'tourism'],
          ['-eau', 'le gâteau', 'cake'],
        ],
      },
      {
        type: 'table',
        title: 'Typical feminine endings',
        headers: ['Ending', 'Example', 'Translation'],
        rows: [
          ['-tion/-sion', 'la nation', 'nation'],
          ['-té/-tié', 'la liberté', 'freedom'],
          ['-ure', 'la culture', 'culture'],
          ['-ance/-ence', 'la France', 'France'],
          ['-ette', 'la baguette', 'baguette'],
        ],
      },
      {
        type: 'rule_list',
        title: 'Tips:',
        rules: [
          'Learn words with the article: not just "table" but "la table"',
          'Words ending in -e are mostly feminine (but there are exceptions!)',
          'Professions often have masculine and feminine forms: un acteur / une actrice',
        ],
      },
    ],
  },
  {
    slug: 'nouns-plural',
    titleRu: 'Множественное число существительных',
    titleEn: 'Plural of Nouns',
    titleFr: 'Le pluriel des noms',
    category: 'nouns',
    orderNum: 5,
    content: [
      {
        type: 'paragraph',
        text: 'Как правило, множественное число образуется добавлением -s к единственному числу. Но есть исключения.',
      },
      {
        type: 'table',
        title: 'Правила образования множественного числа',
        headers: ['Окончание ед.ч.', 'Окончание мн.ч.', 'Пример'],
        rows: [
          ['большинство слов', '+s', 'chat → chats'],
          ['-s, -x, -z', 'не меняется', 'bras → bras, voix → voix'],
          ['-au, -eau, -eu', '+x', 'gâteau → gâteaux, feu → feux'],
          ['-al', '-aux', 'animal → animaux'],
          ['-ail', '-aux (нерег.)', 'travail → travaux'],
        ],
      },
      {
        type: 'example_list',
        title: 'Примеры',
        items: [
          { fr: 'un livre → des livres', ru: 'книга → книги', en: 'book → books' },
          { fr: 'un chapeau → des chapeaux', ru: 'шляпа → шляпы', en: 'hat → hats' },
          { fr: 'un cheval → des chevaux', ru: 'лошадь → лошади', en: 'horse → horses' },
          { fr: 'un œil → des yeux', ru: 'глаз → глаза (неправильное)', en: 'eye → eyes (irregular)' },
        ],
      },
    ],
    contentEn: [
      {
        type: 'paragraph',
        text: 'In general, the plural is formed by adding -s to the singular form. But there are exceptions.',
      },
      {
        type: 'table',
        title: 'Rules for forming the plural',
        headers: ['Singular ending', 'Plural ending', 'Example'],
        rows: [
          ['most words', '+s', 'chat → chats'],
          ['-s, -x, -z', 'no change', 'bras → bras, voix → voix'],
          ['-au, -eau, -eu', '+x', 'gâteau → gâteaux, feu → feux'],
          ['-al', '-aux', 'animal → animaux'],
          ['-ail', '-aux (irregular)', 'travail → travaux'],
        ],
      },
      {
        type: 'example_list',
        title: 'Examples',
        items: [
          { fr: 'un livre → des livres', ru: 'книга → книги', en: 'book → books' },
          { fr: 'un chapeau → des chapeaux', ru: 'шляпа → шляпы', en: 'hat → hats' },
          { fr: 'un cheval → des chevaux', ru: 'лошадь → лошади', en: 'horse → horses' },
          { fr: 'un œil → des yeux', ru: 'глаз → глаза', en: 'eye → eyes (irregular)' },
        ],
      },
    ],
  },
  {
    slug: 'adjectives-agreement',
    titleRu: 'Согласование прилагательных',
    titleEn: 'Adjective Agreement',
    titleFr: 'L\'accord des adjectifs',
    category: 'adjectives',
    orderNum: 6,
    content: [
      {
        type: 'paragraph',
        text: 'Французские прилагательные согласуются с существительным в роде и числе. Основные правила: к мужской форме добавляем -e для женского рода, -s для множественного числа.',
      },
      {
        type: 'table',
        title: 'Основные формы',
        headers: ['', 'Мужской ед.ч.', 'Женский ед.ч.', 'Мужской мн.ч.', 'Женский мн.ч.'],
        rows: [
          ['Стандарт', 'grand', 'grande', 'grands', 'grandes'],
          ['На -e', 'jeune', 'jeune', 'jeunes', 'jeunes'],
          ['На -eux', 'heureux', 'heureuse', 'heureux', 'heureuses'],
          ['Неправильные', 'beau', 'belle', 'beaux', 'belles'],
          ['Неправильные', 'bon', 'bonne', 'bons', 'bonnes'],
        ],
      },
      {
        type: 'rule_list',
        title: 'Место прилагательного:',
        rules: [
          'Большинство прилагательных стоят ПОСЛЕ существительного: une maison blanche',
          'Короткие частые прилагательные — ПЕРЕД: un beau jardin, une grande maison, un petit chat',
          'BAGS (Beauty, Age, Goodness, Size): beau, joli, vieux, jeune, bon, mauvais, grand, petit — стоят перед существительным',
        ],
      },
      {
        type: 'example_list',
        title: 'Примеры',
        items: [
          { fr: 'un ami fidèle / une amie fidèle', ru: 'верный друг / верная подруга', en: 'a loyal friend (m/f)' },
          { fr: 'un beau garçon / une belle fille', ru: 'красивый парень / красивая девушка', en: 'a handsome boy / a beautiful girl' },
          { fr: 'des enfants heureux', ru: 'счастливые дети', en: 'happy children' },
        ],
      },
    ],
    contentEn: [
      {
        type: 'paragraph',
        text: 'French adjectives agree with the noun in gender and number. The main rule: add -e for feminine, -s for plural.',
      },
      {
        type: 'table',
        title: 'Basic forms',
        headers: ['', 'Masc. sing.', 'Fem. sing.', 'Masc. pl.', 'Fem. pl.'],
        rows: [
          ['Standard', 'grand', 'grande', 'grands', 'grandes'],
          ['Ending in -e', 'jeune', 'jeune', 'jeunes', 'jeunes'],
          ['Ending in -eux', 'heureux', 'heureuse', 'heureux', 'heureuses'],
          ['Irregular', 'beau', 'belle', 'beaux', 'belles'],
          ['Irregular', 'bon', 'bonne', 'bons', 'bonnes'],
        ],
      },
      {
        type: 'rule_list',
        title: 'Position of adjectives:',
        rules: [
          'Most adjectives come AFTER the noun: une maison blanche (a white house)',
          'Short common adjectives come BEFORE: un beau jardin, une grande maison, un petit chat',
          'BAGS adjectives (Beauty, Age, Goodness, Size): beau, joli, vieux, jeune, bon, mauvais, grand, petit — placed before the noun',
        ],
      },
      {
        type: 'example_list',
        title: 'Examples',
        items: [
          { fr: 'un ami fidèle / une amie fidèle', ru: 'верный друг / верная подруга', en: 'a loyal friend (m/f)' },
          { fr: 'un beau garçon / une belle fille', ru: 'красивый парень / красивая девушка', en: 'a handsome boy / a beautiful girl' },
          { fr: 'des enfants heureux', ru: 'счастливые дети', en: 'happy children' },
        ],
      },
    ],
  },
  {
    slug: 'pronouns-personal',
    titleRu: 'Личные местоимения',
    titleEn: 'Personal Pronouns',
    titleFr: 'Les pronoms personnels',
    category: 'pronouns',
    orderNum: 7,
    content: [
      {
        type: 'paragraph',
        text: 'Личные местоимения во французском языке обязательны — предложение без подлежащего невозможно (в отличие от русского). Всегда нужно явно указывать подлежащее.',
      },
      {
        type: 'table',
        title: 'Местоимения-подлежащие',
        headers: ['Местоимение', 'Перевод', 'Пример'],
        rows: [
          ['je (j\')', 'я', 'Je parle français.'],
          ['tu', 'ты', 'Tu es étudiant.'],
          ['il / elle / on', 'он / она / мы (неформ.)', 'Il est grand.'],
          ['nous', 'мы', 'Nous mangeons.'],
          ['vous', 'вы / Вы (вежл.)', 'Vous parlez vite.'],
          ['ils / elles', 'они (м/ж)', 'Ils arrivent.'],
        ],
      },
      {
        type: 'rule_list',
        title: 'Важные нюансы:',
        rules: [
          'On очень часто используется вместо nous в разговорной речи: On va au cinéma. = Мы идём в кино.',
          'Vous используется как форма вежливости к одному человеку',
          'Ils используется для группы, в которой есть хотя бы один мужчина',
          'je → j\' перед гласной: j\'aime, j\'habite',
        ],
      },
    ],
    contentEn: [
      {
        type: 'paragraph',
        text: 'Subject pronouns in French are mandatory — a sentence without a subject is impossible. You must always explicitly state the subject.',
      },
      {
        type: 'table',
        title: 'Subject pronouns',
        headers: ['Pronoun', 'Translation', 'Example'],
        rows: [
          ['je (j\')', 'I', 'Je parle français.'],
          ['tu', 'you (informal)', 'Tu es étudiant.'],
          ['il / elle / on', 'he / she / we (informal)', 'Il est grand.'],
          ['nous', 'we', 'Nous mangeons.'],
          ['vous', 'you (formal/plural)', 'Vous parlez vite.'],
          ['ils / elles', 'they (m/f)', 'Ils arrivent.'],
        ],
      },
      {
        type: 'rule_list',
        title: 'Important notes:',
        rules: [
          'On is very commonly used instead of nous in spoken French: On va au cinéma. = We are going to the cinema.',
          'Vous is used as a polite form when addressing one person',
          'Ils is used for a group containing at least one male',
          'je → j\' before a vowel: j\'aime, j\'habite',
        ],
      },
    ],
  },
  {
    slug: 'verbs-etre-avoir',
    titleRu: 'Глаголы être и avoir',
    titleEn: 'The Verbs être and avoir',
    titleFr: 'Les verbes être et avoir',
    category: 'verbs',
    orderNum: 8,
    content: [
      {
        type: 'paragraph',
        text: 'Глаголы être (быть) и avoir (иметь) — самые важные во французском. Они неправильные и используются также как вспомогательные для образования прошедшего времени.',
      },
      {
        type: 'table',
        title: 'Спряжение être (быть) в настоящем времени',
        headers: ['Местоимение', 'Форма', 'Перевод'],
        rows: [
          ['je', 'suis', 'я есмь / я'],
          ['tu', 'es', 'ты'],
          ['il/elle/on', 'est', 'он/она'],
          ['nous', 'sommes', 'мы'],
          ['vous', 'êtes', 'вы'],
          ['ils/elles', 'sont', 'они'],
        ],
      },
      {
        type: 'table',
        title: 'Спряжение avoir (иметь) в настоящем времени',
        headers: ['Местоимение', 'Форма', 'Перевод'],
        rows: [
          ['je', 'ai', 'у меня есть'],
          ['tu', 'as', 'у тебя есть'],
          ['il/elle/on', 'a', 'у него/неё есть'],
          ['nous', 'avons', 'у нас есть'],
          ['vous', 'avez', 'у вас есть'],
          ['ils/elles', 'ont', 'у них есть'],
        ],
      },
      {
        type: 'example_list',
        title: 'Примеры',
        items: [
          { fr: 'Je suis étudiant.', ru: 'Я студент.', en: 'I am a student.' },
          { fr: 'Elle est française.', ru: 'Она француженка.', en: 'She is French.' },
          { fr: 'Nous sommes amis.', ru: 'Мы друзья.', en: 'We are friends.' },
          { fr: 'J\'ai un chat.', ru: 'У меня есть кот.', en: 'I have a cat.' },
          { fr: 'Tu as faim ?', ru: 'Ты голоден?', en: 'Are you hungry?' },
          { fr: 'Ils ont deux enfants.', ru: 'У них двое детей.', en: 'They have two children.' },
        ],
      },
    ],
    contentEn: [
      {
        type: 'paragraph',
        text: 'The verbs être (to be) and avoir (to have) are the most important in French. They are irregular and also used as auxiliary verbs to form the past tense.',
      },
      {
        type: 'table',
        title: 'Conjugation of être (to be) in the present tense',
        headers: ['Pronoun', 'Form', 'Translation'],
        rows: [
          ['je', 'suis', 'I am'],
          ['tu', 'es', 'you are'],
          ['il/elle/on', 'est', 'he/she is'],
          ['nous', 'sommes', 'we are'],
          ['vous', 'êtes', 'you are'],
          ['ils/elles', 'sont', 'they are'],
        ],
      },
      {
        type: 'table',
        title: 'Conjugation of avoir (to have) in the present tense',
        headers: ['Pronoun', 'Form', 'Translation'],
        rows: [
          ['je', 'ai', 'I have'],
          ['tu', 'as', 'you have'],
          ['il/elle/on', 'a', 'he/she has'],
          ['nous', 'avons', 'we have'],
          ['vous', 'avez', 'you have'],
          ['ils/elles', 'ont', 'they have'],
        ],
      },
      {
        type: 'example_list',
        title: 'Examples',
        items: [
          { fr: 'Je suis étudiant.', ru: 'Я студент.', en: 'I am a student.' },
          { fr: 'Elle est française.', ru: 'Она француженка.', en: 'She is French.' },
          { fr: 'Nous sommes amis.', ru: 'Мы друзья.', en: 'We are friends.' },
          { fr: 'J\'ai un chat.', ru: 'У меня есть кот.', en: 'I have a cat.' },
          { fr: 'Tu as faim ?', ru: 'Ты голоден?', en: 'Are you hungry?' },
          { fr: 'Ils ont deux enfants.', ru: 'У них двое детей.', en: 'They have two children.' },
        ],
      },
    ],
  },
  {
    slug: 'verbs-present-regular',
    titleRu: 'Настоящее время. Правильные глаголы',
    titleEn: 'Present Tense — Regular Verbs',
    titleFr: 'Le présent de l\'indicatif — verbes réguliers',
    category: 'verbs',
    orderNum: 9,
    content: [
      {
        type: 'paragraph',
        text: 'Французские правильные глаголы делятся на три группы по инфинитивному окончанию: -er (1 группа), -ir (2 группа), -re (3 группа). Большинство глаголов — первой группы.',
      },
      {
        type: 'table',
        title: 'Глаголы 1 группы (-er): parler — говорить',
        headers: ['Местоимение', 'Окончание', 'Форма'],
        rows: [
          ['je', '-e', 'parle'],
          ['tu', '-es', 'parles'],
          ['il/elle/on', '-e', 'parle'],
          ['nous', '-ons', 'parlons'],
          ['vous', '-ez', 'parlez'],
          ['ils/elles', '-ent', 'parlent'],
        ],
      },
      {
        type: 'table',
        title: 'Глаголы 2 группы (-ir): finir — заканчивать',
        headers: ['Местоимение', 'Окончание', 'Форма'],
        rows: [
          ['je', '-is', 'finis'],
          ['tu', '-is', 'finis'],
          ['il/elle/on', '-it', 'finit'],
          ['nous', '-issons', 'finissons'],
          ['vous', '-issez', 'finissez'],
          ['ils/elles', '-issent', 'finissent'],
        ],
      },
      {
        type: 'example_list',
        title: 'Частые глаголы 1 группы',
        items: [
          { fr: 'parler', ru: 'говорить', en: 'to speak' },
          { fr: 'manger', ru: 'есть', en: 'to eat' },
          { fr: 'aimer', ru: 'любить', en: 'to love/like' },
          { fr: 'habiter', ru: 'жить', en: 'to live' },
          { fr: 'travailler', ru: 'работать', en: 'to work' },
          { fr: 'regarder', ru: 'смотреть', en: 'to watch' },
        ],
      },
    ],
    contentEn: [
      {
        type: 'paragraph',
        text: 'Regular French verbs are divided into three groups based on their infinitive ending: -er (group 1), -ir (group 2), -re (group 3). The majority of French verbs belong to group 1.',
      },
      {
        type: 'table',
        title: 'Group 1 verbs (-er): parler — to speak',
        headers: ['Pronoun', 'Ending', 'Form'],
        rows: [
          ['je', '-e', 'parle'],
          ['tu', '-es', 'parles'],
          ['il/elle/on', '-e', 'parle'],
          ['nous', '-ons', 'parlons'],
          ['vous', '-ez', 'parlez'],
          ['ils/elles', '-ent', 'parlent'],
        ],
      },
      {
        type: 'table',
        title: 'Group 2 verbs (-ir): finir — to finish',
        headers: ['Pronoun', 'Ending', 'Form'],
        rows: [
          ['je', '-is', 'finis'],
          ['tu', '-is', 'finis'],
          ['il/elle/on', '-it', 'finit'],
          ['nous', '-issons', 'finissons'],
          ['vous', '-issez', 'finissez'],
          ['ils/elles', '-issent', 'finissent'],
        ],
      },
      {
        type: 'example_list',
        title: 'Common group 1 verbs',
        items: [
          { fr: 'parler', ru: 'говорить', en: 'to speak' },
          { fr: 'manger', ru: 'есть', en: 'to eat' },
          { fr: 'aimer', ru: 'любить', en: 'to love/like' },
          { fr: 'habiter', ru: 'жить', en: 'to live' },
          { fr: 'travailler', ru: 'работать', en: 'to work' },
          { fr: 'regarder', ru: 'смотреть', en: 'to watch' },
        ],
      },
    ],
  },
  {
    slug: 'verbs-aller-venir',
    titleRu: 'Глаголы aller и venir',
    titleEn: 'The Verbs aller and venir',
    titleFr: 'Les verbes aller et venir',
    category: 'verbs',
    orderNum: 10,
    content: [
      {
        type: 'paragraph',
        text: 'Aller (идти, ехать) и venir (приходить, приезжать) — важнейшие неправильные глаголы. Aller также используется для образования будущего времени.',
      },
      {
        type: 'table',
        title: 'Спряжение aller (идти/ехать)',
        headers: ['Местоимение', 'Форма'],
        rows: [
          ['je', 'vais'],
          ['tu', 'vas'],
          ['il/elle/on', 'va'],
          ['nous', 'allons'],
          ['vous', 'allez'],
          ['ils/elles', 'vont'],
        ],
      },
      {
        type: 'table',
        title: 'Спряжение venir (приходить)',
        headers: ['Местоимение', 'Форма'],
        rows: [
          ['je', 'viens'],
          ['tu', 'viens'],
          ['il/elle/on', 'vient'],
          ['nous', 'venons'],
          ['vous', 'venez'],
          ['ils/elles', 'viennent'],
        ],
      },
      {
        type: 'rule_list',
        title: 'Futur proche (ближайшее будущее):',
        rules: [
          'aller + инфинитив = собираться что-то сделать',
          'Je vais manger. = Я собираюсь поесть / Я сейчас поем.',
          'Nous allons partir demain. = Мы уедем завтра.',
        ],
      },
      {
        type: 'example_list',
        title: 'Примеры',
        items: [
          { fr: 'Je vais au cinéma.', ru: 'Я иду в кино.', en: 'I am going to the cinema.' },
          { fr: 'Elle va bien.', ru: 'Она в порядке / Ей хорошо.', en: 'She is doing well.' },
          { fr: 'Tu viens avec moi ?', ru: 'Ты идёшь со мной?', en: 'Are you coming with me?' },
          { fr: 'Ils vont partir.', ru: 'Они собираются уехать.', en: 'They are going to leave.' },
        ],
      },
    ],
    contentEn: [
      {
        type: 'paragraph',
        text: 'Aller (to go) and venir (to come) are essential irregular verbs. Aller is also used to form the near future tense.',
      },
      {
        type: 'table',
        title: 'Conjugation of aller (to go)',
        headers: ['Pronoun', 'Form'],
        rows: [
          ['je', 'vais'],
          ['tu', 'vas'],
          ['il/elle/on', 'va'],
          ['nous', 'allons'],
          ['vous', 'allez'],
          ['ils/elles', 'vont'],
        ],
      },
      {
        type: 'table',
        title: 'Conjugation of venir (to come)',
        headers: ['Pronoun', 'Form'],
        rows: [
          ['je', 'viens'],
          ['tu', 'viens'],
          ['il/elle/on', 'vient'],
          ['nous', 'venons'],
          ['vous', 'venez'],
          ['ils/elles', 'viennent'],
        ],
      },
      {
        type: 'rule_list',
        title: 'Futur proche (near future):',
        rules: [
          'aller + infinitive = going to do something',
          'Je vais manger. = I am going to eat.',
          'Nous allons partir demain. = We are going to leave tomorrow.',
        ],
      },
      {
        type: 'example_list',
        title: 'Examples',
        items: [
          { fr: 'Je vais au cinéma.', ru: 'Я иду в кино.', en: 'I am going to the cinema.' },
          { fr: 'Elle va bien.', ru: 'Она в порядке.', en: 'She is doing well.' },
          { fr: 'Tu viens avec moi ?', ru: 'Ты идёшь со мной?', en: 'Are you coming with me?' },
          { fr: 'Ils vont partir.', ru: 'Они собираются уехать.', en: 'They are going to leave.' },
        ],
      },
    ],
  },
  {
    slug: 'negation',
    titleRu: 'Отрицание',
    titleEn: 'Negation',
    titleFr: 'La négation',
    category: 'grammar',
    orderNum: 11,
    content: [
      {
        type: 'paragraph',
        text: 'Основное отрицание во французском строится с помощью ne...pas, которые "обрамляют" глагол. В разговорной речи ne часто опускается.',
      },
      {
        type: 'table',
        title: 'Виды отрицания',
        headers: ['Конструкция', 'Значение', 'Пример'],
        rows: [
          ['ne...pas', 'не', 'Je ne parle pas anglais.'],
          ['ne...plus', 'больше не', 'Il ne fume plus.'],
          ['ne...jamais', 'никогда не', 'Elle ne ment jamais.'],
          ['ne...rien', 'ничего не', 'Je ne vois rien.'],
          ['ne...personne', 'никто', 'Je ne connais personne.'],
          ['ne...que', 'только', 'Je n\'ai que dix euros.'],
        ],
      },
      {
        type: 'rule_list',
        title: 'Правила:',
        rules: [
          'ne → n\' перед гласной: Je n\'aime pas.',
          'В составном времени: Je n\'ai pas mangé. (ne и pas обрамляют вспомогательный глагол)',
          'В разговорной речи: J\'ai pas faim. (ne опускается)',
          'После отрицания un/une/des → de: J\'ai un chien → Je n\'ai pas de chien.',
        ],
      },
    ],
    contentEn: [
      {
        type: 'paragraph',
        text: 'The main negation in French uses ne...pas, which "wraps around" the verb. In spoken French, ne is often dropped.',
      },
      {
        type: 'table',
        title: 'Types of negation',
        headers: ['Construction', 'Meaning', 'Example'],
        rows: [
          ['ne...pas', 'not', 'Je ne parle pas anglais.'],
          ['ne...plus', 'no longer', 'Il ne fume plus.'],
          ['ne...jamais', 'never', 'Elle ne ment jamais.'],
          ['ne...rien', 'nothing', 'Je ne vois rien.'],
          ['ne...personne', 'nobody', 'Je ne connais personne.'],
          ['ne...que', 'only', 'Je n\'ai que dix euros.'],
        ],
      },
      {
        type: 'rule_list',
        title: 'Rules:',
        rules: [
          'ne → n\' before a vowel: Je n\'aime pas.',
          'In compound tenses: Je n\'ai pas mangé. (ne and pas surround the auxiliary verb)',
          'In spoken French: J\'ai pas faim. (ne is dropped)',
          'After negation, un/une/des → de: J\'ai un chien → Je n\'ai pas de chien.',
        ],
      },
    ],
  },
  {
    slug: 'questions',
    titleRu: 'Вопросительные предложения',
    titleEn: 'Questions',
    titleFr: 'Les phrases interrogatives',
    category: 'grammar',
    orderNum: 12,
    content: [
      {
        type: 'paragraph',
        text: 'Во французском языке есть три способа задать вопрос: интонацией, с est-ce que, или инверсией (перестановкой). В разговорной речи чаще используют первые два.',
      },
      {
        type: 'table',
        title: 'Способы задать вопрос',
        headers: ['Способ', 'Пример', 'Стиль'],
        rows: [
          ['Интонация (↑)', 'Tu parles français ?', 'разговорный'],
          ['Est-ce que...', 'Est-ce que tu parles français ?', 'нейтральный'],
          ['Инверсия', 'Parles-tu français ?', 'формальный/письменный'],
        ],
      },
      {
        type: 'table',
        title: 'Вопросительные слова',
        headers: ['Слово', 'Перевод', 'Пример'],
        rows: [
          ['qui', 'кто', 'Qui est là ?'],
          ['que / qu\'est-ce que', 'что', 'Qu\'est-ce que tu veux ?'],
          ['où', 'где / куда', 'Où tu vas ?'],
          ['quand', 'когда', 'Quand tu arrives ?'],
          ['comment', 'как', 'Comment ça va ?'],
          ['pourquoi', 'почему', 'Pourquoi tu pleures ?'],
          ['combien', 'сколько', 'Combien ça coûte ?'],
          ['quel(le)', 'какой/какая', 'Quelle heure est-il ?'],
        ],
      },
    ],
    contentEn: [
      {
        type: 'paragraph',
        text: 'In French there are three ways to ask a question: by intonation, with est-ce que, or by inversion. In spoken French the first two are most common.',
      },
      {
        type: 'table',
        title: 'Ways to ask a question',
        headers: ['Method', 'Example', 'Register'],
        rows: [
          ['Intonation (↑)', 'Tu parles français ?', 'informal'],
          ['Est-ce que...', 'Est-ce que tu parles français ?', 'neutral'],
          ['Inversion', 'Parles-tu français ?', 'formal/written'],
        ],
      },
      {
        type: 'table',
        title: 'Question words',
        headers: ['Word', 'Translation', 'Example'],
        rows: [
          ['qui', 'who', 'Qui est là ?'],
          ['que / qu\'est-ce que', 'what', 'Qu\'est-ce que tu veux ?'],
          ['où', 'where', 'Où tu vas ?'],
          ['quand', 'when', 'Quand tu arrives ?'],
          ['comment', 'how', 'Comment ça va ?'],
          ['pourquoi', 'why', 'Pourquoi tu pleures ?'],
          ['combien', 'how much/many', 'Combien ça coûte ?'],
          ['quel(le)', 'which/what', 'Quelle heure est-il ?'],
        ],
      },
    ],
  },
  {
    slug: 'prepositions-place',
    titleRu: 'Предлоги места',
    titleEn: 'Prepositions of Place',
    titleFr: 'Les prépositions de lieu',
    category: 'prepositions',
    orderNum: 13,
    content: [
      {
        type: 'paragraph',
        text: 'Предлоги места описывают расположение предметов относительно друг друга.',
      },
      {
        type: 'table',
        title: 'Основные предлоги места',
        headers: ['Предлог', 'Перевод', 'Пример'],
        rows: [
          ['dans', 'в (внутри)', 'Le chat est dans la boîte.'],
          ['sur', 'на', 'Le livre est sur la table.'],
          ['sous', 'под', 'Le chien est sous le lit.'],
          ['devant', 'перед', 'Il attend devant la porte.'],
          ['derrière', 'за, позади', 'Le jardin est derrière la maison.'],
          ['à côté de', 'рядом с', 'La boulangerie est à côté de l\'école.'],
          ['en face de', 'напротив', 'La banque est en face de la poste.'],
          ['entre', 'между', 'Le café est entre la banque et la pharmacie.'],
          ['près de', 'близко от', 'J\'habite près de la gare.'],
          ['loin de', 'далеко от', 'C\'est loin du centre.'],
        ],
      },
      {
        type: 'rule_list',
        title: 'Предлоги с городами и странами:',
        rules: [
          'à + город: Je suis à Paris. (Я в Париже.)',
          'en + женская страна: Je vis en France. (Я живу во Франции.)',
          'au + мужская страна: Il est au Canada.',
          'aux + страна во мн.ч.: Ils sont aux États-Unis.',
        ],
      },
    ],
    contentEn: [
      {
        type: 'paragraph',
        text: 'Prepositions of place describe the location of objects in relation to each other.',
      },
      {
        type: 'table',
        title: 'Main prepositions of place',
        headers: ['Preposition', 'Translation', 'Example'],
        rows: [
          ['dans', 'in, inside', 'Le chat est dans la boîte.'],
          ['sur', 'on', 'Le livre est sur la table.'],
          ['sous', 'under', 'Le chien est sous le lit.'],
          ['devant', 'in front of', 'Il attend devant la porte.'],
          ['derrière', 'behind', 'Le jardin est derrière la maison.'],
          ['à côté de', 'next to', 'La boulangerie est à côté de l\'école.'],
          ['en face de', 'opposite', 'La banque est en face de la poste.'],
          ['entre', 'between', 'Le café est entre la banque et la pharmacie.'],
          ['près de', 'near', 'J\'habite près de la gare.'],
          ['loin de', 'far from', 'C\'est loin du centre.'],
        ],
      },
      {
        type: 'rule_list',
        title: 'Prepositions with cities and countries:',
        rules: [
          'à + city: Je suis à Paris. (I am in Paris.)',
          'en + feminine country: Je vis en France. (I live in France.)',
          'au + masculine country: Il est au Canada. (He is in Canada.)',
          'aux + plural country: Ils sont aux États-Unis. (They are in the USA.)',
        ],
      },
    ],
  },
  {
    slug: 'possessives',
    titleRu: 'Притяжательные прилагательные',
    titleEn: 'Possessive Adjectives',
    titleFr: 'Les adjectifs possessifs',
    category: 'pronouns',
    orderNum: 14,
    content: [
      {
        type: 'paragraph',
        text: 'Притяжательные прилагательные указывают на принадлежность. В отличие от русского, они согласуются с родом ПРЕДМЕТА, а не владельца.',
      },
      {
        type: 'table',
        title: 'Таблица притяжательных прилагательных',
        headers: ['Владелец', 'М.р. ед.ч.', 'Ж.р. ед.ч.', 'Мн.ч.'],
        rows: [
          ['je (мой)', 'mon', 'ma (mon перед гл.)', 'mes'],
          ['tu (твой)', 'ton', 'ta (ton перед гл.)', 'tes'],
          ['il/elle (его/её)', 'son', 'sa (son перед гл.)', 'ses'],
          ['nous (наш)', 'notre', 'notre', 'nos'],
          ['vous (ваш)', 'votre', 'votre', 'vos'],
          ['ils/elles (их)', 'leur', 'leur', 'leurs'],
        ],
      },
      {
        type: 'example_list',
        title: 'Примеры',
        items: [
          { fr: 'mon frère / ma sœur', ru: 'мой брат / моя сестра', en: 'my brother / my sister' },
          { fr: 'son livre (à lui)', ru: 'его книга', en: 'his book' },
          { fr: 'son livre (à elle)', ru: 'её книга (тоже son!)', en: 'her book (also son!)', note: 'son agrees with livre (m.), not with the owner\'s gender' },
          { fr: 'mon amie', ru: 'моя подруга (перед гласной mon, не ma)', en: 'my friend (f.) — mon before vowel, not ma' },
          { fr: 'nos enfants', ru: 'наши дети', en: 'our children' },
        ],
      },
    ],
    contentEn: [
      {
        type: 'paragraph',
        text: 'Possessive adjectives indicate ownership. Unlike English, they agree with the gender of the OBJECT possessed, not the owner.',
      },
      {
        type: 'table',
        title: 'Possessive adjectives table',
        headers: ['Owner', 'Masc. sing.', 'Fem. sing.', 'Plural'],
        rows: [
          ['je (my)', 'mon', 'ma (mon before vowel)', 'mes'],
          ['tu (your)', 'ton', 'ta (ton before vowel)', 'tes'],
          ['il/elle (his/her)', 'son', 'sa (son before vowel)', 'ses'],
          ['nous (our)', 'notre', 'notre', 'nos'],
          ['vous (your)', 'votre', 'votre', 'vos'],
          ['ils/elles (their)', 'leur', 'leur', 'leurs'],
        ],
      },
      {
        type: 'example_list',
        title: 'Examples',
        items: [
          { fr: 'mon frère / ma sœur', ru: 'мой брат / моя сестра', en: 'my brother / my sister' },
          { fr: 'son livre (à lui)', ru: 'его книга', en: 'his book' },
          { fr: 'son livre (à elle)', ru: 'её книга (тоже son!)', en: 'her book (also son!)', note: 'son agrees with livre (m.), not with the owner\'s gender' },
          { fr: 'mon amie', ru: 'моя подруга', en: 'my (female) friend — mon before vowel, not ma' },
          { fr: 'nos enfants', ru: 'наши дети', en: 'our children' },
        ],
      },
    ],
  },
  {
    slug: 'numbers-time',
    titleRu: 'Числа и время',
    titleEn: 'Numbers and Time',
    titleFr: 'Les nombres et l\'heure',
    category: 'vocabulary',
    orderNum: 15,
    content: [
      {
        type: 'table',
        title: 'Числа 0–20',
        headers: ['Число', 'Слово', 'Число', 'Слово'],
        rows: [
          ['0', 'zéro', '11', 'onze'],
          ['1', 'un/une', '12', 'douze'],
          ['2', 'deux', '13', 'treize'],
          ['3', 'trois', '14', 'quatorze'],
          ['4', 'quatre', '15', 'quinze'],
          ['5', 'cinq', '16', 'seize'],
          ['6', 'six', '17', 'dix-sept'],
          ['7', 'sept', '18', 'dix-huit'],
          ['8', 'huit', '19', 'dix-neuf'],
          ['9', 'neuf', '20', 'vingt'],
          ['10', 'dix', '', ''],
        ],
      },
      {
        type: 'table',
        title: 'Десятки',
        headers: ['Число', 'Слово', 'Примечание'],
        rows: [
          ['30', 'trente', 'стандартное'],
          ['40', 'quarante', 'стандартное'],
          ['50', 'cinquante', 'стандартное'],
          ['60', 'soixante', 'стандартное'],
          ['70', 'soixante-dix', '60+10 (нет слова septante в стандарте)'],
          ['80', 'quatre-vingts', '4×20'],
          ['90', 'quatre-vingt-dix', '4×20+10'],
          ['100', 'cent', ''],
          ['1000', 'mille', ''],
        ],
      },
      {
        type: 'rule_list',
        title: 'Который час:',
        rules: [
          'Il est + [число] + heure(s): Il est trois heures. (Три часа.)',
          'Il est midi. (Полдень.) / Il est minuit. (Полночь.)',
          'Il est trois heures et demie. (Половина четвёртого.)',
          'Il est trois heures et quart. (Четверть четвёртого.)',
          'Il est quatre heures moins le quart. (Без четверти четыре.)',
          'Quelle heure est-il ? — Который час?',
        ],
      },
    ],
    contentEn: [
      {
        type: 'table',
        title: 'Numbers 0–20',
        headers: ['Number', 'Word', 'Number', 'Word'],
        rows: [
          ['0', 'zéro', '11', 'onze'],
          ['1', 'un/une', '12', 'douze'],
          ['2', 'deux', '13', 'treize'],
          ['3', 'trois', '14', 'quatorze'],
          ['4', 'quatre', '15', 'quinze'],
          ['5', 'cinq', '16', 'seize'],
          ['6', 'six', '17', 'dix-sept'],
          ['7', 'sept', '18', 'dix-huit'],
          ['8', 'huit', '19', 'dix-neuf'],
          ['9', 'neuf', '20', 'vingt'],
          ['10', 'dix', '', ''],
        ],
      },
      {
        type: 'table',
        title: 'Tens',
        headers: ['Number', 'Word', 'Note'],
        rows: [
          ['30', 'trente', 'standard'],
          ['40', 'quarante', 'standard'],
          ['50', 'cinquante', 'standard'],
          ['60', 'soixante', 'standard'],
          ['70', 'soixante-dix', '60+10 (no septante in standard French)'],
          ['80', 'quatre-vingts', '4×20'],
          ['90', 'quatre-vingt-dix', '4×20+10'],
          ['100', 'cent', ''],
          ['1000', 'mille', ''],
        ],
      },
      {
        type: 'rule_list',
        title: 'Telling the time:',
        rules: [
          'Il est + [number] + heure(s): Il est trois heures. (It is three o\'clock.)',
          'Il est midi. (It is noon.) / Il est minuit. (It is midnight.)',
          'Il est trois heures et demie. (It is half past three.)',
          'Il est trois heures et quart. (It is quarter past three.)',
          'Il est quatre heures moins le quart. (It is quarter to four.)',
          'Quelle heure est-il ? — What time is it?',
        ],
      },
    ],
  },
  {
    slug: 'demonstratives',
    titleRu: 'Указательные прилагательные',
    titleEn: 'Demonstrative Adjectives',
    titleFr: 'Les adjectifs démonstratifs',
    category: 'pronouns',
    orderNum: 16,
    content: [
      {
        type: 'paragraph',
        text: 'Указательные прилагательные соответствуют русским "этот, эта, эти". Они согласуются с родом и числом существительного.',
      },
      {
        type: 'table',
        title: 'Формы указательных прилагательных',
        headers: ['', 'Мужской род', 'Женский род', 'Множественное число'],
        rows: [
          ['Форма', 'ce / cet (перед гласной)', 'cette', 'ces'],
          ['Пример', 'ce livre / cet homme', 'cette femme', 'ces enfants'],
          ['Перевод', 'эта книга / этот человек', 'эта женщина', 'эти дети'],
        ],
      },
      {
        type: 'rule_list',
        title: 'Уточнение -ci / -là:',
        rules: [
          'ce livre-ci — эта книга (здесь)',
          'ce livre-là — та книга (там)',
          'В разговорной речи чаще используют просто ce/cette/ces без уточнения',
        ],
      },
      {
        type: 'example_list',
        title: 'Примеры',
        items: [
          { fr: 'Ce garçon est sympa.', ru: 'Этот мальчик приятный.', en: 'This boy is nice.' },
          { fr: 'Cette robe est belle.', ru: 'Это платье красивое.', en: 'This dress is beautiful.' },
          { fr: 'Cet appartement est grand.', ru: 'Эта квартира большая.', en: 'This apartment is big.' },
          { fr: 'Ces fleurs sont jolies.', ru: 'Эти цветы красивые.', en: 'These flowers are pretty.' },
        ],
      },
    ],
    contentEn: [
      {
        type: 'paragraph',
        text: 'Demonstrative adjectives correspond to "this", "that", "these", "those" in English. They agree with the gender and number of the noun.',
      },
      {
        type: 'table',
        title: 'Forms of demonstrative adjectives',
        headers: ['', 'Masculine', 'Feminine', 'Plural'],
        rows: [
          ['Form', 'ce / cet (before vowel)', 'cette', 'ces'],
          ['Example', 'ce livre / cet homme', 'cette femme', 'ces enfants'],
          ['Translation', 'this book / this man', 'this woman', 'these children'],
        ],
      },
      {
        type: 'rule_list',
        title: 'The -ci / -là distinction:',
        rules: [
          'ce livre-ci — this book (here)',
          'ce livre-là — that book (there)',
          'In everyday speech, simply ce/cette/ces is used without -ci/-là',
        ],
      },
      {
        type: 'example_list',
        title: 'Examples',
        items: [
          { fr: 'Ce garçon est sympa.', ru: 'Этот мальчик приятный.', en: 'This boy is nice.' },
          { fr: 'Cette robe est belle.', ru: 'Это платье красивое.', en: 'This dress is beautiful.' },
          { fr: 'Cet appartement est grand.', ru: 'Эта квартира большая.', en: 'This apartment is big.' },
          { fr: 'Ces fleurs sont jolies.', ru: 'Эти цветы красивые.', en: 'These flowers are pretty.' },
        ],
      },
    ],
  },
  {
    slug: 'past-tense-passe-compose',
    titleRu: 'Прошедшее время (passé composé)',
    titleEn: 'Past Tense (passé composé)',
    titleFr: 'Le passé composé',
    category: 'verbs',
    orderNum: 17,
    content: [
      {
        type: 'paragraph',
        text: 'Passé composé — основное прошедшее время для разговорной речи. Образуется из вспомогательного глагола (avoir или être) в настоящем времени + причастие прошедшего времени (participe passé).',
      },
      {
        type: 'table',
        title: 'Образование причастия',
        headers: ['Группа глагола', 'Правило', 'Пример'],
        rows: [
          ['-er', '-é', 'parler → parlé'],
          ['-ir (2 гр.)', '-i', 'finir → fini'],
          ['-re', '-u', 'vendre → vendu'],
          ['неправильные', 'нужно запомнить', 'être → été, avoir → eu, faire → fait'],
        ],
      },
      {
        type: 'rule_list',
        title: 'Выбор вспомогательного глагола:',
        rules: [
          'avoir: большинство глаголов — J\'ai mangé. (Я поел.)',
          'être: глаголы движения (aller, venir, partir, arriver...) и все возвратные — Je suis allé. (Я пошёл.)',
          'С être причастие согласуется в роде и числе: Elle est partie. / Ils sont partis.',
        ],
      },
      {
        type: 'example_list',
        title: 'Примеры',
        items: [
          { fr: 'J\'ai mangé une pizza.', ru: 'Я съел пиццу.', en: 'I ate a pizza.' },
          { fr: 'Elle a fini son travail.', ru: 'Она закончила свою работу.', en: 'She finished her work.' },
          { fr: 'Nous sommes arrivés hier.', ru: 'Мы приехали вчера.', en: 'We arrived yesterday.' },
          { fr: 'Il n\'a pas dormi.', ru: 'Он не спал.', en: 'He did not sleep.' },
        ],
      },
    ],
    contentEn: [
      {
        type: 'paragraph',
        text: 'The passé composé is the main past tense used in spoken French. It is formed from an auxiliary verb (avoir or être) in the present tense plus the past participle.',
      },
      {
        type: 'table',
        title: 'Forming the past participle',
        headers: ['Verb group', 'Rule', 'Example'],
        rows: [
          ['-er', '-é', 'parler → parlé'],
          ['-ir (group 2)', '-i', 'finir → fini'],
          ['-re', '-u', 'vendre → vendu'],
          ['irregular', 'must be memorised', 'être → été, avoir → eu, faire → fait'],
        ],
      },
      {
        type: 'rule_list',
        title: 'Choosing the auxiliary verb:',
        rules: [
          'avoir: most verbs — J\'ai mangé. (I ate.)',
          'être: verbs of motion (aller, venir, partir, arriver...) and all reflexive verbs — Je suis allé. (I went.)',
          'With être the participle agrees in gender and number: Elle est partie. / Ils sont partis.',
        ],
      },
      {
        type: 'example_list',
        title: 'Examples',
        items: [
          { fr: 'J\'ai mangé une pizza.', ru: 'Я съел пиццу.', en: 'I ate a pizza.' },
          { fr: 'Elle a fini son travail.', ru: 'Она закончила свою работу.', en: 'She finished her work.' },
          { fr: 'Nous sommes arrivés hier.', ru: 'Мы приехали вчера.', en: 'We arrived yesterday.' },
          { fr: 'Il n\'a pas dormi.', ru: 'Он не спал.', en: 'He did not sleep.' },
        ],
      },
    ],
  },
  {
    slug: 'reflexive-verbs',
    titleRu: 'Возвратные глаголы',
    titleEn: 'Reflexive Verbs',
    titleFr: 'Les verbes pronominaux',
    category: 'verbs',
    orderNum: 18,
    content: [
      {
        type: 'paragraph',
        text: 'Возвратные глаголы обозначают действие, которое субъект совершает над собой. Они спрягаются с возвратными местоимениями.',
      },
      {
        type: 'table',
        title: 'Возвратные местоимения',
        headers: ['Лицо', 'Местоимение', 'Пример (se lever)'],
        rows: [
          ['je', 'me (m\')', 'je me lève'],
          ['tu', 'te (t\')', 'tu te lèves'],
          ['il/elle/on', 'se (s\')', 'il se lève'],
          ['nous', 'nous', 'nous nous levons'],
          ['vous', 'vous', 'vous vous levez'],
          ['ils/elles', 'se (s\')', 'ils se lèvent'],
        ],
      },
      {
        type: 'example_list',
        title: 'Частые возвратные глаголы',
        items: [
          { fr: 'se lever', ru: 'вставать', en: 'to get up' },
          { fr: 'se coucher', ru: 'ложиться спать', en: 'to go to bed' },
          { fr: 'se laver', ru: 'умываться, мыться', en: 'to wash oneself' },
          { fr: 's\'habiller', ru: 'одеваться', en: 'to get dressed' },
          { fr: 's\'appeler', ru: 'называться, зваться', en: 'to be called' },
          { fr: 'se reposer', ru: 'отдыхать', en: 'to rest' },
          { fr: 'se souvenir', ru: 'вспоминать', en: 'to remember' },
        ],
      },
      {
        type: 'rule_list',
        title: 'В passé composé — всегда с être:',
        rules: [
          'Je me suis levé(e). (Я встал/встала.)',
          'Elle s\'est habillée. (Она оделась.)',
        ],
      },
    ],
    contentEn: [
      {
        type: 'paragraph',
        text: 'Reflexive verbs describe an action that the subject performs on themselves. They are conjugated with reflexive pronouns.',
      },
      {
        type: 'table',
        title: 'Reflexive pronouns',
        headers: ['Person', 'Pronoun', 'Example (se lever)'],
        rows: [
          ['je', 'me (m\')', 'je me lève'],
          ['tu', 'te (t\')', 'tu te lèves'],
          ['il/elle/on', 'se (s\')', 'il se lève'],
          ['nous', 'nous', 'nous nous levons'],
          ['vous', 'vous', 'vous vous levez'],
          ['ils/elles', 'se (s\')', 'ils se lèvent'],
        ],
      },
      {
        type: 'example_list',
        title: 'Common reflexive verbs',
        items: [
          { fr: 'se lever', ru: 'вставать', en: 'to get up' },
          { fr: 'se coucher', ru: 'ложиться спать', en: 'to go to bed' },
          { fr: 'se laver', ru: 'умываться', en: 'to wash oneself' },
          { fr: 's\'habiller', ru: 'одеваться', en: 'to get dressed' },
          { fr: 's\'appeler', ru: 'называться', en: 'to be called' },
          { fr: 'se reposer', ru: 'отдыхать', en: 'to rest' },
          { fr: 'se souvenir', ru: 'вспоминать', en: 'to remember' },
        ],
      },
      {
        type: 'rule_list',
        title: 'In the passé composé — always with être:',
        rules: [
          'Je me suis levé(e). (I got up.)',
          'Elle s\'est habillée. (She got dressed.)',
        ],
      },
    ],
  },
  {
    slug: 'imperatives',
    titleRu: 'Повелительное наклонение',
    titleEn: 'The Imperative',
    titleFr: 'L\'impératif',
    category: 'verbs',
    orderNum: 19,
    content: [
      {
        type: 'paragraph',
        text: 'Повелительное наклонение выражает приказ, просьбу или совет. Оно имеет только три формы: tu, nous, vous. Подлежащее не используется.',
      },
      {
        type: 'table',
        title: 'Образование повелительного наклонения',
        headers: ['Форма', '-er глаголы', '-ir/-re глаголы', 'Пример'],
        rows: [
          ['tu', 'основа без -s', 'как в наст.вр.', 'Mange ! / Finis !'],
          ['nous', 'как в наст.вр.', 'как в наст.вр.', 'Mangeons ! / Finissons !'],
          ['vous', 'как в наст.вр.', 'как в наст.вр.', 'Mangez ! / Finissez !'],
        ],
      },
      {
        type: 'table',
        title: 'Неправильные формы',
        headers: ['Глагол', 'tu', 'nous', 'vous'],
        rows: [
          ['être', 'sois', 'soyons', 'soyez'],
          ['avoir', 'aie', 'ayons', 'ayez'],
          ['aller', 'va', 'allons', 'allez'],
          ['savoir', 'sache', 'sachons', 'sachez'],
        ],
      },
      {
        type: 'example_list',
        title: 'Примеры',
        items: [
          { fr: 'Écoute ! / Écoutez !', ru: 'Слушай! / Слушайте!', en: 'Listen!' },
          { fr: 'Sois sage !', ru: 'Веди себя хорошо!', en: 'Behave yourself!' },
          { fr: 'Allons-y !', ru: 'Пошли!', en: 'Let\'s go!' },
          { fr: 'Ne touche pas !', ru: 'Не трогай!', en: 'Do not touch!' },
        ],
      },
    ],
    contentEn: [
      {
        type: 'paragraph',
        text: 'The imperative expresses commands, requests or advice. It only has three forms: tu, nous, vous. The subject pronoun is not used.',
      },
      {
        type: 'table',
        title: 'Forming the imperative',
        headers: ['Form', '-er verbs', '-ir/-re verbs', 'Example'],
        rows: [
          ['tu', 'stem without -s', 'same as present', 'Mange ! / Finis !'],
          ['nous', 'same as present', 'same as present', 'Mangeons ! / Finissons !'],
          ['vous', 'same as present', 'same as present', 'Mangez ! / Finissez !'],
        ],
      },
      {
        type: 'table',
        title: 'Irregular forms',
        headers: ['Verb', 'tu', 'nous', 'vous'],
        rows: [
          ['être', 'sois', 'soyons', 'soyez'],
          ['avoir', 'aie', 'ayons', 'ayez'],
          ['aller', 'va', 'allons', 'allez'],
          ['savoir', 'sache', 'sachons', 'sachez'],
        ],
      },
      {
        type: 'example_list',
        title: 'Examples',
        items: [
          { fr: 'Écoute ! / Écoutez !', ru: 'Слушай! / Слушайте!', en: 'Listen!' },
          { fr: 'Sois sage !', ru: 'Веди себя хорошо!', en: 'Behave yourself!' },
          { fr: 'Allons-y !', ru: 'Пошли!', en: 'Let\'s go!' },
          { fr: 'Ne touche pas !', ru: 'Не трогай!', en: 'Do not touch!' },
        ],
      },
    ],
  },
  {
    slug: 'adverbs-frequency',
    titleRu: 'Наречия частоты',
    titleEn: 'Adverbs of Frequency',
    titleFr: 'Les adverbes de fréquence',
    category: 'adverbs',
    orderNum: 20,
    content: [
      {
        type: 'paragraph',
        text: 'Наречия частоты показывают, как часто совершается действие. Большинство из них ставятся после глагола (в составном времени — между вспомогательным и причастием).',
      },
      {
        type: 'table',
        title: 'Наречия частоты (от частого к редкому)',
        headers: ['Наречие', 'Перевод', 'Пример'],
        rows: [
          ['toujours', 'всегда', 'Je prends toujours le bus.'],
          ['souvent', 'часто', 'Il mange souvent au restaurant.'],
          ['d\'habitude', 'обычно', 'D\'habitude je me lève à 7h.'],
          ['parfois / quelquefois', 'иногда', 'Parfois je cuisine.'],
          ['rarement', 'редко', 'Elle va rarement au cinéma.'],
          ['ne...jamais', 'никогда', 'Je ne bois jamais d\'alcool.'],
        ],
      },
      {
        type: 'example_list',
        title: 'В passé composé',
        items: [
          { fr: 'J\'ai toujours aimé la musique.', ru: 'Я всегда любил музыку.', en: 'I have always loved music.' },
          { fr: 'Il n\'a jamais voyagé.', ru: 'Он никогда не путешествовал.', en: 'He has never travelled.' },
        ],
      },
    ],
    contentEn: [
      {
        type: 'paragraph',
        text: 'Adverbs of frequency show how often an action takes place. Most of them are placed after the verb (in compound tenses — between the auxiliary and the participle).',
      },
      {
        type: 'table',
        title: 'Adverbs of frequency (from most to least frequent)',
        headers: ['Adverb', 'Translation', 'Example'],
        rows: [
          ['toujours', 'always', 'Je prends toujours le bus.'],
          ['souvent', 'often', 'Il mange souvent au restaurant.'],
          ['d\'habitude', 'usually', 'D\'habitude je me lève à 7h.'],
          ['parfois / quelquefois', 'sometimes', 'Parfois je cuisine.'],
          ['rarement', 'rarely', 'Elle va rarement au cinéma.'],
          ['ne...jamais', 'never', 'Je ne bois jamais d\'alcool.'],
        ],
      },
      {
        type: 'example_list',
        title: 'In the passé composé',
        items: [
          { fr: 'J\'ai toujours aimé la musique.', ru: 'Я всегда любил музыку.', en: 'I have always loved music.' },
          { fr: 'Il n\'a jamais voyagé.', ru: 'Он никогда не путешествовал.', en: 'He has never travelled.' },
        ],
      },
    ],
  },
];
