/**
 * Backfill reading_texts.word_map so EVERY tokenizable word in every text
 * has a {tr, pos, ipa} entry. Tokenization mirrors the frontend's cleanWord
 * exactly (apps/web/src/pages/reading/ReadingTextPage.tsx:250-263) so the
 * runtime lookup `wordMap[cleanWord(token)]` always hits.
 *
 * Order of resolution per missing key:
 *   1. words.french table — exact lowercased match, free.
 *   2. gpt-4o-mini batched at 15 keys per request — handles inflections,
 *      contractions, irregular verbs, proper nouns. ~$0.05-0.15 total.
 *
 * Also "tops up" entries that exist but are missing fields (no tr, no ipa).
 *
 * Idempotent — re-runs are safe and cheap (only fills genuine gaps).
 *
 * Run:
 *   $env:DATABASE_URL = (railway variables --service french-app --json | ConvertFrom-Json).DATABASE_URL
 *   $env:OPENAI_API_KEY = (railway variables --service french-app --json | ConvertFrom-Json).OPENAI_API_KEY
 *   cd apps/api
 *   npx tsx src/scripts/backfill-reading-wordmap.ts
 */
import 'dotenv/config';
import { eq, inArray } from 'drizzle-orm';
import OpenAI from 'openai';
import { db } from '../db/index.js';
import { readingTexts, words } from '../db/schema/index.js';

const openai = new OpenAI({ apiKey: process.env['OPENAI_API_KEY'] });
// 15 is the sweet spot. The model occasionally drops/adds an item in larger
// chunks (length mismatch → whole chunk lost). 15 keeps the failure rate
// low; if anything still slips through, re-run picks up only the
// stragglers — and a CHUNK=2 or =1 sweep handles the residual stubborn
// tokens (we observed ~10/2500 cases needing the smaller-chunk fallback).
// Drops to 5 if env asks for it — used by tail-end re-runs to chip away at
// the few chunks that keep failing at 15 due to the model adding N+1 items.
const CHUNK = Number(process.env['CHUNK']) || 15;
const SLEEP_MS = 200;
// --report: measure gaps only (no words-table lookup, no AI, no writes).
// Used to verify coverage before/after a real run.
const REPORT_ONLY = process.argv.includes('--report');

// Mirror SKIP_TOKEN + cleanWord from ReadingTextPage.tsx exactly.
const SKIP_TOKEN = /^[\d\s.,!?;:()\[\]«»""''—–\-]+$/;

