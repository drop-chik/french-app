import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import {
  getTexts,
  getTextBySlug,
  saveProgress,
  saveWordToVocab,
  getUserStats,
  translateWord,
} from './reading.service.js';
import { recordAction } from '../achievements/achievements.service.js';
import { XP_REWARDS } from '../achievements/xp.js';
import { authorizedSecurity } from '../../openapi/schemas.js';

const progressSchema = z.object({
  score: z.number().int().min(0),
  totalQuestions: z.number().int().min(1),
  wordsLookedUp: z.array(z.string()).default([]),
  wordsSaved: z.array(z.string()).default([]),
});

const saveWordSchema = z.object({
  word: z.string().min(1).max(100),
});

const readingRoutes: FastifyPluginAsync = async (fastify) => {
  // GET /reading/texts — list all texts (optionally filter by level/topic)
  fastify.get(
    '/texts',
    {
      preHandler: [fastify.authenticate],
      schema: {
        tags: ['reading'],
        summary: 'List reading texts (filterable by level / topic)',
        security: authorizedSecurity,
        querystring: {
          type: 'object',
          properties: {
            level: { type: 'string' },
            topic: { type: 'string' },
          },
        },
      },
    },
    async (request, reply) => {
      const { level, topic } = request.query as { level?: string; topic?: string };
      const texts = await getTexts(fastify.db, request.user.userId, level, topic);
      reply.send({ texts });
    },
  );

  // GET /reading/texts/:slug — get single text with questions and user progress
  fastify.get(
    '/texts/:slug',
    {
      preHandler: [fastify.authenticate],
      schema: {
        tags: ['reading'],
        summary: 'Reading text by slug (content + questions + user progress)',
        security: authorizedSecurity,
        params: { type: 'object', properties: { slug: { type: 'string' } } },
      },
    },
    async (request, reply) => {
      const { slug } = request.params as { slug: string };
      const q = request.query as Record<string, unknown>;
      const lang: 'ru' | 'en' = q['lang'] === 'en' ? 'en' : 'ru';
      const text = await getTextBySlug(fastify.db, request.user.userId, slug, lang);
      if (!text) return reply.status(404).send({ error: 'Text not found' });
      reply.send({ text });
    },
  );

  // POST /reading/progress/:textId — save reading session results
  fastify.post(
    '/progress/:textId',
    {
      preHandler: [fastify.authenticate],
      schema: {
        tags: ['reading'],
        summary: 'Save reading session results (awards 20 XP)',
        security: authorizedSecurity,
        params: { type: 'object', properties: { textId: { type: 'string', format: 'uuid' } } },
        body: {
          type: 'object',
          required: ['score', 'totalQuestions'],
          properties: {
            score:          { type: 'integer', minimum: 0 },
            totalQuestions: { type: 'integer', minimum: 1 },
            wordsLookedUp:  { type: 'array', items: { type: 'string' } },
            wordsSaved:     { type: 'array', items: { type: 'string' } },
          },
        },
      },
    },
    async (request, reply) => {
      const { textId } = request.params as { textId: string };
      const parsed = progressSchema.safeParse(request.body);
      if (!parsed.success) return reply.status(400).send({ error: 'Invalid body' });

      await saveProgress(
        fastify.db,
        request.user.userId,
        textId,
        parsed.data.score,
        parsed.data.totalQuestions,
        parsed.data.wordsLookedUp,
        parsed.data.wordsSaved,
      );

      const action = await recordAction(fastify.db, request.user.userId, XP_REWARDS.READING_DONE);
      reply.send({
        ok: true,
        xp: { gained: XP_REWARDS.READING_DONE, total: action.totalXp, level: action.level, leveledUp: action.leveledUp },
        unlocked: action.newlyUnlocked,
      });
    },
  );

  // POST /reading/words/save — add a word from a text to the user's vocabulary
  fastify.post(
    '/words/save',
    {
      preHandler: [fastify.authenticate],
      schema: {
        tags: ['reading'],
        summary: 'Add a word from a reading text to the user vocabulary',
        security: authorizedSecurity,
        body: {
          type: 'object',
          required: ['word'],
          properties: { word: { type: 'string', minLength: 1, maxLength: 100 } },
        },
      },
    },
    async (request, reply) => {
      const parsed = saveWordSchema.safeParse(request.body);
      if (!parsed.success) return reply.status(400).send({ error: 'Invalid body' });

      const result = await saveWordToVocab(fastify.db, request.user.userId, parsed.data.word);
      reply.send(result);
    },
  );

  // GET /reading/translate?word=xxx — look up a word in the vocabulary DB
  fastify.get(
    '/translate',
    {
      preHandler: [fastify.authenticate],
      schema: {
        tags: ['reading'],
        summary: 'Look up translation for a word seen in a text (popover endpoint)',
        security: authorizedSecurity,
        querystring: {
          type: 'object',
          required: ['word'],
          properties: { word: { type: 'string' } },
        },
      },
    },
    async (request, reply) => {
      const { word, lang } = request.query as { word?: string; lang?: string };
      if (!word) return reply.status(400).send({ error: 'word is required' });
      const effectiveLang: 'ru' | 'en' = lang === 'en' ? 'en' : 'ru';
      const result = await translateWord(fastify.db, word, effectiveLang);
      reply.send({ result });
    },
  );

  // GET /reading/stats — user's reading statistics
  fastify.get(
    '/stats',
    {
      preHandler: [fastify.authenticate],
      schema: {
        tags: ['reading'],
        summary: "User's reading statistics",
        security: authorizedSecurity,
      },
    },
    async (request, reply) => {
      const stats = await getUserStats(fastify.db, request.user.userId);
      reply.send(stats);
    },
  );
};

export default readingRoutes;
