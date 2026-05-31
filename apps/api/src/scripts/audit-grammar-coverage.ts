/**
 * Audit grammar topics across all levels:
 *   1. List every topic by level + category + orderNum
 *   2. Detect intra-level orderNum duplicates / gaps
 *   3. Detect cross-level slug or title overlaps (potential duplicates)
 *   4. Compare against the expected CEFR grammar progression checklist
 *      — flag missing core topics per level
 */
import 'dotenv/config';
import { asc, eq } from 'drizzle-orm';
import { db } from '../db/index.js';
import { grammarTopics } from '../db/schema/index.js';

const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as const;

// CEFR grammar progression — minimum core topics that should exist per level.
// Each entry is a list of keyword regexes; if NONE of the slugs/titles at
// that level matches any keyword set, the topic is flagged as missing.
const EXPECTED: Record<string, Array<{ name: string; keywords: RegExp[] }>> = {
  A1: [
    { name: 'être / avoir au présent', keywords: [/être|avoir|глагол.*быть|глагол.*иметь/i] },
    { name: 'verbes -er au présent', keywords: [/verbes.*-er|настоящее.*-er|глаголы.*первой.*групп/i] },
    { name: 'articles définis / indéfinis', keywords: [/article|артикл/i] },
    { name: 'genre + pluriel des noms', keywords: [/genre|pluriel|род|множеств/i] },
    { name: 'adjectifs (accord)', keywords: [/adjectif|прилагательн/i] },
    { name: 'pronoms personnels sujets', keywords: [/pronom.*personnel|местоимен.*лич/i] },
    { name: 'nombres / numbers', keywords: [/nombre|числит|number/i] },
    { name: 'négation (ne…pas)', keywords: [/négation|отрицан|ne.*pas/i] },
    { name: 'questions / interrogation', keywords: [/question|interrogat|вопрос/i] },
    { name: 'prépositions de lieu / temps', keywords: [/préposition|предлог/i] },
    { name: 'impératif', keywords: [/impératif|повелительн/i] },
    { name: 'futur proche (aller + inf)', keywords: [/futur.*proche|aller.*infinitif|ближайш.*будущ/i] },
    { name: 'passé récent (venir de)', keywords: [/passé.*récent|venir de|недавнее.*прошед/i] },
  ],
  A2: [
    { name: 'passé composé', keywords: [/passé.*composé|сложное.*прошед/i] },
    { name: 'imparfait', keywords: [/imparfait|имперфект|незаконченное/i] },
    { name: 'futur simple', keywords: [/futur.*simple|простое.*будущ/i] },
    { name: 'conditionnel présent (politesse)', keywords: [/conditionnel.*présent|условное/i] },
    { name: 'comparatif / superlatif', keywords: [/comparatif|superlatif|сравнит|превосход/i] },
    { name: 'pronoms COD / COI', keywords: [/pronom.*c[oô]d|pronom.*co[oi]|местоимен.*допол|прямое.*допол|косвенное/i] },
    { name: 'pronoms y / en', keywords: [/y.*en|en.*y|y\b|местоимен.*y|местоимен.*en/i] },
    { name: 'adverbes en -ment', keywords: [/adverbes?.*-ment|наречия.*-ment/i] },
    { name: 'subjonctif présent (intro)', keywords: [/subjonctif|сослагательн/i] },
    { name: 'relatives qui / que', keywords: [/relatif|относительн/i] },
  ],
  B1: [
    { name: 'plus-que-parfait', keywords: [/plus-que-parfait|давнопрошед/i] },
    { name: 'subjonctif présent (doute, émotion)', keywords: [/subjonctif/i] },
    { name: 'discours indirect (présent)', keywords: [/discours.*indirect|косвенн.*речь/i] },
    { name: 'conditionnel passé', keywords: [/conditionnel.*passé|условное.*прошед/i] },
    { name: 'gérondif (en + part. présent)', keywords: [/gérondif|gérondif|герундиф/i] },
    { name: 'voix passive', keywords: [/passive|voix.*passive|пассивн|страдательн/i] },
    { name: 'connecteurs logiques (parce que, donc...)', keywords: [/connecteur|конн[ек]кт|parce.*que/i] },
    { name: 'pronoms relatifs (dont, où, lequel)', keywords: [/relatif|относительн/i] },
    { name: 'expressions de temps (depuis, pendant...)', keywords: [/depuis|pendant|временн.*выражен|выражен.*времен/i] },
  ],
  B2: [
    { name: 'futur antérieur', keywords: [/futur.*antérieur|будуще.*предшеств/i] },
    { name: 'subjonctif passé', keywords: [/subjonctif.*passé|сослагательн.*прошед/i] },
    { name: 'discours indirect au passé', keywords: [/discours.*indirect.*pass|косвенн.*прошед/i] },
    { name: 'concordance des temps', keywords: [/concordance|согласован.*времен/i] },
    { name: 'passive avancée', keywords: [/passive|пассив/i] },
    { name: 'connecteurs avancés (cause/conséquence/concession)', keywords: [/connecteur|cause|conséquence|concession|концесс/i] },
    { name: 'verbes pronominaux (sens)', keywords: [/pronominau|местоимен.*глагол|возвратн/i] },
    { name: 'expressions impersonnelles', keywords: [/impersonn|безличн/i] },
  ],
  C1: [
    { name: 'subjonctif passé (concordance)', keywords: [/subjonctif|сослагательн/i] },
    { name: 'subjonctif imparfait (littéraire)', keywords: [/subjonctif.*imparfait|сослагательн.*имперфект/i] },
    { name: 'conditionnel passé 2e forme', keywords: [/conditionnel.*passé.*2|условное.*вторая/i] },
    { name: 'double pronominalisation', keywords: [/double.*pronom|двойн.*местоим/i] },
    { name: 'mise en relief', keywords: [/mise.*en.*relief|эмфатич/i] },
    { name: 'inversion stylistique', keywords: [/inversion|инверсия/i] },
    { name: 'discours indirect avancé', keywords: [/discours.*indirect/i] },
    { name: 'participe présent / gérondif / adj. verbal', keywords: [/participe.*présent|gérondif|adjectif.*verbal/i] },
    { name: 'connecteurs formels', keywords: [/connecteur|конне[кт]/i] },
    { name: 'régimes verbaux (à / de / direct)', keywords: [/régime.*verbal|глагольн.*режим/i] },
    { name: 'style indirect libre', keywords: [/indirect.*libre|несобственн.*прямая/i] },
  ],
  C2: [
    { name: 'subjonctif imparfait actif', keywords: [/subjonctif.*imparfait/i] },
    { name: 'passé simple production', keywords: [/passé.*simple|простое.*прошедш/i] },
    { name: 'conditionnel passé 2e forme actif', keywords: [/conditionnel.*passé.*2|условное.*вторая/i] },
    { name: 'figures de style', keywords: [/figure.*style|стилист.*фигур|риторич/i] },
    { name: 'formes archaïques', keywords: [/archaï|архаич/i] },
    { name: 'nuances modales', keywords: [/nuance.*modal|модальн.*нюанс/i] },
    { name: 'ne explétif', keywords: [/ne.*explétif|expletif/i] },
  ],
};

