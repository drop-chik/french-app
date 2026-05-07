import type { GrammarTopic } from './grammar-a1.js';

export const grammarTopicsB2: GrammarTopic[] = [

  // ─────────────────────────────────────────────────────────────
  // 1. Le subjonctif passé
  // ─────────────────────────────────────────────────────────────
  {
    slug: 'subjonctif-passe',
    titleRu: 'Субжонктив прошедшего времени',
    titleEn: 'The Past Subjunctive',
    titleFr: 'Le subjonctif passé',
    category: 'temps',
    orderNum: 1,
    content: [
      {
        type: 'paragraph',
        text: 'Субжонктив прошедшего времени (subjonctif passé) выражает действие, завершившееся до момента речи. Образуется из вспомогательного глагола (avoir или être) в субжонктиве настоящего времени + причастие прошедшего времени.',
      },
      {
        type: 'table',
        title: 'Образование: avoir/être в субжонктиве + participe passé',
        headers: ['Лицо', 'avec avoir (finir)', 'avec être (partir)'],
        rows: [
          ['que je', 'que j\'aie fini', 'que je sois parti(e)'],
          ['que tu', 'que tu aies fini', 'que tu sois parti(e)'],
          ["qu'il/elle", "qu'il ait fini", "qu'elle soit partie"],
          ['que nous', 'que nous ayons fini', 'que nous soyons parti(e)s'],
          ['que vous', 'que vous ayez fini', 'que vous soyez parti(e)s'],
          ["qu'ils/elles", "qu'ils aient fini", "qu'elles soient parties"],
        ],
      },
      {
        type: 'rule_list',
        title: 'Когда использовать субжонктив прошедшего времени:',
        rules: [
          'Когда действие в придаточном предшествует действию в главном: Je suis content qu\'il soit venu. (Я рад, что он пришёл.)',
          'После тех же конструкций, что и субжонктив настоящего: vouloir que, bien que, pour que — но действие уже совершилось.',
          'Главное правило: если субъект в главном и придаточном разные → субжонктив; если одинаковые → инфинитив прошедшего.',
          'Сравнение: Je regrette qu\'il soit parti. (он ушёл) vs Je regrette d\'être parti. (я сам ушёл.)',
        ],
      },
      {
        type: 'example_list',
        title: 'Примеры',
        items: [
          { fr: 'Je suis ravi qu\'elle ait réussi son examen.', ru: 'Я в восторге, что она сдала экзамен.', en: 'I am delighted that she passed her exam.' },
          { fr: 'Bien qu\'il ait plu, nous sommes sortis.', ru: 'Хотя и шёл дождь, мы вышли.', en: 'Although it had rained, we went out.' },
          { fr: 'Il est dommage que vous n\'ayez pas vu ce film.', ru: 'Жаль, что вы не видели этот фильм.', en: 'It\'s a pity you didn\'t see that film.' },
          { fr: 'Je doute qu\'ils soient déjà partis.', ru: 'Я сомневаюсь, что они уже ушли.', en: 'I doubt they have already left.' },
        ],
      },
    ],
    contentEn: [
      {
        type: 'paragraph',
        text: 'The past subjunctive (subjonctif passé) expresses an action that was completed before the action in the main clause. It is formed with avoir or être in the present subjunctive + past participle.',
      },
      {
        type: 'rule_list',
        title: 'When to use the past subjunctive:',
        rules: [
          'When the subordinate action happened before the main action: Je suis content qu\'il soit venu. (I\'m glad he came.)',
          'After the same triggers as the present subjunctive (vouloir que, bien que, etc.) — but the action is completed.',
          'Key distinction: different subjects → subjunctive; same subject → past infinitive (après avoir fini).',
        ],
      },
      {
        type: 'example_list',
        title: 'Examples',
        items: [
          { fr: 'Je suis ravi qu\'elle ait réussi son examen.', ru: 'I am delighted that she passed her exam.' },
          { fr: 'Bien qu\'il ait plu, nous sommes sortis.', ru: 'Although it had rained, we went out.' },
          { fr: 'Il est dommage que vous n\'ayez pas vu ce film.', ru: 'It\'s a pity you didn\'t see that film.' },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────
  // 2. La concordance des temps
  // ─────────────────────────────────────────────────────────────
  {
    slug: 'concordance-des-temps',
    titleRu: 'Согласование времён',
    titleEn: 'Sequence of Tenses',
    titleFr: 'La concordance des temps',
    category: 'temps',
    orderNum: 2,
    content: [
      {
        type: 'paragraph',
        text: 'Согласование времён — система правил, определяющих выбор времени в придаточном предложении в зависимости от времени главного. Особенно важна в косвенной речи и после si-придаточных.',
      },
      {
        type: 'table',
        title: 'Согласование в косвенной речи',
        headers: ['Время в главном', 'Прямая речь', 'Косвенная речь'],
        rows: [
          ['Présent / Futur', 'présent → présent', 'Il dit qu\'il travaille.'],
          ['Présent / Futur', 'futur → futur', 'Il dit qu\'il viendra.'],
          ['Présent / Futur', 'passé composé → passé composé', 'Il dit qu\'il a fini.'],
          ['Passé (imparfait/passé composé)', 'présent → imparfait', 'Il a dit qu\'il travaillait.'],
          ['Passé', 'futur → conditionnel présent', 'Il a dit qu\'il viendrait.'],
          ['Passé', 'passé composé → plus-que-parfait', 'Il a dit qu\'il avait fini.'],
          ['Passé', 'imparfait → imparfait (sans changement)', 'Il a dit qu\'il était fatigué.'],
        ],
      },
      {
        type: 'table',
        title: 'Согласование в условных предложениях (si)',
        headers: ['Тип условия', 'Si-придаточное', 'Главное предложение'],
        rows: [
          ['Реальное (présent)', 'si + présent', 'futur simple'],
          ['Маловероятное (présent)', 'si + imparfait', 'conditionnel présent'],
          ['Нереальное (passé)', 'si + plus-que-parfait', 'conditionnel passé'],
          ['Смешанное', 'si + plus-que-parfait', 'conditionnel présent'],
        ],
      },
      {
        type: 'example_list',
        title: 'Примеры',
        items: [
          { fr: 'Elle a annoncé qu\'elle partirait le lendemain.', ru: 'Она объявила, что уедет на следующий день.', en: 'She announced she would leave the next day.' },
          { fr: 'Il m\'a dit qu\'il avait déjà vu ce film.', ru: 'Он мне сказал, что уже видел этот фильм.', en: 'He told me he had already seen that film.' },
          { fr: 'Si tu étudiais davantage, tu réussirais.', ru: 'Если бы ты больше учился, ты бы добился успеха.', en: 'If you studied more, you would succeed.' },
          { fr: 'Si elle avait su, elle n\'aurait pas accepté.', ru: 'Если бы она знала, она бы не согласилась.', en: 'Had she known, she would not have agreed.' },
        ],
      },
    ],
    contentEn: [
      {
        type: 'paragraph',
        text: 'The sequence of tenses (concordance des temps) governs which tense is used in a subordinate clause based on the tense of the main clause. It is crucial in reported speech and si-clauses.',
      },
      {
        type: 'table',
        title: 'Tense shifts in reported speech (main verb in past)',
        headers: ['Direct speech tense', 'Shifts to'],
        rows: [
          ['présent', 'imparfait'],
          ['futur', 'conditionnel présent'],
          ['passé composé', 'plus-que-parfait'],
          ['imparfait', 'imparfait (no change)'],
        ],
      },
      {
        type: 'example_list',
        title: 'Examples',
        items: [
          { fr: 'Elle a annoncé qu\'elle partirait le lendemain.', ru: 'She announced she would leave the next day.' },
          { fr: 'Il m\'a dit qu\'il avait déjà vu ce film.', ru: 'He told me he had already seen that film.' },
          { fr: 'Si elle avait su, elle n\'aurait pas accepté.', ru: 'Had she known, she would not have agreed.' },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────
  // 3. Les pronoms relatifs composés
  // ─────────────────────────────────────────────────────────────
  {
    slug: 'pronoms-relatifs-composes',
    titleRu: 'Составные относительные местоимения',
    titleEn: 'Compound Relative Pronouns',
    titleFr: 'Les pronoms relatifs composés',
    category: 'pronoms',
    orderNum: 3,
    content: [
      {
        type: 'paragraph',
        text: 'Составные относительные местоимения (lequel, laquelle, lesquels, lesquelles) используются после предлогов для замены существительных — людей или предметов. В отличие от qui, они согласуются с родом и числом антецедента.',
      },
      {
        type: 'table',
        title: 'Формы lequel + слияние с à и de',
        headers: ['', 'Masculin sg.', 'Féminin sg.', 'Masculin pl.', 'Féminin pl.'],
        rows: [
          ['Базовая форма', 'lequel', 'laquelle', 'lesquels', 'lesquelles'],
          ['avec à', 'auquel', 'à laquelle', 'auxquels', 'auxquelles'],
          ['avec de', 'duquel', 'de laquelle', 'desquels', 'desquelles'],
        ],
      },
      {
        type: 'rule_list',
        title: 'Правила употребления:',
        rules: [
          'После предлогов avec, pour, sans, sur, dans и других (кроме de) → lequel/laquelle/lesquels/lesquelles: La table sur laquelle j\'écris. (Стол, на котором я пишу.)',
          'После предлога à → auquel / à laquelle / auxquels / auxquelles: Le projet auquel je participe. (Проект, в котором я участвую.)',
          'После предлога de → duquel / de laquelle / desquels / desquelles: Le bâtiment à côté duquel il habite. (Здание, рядом с которым он живёт.)',
          'Для людей после предлога à можно использовать qui: La personne à qui je parle. (НО: auquel более формально.)',
          'dont = de qui / duquel: L\'homme dont je parle. = L\'homme de qui / duquel je parle.',
        ],
      },
      {
        type: 'example_list',
        title: 'Примеры',
        items: [
          { fr: 'C\'est le projet auquel je travaille depuis un an.', ru: 'Это проект, над которым я работаю год.', en: 'This is the project I have been working on for a year.' },
          { fr: 'Voilà la raison pour laquelle je suis venu.', ru: 'Вот причина, по которой я пришёл.', en: 'That is the reason why I came.' },
          { fr: 'Les collègues avec lesquels je collabore sont compétents.', ru: 'Коллеги, с которыми я сотрудничаю, компетентны.', en: 'The colleagues with whom I collaborate are competent.' },
          { fr: 'Le mur contre lequel il s\'appuie est fragile.', ru: 'Стена, на которую он опирается, хрупкая.', en: 'The wall he is leaning against is fragile.' },
        ],
      },
    ],
    contentEn: [
      {
        type: 'paragraph',
        text: 'Compound relative pronouns (lequel, laquelle, lesquels, lesquelles) are used after prepositions to replace nouns. They agree in gender and number with the antecedent.',
      },
      {
        type: 'table',
        title: 'Forms with contractions (à / de)',
        headers: ['Preposition', 'Masculine sg.', 'Feminine sg.', 'Masculine pl.', 'Feminine pl.'],
        rows: [
          ['à', 'auquel', 'à laquelle', 'auxquels', 'auxquelles'],
          ['de', 'duquel', 'de laquelle', 'desquels', 'desquelles'],
          ['other preps.', 'lequel', 'laquelle', 'lesquels', 'lesquelles'],
        ],
      },
      {
        type: 'example_list',
        title: 'Examples',
        items: [
          { fr: 'C\'est le projet auquel je travaille depuis un an.', ru: 'This is the project I have been working on for a year.' },
          { fr: 'Voilà la raison pour laquelle je suis venu.', ru: 'That is the reason why I came.' },
          { fr: 'Les collègues avec lesquels je collabore sont compétents.', ru: 'The colleagues with whom I collaborate are competent.' },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────
  // 4. Le discours indirect au passé
  // ─────────────────────────────────────────────────────────────
  {
    slug: 'discours-indirect-passe',
    titleRu: 'Косвенная речь в прошедшем времени',
    titleEn: 'Reported Speech in the Past',
    titleFr: 'Le discours indirect au passé',
    category: 'syntaxe',
    orderNum: 4,
    content: [
      {
        type: 'paragraph',
        text: 'Когда глагол речи (dire, demander, annoncer и др.) стоит в прошедшем времени, все времена и ряд слов-маркеров в придаточном смещаются. Это называется согласованием времён в косвенной речи.',
      },
      {
        type: 'table',
        title: 'Сдвиг времён в косвенной речи (глагол речи в passé)',
        headers: ['Прямая речь', 'Косвенная речь'],
        rows: [
          ['présent → «Je travaille.»', 'imparfait → Il a dit qu\'il travaillait.'],
          ['futur simple → «Je partirai.»', 'conditionnel présent → Il a dit qu\'il partirait.'],
          ['futur proche → «Je vais partir.»', 'cond. prés. aller + inf. → Il a dit qu\'il allait partir.'],
          ['passé composé → «J\'ai fini.»', 'plus-que-parfait → Il a dit qu\'il avait fini.'],
          ['imparfait → «Il pleuvait.»', 'imparfait (без изменений) → Il a dit qu\'il pleuvait.'],
          ['impératif → «Viens!»', 'de + infinitif → Il m\'a dit de venir.'],
        ],
      },
      {
        type: 'table',
        title: 'Сдвиг слов-маркеров',
        headers: ['Прямая речь', 'Косвенная речь'],
        rows: [
          ['aujourd\'hui', 'ce jour-là'],
          ['hier', 'la veille'],
          ['demain', 'le lendemain'],
          ['maintenant', 'à ce moment-là'],
          ['ici', 'là'],
          ['cette semaine', 'cette semaine-là'],
          ['il y a deux jours', 'deux jours auparavant'],
        ],
      },
      {
        type: 'example_list',
        title: 'Примеры',
        items: [
          { fr: '«Je viendrai demain.» → Il a promis qu\'il viendrait le lendemain.', ru: '«Я приду завтра.» → Он обещал, что придёт на следующий день.', en: '"I will come tomorrow." → He promised he would come the next day.' },
          { fr: '«Ferme la fenêtre!» → Elle m\'a demandé de fermer la fenêtre.', ru: '«Закрой окно!» → Она попросила меня закрыть окно.', en: '"Close the window!" → She asked me to close the window.' },
          { fr: '«Nous avons réussi.» → Ils ont annoncé qu\'ils avaient réussi.', ru: '«Мы добились успеха.» → Они объявили, что добились успеха.', en: '"We succeeded." → They announced that they had succeeded.' },
        ],
      },
    ],
    contentEn: [
      {
        type: 'paragraph',
        text: 'When the reporting verb (dire, demander, etc.) is in the past, tenses and time markers in the subordinate clause shift according to the sequence of tenses rules.',
      },
      {
        type: 'table',
        title: 'Tense backshifts in reported speech',
        headers: ['Direct speech', 'Reported speech'],
        rows: [
          ['présent', 'imparfait'],
          ['futur simple', 'conditionnel présent'],
          ['passé composé', 'plus-que-parfait'],
          ['imparfait', 'imparfait (unchanged)'],
          ['impératif', 'de + infinitif'],
        ],
      },
      {
        type: 'example_list',
        title: 'Examples',
        items: [
          { fr: '«Je viendrai demain.» → Il a promis qu\'il viendrait le lendemain.', ru: '"I will come tomorrow." → He promised he would come the next day.' },
          { fr: '«Ferme la fenêtre!» → Elle m\'a demandé de fermer la fenêtre.', ru: '"Close the window!" → She asked me to close the window.' },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────
  // 5. La condition irréelle (si + plus-que-parfait)
  // ─────────────────────────────────────────────────────────────
  {
    slug: 'condition-irreelle',
    titleRu: 'Нереальное условие (si + plus-que-parfait)',
    titleEn: 'Unreal Conditional (si + pluperfect)',
    titleFr: 'La condition irréelle',
    category: 'syntaxe',
    orderNum: 5,
    content: [
      {
        type: 'paragraph',
        text: 'Нереальное условие в прошедшем выражает гипотетическую ситуацию, которая не произошла. Структура: si + plus-que-parfait → conditionnel passé. Также возможна смешанная форма: si + plus-que-parfait → conditionnel présent (последствие продолжается сейчас).',
      },
      {
        type: 'table',
        title: 'Три типа условных предложений',
        headers: ['Тип', 'Si-придаточное', 'Главное', 'Значение'],
        rows: [
          ['Реальное', 'présent', 'futur', 'возможное будущее'],
          ['Маловероятное', 'imparfait', 'conditionnel présent', 'гипотеза в настоящем'],
          ['Нереальное (прошлое)', 'plus-que-parfait', 'conditionnel passé', 'невозможное в прошлом'],
          ['Смешанное', 'plus-que-parfait', 'conditionnel présent', 'прошлое условие → настоящее следствие'],
        ],
      },
      {
        type: 'rule_list',
        title: 'Важные правила:',
        rules: [
          'НИКОГДА не используйте conditionnel после si в условных предложениях: ✗ Si j\'aurais su... → ✓ Si j\'avais su...',
          'Порядок предложений свободный: Si j\'avais étudié, j\'aurais réussi. = J\'aurais réussi si j\'avais étudié.',
          'Смешанное условие: Si tu avais étudié le français (прошлое), tu parlerais mieux maintenant (настоящее).',
          'À condition que + subjonctif — другой способ выразить условие: À condition qu\'il vienne, on pourra commencer.',
        ],
      },
      {
        type: 'example_list',
        title: 'Примеры',
        items: [
          { fr: 'Si j\'avais su la vérité, je ne serais pas venu.', ru: 'Если бы я знал правду, я бы не пришёл.', en: 'If I had known the truth, I would not have come.' },
          { fr: 'Tu aurais réussi si tu avais travaillé davantage.', ru: 'Ты бы добился успеха, если бы работал больше.', en: 'You would have succeeded if you had worked harder.' },
          { fr: 'Si elle avait pris le train, elle serait là maintenant.', ru: 'Если бы она села на поезд, она была бы здесь сейчас.', en: 'If she had taken the train, she would be here now.' },
          { fr: 'S\'il n\'avait pas plu, nous aurions fait une promenade.', ru: 'Если бы не шёл дождь, мы бы погуляли.', en: 'If it hadn\'t rained, we would have gone for a walk.' },
        ],
      },
    ],
    contentEn: [
      {
        type: 'paragraph',
        text: 'The unreal past conditional describes a situation that did not happen. Structure: si + plus-que-parfait → conditionnel passé. The mixed form (pluperfect → conditionnel présent) is used when a past condition has a present consequence.',
      },
      {
        type: 'rule_list',
        title: 'Key rules:',
        rules: [
          'NEVER use conditionnel directly after si: ✗ Si j\'aurais su → ✓ Si j\'avais su.',
          'Mixed conditional: Si tu avais étudié le français, tu parlerais mieux maintenant.',
        ],
      },
      {
        type: 'example_list',
        title: 'Examples',
        items: [
          { fr: 'Si j\'avais su la vérité, je ne serais pas venu.', ru: 'If I had known the truth, I would not have come.' },
          { fr: 'Si elle avait pris le train, elle serait là maintenant.', ru: 'If she had taken the train, she would be here now.' },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────
  // 6. La mise en relief
  // ─────────────────────────────────────────────────────────────
  {
    slug: 'mise-en-relief',
    titleRu: 'Выделение (c\'est...qui / c\'est...que)',
    titleEn: 'Emphasis / Cleft Sentences',
    titleFr: 'La mise en relief',
    category: 'syntaxe',
    orderNum: 6,
    content: [
      {
        type: 'paragraph',
        text: 'Выделение (mise en relief) позволяет подчеркнуть определённый элемент предложения. Основные структуры: c\'est...qui (подлежащее), c\'est...que (дополнение, обстоятельство), c\'est...dont, c\'est...où.',
      },
      {
        type: 'table',
        title: 'Структуры выделения',
        headers: ['Что выделяем', 'Структура', 'Пример'],
        rows: [
          ['Подлежащее', 'C\'est [N] qui + verbe', 'C\'est Pierre qui a appelé.'],
          ['Прямое дополнение', 'C\'est [N] que + sujet + verbe', 'C\'est ce livre que je cherche.'],
          ['Косвенное дополнение с de', 'C\'est [N] dont + sujet + verbe', 'C\'est lui dont je parlais.'],
          ['Обстоятельство места', 'C\'est [lieu] où + sujet + verbe', 'C\'est ici où il travaille.'],
          ['Обстоятельство времени', 'C\'est [temps] que + sujet + verbe', 'C\'est hier que je l\'ai vu.'],
        ],
      },
      {
        type: 'rule_list',
        title: 'Правила:',
        rules: [
          'C\'est / Ce sont: во множественном числе формально правильно ce sont, но в разговорной речи часто c\'est: C\'est eux qui ont tort.',
          'Глагол в придаточном согласуется с выделенным существительным: C\'est moi qui suis venu. (а не suis venus)',
          'Для усиления используют также: moi, je... / lui, il... (detachement): Moi, je ne sais pas. / Paul, il est parti.',
          'Ne confondez pas: c\'est qui (вопрос) vs c\'est...qui (выделение).',
        ],
      },
      {
        type: 'example_list',
        title: 'Примеры',
        items: [
          { fr: 'C\'est Marie qui a organisé la fête.', ru: 'Именно Мари организовала вечеринку.', en: 'It was Marie who organized the party.' },
          { fr: 'C\'est ce problème que nous devons résoudre.', ru: 'Именно эту проблему нам нужно решить.', en: 'It is this problem that we need to solve.' },
          { fr: 'C\'est en travaillant qu\'on apprend.', ru: 'Именно работая, мы учимся.', en: 'It is by working that one learns.' },
          { fr: 'Ce sont les enfants qui ont fait ce bruit.', ru: 'Именно дети создали этот шум.', en: 'It is the children who made that noise.' },
        ],
      },
    ],
    contentEn: [
      {
        type: 'paragraph',
        text: 'Cleft sentences (mise en relief) allow you to emphasize a specific element of a sentence. The main structures are: c\'est...qui (subject), c\'est...que (object/adverbial), c\'est...dont, c\'est...où.',
      },
      {
        type: 'table',
        title: 'Cleft structures',
        headers: ['Element highlighted', 'Structure'],
        rows: [
          ['Subject', 'C\'est [N] qui + verb'],
          ['Direct object', 'C\'est [N] que + subject + verb'],
          ['de-complement', 'C\'est [N] dont + subject + verb'],
          ['Time/place adverbial', 'C\'est [time/place] que/où + clause'],
        ],
      },
      {
        type: 'example_list',
        title: 'Examples',
        items: [
          { fr: 'C\'est Marie qui a organisé la fête.', ru: 'It was Marie who organized the party.' },
          { fr: 'C\'est ce problème que nous devons résoudre.', ru: 'It is this problem that we need to solve.' },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────
  // 7. La négation complexe
  // ─────────────────────────────────────────────────────────────
  {
    slug: 'negation-complexe',
    titleRu: 'Сложное отрицание',
    titleEn: 'Complex Negation',
    titleFr: 'La négation complexe',
    category: 'syntaxe',
    orderNum: 7,
    content: [
      {
        type: 'paragraph',
        text: 'На уровне B2 важно владеть расширенным спектром отрицательных конструкций: ne...ni...ni, ne...guère, ne...nullement, ne...aucunement, ne...point, а также позиционными особенностями при сложных временах и инфинитиве.',
      },
      {
        type: 'table',
        title: 'Отрицательные конструкции B2',
        headers: ['Конструкция', 'Значение', 'Пример'],
        rows: [
          ['ne...ni...ni', 'ни...ни', 'Il ne mange ni viande ni poisson.'],
          ['ne...guère', 'почти не (книжн.)', 'Il ne travaille guère ces jours-ci.'],
          ['ne...nullement', 'ничуть не, совсем не', 'Je ne suis nullement d\'accord.'],
          ['ne...aucunement', 'никоим образом', 'Cela ne me concerne aucunement.'],
          ['ne...point', 'не (архаич./литер.)', 'Je ne sais point pourquoi.'],
          ['ne...plus guère', 'почти больше не', 'On n\'entend plus guère ce mot.'],
          ['sans + infinitif', 'без того чтобы', 'Il est parti sans rien dire.'],
        ],
      },
      {
        type: 'rule_list',
        title: 'Особенности позиции отрицания:',
        rules: [
          'При сложных временах: ne перед вспомогательным, pas/jamais/plus перед причастием: Je n\'ai jamais vu cela.',
          'При инфинитиве: оба элемента ставятся ПЕРЕД инфинитивом: Il préfère ne pas venir. / Il a décidé de ne jamais mentir.',
          'ne...ni...ni: артикль после ni отсутствует: Il n\'a ni patience ni courage. (не: *ni la patience)',
          'ne...aucun(e): aucun согласуется с существительным: Je n\'ai aucune idée. / Il n\'a aucun problème.',
          'Двойное отрицание с jamais et rien: Je n\'ai jamais rien compris à ça.',
        ],
      },
      {
        type: 'example_list',
        title: 'Примеры',
        items: [
          { fr: 'Elle n\'a ni mangé ni dormi de toute la nuit.', ru: 'Она не ела и не спала всю ночь.', en: 'She neither ate nor slept all night.' },
          { fr: 'Ce rapport ne m\'a guère convaincu.', ru: 'Этот доклад меня почти не убедил.', en: 'That report hardly convinced me.' },
          { fr: 'Il a décidé de ne jamais revenir dans cette ville.', ru: 'Он решил никогда не возвращаться в этот город.', en: 'He decided never to return to this city.' },
          { fr: 'Je ne suis nullement responsable de cette erreur.', ru: 'Я совершенно не несу ответственности за эту ошибку.', en: 'I am in no way responsible for this mistake.' },
        ],
      },
    ],
    contentEn: [
      {
        type: 'paragraph',
        text: 'B2-level negation includes ne...ni...ni, ne...guère (hardly), ne...nullement / ne...aucunement (not at all), and ne...point (literary). Word order with compound tenses and infinitives also requires attention.',
      },
      {
        type: 'rule_list',
        title: 'Key rules:',
        rules: [
          'With compound tenses: ne before auxiliary, negation word before participle: Je n\'ai jamais vu cela.',
          'With infinitive: both elements go BEFORE the infinitive: Il préfère ne pas venir.',
          'ne...ni...ni: no article after ni: Il n\'a ni patience ni courage.',
        ],
      },
      {
        type: 'example_list',
        title: 'Examples',
        items: [
          { fr: 'Elle n\'a ni mangé ni dormi de toute la nuit.', ru: 'She neither ate nor slept all night.' },
          { fr: 'Il a décidé de ne jamais revenir dans cette ville.', ru: 'He decided never to return to this city.' },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────
  // 8. La nominalisation
  // ─────────────────────────────────────────────────────────────
  {
    slug: 'nominalisation',
    titleRu: 'Номинализация',
    titleEn: 'Nominalisation',
    titleFr: 'La nominalisation',
    category: 'lexique',
    orderNum: 8,
    content: [
      {
        type: 'paragraph',
        text: 'Номинализация — преобразование глагола или прилагательного в существительное. Широко используется в письменном и официальном французском языке для создания более компактных и формальных конструкций.',
      },
      {
        type: 'table',
        title: 'Основные суффиксы номинализации',
        headers: ['Суффикс', 'Образование', 'Пример'],
        rows: [
          ['-tion / -sion', 'от глагола или лат. основы', 'décider → la décision; organiser → l\'organisation'],
          ['-ment', 'от глагола', 'développer → le développement; arriver → l\'arrivée'],
          ['-age', 'от глагола', 'voyager → le voyage; laver → le lavage'],
          ['-ance / -ence', 'от прилагательного', 'patient → la patience; différent → la différence'],
          ['-ité / -té', 'от прилагательного', 'libre → la liberté; capable → la capacité'],
          ['-eur / -euse', 'от глагола', 'vendre → le vendeur; nager → le nageur'],
          ['Инфинитив как сущ.', 'инфинитив', 'Le manger, le boire — гастрономия'],
        ],
      },
      {
        type: 'rule_list',
        title: 'Как использовать номинализацию:',
        rules: [
          'Замена придаточного: Parce qu\'il est parti → en raison de son départ. (Из-за того, что он уехал → из-за его отъезда.)',
          'Придаёт тексту официальность: Son refus de participer nous a surpris. (Его отказ участвовать нас удивил.)',
          'Согласование рода: у образованных существительных свой род, его нужно запоминать.',
          'Существительные с предлогом de заменяют придаточное с que: Il a annoncé sa démission. (Он объявил об отставке.) = Il a annoncé qu\'il démissionnait.',
        ],
      },
      {
        type: 'example_list',
        title: 'Примеры',
        items: [
          { fr: 'La création de ce projet a pris deux ans.', ru: 'Создание этого проекта заняло два года.', en: 'The creation of this project took two years.' },
          { fr: 'En raison de son absence, la réunion a été annulée.', ru: 'Из-за его отсутствия собрание было отменено.', en: 'Due to his absence, the meeting was cancelled.' },
          { fr: 'Le développement économique est une priorité.', ru: 'Экономическое развитие является приоритетом.', en: 'Economic development is a priority.' },
          { fr: 'La réduction des inégalités reste un défi majeur.', ru: 'Сокращение неравенства остаётся серьёзным вызовом.', en: 'Reducing inequalities remains a major challenge.' },
        ],
      },
    ],
    contentEn: [
      {
        type: 'paragraph',
        text: 'Nominalisation converts verbs or adjectives into nouns. It is extensively used in formal and written French to create concise, register-appropriate structures.',
      },
      {
        type: 'table',
        title: 'Common nominalisation suffixes',
        headers: ['Suffix', 'Source', 'Example'],
        rows: [
          ['-tion / -sion', 'verb', 'décider → la décision'],
          ['-ment', 'verb', 'développer → le développement'],
          ['-age', 'verb', 'laver → le lavage'],
          ['-ance / -ence', 'adjective', 'patient → la patience'],
          ['-ité / -té', 'adjective', 'libre → la liberté'],
        ],
      },
      {
        type: 'example_list',
        title: 'Examples',
        items: [
          { fr: 'En raison de son absence, la réunion a été annulée.', ru: 'Due to his absence, the meeting was cancelled.' },
          { fr: 'Le développement économique est une priorité.', ru: 'Economic development is a priority.' },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────
  // 9. L'expression du temps avancée
  // ─────────────────────────────────────────────────────────────
  {
    slug: 'expression-temps-avancee',
    titleRu: 'Сложные временны́е конструкции',
    titleEn: 'Advanced Time Expressions',
    titleFr: "L'expression du temps avancée",
    category: 'syntaxe',
    orderNum: 9,
    content: [
      {
        type: 'paragraph',
        text: 'На уровне B2 важно точно выражать временны́е отношения: предшествование, одновременность, следование, длительность. Ключевые конструкции включают dès que + futur antérieur, depuis que, avant que + subjonctif и другие.',
      },
      {
        type: 'table',
        title: 'Временны́е союзы и конструкции',
        headers: ['Конструкция', 'Время в придаточном', 'Значение'],
        rows: [
          ['quand / lorsque (будущее)', 'futur simple / futur antérieur', 'одновременность в будущем'],
          ['dès que / aussitôt que', 'futur antérieur', 'сразу как только (завершённое)'],
          ['après que', 'futur antérieur / passé', 'после того как'],
          ['avant que', 'subjonctif présent', 'до того как'],
          ['pendant que / tandis que', 'imparfait / présent', 'одновременность'],
          ['depuis que', 'présent / imparfait', 'с тех пор как'],
          ['jusqu\'à ce que', 'subjonctif présent', 'пока не'],
          ['au moment où', 'imparfait', 'в тот момент когда'],
        ],
      },
      {
        type: 'rule_list',
        title: 'Ключевые правила:',
        rules: [
          'Dès que + futur antérieur в будущем контексте: Dès que tu auras fini, appelle-moi. (Как только закончишь, позвони мне.)',
          'Avant que → всегда субжонктив: Il faut partir avant qu\'il ne soit trop tard.',
          'Après que → изъявительное наклонение (НЕ субжонктив!): Après qu\'il est parti, nous avons parlé.',
          'Depuis que → présent (действие продолжается): Depuis qu\'il est là, tout va mieux.',
          'Pendant que указывает на одновременность длительных действий: Pendant qu\'elle chantait, il jouait du piano.',
        ],
      },
      {
        type: 'example_list',
        title: 'Примеры',
        items: [
          { fr: 'Dès que vous aurez soumis le formulaire, vous recevrez une confirmation.', ru: 'Как только вы отправите форму, вы получите подтверждение.', en: 'As soon as you have submitted the form, you will receive a confirmation.' },
          { fr: 'Nous attendrons jusqu\'à ce qu\'il arrive.', ru: 'Мы будем ждать, пока он не придёт.', en: 'We will wait until he arrives.' },
          { fr: 'Depuis qu\'il a changé de travail, il est beaucoup plus heureux.', ru: 'С тех пор как он сменил работу, он намного счастливее.', en: 'Since he changed jobs, he has been much happier.' },
          { fr: 'Partez avant qu\'il ne soit trop tard.', ru: 'Уходите, пока не стало слишком поздно.', en: 'Leave before it is too late.' },
        ],
      },
    ],
    contentEn: [
      {
        type: 'paragraph',
        text: 'Advanced time expressions at B2 level include dès que + futur antérieur, avant que + subjunctive, après que + indicative, depuis que, and jusqu\'à ce que + subjunctive.',
      },
      {
        type: 'rule_list',
        title: 'Key rules:',
        rules: [
          'Dès que / aussitôt que in future: futur antérieur in the subordinate clause.',
          'Avant que → always subjunctive.',
          'Après que → indicative (NOT subjunctive), despite common error in spoken French.',
          'Jusqu\'à ce que → always subjunctive.',
        ],
      },
      {
        type: 'example_list',
        title: 'Examples',
        items: [
          { fr: 'Dès que vous aurez soumis le formulaire, vous recevrez une confirmation.', ru: 'As soon as you have submitted the form, you will receive a confirmation.' },
          { fr: 'Nous attendrons jusqu\'à ce qu\'il arrive.', ru: 'We will wait until he arrives.' },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────
  // 10. L'infinitif passé
  // ─────────────────────────────────────────────────────────────
  {
    slug: 'infinitif-passe',
    titleRu: 'Инфинитив прошедшего времени',
    titleEn: 'Past Infinitive',
    titleFr: "L'infinitif passé",
    category: 'temps',
    orderNum: 10,
    content: [
      {
        type: 'paragraph',
        text: 'Инфинитив прошедшего времени (infinitif passé) обозначает действие, завершённое до действия главного глагола, при одинаковом подлежащем. Образуется: avoir/être в инфинитиве + причастие прошедшего времени.',
      },
      {
        type: 'table',
        title: 'Образование инфинитива прошедшего',
        headers: ['Вспомогательный', 'Структура', 'Пример'],
        rows: [
          ['avoir', 'avoir + participe passé', 'avoir fini, avoir mangé, avoir vu'],
          ['être', 'être + participe passé', 'être parti(e), être arrivé(e), être né(e)'],
          ['Возвратные', "s'être + participe passé", "s'être levé(e), s'être trompé(e)"],
        ],
      },
      {
        type: 'rule_list',
        title: 'Употребление:',
        rules: [
          'После après (предлог): Après avoir dîné, il est sorti. (Поужинав, он вышел.) — подлежащее всегда одинаковое!',
          'Замена субжонктива прошедшего при одинаковом подлежащем: Je regrette d\'être arrivé en retard. (а не: que je sois arrivé)',
          'После pour (цель + завершённое действие): Il a été puni pour avoir menti. (Его наказали за то, что он солгал.)',
          'После sans: Il est parti sans avoir prévenu personne. (Он ушёл, никого не предупредив.)',
          'Согласование причастия с être: Après être arrivées, elles ont mangé. (femmes — arrivées)',
        ],
      },
      {
        type: 'example_list',
        title: 'Примеры',
        items: [
          { fr: 'Après avoir terminé ses études, elle a trouvé un bon emploi.', ru: 'Закончив учёбу, она нашла хорошую работу.', en: 'After finishing her studies, she found a good job.' },
          { fr: 'Il regrette de ne pas être venu à la fête.', ru: 'Он сожалеет, что не пришёл на вечеринку.', en: 'He regrets not having come to the party.' },
          { fr: 'Elle a été félicitée pour avoir sauvé l\'enfant.', ru: 'Её поздравили за то, что она спасла ребёнка.', en: 'She was congratulated for having saved the child.' },
          { fr: 'Après s\'être levé, il a préparé le café.', ru: 'Встав, он приготовил кофе.', en: 'After getting up, he made coffee.' },
        ],
      },
    ],
    contentEn: [
      {
        type: 'paragraph',
        text: 'The past infinitive (infinitif passé) expresses an action completed before the main verb\'s action, with the same subject. Formed with avoir or être in the infinitive + past participle.',
      },
      {
        type: 'rule_list',
        title: 'Main uses:',
        rules: [
          'After après: Après avoir dîné, il est sorti. — subjects MUST be the same.',
          'After pour (completed action): Il a été puni pour avoir menti.',
          'After sans: Il est parti sans avoir prévenu personne.',
          'Replaces past subjunctive when subject is the same: Je regrette d\'être arrivé en retard.',
        ],
      },
      {
        type: 'example_list',
        title: 'Examples',
        items: [
          { fr: 'Après avoir terminé ses études, elle a trouvé un bon emploi.', ru: 'After finishing her studies, she found a good job.' },
          { fr: 'Il regrette de ne pas être venu à la fête.', ru: 'He regrets not having come to the party.' },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────
  // 11. Les tournures impersonnelles avancées
  // ─────────────────────────────────────────────────────────────
  {
    slug: 'tournures-impersonnelles',
    titleRu: 'Безличные конструкции (продвинутый уровень)',
    titleEn: 'Advanced Impersonal Constructions',
    titleFr: 'Les tournures impersonnelles avancées',
    category: 'syntaxe',
    orderNum: 11,
    content: [
      {
        type: 'paragraph',
        text: 'Безличные конструкции широко используются в официальном и письменном французском. На B2 необходимо знать не только il faut / il y a, но и разнообразные конструкции типа il s\'avère que, il paraît que, il est question de, il convient de.',
      },
      {
        type: 'table',
        title: 'Безличные конструкции B2',
        headers: ['Конструкция', 'Значение', 'Управление'],
        rows: [
          ['il s\'avère que', 'оказывается, что', '+ indicatif'],
          ['il paraît que', 'говорят, что; похоже, что', '+ indicatif'],
          ['il se peut que', 'возможно, что', '+ subjonctif'],
          ['il est question de', 'речь идёт о; планируется', '+ nom / infinitif'],
          ['il convient de', 'следует, уместно', '+ infinitif'],
          ['il importe de / que', 'важно', '+ inf. / subjonctif'],
          ['il suffit de / que', 'достаточно', '+ inf. / subjonctif'],
          ['il est prévu que', 'планируется, что', '+ indicatif / subjonctif'],
          ['il n\'est pas exclu que', 'нельзя исключить, что', '+ subjonctif'],
          ['il va sans dire que', 'само собой разумеется', '+ indicatif'],
        ],
      },
      {
        type: 'example_list',
        title: 'Примеры',
        items: [
          { fr: 'Il s\'avère que cette information était incorrecte.', ru: 'Оказывается, эта информация была неверной.', en: 'It turns out that this information was incorrect.' },
          { fr: 'Il se peut qu\'il y ait un problème technique.', ru: 'Возможно, есть техническая проблема.', en: 'There may be a technical problem.' },
          { fr: 'Il convient de vérifier ces données avant publication.', ru: 'Следует проверить эти данные перед публикацией.', en: 'It is advisable to verify this data before publication.' },
          { fr: 'Il est question d\'ouvrir une nouvelle filiale à Lyon.', ru: 'Речь идёт об открытии нового филиала в Лионе.', en: 'There is talk of opening a new branch in Lyon.' },
          { fr: 'Il va sans dire que vous êtes le bienvenu.', ru: 'Само собой разумеется, что вы здесь желанный гость.', en: 'It goes without saying that you are welcome.' },
        ],
      },
    ],
    contentEn: [
      {
        type: 'paragraph',
        text: 'Advanced impersonal constructions are essential in formal and written French. At B2 level, key expressions include il s\'avère que (+ indicative), il se peut que (+ subjunctive), il convient de (+ infinitive), il est question de, and il va sans dire que.',
      },
      {
        type: 'table',
        title: 'Key constructions and their governance',
        headers: ['Construction', 'Meaning', 'Followed by'],
        rows: [
          ['il s\'avère que', 'it turns out that', 'indicatif'],
          ['il se peut que', 'it is possible that', 'subjonctif'],
          ['il convient de', 'it is advisable to', 'infinitif'],
          ['il suffit de/que', 'it is enough to/that', 'inf. / subjonctif'],
          ['il va sans dire que', 'it goes without saying', 'indicatif'],
        ],
      },
      {
        type: 'example_list',
        title: 'Examples',
        items: [
          { fr: 'Il s\'avère que cette information était incorrecte.', ru: 'It turns out that this information was incorrect.' },
          { fr: 'Il convient de vérifier ces données avant publication.', ru: 'It is advisable to verify this data before publication.' },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────
  // 12. Les connecteurs logiques B2
  // ─────────────────────────────────────────────────────────────
  {
    slug: 'connecteurs-b2',
    titleRu: 'Логические коннекторы уровня B2',
    titleEn: 'Logical Connectors B2',
    titleFr: 'Les connecteurs logiques B2',
    category: 'lexique',
    orderNum: 12,
    content: [
      {
        type: 'paragraph',
        text: 'Уровень B2 требует точного использования разнообразных коннекторов для структурирования аргументации, выражения причины, следствия, уступки и противопоставления в письменном и устном дискурсе.',
      },
      {
        type: 'table',
        title: 'Коннекторы по функции',
        headers: ['Функция', 'Коннектор', 'Пример'],
        rows: [
          ['Причина', 'étant donné que', 'Étant donné que le budget est limité, nous devons choisir.'],
          ['Причина', 'vu que / attendu que', 'Vu qu\'il pleut, restons ici.'],
          ['Следствие', 'de sorte que / si bien que', 'Il a travaillé dur, si bien qu\'il a réussi.'],
          ['Следствие', 'au point que / à tel point que', 'Il était fatigué au point qu\'il ne pouvait plus parler.'],
          ['Уступка', 'or', 'Or, les résultats sont différents. (однако, между тем)'],
          ['Уступка', 'quand bien même + conditionnel', 'Quand bien même il viendrait, cela ne changerait rien.'],
          ['Противопоставление', 'en revanche / par contre', 'Il est brillant; en revanche, il manque d\'organisation.'],
          ['Подтверждение', 'en effet', 'La situation est grave. En effet, les chiffres montrent...'],
          ['Добавление', 'd\'autant plus que', 'C\'est difficile, d\'autant plus que nous manquons de temps.'],
          ['Ограничение', 'pour autant', 'Il a échoué, sans pour autant se décourager.'],
        ],
      },
      {
        type: 'rule_list',
        title: 'Тонкости употребления:',
        rules: [
          'or ≠ ou: «or» — коннектор («между тем, однако»), «ou» — союз «или».',
          'en effet подтверждает предыдущее утверждение, не путать с en fait (на самом деле, однако).',
          'd\'autant plus que усиливает предшествующую мысль: Cela m\'inquiète, d\'autant plus que personne ne le sait.',
          'quand bien même + conditionnel: даже если бы (нереальное условие): Quand bien même tu insisterais, je ne changerais pas d\'avis.',
          'pour autant используется в отрицательных конструкциях: Il a perdu, sans pour autant abandonner.',
        ],
      },
      {
        type: 'example_list',
        title: 'Примеры',
        items: [
          { fr: 'Étant donné que les délais sont serrés, nous devons accélérer.', ru: 'Учитывая сжатые сроки, нам нужно ускориться.', en: 'Given that deadlines are tight, we need to speed up.' },
          { fr: 'Il s\'est trompé ; or, il ne l\'admettra jamais.', ru: 'Он ошибся; однако он никогда в этом не признается.', en: 'He was wrong; however, he will never admit it.' },
          { fr: 'La tâche est complexe, d\'autant plus qu\'il n\'existe pas de solution simple.', ru: 'Задача сложна, тем более что простого решения не существует.', en: 'The task is complex, all the more so as there is no simple solution.' },
          { fr: 'Il a obtenu de bons résultats, en revanche ses collègues ont échoué.', ru: 'Он получил хорошие результаты, тогда как его коллеги потерпели неудачу.', en: 'He got good results; his colleagues, on the other hand, failed.' },
        ],
      },
    ],
    contentEn: [
      {
        type: 'paragraph',
        text: 'B2 logical connectors allow nuanced argumentation. Key additions at this level: or (however/yet), en effet (indeed), d\'autant plus que (all the more because), en revanche/par contre (on the other hand), quand bien même + conditional (even if), pour autant (even so).',
      },
      {
        type: 'rule_list',
        title: 'Common pitfalls:',
        rules: [
          'or (connector: "yet/however") ≠ ou (conjunction: "or").',
          'en effet (confirms previous statement) ≠ en fait (contrasts: "actually").',
          'quand bien même takes the conditional: Quand bien même tu insisterais, je ne changerais pas d\'avis.',
        ],
      },
      {
        type: 'example_list',
        title: 'Examples',
        items: [
          { fr: 'Il s\'est trompé ; or, il ne l\'admettra jamais.', ru: 'He was wrong; however, he will never admit it.' },
          { fr: 'La tâche est complexe, d\'autant plus qu\'il n\'existe pas de solution simple.', ru: 'The task is complex, all the more so as there is no simple solution.' },
        ],
      },
    ],
  },
];
