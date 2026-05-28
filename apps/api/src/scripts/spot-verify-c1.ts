import 'dotenv/config';
import { eq, sql } from 'drizzle-orm';
import { db } from '../db/index.js';
import { words } from '../db/schema/index.js';

const rows = await db.select({
  french: words.french,
  translation: words.translation,
  ipa: words.ipa,
  partOfSpeech: words.partOfSpeech,
  gender: words.gender,
  exampleFr: words.exampleFr,
}).from(words).where(eq(words.level, 'C1')).orderBy(sql`RANDOM()`).limit(15);

for (const r of rows) {
  console.log(`${r.french.padEnd(28)} | ${(r.ipa ?? '∅').padEnd(20)} | ${r.partOfSpeech.padEnd(12)} | ${(r.gender ?? '-')} | ${r.translation}`);
  console.log(`  ex: ${r.exampleFr}`);
}
process.exit(0);
