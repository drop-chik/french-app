import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import {
  getTopics,
  getTopic,
  getExercises,
  checkAnswer,
  submitTopicResults,
} from './grammar.service.js';
import type { LanguageLevel } from '@french-app/shared-types';

const answerSchema = z.object({
  answer: z.unknown(),
});

const submitSchema = z.object({
  score: z.number().int().min(0),
  total: z.number().int().min(1),
});

function parseLang(query: Record<string, unknown>): 'ru' | 'en' {
  return query.lang === 'en' ? 'en' : 'ru';
}

const grammarRoutes: FastifyPluginAsync = async (fastify) => {
  // GET /grammar/topics?level=A1&lang=en
  fastify.get(
    '/topics',
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      const query = request.query as Record<string, unknown>;
      const level = ((query.level as string) ?? 'A1') as LanguageLevel;
      const lang = parseLang(query);

      const user = await fastify.db.query.users.findFirst({
        where: (u, { eq }) => eq(u.id, request.user.userId),
      });
      if (!user) return reply.status(404).send({ error: 'User not found' });

      const topics = await getTopics(fastify.db, request.user.userId, level, lang);
      reply.send({ topics });
    },
  );

  // GET /grammar/topics/:slug?lang=en — topic detail with content
  fastify.get<{ Params: { slug: string } }>(
    '/topics/:slug',
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      const query = request.query as Record<string, unknown>;
      const lang = parseLang(query);
      const topic = await getTopic(fastify.db, request.user.userId, request.params.slug, lang);
      if (!topic) return reply.status(404).send({ error: 'Topic not found' });
      reply.send({ topic });
    },
  );

  // GET /grammar/topics/:slug/exercises?lang=en
  fastify.get<{ Params: { slug: string } }>(
    '/topics/:slug/exercises',
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      const query = request.query as Record<string, unknown>;
      const lang = parseLang(query);
      const exercises = await getExercises(fastify.db, request.params.slug, lang);
      if (!exercises) return reply.status(404).send({ error: 'Topic not found' });
      reply.send({ exercises });
    },
  );

  // POST /grammar/exercises/:id/check?lang=en — check a single answer
  fastify.post<{ Params: { id: string } }>(
    '/exercises/:id/check',
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      const parsed = answerSchema.safeParse(request.body);
      if (!parsed.success) return reply.status(400).send({ error: 'Invalid body' });

      const query = request.query as Record<string, unknown>;
      const lang = parseLang(query);

      const result = await checkAnswer(
        fastify.db,
        request.user.userId,
        request.params.id,
        parsed.data.answer,
        lang,
      );

      reply.send(result);
    },
  );

  // POST /grammar/topics/:slug/submit — submit exercise session results
  fastify.post<{ Params: { slug: string } }>(
    '/topics/:slug/submit',
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      const parsed = submitSchema.safeParse(request.body);
      if (!parsed.success) return reply.status(400).send({ error: 'Invalid body' });

      const result = await submitTopicResults(
        fastify.db,
        request.user.userId,
        request.params.slug,
        parsed.data.score,
        parsed.data.total,
      );

      reply.send(result);
    },
  );
};

export default grammarRoutes;
