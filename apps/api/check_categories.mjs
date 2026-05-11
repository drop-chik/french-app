import pg from 'pg';
const { Client } = pg;
const client = new Client({ connectionString: process.env.DATABASE_URL });
await client.connect();

const res = await client.query(`
  SELECT category, count(*) as cnt 
  FROM words 
  WHERE is_active = true
  GROUP BY category 
  ORDER BY cnt DESC
`);
console.log('Category counts:');
res.rows.forEach(r => console.log(`  ${r.category}: ${r.cnt}`));

// Check what's in nature (was merged: weather + animals + nature)
const nature = await client.query(`SELECT french, level FROM words WHERE category='nature' AND is_active=true ORDER BY level, french LIMIT 60`);
console.log('\nSample from "nature":');
nature.rows.forEach(r => console.log(`  [${r.level}] ${r.french}`));

// Check adjectives (was merged with colors)
const adj = await client.query(`SELECT french, level FROM words WHERE category='adjectives' AND is_active=true ORDER BY level, french LIMIT 40`);
console.log('\nSample from "adjectives":');
adj.rows.forEach(r => console.log(`  [${r.level}] ${r.french}`));

// Check time category
const time = await client.query(`SELECT french, level FROM words WHERE category='time' AND is_active=true ORDER BY level, french`);
console.log('\nAll "time" words:');
time.rows.forEach(r => console.log(`  [${r.level}] ${r.french}`));

await client.end();
