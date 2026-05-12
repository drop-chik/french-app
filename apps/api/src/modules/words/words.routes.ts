import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import {
  getStudySession,
  recordAnswer,
  getDictionary,
  getDistractors,
  requestWordImage,
  getCategories,
  browseWords,
  markWord,
  getWordsByGrammarTag,
  getWordsByCategory,
  restartWord,
  getWordDetails,
  bulkApplyAction,
  createUserWord,
  updateUserWord,
  deleteUserWord,
} from './words.service.js';
import { recordAction } from '../achievements/achievements.service.js';
import { XP_REWARDS } from '../achievements/xp.js';
import { authorizedSecurity, errorSchema, langQuery } from '../../openapi/schemas.js';
import type { LanguageLevel } from '@french-app/shared-types';

const gradeSchema = z.object({
  grade: z.number().int().min(0).max(5),
});

function parseLang(query: Record<string, unknown>): 'ru' | 'en' {
  return query.lang === 'en' ? 'en' : 'ru';
}

const wordsRoutes: FastifyPluginAsync = async (fastify) => {
  // GET /words/session — today's study session
  fastify.get(
    '/session',
    {
      preHandler: [fastify.authenticate],
      schema: {
        tags: ['words'],
        summary: "Today's study session (due reviews + up to 20 new words)",
        security: authorizedSecurity,
        querystring: langQuery,
      },
    },
    async (request, reply) => {
      const { userId } = request.user;
      const query = request.query as Record<string, unknown>;
      const lang = parseLang(query);

      // Get user's level
      const user = await fastify.db.query.users.findFirst({
        where: (u, { eq }) => eq(u.id, userId),
      });
      if (!user) return reply.status(404).send({ error: 'User not found' });

      const session = await getStudySession(fastify.db, userId, user.level as LanguageLevel, lang);
      reply.send({ words: session, total: session.length });
    },
  );

  // POST /words/:id/answer — record grade after study
  fastify.post<{ Params: { id: string } }>(
    '/:id/answer',
    {
      preHandler: [fastify.authenticate],
      schema: {
        tags: ['words'],
        summary: 'Record SM-2 grade (0-5), awards XP + checks achievements',
        description: 'Updates SRS state and returns the next-review date. Also awards XP (5 for grade≥3, 1 otherwise) and reports any unlocked achievements.',
        security: authorizedSecurity,
        params: { type: 'object', properties: { id: { type: 'string', format: 'uuid' } } },
        body: {
          type: 'object',
          required: ['grade'],
          properties: { grade: { type: 'integer', minimum: 0, maximum: 5 } },
        },
      },
    },
    async (request, reply) => {
      const parsed = gradeSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({ error: 'Invalid grade' });
      }

      const result = await recordAnswer(
        fastify.db,
        request.user.userId,
        request.params.id,
        parsed.data.grade as 0 | 1 | 2 | 3 | 4 | 5,
      );

      // XP + achievement check (best-effort, never throws)
      const xpDelta = parsed.data.grade >= 3 ? XP_REWARDS.WORD_CORRECT : XP_REWARDS.WORD_INCORRECT;
      const action = await recordAction(fastify.db, request.user.userId, xpDelta);

      reply.send({
        nextReview: result.nextReview,
        interval: result.interval,
        xp: { gained: xpDelta, total: action.totalXp, level: action.level, leveledUp: action.leveledUp },
        unlocked: action.newlyUnlocked,
      });
    },
  );

  // GET /words/dictionary — learned words with pagination (?offset=0&limit=200)
  fastify.get(
    '/dictionary',
    {
      preHandler: [fastify.authenticate],
      schema: {
        tags: ['words'],
        summary: 'Dictionary — all words the user has progress on',
        security: authorizedSecurity,
        querystring: {
          type: 'object',
          properties: {
            lang:   { type: 'string', enum: ['ru', 'en'], default: 'ru' },
            offset: { type: 'integer', minimum: 0, default: 0 },
            limit:  { type: 'integer', minimum: 1, maximum: 500, default: 200 },
          },
        },
      },
    },
    async (request, reply) => {
      const query = request.query as Record<string, unknown>;
      const lang = parseLang(query);
      const offset = Math.max(0, parseInt(String(query.offset ?? '0'), 10) || 0);
      const limit = Math.min(500, Math.max(1, parseInt(String(query.limit ?? '200'), 10) || 200));
      const dict = await getDictionary(fastify.db, request.user.userId, lang, limit, offset);
      reply.send({ words: dict, offset, limit });
    },
  );

  // GET /words/:id/distractors — 3 wrong options for multiple choice
  fastify.get<{ Params: { id: string } }>(
    '/:id/distractors',
    {
      preHandler: [fastify.authenticate],
      schema: {
        tags: ['words'],
        summary: '3 wrong-answer options for multiple-choice mode',
        security: authorizedSecurity,
        params: { type: 'object', properties: { id: { type: 'string', format: 'uuid' } } },
        querystring: langQuery,
      },
    },
    async (request, reply) => {
      const query = request.query as Record<string, unknown>;
      const lang = parseLang(query);

      const word = await fastify.db.query.words.findFirst({
        where: (w, { eq }) => eq(w.id, request.params.id),
      });
      if (!word) return reply.status(404).send({ error: 'Word not found' });

      const distractors = await getDistractors(
        fastify.db,
        word.id,
        word.level as LanguageLevel,
        lang,
      );
      reply.send({ distractors });
    },
  );

  // GET /words/categories?level=B2 — distinct categories with counts + mastered count
  fastify.get(
    '/categories',
    {
      preHandler: [fastify.authenticate],
      schema: {
        tags: ['words'],
        summary: 'Word categories with counts + mastered for the given level',
        security: authorizedSecurity,
        querystring: {
          type: 'object',
          properties: { level: { type: 'string', enum: ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] } },
        },
      },
    },
    async (request, reply) => {
      const query = request.query as Record<string, unknown>;
      const user = await fastify.db.query.users.findFirst({
        where: (u, { eq }) => eq(u.id, request.user.userId),
        columns: { level: true },
      });
      const level = (String(query.level ?? user?.level ?? 'B2')) as LanguageLevel;
      const categories = await getCategories(fastify.db, request.user.userId, level);
      reply.send({ categories });
    },
  );

  // GET /words/browse?level=B2&category=&q=&lang=ru&offset=0&limit=100
  fastify.get(
    '/browse',
    {
      preHandler: [fastify.authenticate],
      schema: {
        tags: ['words'],
        summary: 'Search words — filter by level/category/query',
        description: 'level="all" searches across every CEFR level. q matches against both French and the user-language translation.',
        security: authorizedSecurity,
        querystring: {
          type: 'object',
          properties: {
            level:    { type: 'string', description: 'A1/A2/B1/B2 or "all"' },
            category: { type: 'string' },
            tag:      { type: 'string', description: 'Grammar topic slug — matches words.grammar_tag' },
            q:        { type: 'string' },
            lang:     { type: 'string', enum: ['ru', 'en'], default: 'ru' },
            offset:   { type: 'integer', minimum: 0, default: 0 },
            limit:    { type: 'integer', minimum: 1, maximum: 500, default: 100 },
            sortBy:   { type: 'string', enum: ['alphabet', 'level', 'frequency', 'status', 'recent'], default: 'frequency' },
            statusFilter: { type: 'string', enum: ['all', 'not-started', 'in-progress', 'mastered', 'mine'], default: 'all' },
          },
        },
      },
    },
    async (request, reply) => {
      const query = request.query as Record<string, unknown>;
      const lang = parseLang(query);
      const user = await fastify.db.query.users.findFirst({
        where: (u, { eq }) => eq(u.id, request.user.userId),
        columns: { level: true },
      });
      // level="all" → search across every CEFR level (useful when the user
      // doesn't know which level a word belongs to). Default to the user's level.
      const levelParam = String(query.level ?? user?.level ?? 'B2');
      const level: LanguageLevel | null = levelParam === 'all' ? null : (levelParam as LanguageLevel);
      const category = query.category ? String(query.category) : null;
      const tag = query.tag ? String(query.tag) : null;
      const q = query.q ? String(query.q).trim() : null;
      const offset = Math.max(0, parseInt(String(query.offset ?? '0'), 10) || 0);
      const limit = Math.min(500, Math.max(1, parseInt(String(query.limit ?? '100'), 10) || 100));
      const sortBy = (query.sortBy ? String(query.sortBy) : 'frequency') as
        'alphabet' | 'level' | 'frequency' | 'status' | 'recent';
      const statusFilter = (query.statusFilter ? String(query.statusFilter) : 'all') as
        'all' | 'not-started' | 'in-progress' | 'mastered' | 'mine';
      const result = await browseWords(
        fastify.db, request.user.userId, level, category, lang, limit, offset, q, tag, sortBy, statusFilter,
      );
      reply.send(result);
    },
  );

  // GET /words/by-tag/:tag — words associated with a grammar topic (used by
  // the "practice this topic's vocabulary" button on GrammarTopicPage). Returns
  // the full WordData shape so the existing study modes work unchanged.
  fastify.get<{ Params: { tag: string } }>(
    '/by-tag/:tag',
    {
      preHandler: [fastify.authenticate],
      schema: {
        tags: ['words'],
        summary: 'Words tagged with a grammar topic slug',
        security: authorizedSecurity,
        params: { type: 'object', properties: { tag: { type: 'string' } } },
        querystring: { type: 'object', properties: { lang: { type: 'string', enum: ['ru', 'en'], default: 'ru' } } },
      },
    },
    async (request, reply) => {
      const lang = parseLang(request.query as Record<string, unknown>);
      const tag = request.params.tag;
      const words = await getWordsByGrammarTag(fastify.db, request.user.userId, tag, lang);
      reply.send({ words, total: words.length });
    },
  );

  // GET /words/by-category/:category — words filtered by vocab category
  // (e.g. "food", "verbs_basic") with full WordData + progress
  fastify.get<{ Params: { category: string } }>(
    '/by-category/:category',
    {
      preHandler: [fastify.authenticate],
      schema: {
        tags: ['words'],
        summary: 'Words filtered by vocabulary category',
        security: authorizedSecurity,
        params: { type: 'object', properties: { category: { type: 'string' } } },
        querystring: { type: 'object', properties: { lang: { type: 'string', enum: ['ru', 'en'] } } },
      },
    },
    async (request, reply) => {
      const lang = parseLang(request.query as Record<string, unknown>);
      const result = await getWordsByCategory(fastify.db, request.user.userId, request.params.category, lang);
      reply.send({ words: result, total: result.length });
    },
  );

  // GET /words/:id — full details for the Dictionary modal
  fastify.get<{ Params: { id: string } }>(
    '/:id',
    {
      preHandler: [fastify.authenticate],
      schema: {
        tags: ['words'],
        summary: 'Single word details with progress',
        security: authorizedSecurity,
        params: { type: 'object', properties: { id: { type: 'string', format: 'uuid' } } },
        querystring: { type: 'object', properties: { lang: { type: 'string', enum: ['ru', 'en'] } } },
      },
    },
    async (request, reply) => {
      const lang = parseLang(request.query as Record<string, unknown>);
      const word = await getWordDetails(fastify.db, request.user.userId, request.params.id, lang);
      if (!word) return reply.status(404).send({ error: 'Word not found' });
      reply.send({ word });
    },
  );

  // POST /words — create a custom user-private word
  fastify.post(
    '/',
    {
      preHandler: [fastify.authenticate],
      schema: {
        tags: ['words'],
        summary: 'Create a custom user-private word',
        security: authorizedSecurity,
        body: {
          type: 'object',
          required: ['french', 'translation'],
          properties: {
            french:       { type: 'string', minLength: 1, maxLength: 255 },
            translation:  { type: 'string', minLength: 1, maxLength: 255 },
            level:        { type: 'string', enum: ['A1', 'A2', 'B1', 'B2'] },
            category:     { type: 'string', minLength: 1, maxLength: 100 },
            partOfSpeech: { type: 'string', maxLength: 20 },
            gender:       { type: 'string', enum: ['m', 'f', ''] },
            exampleFr:    { type: 'string', maxLength: 500 },
            exampleRu:    { type: 'string', maxLength: 500 },
          },
        },
      },
    },
    async (request, reply) => {
      const body = request.body as {
        french: string;
        translation: string;
        level?: LanguageLevel;
        category?: string;
        partOfSpeech?: string;
        gender?: string;
        exampleFr?: string;
        exampleRu?: string;
      };
      const created = await createUserWord(fastify.db, request.user.userId, {
        french: body.french,
        translation: body.translation,
        level: body.level,
        category: body.category,
        partOfSpeech: body.partOfSpeech,
        gender: body.gender && body.gender !== '' ? body.gender : null,
        exampleFr: body.exampleFr ?? null,
        exampleRu: body.exampleRu ?? null,
      });
      reply.send({ word: created });
    },
  );

  // PATCH /words/:id — update a custom user-private word (owner only)
  fastify.patch<{ Params: { id: string } }>(
    '/:id',
    {
      preHandler: [fastify.authenticate],
      schema: {
        tags: ['words'],
        summary: 'Update a custom user-private word (owner only)',
        security: authorizedSecurity,
        params: { type: 'object', properties: { id: { type: 'string', format: 'uuid' } } },
        body: {
          type: 'object',
          properties: {
            french:       { type: 'string', minLength: 1, maxLength: 255 },
            translation:  { type: 'string', minLength: 1, maxLength: 255 },
            level:        { type: 'string', enum: ['A1', 'A2', 'B1', 'B2'] },
            category:     { type: 'string', minLength: 1, maxLength: 100 },
            partOfSpeech: { type: 'string', maxLength: 20 },
            gender:       { type: 'string', enum: ['m', 'f', ''] },
            exampleFr:    { type: 'string', maxLength: 500 },
            exampleRu:    { type: 'string', maxLength: 500 },
          },
        },
      },
    },
    async (request, reply) => {
      const body = request.body as {
        french?: string;
        translation?: string;
        level?: LanguageLevel;
        category?: string;
        partOfSpeech?: string;
        gender?: string;
        exampleFr?: string;
        exampleRu?: string;
      };
      try {
        await updateUserWord(fastify.db, request.user.userId, request.params.id, {
          ...(body.french !== undefined && { french: body.french }),
          ...(body.translation !== undefined && { translation: body.translation }),
          ...(body.level !== undefined && { level: body.level }),
          ...(body.category !== undefined && { category: body.category }),
          ...(body.partOfSpeech !== undefined && { partOfSpeech: body.partOfSpeech }),
          ...(body.gender !== undefined && { gender: body.gender === '' ? null : body.gender }),
          ...(body.exampleFr !== undefined && { exampleFr: body.exampleFr }),
          ...(body.exampleRu !== undefined && { exampleRu: body.exampleRu }),
        });
        reply.send({ ok: true });
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed';
        return reply.status(403).send({ error: msg });
      }
    },
  );

  // DELETE /words/:id — delete a custom user-private word (only the owner)
  fastify.delete<{ Params: { id: string } }>(
    '/:id',
    {
      preHandler: [fastify.authenticate],
      schema: {
        tags: ['words'],
        summary: 'Delete a custom user-private word (owner only)',
        security: authorizedSecurity,
        params: { type: 'object', properties: { id: { type: 'string', format: 'uuid' } } },
      },
    },
    async (request, reply) => {
      try {
        await deleteUserWord(fastify.db, request.user.userId, request.params.id);
        reply.send({ ok: true });
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed';
        return reply.status(403).send({ error: msg });
      }
    },
  );

  // POST /words/bulk — apply the same action to many words at once.
  // Body: { action: 'study' | 'mastered' | 'restart', wordIds: string[] }
  fastify.post(
    '/bulk',
    {
      preHandler: [fastify.authenticate],
      schema: {
        tags: ['words'],
        summary: 'Apply an action to up to 200 words at once',
        security: authorizedSecurity,
        body: {
          type: 'object',
          required: ['action', 'wordIds'],
          properties: {
            action: { type: 'string', enum: ['study', 'mastered', 'restart'] },
            wordIds: { type: 'array', items: { type: 'string', format: 'uuid' }, maxItems: 200 },
          },
        },
      },
    },
    async (request, reply) => {
      const body = request.body as { action: 'study' | 'mastered' | 'restart'; wordIds: string[] };
      if (!Array.isArray(body.wordIds) || body.wordIds.length === 0) {
        return reply.status(400).send({ error: 'wordIds must be a non-empty array' });
      }
      const result = await bulkApplyAction(fastify.db, request.user.userId, body.action, body.wordIds);
      reply.send(result);
    },
  );

  // POST /words/:id/restart — reset SRS progress, put back into learning rotation
  fastify.post<{ Params: { id: string } }>(
    '/:id/restart',
    {
      preHandler: [fastify.authenticate],
      schema: {
        tags: ['words'],
        summary: 'Reset SRS progress and bring a mastered word back to learning',
        security: authorizedSecurity,
        params: { type: 'object', properties: { id: { type: 'string', format: 'uuid' } } },
      },
    },
    async (request, reply) => {
      await restartWord(fastify.db, request.user.userId, request.params.id);
      reply.send({ ok: true });
    },
  );

  // POST /words/:id/mark — manually mark word as study or mastered
  fastify.post<{ Params: { id: string } }>(
    '/:id/mark',
    {
      preHandler: [fastify.authenticate],
      schema: {
        tags: ['words'],
        summary: 'Manually mark a word as "study" or "mastered"',
        security: authorizedSecurity,
        params: { type: 'object', properties: { id: { type: 'string', format: 'uuid' } } },
        body: {
          type: 'object',
          required: ['action'],
          properties: { action: { type: 'string', enum: ['study', 'mastered'] } },
        },
      },
    },
    async (request, reply) => {
      const body = request.body as { action?: string };
      if (body.action !== 'study' && body.action !== 'mastered') {
        return reply.status(400).send({ error: 'action must be "study" or "mastered"' });
      }
      await markWord(fastify.db, request.user.userId, request.params.id, body.action);
      reply.send({ ok: true });
    },
  );

  // POST /words/:id/image — request DALL-E image generation
  fastify.post<{ Params: { id: string } }>(
    '/:id/image',
    {
      preHandler: [fastify.authenticate],
      schema: {
        tags: ['words'],
        summary: 'Trigger DALL-E image generation for a word (async)',
        security: authorizedSecurity,
        params: { type: 'object', properties: { id: { type: 'string', format: 'uuid' } } },
      },
    },
    async (request, reply) => {
      const result = await requestWordImage(fastify.db, request.params.id);
      reply.send(result);
    },
  );
};

export default wordsRoutes;
