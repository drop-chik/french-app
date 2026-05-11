import pg from 'pg';
const { Client } = pg;
const client = new Client({ connectionString: process.env.DATABASE_URL });
await client.connect();

// All nature words
const nature = await client.query(`SELECT french, level FROM words WHERE category='nature' AND is_active=true ORDER BY level, french`);
console.log('=== NATURE (' + nature.rows.length + ') ===');
nature.rows.forEach(r => console.log(`  [${r.level}] ${r.french}`));

// All adjectives words
const adj = await client.query(`SELECT french, level FROM words WHERE category='adjectives' AND is_active=true ORDER BY level, french`);
console.log('\n=== ADJECTIVES (' + adj.rows.length + ') ===');
adj.rows.forEach(r => console.log(`  [${r.level}] ${r.french}`));

// All time words
const time = await client.query(`SELECT french, level FROM words WHERE category='time' AND is_active=true ORDER BY level, french`);
console.log('\n=== TIME (' + time.rows.length + ') ===');
time.rows.forEach(r => console.log(`  [${r.level}] ${r.french}`));

await client.end();
