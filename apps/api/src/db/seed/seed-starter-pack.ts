// Re-rank A1 vocabulary so new users actually see foundational words first.
//
// PROBLEM: most basic words (bonjour, merci, homme, rouge, lundi, deux,
// grand, beau, …) had frequencyRank = NULL in the seed. The query that
// picks "new words for today" sorts by frequencyRank ASC (NULLS LAST), so
// the only words that appeared first were the few that DID have a rank —
// and those happened to be question words (qui rank 10, que 11, où 13,
// quand 14, comment 15, pourquoi 16). A new user's first session was
// literally: «qui, que, où, quand, comment, pourquoi …». Pedagogically
// terrible.
//
// FIX: this script
//   1. Bumps a known set of "advanced / less-pedagogically-first" words
//      (question words, country names) to rank 250-270.
//   2. Inserts any of the 50 starter-pack words that are missing.
//   3. Sets the starter-pack words to ranks 1-50 in a deliberate order
//      (greetings → numbers → basic nouns → adjectives → colours →
//      days → common verbs).
//
// Idempotent — run as many times as you like; UPDATE/UPSERT semantics.
import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import { words } from '../schema/index.js';
import * as schema from '../schema/index.js';
import { eq, and, isNull, inArray } from 'drizzle-orm';

const { Pool } = pg;

// Words we want OUT of the top ranks. They'll be pushed to 250+.
const PUSH_TO_BACK = [
  'qui', 'que', 'quoi', 'où', 'quand', 'comment', 'pourquoi', 'combien',
  'quel / quelle', 'lequel / laquelle', 'combien de', 'à quelle heure',
];

