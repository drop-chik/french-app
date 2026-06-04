/**
 * Static, build-time data for the per-level marketing pages. Numbers
 * pulled from the live content audit (memory: project_frenchup +
 * project_frenchup_content_audit). Update here when content counts
 * shift materially — not every drill addition needs a rebuild, but a
 * level-wide expansion (like the C2 relevel) should.
 *
 * The level pages are PUBLIC — SEO entry point — so this data is
 * effectively the source of truth for what a prospective learner reads
 * before signing up.
 */

export type Level = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';

export interface LevelData {
  level: Level;
  /** Localised level name as Russians / English speakers would call it */
  nameRu: string;
  nameEn: string;
  /** One-line eyebrow above the title */
  eyebrowRu: string;
  eyebrowEn: string;
  /** Hero outcome statement — what learner can DO after this level */
  outcomeRu: string;
  outcomeEn: string;
  /** Expected time to reach this level from scratch */
  durationRu: string;
  durationEn: string;
  /** Live content counts at this level */
  content: {
    words: number;
    grammar: number;
    drills: number;
    listening: number;
    reading: number;
    writing: number;
  };
  /** Sample "you can do this after X" phrases */
  canDoRu: string[];
  canDoEn: string[];
  /** Two or three example grammar topics typical of this level */
  grammarHighlightsRu: string[];
  grammarHighlightsEn: string[];
  /**
   * The actual DELF/DALF written-production exam spec at this level.
   * Real numbers — taken from CIEP exam guides. The card on the level
   * page surfaces these so a prospective DELF candidate can match what
   * they'll see on exam day to what FrenchUp trains. Strings (not pure
   * numbers) because durations span "30 min" → "2 h 30 min" → "3 h 30 min"
   * and word counts include ranges ("40-80 слов").
   */
  examSpec: {
    name: string;
    wordsRu: string;
    wordsEn: string;
    durationRu: string;
    durationEn: string;
    pointsRu: string;
    pointsEn: string;
    focusRu: string;
    focusEn: string;
  };
}

