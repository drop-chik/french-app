// A1 grammar — additional exercises to bring topics with only 3 items
// up to a solid 7-per-topic baseline. 17 topics × 4 new = 68 exercises.

import type { ExerciseSeed } from './grammar-exercises-a1.js';

export const grammarExercisesA1Extra3: ExerciseSeed[] = [
  // ─── nouns-gender ────────────────────────────────────────────────
  {
    topicSlug: 'nouns-gender', type: 'multiple_choice',
    question: { text: 'Quelle est la forme correcte ?', options: ['un fille', 'une fille', 'le fille', 'la garçon'] },
    answer: { correct: 'une fille' },
    explanation: 'fille — женский род, неопределённый артикль une.',
    explanationEn: '"fille" is feminine, so the indefinite article is "une".',
  },
  {
    topicSlug: 'nouns-gender', type: 'fill_blank',
    question: { text: 'C\'est ___ ami français.', blanks: 1 },
    answer: { values: ['un'] },
    explanation: 'ami — мужской род, неопределённый артикль un. Слова на -i как правило мужского рода.',
    explanationEn: '"ami" is masculine → "un ami".',
  },
  {
    topicSlug: 'nouns-gender', type: 'multiple_choice',
    question: { text: 'Quel mot est féminin ?', options: ['stylo', 'livre', 'maison', 'fromage'] },
    answer: { correct: 'maison' },
    explanation: 'Окончание -son часто указывает на женский род: la maison.',
    explanationEn: 'Words ending in -son are usually feminine: "la maison".',
  },
  {
    topicSlug: 'nouns-gender', type: 'fill_blank',
    question: { text: 'Le boulanger vend ___ pain délicieux.', blanks: 1 },
    answer: { values: ['un'] },
    explanation: 'pain — мужской род, неопределённый артикль un.',
    explanationEn: '"pain" is masculine → un pain.',
  },

  // ─── nouns-plural ────────────────────────────────────────────────
  {
    topicSlug: 'nouns-plural', type: 'fill_blank',
    question: { text: 'Plural form of "le chapeau" is "les ___".', blanks: 1 },
    answer: { values: ['chapeaux'] },
    explanation: 'Слова на -eau получают -x во множественном числе: chapeau → chapeaux.',
    explanationEn: 'Nouns ending in -eau take -x in the plural: chapeau → chapeaux.',
  },
  {
    topicSlug: 'nouns-plural', type: 'multiple_choice',
    question: { text: 'Pluriel de "le journal":', options: ['les journals', 'les journaux', 'les journales', 'les journal'] },
    answer: { correct: 'les journaux' },
    explanation: 'Слова на -al → -aux: journal → journaux.',
    explanationEn: 'Nouns ending in -al take -aux: journal → journaux.',
  },
  {
    topicSlug: 'nouns-plural', type: 'fill_blank',
    question: { text: 'Au zoo, on voit beaucoup d\'___ (animal).', blanks: 1 },
    answer: { values: ['animaux'] },
    explanation: 'animal → animaux (правило -al → -aux).',
    explanationEn: 'animal → animaux (rule -al → -aux).',
  },
  {
    topicSlug: 'nouns-plural', type: 'multiple_choice',
    question: { text: 'Pluriel de "le bus":', options: ['les buss', 'les buses', 'les bus', 'les busx'] },
    answer: { correct: 'les bus' },
    explanation: 'Слова уже на -s/-x/-z не меняются во мн. числе: le bus → les bus.',
    explanationEn: 'Nouns ending in -s/-x/-z stay the same: le bus → les bus.',
  },

  // ─── articles-indefinite ────────────────────────────────────────
  {
    topicSlug: 'articles-indefinite', type: 'translate',
    question: { text: 'У меня есть собака.' },
    answer: { values: ["J'ai un chien.", "J'ai une chienne."] },
    explanation: 'chien — м.р., un chien.',
    explanationEn: 'For "a dog" → "un chien" (masculine).',
  },
  {
    topicSlug: 'articles-indefinite', type: 'multiple_choice',
    question: { text: 'C\'est ___ étudiante française.', options: ['un', 'une', 'des', 'le'] },
    answer: { correct: 'une' },
    explanation: 'étudiante — женский род, une étudiante.',
    explanationEn: '"étudiante" is feminine → "une".',
  },
  {
    topicSlug: 'articles-indefinite', type: 'fill_blank',
    question: { text: 'Je voudrais ___ café, s\'il vous plaît.', blanks: 1 },
    answer: { values: ['un'] },
    explanation: 'café (напиток) — м.р., неопределённый артикль un.',
    explanationEn: '"café" is masculine → "un café".',
  },
  {
    topicSlug: 'articles-indefinite', type: 'multiple_choice',
    question: { text: 'Il n\'a pas ___ amis.', options: ['des', 'd\'', 'de', 'un'] },
    answer: { correct: 'd\'' },
    explanation: 'После отрицания des → de; перед гласной → d\'.',
    explanationEn: 'After negation, "des" becomes "de"; before a vowel → "d\'".',
  },

  // ─── articles-partitive ─────────────────────────────────────────
  {
    topicSlug: 'articles-partitive', type: 'fill_blank',
    question: { text: 'Je bois ___ eau.', blanks: 1 },
    answer: { values: ['de l\''] },
    explanation: 'Партитивный артикль перед гласной → de l\'. Несчётное.',
    explanationEn: 'Partitive article before a vowel → "de l\'". Uncountable.',
  },
  {
    topicSlug: 'articles-partitive', type: 'multiple_choice',
    question: { text: 'Au petit-déjeuner, je mange ___ pain.', options: ['le', 'du', 'des', 'un'] },
    answer: { correct: 'du' },
    explanation: 'Партитив для несчётных в м.р.: du pain.',
    explanationEn: 'Partitive for uncountable masculine nouns: "du pain".',
  },
  {
    topicSlug: 'articles-partitive', type: 'multiple_choice',
    question: { text: 'Elle prend ___ thé avec ___ sucre.', options: ['du / du', 'le / le', 'de / de', 'un / un'] },
    answer: { correct: 'du / du' },
    explanation: 'thé и sucre — несчётные, м.р.: du thé, du sucre.',
    explanationEn: 'Both "thé" and "sucre" are uncountable masculine → "du / du".',
  },
  {
    topicSlug: 'articles-partitive', type: 'fill_blank',
    question: { text: 'Tu veux ___ glace ?', blanks: 1 },
    answer: { values: ['de la'] },
    explanation: 'glace (мороженое, ж.р., несчётное) → de la glace.',
    explanationEn: '"glace" (ice cream) is feminine uncountable → "de la glace".',
  },

  // ─── verbs-present-regular ──────────────────────────────────────
  {
    topicSlug: 'verbs-present-regular', type: 'fill_blank',
    question: { text: 'Nous ___ (parler) français.', blanks: 1 },
    answer: { values: ['parlons'] },
    explanation: '-er глаголы: nous + основа + -ons → parlons.',
    explanationEn: '-er verbs: "nous" + stem + -ons → "parlons".',
  },
  {
    topicSlug: 'verbs-present-regular', type: 'fill_blank',
    question: { text: 'Elle ___ (chanter) très bien.', blanks: 1 },
    answer: { values: ['chante'] },
    explanation: '-er глаголы: elle + основа + -e → chante.',
    explanationEn: '-er verbs: "elle" + stem + -e → "chante".',
  },
  {
    topicSlug: 'verbs-present-regular', type: 'multiple_choice',
    question: { text: 'Vous ___ (regarder) la télé.', options: ['regarde', 'regardes', 'regardez', 'regardent'] },
    answer: { correct: 'regardez' },
    explanation: '-er глаголы: vous + основа + -ez → regardez.',
    explanationEn: '-er verbs: "vous" + stem + -ez → "regardez".',
  },
  {
    topicSlug: 'verbs-present-regular', type: 'fill_blank',
    question: { text: 'Ils ___ (habiter) à Paris.', blanks: 1 },
    answer: { values: ['habitent'] },
    explanation: '-er глаголы: ils + основа + -ent → habitent.',
    explanationEn: '-er verbs: "ils" + stem + -ent → "habitent".',
  },

  // ─── adjectives-agreement ───────────────────────────────────────
  {
    topicSlug: 'adjectives-agreement', type: 'fill_blank',
    question: { text: 'C\'est une fille très ___ (intelligent).', blanks: 1 },
    answer: { values: ['intelligente'] },
    explanation: 'fille — ж.р., поэтому добавляем -e: intelligente.',
    explanationEn: '"fille" is feminine → add -e: "intelligente".',
  },
  {
    topicSlug: 'adjectives-agreement', type: 'multiple_choice',
    question: { text: 'Ces livres sont ___ (intéressant).', options: ['intéressant', 'intéressante', 'intéressants', 'intéressantes'] },
    answer: { correct: 'intéressants' },
    explanation: 'livres — м.р. мн.ч., поэтому -s: intéressants.',
    explanationEn: '"livres" is masculine plural → "intéressants".',
  },
  {
    topicSlug: 'adjectives-agreement', type: 'fill_blank',
    question: { text: 'Les filles sont ___ (heureux).', blanks: 1 },
    answer: { values: ['heureuses'] },
    explanation: 'heureux → heureuses (ж.р. мн.ч.). -eux → -euse → -euses.',
    explanationEn: 'heureux (masc) → heureuses (fem plural). Pattern -eux → -euses.',
  },
  {
    topicSlug: 'adjectives-agreement', type: 'multiple_choice',
    question: { text: 'Une voiture ___ (rouge):', options: ['rouge', 'rouges', 'rouge.e', 'rouger'] },
    answer: { correct: 'rouge' },
    explanation: 'Прилагательные на -e не меняются в ж.р.: rouge остаётся rouge.',
    explanationEn: 'Adjectives ending in -e don\'t change in feminine: "rouge" stays "rouge".',
  },

  // ─── adverbs-frequency ──────────────────────────────────────────
  {
    topicSlug: 'adverbs-frequency', type: 'multiple_choice',
    question: { text: 'Je vais ___ au cinéma. (всегда)', options: ['jamais', 'rarement', 'toujours', 'souvent'] },
    answer: { correct: 'toujours' },
    explanation: 'toujours = всегда.',
    explanationEn: 'toujours = always.',
  },
  {
    topicSlug: 'adverbs-frequency', type: 'translate',
    question: { text: 'Я редко смотрю телевизор.' },
    answer: { values: ['Je regarde rarement la télé.', 'Je regarde rarement la télévision.'] },
    explanation: 'rarement = редко. Наречие ставится после глагола.',
    explanationEn: '"rarement" = rarely. Adverb usually goes after the verb.',
  },
  {
    topicSlug: 'adverbs-frequency', type: 'multiple_choice',
    question: { text: 'Il ne mange ___ de viande. (никогда)', options: ['toujours', 'jamais', 'souvent', 'parfois'] },
    answer: { correct: 'jamais' },
    explanation: 'ne ... jamais = никогда.',
    explanationEn: 'ne ... jamais = never.',
  },
  {
    topicSlug: 'adverbs-frequency', type: 'fill_blank',
    question: { text: 'Je vais ___ à la piscine. (иногда)', blanks: 1 },
    answer: { values: ['parfois', 'quelquefois'] },
    explanation: 'parfois / quelquefois = иногда.',
    explanationEn: 'parfois / quelquefois = sometimes.',
  },

  // ─── pronouns-personal ──────────────────────────────────────────
  {
    topicSlug: 'pronouns-personal', type: 'multiple_choice',
    question: { text: 'Tu connais Marie ? — Oui, ___ connais.', options: ['je le', 'je la', 'je les', 'je l\''] },
    answer: { correct: 'je la' },
    explanation: 'Marie — ж.р. ед.ч., прямое дополнение → la.',
    explanationEn: '"Marie" is feminine singular, direct object → "la".',
  },
  {
    topicSlug: 'pronouns-personal', type: 'fill_blank',
    question: { text: 'Tu as les clés ? — Oui, je ___ ai.', blanks: 1 },
    answer: { values: ['les'] },
    explanation: 'les clés — мн.ч., прямое дополнение → les.',
    explanationEn: '"les clés" is plural direct object → "les".',
  },
  {
    topicSlug: 'pronouns-personal', type: 'multiple_choice',
    question: { text: 'Je téléphone à mon père. → Je ___ téléphone.', options: ['le', 'la', 'lui', 'les'] },
    answer: { correct: 'lui' },
    explanation: 'téléphoner à кому-то → косвенное доп. → lui (ему).',
    explanationEn: '"téléphoner à" takes an indirect object → "lui" (him).',
  },
  {
    topicSlug: 'pronouns-personal', type: 'fill_blank',
    question: { text: 'Tu as parlé à tes amis ? — Oui, je ___ ai parlé.', blanks: 1 },
    answer: { values: ['leur'] },
    explanation: 'parler à кому-то (мн.ч.) → leur (им).',
    explanationEn: '"parler à" + plural → "leur" (to them).',
  },

  // ─── possessives ────────────────────────────────────────────────
  {
    topicSlug: 'possessives', type: 'multiple_choice',
    question: { text: '___ mère est gentille. (моя)', options: ['mon', 'ma', 'mes', 'me'] },
    answer: { correct: 'ma' },
    explanation: 'mère — ж.р. ед.ч., притяжательное → ma.',
    explanationEn: '"mère" is feminine singular → "ma".',
  },
  {
    topicSlug: 'possessives', type: 'fill_blank',
    question: { text: '___ amie est belle. (его/её)', blanks: 1 },
    answer: { values: ['son'] },
    explanation: 'Хотя amie — ж.р., перед гласной используется son (для благозвучия).',
    explanationEn: 'Even though "amie" is feminine, "son" is used before a vowel for euphony.',
  },
  {
    topicSlug: 'possessives', type: 'multiple_choice',
    question: { text: '___ parents habitent à Lyon. (наши)', options: ['notre', 'nos', 'nous', 'mes'] },
    answer: { correct: 'nos' },
    explanation: 'parents — мн.ч., "наши" → nos.',
    explanationEn: '"parents" is plural, "our" → "nos".',
  },
  {
    topicSlug: 'possessives', type: 'fill_blank',
    question: { text: 'C\'est ___ voiture ? (твоя)', blanks: 1 },
    answer: { values: ['ta'] },
    explanation: 'voiture — ж.р. ед.ч., притяжательное "твоя" → ta.',
    explanationEn: '"voiture" is feminine singular, "your" → "ta".',
  },

  // ─── demonstratives ─────────────────────────────────────────────
  {
    topicSlug: 'demonstratives', type: 'multiple_choice',
    question: { text: '___ livre est passionnant.', options: ['Ce', 'Cet', 'Cette', 'Ces'] },
    answer: { correct: 'Ce' },
    explanation: 'livre — м.р. перед согласной → ce.',
    explanationEn: '"livre" is masculine, starts with a consonant → "ce".',
  },
  {
    topicSlug: 'demonstratives', type: 'fill_blank',
    question: { text: '___ enfant joue dans le jardin.', blanks: 1 },
    answer: { values: ['Cet'] },
    explanation: 'enfant — м.р. перед гласной → cet.',
    explanationEn: '"enfant" is masculine starting with a vowel → "cet".',
  },
  {
    topicSlug: 'demonstratives', type: 'multiple_choice',
    question: { text: '___ chaussures sont confortables.', options: ['Ce', 'Cette', 'Cet', 'Ces'] },
    answer: { correct: 'Ces' },
    explanation: 'chaussures — мн.ч. → ces.',
    explanationEn: '"chaussures" is plural → "ces".',
  },
  {
    topicSlug: 'demonstratives', type: 'fill_blank',
    question: { text: 'Regarde ___ fleur, elle est belle !', blanks: 1 },
    answer: { values: ['cette'] },
    explanation: 'fleur — ж.р. ед.ч. → cette.',
    explanationEn: '"fleur" is feminine singular → "cette".',
  },

  // ─── prepositions-place ─────────────────────────────────────────
  {
    topicSlug: 'prepositions-place', type: 'multiple_choice',
    question: { text: 'Je vais ___ Paris demain.', options: ['à', 'en', 'au', 'aux'] },
    answer: { correct: 'à' },
    explanation: 'Перед городом → à: à Paris.',
    explanationEn: 'Before a city → "à": "à Paris".',
  },
  {
    topicSlug: 'prepositions-place', type: 'fill_blank',
    question: { text: 'Elle habite ___ France.', blanks: 1 },
    answer: { values: ['en'] },
    explanation: 'Страны ж.р. (на -e) → en: en France.',
    explanationEn: 'Feminine countries (ending in -e) → "en": "en France".',
  },
  {
    topicSlug: 'prepositions-place', type: 'multiple_choice',
    question: { text: 'Nous voyageons ___ Japon.', options: ['en', 'à', 'au', 'aux'] },
    answer: { correct: 'au' },
    explanation: 'Страны м.р. → au: au Japon.',
    explanationEn: 'Masculine countries → "au": "au Japon".',
  },
  {
    topicSlug: 'prepositions-place', type: 'fill_blank',
    question: { text: 'Mes parents vivent ___ États-Unis.', blanks: 1 },
    answer: { values: ['aux'] },
    explanation: 'Страны во мн.ч. → aux: aux États-Unis.',
    explanationEn: 'Plural country names → "aux": "aux États-Unis".',
  },

  // ─── numbers-time ───────────────────────────────────────────────
  {
    topicSlug: 'numbers-time', type: 'multiple_choice',
    question: { text: 'Il est ___ heures et demie. (4:30)', options: ['quatre', 'quatres', 'cinq', 'trois'] },
    answer: { correct: 'quatre' },
    explanation: 'Числа во французском не изменяются: 4 heures = quatre heures.',
    explanationEn: 'Numbers don\'t change: 4 heures = "quatre heures".',
  },
  {
    topicSlug: 'numbers-time', type: 'translate',
    question: { text: 'Сейчас половина седьмого вечера.' },
    answer: { values: ['Il est six heures et demie du soir.', 'Il est dix-huit heures trente.'] },
    explanation: '6:30 PM = six heures et demie du soir или 18h30 = dix-huit heures trente.',
    explanationEn: '6:30 PM = "six heures et demie du soir" or 18h30 (24h) = "dix-huit heures trente".',
  },
  {
    topicSlug: 'numbers-time', type: 'fill_blank',
    question: { text: 'J\'ai ___ ans. (21)', blanks: 1 },
    answer: { values: ['vingt et un'] },
    explanation: '21 = vingt et un. Союз "et" с 21, 31, 41...',
    explanationEn: '21 = "vingt et un". Use "et" with 21, 31, 41…',
  },
  {
    topicSlug: 'numbers-time', type: 'multiple_choice',
    question: { text: 'Le train part à ___ . (12:00)', options: ['douze heures', 'midi', 'minuit', 'le midi'] },
    answer: { correct: 'midi' },
    explanation: '12:00 = midi (полдень). 00:00 = minuit (полночь).',
    explanationEn: '12:00 = "midi" (noon). 00:00 = "minuit" (midnight).',
  },

  // ─── questions ──────────────────────────────────────────────────
  {
    topicSlug: 'questions', type: 'multiple_choice',
    question: { text: 'Comment former une question avec "tu manges" (формально) ?', options: ['Manges-tu ?', 'Tu manges ?', 'Est-ce que tu manges ?', 'Все три варианта'] },
    answer: { correct: 'Все три варианта' },
    explanation: 'Все три способа верны: интонация (неформ.), est-ce que (нейтр.), инверсия (форм.).',
    explanationEn: 'All three are correct: intonation (informal), est-ce que (neutral), inversion (formal).',
  },
  {
    topicSlug: 'questions', type: 'fill_blank',
    question: { text: '___ est-ce que tu habites ? — À Paris.', blanks: 1 },
    answer: { values: ['Où'] },
    explanation: 'Где = Où.',
    explanationEn: 'Where = "Où".',
  },
  {
    topicSlug: 'questions', type: 'translate',
    question: { text: 'Что ты делаешь?' },
    answer: { values: ['Qu\'est-ce que tu fais ?', 'Que fais-tu ?'] },
    explanation: 'Что = qu\'est-ce que (нейтр.) или que + инверсия (формально).',
    explanationEn: '"What" = "qu\'est-ce que" (neutral) or "que" + inversion (formal).',
  },
  {
    topicSlug: 'questions', type: 'multiple_choice',
    question: { text: '___ tu as un stylo ?', options: ['Que', 'Est-ce qu\'', 'Qu\'', 'Où'] },
    answer: { correct: 'Est-ce qu\'' },
    explanation: 'Перед гласной est-ce que → est-ce qu\'.',
    explanationEn: 'Before a vowel "est-ce que" → "est-ce qu\'".',
  },

  // ─── imperatives ────────────────────────────────────────────────
  {
    topicSlug: 'imperatives', type: 'multiple_choice',
    question: { text: 'Imperatif de "tu manges":', options: ['Mange !', 'Manges !', 'Mangez !', 'Mangeons !'] },
    answer: { correct: 'Mange !' },
    explanation: '-er глаголы во 2 л. ед.ч. императива теряют -s: tu manges → Mange !',
    explanationEn: '-er verbs lose the final -s in the "tu" imperative: tu manges → "Mange !"',
  },
  {
    topicSlug: 'imperatives', type: 'fill_blank',
    question: { text: '___ (faire, vous) attention !', blanks: 1 },
    answer: { values: ['Faites'] },
    explanation: 'faire — неправильный глагол: vous faites → Faites !',
    explanationEn: 'faire is irregular: vous faites → "Faites !"',
  },
  {
    topicSlug: 'imperatives', type: 'translate',
    question: { text: 'Давайте поедим!' },
    answer: { values: ['Mangeons !'] },
    explanation: 'Императив 1 л. мн.ч. (давайте) = форма nous без местоимения: mangeons.',
    explanationEn: 'First person plural imperative ("let\'s …") = "nous" form without pronoun: "mangeons".',
  },
  {
    topicSlug: 'imperatives', type: 'multiple_choice',
    question: { text: 'Negatif imperatif: "___ pas la fenêtre !"', options: ['Ouvre', 'N\'ouvre', 'Ouvres', 'Pas ouvre'] },
    answer: { correct: 'N\'ouvre' },
    explanation: 'Отрицательный императив: ne (n\') + глагол + pas. "N\'ouvre pas !"',
    explanationEn: 'Negative imperative: ne (n\') + verb + pas. "N\'ouvre pas !"',
  },

  // ─── past-tense-passe-compose ───────────────────────────────────
  {
    topicSlug: 'past-tense-passe-compose', type: 'fill_blank',
    question: { text: 'Hier, j\'___ (manger) une pizza.', blanks: 1 },
    answer: { values: ['ai mangé'] },
    explanation: 'Passé composé: avoir в présent + participe passé. manger → mangé.',
    explanationEn: 'Passé composé: avoir in present + past participle. manger → mangé.',
  },
  {
    topicSlug: 'past-tense-passe-compose', type: 'multiple_choice',
    question: { text: 'Elle ___ au cinéma hier.', options: ['a allée', 'est allée', 'a allé', 'est allé'] },
    answer: { correct: 'est allée' },
    explanation: 'aller спрягается с être; ж.р. → -e в причастии: est allée.',
    explanationEn: '"aller" takes "être"; feminine → -e on participle: "est allée".',
  },
  {
    topicSlug: 'past-tense-passe-compose', type: 'fill_blank',
    question: { text: 'Nous ___ (voir) un film intéressant.', blanks: 1 },
    answer: { values: ['avons vu'] },
    explanation: 'voir → причастие vu. Спрягается с avoir.',
    explanationEn: 'voir → past participle "vu". Conjugates with avoir.',
  },
  {
    topicSlug: 'past-tense-passe-compose', type: 'translate',
    question: { text: 'Они приехали утром.' },
    answer: { values: ['Ils sont arrivés le matin.', 'Ils sont arrivés ce matin.'] },
    explanation: 'arriver — глагол движения, спрягается с être; ils → -s.',
    explanationEn: '"arriver" is a verb of movement → être; "ils" → add -s.',
  },

  // ─── reflexive-verbs ────────────────────────────────────────────
  {
    topicSlug: 'reflexive-verbs', type: 'fill_blank',
    question: { text: 'Je ___ lève à 7 heures.', blanks: 1 },
    answer: { values: ['me'] },
    explanation: 'Возвратное местоимение для "je" → me.',
    explanationEn: 'Reflexive pronoun for "je" → "me".',
  },
  {
    topicSlug: 'reflexive-verbs', type: 'multiple_choice',
    question: { text: 'Nous ___ couchons tard.', options: ['me', 'te', 'se', 'nous'] },
    answer: { correct: 'nous' },
    explanation: 'Возвратное местоимение для "nous" → nous.',
    explanationEn: 'Reflexive pronoun for "nous" → "nous".',
  },
  {
    topicSlug: 'reflexive-verbs', type: 'translate',
    question: { text: 'Я ложусь спать в 11 часов.' },
    answer: { values: ['Je me couche à 11 heures.', 'Je me couche à onze heures.'] },
    explanation: 'se coucher — ложиться спать (возвратный глагол).',
    explanationEn: '"se coucher" = to go to bed (reflexive verb).',
  },
  {
    topicSlug: 'reflexive-verbs', type: 'fill_blank',
    question: { text: 'Elle ___ appelle Marie.', blanks: 1 },
    answer: { values: ['s\''] },
    explanation: 's\'appeler — называться. Перед гласной → s\'.',
    explanationEn: '"s\'appeler" — to be called. Before vowel → "s\'".',
  },

  // ─── verbs-aller-venir ──────────────────────────────────────────
  {
    topicSlug: 'verbs-aller-venir', type: 'fill_blank',
    question: { text: 'Nous ___ (aller) au parc.', blanks: 1 },
    answer: { values: ['allons'] },
    explanation: 'aller: vais, vas, va, allons, allez, vont.',
    explanationEn: 'aller: vais, vas, va, allons, allez, vont.',
  },
  {
    topicSlug: 'verbs-aller-venir', type: 'multiple_choice',
    question: { text: 'Elle ___ (venir) de France.', options: ['vient', 'viens', 'venons', 'viennent'] },
    answer: { correct: 'vient' },
    explanation: 'venir: viens, viens, vient, venons, venez, viennent.',
    explanationEn: 'venir: viens, viens, vient, venons, venez, viennent.',
  },
  {
    topicSlug: 'verbs-aller-venir', type: 'translate',
    question: { text: 'Они идут в школу.' },
    answer: { values: ['Ils vont à l\'école.', 'Elles vont à l\'école.'] },
    explanation: 'aller à + место. ils/elles → vont.',
    explanationEn: '"aller à" + place. ils/elles → vont.',
  },
  {
    topicSlug: 'verbs-aller-venir', type: 'fill_blank',
    question: { text: 'D\'où ___ (venir) -vous ?', blanks: 1 },
    answer: { values: ['venez'] },
    explanation: 'venir во 2 л. мн.ч.: venez. d\'où = откуда.',
    explanationEn: 'venir, 2nd plural: venez. "d\'où" = "from where".',
  },
];