const rows = await db.select({
  id: grammarTopics.id, slug: grammarTopics.slug, titleRu: grammarTopics.titleRu, titleFr: grammarTopics.titleFr,
  level: grammarTopics.level, category: grammarTopics.category, orderNum: grammarTopics.orderNum,
}).from(grammarTopics).orderBy(asc(grammarTopics.level), asc(grammarTopics.orderNum));

console.log(`Total: ${rows.length} grammar topics\n`);

// ─── Per-level listing ─────────────────────────────────────────────────
for (const lv of LEVELS) {
  const atLevel = rows.filter((r) => r.level === lv);
  console.log(`\n=== ${lv} (${atLevel.length} topics) ===`);
  for (const r of atLevel) {
    console.log(`  ${String(r.orderNum).padStart(2)} [${r.category.padEnd(14)}] ${r.slug.padEnd(45)} | ${r.titleRu}`);
  }

  // OrderNum analysis
  const orders = atLevel.map((r) => r.orderNum).sort((a, b) => a - b);
  const dupOrders: number[] = [];
  for (let i = 1; i < orders.length; i++) if (orders[i] === orders[i - 1]) dupOrders.push(orders[i]!);
  if (dupOrders.length) console.log(`  ⚠ duplicate orderNum: ${[...new Set(dupOrders)].join(', ')}`);
  const gaps: number[] = [];
  for (let n = 1; n <= Math.max(...orders); n++) if (!orders.includes(n)) gaps.push(n);
  if (gaps.length) console.log(`  ⚠ orderNum gaps: ${gaps.join(', ')}`);
}

// ─── Cross-level duplicates by category + similar title ────────────────
console.log(`\n=== Cross-level potential duplicates ===`);
function normalize(s: string): string {
  return s.toLowerCase().replace(/[^a-zа-я0-9]/g, ' ').replace(/\s+/g, ' ').trim();
}
const seenByNorm = new Map<string, Array<{ level: string; slug: string; titleRu: string }>>();
for (const r of rows) {
  const norm = normalize(r.titleRu);
  if (!seenByNorm.has(norm)) seenByNorm.set(norm, []);
  seenByNorm.get(norm)!.push({ level: r.level, slug: r.slug, titleRu: r.titleRu });
}
let dupCount = 0;
for (const [, group] of seenByNorm) {
  if (group.length > 1) {
    dupCount++;
    console.log(`  DUP across ${group.map((g) => g.level).join(', ')}: "${group[0]!.titleRu}"`);
    for (const g of group) console.log(`    ${g.level}  ${g.slug}`);
  }
}
if (dupCount === 0) console.log('  ✓ no exact-title duplicates across levels');

// Slug overlap (more loose — partial slug match)
const slugWords = new Map<string, Array<{ level: string; slug: string }>>();
for (const r of rows) {
  // Strip level prefix to compare topic stems
  const stem = r.slug.replace(/^[a-c][12]-?/i, '').toLowerCase();
  if (stem.length < 8) continue; // skip too short
  if (!slugWords.has(stem)) slugWords.set(stem, []);
  slugWords.get(stem)!.push({ level: r.level, slug: r.slug });
}
for (const [stem, group] of slugWords) {
  if (group.length > 1) {
    console.log(`  SLUG STEM "${stem}" → ${group.map((g) => `${g.level}:${g.slug}`).join(' | ')}`);
  }
}

// ─── Coverage vs EXPECTED ──────────────────────────────────────────────
console.log(`\n=== Coverage vs CEFR-expected grammar topics ===`);
for (const lv of LEVELS) {
  const atLevel = rows.filter((r) => r.level === lv);
  const expected = EXPECTED[lv] ?? [];
  console.log(`\n${lv} (${expected.length} expected, ${atLevel.length} actual):`);
  for (const ex of expected) {
    const found = atLevel.find((r) =>
      ex.keywords.some((kw) => kw.test(r.slug) || kw.test(r.titleRu) || kw.test(r.titleFr))
    );
    if (found) {
      console.log(`  ✓ ${ex.name.padEnd(48)} → ${found.slug}`);
    } else {
      console.log(`  ✗ MISSING: ${ex.name}`);
    }
  }
}

process.exit(0);