export const LEVEL_DATA: Record<Level, LevelData> = {
  A1: {
    level: 'A1',
    nameRu: 'Базовый',
    nameEn: 'Beginner',
    eyebrowRu: 'Уровень A1',
    eyebrowEn: 'Level A1',
    outcomeRu: 'От первых фраз — до простых разговоров',
    outcomeEn: 'From first phrases to simple conversations',
    durationRu: 'около 2 месяцев',
    durationEn: 'about 2 months',
    content: { words: 1859, grammar: 27, drills: 11, listening: 13, reading: 8, writing: 8 },
    canDoRu: [
      'Представиться и спросить базовое о собеседнике',
      'Понимать простые объявления и ценники',
      'Заказать кофе, спросить дорогу, купить продукты',
      'Написать короткое SMS или открытку',
    ],
    canDoEn: [
      'Introduce yourself and ask basic questions',
      'Understand simple signs and prices',
      'Order coffee, ask for directions, buy groceries',
      'Write a short SMS or postcard',
    ],
    grammarHighlightsRu: ['Глаголы être и avoir', 'Артикли (le / la / un / une)', 'Отрицание ne…pas', 'Futur proche'],
    grammarHighlightsEn: ['Verbs être and avoir', 'Articles (le / la / un / une)', 'Negation ne…pas', 'Futur proche'],
    examSpec: {
      name: 'DELF A1',
      wordsRu: '40–80 слов', wordsEn: '40–80 words',
      durationRu: '30 минут', durationEn: '30 minutes',
      pointsRu: '25 баллов', pointsEn: '25 points',
      focusRu: 'Открытка, личная записка',
      focusEn: 'Postcard, personal note',
    },
  },
  A2: {
    level: 'A2',
    nameRu: 'Элементарный',
    nameEn: 'Elementary',
    eyebrowRu: 'Уровень A2',
    eyebrowEn: 'Level A2',
    outcomeRu: 'От бытовых тем — до историй о прошлом и планов на будущее',
    outcomeEn: 'From everyday topics to past stories and future plans',
    durationRu: 'около 3 месяцев',
    durationEn: 'about 3 months',
    content: { words: 1819, grammar: 18, drills: 14, listening: 10, reading: 8, writing: 8 },
    canDoRu: [
      'Рассказывать о прошлом — passé composé и imparfait',
      'Строить планы и давать обещания',
      'Обсуждать работу, путешествия, увлечения',
      'Вежливо отказать и согласиться',
    ],
    canDoEn: [
      'Talk about the past — passé composé and imparfait',
      'Make plans and give promises',
      'Discuss work, travel, hobbies',
      'Politely decline or agree',
    ],
    grammarHighlightsRu: ['Passé composé с avoir и être', 'Imparfait', 'Местоимения COD/COI', 'Conditionnel в вежливых формах'],
    grammarHighlightsEn: ['Passé composé with avoir and être', 'Imparfait', 'COD/COI pronouns', 'Polite conditional'],
    examSpec: {
      name: 'DELF A2',
      wordsRu: '60–80 слов × 2 задания', wordsEn: '60–80 words × 2 tasks',
      durationRu: '45 минут', durationEn: '45 minutes',
      pointsRu: '25 баллов', pointsEn: '25 points',
      focusRu: 'Личное письмо, описание события',
      focusEn: 'Personal letter, event description',
    },
  },
  B1: {
    level: 'B1',
    nameRu: 'Средний',
    nameEn: 'Intermediate',
    eyebrowRu: 'Уровень B1',
    eyebrowEn: 'Level B1',
    outcomeRu: 'От разговоров о работе и учёбе — до пересказа и аргументации',
    outcomeEn: 'From work and study talks to retelling and arguing',
    durationRu: 'около 4 месяцев',
    durationEn: 'about 4 months',
    content: { words: 4699, grammar: 20, drills: 14, listening: 12, reading: 8, writing: 8 },
    canDoRu: [
      'Понимать новости, подкасты и фильмы на типичные темы',
      'Аргументировать своё мнение и приводить примеры',
      'Писать связные тексты, эссе на 200–300 слов',
      'Выходить из языкового тупика в путешествии',
    ],
    canDoEn: [
      'Understand news, podcasts, and films on familiar topics',
      'Argue your point with examples',
      'Write coherent 200–300-word essays',
      'Recover from language tricky spots while travelling',
    ],
    grammarHighlightsRu: ['Subjonctif présent', 'Условные предложения с si', 'Косвенная речь', 'Gérondif'],
    grammarHighlightsEn: ['Subjonctif présent', 'Conditional si-clauses', 'Indirect speech', 'Gérondif'],
    examSpec: {
      name: 'DELF B1',
      wordsRu: '160–180 слов', wordsEn: '160–180 words',
      durationRu: '45 минут', durationEn: '45 minutes',
      pointsRu: '25 баллов', pointsEn: '25 points',
      focusRu: 'Эссе на личное мнение',
      focusEn: 'Personal-opinion essay',
    },
  },
  B2: {
    level: 'B2',
    nameRu: 'Выше среднего',
    nameEn: 'Upper-Intermediate',
    eyebrowRu: 'Уровень B2',
    eyebrowEn: 'Level B2',
    outcomeRu: 'От беглой речи — до сложной аргументации в любой теме',
    outcomeEn: 'From fluent speech to complex argumentation in any topic',
    durationRu: 'около 5 месяцев',
    durationEn: 'about 5 months',
    content: { words: 5923, grammar: 16, drills: 7, listening: 8, reading: 8, writing: 9 },
    canDoRu: [
      'Свободно общаться с носителями без напряжения для обеих сторон',
      'Понимать суть сложных абстрактных текстов',
      'Писать развёрнутые эссе и формальные письма',
      'Выступать с презентацией и отвечать на вопросы',
    ],
    canDoEn: [
      'Talk fluently with native speakers — neither side strains',
      'Grasp the gist of complex abstract texts',
      'Write longer essays and formal letters',
      'Give a presentation and field questions',
    ],
    grammarHighlightsRu: ['Subjonctif passé', 'Concordance des temps', 'Voix passive', 'Faire causatif'],
    grammarHighlightsEn: ['Subjonctif passé', 'Concordance des temps', 'Passive voice', 'Faire causatif'],
    examSpec: {
      name: 'DELF B2',
      wordsRu: '250 слов', wordsEn: '250 words',
      durationRu: '60 минут', durationEn: '60 minutes',
      pointsRu: '25 баллов', pointsEn: '25 points',
      focusRu: 'Аргументация: статья, открытое письмо',
      focusEn: 'Argument: article, open letter',
    },
  },
  C1: {
    level: 'C1',
    nameRu: 'Продвинутый',
    nameEn: 'Advanced',
    eyebrowRu: 'Уровень C1',
    eyebrowEn: 'Level C1',
    outcomeRu: 'От продвинутой речи — до тонкой литературной и академической стилистики',
    outcomeEn: 'From advanced speech to subtle literary and academic style',
    durationRu: 'около 6 месяцев',
    durationEn: 'about 6 months',
    content: { words: 2137, grammar: 19, drills: 6, listening: 10, reading: 8, writing: 9 },
    canDoRu: [
      'Свободно использовать французский в учёбе и работе',
      'Понимать длинные литературные и научные тексты',
      'Писать структурированные доклады и аналитические эссе',
      'Различать формальный, разговорный и литературный регистры',
    ],
    canDoEn: [
      'Use French freely in academic and professional contexts',
      'Understand long literary and scientific texts',
      'Write structured reports and analytical essays',
      'Distinguish formal, colloquial, and literary registers',
    ],
    grammarHighlightsRu: ['Двойная пронominализация', 'Стилистическая инверсия', 'Style indirect libre', 'Глагольные режимы à/de/direct'],
    grammarHighlightsEn: ['Double pronominalisation', 'Stylistic inversion', 'Free indirect discourse', 'Verb regimes à/de/direct'],
    examSpec: {
      name: 'DALF C1',
      wordsRu: 'Синтез 220 + эссе 250 слов', wordsEn: 'Synthesis 220 + essay 250 words',
      durationRu: '2 ч 30 мин', durationEn: '2 h 30 min',
      pointsRu: '25 баллов', pointsEn: '25 points',
      focusRu: 'Синтез документов, развёрнутая аргументация',
      focusEn: 'Document synthesis, extended argumentation',
    },
  },
  C2: {
    level: 'C2',
    nameRu: 'Уровень носителя',
    nameEn: 'Mastery',
    eyebrowRu: 'Уровень C2',
    eyebrowEn: 'Level C2',
    outcomeRu: 'От продвинутого владения — до мастерства уровня литературного редактора',
    outcomeEn: 'From advanced fluency to mastery on par with a literary editor',
    durationRu: 'около 7 месяцев',
    durationEn: 'about 7 months',
    content: { words: 2684, grammar: 10, drills: 5, listening: 8, reading: 8, writing: 7 },
    canDoRu: [
      'Понимать любой текст и устную речь без затруднений',
      'Свободно использовать литературные времена (passé simple, subj. imparfait)',
      'Распознавать стилистические фигуры и тонкие культурные отсылки',
      'Писать литературные и аналитические тексты в любом регистре',
    ],
    canDoEn: [
      'Understand any text or speech effortlessly',
      'Freely use literary tenses (passé simple, subj. imparfait)',
      'Recognise stylistic figures and subtle cultural references',
      'Write literary and analytical texts in any register',
    ],
    grammarHighlightsRu: ['Subjonctif imparfait в активном употреблении', 'Passé simple в повествовании', 'Архаические формы (fût-il, eussé-je)', 'Стилистические фигуры'],
    grammarHighlightsEn: ['Active subjonctif imparfait', 'Passé simple in narration', 'Archaic forms (fût-il, eussé-je)', 'Rhetorical figures'],
    examSpec: {
      name: 'DALF C2',
      wordsRu: '~700 слов', wordsEn: '~700 words',
      durationRu: '3 ч 30 мин', durationEn: '3 h 30 min',
      pointsRu: '50 баллов', pointsEn: '50 points',
      focusRu: 'Compte rendu по аудио + статья',
      focusEn: 'Compte rendu from audio + article',
    },
  },
};

export const LEVEL_ORDER: Level[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
