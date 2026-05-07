import type { GrammarTopic } from './grammar-a1.js';

export const grammarTopicsA1Extra2: GrammarTopic[] = [

  // ─────────────────────────────────────────────────────────────
  // 1. Les expressions de quantité
  // ─────────────────────────────────────────────────────────────
  {
    slug: 'expressions-quantite',
    titleRu: 'Выражения количества',
    titleEn: 'Expressions of Quantity',
    titleFr: 'Les expressions de quantité',
    category: 'determinants',
    orderNum: 26,
    content: [
      {
        type: 'paragraph',
        text: 'Выражения количества (beaucoup de, peu de, trop de и др.) показывают, сколько чего-то есть. Важное правило: после них артикль заменяется на de (или d\' перед гласной) — артикль не нужен.',
      },
      {
        type: 'table',
        title: 'Основные выражения количества',
        headers: ['Выражение', 'Значение', 'Пример'],
        rows: [
          ['beaucoup de', 'много', 'Il mange beaucoup de pain.'],
          ['peu de', 'мало', 'J\'ai peu d\'argent.'],
          ['un peu de', 'немного', 'Ajoute un peu de sel.'],
          ['trop de', 'слишком много', 'Il y a trop de bruit.'],
          ['assez de', 'достаточно', 'Tu as assez de temps.'],
          ['pas assez de', 'недостаточно', 'Je n\'ai pas assez de place.'],
          ['plein de', 'полно, очень много (разг.)', 'Il y a plein de monde.'],
          ['beaucoup (без de)', 'много (с глаголом)', 'Il travaille beaucoup.'],
        ],
      },
      {
        type: 'rule_list',
        title: 'Правила:',
        rules: [
          'После выражений количества → de/d\' (без артикля): beaucoup de café, peu d\'eau, trop d\'argent.',
          'Исключение: bien des (книжн.) → с артиклем des: bien des problèmes (много проблем).',
          'Beaucoup без существительного = просто с глаголом: Il mange beaucoup. Je lis beaucoup.',
          'La plupart de → с артиклем: la plupart des étudiants (большинство студентов).',
          'Вопрос о количестве: Combien de livres as-tu? — J\'ai beaucoup de livres.',
        ],
      },
      {
        type: 'example_list',
        title: 'Примеры',
        items: [
          { fr: 'Il y a beaucoup de touristes à Paris en été.', ru: 'В Париже летом много туристов.', en: 'There are a lot of tourists in Paris in summer.' },
          { fr: 'Elle a peu de temps libre cette semaine.', ru: 'У неё мало свободного времени на этой неделе.', en: 'She has little free time this week.' },
          { fr: 'Tu bois trop de café, ce n\'est pas bon pour toi.', ru: 'Ты пьёшь слишком много кофе — это нехорошо для тебя.', en: 'You drink too much coffee, it is not good for you.' },
          { fr: 'Ajoute un peu de sucre dans le thé.', ru: 'Добавь немного сахара в чай.', en: 'Add a little sugar to the tea.' },
        ],
      },
    ],
    contentEn: [
      {
        type: 'paragraph',
        text: 'Quantity expressions (beaucoup de, peu de, trop de, etc.) are followed by de/d\' — no article. They tell you how much or how many of something there is.',
      },
      {
        type: 'table',
        title: 'Main quantity expressions',
        headers: ['Expression', 'Meaning', 'Example'],
        rows: [
          ['beaucoup de', 'a lot of', 'Il mange beaucoup de pain.'],
          ['peu de', 'little / few', 'J\'ai peu d\'argent.'],
          ['un peu de', 'a little', 'Ajoute un peu de sel.'],
          ['trop de', 'too much / too many', 'Il y a trop de bruit.'],
          ['assez de', 'enough', 'Tu as assez de temps.'],
        ],
      },
      {
        type: 'rule_list',
        title: 'Key rules:',
        rules: [
          'After quantity expressions: de/d\' (no article) — beaucoup de café, peu d\'eau.',
          'Beaucoup alone with a verb (no noun): Il mange beaucoup.',
          'La plupart de keeps the article: la plupart des étudiants.',
        ],
      },
      {
        type: 'example_list',
        title: 'Examples',
        items: [
          { fr: 'Il y a beaucoup de touristes à Paris en été.', ru: 'There are a lot of tourists in Paris in summer.' },
          { fr: 'Tu bois trop de café.', ru: 'You drink too much coffee.' },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────
  // 2. Les prépositions + pays et villes
  // ─────────────────────────────────────────────────────────────
  {
    slug: 'prepositions-pays',
    titleRu: 'Предлоги с названиями стран и городов',
    titleEn: 'Prepositions with Countries and Cities',
    titleFr: 'Les prépositions + pays et villes',
    category: 'prepositions',
    orderNum: 27,
    content: [
      {
        type: 'paragraph',
        text: 'Для обозначения местонахождения или направления с названиями стран и городов используются предлоги en, au, aux, à. Выбор зависит от рода и числа страны.',
      },
      {
        type: 'table',
        title: 'Правила выбора предлога (направление / нахождение)',
        headers: ['Тип названия', 'Предлог', 'Примеры'],
        rows: [
          ['Страна женского рода (la)', 'en', 'en France, en Espagne, en Russie, en Italie'],
          ['Страна мужского рода (le)', 'au', 'au Japon, au Canada, au Mexique, au Brésil'],
          ['Страна мужская, начинается на гласную', 'en', 'en Iran, en Irak, en Israël'],
          ['Страна множественного числа (les)', 'aux', 'aux États-Unis, aux Pays-Bas, aux Philippines'],
          ['Город', 'à', 'à Paris, à Tokyo, à Moscou, à Rome'],
        ],
      },
      {
        type: 'table',
        title: 'Выражение происхождения (откуда)',
        headers: ['Тип названия', 'Предлог', 'Примеры'],
        rows: [
          ['Страна женского рода', 'de / d\'', 'de France, d\'Espagne, de Russie'],
          ['Страна мужского рода', 'du', 'du Japon, du Canada, du Mexique'],
          ['Страна мн.ч.', 'des', 'des États-Unis, des Pays-Bas'],
          ['Город', 'de / d\'', 'de Paris, de Tokyo, d\'Oslo'],
        ],
      },
      {
        type: 'rule_list',
        title: 'Как определить род страны:',
        rules: [
          'Большинство стран на -e — женского рода: la France, l\'Allemagne, la Chine, la Belgique.',
          'Исключения м.р. на -e: le Mexique, le Mozambique, le Cambodge.',
          'Страны не на -e — обычно мужского рода: le Japon, le Canada, le Portugal.',
          'Острова часто с à без артикля: à Cuba, à Haïti, à Madagascar.',
        ],
      },
      {
        type: 'example_list',
        title: 'Примеры',
        items: [
          { fr: 'Je vis en France mais je travaille en Allemagne.', ru: 'Я живу во Франции, но работаю в Германии.', en: 'I live in France but I work in Germany.' },
          { fr: 'Il est né au Japon et habite aux États-Unis.', ru: 'Он родился в Японии и живёт в США.', en: 'He was born in Japan and lives in the United States.' },
          { fr: 'Elle vient de Paris et rentre à Lyon ce soir.', ru: 'Она из Парижа и возвращается в Лион этим вечером.', en: 'She is from Paris and is going back to Lyon tonight.' },
          { fr: 'Nous allons au Canada cet été, puis au Mexique.', ru: 'Этим летом мы едем в Канаду, потом в Мексику.', en: 'We are going to Canada this summer, then to Mexico.' },
        ],
      },
    ],
    contentEn: [
      {
        type: 'paragraph',
        text: 'The choice of preposition with country and city names depends on gender and number. en (feminine countries), au (masculine countries), aux (plural countries), à (cities).',
      },
      {
        type: 'table',
        title: 'Prepositions for location / direction',
        headers: ['Country type', 'Preposition', 'Examples'],
        rows: [
          ['Feminine (la)', 'en', 'en France, en Russie'],
          ['Masculine (le)', 'au', 'au Japon, au Canada'],
          ['Plural (les)', 'aux', 'aux États-Unis'],
          ['City', 'à', 'à Paris, à Tokyo'],
        ],
      },
      {
        type: 'example_list',
        title: 'Examples',
        items: [
          { fr: 'Je vis en France mais je travaille en Allemagne.', ru: 'I live in France but I work in Germany.' },
          { fr: 'Il est né au Japon et habite aux États-Unis.', ru: 'He was born in Japan and lives in the United States.' },
        ],
      },
    ],
  },
];
