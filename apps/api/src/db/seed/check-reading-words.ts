/**
 * Scans all reading texts, finds words missing from the function-word dict AND
 * from the `words` DB table, then prints a seed-ready array of missing entries.
 *
 * Run:
 *   $env:DATABASE_URL = (railway variables --json | ConvertFrom-Json).DATABASE_PUBLIC_URL
 *   npx tsx src/db/seed/check-reading-words.ts
 */
import 'dotenv/config';
import { eq, ilike, or } from 'drizzle-orm';
import { db } from '../index.js';
import { words } from '../schema/index.js';
import { readingTextsData } from './reading.js';

// ── Replicate the function-word dict from reading.service.ts ─────────────────
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
      result.add(clean);
    }
  }
  return result;
}

async function main() {

  // Collect all unique words across all reading texts
  const allWords = new Set<string>();
  for (const text of readingTextsData) {
    for (const w of extractWords(text.contentFr)) {
      allWords.add(w);
    }
  }

  console.log(`Total unique tokens in reading texts: ${allWords.size}`);

  // Filter out words already covered by function-word dict
  const needsCheck = [...allWords].filter(w => !FUNCTION_WORDS.has(w));
  console.log(`After removing function words: ${needsCheck.length} to check in DB\n`);

  // Check each against DB (exact + ilike)
  const missing: string[] = [];
  for (const w of needsCheck.sort()) {
    const found = await db.select({ id: words.id }).from(words)
      .where(or(eq(words.french, w), ilike(words.french, w)))
      .limit(1);
    if (found.length === 0) {
      missing.push(w);
    }
  }

  console.log(`\n=== MISSING (${missing.length} words not in DB) ===`);
  for (const w of missing) {
    console.log(w);
  }
}

main().catch(console.error);
