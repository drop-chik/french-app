// Placement test questions: adaptive A1→B2
// Structure: each question has a level, type, and correct answer

export interface PlacementQuestion {
  id: string;
  level: 'A1' | 'A2' | 'B1' | 'B2';
  type: 'vocabulary' | 'grammar' | 'comprehension';
  question: string;
  options: string[];
  correct: string;
  explanation?: string;
}

export const placementQuestions: PlacementQuestion[] = [
  // === A1 Vocabulary ===
  {
    id: 'a1-v1',
    level: 'A1',
    type: 'vocabulary',
    question: 'Comment dit-on "bonjour" en russe ?',
    options: ['Привет', 'До свидания', 'Спасибо', 'Пожалуйста'],
    correct: 'Привет',
  },
  {
    id: 'a1-v2',
    level: 'A1',
    type: 'vocabulary',
    question: 'Que signifie "le chat" ?',
    options: ['собака', 'кот', 'птица', 'рыба'],
    correct: 'кот',
  },
  {
    id: 'a1-v3',
    level: 'A1',
    type: 'vocabulary',
    question: 'Que signifie "manger" ?',
    options: ['спать', 'пить', 'есть', 'идти'],
    correct: 'есть',
  },
  {
    id: 'a1-v4',
    level: 'A1',
    type: 'vocabulary',
    question: 'Comment dit-on "la maison" ?',
    options: ['школа', 'дом', 'машина', 'улица'],
    correct: 'дом',
  },

  // === A1 Grammar ===
  {
    id: 'a1-g1',
    level: 'A1',
    type: 'grammar',
    question: 'Choisissez la bonne forme : "Je ___ français."',
    options: ['parle', 'parles', 'parlons', 'parlent'],
    correct: 'parle',
    explanation: 'Verbe parler: je parle',
  },
  {
    id: 'a1-g2',
    level: 'A1',
    type: 'grammar',
    question: '"___ chat est noir." Quel article ?',
    options: ['Un', 'Le', 'La', 'Les'],
    correct: 'Le',
    explanation: 'chat — masculin singulier → le',
  },
  {
    id: 'a1-g3',
    level: 'A1',
    type: 'grammar',
    question: 'Quelle est la forme correcte de "être" pour "ils" ?',
    options: ['est', 'sont', 'sommes', 'êtes'],
    correct: 'sont',
  },
  {
    id: 'a1-g4',
    level: 'A1',
    type: 'grammar',
    question: '"J\'___ un frère." Complétez avec avoir.',
    options: ['ai', 'as', 'a', 'avons'],
    correct: 'ai',
  },
  {
    id: 'a1-g5',
    level: 'A1',
    type: 'grammar',
    question: 'Comment dit-on "Je n\'ai pas de voiture" ? (отрицание)',
    options: [
      'Je n\'ai pas une voiture.',
      'Je n\'ai pas de voiture.',
      'Je ai pas voiture.',
      'Je pas ai voiture.',
    ],
    correct: 'Je n\'ai pas de voiture.',
    explanation: 'Après la négation: pas de (pas un/une)',
  },

  // === A2 Vocabulary ===
  {
    id: 'a2-v1',
    level: 'A2',
    type: 'vocabulary',
    question: 'Que signifie "se souvenir" ?',
    options: ['засыпать', 'вспоминать', 'беспокоиться', 'просыпаться'],
    correct: 'вспоминать',
  },
  {
    id: 'a2-v2',
    level: 'A2',
    type: 'vocabulary',
    question: 'Que signifie "le boulanger" ?',
    options: ['мясник', 'пекарь', 'сапожник', 'портной'],
    correct: 'пекарь',
  },
  {
    id: 'a2-v3',
    level: 'A2',
    type: 'vocabulary',
    question: 'Comment dit-on "скучать" (ennuyer) ?',
    options: ['s\'amuser', 's\'ennuyer', 'se reposer', 'se dépêcher'],
    correct: 's\'ennuyer',
  },

  // === A2 Grammar ===
  {
    id: 'a2-g1',
    level: 'A2',
    type: 'grammar',
    question: 'Passé composé de "manger" (je) :',
    options: ['je mangeais', 'j\'ai mangé', 'je mange', 'j\'avais mangé'],
    correct: 'j\'ai mangé',
    explanation: 'Passé composé: avoir + participe passé (mangé)',
  },
  {
    id: 'a2-g2',
    level: 'A2',
    type: 'grammar',
    question: '"Elle ___ (aller) au marché hier."',
    options: ['est allé', 'est allée', 'a allé', 'a allée'],
    correct: 'est allée',
    explanation: 'aller → être au passé composé; elle → participe s\'accorde: allée',
  },
  {
    id: 'a2-g3',
    level: 'A2',
    type: 'grammar',
    question: 'Futur proche : "Nous ___ partir demain."',
    options: ['allons', 'irons', 'sommes', 'avons'],
    correct: 'allons',
    explanation: 'Futur proche = aller (présent) + infinitif: nous allons partir',
  },
  {
    id: 'a2-g4',
    level: 'A2',
    type: 'grammar',
    question: '"___ livre est intéressant." (ce/cet/cette/ces)',
    options: ['Ce', 'Cet', 'Cette', 'Ces'],
    correct: 'Ce',
    explanation: 'livre — masculin, commence par consonne → ce',
  },
  {
    id: 'a2-g5',
    level: 'A2',
    type: 'grammar',
    question: '"Il ___ depuis deux heures." (pleuvoir)',
    options: ['pleut', 'pleure', 'a plu', 'pleuvait'],
    correct: 'pleut',
    explanation: 'pleuvoit → il pleut (présent)',
  },

  // === B1 Vocabulary ===
  {
    id: 'b1-v1',
    level: 'B1',
    type: 'vocabulary',
    question: 'Que signifie "pourtant" ?',
    options: ['поэтому', 'тем не менее', 'следовательно', 'как только'],
    correct: 'тем не менее',
  },
  {
    id: 'b1-v2',
    level: 'B1',
    type: 'vocabulary',
    question: 'Que signifie "se méfier de" ?',
    options: ['доверять', 'не доверять, остерегаться', 'заботиться', 'привыкать'],
    correct: 'не доверять, остерегаться',
  },
  {
    id: 'b1-v3',
    level: 'B1',
    type: 'vocabulary',
    question: '"Il a réussi à ___ son examen." Quel verbe ?',
    options: ['passer', 'réussir', 'rater', 'préparer'],
    correct: 'passer',
    explanation: 'réussir à + infinitif = suмеет сдать; passer un examen = сдавать экзамен',
  },

  // === B1 Grammar ===
  {
    id: 'b1-g1',
    level: 'B1',
    type: 'grammar',
    question: 'Subjonctif présent de "être" (que je) :',
    options: ['que je sois', 'que je suis', 'que je serai', 'que j\'étais'],
    correct: 'que je sois',
    explanation: 'Subjonctif: que je sois',
  },
  {
    id: 'b1-g2',
    level: 'B1',
    type: 'grammar',
    question: '"Il faut que tu ___ (venir) à l\'heure."',
    options: ['viens', 'viennes', 'venais', 'viendras'],
    correct: 'viennes',
    explanation: 'Il faut que + subjonctif: que tu viennes',
  },
  {
    id: 'b1-g3',
    level: 'B1',
    type: 'grammar',
    question: 'Imparfait de "faire" (nous) :',
    options: ['nous faisions', 'nous fîmes', 'nous avons fait', 'nous ferons'],
    correct: 'nous faisions',
    explanation: 'Imparfait: nous faisions',
  },
  {
    id: 'b1-g4',
    level: 'B1',
    type: 'grammar',
    question: '"Je lui ___ dit la vérité." (pronom)',
    options: ['lui ai', 'l\'ai', 'leur ai', 'y ai'],
    correct: 'lui ai',
    explanation: 'lui = pronom COI (à lui/elle)',
  },
  {
    id: 'b1-g5',
    level: 'B1',
    type: 'grammar',
    question: 'Accord du participe passé : "Les lettres que j\'___ écri___."',
    options: ['ai écrit', 'ai écrites', 'ai écrits', 'suis écrit'],
    correct: 'ai écrites',
    explanation: 'COD "les lettres" (féminin pluriel) précède le verbe → participe s\'accorde: écrites',
  },

  // === B2 Vocabulary ===
  {
    id: 'b2-v1',
    level: 'B2',
    type: 'vocabulary',
    question: 'Que signifie "à l\'insu de" ?',
    options: ['благодаря', 'несмотря на', 'без ведома', 'вместо'],
    correct: 'без ведома',
  },
  {
    id: 'b2-v2',
    level: 'B2',
    type: 'vocabulary',
    question: 'Quel mot est un synonyme de "véhément" ?',
    options: ['doux', 'passionné', 'calme', 'timide'],
    correct: 'passionné',
  },
  {
    id: 'b2-v3',
    level: 'B2',
    type: 'vocabulary',
    question: '"Cette loi ___ en vigueur le mois prochain." (entrer)',
    options: ['entre', 'entrera', 'est entrée', 'entrerait'],
    correct: 'entrera',
    explanation: 'Futur simple: entrera en vigueur',
  },

  // === B2 Grammar ===
  {
    id: 'b2-g1',
    level: 'B2',
    type: 'grammar',
    question: 'Conditionnel passé : "Si j\'avais su, je n\'___ pas venu."',
    options: ['aurais', 'serais', 'avais', 'suis'],
    correct: 'serais',
    explanation: 'Conditionnel passé avec être: je ne serais pas venu',
  },
  {
    id: 'b2-g2',
    level: 'B2',
    type: 'grammar',
    question: 'Voix passive : "Le rapport ___ rédigé par le directeur."',
    options: ['a été', 'est', 'était', 'aura été'],
    correct: 'a été',
    explanation: 'Passif passé composé: a été + participe passé',
  },
  {
    id: 'b2-g3',
    level: 'B2',
    type: 'grammar',
    question: '"Bien que ce soit difficile, il ___." (persévérer — subjonctif)',
    options: ['persévère', 'persévérera', 'persévèrerait', 'persévérât'],
    correct: 'persévère',
    explanation: 'Bien que + subjonctif présent: il persévère',
  },
];
