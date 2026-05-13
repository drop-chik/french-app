/**
 * Audit reading-text vocabulary coverage.
 *
 * For every word that appears in any reading text, simulate the FULL lookup
 * chain the frontend uses:
 *   1. text wordMap (per-text curated dict)
 *   2. inline FUNCTION_WORDS dict (the reading service's hard-coded common words)
 *   3. words DB — exact match
 *   4. words DB — ilike (case/accent fold)
 *   5. words DB — strip leading article
 *   6. verb lemmatization via tryVerbStem
 *   7. noun/adjective lemmatization via tryNounStem
 *
 * Anything still missing is what the user sees as "перевода нет" in the UI.
 * Output is grouped by level + writing type, sorted by frequency.
 *
 * Run:
 *   $env:DATABASE_URL = "<postgres URL>"
 *   npx tsx src/db/seed/check-reading-words.ts > missing.txt
 */
import 'dotenv/config';
import { eq, ilike, or } from 'drizzle-orm';
import { db } from '../index.js';
import { words } from '../schema/index.js';
import { readingTextsData } from './reading.js';
import { tryVerbStem, tryNounStem } from '../../modules/reading/reading.service.js';

// Replicates FUNCTION_WORDS from reading.service.ts. Keep in sync if the
// service's dict gains new entries — drift means the audit will report
// false positives.
const FUNCTION_WORDS = new Set([
  'être','suis','es','est','sommes','êtes','sont','étais','était','étions','étiez','étaient',
  'serai','seras','sera','serons','serez','seront','soit','soient','étant','été',
  'avoir','ai','a','avons','avez','ont','avais','avait','avions','aviez','avaient',
  'aurai','aura','auront','eu',
  'aller','vais','vas','va','allons','allez','vont','allait','allaient','ira','iront',
  'faire','fais','fait','faisons','faites','font','faisait','fera','feront',
  'dire','dis','dit','disons','dites','disent','disait',
  'pouvoir','peux','peut','pouvons','pouvez','peuvent','pouvait','pourra','pourront',
  'vouloir','veux','veut','voulons','voulez','veulent','voulait',
  'devoir','dois','doit','devons','devez','doivent','devait','devra',
  'savoir','sais','sait','savons','savez','savent','savait',
  'venir','viens','vient','venons','venez','viennent','venait','viendra',
  'voir','vois','voit','voyons','voyez','voient','voyait','vu',
  'prendre','prends','prend','prenons','prenez','prennent','prenait','pris',
  'le','la','les','un','une','des','du',
  'de','à','au','aux','en','dans','sur','sous','par','pour','avec','sans','vers',
  'entre','chez','avant','après','depuis','pendant','contre','malgré','selon','grâce','afin',
  'je','tu','il','elle','nous','vous','ils','elles','me','te','se','lui','leur','y',
  'on','ça','cela','ceci','qui','que','qu','quoi','dont','où',
  'et','ou','mais','donc','car','ni','si','or','quand','comme','lorsque','puisque',
  'pourtant','cependant','néanmoins','parce',
  'ne','pas','plus','très','aussi','encore','déjà','toujours','jamais','souvent',
  'parfois','peu','beaucoup','assez','trop','tout','bien','mal','ici','là',
  'maintenant','enfin','seulement','ainsi','alors','même','non','oui',
  'notamment','plutôt','environ','surtout','vraiment','autrement','davantage',
  'ce','cet','cette','ces',
  'mon','ma','mes','ton','ta','tes','son','sa','ses','notre','nos','votre','vos','leurs',
]);

