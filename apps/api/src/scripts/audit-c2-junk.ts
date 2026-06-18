/**
 * Full audit of C2 vocabulary for GARBAGE / non-French / broken entries —
 * the generation noise the sampled QA pass surfaced (del, este, laurer,
 * anglosaxophone, matir, la tette...).
 *
 * Precision matters: C2 legitimately contains rare, literary, technical words,
 * so a single LLM pass would delete real vocabulary. Two independent passes:
 *   Pass 1 (classify): gpt-4o labels every C2 lemma ok | misspelling |
 *           not-french | nonexistent | wrong-form. Rarity alone is NOT a flag.
 *   Pass 2 (adversarial defend): each suspect is re-checked in a SEPARATE call
 *           that tries to DEFEND the word as standard French (definition +
 *           real example). Only entries the defender ALSO rejects are kept.
 * An entry is "confirmed junk" only when both passes agree it is not real.
 *
 * ⚠️ SCAN/TRIAGE ONLY — does NOT delete. In practice even the two-pass
 * "confirmed" list contains false positives: the model has flagged real words
 * (framboise, pistache, archipel, silhouetter) and hallucinated reasons. So the
 * output is a SHORTLIST for a human to curate, never a delete-list. The
 * 2026-06-18 cleanup deleted only a hand-verified subset (foreign-language
 * words + pure fragments with no legitimate French reading).
 *
 * Read-only → writes c2-junk-report.md.
 *
 * Run:
 *   $env:DATABASE_URL = (railway variables --json | ConvertFrom-Json).DATABASE_PUBLIC_URL
 *   $env:OPENAI_API_KEY = (railway variables --json | ConvertFrom-Json).OPENAI_API_KEY
 *   cd apps/api
 *   npx tsx src/scripts/audit-c2-junk.ts
 */
import 'dotenv/config';
import { writeFileSync } from 'node:fs';
import { sql } from 'drizzle-orm';
import OpenAI from 'openai';
import { db } from '../db/index.js';

const openai = new OpenAI({ apiKey: process.env['OPENAI_API_KEY'] });
const P1_CHUNK = 25;
const P2_CHUNK = 12;
function rows(r: unknown): any[] { return (r as { rows?: any[] }).rows ?? (r as any[]); }

interface Word { id: string; french: string; example_fr: string | null; translation: string }
interface Verdict { id: string; french: string; verdict: string; corrected: string; reason: string; example: string | null }

const P1_SYSTEM = `Tu es lexicographe du français, expert du dictionnaire (Larousse/Robert). On te donne des entrées de vocabulaire de NIVEAU C2 (donc rares, littéraires, techniques sont NORMALES — la rareté n'est JAMAIS un défaut).
Pour chaque entrée {french, example}, classe-la:
  "ok"          — mot/expression français réel et correctement orthographié (même rare/soutenu).
  "misspelling" — faute d'orthographe d'un vrai mot (donne la forme correcte dans "corrected").
  "not-french"  — mot d'une autre langue (anglais, espagnol…) qui n'est pas un emprunt lexicalisé en français.
  "nonexistent" — n'existe pas en français / fragment / charabia.
  "wrong-form"  — forme fléchie/conjuguée mise à la place d'un lemme (donne le lemme dans "corrected").
Ne signale JAMAIS un mot juste parce qu'il est rare. Dans le doute → "ok".
Réponds en JSON: {"results":[{"i":<index>,"verdict":"ok|misspelling|not-french|nonexistent|wrong-form","corrected":"<si applicable, sinon ''>","reason":"<bref, russe>"}]} — un objet par entrée, dans l'ordre.`;

const P2_SYSTEM = `Tu es un avocat du dictionnaire: ta tâche est de DÉFENDRE que chaque mot donné est un vrai mot français standard et correctement orthographié. Pour chaque mot, fournis une définition de type dictionnaire et UNE phrase d'usage réelle.
Si tu NE PEUX PAS le défendre honnêtement (ce n'est pas du français, c'est mal orthographié, c'est un fragment ou une forme fléchie et non un lemme), dis-le clairement.
Réponds en JSON: {"results":[{"i":<index>,"real":<true si c'est un vrai mot français standard défendable>,"definition":"<courte, ou ''>","reason":"<si real=false, pourquoi, en russe>"}]} — un objet par mot, dans l'ordre.`;

// Shared JSON chat with retry/backoff on 429 (this org has a low gpt-4o TPM).
async function chatJSON(model: string, system: string, userContent: string): Promise<{ results?: any[] }> {
  for (let attempt = 0; ; attempt++) {
    try {
      const resp = await openai.chat.completions.create({
        model, response_format: { type: 'json_object' }, temperature: 0,
        messages: [{ role: 'system', content: system }, { role: 'user', content: userContent }],
      });
      return JSON.parse(resp.choices[0]?.message?.content ?? '{}');
    } catch (err: any) {
      if (err?.status === 429 && attempt < 8) {
        await new Promise((r) => setTimeout(r, 2500 * (attempt + 1)));
        continue;
      }
      throw err;
    }
  }
}

