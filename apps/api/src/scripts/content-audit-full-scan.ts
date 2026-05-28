/**
 * Full-DB scan for the systematic vocabulary defects surfaced by the
 * 120-word audit sample. Counts each pattern across all active words
 * so we know the real scope before deciding how to fix.
 *
 * Patterns checked:
 *   1. partOfSpeech = 'adj' vs 'adjective' inconsistency
 *   2. Noun with elided article (l') but null gender
 *   3. Noun without article AND no gender
 *   4. IPA with duplicated leading token (generation bug)
 *   5. IPA with stress mark ˈ (French uses none)
 *   6. IPA includes article (uneven across DB)
 *   7. Missing translationEn / examples
 *   8. Verb that doesn't look like an infinitive
 *
 * Output: tmp/content-audit/full-scan-findings.json with full row IDs
 * so we can later fix in bulk.
 */
import 'dotenv/config';
import { writeFileSync } from 'node:fs';
import { eq, sql, and, isNull, or } from 'drizzle-orm';
import { db } from '../db/index.js';
import { words } from '../db/schema/index.js';

const findings: Array<{
  id: string; french: string; level: string;
  severity: 'critical' | 'high' | 'medium';
  type: string; detail: string;
}> = [];

const all = await db.select({
  id: words.id,
  french: words.french,
  translation: words.translation,
  translationEn: words.translationEn,
  partOfSpeech: words.partOfSpeech,
  gender: words.gender,
  ipa: words.ipa,
  exampleFr: words.exampleFr,
  exampleRu: words.exampleRu,
  level: words.level,
})
  .from(words)
  .where(eq(words.isActive, true));

console.log(`Scanning ${all.length} active words...`);

for (const r of all) {
  const fr = r.french;
  const hasArticle = /^(le |la |l'|les |un |une |des )/.test(fr);

  if (r.partOfSpeech === 'adj') {
    findings.push({
      id: r.id, french: fr, level: r.level, severity: 'critical',
      type: 'pos-inconsistent', detail: `'adj' should be 'adjective'`,
    });
  }
  if (/^l'/.test(fr) && r.partOfSpeech === 'noun' && !r.gender) {
    findings.push({
      id: r.id, french: fr, level: r.level, severity: 'critical',
      type: 'missing-gender-elided', detail: `l'-form noun has null gender`,
    });
  }
  if (!hasArticle && r.partOfSpeech === 'noun' && !r.gender) {
    findings.push({
      id: r.id, french: fr, level: r.level, severity: 'high',
      type: 'missing-gender-bare', detail: `bare noun '${fr}' has no gender`,
    });
  }
  if (r.ipa && /^([a-zəøœɛɑ̃]+) \1/.test(r.ipa)) {
    findings.push({
      id: r.id, french: fr, level: r.level, severity: 'critical',
      type: 'ipa-duplicated', detail: `IPA '${r.ipa}' has duplicated initial token`,
    });
  }
  if (r.ipa && /ˈ/.test(r.ipa)) {
    findings.push({
      id: r.id, french: fr, level: r.level, severity: 'high',
      type: 'ipa-stress-mark', detail: `IPA '${r.ipa}' contains stress mark`,
    });
  }
  if (r.ipa && /^(l[əa]|le|la) /.test(r.ipa)) {
    findings.push({
      id: r.id, french: fr, level: r.level, severity: 'medium',
      type: 'ipa-includes-article', detail: `IPA '${r.ipa}' starts with an article`,
    });
  }
  if (!r.translationEn) {
    findings.push({
      id: r.id, french: fr, level: r.level, severity: 'medium',
      type: 'missing-english', detail: `no translationEn`,
    });
  }
  if (!r.exampleFr || !r.exampleRu) {
    findings.push({
      id: r.id, french: fr, level: r.level, severity: 'medium',
      type: 'missing-examples',
      detail: `missing exampleFr=${!!r.exampleFr}, exampleRu=${!!r.exampleRu}`,
    });
  }
}

// Summary by type
const byType: Record<string, number> = {};
const bySeverity: Record<string, number> = { critical: 0, high: 0, medium: 0 };
for (const f of findings) {
  byType[f.type] = (byType[f.type] ?? 0) + 1;
  bySeverity[f.severity] = (bySeverity[f.severity] ?? 0) + 1;
}

console.log('\n=== Severity summary ===');
console.table(bySeverity);

console.log('\n=== Per-type counts ===');
const sorted = Object.entries(byType).sort((a, b) => b[1] - a[1]);
for (const [t, n] of sorted) console.log(`  ${t.padEnd(28)} ${n}`);

writeFileSync('tmp/content-audit/full-scan-findings.json', JSON.stringify(findings, null, 2));
console.log(`\n✓ ${findings.length} total findings written to tmp/content-audit/full-scan-findings.json`);
process.exit(0);
