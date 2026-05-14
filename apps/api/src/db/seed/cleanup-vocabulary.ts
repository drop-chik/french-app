// Cleanup pass over the words table:
//   1. Fix known POS mis-taggings (verbs/adjectives marked as 'noun').
//   2. Move expressions disguised as nouns (bienvenue, félicitations) to
//      partOfSpeech='expression'.
//   3. Disable proper-noun entries (names from reading texts — Lucas, Emma,
//      ...) so they no longer show up in the dictionary or learning sessions.
//      They stay in the table so reading-text translation popups can still
//      resolve them.
//   4. Re-apply the category rule (POS-based for non-nouns, thematic for
//      nouns) to anything we just touched.
//
// Idempotent — safe to re-run.
import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import { words } from '../schema/index.js';
import * as schema from '../schema/index.js';
import { eq, and, inArray, isNull } from 'drizzle-orm';

const { Pool } = pg;

// Words wrongly tagged as 'noun' that are actually verbs.
const SHOULD_BE_VERB = [
  'répondre', 'se promener', 'se reposer', 'se laver', 'se lever',
  'se coucher', 'se réveiller', 's\'habiller', 's\'asseoir', 's\'appeler',
  'se souvenir', 'se rappeler', 'se sentir', 'se trouver', 's\'amuser',
  's\'arrêter', 'se dépêcher', 'se marier', 'se rencontrer',
];

// Words wrongly tagged as 'noun' that are actually adjectives.
const SHOULD_BE_ADJECTIVE = [
  'chaud', 'froid', 'doux', 'dur', 'mou', 'sec', 'humide',
  'plein', 'vide', 'propre', 'sale', 'cher', 'gratuit',
  'rapide', 'lent', 'facile', 'difficile', 'simple', 'compliqué',
];

// Words wrongly tagged as 'noun' that are actually expressions / greetings.
const SHOULD_BE_EXPRESSION = [
  'bienvenue', 'félicitations', 'bonne chance', 'bon courage',
  'bon appétit', 'à votre santé',
];

// Specific noun remappings — words that ended up in 'vocabulary' but clearly
// belong in a thematic noun category. Applied AFTER the broad
// recategorization, so they survive when we re-run the rule pass.
const NOUN_REMAP: Record<string, string> = {
  // Education
  'classe':    'education',
  'élève':     'education',
  'étudiant':  'education',
  'professeur': 'education',
  'cours':     'education',
  'devoir':    'education',
  // Travel
  'voiture':   'travel',
  'train':     'travel',
  'avion':     'travel',
  'bus':       'travel',
  'métro':     'travel',
  'taxi':      'travel',
  // Time
  'week-end':  'time',
  'week-ends': 'time',
  'an':        'time',
  'année':     'time',
  // Arts / media
  'film':      'arts',
  'livre':     'arts',
  'musique':   'arts',
  'théâtre':   'arts',
  // City
  'ville':     'city',
  'rue':       'city',
  'place':     'city',
  // Geography
  'pays':      'geography',
  'région':    'geography',
  'frontière': 'geography',
  // Family — forms of address
  'madame':    'family',
  'monsieur':  'family',
  'mademoiselle': 'family',
};

// Proper-noun entries that were added for reading-text resolution. They
// shouldn't appear in the learning UI — set isActive = false.
const NAMES_TO_DEACTIVATE = [
  // People — first names
  'lucas', 'emma', 'tom', 'hugo', 'camille', 'victor', 'sophie', 'léa',
  'julien', 'lucie', 'anna', 'marie', 'paul', 'jean-luc', 'jack',
  'agnès', 'alain', 'auguste', 'bernard', 'henri', 'olivier', 'françois',
  // People — surnames / single-name famous figures
  'dupont', 'dupuis', 'lambert', 'lang', 'godard', 'truffaut', 'varda',
  'thunberg', 'greta', 'banksy', 'invader', 'ducasse', 'roellinger',
  'khaznadar', 'edwige',
  // Brands and companies
  'airbnb', 'blablacar', 'google', 'instagram', 'netflix', 'siri',
  'snapchat', 'tiktok', 'uber', 'vinted', 'volkswagen',
  // Foreign tokens (English borrowings used in articles)
  'new', 'tech', 'shame', 'flight', 'rainforest', 'act', 'b1', 'ia',
];

