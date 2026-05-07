import type { GrammarTopic } from './grammar-a1.js';

export const grammarTopicsB1Extra: GrammarTopic[] = [

  // ─────────────────────────────────────────────────────────────
  // 1. L'hypothèse avec si
  // ─────────────────────────────────────────────────────────────
  {
    slug: 'hypothese-si',
    titleRu: 'Условные предложения с si',
    titleEn: 'Conditional Sentences with si',
    titleFr: "L'hypothèse avec si",
    category: 'syntaxe',
    orderNum: 19,
    content: [
      {
        type: 'paragraph',
        text: 'Условные предложения с si выражают условие и его следствие. На уровне B1 нужно уверенно владеть тремя основными типами: реальным (тип 1), гипотетическим (тип 2) и нереальным в прошлом (тип 3, который подробно разбирается в B2).',
      },
      {
        type: 'table',
        title: 'Три типа условных предложений',
        headers: ['Тип', 'Si-придаточное', 'Главное предложение', 'Значение'],
        rows: [
          ['Тип 1 — реальное', 'si + présent', 'futur simple (или présent)', 'возможная ситуация в будущем/настоящем'],
          ['Тип 2 — гипотетическое', 'si + imparfait', 'conditionnel présent', 'маловероятная или воображаемая ситуация'],
          ['Тип 3 — нереальное (B2)', 'si + plus-que-parfait', 'conditionnel passé', 'невозможная ситуация в прошлом'],
        ],
      },
      {
        type: 'rule_list',
        title: 'Ключевые правила:',
        rules: [
          'НИКОГДА не ставьте conditionnel сразу после si: ✗ Si tu voudrais → ✓ Si tu voulais.',
          'Порядок предложений можно менять: Si tu viens, je serai content. = Je serai content si tu viens.',
          'Тип 1: Si tu travailles bien, tu réussiras. (Если ты будешь хорошо работать, ты добьёшься успеха.)',
          'Тип 2: Si j\'avais de l\'argent, j\'achèterais une voiture. (Если бы у меня были деньги, я бы купил машину.)',
          'Si + on = si + nous (разговорный): Si on partait maintenant? (А что если нам уехать прямо сейчас?)',
        ],
      },
      {
        type: 'example_list',
        title: 'Примеры',
        items: [
          { fr: 'Si tu as faim, il y a du pain dans la cuisine.', ru: 'Если ты голоден, на кухне есть хлеб.', en: 'If you are hungry, there is bread in the kitchen.' },
          { fr: 'Si je gagnais à la loterie, je ferais le tour du monde.', ru: 'Если бы я выиграл в лотерею, я бы объехал весь мир.', en: 'If I won the lottery, I would travel around the world.' },
          { fr: 'Si tu étudies régulièrement, tu feras des progrès.', ru: 'Если ты будешь заниматься регулярно, ты будешь делать успехи.', en: 'If you study regularly, you will make progress.' },
          { fr: 'Si j\'étais à ta place, je lui parlerais directement.', ru: 'Если бы я был на твоём месте, я бы поговорил с ним напрямую.', en: 'If I were in your place, I would talk to him directly.' },
        ],
      },
    ],
    contentEn: [
      {
        type: 'paragraph',
        text: 'Conditional sentences with si have three main types. The key rule: NEVER use the conditional tense immediately after si.',
      },
      {
        type: 'table',
        title: 'Three types of si-conditionals',
        headers: ['Type', 'Si-clause', 'Main clause'],
        rows: [
          ['Real (type 1)', 'si + présent', 'futur simple'],
          ['Hypothetical (type 2)', 'si + imparfait', 'conditionnel présent'],
          ['Unreal past (type 3, B2)', 'si + plus-que-parfait', 'conditionnel passé'],
        ],
      },
      {
        type: 'example_list',
        title: 'Examples',
        items: [
          { fr: 'Si tu travailles bien, tu réussiras.', ru: 'If you work well, you will succeed.' },
          { fr: 'Si j\'avais de l\'argent, j\'achèterais une voiture.', ru: 'If I had money, I would buy a car.' },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────
  // 2. Le participe présent
  // ─────────────────────────────────────────────────────────────
  {
    slug: 'participe-present',
    titleRu: 'Причастие настоящего времени',
    titleEn: 'The Present Participle',
    titleFr: 'Le participe présent',
    category: 'verbes',
    orderNum: 20,
    content: [
      {
        type: 'paragraph',
        text: 'Причастие настоящего времени (participe présent) — неизменяемая глагольная форма, оканчивающаяся на -ant. Образуется от основы формы «nous» в présent. Не путайте с герундием (gérondif), который образуется так же, но требует предлога en.',
      },
      {
        type: 'table',
        title: 'Образование причастия настоящего времени',
        headers: ['Глагол', 'Форма nous', 'Основа', 'Participe présent'],
        rows: [
          ['parler', 'nous parlons', 'parl-', 'parlant'],
          ['finir', 'nous finissons', 'finiss-', 'finissant'],
          ['prendre', 'nous prenons', 'pren-', 'prenant'],
          ['venir', 'nous venons', 'ven-', 'venant'],
          ['être', '—', '—', 'étant (нерег.)'],
          ['avoir', '—', '—', 'ayant (нерег.)'],
          ['savoir', '—', '—', 'sachant (нерег.)'],
        ],
      },
      {
        type: 'table',
        title: 'Participe présent vs Gérondif',
        headers: ['', 'Participe présent', 'Gérondif'],
        rows: [
          ['Форма', '-ant', 'en + -ant'],
          ['Согласование', 'не изменяется', 'не изменяется'],
          ['Функция', 'заменяет придаточное (кто/который)', 'обстоятельство (как/когда)'],
          ['Подлежащее', 'может отличаться от главного', 'то же, что и в главном'],
          ['Пример', 'Un homme portant un chapeau... (который несёт)', 'Il chante en travaillant. (работая)'],
        ],
      },
      {
        type: 'rule_list',
        title: 'Употребление причастия настоящего:',
        rules: [
          'Замена придаточного определительного: Une personne parlant français. = Une personne qui parle français.',
          'Причинная связь (одновременное действие): Étant malade, il n\'est pas venu. (Будучи болен, он не пришёл.)',
          'Не изменяется по роду и числу: une femme parlant anglais / des hommes parlant anglais.',
          'Gérondif (en + -ant) — одно и то же подлежащее: Il écoute de la musique en travaillant.',
          'Participe présent — может быть другое подлежащее: La pluie tombant, nous sommes restés. (книжн.)',
        ],
      },
      {
        type: 'example_list',
        title: 'Примеры',
        items: [
          { fr: 'J\'ai rencontré une femme parlant quatre langues.', ru: 'Я встретил женщину, говорящую на четырёх языках.', en: 'I met a woman speaking four languages.' },
          { fr: 'Ne sachant pas la réponse, il a gardé le silence.', ru: 'Не зная ответа, он промолчал.', en: 'Not knowing the answer, he kept silent.' },
          { fr: 'Les étudiants ayant fini l\'examen peuvent partir.', ru: 'Студенты, закончившие экзамен, могут уходить.', en: 'Students having finished the exam may leave.' },
          { fr: 'Il travaille en écoutant de la musique. (gérondif)', ru: 'Он работает, слушая музыку.', en: 'He works while listening to music.' },
        ],
      },
    ],
    contentEn: [
      {
        type: 'paragraph',
        text: 'The present participle (participe présent) ends in -ant and is formed from the nous-stem of the present tense. It is invariable. Don\'t confuse it with the gérondif (en + -ant), which requires the same subject as the main verb.',
      },
      {
        type: 'table',
        title: 'Participe présent vs Gérondif',
        headers: ['', 'Participe présent', 'Gérondif'],
        rows: [
          ['Form', '-ant', 'en + -ant'],
          ['Function', 'replaces relative clause (who/which)', 'adverbial (how/while)'],
          ['Subject', 'can differ from main clause', 'must match main clause subject'],
        ],
      },
      {
        type: 'example_list',
        title: 'Examples',
        items: [
          { fr: 'J\'ai rencontré une femme parlant quatre langues.', ru: 'I met a woman speaking four languages.' },
          { fr: 'Ne sachant pas la réponse, il a gardé le silence.', ru: 'Not knowing the answer, he kept silent.' },
        ],
      },
    ],
  },
];
