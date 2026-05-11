import pg from 'pg';
const { Client } = pg;
const client = new Client({ connectionString: process.env.DATABASE_URL });
await client.connect();

// All distinct categories with counts
const res = await client.query(`
  SELECT category, count(*) as cnt 
  FROM words 
  WHERE is_active = true
  GROUP BY category 
  ORDER BY category
`);
console.log('All categories in DB:');
res.rows.forEach(r => console.log(`  "${r.category}": ${r.cnt}`));
console.log(`\nTotal categories: ${res.rows.length}`);

// Check i18n keys (what we expect)
const i18nKeys = new Set([
  'basics','numbers','time','calendar','family','body','health','emotions',
  'food','home','clothes','shopping','city','travel','nature','weather','animals',
  'geography','environment','sports','education','work','economy','politics','law',
  'society','arts','media','technology','science','psychology',
  'verbs','adjectives','colors','expressions','other'
]);

console.log('\nCategories NOT in i18n (will show as English):');
res.rows.forEach(r => {
  if (!i18nKeys.has(r.category)) {
    console.log(`  ⚠️  "${r.category}" (${r.cnt} words)`);
  }
});
await client.end();
