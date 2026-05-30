import 'dotenv/config';
import { eq, isNull, and, sql } from 'drizzle-orm';
import { db } from '../db/index.js';
import { words } from '../db/schema/index.js';

const levels = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as const;
for (const lv of levels) {
  const [total] = await db.select({ n: sql<number>`count(*)` }).from(words).where(eq(words.level, lv));
  const [missing] = await db.select({ n: sql<number>`count(*)` }).from(words).where(and(eq(words.level, lv), isNull(words.ipa)));
  console.log(`  ${lv}: total=${total?.n ?? 0}  missing IPA=${missing?.n ?? 0}`);
}
process.exit(0);