// Thematic category targets that should NOT be re-set to 'vocabulary'.
// Mirrors the recategorize-words.ts whitelist.
const NOUN_THEMATIC = new Set([
  'family', 'body', 'health', 'emotions',
  'food', 'home', 'clothes', 'shopping',
  'city', 'travel', 'nature', 'weather', 'animals', 'geography',
  'environment', 'sports', 'education', 'work', 'economy',
  'politics', 'law', 'society', 'arts', 'media',
  'technology', 'science', 'psychology',
  'time', 'calendar', 'vocabulary', 'names',
]);

function targetCategory(pos: string | null, currentCategory: string): string {
  const p = (pos ?? '').toLowerCase().trim();
  if (p === 'verb') return 'verbs';
  if (p === 'adjective' || p === 'adj') return 'adjectives';
  if (p === 'adverb') return 'adverbs';
  if (p === 'pronoun') return 'pronouns';
  if (p === 'preposition') return 'prepositions';
  if (p === 'conjunction') return 'conjunctions';
  if (p === 'determiner' || p === 'det' || p === 'article') return 'determiners';
  if (p === 'number') return 'numbers';
  if (p === 'expression' || p === 'phrase') return 'expressions';
  if (p === 'interjection') return 'interjections';
  if (p === 'particle') return 'adverbs';
  if (p === 'noun' || p === '') {
    if (NOUN_THEMATIC.has(currentCategory)) return currentCategory;
    return 'vocabulary';
  }
  return 'vocabulary';
}

async function main() {
  const url = process.env['DATABASE_URL'];
  if (!url) throw new Error('DATABASE_URL is required');
  const pool = new Pool({ connectionString: url });
  const db = drizzle(pool, { schema });

  console.log('Step 1: fix mis-tagged POS — verb...');
  let fixedVerbs = 0;
  for (const fr of SHOULD_BE_VERB) {
    const r = await db.update(words).set({ partOfSpeech: 'verb' })
      .where(and(eq(words.french, fr), isNull(words.createdByUserId)));
    if ((r.rowCount ?? 0) > 0) fixedVerbs += r.rowCount ?? 0;
  }
  console.log(`  Fixed ${fixedVerbs} words to verb.`);

  console.log('\nStep 2: fix mis-tagged POS — adjective...');
  let fixedAdj = 0;
  for (const fr of SHOULD_BE_ADJECTIVE) {
    const r = await db.update(words).set({ partOfSpeech: 'adjective' })
      .where(and(eq(words.french, fr), isNull(words.createdByUserId)));
    if ((r.rowCount ?? 0) > 0) fixedAdj += r.rowCount ?? 0;
  }
  console.log(`  Fixed ${fixedAdj} words to adjective.`);

  console.log('\nStep 3: fix mis-tagged POS — expression...');
  let fixedExp = 0;
  for (const fr of SHOULD_BE_EXPRESSION) {
    const r = await db.update(words).set({ partOfSpeech: 'expression' })
      .where(and(eq(words.french, fr), isNull(words.createdByUserId)));
    if ((r.rowCount ?? 0) > 0) fixedExp += r.rowCount ?? 0;
  }
  console.log(`  Fixed ${fixedExp} words to expression.`);

  console.log('\nStep 4: deactivate proper nouns...');
  const r4 = await db.update(words)
    .set({ isActive: false })
    .where(and(inArray(words.french, NAMES_TO_DEACTIVATE), isNull(words.createdByUserId)));
  console.log(`  Deactivated ${r4.rowCount ?? 0} proper-noun entries.`);

  console.log('\nStep 5: re-apply category rule to all words...');
  const all = await db.select({
    id: words.id,
    french: words.french,
    pos: words.partOfSpeech,
    category: words.category,
  }).from(words);

  let recat = 0;
  for (const w of all) {
    let next = targetCategory(w.pos, w.category);
    // Apply specific noun remap for known better fits.
    if ((w.pos === 'noun' || !w.pos) && next === 'vocabulary') {
      const remap = NOUN_REMAP[w.french.toLowerCase()];
      if (remap) next = remap;
    }
    if (next !== w.category) {
      await db.update(words).set({ category: next }).where(eq(words.id, w.id));
      recat++;
    }
  }
  console.log(`  Re-categorized ${recat} words.`);

  console.log('\n--- Done ---');
  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
