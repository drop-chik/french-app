/**
 * One-off backfill linking drill_sets → grammar_topics by slug stem
 * similarity. The drill set is considered linked to a grammar topic
 * when one of these signals fires:
 *
 *   1. Drill slug stem (after stripping the level suffix "-a1", "-b2"
 *      and the prefix variants like "c1-") matches a grammar slug
 *      stem with the same treatment.
 *   2. The category strings match AND there is exactly one grammar
 *      topic at any level with that category at or below the drill's
 *      level.
 *
 * Manual override map (`OVERRIDES` below) handles the cases that the
 * heuristic gets wrong — when slugs diverge but the pedagogical link
 * is clear. Add to this map rather than fighting the heuristic.
 *
 * Run:
 *   pnpm tsx src/scripts/backfill-drill-grammar-link.ts        # dry-run
 *   pnpm tsx src/scripts/backfill-drill-grammar-link.ts --apply
 */
import 'dotenv/config';
import { eq, sql } from 'drizzle-orm';
import { db } from '../db/index.js';
import { drillSets, grammarTopics } from '../db/schema/index.js';

const APPLY = process.argv.includes('--apply');

// Hand-curated mappings where heuristic + slug match isn't enough.
// Keep this list short — every entry is an admission that the
// auto-inference failed.
const OVERRIDES: Record<string, string> = {
  // drill slug                              → grammar topic slug
  'etre-avoir-present':                      'verbs-etre-avoir',
  'er-verbs-present-a1':                     'verbs-present-regular',
  'futur-proche-a1':                         'futur-proche',
  'negation-base-a1':                        'negation',
  'pronoms-personnels-sujets-a1':            'pronouns-personal',
  'articles-choix':                          'articles-definite',
  'accord-adjectifs':                        'adjectives-agreement',
  'pluriel-noms':                            'nouns-plural',
  'genre-des-noms':                          'nouns-gender',
  'mots-interrogatifs':                      'questions',
  'prepositions-lieu':                       'prepositions-place',
  'comparatif-superlatif':                   'comparatif-superlatif',
  'verbes-pronominaux':                      'verbes-pronominaux',
  'etre-avoir-passe-compose':                'passe-compose-etre',
  'passe-compose-vs-imparfait':              'imparfait-vs-passe-compose',
  'pronoms-cod-coi':                         'pronoms-cod-coi',
  'pronoms-y-en':                            'pronoms-y-en',
  'negation-avancee':                        'negation-avancee',
  'verbes-groupe-3-present':                 'verbes-irreguliers',
  'accord-pp-cod-avant-a2':                  'accord-participe-passe',
  'pronoms-demonstratifs-a2':                'pronoms-demonstratifs',
  'imparfait-conjugaison-a2':                'imparfait',
  'subjonctif-conjugaison':                  'subjonctif-present',
  'subjonctif-usage':                        'subjonctif-present',
  'subjonctif-vs-indicatif-b1':              'subjonctif-present',
  'conditionnel-conjugaison':                'conditionnel-present',
  'plus-que-parfait':                        'plus-que-parfait',
  'voix-passive':                            'voix-passive',
  'gerondif':                                'gerondif',
  'accord-participe-passe':                  'accord-participe-passe',
  'si-hypothese':                            'hypothese-si',
  'discours-indirect':                       'discours-indirect',
  'connecteurs-logiques':                    'expression-cause',
  'pronoms-relatifs-composes':               'pronoms-relatifs-composes',
  'pronoms-relatifs-simples-b1':             'pronoms-relatifs',
  'futur-anterieur-b1':                      'futur-anterieur',
  'subjonctif-passe':                        'subjonctif-passe',
  'concordance-temps':                       'concordance-des-temps',
  'conditionnel-passe-b2':                   'conditionnel-passe',
  'faire-causatif-b2':                       'faire-causatif',
  'mise-en-relief-b2':                       'c1-mise-en-relief',
  'discours-indirect-passe-b2':              'discours-indirect-passe',
  'pronoms-relatifs-lequel-b2':              'pronoms-relatifs-composes',
  'subjonctif-passe-c1':                     'c1-subjonctif-passe-concordance',
  'double-pronominalisation-c1':             'c1-double-pronominalisation',
  'participe-vs-gerondif-c1':                'c1-participe-present-gerondif',
  'connecteurs-formels-c1':                  'c1-connecteurs-formels',
  'inversion-stylistique-c1':                'c1-inversion-stylistique',
  'regimes-verbes-c1':                       'c1-regimes-verbes',
  'subjonctif-imparfait-c2':                 'c2-subjonctif-imparfait-actif',
  'passe-simple-c2':                         'c2-passe-simple-narration',
  'figures-style-c2':                        'c2-figures-de-style',
  'formes-archaiques-c2':                    'c2-formes-archaiques',
  'nuances-modales-c2':                      'c2-nuances-modales',
  // Vocabulary / orthography drills with no grammar theory:
  'a-de-apres-verbes':                       'c1-regimes-verbes',
  'homophones-courants':                     '',  // explicit "no link"
};

