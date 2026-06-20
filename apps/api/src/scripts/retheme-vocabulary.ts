/**
 * Re-theme the vocabulary's generic source-tag categories into real semantic
 * themes. ~10.6k words sit under 'beacco' / 'beacco-c2' / 'vocabulary' — not
 * themes, just import tags — so the Dictionary "По темам" grid shows a giant
 * meaningless "Beacco" card. This assigns each such word the single best theme
 * from the canonical set the UI already knows (emoji + i18n label), with a
 * 'vocabulary' fallback for genuinely abstract words.
 *
 * POS and CEFR level are NOT touched (a calibration found them ~clean, and
 * auto-changing CEFR via an LLM would scramble the curated Beacco levels).
 *
 * Safe by default: scan/report only. With --apply it writes — and first dumps
 * a backup of (id, old category) to retheme-backup.json for reversibility.
 *
 * Run:
 *   $env:DATABASE_URL = (railway variables --json | ConvertFrom-Json).DATABASE_PUBLIC_URL
 *   $env:OPENAI_API_KEY = (railway variables --json | ConvertFrom-Json).OPENAI_API_KEY
 *   cd apps/api
 *   npx tsx src/scripts/retheme-vocabulary.ts            # report only
 *   npx tsx src/scripts/retheme-vocabulary.ts --apply    # apply + backup
 */
import 'dotenv/config';
import { writeFileSync, readFileSync, existsSync } from 'node:fs';
import { sql, inArray } from 'drizzle-orm';
import OpenAI from 'openai';
import { db } from '../db/index.js';
import { words } from '../db/schema/index.js';

const APPLY = process.argv.includes('--apply');
const openai = new OpenAI({ apiKey: process.env['OPENAI_API_KEY'] });
// gpt-4o (not mini) — theme classification needs the stronger model; mini made
// visible errors (âne→emotions). Bigger batch amortizes the long system prompt;
// SLEEP keeps us under the 30k-TPM cap.
const MODEL = 'gpt-4o';
const CHUNK = 50;
const SLEEP_MS = 2500;
function rows(r: unknown): any[] { return (r as { rows?: any[] }).rows ?? (r as any[]); }

// Generic source-tag categories to replace (NOT real themes).
const GENERIC = ['beacco', 'beacco-c2', 'vocabulary'];

// Canonical themes — every one already has an emoji + i18n label in the web UI
// (CATEGORY_EMOJI / dictionary.categoryNames). 'vocabulary' is the fallback for
// abstract words with no clear theme.
const THEMES = [
  'family', 'body', 'health', 'emotions', 'food', 'home', 'clothes', 'shopping',
  'time', 'calendar', 'city', 'travel', 'nature', 'weather', 'animals', 'geography',
  'environment', 'sports', 'education', 'work', 'economy', 'politics', 'law',
  'society', 'arts', 'media', 'technology', 'science', 'psychology', 'colors',
];
const THEME_SET = new Set([...THEMES, 'vocabulary']);

const SYS = `Tu classes du vocabulaire français par THÈME. Pour chaque entrée {french, ru} choisis le SEUL meilleur thème dans cette liste EXACTE:
${THEMES.join(', ')}.

RÈGLE IMPÉRATIVE: choisis TOUJOURS un thème concret dès que le sens le permet. Un nom concret a presque toujours un thème. Exemples:
- âne/chien/oiseau → animals ; argent/banque/prix → economy ; air/rivière/arbre → nature ; médecin/maladie → health ; ordinateur/internet → technology ; robe/chaussure → clothes ; montagne/pays → geography ; tableau/musique → arts ; loi/juge → law ; école/élève → education ; pain/repas → food ; maison/cuisine → home.
- Le thème dépend du SENS, pas de la partie du discours: manger→food, voyager→travel, guérir→health, triste/heureux→emotions, politique→politics.
- Adjectifs/noms de nationalité ou de langue (allemand, anglais, français) → geography.

N'utilise "vocabulary" QUE pour: les mots purement grammaticaux (prépositions, conjonctions, articles, pronoms, particules: à, au, et, alors, aucun, ne) OU les mots vraiment abstraits sans aucun rapport thématique. Ne prends PAS "vocabulary" par facilité.

Réponds en JSON: {"results":[{"i":<index>,"theme":"<slug exact de la liste ou 'vocabulary'>"}]} — un objet par entrée, dans l'ordre.`;

async function classify(batch: any[]): Promise<Map<string, string>> {
  let parsed: any = {};
  for (let attempt = 0; ; attempt++) {
    try {
      const resp = await openai.chat.completions.create({
        model: MODEL, response_format: { type: 'json_object' }, temperature: 0,
        messages: [{ role: 'system', content: SYS },
          { role: 'user', content: JSON.stringify(batch.map((w) => ({ french: w.french, ru: w.translation }))) }],
      });
      parsed = JSON.parse(resp.choices[0]?.message?.content ?? '{}');
      break;
    } catch (err: any) {
      // Out of OpenAI credits → fatal, never recovers: abort immediately
      // (don't burn time retrying every chunk).
      if (err?.code === 'insufficient_quota' || /quota|billing/i.test(err?.message ?? '')) {
        throw Object.assign(new Error('OPENAI_QUOTA_EXHAUSTED'), { fatal: true });
      }
      // Network/rate-limit flakes in clusters (~1 min). Retry generously: 8
      // tries, backoff up to ~30s ⇒ survives ~2 min.
      if (attempt < 8) { await new Promise((r) => setTimeout(r, 3000 * (attempt + 1))); continue; }
      throw err;
    }
  }
  const out = new Map<string, string>();
  for (const r of parsed.results ?? []) {
    const w = batch[r.i]; if (!w) continue;
    const theme = THEME_SET.has(r.theme) ? r.theme : 'vocabulary';
    out.set(w.id, theme);
  }
  return out;
}