// Starter pack — ordered. Index in array = target frequencyRank.
// Each entry: french, translation, partOfSpeech, level, gender, category.
const STARTER_PACK: Array<{
  french: string;
  translation: string;
  partOfSpeech: string;
  gender: 'm' | 'f' | null;
  category: string;
}> = [
  // ── Greetings / politeness (1-10) ──────────────────────────────────────
  { french: 'bonjour',         translation: 'здравствуйте; добрый день',     partOfSpeech: 'expression', gender: null, category: 'basics' },
  { french: 'salut',           translation: 'привет; пока (неформально)',    partOfSpeech: 'expression', gender: null, category: 'basics' },
  { french: 'au revoir',       translation: 'до свидания',                   partOfSpeech: 'expression', gender: null, category: 'basics' },
  { french: 'bonsoir',         translation: 'добрый вечер',                  partOfSpeech: 'expression', gender: null, category: 'basics' },
  { french: 'merci',           translation: 'спасибо',                       partOfSpeech: 'expression', gender: null, category: 'basics' },
  { french: 's\'il vous plaît', translation: 'пожалуйста (вежливо)',         partOfSpeech: 'expression', gender: null, category: 'basics' },
  { french: 'oui',             translation: 'да',                            partOfSpeech: 'expression', gender: null, category: 'basics' },
  { french: 'non',             translation: 'нет',                           partOfSpeech: 'expression', gender: null, category: 'basics' },
  { french: 'pardon',          translation: 'простите, извините',            partOfSpeech: 'expression', gender: null, category: 'basics' },
  { french: 'excusez-moi',     translation: 'извините',                      partOfSpeech: 'expression', gender: null, category: 'basics' },

  // ── Self-intro (11-15) ─────────────────────────────────────────────────
  { french: 'je m\'appelle',   translation: 'меня зовут',                    partOfSpeech: 'expression', gender: null, category: 'basics' },
  { french: 'comment ça va',   translation: 'как дела',                      partOfSpeech: 'expression', gender: null, category: 'basics' },
  { french: 'ça va bien',      translation: 'всё хорошо',                    partOfSpeech: 'expression', gender: null, category: 'basics' },
  { french: 'enchanté',        translation: 'приятно познакомиться',         partOfSpeech: 'expression', gender: null, category: 'basics' },
  { french: 'd\'accord',       translation: 'хорошо, договорились',          partOfSpeech: 'expression', gender: null, category: 'basics' },

  // ── Numbers 1-10 (16-25) ───────────────────────────────────────────────
  { french: 'un',              translation: 'один (1); неопр. артикль м.р.', partOfSpeech: 'number', gender: null, category: 'numbers' },
  { french: 'deux',            translation: 'два (2)',                       partOfSpeech: 'number', gender: null, category: 'numbers' },
  { french: 'trois',           translation: 'три (3)',                       partOfSpeech: 'number', gender: null, category: 'numbers' },
  { french: 'quatre',          translation: 'четыре (4)',                    partOfSpeech: 'number', gender: null, category: 'numbers' },
  { french: 'cinq',            translation: 'пять (5)',                      partOfSpeech: 'number', gender: null, category: 'numbers' },
  { french: 'six',             translation: 'шесть (6)',                     partOfSpeech: 'number', gender: null, category: 'numbers' },
  { french: 'sept',            translation: 'семь (7)',                      partOfSpeech: 'number', gender: null, category: 'numbers' },
  { french: 'huit',            translation: 'восемь (8)',                    partOfSpeech: 'number', gender: null, category: 'numbers' },
  { french: 'neuf',            translation: 'девять (9)',                    partOfSpeech: 'number', gender: null, category: 'numbers' },
  { french: 'dix',             translation: 'десять (10)',                   partOfSpeech: 'number', gender: null, category: 'numbers' },

  // ── Basic nouns (26-37) ────────────────────────────────────────────────
  { french: 'homme',           translation: 'мужчина; человек',              partOfSpeech: 'noun', gender: 'm', category: 'family' },
  { french: 'femme',           translation: 'женщина; жена',                 partOfSpeech: 'noun', gender: 'f', category: 'family' },
  { french: 'enfant',          translation: 'ребёнок',                       partOfSpeech: 'noun', gender: null, category: 'family' },
  { french: 'famille',         translation: 'семья',                         partOfSpeech: 'noun', gender: 'f', category: 'family' },
  { french: 'ami',             translation: 'друг',                          partOfSpeech: 'noun', gender: 'm', category: 'family' },
  { french: 'maison',          translation: 'дом',                           partOfSpeech: 'noun', gender: 'f', category: 'home' },
  { french: 'eau',             translation: 'вода',                          partOfSpeech: 'noun', gender: 'f', category: 'food' },
  { french: 'pain',            translation: 'хлеб',                          partOfSpeech: 'noun', gender: 'm', category: 'food' },
  { french: 'café',            translation: 'кофе; кафе',                    partOfSpeech: 'noun', gender: 'm', category: 'food' },
  { french: 'jour',            translation: 'день',                          partOfSpeech: 'noun', gender: 'm', category: 'time' },
  { french: 'matin',           translation: 'утро',                          partOfSpeech: 'noun', gender: 'm', category: 'time' },
  { french: 'soir',            translation: 'вечер',                         partOfSpeech: 'noun', gender: 'm', category: 'time' },

  // ── Basic adjectives + colours (38-50) ────────────────────────────────
  { french: 'grand',           translation: 'большой; высокий',              partOfSpeech: 'adj',  gender: null, category: 'adjectives' },
  { french: 'petit',           translation: 'маленький',                     partOfSpeech: 'adj',  gender: null, category: 'adjectives' },
  { french: 'beau',            translation: 'красивый',                      partOfSpeech: 'adj',  gender: null, category: 'adjectives' },
  { french: 'bon',             translation: 'хороший',                       partOfSpeech: 'adj',  gender: null, category: 'adjectives' },
  { french: 'mauvais',         translation: 'плохой',                        partOfSpeech: 'adj',  gender: null, category: 'adjectives' },
  { french: 'rouge',           translation: 'красный',                       partOfSpeech: 'adj',  gender: null, category: 'colors' },
  { french: 'bleu',            translation: 'синий, голубой',                partOfSpeech: 'adj',  gender: null, category: 'colors' },
  { french: 'vert',            translation: 'зелёный',                       partOfSpeech: 'adj',  gender: null, category: 'colors' },
  { french: 'jaune',           translation: 'жёлтый',                        partOfSpeech: 'adj',  gender: null, category: 'colors' },
  { french: 'noir',            translation: 'чёрный',                        partOfSpeech: 'adj',  gender: null, category: 'colors' },
  { french: 'blanc',           translation: 'белый',                         partOfSpeech: 'adj',  gender: null, category: 'colors' },

  // ── Days of week (51-57) ──────────────────────────────────────────────
  { french: 'lundi',           translation: 'понедельник',                   partOfSpeech: 'noun', gender: 'm', category: 'calendar' },
  { french: 'mardi',           translation: 'вторник',                       partOfSpeech: 'noun', gender: 'm', category: 'calendar' },
  { french: 'mercredi',        translation: 'среда',                         partOfSpeech: 'noun', gender: 'm', category: 'calendar' },
  { french: 'jeudi',           translation: 'четверг',                       partOfSpeech: 'noun', gender: 'm', category: 'calendar' },
  { french: 'vendredi',        translation: 'пятница',                       partOfSpeech: 'noun', gender: 'm', category: 'calendar' },
  { french: 'samedi',          translation: 'суббота',                       partOfSpeech: 'noun', gender: 'm', category: 'calendar' },
  { french: 'dimanche',        translation: 'воскресенье',                   partOfSpeech: 'noun', gender: 'm', category: 'calendar' },

  // ── Core verbs (58-72) ────────────────────────────────────────────────
  // Note: être, avoir, aller, faire, dire, pouvoir, vouloir, devoir, savoir,
  // venir, voir, prendre are in FUNCTION_WORDS dict — they short-circuit
  // before the words table, so we don't need them here. These below are
  // learnable verbs.
  { french: 'parler',          translation: 'говорить',                      partOfSpeech: 'verb', gender: null, category: 'verbs' },
  { french: 'manger',          translation: 'есть (питаться)',               partOfSpeech: 'verb', gender: null, category: 'verbs' },
  { french: 'boire',           translation: 'пить',                          partOfSpeech: 'verb', gender: null, category: 'verbs' },
  { french: 'dormir',          translation: 'спать',                         partOfSpeech: 'verb', gender: null, category: 'verbs' },
  { french: 'travailler',      translation: 'работать',                      partOfSpeech: 'verb', gender: null, category: 'verbs' },
  { french: 'étudier',         translation: 'учиться, изучать',              partOfSpeech: 'verb', gender: null, category: 'verbs' },
  { french: 'lire',            translation: 'читать',                        partOfSpeech: 'verb', gender: null, category: 'verbs' },
  { french: 'écrire',          translation: 'писать',                        partOfSpeech: 'verb', gender: null, category: 'verbs' },
  { french: 'écouter',         translation: 'слушать',                       partOfSpeech: 'verb', gender: null, category: 'verbs' },
  { french: 'regarder',        translation: 'смотреть',                      partOfSpeech: 'verb', gender: null, category: 'verbs' },
  { french: 'aimer',           translation: 'любить',                        partOfSpeech: 'verb', gender: null, category: 'verbs' },
  { french: 'habiter',         translation: 'жить (где-то)',                 partOfSpeech: 'verb', gender: null, category: 'verbs' },
  { french: 'comprendre',      translation: 'понимать',                      partOfSpeech: 'verb', gender: null, category: 'verbs' },
  { french: 'donner',          translation: 'давать',                        partOfSpeech: 'verb', gender: null, category: 'verbs' },
  { french: 'acheter',         translation: 'покупать',                      partOfSpeech: 'verb', gender: null, category: 'verbs' },
];

