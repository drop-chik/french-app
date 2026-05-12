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
      const result = await browseWords(fastify.db, request.user.userId, level, category, lang, limit, offset, q, tag);
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
