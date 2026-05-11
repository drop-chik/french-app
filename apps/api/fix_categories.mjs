import pg from 'pg';
const { Client } = pg;
const client = new Client({ connectionString: process.env.DATABASE_URL });
await client.connect();

// 1. nature → animals
const ANIMALS = [
  'canard', 'chat', 'le chat', 'cheval', 'chien', 'le chien', 'cochon', 'éléphant',
  'grenouille', 'lapin', 'lion', "l'animal", "l'oiseau", 'loup', 'mouton', 'oiseau',
  'ours', 'papillon', 'poisson', 'renard', 'serpent', 'singe', 'tigre', 'vache',
  'faune', 'la faune',
];

// 2. nature → weather
const WEATHER = [
  'chaleur', 'ciel', 'le ciel', 'couvert', 'frais', 'humide', 'la neige', 'la pluie',
  'le nuage', 'le soleil', 'le vent', 'neigeux', 'orageux', 'pluvieux', 'sec', 'venteux',
  'arc-en-ciel', 'brumeux', 'canicule', 'degré', 'ensoleillé', 'foudre', 'gel', 'humidité',
  'il fait beau', 'il fait chaud', 'il fait froid', 'il neige', 'il pleut', 'inondation',
  'la météo', 'la température', 'le brouillard', 'météo', 'nuageux', 'prévision', 'sécheresse',
  'la sécheresse', 'tempête', 'verglas', 'le séisme', "l'éruption volcanique", "l'inondation",
  'tremblement de terre',
];

// 3. nature → environment (ecology concepts)
const ENV_FROM_NATURE = [
  'la biodiversité', 'la conservation', 'déforestation', 'la déforestation',
  'la ressource naturelle', "l'écosystème", 'le développement durable',
  "l'effet de serre", "l'empreinte carbone", "l'énergie éolienne", "l'énergie solaire",
  'le réchauffement climatique', 'polluer', 'préserver', 'protection de la nature',
  'reboisement', 'pollinisation', 'flore', 'la flore',
];

// 4. adjectives → colors
const COLORS = [
  'blanc', 'bleu', 'jaune', 'noir', 'rouge', 'vert', 'orange', 'violet', 'rose',
  'gris', 'marron', 'beige', 'bordeaux', 'brun', 'roux', 'argenté', 'doré', 'blond', 'foncé',
];

// 5. time → calendar
const CALENDAR = [
  'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche',
  'janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août',
  'septembre', 'octobre', 'novembre', 'décembre',
  'le printemps', "l'été", "l'automne", "l'hiver", 'la saison',
  "l'année", 'le mois', 'la semaine', 'agenda',
  'annuel', 'hebdomadaire', 'mensuel', 'quotidien', 'semestre', 'trimestre',
  'décennie', 'siècle', 'le siècle',
];

// helper
const ph = (arr) => arr.map((_, i) => `$${i+1}`).join(',');

let r;
r = await client.query(`UPDATE words SET category='animals' WHERE category='nature' AND french IN (${ph(ANIMALS)})`, ANIMALS);
console.log(`nature→animals: ${r.rowCount} rows`);

r = await client.query(`UPDATE words SET category='weather' WHERE category='nature' AND french IN (${ph(WEATHER)})`, WEATHER);
console.log(`nature→weather: ${r.rowCount} rows`);

r = await client.query(`UPDATE words SET category='environment' WHERE french IN (${ph(ENV_FROM_NATURE)})`, ENV_FROM_NATURE);
console.log(`→environment: ${r.rowCount} rows`);

r = await client.query(`UPDATE words SET category='colors' WHERE french IN (${ph(COLORS)})`, COLORS);
console.log(`adjectives→colors: ${r.rowCount} rows`);

r = await client.query(`UPDATE words SET category='calendar' WHERE category='time' AND french IN (${ph(CALENDAR)})`, CALENDAR);
console.log(`time→calendar: ${r.rowCount} rows`);

r = await client.query(`UPDATE words SET category='body' WHERE french = $1`, ["les cheveux"]);
console.log(`→body: ${r.rowCount} rows`);

// Verify final counts
const res = await client.query(`SELECT category, count(*) as cnt FROM words WHERE is_active=true GROUP BY category ORDER BY cnt DESC`);
console.log('\nFinal category counts:');
res.rows.forEach(row => console.log(`  ${row.category}: ${row.cnt}`));

await client.end();