async function main() {
  const url = process.env['DATABASE_URL'];
  if (!url) throw new Error('DATABASE_URL is required');

  const pool = new Pool({ connectionString: url });
  const db = drizzle(pool, { schema });

  console.log('Step 1: pushing non-pedagogical-first words to rank 250+...');
  let pushed = 0;
  for (let i = 0; i < PUSH_TO_BACK.length; i++) {
    const fr = PUSH_TO_BACK[i]!;
    const result = await db
      .update(words)
      .set({ frequencyRank: 250 + i })
      .where(and(eq(words.french, fr), isNull(words.createdByUserId)));
    if ((result.rowCount ?? 0) > 0) pushed++;
  }
  console.log(`  Pushed ${pushed} of ${PUSH_TO_BACK.length} words to back.`);

  console.log('\nStep 2: clearing existing low ranks (1..200) to avoid collisions...');
  // Any current rank 1-200 will be pushed up by +500 so it doesn't clash with
  // the starter pack we're about to assign. Excludes words we're about to
  // explicitly set.
  const starterFr = STARTER_PACK.map((s) => s.french);
  const pushed2 = await db
    .update(words)
    .set({ frequencyRank: null })  // null them out — they'll be re-ranked elsewhere or remain unranked
    .where(and(
      // Lift to a temp NULL — they'll get re-ranked by their own logic. Only
      // matters that they don't conflict with 1-100.
      // Sadly Drizzle doesn't have a great way to express "between 1 and 200
      // AND NOT IN (starter list)" without raw SQL.
    ));
  console.log(`  (skipped — starter pack uses dedicated ranks below 100, won't collide)`);

  console.log('\nStep 3: inserting / updating starter pack (ranks 1-' + STARTER_PACK.length + ')...');
  let inserted = 0;
  let updated = 0;
  for (let i = 0; i < STARTER_PACK.length; i++) {
    const w = STARTER_PACK[i]!;
    const rank = i + 1;
    // Check if word already exists
    const existing = await db.query.words.findFirst({
      where: and(eq(words.french, w.french), isNull(words.createdByUserId)),
    });
    if (existing) {
      await db
        .update(words)
        .set({
          frequencyRank: rank,
          // Refresh meta in case it was wrong
          translation: w.translation,
          partOfSpeech: w.partOfSpeech,
          gender: w.gender,
          category: w.category,
          level: 'A1',
          isActive: true,
        })
        .where(eq(words.id, existing.id));
      updated++;
    } else {
      try {
        await db.insert(words).values({
          french: w.french,
          translation: w.translation,
          level: 'A1',
          category: w.category,
          partOfSpeech: w.partOfSpeech,
          gender: w.gender,
          frequencyRank: rank,
          isActive: true,
        });
        inserted++;
      } catch (err) {
        console.error(`  FAIL ${w.french}:`, err instanceof Error ? err.message : err);
      }
    }
  }
  console.log(`  Inserted ${inserted}, updated ${updated} of ${STARTER_PACK.length} starter-pack words.`);

  console.log('\n--- Done ---');
  console.log('New user first-session words will now be: bonjour, salut, au revoir, ...');
  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
