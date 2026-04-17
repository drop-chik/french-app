// Grammar exercises A1

export interface ExerciseSeed {
  topicSlug: string;
  type: 'fill_blank' | 'multiple_choice' | 'reorder' | 'translate';
  question: unknown;
  answer: unknown;
  explanation?: string;
  explanationEn?: string;
}

export const grammarExercisesA1: ExerciseSeed[] = [
  // === articles-definite ===
  {
    topicSlug: 'articles-definite',
    type: 'fill_blank',
    question: { text: '___ chat est sur ___ table.', blanks: 2 },
    answer: { values: ['Le', 'la'] },
    explanation: 'chat — м.р., поэтому le; table — ж.р., поэтому la.',
    explanationEn: 'chat is masculine, so le; table is feminine, so la.',
  },
  {
    topicSlug: 'articles-definite',
    type: 'multiple_choice',
    question: { text: 'J\'aime ___ musique.', options: ['le', 'la', 'les', 'l\''] },
    answer: { correct: 'la' },
    explanation: 'musique — женского рода: la musique.',
    explanationEn: 'musique is feminine: la musique.',
  },
  {
    topicSlug: 'articles-definite',
    type: 'multiple_choice',
    question: { text: '___ enfants jouent dans le jardin.', options: ['Le', 'La', 'Les', 'L\''] },
    answer: { correct: 'Les' },
    explanation: 'enfants — множественное число, поэтому les.',
    explanationEn: 'enfants is plural, so les.',
  },
  {
    topicSlug: 'articles-definite',
    type: 'fill_blank',
    question: { text: 'Je parle ___ français tous les jours.', blanks: 1 },
    answer: { values: ['le'] },
    explanation: 'Языки всегда используются с определённым артиклем: le français.',
    explanationEn: 'Languages always take the definite article: le français.',
  },

  // === articles-indefinite ===
  {
    topicSlug: 'articles-indefinite',
    type: 'multiple_choice',
    question: { text: 'J\'ai ___ chien et ___ chat.', options: ['un / un', 'un / une', 'une / un', 'des / des'] },
    answer: { correct: 'un / un' },
    explanation: 'chien — м.р. (un), chat — м.р. (un).',
    explanationEn: 'chien is masculine (un), chat is masculine (un).',
  },
  {
    topicSlug: 'articles-indefinite',
    type: 'fill_blank',
    question: { text: 'Je n\'ai pas ___ voiture.', blanks: 1 },
    answer: { values: ['de'] },
    explanation: 'После отрицания une → de: pas de voiture.',
    explanationEn: 'After negation, une changes to de: pas de voiture.',
  },
  {
    topicSlug: 'articles-indefinite',
    type: 'multiple_choice',
    question: { text: 'Il y a ___ fleurs dans le vase.', options: ['un', 'une', 'des', 'de'] },
    answer: { correct: 'des' },
    explanation: 'fleurs — множественное число неопределённого артикля: des.',
    explanationEn: 'fleurs is plural, so the plural indefinite article des is used.',
  },

  // === articles-partitive ===
  {
    topicSlug: 'articles-partitive',
    type: 'multiple_choice',
    question: { text: 'Je bois ___ café le matin.', options: ['le', 'du', 'un', 'de'] },
    answer: { correct: 'du' },
    explanation: 'du = de + le; обозначает количество кофе (неисчисляемое).',
    explanationEn: 'du = de + le; it indicates an unspecified amount of coffee (uncountable noun).',
  },
  {
    topicSlug: 'articles-partitive',
    type: 'fill_blank',
    question: { text: 'Tu veux ___ eau ?', blanks: 1 },
    answer: { values: ["de l'"] },
    explanation: 'eau начинается на гласную: de l\'eau.',
    explanationEn: 'eau starts with a vowel, so de l\'eau (elision).',
  },
  {
    topicSlug: 'articles-partitive',
    type: 'multiple_choice',
    question: { text: 'Je ne mange pas ___ viande.', options: ['de la', 'du', 'de', 'la'] },
    answer: { correct: 'de' },
    explanation: 'После отрицания de la → de: pas de viande.',
    explanationEn: 'After negation, de la reduces to de: pas de viande.',
  },

  // === nouns-gender ===
  {
    topicSlug: 'nouns-gender',
    type: 'multiple_choice',
    question: { text: 'Quel est le genre de "maison" ?', options: ['masculin', 'féminin'] },
    answer: { correct: 'féminin' },
    explanation: 'la maison — женского рода (окончание -on не определяет, нужно помнить).',
    explanationEn: 'la maison is feminine. The ending -on does not determine gender; it must be memorized.',
  },
  {
    topicSlug: 'nouns-gender',
    type: 'multiple_choice',
    question: { text: 'Quel est le genre de "gouvernement" ?', options: ['masculin', 'féminin'] },
    answer: { correct: 'masculin' },
    explanation: 'Слова на -ment обычно мужского рода: le gouvernement.',
    explanationEn: 'Words ending in -ment are usually masculine: le gouvernement.',
  },
  {
    topicSlug: 'nouns-gender',
    type: 'multiple_choice',
    question: { text: 'Choisissez la bonne forme : ___ liberté', options: ['le', 'la'] },
    answer: { correct: 'la' },
    explanation: 'Слова на -té женского рода: la liberté.',
    explanationEn: 'Words ending in -té are feminine: la liberté.',
  },

  // === nouns-plural ===
  {
    topicSlug: 'nouns-plural',
    type: 'fill_blank',
    question: { text: 'un gâteau → des ___', blanks: 1 },
    answer: { values: ['gâteaux'] },
    explanation: 'Слова на -eau во мн.ч. получают -x: gâteau → gâteaux.',
    explanationEn: 'Words ending in -eau form the plural with -x: gâteau → gâteaux.',
  },
  {
    topicSlug: 'nouns-plural',
    type: 'fill_blank',
    question: { text: 'un animal → des ___', blanks: 1 },
    answer: { values: ['animaux'] },
    explanation: 'Слова на -al во мн.ч. → -aux: animal → animaux.',
    explanationEn: 'Words ending in -al form the plural with -aux: animal → animaux.',
  },
  {
    topicSlug: 'nouns-plural',
    type: 'multiple_choice',
    question: { text: 'Quel est le pluriel de "voix" ?', options: ['voixs', 'voix', 'voixx', 'voices'] },
    answer: { correct: 'voix' },
    explanation: 'Слова на -s, -x, -z не меняются во мн.ч.: voix → voix.',
    explanationEn: 'Words already ending in -s, -x, or -z do not change in the plural: voix → voix.',
  },

  // === adjectives-agreement ===
  {
    topicSlug: 'adjectives-agreement',
    type: 'fill_blank',
    question: { text: 'une fille ___ (grand)', blanks: 1 },
    answer: { values: ['grande'] },
    explanation: 'grand — мужской род, grande — женский (добавляем -e).',
    explanationEn: 'grand is the masculine form; add -e for feminine: grande.',
  },
  {
    topicSlug: 'adjectives-agreement',
    type: 'multiple_choice',
    question: { text: 'des enfants ___ (heureux)', options: ['heureux', 'heureuse', 'heureuses', 'heureux'] },
    answer: { correct: 'heureux' },
    explanation: 'heureux — форма для мужского рода мн.ч. (не меняется). Для женского мн.ч. было бы heureuses, но здесь enfants — м.р.',
    explanationEn: 'heureux is the masculine plural form (unchanged). The feminine plural would be heureuses, but enfants is masculine.',
  },
  {
    topicSlug: 'adjectives-agreement',
    type: 'fill_blank',
    question: { text: 'C\'est un ___ homme. (beau)', blanks: 1 },
    answer: { values: ['bel', 'beau'] },
    explanation: 'beau → bel перед гласной или h немого: un bel homme.',
    explanationEn: 'beau becomes bel before a vowel or silent h: un bel homme.',
  },

  // === pronouns-personal ===
  {
    topicSlug: 'pronouns-personal',
    type: 'multiple_choice',
    question: { text: '___ allons au cinéma.', options: ['Je', 'Tu', 'Nous', 'Vous'] },
    answer: { correct: 'Nous' },
    explanation: 'allons — форма 1-го лица множественного числа (nous).',
    explanationEn: 'allons is the first person plural form of aller, used with nous.',
  },
  {
    topicSlug: 'pronouns-personal',
    type: 'multiple_choice',
    question: { text: 'Mon professeur est strict. ___ donne beaucoup de devoirs.', options: ['Je', 'Il', 'Elle', 'Ils'] },
    answer: { correct: 'Il' },
    explanation: 'professeur — м.р., поэтому il.',
    explanationEn: 'professeur is masculine, so we use il (he).',
  },
  {
    topicSlug: 'pronouns-personal',
    type: 'fill_blank',
    question: { text: '___ aime le football. (je)', blanks: 1 },
    answer: { values: ["J'"] },
    explanation: 'je → j\' перед гласной: J\'aime.',
    explanationEn: 'je becomes j\' before a vowel: J\'aime.',
  },

  // === verbs-etre-avoir ===
  {
    topicSlug: 'verbs-etre-avoir',
    type: 'fill_blank',
    question: { text: 'Je ___ étudiant et tu ___ professeur.', blanks: 2 },
    answer: { values: ['suis', 'es'] },
    explanation: 'suis — форма être для je; es — форма être для tu.',
    explanationEn: 'suis is the form of être for je; es is the form of être for tu.',
  },
  {
    topicSlug: 'verbs-etre-avoir',
    type: 'multiple_choice',
    question: { text: 'Vous ___ deux enfants ?', options: ['êtes', 'avez', 'sont', 'ont'] },
    answer: { correct: 'avez' },
    explanation: 'avoir (иметь): vous avez = у вас есть.',
    explanationEn: 'avoir (to have): vous avez = you have.',
  },
  {
    topicSlug: 'verbs-etre-avoir',
    type: 'fill_blank',
    question: { text: 'Ils ___ français. (être)', blanks: 1 },
    answer: { values: ['sont'] },
    explanation: 'être: ils/elles → sont.',
    explanationEn: 'être: ils/elles → sont (they are).',
  },
  {
    topicSlug: 'verbs-etre-avoir',
    type: 'multiple_choice',
    question: { text: 'Il ___ faim.', options: ['est', 'a', 'ont', 'sont'] },
    answer: { correct: 'a' },
    explanation: 'Голод, жажда, холод, жара выражаются через avoir: avoir faim/soif/froid/chaud.',
    explanationEn: 'Hunger, thirst, cold, and heat are expressed with avoir: avoir faim/soif/froid/chaud.',
  },

  // === verbs-present-regular ===
  {
    topicSlug: 'verbs-present-regular',
    type: 'fill_blank',
    question: { text: 'Nous ___ le français. (parler)', blanks: 1 },
    answer: { values: ['parlons'] },
    explanation: 'parler: nous → parlons.',
    explanationEn: 'parler: nous → parlons (we speak).',
  },
  {
    topicSlug: 'verbs-present-regular',
    type: 'fill_blank',
    question: { text: 'Vous ___ vos exercices. (finir)', blanks: 1 },
    answer: { values: ['finissez'] },
    explanation: 'finir (-ir глагол): vous → finissez.',
    explanationEn: 'finir (an -ir verb): vous → finissez (you finish).',
  },
  {
    topicSlug: 'verbs-present-regular',
    type: 'multiple_choice',
    question: { text: 'Ils ___ dans un appartement. (habiter)', options: ['habite', 'habitons', 'habitent', 'habitez'] },
    answer: { correct: 'habitent' },
    explanation: 'habiter: ils/elles → habitent (окончание -ent).',
    explanationEn: 'habiter: ils/elles → habitent (ending -ent).',
  },

  // === verbs-aller-venir ===
  {
    topicSlug: 'verbs-aller-venir',
    type: 'fill_blank',
    question: { text: 'Je ___ au marché. (aller)', blanks: 1 },
    answer: { values: ['vais'] },
    explanation: 'aller: je → vais.',
    explanationEn: 'aller: je → vais (I go).',
  },
  {
    topicSlug: 'verbs-aller-venir',
    type: 'multiple_choice',
    question: { text: 'Nous ___ manger au restaurant ce soir.', options: ['allons', 'allons à', 'voulons', 'sommes'] },
    answer: { correct: 'allons' },
    explanation: 'Futur proche: aller + инфинитив. Nous allons manger = мы собираемся поесть.',
    explanationEn: 'Near future (futur proche): aller + infinitive. Nous allons manger = we are going to eat.',
  },
  {
    topicSlug: 'verbs-aller-venir',
    type: 'fill_blank',
    question: { text: 'Elle ___ de Paris. (venir)', blanks: 1 },
    answer: { values: ['vient'] },
    explanation: 'venir: il/elle/on → vient.',
    explanationEn: 'venir: il/elle/on → vient (comes).',
  },

  // === negation ===
  {
    topicSlug: 'negation',
    type: 'fill_blank',
    question: { text: 'Je ___ parle ___ anglais. (ne...pas)', blanks: 2 },
    answer: { values: ['ne', 'pas'] },
    explanation: 'Глагол "обрамляется" ne...pas: Je ne parle pas.',
    explanationEn: 'The verb is "wrapped" by ne...pas: Je ne parle pas (I don\'t speak).',
  },
  {
    topicSlug: 'negation',
    type: 'multiple_choice',
    question: { text: 'Il ___ fume ___. (больше не)', options: ['ne / pas', 'ne / plus', 'ne / jamais', 'ne / rien'] },
    answer: { correct: 'ne / plus' },
    explanation: 'ne...plus = больше не.',
    explanationEn: 'ne...plus = no longer, not anymore.',
  },
  {
    topicSlug: 'negation',
    type: 'fill_blank',
    question: { text: 'Je n\'ai pas ___ voiture. (un/une → ?)', blanks: 1 },
    answer: { values: ['de'] },
    explanation: 'После отрицания une → de: Je n\'ai pas de voiture.',
    explanationEn: 'After negation, une changes to de: Je n\'ai pas de voiture (I don\'t have a car).',
  },
  {
    topicSlug: 'negation',
    type: 'multiple_choice',
    question: { text: 'Je ___ vois ___. (ничего)', options: ['ne / rien', 'ne / pas', 'ne / jamais', 'ne / personne'] },
    answer: { correct: 'ne / rien' },
    explanation: 'ne...rien = ничего.',
    explanationEn: 'ne...rien = nothing, not anything.',
  },

  // === questions ===
  {
    topicSlug: 'questions',
    type: 'multiple_choice',
    question: { text: '___ tu habites ?', options: ['Que', 'Qui', 'Où', 'Quand'] },
    answer: { correct: 'Où' },
    explanation: 'Où = где/куда. Спрашиваем о месте жительства.',
    explanationEn: 'Où = where. We are asking about the place of residence.',
  },
  {
    topicSlug: 'questions',
    type: 'fill_blank',
    question: { text: '___ heure est-il ?', blanks: 1 },
    answer: { values: ['Quelle'] },
    explanation: 'Quelle heure est-il ? = Который час? Quel/Quelle = какой/какая.',
    explanationEn: 'Quelle heure est-il? = What time is it? Quel/Quelle = which/what.',
  },
  {
    topicSlug: 'questions',
    type: 'multiple_choice',
    question: { text: 'Трансформируйте: "Tu aimes le sport ?" → форма est-ce que:', options: ['Est-ce que tu aimes le sport ?', 'Aimes-tu le sport ?', 'Tu sport aimes ?', 'Est-ce tu aimes ?'] },
    answer: { correct: 'Est-ce que tu aimes le sport ?' },
    explanation: 'Est-ce que + утвердительный порядок слов.',
    explanationEn: 'Est-ce que + normal word order (subject-verb). No inversion needed.',
  },

  // === prepositions-place ===
  {
    topicSlug: 'prepositions-place',
    type: 'multiple_choice',
    question: { text: 'Le chat est ___ le lit.', options: ['sur', 'sous', 'dans', 'devant'] },
    answer: { correct: 'sous' },
    explanation: 'Кот под кроватью: sous le lit.',
    explanationEn: 'The cat is under the bed: sous le lit.',
  },
  {
    topicSlug: 'prepositions-place',
    type: 'fill_blank',
    question: { text: 'J\'habite ___ Paris.', blanks: 1 },
    answer: { values: ['à'] },
    explanation: 'С городами используется à: à Paris.',
    explanationEn: 'Cities use the preposition à: à Paris.',
  },
  {
    topicSlug: 'prepositions-place',
    type: 'multiple_choice',
    question: { text: 'Elle habite ___ France.', options: ['à', 'au', 'en', 'aux'] },
    answer: { correct: 'en' },
    explanation: 'Франция — женского рода, поэтому en: en France.',
    explanationEn: 'France is a feminine country, so we use en: en France.',
  },

  // === possessives ===
  {
    topicSlug: 'possessives',
    type: 'fill_blank',
    question: { text: 'C\'est ___ livre. (mon/ma — livre = м.р.)', blanks: 1 },
    answer: { values: ['mon'] },
    explanation: 'livre — мужского рода → mon livre (независимо от пола владельца).',
    explanationEn: 'livre is masculine → mon livre, regardless of the owner\'s gender.',
  },
  {
    topicSlug: 'possessives',
    type: 'multiple_choice',
    question: { text: 'Marie a une sœur. ___ sœur s\'appelle Claire.', options: ['Son', 'Sa', 'Ses', 'Leur'] },
    answer: { correct: 'Sa' },
    explanation: 'sœur — женского рода → sa sœur (её сестра).',
    explanationEn: 'sœur is feminine → sa sœur (her sister).',
  },
  {
    topicSlug: 'possessives',
    type: 'fill_blank',
    question: { text: 'Nous aimons ___ amis. (наши)', blanks: 1 },
    answer: { values: ['nos'] },
    explanation: 'nos = наши (мн.ч. от notre).',
    explanationEn: 'nos = our (plural form of notre).',
  },

  // === numbers-time ===
  {
    topicSlug: 'numbers-time',
    type: 'multiple_choice',
    question: { text: 'Comment dit-on 70 en français ?', options: ['septante', 'soixante-dix', 'soixante-douze', 'setante'] },
    answer: { correct: 'soixante-dix' },
    explanation: '70 = soixante-dix (60+10). Septante используется только в Бельгии и Швейцарии.',
    explanationEn: '70 = soixante-dix (60+10). Septante is only used in Belgium and Switzerland.',
  },
  {
    topicSlug: 'numbers-time',
    type: 'fill_blank',
    question: { text: 'Il est trois heures et ___. (половина четвёртого)', blanks: 1 },
    answer: { values: ['demie'] },
    explanation: 'et demie = и половина. Trois heures et demie = половина четвёртого.',
    explanationEn: 'et demie = and a half. Trois heures et demie = half past three.',
  },
  {
    topicSlug: 'numbers-time',
    type: 'multiple_choice',
    question: { text: 'Comment dit-on 80 ?', options: ['huitante', 'quatre-vingts', 'octante', 'quatre-vingt-dix'] },
    answer: { correct: 'quatre-vingts' },
    explanation: '80 = quatre-vingts (4×20).',
    explanationEn: '80 = quatre-vingts (4×20). This is unique to standard French.',
  },

  // === demonstratives ===
  {
    topicSlug: 'demonstratives',
    type: 'multiple_choice',
    question: { text: '___ homme est médecin.', options: ['Ce', 'Cet', 'Cette', 'Ces'] },
    answer: { correct: 'Cet' },
    explanation: 'homme начинается на h (немое), поэтому cet (не ce): cet homme.',
    explanationEn: 'homme starts with a silent h, so cet is used (not ce): cet homme.',
  },
  {
    topicSlug: 'demonstratives',
    type: 'fill_blank',
    question: { text: '___ robe est magnifique. (ж.р. ед.ч.)', blanks: 1 },
    answer: { values: ['Cette'] },
    explanation: 'robe — женского рода, ед.ч. → cette.',
    explanationEn: 'robe is feminine singular → cette (this/that).',
  },
  {
    topicSlug: 'demonstratives',
    type: 'multiple_choice',
    question: { text: '___ fleurs sont belles.', options: ['Ce', 'Cet', 'Cette', 'Ces'] },
    answer: { correct: 'Ces' },
    explanation: 'fleurs — множественное число → ces.',
    explanationEn: 'fleurs is plural → ces (these/those).',
  },

  // === past-tense-passe-compose ===
  {
    topicSlug: 'past-tense-passe-compose',
    type: 'fill_blank',
    question: { text: 'Hier j\'___ (manger) une pizza.', blanks: 1 },
    answer: { values: ['ai mangé'] },
    explanation: 'manger — с avoir: j\'ai mangé.',
    explanationEn: 'manger uses avoir as auxiliary: j\'ai mangé (I ate).',
  },
  {
    topicSlug: 'past-tense-passe-compose',
    type: 'multiple_choice',
    question: { text: 'Elle ___ (partir) tôt ce matin.', options: ['a parti', 'est partie', 'a partié', 'est partié'] },
    answer: { correct: 'est partie' },
    explanation: 'partir — глагол движения, вспомогательный être. Elle est partie (причастие согласуется: elle → -e).',
    explanationEn: 'partir is a motion verb using être. The past participle agrees with the subject: elle est partie (she left).',
  },
  {
    topicSlug: 'past-tense-passe-compose',
    type: 'fill_blank',
    question: { text: 'Nous ___ (finir) le travail. (passé composé)', blanks: 1 },
    answer: { values: ['avons fini'] },
    explanation: 'finir: причастие fini; с avoir → nous avons fini.',
    explanationEn: 'finir: past participle is fini; with avoir → nous avons fini (we finished).',
  },

  // === reflexive-verbs ===
  {
    topicSlug: 'reflexive-verbs',
    type: 'fill_blank',
    question: { text: 'Je ___ lève à 7 heures.', blanks: 1 },
    answer: { values: ['me'] },
    explanation: 'se lever: je me lève.',
    explanationEn: 'se lever (to get up): je me lève (I get up).',
  },
  {
    topicSlug: 'reflexive-verbs',
    type: 'multiple_choice',
    question: { text: 'Comment ___ vous ?', options: ['vous appelle', 'vous appelez', 'vous appelles', 't\'appelles'] },
    answer: { correct: 'vous appelez' },
    explanation: 's\'appeler: vous vous appelez.',
    explanationEn: 's\'appeler (to be named): vous vous appelez (what is your name? / you are called).',
  },
  {
    topicSlug: 'reflexive-verbs',
    type: 'fill_blank',
    question: { text: 'Elle ___ est ___ (se coucher) à minuit.', blanks: 2 },
    answer: { values: ['s\'', 'couchée'] },
    explanation: 'Passé composé с être: elle s\'est couchée (причастие согласуется с ж.р.).',
    explanationEn: 'Passé composé with être: elle s\'est couchée. The past participle agrees with the feminine subject.',
  },

  // === imperatives ===
  {
    topicSlug: 'imperatives',
    type: 'fill_blank',
    question: { text: '___ ! (regarder — tu форма)', blanks: 1 },
    answer: { values: ['Regarde'] },
    explanation: 'regarder (-er глагол): tu форма без -s → Regarde!',
    explanationEn: 'regarder (-er verb): the tu imperative drops -s → Regarde! (Look!)',
  },
  {
    topicSlug: 'imperatives',
    type: 'multiple_choice',
    question: { text: '___ sage ! (être — tu форма)', options: ['Est', 'Sois', 'Êtes', 'Soit'] },
    answer: { correct: 'Sois' },
    explanation: 'être неправильный: tu → sois.',
    explanationEn: 'être is irregular: the tu imperative is sois (Be good!).',
  },
  {
    topicSlug: 'imperatives',
    type: 'fill_blank',
    question: { text: 'Ne ___ pas ! (toucher — tu форма)', blanks: 1 },
    answer: { values: ['touche'] },
    explanation: 'Отрицательный императив: ne + глагол + pas. toucher: tu → touche.',
    explanationEn: 'Negative imperative: ne + verb + pas. toucher: tu form → touche. Don\'t touch!',
  },

  // === adverbs-frequency ===
  {
    topicSlug: 'adverbs-frequency',
    type: 'multiple_choice',
    question: { text: 'Il mange ___ au restaurant. (часто)', options: ['toujours', 'souvent', 'rarement', 'jamais'] },
    answer: { correct: 'souvent' },
    explanation: 'souvent = часто.',
    explanationEn: 'souvent = often.',
  },
  {
    topicSlug: 'adverbs-frequency',
    type: 'fill_blank',
    question: { text: 'Je ne bois ___ d\'alcool.', blanks: 1 },
    answer: { values: ['jamais'] },
    explanation: 'ne...jamais = никогда.',
    explanationEn: 'ne...jamais = never.',
  },
  {
    topicSlug: 'adverbs-frequency',
    type: 'multiple_choice',
    question: { text: '___ je me lève à 7 heures. (обычно)', options: ['Parfois', 'Rarement', 'D\'habitude', 'Jamais'] },
    answer: { correct: 'D\'habitude' },
    explanation: 'D\'habitude = обычно, как правило.',
    explanationEn: 'D\'habitude = usually, as a rule.',
  },
];
