import type { ExerciseSeed } from './grammar-exercises-a1.js';

export const grammarExercisesB2Extra2: ExerciseSeed[] = [

  // ═══════════════════════════════════════════════════════════
  // faire-causatif
  // ═══════════════════════════════════════════════════════════
  {
    topicSlug: 'faire-causatif',
    type: 'fill_blank',
    question: { text: 'Le professeur ___ lire les étudiants à voix haute. (faire)', blanks: 1 },
    answer: { values: ['fait'] },
    explanation: 'Faire + infinitif = заставить кого-то сделать что-то. Le professeur fait lire.',
    explanationEn: 'Faire + infinitive = make someone do something. Le professeur fait lire.',
  },
  {
    topicSlug: 'faire-causatif',
    type: 'multiple_choice',
    question: { text: 'Elle a ___ repeindre son appartement.', options: ['fait', 'laissé', 'rendu', 'donné'] },
    answer: { correct: 'fait' },
    explanation: 'Faire + inf = иметь что-то сделанное (нанять). Elle a fait repeindre = она наняла маляров.',
    explanationEn: 'Faire + inf = have something done. Elle a fait repeindre = she had it repainted.',
  },
  {
    topicSlug: 'faire-causatif',
    type: 'fill_blank',
    question: { text: 'Cette musique me ___ penser à mon enfance. (faire)', blanks: 1 },
    answer: { values: ['fait'] },
    explanation: 'Faire + inf выражает вызванное действие/ощущение: me fait penser = заставляет думать.',
    explanationEn: 'Faire + inf expresses a triggered reaction: me fait penser = makes me think.',
  },
  {
    topicSlug: 'faire-causatif',
    type: 'multiple_choice',
    question: { text: 'Il ___ son portefeuille dans le métro.', options: ['s\'est fait voler', 'a fait voler', 's\'est laissé voler', 'a laissé voler'] },
    answer: { correct: 's\'est fait voler' },
    explanation: 'Se faire + inf = подвергнуться действию. Il s\'est fait voler = у него украли (он стал жертвой кражи).',
    explanationEn: 'Se faire + inf = undergo an action. Il s\'est fait voler = he had his wallet stolen (he was a victim).',
  },
  {
    topicSlug: 'faire-causatif',
    type: 'fill_blank',
    question: { text: 'Je vais ___ réparer ma voiture par un mécanicien. (faire)', blanks: 1 },
    answer: { values: ['faire'] },
    explanation: 'Faire + inf + par qqn: je vais faire réparer ma voiture par un mécanicien.',
    explanationEn: 'Faire + inf + par qqn: je vais faire réparer ma voiture par un mécanicien.',
  },
  {
    topicSlug: 'faire-causatif',
    type: 'multiple_choice',
    question: { text: 'Elle ___ ses enfants jouer dans le jardin.', options: ['laisse', 'fait', 'rend', 'oblige'] },
    answer: { correct: 'laisse' },
    explanation: 'Laisser + inf = позволять, давать возможность. Elle laisse jouer = она позволяет играть.',
    explanationEn: 'Laisser + inf = allow, let. Elle laisse jouer = she lets them play.',
  },
  {
    topicSlug: 'faire-causatif',
    type: 'fill_blank',
    question: { text: 'Je ___ couper les cheveux chez le coiffeur demain. (se faire)', blanks: 1 },
    answer: { values: ['me fais'] },
    explanation: 'Se faire + inf = être dans la situation de subir qqch. Je me fais couper les cheveux.',
    explanationEn: 'Se faire + inf: Je me fais couper les cheveux = I\'m getting my hair cut.',
  },

  // ═══════════════════════════════════════════════════════════
  // nuances-conditionnel
  // ═══════════════════════════════════════════════════════════
  {
    topicSlug: 'nuances-conditionnel',
    type: 'multiple_choice',
    question: { text: 'Selon les médias, le Premier ministre ___ sa démission. (informat. non vérifiée)', options: ['aurait annoncé', 'a annoncé', 'annonçait', 'annoncera'] },
    answer: { correct: 'aurait annoncé' },
    explanation: 'Conditionnel passé journalistique: information non confirmée. Aurait annoncé = il est dit que.',
    explanationEn: 'Journalistic conditional passé: unverified information. Aurait annoncé = reportedly announced.',
  },
  {
    topicSlug: 'nuances-conditionnel',
    type: 'fill_blank',
    question: { text: 'Tu ___ (devoir) consulter un médecin, tu n\'as pas l\'air bien.', blanks: 1 },
    answer: { values: ['devrais'] },
    explanation: 'Devoir au conditionnel présent = conseil/recommandation: tu devrais (тебе следовало бы).',
    explanationEn: 'Devoir at conditionnel présent = advice/recommendation: tu devrais (you should).',
  },
  {
    topicSlug: 'nuances-conditionnel',
    type: 'multiple_choice',
    question: { text: '___ vous m\'indiquer le chemin pour la gare?', options: ['Pourriez', 'Pouvez', 'Pouviez', 'Puissiez'] },
    answer: { correct: 'Pourriez' },
    explanation: 'Pouvoir au conditionnel = вежливая просьба: Pourriez-vous... = не могли бы вы...',
    explanationEn: 'Pouvoir at conditionnel = polite request: Pourriez-vous... = Could you please...',
  },
  {
    topicSlug: 'nuances-conditionnel',
    type: 'fill_blank',
    question: { text: 'J\'___ (aimer) venir, mais j\'avais un engagement.', blanks: 1 },
    answer: { values: ['aurais aimé'] },
    explanation: 'Conditionnel passé pour exprimer le regret: j\'aurais aimé = j\'ai regretté de ne pas pouvoir.',
    explanationEn: 'Conditionnel passé for regret: j\'aurais aimé = I would have liked to (but couldn\'t).',
  },
  {
    topicSlug: 'nuances-conditionnel',
    type: 'multiple_choice',
    question: { text: 'D\'après nos sources, l\'accord ___ signé hier soir.', options: ['aurait été', 'a été', 'avait été', 'serait été'] },
    answer: { correct: 'aurait été' },
    explanation: 'Conditionnel passé passif journalistique: aurait été signé = il semblerait que l\'accord ait été signé.',
    explanationEn: 'Journalistic passive conditional passé: aurait été signé = reportedly signed.',
  },
  {
    topicSlug: 'nuances-conditionnel',
    type: 'fill_blank',
    question: { text: 'Il ___ (devoir) partir plus tôt — il a raté son avion.', blanks: 1 },
    answer: { values: ['aurait dû'] },
    explanation: 'Devoir au conditionnel passé = reproche ou regret après coup: aurait dû = il aurait fallu.',
    explanationEn: 'Devoir at conditionnel passé = reproach or regret: aurait dû = should have.',
  },

  // ═══════════════════════════════════════════════════════════
  // style-indirect-libre
  // ═══════════════════════════════════════════════════════════
  {
    topicSlug: 'style-indirect-libre',
    type: 'multiple_choice',
    question: { text: 'Dans «Il regardait la lettre. Tout était perdu.» — quel style est utilisé?', options: ['Style indirect libre', 'Discours direct', 'Discours indirect', 'Narration neutre'] },
    answer: { correct: 'Style indirect libre' },
    explanation: 'Style indirect libre: pas de guillemets, pas de «il pensa que», mais les pensées du personnage en imparfait.',
    explanationEn: 'Free indirect speech: no quotes, no «il pensa que», but the character\'s thoughts in imparfait.',
  },
  {
    topicSlug: 'style-indirect-libre',
    type: 'multiple_choice',
    question: { text: 'Quel est le signe distinctif du style indirect libre?', options: ['Absence de verbe introducteur + sdvigs de temps', 'Guillemets + tiret', 'que + subjonctif', 'Présent de l\'indicatif'] },
    answer: { correct: 'Absence de verbe introducteur + sdvigs de temps' },
    explanation: 'Le style indirect libre = pas de «il dit que», sdvigs de temps (imparfait, conditionnel), pas de guillemets.',
    explanationEn: 'Free indirect speech = no reporting verb, tense backshift (imparfait, conditionnel), no quotation marks.',
  },
  {
    topicSlug: 'style-indirect-libre',
    type: 'multiple_choice',
    question: { text: 'Dans la presse, «Le gouvernement envisagerait de nouvelles réformes» utilise:', options: ['Le conditionnel journalistique', 'Le style indirect libre', 'Le discours direct', 'Le subjonctif'] },
    answer: { correct: 'Le conditionnel journalistique' },
    explanation: 'Le conditionnel dans la presse sans «selon» explicite = conditionnel journalistique (info non vérifiée).',
    explanationEn: 'Conditional in the press without explicit source marker = journalistic conditional (unverified info).',
  },
  {
    topicSlug: 'style-indirect-libre',
    type: 'multiple_choice',
    question: { text: 'Transformez en style indirect libre: Elle pensa: «Je dois partir.»', options: ['Elle devait partir.', 'Elle a dit qu\'elle devait partir.', 'Elle pense qu\'elle doit partir.', '«Je dois partir», dit-elle.'] },
    answer: { correct: 'Elle devait partir.' },
    explanation: 'Style indirect libre: suppression du verbe introducteur, présent → imparfait (doit → devait), sans guillemets.',
    explanationEn: 'Free indirect speech: remove reporting verb, présent → imparfait (doit → devait), no quotes.',
  },

  // ═══════════════════════════════════════════════════════════
  // verbes-attributifs
  // ═══════════════════════════════════════════════════════════
  {
    topicSlug: 'verbes-attributifs',
    type: 'multiple_choice',
    question: { text: 'Cette solution ___ efficace à première vue.', options: ['paraît', 'est', 'fait', 'donne'] },
    answer: { correct: 'paraît' },
    explanation: 'Paraître + adjectif = казаться (более формальный вариант sembler).',
    explanationEn: 'Paraître + adjective = to seem (more formal than sembler).',
  },
  {
    topicSlug: 'verbes-attributifs',
    type: 'fill_blank',
    question: { text: 'Tu ___ inquiet aujourd\'hui. Tout va bien? (avoir l\'air)', blanks: 1 },
    answer: { values: ['as l\'air'] },
    explanation: 'Avoir l\'air + adjectif = выглядеть. Tu as l\'air inquiet.',
    explanationEn: 'Avoir l\'air + adjective = to look/seem. Tu as l\'air inquiet.',
  },
  {
    topicSlug: 'verbes-attributifs',
    type: 'multiple_choice',
    question: { text: 'Sa stratégie ___ payante sur le long terme.', options: ['s\'est révélée', 'a semblé', 'est restée', 'a paru'] },
    answer: { correct: 's\'est révélée' },
    explanation: 'Se révéler + adj = оказываться (результат часто неожиданный). S\'est révélée payante.',
    explanationEn: 'Se révéler + adj = to turn out to be (often unexpected). S\'est révélée payante.',
  },
  {
    topicSlug: 'verbes-attributifs',
    type: 'fill_blank',
    question: { text: 'Malgré tout, il ___ calme pendant la crise. (rester)', blanks: 1 },
    answer: { values: ['est resté'] },
    explanation: 'Rester + adjectif = оставаться (сохранять состояние). Il est resté calme.',
    explanationEn: 'Rester + adjective = to remain. Il est resté calme.',
  },
  {
    topicSlug: 'verbes-attributifs',
    type: 'multiple_choice',
    question: { text: 'Il ___ comprendre la situation sans qu\'on lui explique.', options: ['semble', 'paraît', 'a l\'air de', 'se révèle'] },
    answer: { correct: 'semble' },
    explanation: 'Sembler + infinitif (без que) = кажется, что... Il semble comprendre = il semble qu\'il comprenne.',
    explanationEn: 'Sembler + infinitive (no que) = he seems to understand. More concise than il semble qu\'il comprenne.',
  },

  // ═══════════════════════════════════════════════════════════
  // expression-restriction-nuance
  // ═══════════════════════════════════════════════════════════
  {
    topicSlug: 'expression-restriction-nuance',
    type: 'multiple_choice',
    question: { text: 'C\'est une bonne idée, ___ elle est difficile à mettre en œuvre.', options: ['sauf que', 'sauf', 'hormis', 'à moins que'] },
    answer: { correct: 'sauf que' },
    explanation: 'Sauf que + indicatif = вводит оговорку к предыдущей мысли: только вот, но при этом.',
    explanationEn: 'Sauf que + indicatif = introduces a qualification: except that / the only problem is that.',
  },
  {
    topicSlug: 'expression-restriction-nuance',
    type: 'fill_blank',
    question: { text: '___ quelques erreurs, ce devoir est excellent.', blanks: 1 },
    answer: { values: ['Hormis'] },
    explanation: 'Hormis = за исключением (книжный вариант sauf): Hormis quelques erreurs = sauf quelques erreurs.',
    explanationEn: 'Hormis = except/apart from (formal equivalent of sauf): Hormis quelques erreurs.',
  },
  {
    topicSlug: 'expression-restriction-nuance',
    type: 'multiple_choice',
    question: { text: 'Je signerai le contrat ___ les conditions soient respectées.', options: ['à condition que', 'à moins que', 'sauf que', 'quitte à'] },
    answer: { correct: 'à condition que' },
    explanation: 'À condition que + subjonctif = при условии что. Выражает необходимое условие.',
    explanationEn: 'À condition que + subjonctif = provided that. Expresses a necessary condition.',
  },
  {
    topicSlug: 'expression-restriction-nuance',
    type: 'fill_blank',
    question: { text: 'Il ira, ___ à rater son cours. (пусть даже)', blanks: 1 },
    answer: { values: ['quitte'] },
    explanation: 'Quitte à + infinitif = даже если придётся, пусть даже. Принятие нежелательного следствия.',
    explanationEn: 'Quitte à + infinitif = even if it means, at the risk of. Accepting a negative consequence.',
  },
  {
    topicSlug: 'expression-restriction-nuance',
    type: 'multiple_choice',
    question: { text: 'Il réussira, ___ il ne renonce pas en cours de route.', options: ['à moins qu\'', 'sauf que', 'hormis que', 'quitte à'] },
    answer: { correct: 'à moins qu\'' },
    explanation: 'À moins que + subjonctif = если только не. Il réussira, à moins qu\'il ne renonce.',
    explanationEn: 'À moins que + subjonctif = unless. Il réussira, à moins qu\'il ne renonce.',
  },
  {
    topicSlug: 'expression-restriction-nuance',
    type: 'fill_blank',
    question: { text: '___ peu qu\'on l\'encourage, il fait des merveilles.', blanks: 1 },
    answer: { values: ['Pour'] },
    explanation: 'Pour peu que + subjonctif = стоит только, при малейшем... Минимальное условие.',
    explanationEn: 'Pour peu que + subjonctif = if only, as soon as. Minimal condition.',
  },
];