function cleanWord(token: string): string {
  return token
    .toLowerCase()
    .replace(/^[«»""''.,!?;:()[\]—–\-]+/, '')
    .replace(/[«»""''.,!?;:()[\]—–\-]+$/, '')
    .replace(/^qu'/i, '')
    .replace(/^[lLdD]'/, '')
    .replace(/^[mM]'/, '')
    .replace(/^[sS]'/, '')
    .replace(/^[nN]'/, '')
    .replace(/^[jJ]'/, '')
    .replace(/^[cC]'/, '');
}

function tokenize(content: string): Set<string> {
  const out = new Set<string>();
  for (const raw of content.split(/\s+/)) {
    if (!raw) continue;
    if (SKIP_TOKEN.test(raw)) continue;
    const clean = cleanWord(raw);
    if (clean && clean.length >= 1) out.add(clean);
  }
  return out;
}

interface Entry { tr: string; tr_en?: string | null; pos: string; ipa?: string | null }
interface AiItem { tr: string; tr_en: string; pos: string; ipa: string }

const SYSTEM_PROMPT =
  'You are a trilingual French↔Russian↔English dictionary that also gives IPA. ' +
  'Given a JSON array of French tokens (words, conjugated forms, particles, or proper nouns), ' +
  'return JSON {"items":[...]} where each entry has: ' +
  ' tr — concise Russian translation (1-4 words); for conjugated verbs include the person hint, e.g. "(я) имею"; ' +
  ' tr_en — concise English translation (1-4 words); for conjugated verbs include the person hint, e.g. "(I) have"; ' +
  ' pos — slug from {verb, noun, adjective, adverb, pronoun, preposition, conjunction, determiner, number, interjection, expression, proper}; ' +
  ' ipa — modern Parisian IPA transcription, no slashes, ≤30 chars. ' +
  'For PROPER NOUNS (city/person names like "Léo", "Bordeaux"): pos="proper", tr/tr_en = the name spelled naturally in each language (e.g. "Léo" → tr "Лео" / tr_en "Léo", "Bordeaux" → tr "Бордо" / tr_en "Bordeaux"). ' +
  'For very common particles ("a", "à", "et", "ou", "ne", "pas"): give the natural translation (et → tr "и" / tr_en "and", ne → tr "не" / tr_en "not") and pos="conjunction"/"adverb"/etc. ' +
  'Length must match input. Return ONLY the JSON.';

async function aiResolve(tokens: string[]): Promise<AiItem[]> {
  const resp = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    response_format: { type: 'json_object' },
    temperature: 0,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: JSON.stringify(tokens) },
    ],
  });
  const raw = resp.choices[0]?.message?.content ?? '{}';
  const parsed = JSON.parse(raw) as { items: AiItem[] };
  if (!Array.isArray(parsed.items) || parsed.items.length !== tokens.length) {
    throw new Error(`length mismatch: expected ${tokens.length}, got ${parsed.items?.length}`);
  }
  return parsed.items.map((it) => ({
    tr:    String(it.tr    ?? '').trim().slice(0, 200),
    tr_en: String(it.tr_en ?? '').trim().slice(0, 200),
    pos:   String(it.pos   ?? '').trim().slice(0, 30),
    ipa:   String(it.ipa   ?? '').trim().slice(0, 30),
  }));
}

async function main() {
  const texts = await db
    .select({
      id: readingTexts.id,
      slug: readingTexts.slug,
      contentFr: readingTexts.contentFr,
      wordMap: readingTexts.wordMap,
    })
    .from(readingTexts)
    .where(eq(readingTexts.isActive, true));

  console.log(`Texts: ${texts.length}`);

  let totalFromDb = 0;
  let totalFromAi = 0;
  let totalTopped = 0;
  let totalFailed = 0;

  for (const t of texts) {
    const tokenSet = tokenize(t.contentFr);
    const wm = (t.wordMap ?? {}) as Record<string, Entry>;
    const existingKeys = new Set(Object.keys(wm).map((k) => k.toLowerCase()));

    // missing — keys in text but not in wordMap (or no entry at all)
    const missing: string[] = [];
    for (const key of tokenSet) {
      if (!existingKeys.has(key)) missing.push(key);
    }

    // incomplete — entries present but missing a TRANSLATION (tr or tr_en).
    // Deliberately NOT triggered by a missing `ipa`: IPA is optional, runtime
    // already tops it up from the words table (getTextBySlug), and for
    // acronyms / brands / proper names (IA, Instagram, Alain) the model
    // legitimately returns no IPA — flagging those would re-call AI on every
    // run and break idempotency.
    const incomplete: string[] = [];
    for (const [k, v] of Object.entries(wm)) {
      const needsTr   = !v.tr    || v.tr.trim() === '';
      const needsTrEn = !v.tr_en || v.tr_en.trim() === '';
      if (needsTr || needsTrEn) incomplete.push(k);
    }

    if (missing.length === 0 && incomplete.length === 0) {
      if (!REPORT_ONLY) console.log(`  ${t.slug}: ok (nothing to do)`);
      continue;
    }

    if (REPORT_ONLY) {
      totalFromDb += missing.length;       // reuse counter as "missing" tally
      totalTopped += incomplete.length;    // reuse counter as "incomplete" tally
      console.log(`  ${t.slug.padEnd(36)} missing ${String(missing.length).padStart(4)}   incomplete ${String(incomplete.length).padStart(4)}`);
      continue;
    }

    // 1. Try words table for free coverage on missing tokens
    const newMap = { ...wm };
    let fromDb = 0;
    if (missing.length > 0) {
      const wordRows = await db
        .select({
          french: words.french,
          translation: words.translation,
          translationEn: words.translationEn,
          pos: words.partOfSpeech,
          ipa: words.ipa,
        })
        .from(words)
        .where(inArray(words.french, missing));
      const byKey = new Map(wordRows.map((r) => [r.french.toLowerCase(), r]));
      for (const key of missing) {
        const w = byKey.get(key);
        if (w?.translation) {
          newMap[key] = {
            tr: w.translation,
            tr_en: w.translationEn ?? null,
            pos: w.pos ?? 'noun',
            ipa: w.ipa ?? null,
          };
          fromDb++;
        }
      }
    }

    // 2. Anything still missing → AI; also entries from the DB pass that
    // didn't have translation_en (so we still need AI for tr_en).
    const stillMissing = missing.filter((k) => !newMap[k]);
    const missingTrEn = missing.filter((k) => {
      const v = newMap[k];
      return v && (!v.tr_en || v.tr_en.trim() === '');
    });

    // 3. Plus existing incomplete entries → AI (we'll merge fields back)
    const toAi = [...stillMissing, ...missingTrEn, ...incomplete];

    let fromAi = 0;
    let topped = 0;

    for (let i = 0; i < toAi.length; i += CHUNK) {
      const batch = toAi.slice(i, i + CHUNK);
      try {
        const items = await aiResolve(batch);
        for (let j = 0; j < batch.length; j++) {
          const key = batch[j]!;
          const ai = items[j];
          if (!ai) continue;
          if (newMap[key]) {
            // top-up: only fill blanks, keep existing tr/pos/tr_en if set
            const prev = newMap[key];
            const nextTr   = prev.tr && prev.tr.trim() ? prev.tr : ai.tr;
            const nextTrEn = prev.tr_en && prev.tr_en.trim() ? prev.tr_en : (ai.tr_en || null);
            const nextPos  = prev.pos && prev.pos.trim() ? prev.pos : ai.pos;
            const nextIpa  = prev.ipa ?? (ai.ipa || null);
            newMap[key] = { tr: nextTr, tr_en: nextTrEn, pos: nextPos, ipa: nextIpa };
            topped++;
          } else {
            newMap[key] = {
              tr: ai.tr,
              tr_en: ai.tr_en || null,
              pos: ai.pos,
              ipa: ai.ipa || null,
            };
            fromAi++;
          }
        }
      } catch (err) {
        totalFailed += batch.length;
        console.error(`  [${t.slug}] chunk failed:`, err instanceof Error ? err.message : err);
      }
      if (i + CHUNK < toAi.length) await new Promise((r) => setTimeout(r, SLEEP_MS));
    }

    // Persist if anything changed
    if (fromDb > 0 || fromAi > 0 || topped > 0) {
      await db.update(readingTexts).set({ wordMap: newMap }).where(eq(readingTexts.id, t.id));
    }
    totalFromDb += fromDb;
    totalFromAi += fromAi;
    totalTopped += topped;
    console.log(
      `  ${t.slug}: missing=${missing.length} (db ${fromDb}, ai ${fromAi}) ` +
      `+ incomplete topped ${topped}`,
    );
  }

  if (REPORT_ONLY) {
    console.log(`\n--report: missing entries ${totalFromDb}, incomplete entries ${totalTopped}. No writes, no AI.`);
    return;
  }

  console.log(
    `\nDone. From DB: ${totalFromDb}, from AI: ${totalFromAi}, ` +
    `topped-up: ${totalTopped}, failed chunks (entries): ${totalFailed}.`,
  );
}

main()
  .catch((err) => { console.error(err); process.exit(1); })
  .finally(() => process.exit(0));
