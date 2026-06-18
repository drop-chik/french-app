/**
 * Adversarial content QA for advanced (B2–C2) vocabulary example sentences —
 * the AI-generated French prose most likely to hide errors a strong student
 * would catch. A strict native-teacher pass (gpt-4o) flags only REAL mistakes
 * (grammar, agreement, conjugation, gender, wrong word, unnatural phrasing),
 * not stylistic taste, and produces a triage report with a per-level error
 * RATE plus the concrete flagged sentences.
 *
 * This does NOT auto-fix — rewriting advanced French correctly needs a human
 * native editor. It quantifies the problem and points at exactly where to look.
 *
 * Read-only on the DB. Cost ≈ $0.30–0.60 for the default sample.
 *
 * Run:
 *   $env:DATABASE_URL = (railway variables --json | ConvertFrom-Json).DATABASE_PUBLIC_URL
 *   $env:OPENAI_API_KEY = (railway variables --json | ConvertFrom-Json).OPENAI_API_KEY
 *   cd apps/api
 *   npx tsx src/scripts/qa-content-review.ts            # 80 per level
 *   npx tsx src/scripts/qa-content-review.ts 150        # custom sample size
 */
import 'dotenv/config';
import { writeFileSync } from 'node:fs';
import { sql } from 'drizzle-orm';
import OpenAI from 'openai';
import { db } from '../db/index.js';

const PER_LEVEL = Number(process.argv[2]) || 80;
const LEVELS = ['B2', 'C1', 'C2'] as const;
const CHUNK = 12;
const openai = new OpenAI({ apiKey: process.env['OPENAI_API_KEY'] });

function rows(r: unknown): any[] { return (r as { rows?: any[] }).rows ?? (r as any[]); }

const SYSTEM = `Tu es un professeur de français natif, niveau C2, très exigeant, qui relit des phrases d'exemple pour une app d'apprentissage.
On te donne un tableau JSON de phrases (chacune illustre un mot/expression cible).
Pour CHAQUE phrase, juge si elle est grammaticalement correcte, naturelle et idiomatique.
Signale UNIQUEMENT les VRAIES fautes qu'un professeur soulignerait en rouge: grammaire, accord, conjugaison, genre, mauvais mot (y compris mot non français ou registre vulgaire inattendu), contresens manifeste.
SOIS CONSERVATEUR: en cas de doute, ok=true. N'inclus PAS: les préférences de ponctuation, les variantes stylistiques acceptables, les phrases correctes mais peu élégantes, les anglicismes courants admis (ex. "quasi impossible", "de moins en moins" sont CORRECTS). Si "fix" serait identique à la phrase, alors ok=true.
Réponds en JSON: {"results":[{"i":<index>,"ok":<true si aucune faute>,"severity":"high|medium|low","type":"grammar|agreement|conjugation|gender|wrong-word|unnatural|meaning|none","problem":"<bref, en russe>","fix":"<phrase corrigée, ou '' si ok>"}]}.
"results" doit avoir exactement un objet par phrase, dans l'ordre. Pour une phrase correcte: ok=true, type="none", problem="", fix="".`;

interface Issue { level: string; french: string; sentence: string; severity: string; type: string; problem: string; fix: string }

async function reviewChunk(level: string, batch: { french: string; example_fr: string }[]): Promise<Issue[]> {
  const resp = await openai.chat.completions.create({
    model: 'gpt-4o',
    response_format: { type: 'json_object' },
    temperature: 0,
    messages: [
      { role: 'system', content: SYSTEM },
      { role: 'user', content: JSON.stringify(batch.map((b) => b.example_fr)) },
    ],
  });
  const parsed = JSON.parse(resp.choices[0]?.message?.content ?? '{}') as { results?: any[] };
  const out: Issue[] = [];
  for (const r of parsed.results ?? []) {
    if (r.ok === true) continue;
    const b = batch[r.i];
    if (!b) continue;
    out.push({ level, french: b.french, sentence: b.example_fr, severity: r.severity ?? 'low', type: r.type ?? 'unknown', problem: r.problem ?? '', fix: r.fix ?? '' });
  }
  return out;
}

async function main() {
  const issues: Issue[] = [];
  const perLevel: Record<string, { reviewed: number; flagged: number }> = {};

  for (const level of LEVELS) {
    const sample = rows(await db.execute(sql`
      SELECT french, example_fr FROM words
      WHERE level = ${level} AND is_active AND example_fr IS NOT NULL AND example_fr <> ''
      ORDER BY random() LIMIT ${PER_LEVEL}`)) as { french: string; example_fr: string }[];
    perLevel[level] = { reviewed: sample.length, flagged: 0 };
    for (let i = 0; i < sample.length; i += CHUNK) {
      const batch = sample.slice(i, i + CHUNK);
      try {
        const found = await reviewChunk(level, batch);
        issues.push(...found);
        perLevel[level]!.flagged += found.length;
      } catch (err) {
        console.error(`  [${level}] chunk @${i} failed:`, err instanceof Error ? err.message : err);
      }
    }
    const p = perLevel[level]!;
    console.log(`${level}: reviewed ${p.reviewed}, flagged ${p.flagged} (${((p.flagged / Math.max(1, p.reviewed)) * 100).toFixed(1)}%)`);
  }

  // Report
  const bySeverity = (s: string) => issues.filter((i) => i.severity === s);
  let md = `# Content QA — B2–C2 vocabulary example sentences\n\n`;
  md += `Strict native-teacher (gpt-4o) review of a random sample. Read-only audit, no auto-fix.\n\n`;
  md += `## Error rate by level\n\n| Level | Reviewed | Flagged | Rate |\n|---|---|---|---|\n`;
  for (const level of LEVELS) {
    const p = perLevel[level]!;
    md += `| ${level} | ${p.reviewed} | ${p.flagged} | ${((p.flagged / Math.max(1, p.reviewed)) * 100).toFixed(1)}% |\n`;
  }
  md += `\nSeverity: high ${bySeverity('high').length} · medium ${bySeverity('medium').length} · low ${bySeverity('low').length}\n\n`;
  for (const sev of ['high', 'medium', 'low']) {
    const list = bySeverity(sev);
    if (list.length === 0) continue;
    md += `## ${sev.toUpperCase()} (${list.length})\n\n`;
    for (const it of list) {
      md += `- **${it.level} · ${it.french}** [${it.type}] — ${it.problem}\n`;
      md += `  - ❌ ${it.sentence}\n`;
      if (it.fix) md += `  - ✅ ${it.fix}\n`;
    }
    md += `\n`;
  }
  writeFileSync('content-qa-report.md', md, 'utf8'); // cwd = apps/api when run
  console.log(`\nTotal flagged: ${issues.length}. Report written to apps/api/content-qa-report.md`);
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => process.exit(0));
