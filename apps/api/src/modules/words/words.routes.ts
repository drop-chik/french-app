import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import {
  getStudySession,
  recordAnswer,
  getDictionary,
  getDistractors,
  requestWordImage,
} from './words.service.js';
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
    { preHandler: [fastify.authenticate] },
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
    { preHandler: [fastify.authenticate] },
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

      reply.send({ nextReview: result.nextReview, interval: result.interval });
    },
  );

  // GET /words/dictionary — all learned words
  fastify.get(
    '/dictionary',
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      const query = request.query as Record<string, unknown>;
      const lang = parseLang(query);
      const dict = await getDictionary(fastify.db, request.user.userId, lang);
      reply.send({ words: dict });
    },
  );

  // GET /words/:id/distractors — 3 wrong options for multiple choice
  fastify.get<{ Params: { id: string } }>(
    '/:id/distractors',
    { preHandler: [fastify.authenticate] },
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

  // POST /words/:id/image — request DALL-E image generation
  fastify.post<{ Params: { id: string } }>(
    '/:id/image',
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      const result = await requestWordImage(fastify.db, request.params.id);
      reply.send(result);
    },
  );
};

export default wordsRoutes;