function cleanWord(token: string): string {
  return token
    .toLowerCase()
    .replace(/^[«»""''.,!?;:()[\]—–\-]+/, '')
    .replace(/[«»""''.,!?;:()[\]—–\-]+$/, '')
    .replace(/^qu'/i, '')
    .replace(/^[lLdD]'/, '')
    .replace(/^[mM]'/, '')
    .replace(/^[sS]'/, '')
    .replace(/^[nN]'/, '')
    .replace(/^[jJ]'/, '')
    .replace(/^[cC]'/, '');
}

const SKIP = /^[\d\s.,!?;:()\[\]«»""''—–\-]+$/;

function extractWords(text: string): Set<string> {
  const result = new Set<string>();
  for (const line of text.split('\n')) {
    for (const token of line.split(/(\s+)/)) {
      if (/^\s+$/.test(token)) continue;
      if (SKIP.test(token)) continue;
      const clean = cleanWord(token);
      if (!clean || clean.length < 2) continue;
      // Skip tokens that look like a proper noun the wordMap or text writer
      // probably already covers (capitalized in source but lowercased here is
      // unreliable — instead skip very short tokens and digits-only).
      if (/^\d+$/.test(clean)) continue;
      result.add(clean);
    }
  }
  return result;
}

// Mirrors the translateWord chain. Returns true if a translation would
// be found by ANY step in the lookup.
async function isResolvable(
  word: string,
  textWordMap: Record<string, unknown>,
): Promise<boolean> {
  // 1. text wordMap (per-text)
  if (word in textWordMap) return true;

  // 2. function words
  if (FUNCTION_WORDS.has(word)) return true;

  // 3+4. exact / ilike on the words table
  let match = await db.query.words.findFirst({
    where: or(eq(words.french, word), ilike(words.french, word)),
  });
  if (match) return true;

  // 5. strip leading article
  const stripped = word.replace(/^(?:le|la|les|l'|un|une|des|du|de la)\s+/i, '');
  if (stripped !== word) {
    match = await db.query.words.findFirst({
      where: or(eq(words.french, stripped), ilike(words.french, stripped)),
    });
    if (match) return true;
  }

  // 6. verb lemmatization
  for (const candidate of tryVerbStem(word)) {
    match = await db.query.words.findFirst({
      where: or(eq(words.french, candidate), ilike(words.french, candidate)),
    });
    if (match) return true;
  }

  // 7. noun / adjective lemmatization
  for (const candidate of tryNounStem(word)) {
    match = await db.query.words.findFirst({
      where: or(eq(words.french, candidate), ilike(words.french, candidate)),
    });
    if (match) return true;
  }

  return false;
}

async function main() {
  // Build per-word stats: how many texts use it, at which levels.
  const wordTexts = new Map<string, { levels: Set<string>; count: number; sampleSlug: string }>();
  const textWordMaps = new Map<string, Record<string, unknown>>();

  for (const text of readingTextsData) {
    textWordMaps.set(text.slug, text.wordMap as Record<string, unknown>);
    const tokens = extractWords(text.contentFr);
    for (const w of tokens) {
      let stat = wordTexts.get(w);
      if (!stat) {
        stat = { levels: new Set(), count: 0, sampleSlug: text.slug };
        wordTexts.set(w, stat);
      }
      stat.levels.add(text.level);
      stat.count += 1;
    }
  }

  const allWords = [...wordTexts.keys()].sort();
  console.error(`Scanning ${allWords.length} unique tokens across ${readingTextsData.length} texts...`);

  // Check each word against the union of its texts' wordMaps + DB chain.
  // A word is "covered" if at least the text it appears in has it in its
  // wordMap, OR if the DB chain can resolve it.
  const missing: Array<{
    word: string;
    count: number;
    levels: string[];
    sampleSlug: string;
  }> = [];

  let checked = 0;
  for (const word of allWords) {
    checked += 1;
    if (checked % 100 === 0) console.error(`  ${checked}/${allWords.length}`);

    const stat = wordTexts.get(word)!;
    // Union of wordMaps across ALL texts that contain this word — if ANY
    // text covers it locally, treat as covered (frontend would resolve via
    // the per-text map). For words used in multiple texts, this is generous;
    // user might still hit a "no translation" in a text whose wordMap lacks
    // the word but whose siblings cover it. We still need a DB fallback.
    // To detect those reliably, we check DB only.
    let covered = false;
    for (const text of readingTextsData) {
      if (text.contentFr.toLowerCase().includes(word)) {
        const map = textWordMaps.get(text.slug)!;
        if (word in map) {
          covered = true;
          break;
        }
      }
    }
    if (!covered) {
      // No text covers it in its wordMap — must rely on DB chain
      const resolvable = await isResolvable(word, {});
      if (!resolvable) {
        missing.push({
          word,
          count: stat.count,
          levels: [...stat.levels].sort(),
          sampleSlug: stat.sampleSlug,
        });
      }
    }
  }

  missing.sort((a, b) => b.count - a.count || a.word.localeCompare(b.word));

  console.error(`\n=== ${missing.length} words missing from BOTH wordMap and DB ===\n`);

  // Output as TSV: word, count, levels, sample-slug — easy to import
  console.log('# word\tcount\tlevels\tsample_slug');
  for (const m of missing) {
    console.log(`${m.word}\t${m.count}\t${m.levels.join(',')}\t${m.sampleSlug}`);
  }
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
