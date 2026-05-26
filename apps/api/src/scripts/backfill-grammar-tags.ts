/**
 * Backfill words.grammar_tag for every active global word that doesn't yet
 * have one. The tag links a word to a grammar topic — when set, the topic
 * page shows a "practice this topic's vocabulary" CTA pulling exactly those
 * words. Today only ~71 words are tagged (hand-curated in seeds); we want
 * coverage close to ~100% so the CTA stops being a rarity.
 *
 * How it works:
 *  1. Pulls all grammar_topics → slugs + titles (RU + FR). This is the
 *     allowed tag vocabulary; we never invent new tags.
 *  2. Pulls every active GLOBAL word with grammar_tag IS NULL.
 *  3. Sends batches of 30 words to gpt-4o-mini with the topic list and
 *     asks for a tag per word, or "null" if no topic clearly applies. The
 *     model is constrained to the closed set of slugs we provide.
 *  4. Writes results back one UPDATE per word.
 *
 * Idempotent — only touches NULL rows. Cost: ~3800 words / 30-batch × ~$0.0001
 * per call ≈ $0.05 total.
 *
 * Run:
 *   $env:DATABASE_URL   = (railway variables --service french-app --json | ConvertFrom-Json).DATABASE_URL
 *   $env:OPENAI_API_KEY = (railway variables --service french-app --json | ConvertFrom-Json).OPENAI_API_KEY
 *   cd apps/api
 *   npx tsx src/scripts/backfill-grammar-tags.ts
 */
import 'dotenv/config';
import { and, eq, isNull, sql } from 'drizzle-orm';
import OpenAI from 'openai';
import { db } from '../db/index.js';
import { words, grammarTopics } from '../db/schema/index.js';

const openai = new OpenAI({ apiKey: process.env['OPENAI_API_KEY'] });
const CHUNK = 30;
const SLEEP_MS = 200;

interface TopicLite { slug: string; titleRu: string; titleFr: string; category: string }
interface WordLite { id: string; french: string; translation: string; partOfSpeech: string; level: string }

function buildPrompt(topics: TopicLite[]): string {
  const lines = topics.map(
    (t) => `  - "${t.slug}" — ${t.titleRu} (${t.titleFr}) [category: ${t.category}]`,
  );
  return [
    'You are a French linguistics assistant. Given a JSON array of French words,',
    'assign each to ONE grammar topic slug from the allowed list, or null if no',
    'topic clearly applies. The tag is the topic that this word PRIMARILY illustrates',
    'as a learner example.',
    '',
    'Rules:',
    '- Use a slug ONLY from the allowed list below. Never invent new slugs.',
    '- Prefer specificity: if a word is a question word, tag "mots-interrogatifs"',
    '  rather than a generic "pronouns-personal".',
    '- Reflexive verbs → "reflexive-verbs". Modal verbs (pouvoir, vouloir, devoir,',
    '  falloir) → "verbs-modal" if present; otherwise their tense topic.',
    '- For nouns: tag the gender/plural topic ONLY if the word teaches that rule',
    '  specifically (rare). Most common nouns get null.',
    '- For adjectives that are colours: "colors-adjectives" if present, else null.',
    '- Numbers → numbers topic if present.',
    '- If no topic fits clearly, use null. Do NOT force-fit — null is fine.',
    '',
    'Allowed topic slugs:',
    ...lines,
    '',
    'Return JSON {"tags":[...]} with one entry per input word, in the SAME ORDER',
    'as input. Each entry is either a slug string from the list above, or null.',
    'Return ONLY the JSON object.',
  ].join('\n');
}

interface AiResponse { tags: (string | null)[] }

