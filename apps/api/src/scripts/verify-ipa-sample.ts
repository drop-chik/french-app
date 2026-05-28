/**
 * Spot-check the regenerated IPA against Wiktionary. Pulls 20 random
 * active words and prints them in a format easy to paste into a Wiktionary
 * cross-check (manual or via WebFetch in a Claude session).
 *
 * Run after fix-content-step5-ipa-regen.ts to confirm the new prompt
 * actually produces correct IPA.
 *
 * Run:
 *   $env:DATABASE_URL = (railway variables --service french-app --json | ConvertFrom-Json).DATABASE_URL
 *   pnpm tsx src/scripts/verify-ipa-sample.ts
 */
import 'dotenv/config';
import { sql, eq } from 'drizzle-orm';
import { db } from '../db/index.js';
import { words } from '../db/schema/index.js';

const sample = await db.select({
  french: words.french, ipa: words.ipa, level: words.level,
})
  .from(words)
  .where(eq(words.isActive, true))
  .orderBy(sql`RANDOM()`)
  .limit(20);

console.log('\n=== IPA Verification Sample (20 random words) ===\n');
console.log('Compare each against https://en.wiktionary.org/wiki/<word>\n');
for (const r of sample) {
  // Strip article from french for URL lookup
  const lookupWord = r.french.replace(/^(le |la |l'|les |un |une |des )/i, '').toLowerCase();
  const encoded = encodeURIComponent(lookupWord);
  console.log(`  ${r.level} ${r.french.padEnd(28)} '${r.ipa}'`);
  console.log(`         https://en.wiktionary.org/wiki/${encoded}`);
}
process.exit(0);
