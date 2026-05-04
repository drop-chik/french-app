import type { GrammarTopic } from './grammar-a1.js';

export const grammarTopicsB1: GrammarTopic[] = [

  // ─────────────────────────────────────────────────────────────
  // 1. Le subjonctif présent
  // ─────────────────────────────────────────────────────────────
  {
    slug: 'subjonctif-present',
    titleRu: 'Субжонктив настоящего времени',
    titleEn: 'The Present Subjunctive',
    titleFr: 'Le subjonctif présent',
    category: 'temps',
    orderNum: 1,
    content: [
      {
        type: 'paragraph',
        text: 'Субжонктив (subjonctif) — особое наклонение, выражающее субъективное отношение к действию: желание, сомнение, эмоцию, необходимость. Образуется от основы формы «ils» в présent + окончания.',
      },
      {
        type: 'table',
        title: 'Образование субжонктива: основа ils + окончания',
        headers: ['Лицо', 'Окончание', 'parler (ils parlent → parl-)', 'finir (ils finissent → finiss-)'],
        rows: [
          ['que je', '-e', 'que je parle', 'que je finisse'],
          ['que tu', '-es', 'que tu parles', 'que tu finisses'],
          ["qu'il/elle", '-e', "qu'il parle", "qu'il finisse"],
          ['que nous', '-ions', 'que nous parlions', 'que nous finissions'],
          ['que vous', '-iez', 'que vous parliez', 'que vous finissiez'],
          ["qu'ils/elles", '-ent', "qu'ils parlent", "qu'ils finissent"],
        ],
      },
      {
        type: 'table',
        title: 'Неправильные глаголы в субжонктиве',
        headers: ['Глагол', 'Формы субжонктива'],
        rows: [
          ['être', 'sois, sois, soit, soyons, soyez, soient'],
          ['avoir', 'aie, aies, ait, ayons, ayez, aient'],
          ['aller', 'aille, ailles, aille, allions, alliez, aillent'],
          ['faire', 'fasse, fasses, fasse, fassions, fassiez, fassent'],
          ['pouvoir', 'puisse, puisses, puisse, puissions, puissiez, puissent'],
          ['savoir', 'sache, saches, sache, sachions, sachiez, sachent'],
          ['vouloir', 'veuille, veuilles, veuille, voulions, vouliez, veuillent'],
        ],
      },
      {
        type: 'rule_list',
        title: 'Когда используется субжонктив (после que):',
        rules: [
          'Желание и воля: vouloir que, souhaiter que, préférer que, exiger que — Je veux que tu viennes. (Я хочу, чтобы ты пришёл.)',
          'Необходимость: il faut que, il est nécessaire que — Il faut que vous sachiez. (Нужно, чтобы вы знали.)',
          'Эмоция: être content que, avoir peur que, regretter que — Je suis content que tu sois là.',
          'Сомнение и возможность: douter que, il est possible que, il est peu probable que.',
          'Союзы: pour que, bien que, avant que, à moins que, quoique — Appelle avant que je parte.',
        ],
      },
      {
        type: 'example_list',
        title: 'Примеры',
        items: [
          { fr: 'Il faut que tu finisses tes devoirs.', ru: 'Нужно, чтобы ты закончил домашнее задание.', en: 'You need to finish your homework.' },
          { fr: 'Je veux que vous soyez à l\'heure.', ru: 'Я хочу, чтобы вы пришли вовремя.', en: 'I want you to be on time.' },
          { fr: 'Bien qu\'il soit fatigué, il travaille.', ru: 'Хотя он устал, он работает.', en: 'Although he is tired, he works.' },
          { fr: 'Pour que tu comprennes, j\'explique lentement.', ru: 'Чтобы ты понял, я объясняю медленно.', en: 'So that you understand, I explain slowly.' },
        ],
      },
    ],
    contentEn: [
      {
        type: 'paragraph',
        text: 'The subjunctive is a mood (not a tense) expressing wish, doubt, emotion, or necessity. It is formed from the ils-stem of the present tense + endings: -e, -es, -e, -ions, -iez, -ent. It is almost always used after que.',
      },
      {
        type: 'rule_list',
        title: 'When to use the subjunctive (after que):',
        rules: [
          'Wish/will: vouloir que, souhaiter que, préférer que — Je veux que tu viennes.',
          'Necessity: il faut que, il est nécessaire que — Il faut que vous sachiez.',
          'Emotion: être content que, avoir peur que, regretter que.',
          'Doubt/possibility: douter que, il est possible que.',
          'Conjunctions: pour que, bien que, avant que, à moins que.',
        ],
      },
      {
        type: 'example_list',
        title: 'Examples',
        items: [
          { fr: 'Il faut que tu finisses tes devoirs.', ru: 'Нужно, чтобы ты закончил домашнее задание.', en: 'You need to finish your homework.' },
          { fr: 'Je veux que vous soyez à l\'heure.', ru: 'Я хочу, чтобы вы пришли вовремя.', en: 'I want you to be on time.' },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────
  // 2. Le conditionnel présent
  // ─────────────────────────────────────────────────────────────
  {
    slug: 'conditionnel-present',
    titleRu: 'Кондисьональ настоящего времени',
    titleEn: 'The Present Conditional',
    titleFr: 'Le conditionnel présent',
    category: 'temps',
    orderNum: 2,
    content: [
      {
        type: 'paragraph',
        text: 'Кондисьональ настоящего времени выражает гипотетическое, условное или вежливое действие. Образуется от инфинитива (те же основы, что в futur simple) + окончания имперфекта.',
      },
      {
        type: 'table',
        title: 'Образование: основа futur + окончания imparfait',
        headers: ['Лицо', 'Окончание', 'parler', 'finir', 'prendre'],
        rows: [
          ['je', '-ais', 'je parlerais', 'je finirais', 'je prendrais'],
          ['tu', '-ais', 'tu parlerais', 'tu finirais', 'tu prendrais'],
          ['il/elle', '-ait', 'il parlerait', 'il finirait', 'il prendrait'],
          ['nous', '-ions', 'nous parlerions', 'nous finirions', 'nous prendrions'],
          ['vous', '-iez', 'vous parleriez', 'vous finiriez', 'vous prendriez'],
          ['ils/elles', '-aient', 'ils parleraient', 'ils finiraient', 'ils prendraient'],
        ],
      },
      {
        type: 'rule_list',
        title: 'Неправильные основы (те же, что в futur simple):',
        rules: [
          'être → ser- (je serais), avoir → aur- (j\'aurais)',
          'aller → ir- (j\'irais), faire → fer- (je ferais)',
          'pouvoir → pourr- (je pourrais), vouloir → voudr- (je voudrais)',
          'venir → viendr- (je viendrais), voir → verr- (je verrais)',
          'savoir → saur- (je saurais), devoir → devr- (je devrais)',
        ],
      },
      {
        type: 'rule_list',
        title: 'Употребление кондисьоналя:',
        rules: [
          'Гипотеза в настоящем/будущем (si + imparfait → conditionnel): Si j\'avais de l\'argent, j\'achèterais une voiture.',
          'Вежливая просьба или желание: Je voudrais un café, s\'il vous plaît. Pourriez-vous m\'aider ?',
          'Слух, непроверенная информация: Il serait malade. (Говорят, он болен.)',
          'Косвенная речь в прошлом: Il a dit qu\'il viendrait. (Он сказал, что придёт.)',
        ],
      },
      {
        type: 'example_list',
        title: 'Примеры',
        items: [
          { fr: 'Si j\'avais le temps, je voyagerais plus.', ru: 'Если бы у меня было время, я бы путешествовал больше.', en: 'If I had time, I would travel more.' },
          { fr: 'Je voudrais réserver une table pour deux.', ru: 'Я бы хотел забронировать столик на двоих.', en: 'I would like to book a table for two.' },
          { fr: 'Tu devrais parler à ton médecin.', ru: 'Тебе следовало бы поговорить с врачом.', en: 'You should talk to your doctor.' },
          { fr: 'Selon les nouvelles, il y aurait eu un accident.', ru: 'По новостям, якобы произошла авария.', en: 'According to the news, there was reportedly an accident.' },
        ],
      },
    ],
    contentEn: [
      {
        type: 'paragraph',
        text: 'The present conditional expresses hypothetical, conditional, or polite actions. Formed from the infinitive (same stems as future) + imperfect endings: -ais, -ais, -ait, -ions, -iez, -aient.',
      },
      {
        type: 'rule_list',
        title: 'Uses of the conditional:',
        rules: [
          'Hypothesis (si + imparfait → conditionnel): Si j\'avais de l\'argent, j\'achèterais une voiture.',
          'Polite requests: Je voudrais un café. Pourriez-vous m\'aider ?',
          'Reported information/rumor: Il serait malade. (He is reportedly ill.)',
          'Indirect speech in past: Il a dit qu\'il viendrait. (He said he would come.)',
        ],
      },
      {
        type: 'example_list',
        title: 'Examples',
        items: [
          { fr: 'Si j\'avais le temps, je voyagerais plus.', ru: 'Если бы у меня было время, я бы путешествовал больше.', en: 'If I had time, I would travel more.' },
          { fr: 'Je voudrais réserver une table pour deux.', ru: 'Я бы хотел забронировать столик на двоих.', en: 'I would like to book a table for two.' },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────
  // 3. Le conditionnel passé
  // ─────────────────────────────────────────────────────────────
  {
    slug: 'conditionnel-passe',
    titleRu: 'Кондисьональ прошедшего времени',
    titleEn: 'The Past Conditional',
    titleFr: 'Le conditionnel passé',
    category: 'temps',
    orderNum: 3,
    content: [
      {
        type: 'paragraph',
        text: 'Кондисьональ прошедшего образуется с помощью кондисьоналя глаголов avoir или être + причастие прошедшего времени. Используется для несбывшихся условий в прошлом и выражения сожаления.',
      },
      {
        type: 'table',
        title: 'Образование: conditionnel de avoir/être + participe passé',
        headers: ['Тип глагола', 'Формула', 'Пример'],
        rows: [
          ['С avoir', 'j\'aurais / tu aurais / il aurait...', 'j\'aurais mangé, nous aurions fini'],
          ['С être', 'je serais / tu serais / il serait...', 'je serais parti(e), ils seraient arrivés'],
          ['Возвратные', 'je me serais / tu te serais...', 'elle se serait levée'],
        ],
      },
      {
        type: 'rule_list',
        title: 'Употребление кондисьоналя прошедшего:',
        rules: [
          'Нереализованное условие в прошлом (si + plus-que-parfait → conditionnel passé): Si j\'avais étudié, j\'aurais réussi l\'examen.',
          'Сожаление о прошлом: J\'aurais dû partir plus tôt. (Мне следовало уйти раньше.)',
          'Упрёк: Tu aurais pu me prévenir ! (Ты мог бы меня предупредить!)',
          'Косвенная речь: Il a dit qu\'il aurait fini avant midi. (Он сказал, что закончит к полудню.)',
        ],
      },
      {
        type: 'example_list',
        title: 'Примеры',
        items: [
          { fr: 'Si tu m\'avais écouté, tu n\'aurais pas eu de problèmes.', ru: 'Если бы ты меня послушал, у тебя не было бы проблем.', en: 'If you had listened to me, you wouldn\'t have had problems.' },
          { fr: 'J\'aurais voulu être médecin.', ru: 'Я бы хотел стать врачом.', en: 'I would have liked to be a doctor.' },
          { fr: 'Nous aurions dû réserver à l\'avance.', ru: 'Нам следовало забронировать заранее.', en: 'We should have booked in advance.' },
        ],
      },
    ],
    contentEn: [
      {
        type: 'paragraph',
        text: 'The past conditional = conditionnel of avoir/être + past participle. Used for unrealized past conditions, regrets, and reproaches. Key structure: si + plus-que-parfait → conditionnel passé.',
      },
      {
        type: 'example_list',
        title: 'Examples',
        items: [
          { fr: 'Si tu m\'avais écouté, tu n\'aurais pas eu de problèmes.', ru: 'Если бы ты меня послушал, у тебя не было бы проблем.', en: 'If you had listened to me, you wouldn\'t have had problems.' },
          { fr: 'J\'aurais dû partir plus tôt.', ru: 'Мне следовало уйти раньше.', en: 'I should have left earlier.' },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────
  // 4. Le plus-que-parfait
  // ─────────────────────────────────────────────────────────────
  {
    slug: 'plus-que-parfait',
    titleRu: 'Плюсквамперфект',
    titleEn: 'The Pluperfect',
    titleFr: 'Le plus-que-parfait',
    category: 'temps',
    orderNum: 4,
    content: [
      {
        type: 'paragraph',
        text: 'Плюсквамперфект (plus-que-parfait) выражает действие, совершившееся до другого действия в прошлом. Образуется из имперфекта вспомогательного глагола avoir или être + причастие прошедшего.',
      },
      {
        type: 'table',
        title: 'Образование: imparfait de avoir/être + participe passé',
        headers: ['Вспомогательный', 'Форма', 'Пример'],
        rows: [
          ['avoir', "j'avais / tu avais / il avait / nous avions / vous aviez / ils avaient", "j'avais mangé, elle avait fini"],
          ['être', 'j\'étais / tu étais / il était / nous étions / vous étiez / ils étaient', 'il était parti, elles étaient arrivées'],
        ],
      },
      {
        type: 'rule_list',
        title: 'Когда используется plus-que-parfait:',
        rules: [
          'Действие, произошедшее до другого прошедшего действия: Quand je suis arrivé, il était déjà parti. (Когда я пришёл, он уже ушёл.)',
          'В придаточных предложениях с imparfait или passé composé для обозначения предшествования.',
          'В нереализованных условиях в прошлом: si + plus-que-parfait → conditionnel passé.',
          'После expressions comme avant que (с subjonctif) — иногда pluperfect заменяет более сложные конструкции в нарративе.',
        ],
      },
      {
        type: 'example_list',
        title: 'Примеры',
        items: [
          { fr: 'Quand elle est arrivée, nous avions déjà dîné.', ru: 'Когда она пришла, мы уже поужинали.', en: 'When she arrived, we had already had dinner.' },
          { fr: 'Il ne savait pas que son ami avait déménagé.', ru: 'Он не знал, что его друг переехал.', en: 'He didn\'t know that his friend had moved.' },
          { fr: 'J\'avais oublié mon parapluie, alors j\'étais trempé.', ru: 'Я забыл зонтик, поэтому промок.', en: 'I had forgotten my umbrella, so I got soaked.' },
        ],
      },
    ],
    contentEn: [
      {
        type: 'paragraph',
        text: 'The pluperfect = imparfait of avoir/être + past participle. It expresses an action completed before another past action. Equivalent to English "had done." Key pattern: Quand + passé composé, + plus-que-parfait.',
      },
      {
        type: 'example_list',
        title: 'Examples',
        items: [
          { fr: 'Quand elle est arrivée, nous avions déjà dîné.', ru: 'Когда она пришла, мы уже поужинали.', en: 'When she arrived, we had already had dinner.' },
          { fr: 'Il ne savait pas que son ami avait déménagé.', ru: 'Он не знал, что его друг переехал.', en: 'He didn\'t know that his friend had moved.' },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────
  // 5. Le futur antérieur
  // ─────────────────────────────────────────────────────────────
  {
    slug: 'futur-anterieur',
    titleRu: 'Будущее предшествующее время',
    titleEn: 'The Future Perfect',
    titleFr: 'Le futur antérieur',
    category: 'temps',
    orderNum: 5,
    content: [
      {
        type: 'paragraph',
        text: 'Futur antérieur выражает действие, которое завершится до другого будущего действия. Образуется из futur simple вспомогательного глагола avoir или être + причастие прошедшего.',
      },
      {
        type: 'table',
        title: 'Образование: futur simple de avoir/être + participe passé',
        headers: ['Вспомогательный', 'Формы', 'Пример'],
        rows: [
          ['avoir', "j'aurai / tu auras / il aura / nous aurons / vous aurez / ils auront", "j'aurai terminé, nous aurons fini"],
          ['être', 'je serai / tu seras / il sera / nous serons / vous serez / ils seront', 'il sera parti, elles seront arrivées'],
        ],
      },
      {
        type: 'rule_list',
        title: 'Когда используется futur antérieur:',
        rules: [
          'Действие, которое завершится до другого будущего: Quand tu arriveras, j\'aurai déjà préparé le dîner.',
          'Часто в придаточных после: quand, lorsque, dès que, aussitôt que, après que + futur antérieur.',
          'Предположение о прошедшем действии: Il n\'est pas là — il sera parti. (Его нет — наверное, он ушёл.)',
        ],
      },
      {
        type: 'example_list',
        title: 'Примеры',
        items: [
          { fr: 'Dès que tu auras fini, appelle-moi.', ru: 'Как только закончишь, позвони мне.', en: 'As soon as you have finished, call me.' },
          { fr: 'Dans deux ans, j\'aurai obtenu mon diplôme.', ru: 'Через два года я получу диплом.', en: 'In two years, I will have gotten my degree.' },
          { fr: 'Quand vous serez partis, nous fermerons la porte.', ru: 'Когда вы уйдёте, мы закроем дверь.', en: 'When you have left, we will close the door.' },
        ],
      },
    ],
    contentEn: [
      {
        type: 'paragraph',
        text: 'The future perfect = futur simple of avoir/être + past participle. It expresses an action that will be completed before another future action. Key pattern: Quand/dès que + futur antérieur, + futur simple.',
      },
      {
        type: 'example_list',
        title: 'Examples',
        items: [
          { fr: 'Dès que tu auras fini, appelle-moi.', ru: 'Как только закончишь, позвони мне.', en: 'As soon as you have finished, call me.' },
          { fr: 'Dans deux ans, j\'aurai obtenu mon diplôme.', ru: 'Через два года я получу диплом.', en: 'In two years, I will have gotten my degree.' },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────
  // 6. Les pronoms y et en
  // ─────────────────────────────────────────────────────────────
  {
    slug: 'pronoms-y-en',
    titleRu: 'Местоимения y и en',
    titleEn: 'The Pronouns y and en',
    titleFr: 'Les pronoms y et en',
    category: 'pronoms',
    orderNum: 6,
    content: [
      {
        type: 'paragraph',
        text: 'Y и en — местоимения, заменяющие группы существительных с предлогами. Y заменяет место или конструкцию à + вещь. En заменяет конструкцию de + вещь или выражение количества.',
      },
      {
        type: 'table',
        title: 'Местоимение Y',
        headers: ['Заменяет', 'Пример (оригинал)', 'Пример с y'],
        rows: [
          ['Место (à, dans, en, sur, chez + место)', 'Je vais à Paris.', "J'y vais."],
          ['à + вещь (COI неодушевл.)', 'Je pense à ce problème.', "J'y pense."],
          ['Место как ответ', 'Tu vas au cinéma ? — Oui, j\'y vais.', '—'],
        ],
      },
      {
        type: 'table',
        title: 'Местоимение EN',
        headers: ['Заменяет', 'Пример (оригинал)', 'Пример с en'],
        rows: [
          ['de + место', 'Je reviens de Paris.', "J'en reviens."],
          ['de + вещь (COI)', 'Je parle de ce film.', "J'en parle."],
          ['Количество (du, de la, des)', 'Je veux du café.', "J'en veux."],
          ['Количество с числом/наречием', 'J\'ai trois livres.', "J'en ai trois."],
          ['de + вещь после adjective', 'Je suis content de ce résultat.', "J'en suis content."],
        ],
      },
      {
        type: 'rule_list',
        title: 'Позиция в предложении:',
        rules: [
          'Перед глаголом: J\'y vais. Je n\'en veux pas.',
          'В passé composé — перед вспомогательным: J\'y suis allé. J\'en ai acheté.',
          'Порядок с другими местоимениями: ... lui/leur → y → en.',
          'В утвердительном imperatif — после глагола: Vas-y ! Prends-en !',
          'Важно: y и en не заменяют людей — для людей используется lui/leur, eux/elles.',
        ],
      },
      {
        type: 'example_list',
        title: 'Примеры',
        items: [
          { fr: 'Tu vas à la bibliothèque ? — Oui, j\'y vais ce soir.', ru: 'Ты идёшь в библиотеку? — Да, я туда иду сегодня вечером.', en: 'Are you going to the library? — Yes, I\'m going there tonight.' },
          { fr: 'Tu as du pain ? — Oui, j\'en ai acheté ce matin.', ru: 'У тебя есть хлеб? — Да, я купил его сегодня утром.', en: 'Do you have bread? — Yes, I bought some this morning.' },
          { fr: 'Il pense à son avenir — il y pense tout le temps.', ru: 'Он думает о своём будущем — он думает об этом всё время.', en: 'He thinks about his future — he thinks about it all the time.' },
          { fr: 'Combien de frères as-tu ? — J\'en ai deux.', ru: 'Сколько у тебя братьев? — У меня их двое.', en: 'How many brothers do you have? — I have two (of them).' },
        ],
      },
    ],
    contentEn: [
      {
        type: 'paragraph',
        text: 'Y replaces a place (à/dans/en + location) or à + thing (non-person). En replaces de + thing, a quantity, or de + location. Both go before the verb (before the auxiliary in compound tenses).',
      },
      {
        type: 'example_list',
        title: 'Examples',
        items: [
          { fr: 'Tu vas à la bibliothèque ? — Oui, j\'y vais ce soir.', ru: 'Ты идёшь в библиотеку? — Да, иду.', en: 'Are you going to the library? — Yes, I\'m going there tonight.' },
          { fr: 'Tu as du pain ? — Oui, j\'en ai acheté ce matin.', ru: 'У тебя есть хлеб? — Да, купил.', en: 'Do you have bread? — Yes, I bought some this morning.' },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────
  // 7. Les pronoms relatifs dont et où
  // ─────────────────────────────────────────────────────────────
  {
    slug: 'pronoms-relatifs-dont-ou',
    titleRu: 'Относительные местоимения dont и où',
    titleEn: 'Relative Pronouns dont and où',
    titleFr: 'Les pronoms relatifs dont et où',
    category: 'pronoms',
    orderNum: 7,
    content: [
      {
        type: 'paragraph',
        text: 'Dont и où дополняют уже известные qui и que. Dont заменяет группу de + существительное. Où заменяет место или момент времени.',
      },
      {
        type: 'table',
        title: 'Dont — заменяет de + существительное',
        headers: ['Конструкция', 'Пример с dont', 'Перевод'],
        rows: [
          ['parler de', 'Le film dont je parle est excellent.', 'Фильм, о котором я говорю, отличный.'],
          ['avoir besoin de', 'C\'est l\'outil dont j\'ai besoin.', 'Это инструмент, который мне нужен.'],
          ['être content de', 'Voilà les résultats dont je suis content.', 'Вот результаты, которыми я доволен.'],
          ['le/la + nom + de', 'L\'homme dont la femme est médecin.', 'Мужчина, жена которого — врач.'],
        ],
      },
      {
        type: 'table',
        title: 'Où — заменяет место или время',
        headers: ['Заменяет', 'Пример', 'Перевод'],
        rows: [
          ['Место (dans lequel, sur lequel...)', 'La ville où j\'habite est belle.', 'Город, в котором я живу, красивый.'],
          ['Момент времени', 'Le jour où je l\'ai rencontré était pluvieux.', 'День, когда я его встретил, был дождливым.'],
          ['L\'époque, le moment, l\'année...', 'L\'année où nous sommes nés.', 'Год, когда мы родились.'],
        ],
      },
      {
        type: 'rule_list',
        title: 'Важные глаголы и выражения с de (требуют dont):',
        rules: [
          'parler de, se souvenir de, avoir besoin de, avoir envie de',
          'être content/fier/satisfait/triste de',
          'se servir de, profiter de, rêver de, manquer de',
          'Владение: L\'homme dont la voiture est rouge. (de + nom → dont)',
        ],
      },
      {
        type: 'example_list',
        title: 'Примеры',
        items: [
          { fr: 'C\'est le livre dont tout le monde parle.', ru: 'Это книга, о которой все говорят.', en: 'This is the book everyone is talking about.' },
          { fr: 'Voilà la personne dont j\'ai besoin.', ru: 'Вот человек, который мне нужен.', en: 'Here is the person I need.' },
          { fr: 'Je me souviens de l\'endroit où nous avons mangé.', ru: 'Я помню место, где мы ели.', en: 'I remember the place where we ate.' },
          { fr: 'C\'était l\'époque où tout semblait possible.', ru: 'Это было время, когда всё казалось возможным.', en: 'It was a time when everything seemed possible.' },
        ],
      },
    ],
    contentEn: [
      {
        type: 'paragraph',
        text: 'Dont replaces de + noun after verbs/expressions with de (parler de, avoir besoin de, être content de) or to show possession (l\'homme dont la femme...). Où replaces a place or time expression.',
      },
      {
        type: 'example_list',
        title: 'Examples',
        items: [
          { fr: 'C\'est le livre dont tout le monde parle.', ru: 'Это книга, о которой все говорят.', en: 'This is the book everyone is talking about.' },
          { fr: 'Je me souviens de l\'endroit où nous avons mangé.', ru: 'Я помню место, где мы ели.', en: 'I remember the place where we ate.' },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────
  // 8. Les pronoms démonstratifs
  // ─────────────────────────────────────────────────────────────
  {
    slug: 'pronoms-demonstratifs',
    titleRu: 'Указательные местоимения',
    titleEn: 'Demonstrative Pronouns',
    titleFr: 'Les pronoms démonstratifs',
    category: 'pronoms',
    orderNum: 8,
    content: [
      {
        type: 'paragraph',
        text: 'Указательные местоимения (celui, celle, ceux, celles) указывают на конкретный предмет из ранее упомянутых. Они всегда используются с уточнением: -ci/-là, de + существительное или придаточным с qui/que/dont.',
      },
      {
        type: 'table',
        title: 'Формы указательных местоимений',
        headers: ['', 'Единственное число', 'Множественное число'],
        rows: [
          ['Мужской род', 'celui', 'ceux'],
          ['Женский род', 'celle', 'celles'],
        ],
      },
      {
        type: 'table',
        title: 'Употребление с уточнителями',
        headers: ['Тип уточнения', 'Пример', 'Перевод'],
        rows: [
          ['-ci (вблизи) / -là (вдали)', 'Je préfère celui-ci, pas celui-là.', 'Я предпочитаю этот, а не тот.'],
          ['+ de (принадлежность)', 'Mon vélo et celui de Pierre.', 'Мой велосипед и велосипед Пьера.'],
          ['+ qui/que/dont (относ. пред.)', 'Ceux qui travaillent réussissent.', 'Те, кто работает, добиваются успеха.'],
          ['+ dont', 'Celle dont je t\'ai parlé.', 'Та, о которой я тебе говорил.'],
        ],
      },
      {
        type: 'rule_list',
        title: 'Важно помнить:',
        rules: [
          'Нельзя использовать celui/celle без уточнения: нельзя сказать просто «celui est beau» — только «celui-ci est beau» или «celui que j\'aime».',
          'Celui-ci vs celui-là: -ci = ближе/только что упомянутый, -là = дальше/первый упомянутый.',
          'Cela / ça — указательные для идей и ситуаций: Ça me plaît. Cela est vrai.',
          'Ce (avant être): C\'est vrai. Ce sont mes amis.',
        ],
      },
      {
        type: 'example_list',
        title: 'Примеры',
        items: [
          { fr: 'Tu veux quel gâteau ? Celui-ci ou celui-là ?', ru: 'Какой пирог ты хочешь? Этот или тот?', en: 'Which cake do you want? This one or that one?' },
          { fr: 'Sa voiture est plus rapide que celle de son frère.', ru: 'Его машина быстрее, чем машина его брата.', en: 'His car is faster than his brother\'s.' },
          { fr: 'Ceux qui arrivent en retard devront rester après.', ru: 'Те, кто опоздает, должны будут остаться после.', en: 'Those who arrive late will have to stay behind.' },
        ],
      },
    ],
    contentEn: [
      {
        type: 'paragraph',
        text: 'Demonstrative pronouns (celui, celle, ceux, celles) refer back to a previously mentioned noun. They must always be followed by -ci/-là, de + noun, or a relative clause (qui/que/dont).',
      },
      {
        type: 'example_list',
        title: 'Examples',
        items: [
          { fr: 'Tu veux quel gâteau ? Celui-ci ou celui-là ?', ru: 'Какой пирог ты хочешь? Этот или тот?', en: 'Which cake do you want? This one or that one?' },
          { fr: 'Sa voiture est plus rapide que celle de son frère.', ru: 'Его машина быстрее, чем машина его брата.', en: 'His car is faster than his brother\'s.' },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────
  // 9. La voix passive
  // ─────────────────────────────────────────────────────────────
  {
    slug: 'voix-passive',
    titleRu: 'Пассивный залог',
    titleEn: 'The Passive Voice',
    titleFr: 'La voix passive',
    category: 'verbes',
    orderNum: 9,
    content: [
      {
        type: 'paragraph',
        text: 'Пассивный залог (voix passive) позволяет поставить объект действия на место подлежащего. Образуется с помощью глагола être (в нужном времени) + причастие прошедшего времени, которое согласуется с подлежащим.',
      },
      {
        type: 'table',
        title: 'Активный → Пассивный',
        headers: ['Активный залог', 'Пассивный залог'],
        rows: [
          ['Le chef prépare le repas.', 'Le repas est préparé par le chef.'],
          ['La police a arrêté le voleur.', 'Le voleur a été arrêté par la police.'],
          ['On construira un nouveau pont.', 'Un nouveau pont sera construit.'],
          ['Un ami lui offrait des fleurs.', 'Des fleurs lui étaient offertes par un ami.'],
        ],
      },
      {
        type: 'table',
        title: 'Пассивный залог в разных временах',
        headers: ['Время', 'Формула', 'Пример'],
        rows: [
          ['Présent', 'est/sont + participe', 'La lettre est écrite.'],
          ['Passé composé', 'a été/ont été + participe', 'La lettre a été écrite.'],
          ['Imparfait', 'était/étaient + participe', 'La lettre était écrite.'],
          ['Futur simple', 'sera/seront + participe', 'La lettre sera écrite.'],
          ['Conditionnel', 'serait/seraient + participe', 'La lettre serait écrite.'],
        ],
      },
      {
        type: 'rule_list',
        title: 'Правила:',
        rules: [
          'Исполнитель (агент) вводится предлогом par: La maison a été construite par des architectes célèbres.',
          'С глаголами состояния (aimer, respecter, entourer) агент вводится предлогом de: Il est entouré de ses amis.',
          'Причастие всегда согласуется с подлежащим: Les lettres ont été envoyées. (ж.р., мн.ч.)',
          'On + actif — часто заменяет пассив в разговорном языке: On a réparé la voiture = La voiture a été réparée.',
        ],
      },
      {
        type: 'example_list',
        title: 'Примеры',
        items: [
          { fr: 'Ce roman a été écrit par Victor Hugo.', ru: 'Этот роман был написан Виктором Гюго.', en: 'This novel was written by Victor Hugo.' },
          { fr: 'Les résultats seront annoncés demain.', ru: 'Результаты будут объявлены завтра.', en: 'The results will be announced tomorrow.' },
          { fr: 'Elle est respectée de tous ses collègues.', ru: 'Она уважаема всеми своими коллегами.', en: 'She is respected by all her colleagues.' },
        ],
      },
    ],
    contentEn: [
      {
        type: 'paragraph',
        text: 'The passive voice = être (in any tense) + past participle, which agrees with the subject. The agent (doer) is introduced by par. The passive can be formed in all tenses by changing the tense of être.',
      },
      {
        type: 'example_list',
        title: 'Examples',
        items: [
          { fr: 'Ce roman a été écrit par Victor Hugo.', ru: 'Этот роман был написан Виктором Гюго.', en: 'This novel was written by Victor Hugo.' },
          { fr: 'Les résultats seront annoncés demain.', ru: 'Результаты будут объявлены завтра.', en: 'The results will be announced tomorrow.' },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────
  // 10. Le gérondif
  // ─────────────────────────────────────────────────────────────
  {
    slug: 'gerondif',
    titleRu: 'Герундий (le gérondif)',
    titleEn: 'The Gerund',
    titleFr: 'Le gérondif',
    category: 'verbes',
    orderNum: 10,
    content: [
      {
        type: 'paragraph',
        text: 'Герундий (gérondif) образуется с помощью en + причастие настоящего времени (participe présent). Participe présent строится от основы nous + -ant. Субъект герундия и главного глагола всегда один и тот же.',
      },
      {
        type: 'table',
        title: 'Образование: en + основа (nous) + -ant',
        headers: ['Глагол', 'Форма nous', 'Participe présent', 'Gérondif'],
        rows: [
          ['parler', 'nous parlons', 'parlant', 'en parlant'],
          ['finir', 'nous finissons', 'finissant', 'en finissant'],
          ['prendre', 'nous prenons', 'prenant', 'en prenant'],
          ['faire', 'nous faisons', 'faisant', 'en faisant'],
          ['être', '(irrégulier)', 'étant', 'en étant'],
          ['avoir', '(irrégulier)', 'ayant', 'en ayant'],
          ['savoir', '(irrégulier)', 'sachant', 'en sachant'],
        ],
      },
      {
        type: 'rule_list',
        title: 'Значения герундия:',
        rules: [
          'Одновременность: Elle chante en faisant la cuisine. (Она поёт, готовя еду.)',
          'Способ/образ действия: Il est entré en courant. (Он вбежал.)',
          'Условие: En travaillant régulièrement, tu réussiras. (Работая регулярно, ты добьёшься успеха.)',
          'Причина: En mangeant trop vite, il a eu mal au ventre. (Съев слишком быстро, у него заболел живот.)',
          'Уступка (с tout en): Tout en comprenant le problème, il ne peut rien faire. (Хотя он понимает проблему, он ничего не может сделать.)',
        ],
      },
      {
        type: 'example_list',
        title: 'Примеры',
        items: [
          { fr: 'J\'apprends le français en regardant des films.', ru: 'Я учу французский, смотря фильмы.', en: 'I learn French by watching movies.' },
          { fr: 'Il s\'est blessé en jouant au foot.', ru: 'Он получил травму, играя в футбол.', en: 'He got injured playing football.' },
          { fr: 'Tout en étant fatiguée, elle a continué à travailler.', ru: 'Несмотря на усталость, она продолжила работать.', en: 'Even though she was tired, she continued working.' },
        ],
      },
    ],
    contentEn: [
      {
        type: 'paragraph',
        text: 'The gerund = en + present participle (nous-stem + -ant). The subject of the gerund and the main verb must be the same. It expresses simultaneity, manner, condition, or cause.',
      },
      {
        type: 'example_list',
        title: 'Examples',
        items: [
          { fr: 'J\'apprends le français en regardant des films.', ru: 'Я учу французский, смотря фильмы.', en: 'I learn French by watching movies.' },
          { fr: 'Il s\'est blessé en jouant au foot.', ru: 'Он получил травму, играя в футбол.', en: 'He got injured playing football.' },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────
  // 11. L'accord du participe passé
  // ─────────────────────────────────────────────────────────────
  {
    slug: 'accord-participe-passe',
    titleRu: 'Согласование причастия прошедшего времени',
    titleEn: 'Agreement of the Past Participle',
    titleFr: 'L\'accord du participe passé',
    category: 'verbes',
    orderNum: 11,
    content: [
      {
        type: 'paragraph',
        text: 'Согласование причастия прошедшего — одно из ключевых правил французской грамматики. Правила различаются в зависимости от вспомогательного глагола и наличия предшествующего дополнения.',
      },
      {
        type: 'table',
        title: 'Правила согласования',
        headers: ['Случай', 'Правило', 'Пример'],
        rows: [
          ['С avoir (нет предш. COD)', 'Нет согласования', "J'ai mangé une pomme."],
          ['С avoir (COD стоит перед)', 'Согласование с COD', "La pomme que j'ai mangée. (COD = que = pomme, ж.р.)"],
          ['С être (не возвратные)', 'Согласование с подлежащим', 'Elle est partie. Ils sont arrivés.'],
          ['Возвратные (COD = se)', 'Согласование с se', "Elle s'est levée. Ils se sont lavés."],
          ['Возвратные (COI = se)', 'Нет согласования', "Elle s'est lavé les mains. (se = COI, les mains = COD)"],
        ],
      },
      {
        type: 'rule_list',
        title: 'Как определить предшествующий COD:',
        rules: [
          'Предшествующий COD — это прямое дополнение, стоящее ПЕРЕД глаголом в предложении.',
          'Обычно это относительное местоимение que: La lettre qu\'il a écrite. (que = lettre, ж.р. → écrite)',
          'Или местоимение le/la/les: Je les ai vus. (les = мн.ч. м.р. → vus)',
          'Или вопросительное слово quelle/quelles: Quelle robe as-tu achetée ?',
        ],
      },
      {
        type: 'example_list',
        title: 'Примеры',
        items: [
          { fr: 'Les fleurs que j\'ai achetées sont magnifiques.', ru: 'Цветы, которые я купил, великолепны.', en: 'The flowers I bought are magnificent.' },
          { fr: 'Elle s\'est habillée rapidement.', ru: 'Она быстро оделась.', en: 'She got dressed quickly.' },
          { fr: 'Ils se sont serré la main.', ru: 'Они пожали друг другу руки.', en: 'They shook hands.' },
          { fr: 'Les lettres qu\'il a envoyées sont arrivées hier.', ru: 'Письма, которые он отправил, пришли вчера.', en: 'The letters he sent arrived yesterday.' },
        ],
      },
    ],
    contentEn: [
      {
        type: 'paragraph',
        text: 'Past participle agreement: with avoir — agrees only with a preceding COD; with être — agrees with the subject; with reflexive verbs — agrees with the reflexive pronoun when it is the COD (no agreement when it is the COI).',
      },
      {
        type: 'example_list',
        title: 'Examples',
        items: [
          { fr: 'Les fleurs que j\'ai achetées sont magnifiques.', ru: 'Цветы, которые я купил, великолепны.', en: 'The flowers I bought are magnificent.' },
          { fr: 'Elle s\'est habillée rapidement.', ru: 'Она быстро оделась.', en: 'She got dressed quickly.' },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────
  // 12. Verbes: subjonctif ou infinitif ?
  // ─────────────────────────────────────────────────────────────
  {
    slug: 'verbes-subjonctif-infinitif',
    titleRu: 'Субжонктив или инфинитив?',
    titleEn: 'Subjunctive or Infinitive?',
    titleFr: 'Subjonctif ou infinitif ?',
    category: 'verbes',
    orderNum: 12,
    content: [
      {
        type: 'paragraph',
        text: 'После глаголов желания, эмоции и необходимости выбор между субжонктивом и инфинитивом зависит от одного ключевого условия: тот же субъект или разные?',
      },
      {
        type: 'table',
        title: 'Главное правило',
        headers: ['Ситуация', 'Конструкция', 'Пример'],
        rows: [
          ['Один субъект', 'глагол + de/à + infinitif', 'Je veux partir. (Я хочу уйти — один субъект)'],
          ['Разные субъекты', 'глагол + que + subjonctif', 'Je veux que tu partes. (Я хочу, чтобы ты ушёл — два субъекта)'],
          ['Один субъект', 'Je suis content de réussir.', '(Я рад, что добился успеха — один субъект)'],
          ['Разные субъекты', 'Je suis content que tu réussisses.', '(Я рад, что ты добился успеха — два субъекта)'],
        ],
      },
      {
        type: 'rule_list',
        title: 'Глаголы, требующие субжонктива (после que при разных субъектах):',
        rules: [
          'Желание: vouloir, souhaiter, désirer, préférer, aimer (que)',
          'Необходимость: il faut (que), exiger (que), demander (que)',
          'Эмоция: être content/heureux/triste/surpris/déçu (que), avoir peur (que), regretter (que)',
          'Сомнение: douter (que), ne pas croire (que), ne pas penser (que)',
          'Союзы (всегда субжонктив): pour que, bien que, avant que, à moins que, quoique',
        ],
      },
      {
        type: 'rule_list',
        title: 'Глаголы, требующие индикатива (не субжонктива) после que:',
        rules: [
          'espérer que + indicatif (не субжонктив!): J\'espère que tu viendras. (futur)',
          'croire/penser que + indicatif (в утверд.): Je crois qu\'il a raison.',
          'dire que, savoir que, être sûr que — всегда индикатив.',
        ],
      },
      {
        type: 'example_list',
        title: 'Примеры',
        items: [
          { fr: 'Elle veut réussir. / Elle veut que son fils réussisse.', ru: 'Она хочет добиться успеха. / Она хочет, чтобы её сын добился успеха.', en: 'She wants to succeed. / She wants her son to succeed.' },
          { fr: 'Il est important d\'étudier. / Il est important que vous étudiiez.', ru: 'Важно учиться. / Важно, чтобы вы учились.', en: 'It is important to study. / It is important that you study.' },
          { fr: 'J\'espère que tu vas bien. (indicatif, pas de subjonctif!)', ru: 'Я надеюсь, что у тебя всё хорошо.', en: 'I hope you are well.' },
        ],
      },
    ],
    contentEn: [
      {
        type: 'paragraph',
        text: 'Key rule: same subject → infinitive (Je veux partir); different subjects → que + subjunctive (Je veux que tu partes). Note: espérer que always takes the indicative, not the subjunctive.',
      },
      {
        type: 'example_list',
        title: 'Examples',
        items: [
          { fr: 'Elle veut réussir. / Elle veut que son fils réussisse.', ru: 'Она хочет добиться успеха. / Она хочет, чтобы её сын добился успеха.', en: 'She wants to succeed. / She wants her son to succeed.' },
          { fr: 'J\'espère que tu vas bien.', ru: 'Я надеюсь, что у тебя всё хорошо.', en: 'I hope you are well. (indicative, not subjunctive!)' },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────
  // 13. Le discours indirect
  // ─────────────────────────────────────────────────────────────
  {
    slug: 'discours-indirect',
    titleRu: 'Косвенная речь',
    titleEn: 'Indirect Speech',
    titleFr: 'Le discours indirect',
    category: 'syntaxe',
    orderNum: 13,
    content: [
      {
        type: 'paragraph',
        text: 'Косвенная речь передаёт слова другого человека без кавычек. При переводе в косвенную речь меняются местоимения, глагольные времена (при глаголе в прошедшем) и временны́е выражения.',
      },
      {
        type: 'table',
        title: 'Трансформация времён (глагол сообщения в прошедшем)',
        headers: ['Прямая речь', 'Косвенная речь'],
        rows: [
          ['présent → «Je travaille»', 'imparfait → Il a dit qu\'il travaillait.'],
          ['passé composé → «J\'ai mangé»', 'plus-que-parfait → Il a dit qu\'il avait mangé.'],
          ['futur simple → «Je viendrai»', 'conditionnel présent → Il a dit qu\'il viendrait.'],
          ['futur antérieur → «J\'aurai fini»', 'conditionnel passé → Il a dit qu\'il aurait fini.'],
          ['impératif → «Viens !»', 'de + infinitif → Il m\'a dit de venir.'],
        ],
      },
      {
        type: 'table',
        title: 'Трансформация временны́х выражений',
        headers: ['Прямая речь', 'Косвенная речь'],
        rows: [
          ['aujourd\'hui', 'ce jour-là'],
          ['demain', 'le lendemain'],
          ['hier', 'la veille'],
          ['maintenant', 'à ce moment-là'],
          ['la semaine prochaine', 'la semaine suivante'],
          ['il y a deux jours', 'deux jours avant/auparavant'],
        ],
      },
      {
        type: 'rule_list',
        title: 'Вводные конструкции:',
        rules: [
          'Утверждение: dire que, expliquer que, répondre que, ajouter que — Il dit qu\'il est fatigué.',
          'Вопрос да/нет: demander si — Il demande si tu viens.',
          'Вопрос с вопросительным словом: demander où/quand/comment/pourquoi/qui/ce que — Il demande où tu vas.',
          'Вопрос «Qu\'est-ce que» → ce que: «Qu\'est-ce que tu fais ?» → Il demande ce que tu fais.',
          'Вопрос «Qu\'est-ce qui» → ce qui: «Qu\'est-ce qui se passe ?» → Il demande ce qui se passe.',
        ],
      },
      {
        type: 'example_list',
        title: 'Примеры',
        items: [
          { fr: '«Je suis fatigué» → Il a dit qu\'il était fatigué.', ru: '«Я устал» → Он сказал, что устал.', en: '"I am tired" → He said he was tired.' },
          { fr: '«Est-ce que tu viens ?» → Elle a demandé si je venais.', ru: '«Ты придёшь?» → Она спросила, приду ли я.', en: '"Are you coming?" → She asked if I was coming.' },
          { fr: '«Où habites-tu ?» → Il a demandé où j\'habitais.', ru: '«Где ты живёшь?» → Он спросил, где я живу.', en: '"Where do you live?" → He asked where I lived.' },
        ],
      },
    ],
    contentEn: [
      {
        type: 'paragraph',
        text: 'Indirect speech reports what someone said. When the reporting verb is in the past, tenses shift: présent→imparfait, passé composé→plus-que-parfait, futur→conditionnel. Yes/no questions use si; wh-questions keep their word (où, quand, etc.); "qu\'est-ce que" becomes ce que.',
      },
      {
        type: 'example_list',
        title: 'Examples',
        items: [
          { fr: '«Je suis fatigué» → Il a dit qu\'il était fatigué.', ru: '«Я устал» → Он сказал, что устал.', en: '"I am tired" → He said he was tired.' },
          { fr: '«Où habites-tu ?» → Il a demandé où j\'habitais.', ru: '«Где ты живёшь?» → Он спросил, где я живу.', en: '"Where do you live?" → He asked where I lived.' },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────
  // 14. L'interrogation indirecte
  // ─────────────────────────────────────────────────────────────
  {
    slug: 'interrogation-indirecte',
    titleRu: 'Косвенный вопрос',
    titleEn: 'Indirect Questions',
    titleFr: 'L\'interrogation indirecte',
    category: 'syntaxe',
    orderNum: 14,
    content: [
      {
        type: 'paragraph',
        text: 'Косвенный вопрос — это вопрос, встроенный в повествовательное предложение. В отличие от прямого вопроса, в нём нет инверсии и знака вопроса.',
      },
      {
        type: 'table',
        title: 'Прямой → Косвенный вопрос',
        headers: ['Тип вопроса', 'Прямой вопрос', 'Косвенный вопрос'],
        rows: [
          ['Да/нет', '«Tu viens ?»', 'Je ne sais pas si tu viens.'],
          ['Да/нет', '«Est-ce qu\'il travaille ?»', 'Je me demande s\'il travaille.'],
          ['Где?', '«Où vas-tu ?»', 'Dis-moi où tu vas.'],
          ['Когда?', '«Quand arrivez-vous ?»', 'Je voudrais savoir quand vous arrivez.'],
          ['Как?', '«Comment ça marche ?»', 'Il explique comment ça marche.'],
          ['Почему?', '«Pourquoi pars-tu ?»', 'Elle demande pourquoi tu pars.'],
          ['Что (COD)', '«Qu\'est-ce que tu veux ?»', 'Je demande ce que tu veux.'],
          ['Что (суб.)', '«Qu\'est-ce qui se passe ?»', 'Il demande ce qui se passe.'],
        ],
      },
      {
        type: 'rule_list',
        title: 'Ключевые правила:',
        rules: [
          'Нет инверсии: не «je ne sais pas où vas-tu», а «je ne sais pas où tu vas».',
          'Нет знака вопроса (если само предложение — утверждение): Je me demande où il est.',
          '«Qu\'est-ce que» → ce que, «Qu\'est-ce qui» → ce qui.',
          'Вопросы с «quel/quelle» сохраняются: Je ne sais pas quelle heure il est.',
          'Вводные глаголы: se demander, demander, vouloir savoir, ignorer, dire, savoir.',
        ],
      },
      {
        type: 'example_list',
        title: 'Примеры',
        items: [
          { fr: 'Je me demande si elle a compris.', ru: 'Я задаюсь вопросом, поняла ли она.', en: 'I wonder if she understood.' },
          { fr: 'Il veut savoir ce que tu penses.', ru: 'Он хочет знать, что ты думаешь.', en: 'He wants to know what you think.' },
          { fr: 'Dis-moi comment tu as fait ça.', ru: 'Скажи мне, как ты это сделал.', en: 'Tell me how you did that.' },
          { fr: 'Je ne sais pas pourquoi il est parti.', ru: 'Я не знаю, почему он ушёл.', en: 'I don\'t know why he left.' },
        ],
      },
    ],
    contentEn: [
      {
        type: 'paragraph',
        text: 'Indirect questions are embedded in a statement. No inversion, no question mark (unless the main clause is a question). Yes/no → si. "Qu\'est-ce que" → ce que. "Qu\'est-ce qui" → ce qui. Wh-words (où, quand, comment, etc.) stay as they are.',
      },
      {
        type: 'example_list',
        title: 'Examples',
        items: [
          { fr: 'Je me demande si elle a compris.', ru: 'Я задаюсь вопросом, поняла ли она.', en: 'I wonder if she understood.' },
          { fr: 'Il veut savoir ce que tu penses.', ru: 'Он хочет знать, что ты думаешь.', en: 'He wants to know what you think.' },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────
  // 15. L'expression de la cause
  // ─────────────────────────────────────────────────────────────
  {
    slug: 'expression-cause',
    titleRu: 'Выражение причины',
    titleEn: 'Expressing Cause',
    titleFr: 'L\'expression de la cause',
    category: 'syntaxe',
    orderNum: 15,
    content: [
      {
        type: 'paragraph',
        text: 'Во французском языке есть несколько способов выразить причину. Выбор зависит от регистра, позиции в предложении и от того, известна ли причина собеседнику.',
      },
      {
        type: 'table',
        title: 'Союзы и предлоги причины',
        headers: ['Слово', 'Особенность', 'Пример'],
        rows: [
          ['parce que + prop.', 'Самый нейтральный, отвечает на «pourquoi?»', 'Je reste parce qu\'il pleut.'],
          ['puisque + prop.', 'Причина известна собеседнику, обоснование', 'Puisque tu es là, aide-moi !'],
          ['car + prop.', 'Письменный регистр, не в начале предложения', 'Je suis parti, car j\'étais fatigué.'],
          ['comme + prop.', 'Причина = фон/контекст, стоит в начале', 'Comme il faisait beau, on est sortis.'],
          ['à cause de + nom', 'Причина негативная или нейтральная', 'Il est absent à cause de la maladie.'],
          ['grâce à + nom', 'Причина позитивная', 'J\'ai réussi grâce à ton aide.'],
          ['en raison de + nom', 'Официальный/административный стиль', 'Fermé en raison des travaux.'],
        ],
      },
      {
        type: 'rule_list',
        title: 'Ключевые различия:',
        rules: [
          'parce que vs puisque: «Je reste parce qu\'il pleut.» (новая информация) vs «Puisqu\'il pleut, reste !» (уже знаешь — значит оставайся).',
          'car нельзя ставить в начале предложения и после запятой только в письменной речи.',
          'comme всегда стоит в начале предложения и предшествует главному.',
          'à cause de — чаще негативный оттенок: à cause de lui = из-за него (его вина). Grâce à = благодаря.',
        ],
      },
      {
        type: 'example_list',
        title: 'Примеры',
        items: [
          { fr: 'Je n\'ai pas pu venir parce que j\'étais malade.', ru: 'Я не смог прийти, потому что болел.', en: 'I couldn\'t come because I was sick.' },
          { fr: 'Puisque tu ne veux pas manger, tu peux partir.', ru: 'Раз ты не хочешь есть, можешь уходить.', en: 'Since you don\'t want to eat, you can leave.' },
          { fr: 'Grâce à ses efforts, il a obtenu le poste.', ru: 'Благодаря его усилиям, он получил должность.', en: 'Thanks to his efforts, he got the position.' },
          { fr: 'Comme le magasin était fermé, nous sommes rentrés.', ru: 'Так как магазин был закрыт, мы вернулись.', en: 'As the store was closed, we went back.' },
        ],
      },
    ],
    contentEn: [
      {
        type: 'paragraph',
        text: 'parce que = neutral answer to "why"; puisque = known/obvious reason (since); car = formal written (not at the start); comme = at the beginning of sentence; à cause de + noun = negative cause; grâce à + noun = positive cause.',
      },
      {
        type: 'example_list',
        title: 'Examples',
        items: [
          { fr: 'Je n\'ai pas pu venir parce que j\'étais malade.', ru: 'Я не смог прийти, потому что болел.', en: 'I couldn\'t come because I was sick.' },
          { fr: 'Grâce à ses efforts, il a obtenu le poste.', ru: 'Благодаря его усилиям, он получил должность.', en: 'Thanks to his efforts, he got the position.' },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────
  // 16. L'expression du but et de la conséquence
  // ─────────────────────────────────────────────────────────────
  {
    slug: 'expression-but-consequence',
    titleRu: 'Выражение цели и следствия',
    titleEn: 'Expressing Purpose and Consequence',
    titleFr: 'L\'expression du but et de la conséquence',
    category: 'syntaxe',
    orderNum: 16,
    content: [
      {
        type: 'paragraph',
        text: 'Цель (but) отвечает на вопрос «зачем?» и часто требует субжонктива при разных субъектах. Следствие (conséquence) описывает результат действия и использует индикатив.',
      },
      {
        type: 'table',
        title: 'Выражение цели (but)',
        headers: ['Конструкция', 'Субъект', 'Пример'],
        rows: [
          ['pour + infinitif', 'Один субъект', 'Je travaille pour gagner de l\'argent.'],
          ['pour que + subjonctif', 'Разные субъекты', 'Je parle lentement pour que tu comprennes.'],
          ['afin de + infinitif (форм.)', 'Один субъект', 'Il étudie afin de réussir.'],
          ['afin que + subjonctif (форм.)', 'Разные субъекты', 'Il explique afin que vous compreniez.'],
          ['de peur de + infinitif', 'Один (избегание)', 'Il parle doucement de peur de réveiller le bébé.'],
          ['de peur que + subjonctif', 'Разные (избегание)', 'Il parle doucement de peur qu\'elle ne se réveille.'],
        ],
      },
      {
        type: 'table',
        title: 'Выражение следствия (conséquence)',
        headers: ['Конструкция', 'Употребление', 'Пример'],
        rows: [
          ['donc', 'Нейтральное следствие', 'J\'ai faim, donc je mange.'],
          ['alors', 'Разговорное, итак', 'Il pleut, alors on reste.'],
          ['c\'est pourquoi', 'Подчёркнутое следствие', 'Il était malade, c\'est pourquoi il est resté.'],
          ['si bien que + indic.', 'Следствие из ситуации', 'Il a trop mangé, si bien qu\'il est malade.'],
          ['tellement + adj + que', 'Степень → следствие', 'Il parle tellement vite que je ne comprends pas.'],
          ['tant de + nom + que', 'Количество → следствие', 'Il a tant d\'amis qu\'il ne sait qui inviter.'],
        ],
      },
      {
        type: 'example_list',
        title: 'Примеры',
        items: [
          { fr: 'Je chuchote pour ne pas réveiller les enfants.', ru: 'Я шепчу, чтобы не разбудить детей.', en: 'I whisper so as not to wake the children.' },
          { fr: 'Elle est tellement intelligente qu\'elle a tout compris.', ru: 'Она настолько умная, что всё поняла.', en: 'She is so intelligent that she understood everything.' },
          { fr: 'Il est parti tôt, c\'est pourquoi tu ne l\'as pas vu.', ru: 'Он ушёл рано, вот почему ты его не видел.', en: 'He left early, that\'s why you didn\'t see him.' },
        ],
      },
    ],
    contentEn: [
      {
        type: 'paragraph',
        text: 'Purpose: pour + infinitive (same subject), pour que + subjunctive (different subjects). Consequence: donc/alors (so), c\'est pourquoi (that\'s why), si bien que (so much so that), tellement... que (so... that).',
      },
      {
        type: 'example_list',
        title: 'Examples',
        items: [
          { fr: 'Je parle lentement pour que tu comprennes.', ru: 'Я говорю медленно, чтобы ты понял.', en: 'I speak slowly so that you understand.' },
          { fr: 'Elle est tellement intelligente qu\'elle a tout compris.', ru: 'Она настолько умная, что всё поняла.', en: 'She is so intelligent that she understood everything.' },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────
  // 17. L'expression de la concession
  // ─────────────────────────────────────────────────────────────
  {
    slug: 'expression-concession',
    titleRu: 'Выражение уступки',
    titleEn: 'Expressing Concession',
    titleFr: 'L\'expression de la concession',
    category: 'syntaxe',
    orderNum: 17,
    content: [
      {
        type: 'paragraph',
        text: 'Уступка (concession) выражает противоречие между двумя фактами: «несмотря на то что». Ключевое отличие — выбор между субжонктивом (bien que) и индикативом (même si, pourtant).',
      },
      {
        type: 'table',
        title: 'Средства выражения уступки',
        headers: ['Конструкция', 'Наклонение', 'Пример'],
        rows: [
          ['bien que + subjonctif', 'Субжонктив', 'Bien qu\'il soit fatigué, il continue.'],
          ['quoique + subjonctif', 'Субжонктив (форм.)', 'Quoiqu\'elle soit malade, elle travaille.'],
          ['même si + indicatif', 'Индикатив', 'Même si tu n\'es pas d\'accord, c\'est vrai.'],
          ['pourtant (coordination)', '—', 'Il est riche, pourtant il est malheureux.'],
          ['cependant / néanmoins', '— (форм.)', 'Le projet est risqué. Cependant, nous l\'acceptons.'],
          ['malgré + nom', '— (предлог)', 'Malgré la pluie, nous sommes sortis.'],
          ['avoir beau + infinitif', '—', 'Il a beau travailler, il n\'y arrive pas.'],
        ],
      },
      {
        type: 'rule_list',
        title: 'Важные различия:',
        rules: [
          'bien que vs même si: «Bien qu\'il soit fatigué» (субжонктив, без условия) vs «Même s\'il est fatigué» (индикатив, условие с «даже если»).',
          'pourtant, cependant, néanmoins — это союзы координации (между двумя предложениями), субжонктив не нужен.',
          'avoir beau + infinitif = «как ни старайся»: Il a beau essayer, il n\'y arrive pas. (Как он ни пытается, у него не получается.)',
          'malgré + nom (без глагола): Malgré sa fatigue, il continue. НО bien que + subjonctif (с глаголом): Bien qu\'il soit fatigué...',
        ],
      },
      {
        type: 'example_list',
        title: 'Примеры',
        items: [
          { fr: 'Bien qu\'il fasse froid, elle ne porte pas de manteau.', ru: 'Несмотря на холод, она не носит пальто.', en: 'Although it is cold, she doesn\'t wear a coat.' },
          { fr: 'Même si je suis occupé, je trouverai le temps.', ru: 'Даже если я занят, я найду время.', en: 'Even if I am busy, I will find the time.' },
          { fr: 'Il a beau répéter, personne ne l\'écoute.', ru: 'Сколько бы он ни повторял, никто его не слушает.', en: 'No matter how much he repeats it, nobody listens.' },
          { fr: 'Malgré ses efforts, il n\'a pas réussi.', ru: 'Несмотря на усилия, он не добился успеха.', en: 'Despite his efforts, he did not succeed.' },
        ],
      },
    ],
    contentEn: [
      {
        type: 'paragraph',
        text: 'Concession expresses contrast/opposition. bien que / quoique + subjunctive. même si + indicative. pourtant / cependant / néanmoins = coordinating conjunctions (no subjunctive). malgré + noun. avoir beau + infinitive = "no matter how much...".',
      },
      {
        type: 'example_list',
        title: 'Examples',
        items: [
          { fr: 'Bien qu\'il fasse froid, elle ne porte pas de manteau.', ru: 'Несмотря на холод, она не носит пальто.', en: 'Although it is cold, she doesn\'t wear a coat.' },
          { fr: 'Même si je suis occupé, je trouverai le temps.', ru: 'Даже если я занят, я найду время.', en: 'Even if I am busy, I will find the time.' },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────
  // 18. Ne...que et autres restrictions
  // ─────────────────────────────────────────────────────────────
  {
    slug: 'ne-que-restriction',
    titleRu: 'Ограничительные конструкции: ne...que и другие',
    titleEn: 'Restrictive Constructions: ne...que and Others',
    titleFr: 'Les constructions restrictives : ne...que',
    category: 'syntaxe',
    orderNum: 18,
    content: [
      {
        type: 'paragraph',
        text: 'Конструкция ne...que выражает ограничение (только) и является стилистической альтернативой слову seulement. Ne стоит перед глаголом, а que — непосредственно перед ограничиваемым элементом.',
      },
      {
        type: 'table',
        title: 'Ne...que — позиция que',
        headers: ['Что ограничивается', 'Пример с ne...que', 'Пример с seulement'],
        rows: [
          ['Дополнение', 'Je n\'achète que des légumes.', 'J\'achète seulement des légumes.'],
          ['Наречие времени', 'Il ne vient que le lundi.', 'Il vient seulement le lundi.'],
          ['Субъект (с c\'est...que)', 'Ce n\'est qu\'une erreur.', 'C\'est seulement une erreur.'],
          ['Количество', 'Je n\'ai qu\'un euro.', 'J\'ai seulement un euro.'],
        ],
      },
      {
        type: 'table',
        title: 'Другие ограничительные и аспектуальные конструкции',
        headers: ['Конструкция', 'Значение', 'Пример'],
        rows: [
          ['ne...plus', 'больше не, уже не', 'Je ne fume plus.'],
          ['ne...pas encore', 'ещё не', 'Il n\'est pas encore arrivé.'],
          ['ne...toujours pas', 'по-прежнему не, всё ещё не', 'Elle ne répond toujours pas.'],
          ['encore / toujours (утвердит.)', 'всё ещё, по-прежнему', 'Il travaille encore/toujours ici.'],
          ['ne...guère (форм.)', 'почти не, едва', 'Je ne dors guère ces jours-ci.'],
        ],
      },
      {
        type: 'rule_list',
        title: 'Особенности ne...que:',
        rules: [
          'Артикль не меняется после que (в отличие от ne...pas): Je mange que du pain. (не «de pain» — т.к. это не отрицание!)',
          'В passé composé que стоит после причастия: Je n\'ai mangé que du pain.',
          'Можно ограничивать субъект: Ce n\'est que toi qui peux m\'aider.',
          'Ne...que нельзя использовать с подлежащим напрямую — нужна конструкция c\'est...que: Ce n\'est qu\'un enfant.',
        ],
      },
      {
        type: 'example_list',
        title: 'Примеры',
        items: [
          { fr: 'Il ne parle qu\'en français avec ses enfants.', ru: 'Он говорит со своими детьми только по-французски.', en: 'He only speaks French with his children.' },
          { fr: 'Je n\'ai mangé qu\'une pomme de toute la journée.', ru: 'За весь день я съел только одно яблоко.', en: 'I only ate one apple all day.' },
          { fr: 'Elle n\'a pas encore pris de décision.', ru: 'Она ещё не приняла решения.', en: 'She hasn\'t made a decision yet.' },
          { fr: 'Il ne dort toujours pas à minuit.', ru: 'Он до сих пор не спит в полночь.', en: 'He still isn\'t sleeping at midnight.' },
        ],
      },
    ],
    contentEn: [
      {
        type: 'paragraph',
        text: 'Ne...que = seulement (only). Ne goes before the verb; que goes immediately before the restricted element. Unlike ne...pas, articles after que do not change to de. In compound tenses, que follows the past participle.',
      },
      {
        type: 'example_list',
        title: 'Examples',
        items: [
          { fr: 'Il ne parle qu\'en français avec ses enfants.', ru: 'Он говорит со своими детьми только по-французски.', en: 'He only speaks French with his children.' },
          { fr: 'Je n\'ai mangé qu\'une pomme de toute la journée.', ru: 'За весь день я съел только одно яблоко.', en: 'I only ate one apple all day.' },
        ],
      },
    ],
  },
];
