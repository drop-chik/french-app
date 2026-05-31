import 'dotenv/config';
import { asc } from 'drizzle-orm';
import { db } from '../db/index.js';
import { drillSets } from '../db/schema/index.js';

const rows = await db.select().from(drillSets).orderBy(asc(drillSets.level), asc(drillSets.slug));
const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as const;
for (const lv of LEVELS) {
  const at = rows.filter((r) => r.level === lv);
  console.log(`\n=== ${lv} (${at.length}) ===`);
  for (const r of at) {
    console.log(`  [${r.category.padEnd(14)}] ${r.slug.padEnd(40)} | ${r.titleRu}`);
  }
}
process.exit(0);