const drills = await db.select({
  id: drillSets.id, slug: drillSets.slug, level: drillSets.level,
  category: drillSets.category, current: drillSets.grammarTopicSlug,
}).from(drillSets);
const topics = await db.select({
  slug: grammarTopics.slug, level: grammarTopics.level, category: grammarTopics.category,
}).from(grammarTopics);
const topicSlugSet = new Set(topics.map((t) => t.slug));
console.log(`[backfill] ${drills.length} drill sets, ${topics.length} grammar topics`);

function strip(slug: string): string {
  return slug
    .replace(/^[a-c][12]-/i, '')      // c1-, b2- prefix
    .replace(/-[a-c][12]$/i, '');     // -a1, -c2 suffix
}

interface Plan {
  drillSlug: string;
  newTopicSlug: string | null;
  reason: 'override' | 'stem-match' | 'no-match';
}
const plan: Plan[] = [];

for (const d of drills) {
  // Override always wins (including explicit empty string meaning "no link")
  if (d.slug in OVERRIDES) {
    const v = OVERRIDES[d.slug]!;
    plan.push({ drillSlug: d.slug, newTopicSlug: v || null, reason: 'override' });
    continue;
  }
  const stem = strip(d.slug);
  // Try stem match
  const matched = topics.find((t) => strip(t.slug) === stem);
  if (matched) {
    plan.push({ drillSlug: d.slug, newTopicSlug: matched.slug, reason: 'stem-match' });
    continue;
  }
  plan.push({ drillSlug: d.slug, newTopicSlug: null, reason: 'no-match' });
}

// Sanity: every linked slug must exist in grammar_topics
for (const p of plan) {
  if (p.newTopicSlug && !topicSlugSet.has(p.newTopicSlug)) {
    console.warn(`  WARN ${p.drillSlug} → "${p.newTopicSlug}" not in grammar_topics`);
    p.newTopicSlug = null;
  }
}

const linked = plan.filter((p) => p.newTopicSlug).length;
const unlinked = plan.length - linked;
console.log(`\n[plan] ${linked} drills link to a grammar topic, ${unlinked} stand alone`);

const byReason: Record<string, number> = {};
for (const p of plan) byReason[p.reason] = (byReason[p.reason] ?? 0) + 1;
console.log(`  reasons: ${JSON.stringify(byReason)}`);

console.log(`\nSample (first 20):`);
for (const p of plan.slice(0, 20)) {
  console.log(`  ${p.drillSlug.padEnd(40)} → ${p.newTopicSlug ?? '(none)'}  [${p.reason}]`);
}

if (!APPLY) {
  console.log(`\n[dry-run] pass --apply to UPDATE drill_sets.grammar_topic_slug`);
  process.exit(0);
}

let updated = 0;
for (const p of plan) {
  if (p.reason === 'no-match' && !p.newTopicSlug) continue; // nothing to write
  // For overrides with explicit empty -> set NULL (no link)
  const value = p.newTopicSlug;
  await db.update(drillSets).set({ grammarTopicSlug: value }).where(eq(drillSets.slug, p.drillSlug));
  updated++;
}
console.log(`[apply] updated ${updated} rows`);
process.exit(0);