async function aiTag(systemPrompt: string, batch: WordLite[]): Promise<(string | null)[]> {
  const userMsg = JSON.stringify(
    batch.map((w) => ({
      french: w.french,
      translation: w.translation,
      pos: w.partOfSpeech,
      level: w.level,
    })),
  );
  const resp = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    response_format: { type: 'json_object' },
    temperature: 0,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMsg },
    ],
  });
  const raw = resp.choices[0]?.message?.content ?? '{}';
  const parsed = JSON.parse(raw) as AiResponse;
  if (!Array.isArray(parsed.tags) || parsed.tags.length !== batch.length) {
    throw new Error(`length mismatch: expected ${batch.length}, got ${parsed.tags?.length}`);
  }
  return parsed.tags.map((t) => {
    if (t === null || t === undefined) return null;
    if (typeof t !== 'string') return null;
    const s = t.trim();
    if (!s || s === 'null') return null;
    return s.slice(0, 100);
  });
}

async function main() {
  // 1. Topics (the allowed slug list)
  const topicRows = await db
    .select({
      slug: grammarTopics.slug,
      titleRu: grammarTopics.titleRu,
      titleFr: grammarTopics.titleFr,
      category: grammarTopics.category,
    })
    .from(grammarTopics);

  const allowedSlugs = new Set(topicRows.map((t) => t.slug));
  console.log(`Topics: ${topicRows.length} (allowed slugs)`);

  // 2. Words missing a tag (global only — we never touch user-private words)
  const untagged = await db
    .select({
      id: words.id,
      french: words.french,
      translation: words.translation,
      partOfSpeech: words.partOfSpeech,
      level: words.level,
    })
    .from(words)
    .where(
      and(
        isNull(words.grammarTag),
        eq(words.isActive, true),
        isNull(words.createdByUserId),
      ),
    );

  console.log(`Words without grammar_tag: ${untagged.length}`);
  if (untagged.length === 0) {
    console.log('Nothing to do.');
    return;
  }

  const systemPrompt = buildPrompt(topicRows);

  let tagged = 0;
  let nulled = 0;
  let invalid = 0;
  let failedBatches = 0;

  for (let i = 0; i < untagged.length; i += CHUNK) {
    const batch = untagged.slice(i, i + CHUNK);
    try {
      const tags = await aiTag(systemPrompt, batch);
      for (let j = 0; j < batch.length; j++) {
        const w = batch[j]!;
        const tag = tags[j] ?? null;
        if (tag === null) {
          // Mark visited with empty string? No — leave NULL so re-runs can
          // retry on new topic additions. Just count and move on.
          nulled++;
          continue;
        }
        if (!allowedSlugs.has(tag)) {
          invalid++;
          continue;
        }
        await db.update(words).set({ grammarTag: tag }).where(eq(words.id, w.id));
        tagged++;
      }
      console.log(
        `  [${i}/${untagged.length}] tagged=${tagged} null=${nulled} invalid=${invalid}`,
      );
    } catch (err) {
      failedBatches++;
      console.error(`  batch failed:`, err instanceof Error ? err.message : err);
    }
    if (i + CHUNK < untagged.length) await new Promise((r) => setTimeout(r, SLEEP_MS));
  }

  // Final coverage report
  const totalActive = await db
    .select({ n: sql<number>`count(*)` })
    .from(words)
    .where(and(eq(words.isActive, true), isNull(words.createdByUserId)));
  const tagCount = await db
    .select({ n: sql<number>`count(*)` })
    .from(words)
    .where(and(
      eq(words.isActive, true),
      isNull(words.createdByUserId),
      sql`${words.grammarTag} IS NOT NULL`,
    ));

  const total = Number(totalActive[0]?.n ?? 0);
  const withTag = Number(tagCount[0]?.n ?? 0);
  const pct = total > 0 ? ((withTag / total) * 100).toFixed(1) : '0';
  console.log(
    `\nDone. New tags: ${tagged}, null left: ${nulled}, invalid (ignored): ${invalid}, failed batches: ${failedBatches}.`,
  );
  console.log(`Coverage: ${withTag}/${total} (${pct}%) active global words have a grammar_tag.`);
}

main()
  .catch((err) => { console.error(err); process.exit(1); })
  .finally(() => process.exit(0));