async function pass1(batch: Word[]): Promise<Verdict[]> {
  const parsed = await chatJSON('gpt-4o-mini', P1_SYSTEM,
    JSON.stringify(batch.map((w) => ({ french: w.french, example: w.example_fr }))));
  const out: Verdict[] = [];
  for (const r of parsed.results ?? []) {
    const w = batch[r.i]; if (!w) continue;
    if ((r.verdict ?? 'ok') === 'ok') continue;
    out.push({ id: w.id, french: w.french, verdict: r.verdict, corrected: r.corrected ?? '', reason: r.reason ?? '', example: w.example_fr });
  }
  return out;
}

async function pass2(suspects: Verdict[]): Promise<Set<string>> {
  // returns ids the defender ALSO rejects (real=false) → confirmed junk
  const confirmed = new Set<string>();
  for (let i = 0; i < suspects.length; i += P2_CHUNK) {
    const batch = suspects.slice(i, i + P2_CHUNK);
    try {
      const parsed = await chatJSON('gpt-4o', P2_SYSTEM, JSON.stringify(batch.map((s) => s.french)));
      for (const r of parsed.results ?? []) {
        const s = batch[r.i]; if (!s) continue;
        if (r.real === false) confirmed.add(s.id);
      }
    } catch (err) {
      console.error(`  pass2 chunk @${i} failed:`, err instanceof Error ? err.message : err);
    }
  }
  return confirmed;
}

async function main() {
  const all = rows(await db.execute(sql`
    SELECT id, french, example_fr, translation FROM words
    WHERE level = 'C2' AND is_active AND created_by_user_id IS NULL
    ORDER BY french`)) as Word[];
  console.log(`C2 words: ${all.length}`);

  // Pass 1
  const suspects: Verdict[] = [];
  for (let i = 0; i < all.length; i += P1_CHUNK) {
    try {
      const found = await pass1(all.slice(i, i + P1_CHUNK));
      suspects.push(...found);
    } catch (err) {
      console.error(`  pass1 chunk @${i} failed:`, err instanceof Error ? err.message : err);
    }
    if (i % (P1_CHUNK * 10) === 0) console.log(`  pass1 ${Math.min(i + P1_CHUNK, all.length)}/${all.length} (suspects so far: ${suspects.length})`);
  }
  console.log(`Pass 1 suspects: ${suspects.length}`);

  // Pass 2 — adversarial confirmation
  const confirmedIds = await pass2(suspects);
  const confirmed = suspects.filter((s) => confirmedIds.has(s.id));
  const borderline = suspects.filter((s) => !confirmedIds.has(s.id)); // pass1 flagged, pass2 defended
  console.log(`Confirmed junk (both passes): ${confirmed.length}  |  borderline (pass1 only): ${borderline.length}`);

  // progress check (informational — which suspects a user has actually studied)
  const ids = confirmed.map((c) => c.id);
  const withProgress = new Set<string>();
  if (ids.length) {
    const pr = rows(await db.execute(sql`SELECT DISTINCT word_id FROM word_progress WHERE word_id IN (${sql.join(ids.map((i) => sql`${i}`), sql`, `)})`));
    pr.forEach((r) => withProgress.add(r.word_id));
  }

  // Report
  const byVerdict = (v: string) => confirmed.filter((c) => c.verdict === v);
  let md = `# C2 junk-entry audit\n\nTwo-pass (classify + adversarial defend) over all ${all.length} C2 lemmas.\n\n`;
  md += `> ⚠️ SHORTLIST, not a delete-list. The model still over-flags: this list has included real words (framboise, pistache, archipel). Curate by hand before removing anything.\n\n`;
  md += `- Confirmed junk (both passes agree): **${confirmed.length}** (${((confirmed.length / all.length) * 100).toFixed(1)}%)\n`;
  md += `- Borderline (pass-1 flagged, pass-2 defended → kept): ${borderline.length}\n\n`;
  for (const v of ['nonexistent', 'not-french', 'misspelling', 'wrong-form']) {
    const list = byVerdict(v);
    if (!list.length) continue;
    md += `## ${v} (${list.length})\n\n`;
    for (const c of list) {
      const prog = withProgress.has(c.id) ? ' ⚠️has-progress' : '';
      md += `- **${c.french}**${c.corrected ? ` → ${c.corrected}` : ''} — ${c.reason}${prog}\n`;
    }
    md += `\n`;
  }
  if (borderline.length) {
    md += `## borderline — kept, eyeball if you want (${borderline.length})\n\n`;
    for (const b of borderline) md += `- ${b.french} [${b.verdict}] — ${b.reason}\n`;
  }
  writeFileSync('c2-junk-report.md', md, 'utf8');
  console.log(`\nScan-only. Report → apps/api/c2-junk-report.md. Curate by hand before deleting — the list still contains real words.`);
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => process.exit(0));
