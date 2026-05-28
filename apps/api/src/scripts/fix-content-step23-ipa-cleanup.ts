/**
 * Steps 2 + 3 of the content remediation plan.
 *
 * Pure regex cleanup of the IPA column — no AI, no external lookups,
 * idempotent. Three defects collapsed into one pass because they all
 * operate on the same column:
 *
 *   2a. Article phoneme prefix: 'lə pɔst', 'la vak.si.na.sjɔ̃',
 *       'lopital' etc. should be just the bare-word IPA. We strip
 *       a leading 'lə '/'la '/'le '/'lo' when the `french` column
 *       confirms the word starts with le/la/l'/les.
 *
 *   2b. Stress mark ˈ: French is syllable-timed, no lexical stress.
 *       Strip all ˈ.
 *
 *   2c. Duplicated leading token: 'de deˈsɛʁ', 'se se.pa.ʁe' —
 *       the generator emitted the first orthographic syllable
 *       twice. If IPA matches /^(\S+) \1[. ]/ collapse to the
 *       single occurrence.
 *
 * Each row is updated only when the cleaned IPA actually changes.
 * Reports a per-pattern count at the end.
 *
 * Run:
 *   $env:DATABASE_URL = (railway variables --service french-app --json | ConvertFrom-Json).DATABASE_URL
 *   pnpm tsx src/scripts/fix-content-step23-ipa-cleanup.ts
 */
import 'dotenv/config';
import { eq } from 'drizzle-orm';
import { db } from '../db/index.js';
import { words } from '../db/schema/index.js';

const rows = await db.select({
  id: words.id,
  french: words.french,
  ipa: words.ipa,
}).from(words);

let stripped_article = 0;
let stripped_stress = 0;
let stripped_dup = 0;
let updated = 0;
const examples: Array<{ french: string; before: string; after: string; reasons: string[] }> = [];

for (const r of rows) {
  if (!r.ipa) continue;
  let ipa = r.ipa;
  const reasons: string[] = [];
  const original = ipa;

  // 2c. Duplicated leading token — run first so the dup doesn't survive
  // an article strip that only catches one of the two copies.
  // Pattern: 'X X...' where X is a contiguous run of IPA-ish chars.
  const dupMatch = ipa.match(/^([a-zəøœɛɑ̃ʁ]+) \1([. ]|$)/);
  if (dupMatch) {
    ipa = ipa.slice(dupMatch[1]!.length + 1);  // strip 'X ' once
    reasons.push('dup');
    stripped_dup++;
  }

  // 2a. Article phoneme prefix — only strip if the `french` column
  // confirms there's an article to drop. Conservative: skip if the
  // french column has no article (then the IPA might legitimately
  // contain similar phonemes that aren't actually an article).
  const fr = (r.french ?? '').toLowerCase();
  const hasFrenchArticle = /^(le |la |l'|les |un |une |des )/.test(fr);
  if (hasFrenchArticle) {
    // Match a leading article-phoneme followed by space (sometimes followed
    // by liaison char ‿).
    const articleRegex = /^(l[əa]|le|la|lez|œ̃|yn|de)\s+/;
    const m = ipa.match(articleRegex);
    if (m) {
      ipa = ipa.slice(m[0].length);
      reasons.push('article');
      stripped_article++;
    }
  }

  // 2b. Stress marks ˈ — strip everywhere.
  if (/ˈ/.test(ipa)) {
    ipa = ipa.replace(/ˈ/g, '');
    reasons.push('stress');
    stripped_stress++;
  }

  // Clean up incidental double spaces / leading-trailing whitespace.
  ipa = ipa.replace(/\s{2,}/g, ' ').trim();

  if (ipa !== original) {
    await db.update(words).set({ ipa }).where(eq(words.id, r.id));
    updated++;
    if (examples.length < 12) {
      examples.push({ french: r.french, before: original, after: ipa, reasons });
    }
  }
}

console.log(`\n[step2+3] rows scanned: ${rows.length}`);
console.log(`[step2+3] rows updated: ${updated}`);
console.log(`  - stripped article prefix: ${stripped_article}`);
console.log(`  - stripped stress mark:    ${stripped_stress}`);
console.log(`  - stripped duplicated tok: ${stripped_dup}`);

console.log('\n[step2+3] sample of cleaned rows:');
for (const e of examples) {
  console.log(`  ${e.french.padEnd(22)} '${e.before}' → '${e.after}'  [${e.reasons.join(', ')}]`);
}

process.exit(0);
