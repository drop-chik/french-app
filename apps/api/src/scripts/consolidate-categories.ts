/**
 * Consolidate the ~91 messy raw-slug categories (Feelings-basic,
 * Food-cuisine-extended, Health-basic, School-classroom, Politique-
 * institutions, sciences-medecine, transport-extended-b1 …) into the ~30
 * canonical themes the Dictionary "По темам" grid knows (emoji + i18n label).
 *
 * These categories have meaningful names, so the mapping is deterministic — no
 * LLM, no cost, no misclassification. Generic/grammatical buckets (academic,
 * idioms, connectors, nuanced synonyms, abstract concepts) fold into the
 * 'vocabulary' bucket. POS-named categories (verbs/adjectives/…) are left
 * alone — they're already hidden from the thematic grid and live in the POS
 * view.
 *
 * Backs up (id, old category) to consolidate-backup.json before writing.
 *
 * Run:
 *   $env:DATABASE_URL = (railway variables --json | ConvertFrom-Json).DATABASE_PUBLIC_URL
 *   cd apps/api
 *   npx tsx src/scripts/consolidate-categories.ts            # report only
 *   npx tsx src/scripts/consolidate-categories.ts --apply
 */
import 'dotenv/config';
import { writeFileSync } from 'node:fs';
import { sql } from 'drizzle-orm';
import { db } from '../db/index.js';
import { words } from '../db/schema/index.js';

const APPLY = process.argv.includes('--apply');
function rows(r: unknown): any[] { return (r as { rows?: any[] }).rows ?? (r as any[]); }

// messy slug → canonical theme. Every value is a theme with emoji + i18n label.
const MAP: Record<string, string> = {
  'abstract-basic': 'vocabulary', 'abstract_concepts': 'vocabulary',
  'academic': 'education', 'adjectives-character': 'psychology',
  'adjectives-quality': 'vocabulary', 'animals-common': 'animals',
  'art-culture-intro': 'arts', 'arts_criticism': 'arts', 'basic-verbs': 'vocabulary',
  'beacco': 'vocabulary', 'beacco-c2': 'vocabulary', 'body-parts': 'body',
  'city-places': 'city', 'clothing-everyday': 'clothes', 'colors-shades': 'colors',
  'commerce-international': 'economy', 'communication-styles': 'society',
  'community-civic': 'politics', 'connectors_formal': 'vocabulary',
  'culture-cinema-extended': 'media', 'culture-litterature': 'arts',
  'daily-routines': 'home', 'economie-entreprise': 'economy', 'economie-macro': 'economy',
  'economy_finance_advanced': 'economy', 'education-extended': 'education',
  'emotions_advanced': 'emotions', 'emotions-extended': 'emotions',
  'environment-basic': 'environment', 'environnement-biodiversite': 'environment',
  'environnement-climat': 'environment', 'environnement-pollution': 'environment',
  'expressions-frequence': 'time', 'family-extended': 'family',
  'family-life-events': 'family', 'feelings-basic': 'emotions', 'feelings-nuanced': 'emotions',
  'finance-marches': 'economy', 'food-cuisine-extended': 'food', 'food-products': 'food',
  'future-plans': 'vocabulary', 'health-basic': 'health', 'health-extended': 'health',
  'hobbies-leisure': 'sports', 'home-rooms-furniture': 'home', 'housing-extended': 'home',
  'idiomatic_expressions': 'vocabulary', 'immigration-integration': 'society',
  'justice-droit': 'law', 'law_politics': 'law', 'leisure-extended': 'sports',
  'literary_register': 'arts', 'marketing-commerce': 'economy', 'media_journalism': 'media',
  'media-press': 'media', 'money-finance-intro': 'economy', 'nature-everyday': 'nature',
  'nuanced_synonyms': 'vocabulary', 'numbers-time': 'time', 'numerique-economie': 'technology',
  'opinions-arguments': 'society', 'opinions-basic': 'society', 'past-narration': 'vocabulary',
  'politique-institutions': 'politics', 'professional_advanced': 'work',
  'relationships': 'family', 'restaurant-extended': 'food', 'school-classroom': 'education',
  'science_intro_specialist': 'science', 'sciences-ingenierie': 'science',
  'sciences-introduction': 'science', 'sciences-medecine': 'health', 'sciences-techno': 'technology',
  'shopping-consumption': 'shopping', 'shopping-extended': 'shopping',
  'societe-actualites': 'society', 'societe-debats': 'society', 'society-issues': 'society',
  'sports-active': 'sports', 'technology-everyday': 'technology', 'time-aspects': 'time',
  'transport-everyday': 'travel', 'transport-extended': 'travel', 'transport-extended-b1': 'travel',
  'travail-precarite': 'work', 'travel-experience': 'travel', 'travel-tourism': 'travel',
  'tv-cinema-streaming': 'media', 'verbs-social-interactions': 'society',
  'verbs-thinking': 'psychology', 'work-basic': 'work', 'work-life': 'work',
};

// Which messy categories actually still exist (so the report is honest).
const present = rows(await db.execute(sql`
  SELECT category, count(*)::int n FROM words
  WHERE is_active AND created_by_user_id IS NULL AND category IN (${sql.join(Object.keys(MAP).map((c) => sql`${c}`), sql`, `)})
  GROUP BY category ORDER BY category`));
const totalWords = present.reduce((s: number, c: any) => s + c.n, 0);
console.log(`Messy categories present: ${present.length}, words: ${totalWords}`);

// Per-theme tally of where words will go
const toTheme: Record<string, number> = {};
for (const c of present) { const t = MAP[c.category]!; toTheme[t] = (toTheme[t] ?? 0) + c.n; }
console.log('Will fold into:');
Object.entries(toTheme).sort((a, b) => b[1] - a[1]).forEach(([t, n]) => console.log(`  ${t.padEnd(14)} +${n}`));

if (!APPLY) { console.log('\nReport only. Re-run with --apply.'); process.exit(0); }

// Backup (id, old category) for reversibility.
const affected = rows(await db.execute(sql`
  SELECT id, category FROM words
  WHERE is_active AND created_by_user_id IS NULL AND category IN (${sql.join(Object.keys(MAP).map((c) => sql`${c}`), sql`, `)})`));
writeFileSync('consolidate-backup.json', JSON.stringify(affected.map((w: any) => ({ id: w.id, oldCategory: w.category })), null, 2), 'utf8');
console.log(`\nBackup → apps/api/consolidate-backup.json (${affected.length} rows)`);

// Apply: one UPDATE per source slug (deterministic, no LLM).
let updated = 0;
for (const c of present) {
  const theme = MAP[c.category]!;
  const res: any = await db.update(words).set({ category: theme })
    .where(sql`${words.category} = ${c.category} AND ${words.isActive} = true AND ${words.createdByUserId} IS NULL`);
  updated += c.n;
}
console.log(`Done. Folded ${updated} words from ${present.length} messy categories into canonical themes.`);
process.exit(0);
