import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import {
  getTexts,
  getTextBySlug,
  saveProgress,
  saveWordToVocab,
  getUserStats,
} from './reading.service.js';

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
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      const { level, topic } = request.query as { level?: string; topic?: string };
      const texts = await getTexts(fastify.db, request.user.userId, level, topic);
      reply.send({ texts });
    },
  );

  // GET /reading/texts/:slug — get single text with questions and user progress
  fastify.get(
    '/texts/:slug',
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      const { slug } = request.params as { slug: string };
      const text = await getTextBySlug(fastify.db, request.user.userId, slug);
      if (!text) return reply.status(404).send({ error: 'Text not found' });
      reply.send({ text });
    },
  );

  // POST /reading/progress/:textId — save reading session results
  fastify.post(
    '/progress/:textId',
    { preHandler: [fastify.authenticate] },
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
      reply.send({ ok: true });
    },
  );

  // POST /reading/words/save — add a word from a text to the user's vocabulary
  fastify.post(
    '/words/save',
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      const parsed = saveWordSchema.safeParse(request.body);
      if (!parsed.success) return reply.status(400).send({ error: 'Invalid body' });

      const result = await saveWordToVocab(fastify.db, request.user.userId, parsed.data.word);
      reply.send(result);
    },
  );

  // GET /reading/stats — user's reading statistics
  fastify.get(
    '/stats',
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      const stats = await getUserStats(fastify.db, request.user.userId);
      reply.send(stats);
    },
  );
};

export default readingRoutes;