// Retry the DB fetch — the Railway proxy DNS occasionally flakes (ENOTFOUND).
async function fetchAll(): Promise<any[]> {
  for (let attempt = 0; ; attempt++) {
    try {
      return rows(await db.execute(sql`
        SELECT id, french, translation, part_of_speech, level FROM words
        WHERE is_active AND created_by_user_id IS NULL AND category IN (${sql.join(GENERIC.map((g) => sql`${g}`), sql`, `)})
        ORDER BY level, french`));
    } catch (err) {
      if (attempt < 6) { console.error(`  db fetch retry ${attempt + 1}:`, err instanceof Error ? err.message : err); await new Promise((r) => setTimeout(r, 3000 * (attempt + 1))); continue; }
      throw err;
    }
  }
}
const all = await fetchAll();
console.log(`Generic-category words to re-theme: ${all.length}`);

// Checkpoint/resume: assignments are persisted as we go, so a crash, network
// outage, or OpenAI-quota stop can be resumed without re-classifying — just
// re-run the script. The same file is reused by --apply (no double pass).
const ASSIGN_FILE = 'retheme-assignments.json';
const assigned = new Map<string, string>(); // id -> theme
if (existsSync(ASSIGN_FILE)) {
  for (const [id, theme] of Object.entries(JSON.parse(readFileSync(ASSIGN_FILE, 'utf8')) as Record<string, string>)) {
    assigned.set(id, theme);
  }
  console.log(`Resumed from checkpoint: ${assigned.size} already assigned.`);
}
const saveCheckpoint = () => writeFileSync(ASSIGN_FILE, JSON.stringify(Object.fromEntries(assigned)), 'utf8');

const todo = all.filter((w) => !assigned.has(w.id));
console.log(`To classify: ${todo.length}`);
let done = 0;
try {
  for (let i = 0; i < todo.length; i += CHUNK) {
    const batch = todo.slice(i, i + CHUNK);
    try {
      const m = await classify(batch);
      for (const [id, theme] of m) assigned.set(id, theme);
    } catch (err: any) {
      if (err?.fatal) throw err; // quota exhausted — stop the whole run
      console.error(`  chunk @${i} failed:`, err instanceof Error ? err.message : err);
    }
    done += batch.length;
    if (i % (CHUNK * 5) === 0) { console.log(`  ${done}/${todo.length} (total ${assigned.size}/${all.length})`); saveCheckpoint(); }
    if (i + CHUNK < todo.length) await new Promise((r) => setTimeout(r, SLEEP_MS));
  }
} catch (err: any) {
  saveCheckpoint();
  if (err?.message === 'OPENAI_QUOTA_EXHAUSTED') {
    console.error(`\n⛔ OpenAI quota exhausted. Saved ${assigned.size}/${all.length} to ${ASSIGN_FILE}. Top up billing and re-run to resume.`);
    process.exit(2);
  }
  throw err;
}
saveCheckpoint();

// Distribution
const dist: Record<string, number> = {};
for (const t of assigned.values()) dist[t] = (dist[t] ?? 0) + 1;
const sorted = Object.entries(dist).sort((a, b) => b[1] - a[1]);
console.log(`\nAssigned ${assigned.size}/${all.length}. Theme distribution:`);
sorted.forEach(([t, n]) => console.log(`  ${t.padEnd(14)} ${n}`));

// Sample for eyeballing
console.log(`\nSample assignments:`);
all.slice(0, 25).forEach((w) => console.log(`  [${assigned.get(w.id) ?? '—'}] ${w.french} — ${w.translation} (${w.part_of_speech}, ${w.level})`));

if (!APPLY) {
  console.log(`\nReport only. Re-run with --apply to write (backup is saved first).`);
  process.exit(0);
}

// Backup then apply, grouped by theme for efficient bulk updates.
const backup = all.map((w) => ({ id: w.id, oldCategory: 'generic', french: w.french, newCategory: assigned.get(w.id) ?? null }));
writeFileSync('retheme-backup.json', JSON.stringify(backup, null, 2), 'utf8');
console.log(`\nBackup → apps/api/retheme-backup.json (${backup.length} rows)`);

const byTheme = new Map<string, string[]>();
for (const [id, theme] of assigned) {
  if (!byTheme.has(theme)) byTheme.set(theme, []);
  byTheme.get(theme)!.push(id);
}
let updated = 0;
for (const [theme, ids] of byTheme) {
  for (let i = 0; i < ids.length; i += 500) {
    const slice = ids.slice(i, i + 500);
    await db.update(words).set({ category: theme }).where(inArray(words.id, slice));
    updated += slice.length;
  }
}
console.log(`Updated ${updated} words.`);
process.exit(0);
