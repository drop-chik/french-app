// One-off migration: re-categorize every word so that:
//
//   - words that are NOT nouns go into a single category per part-of-speech
//     (verbs, adjectives, adverbs, pronouns, prepositions, conjunctions,
//      determiners, numbers, expressions, interjections)
//
//   - only NOUNS keep / get a thematic category (family, food, home,
//     body, animals, geography, environment, sports, etc.)
//
// The previous schema had categories like 'basics' that mixed greetings,
// question words and base nouns; or 'colors' that contained mostly
// adjectives. After this script the Dictionary page's group-by-category
// is clean: clicking 'Verbs' shows ONLY verbs, clicking 'Family' shows
// only nouns from the family domain.
//
// Idempotent — safe to re-run.
import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import { words } from '../schema/index.js';
import * as schema from '../schema/index.js';
import { eq } from 'drizzle-orm';

const { Pool } = pg;

// Thematic categories that nouns are allowed to use. Anything outside
// this set, when applied to a noun, is normalised to 'vocabulary'.
const NOUN_THEMATIC = new Set([
  'family', 'body', 'health', 'emotions',
  'food', 'home', 'clothes', 'shopping',
  'city', 'travel', 'nature', 'weather', 'animals', 'geography',
  'environment', 'sports', 'education', 'work', 'economy',
  'politics', 'law', 'society', 'arts', 'media',
  'technology', 'science', 'psychology',
  'time', 'calendar',
  'vocabulary',  // generic fallback
]);

// Some legacy 'basics' nouns belong in time/calendar/family — map known
// French words to their proper thematic category. Anything not in the
// map falls back to 'vocabulary'.
const BASICS_NOUN_REMAP: Record<string, string> = {
  // time-related nouns historically in 'basics'
  'jour':    'time',
  'matin':   'time',
  'soir':    'time',
  'nuit':    'time',
  'heure':   'time',
  'minute':  'time',
  'semaine': 'time',
  'mois':    'time',
  'année':   'time',
  'temps':   'time',
  // family-ish nouns sometimes in basics
  'monsieur': 'family',
  'madame':   'family',
};

function targetCategory(pos: string | null, currentCategory: string, french: string): string {
  const p = (pos ?? '').toLowerCase().trim();

  // Non-noun parts of speech → single category per POS
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
  if (p === 'particle') return 'adverbs';  // merge — particles are adverb-like

  // Nouns: keep the existing thematic category if valid; otherwise remap
  if (p === 'noun' || p === '') {
    if (NOUN_THEMATIC.has(currentCategory)) return currentCategory;
    // Legacy 'basics' nouns: map to proper theme if known, else 'vocabulary'
    if (currentCategory === 'basics') {
      return BASICS_NOUN_REMAP[french.toLowerCase()] ?? 'vocabulary';
    }
    // 'colors' as noun ('le rouge' etc.) is rare — bucket into 'vocabulary'
    if (currentCategory === 'colors') return 'vocabulary';
    // Any other non-thematic value: fall back
    return 'vocabulary';
  }

  // Unknown POS — leave well alone (or fallback to vocabulary)
  return 'vocabulary';
}

async function main() {
  const url = process.env['DATABASE_URL'];
  if (!url) throw new Error('DATABASE_URL is required');
  const pool = new Pool({ connectionString: url });
  const db = drizzle(pool, { schema });

  console.log('Fetching all words...');
  const all = await db.select({
    id: words.id,
    french: words.french,
    pos: words.partOfSpeech,
    category: words.category,
  }).from(words);

  console.log(`  ${all.length} words.\n`);

  const counts = new Map<string, number>();
  let updated = 0;
  let unchanged = 0;

  for (const w of all) {
    const next = targetCategory(w.pos, w.category, w.french);
    counts.set(next, (counts.get(next) ?? 0) + 1);
    if (next !== w.category) {
      await db.update(words).set({ category: next }).where(eq(words.id, w.id));
      updated++;
    } else {
      unchanged++;
    }
  }

  console.log(`\nUpdated: ${updated}, unchanged: ${unchanged}.`);
  console.log('\n--- New category distribution ---');
  const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1]);
  for (const [cat, n] of sorted) {
    console.log(`${cat.padEnd(15)} | ${n}`);
  }

  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
