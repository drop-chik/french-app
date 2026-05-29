import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import {
  getTopics,
  getTopic,
  getExercises,
  checkAnswer,
  submitTopicResults,
} from './grammar.service.js';
import { recordAction } from '../achievements/achievements.service.js';
import { XP_REWARDS } from '../achievements/xp.js';
import { authorizedSecurity, langQuery } from '../../openapi/schemas.js';
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
    {
      preHandler: [fastify.authenticate],
      schema: {
        tags: ['grammar'],
        summary: 'List grammar topics with user progress',
        security: authorizedSecurity,
        querystring: {
          type: 'object',
          properties: {
            level: { type: 'string', enum: ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] },
            lang:  { type: 'string', enum: ['ru', 'en'], default: 'ru' },
          },
        },
      },
    },
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
    {
      preHandler: [fastify.authenticate],
      schema: {
        tags: ['grammar'],
        summary: 'Topic detail (theory blocks + metadata)',
        security: authorizedSecurity,
        params: { type: 'object', properties: { slug: { type: 'string' } } },
        querystring: langQuery,
      },
    },
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
    {
      preHandler: [fastify.authenticate],
      schema: {
        tags: ['grammar'],
        summary: 'Exercises for a topic',
        security: authorizedSecurity,
        params: { type: 'object', properties: { slug: { type: 'string' } } },
        querystring: langQuery,
      },
    },
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
    {
      preHandler: [fastify.authenticate],
      schema: {
        tags: ['grammar'],
        summary: 'Check one exercise answer',
        security: authorizedSecurity,
        params: { type: 'object', properties: { id: { type: 'string', format: 'uuid' } } },
        querystring: langQuery,
      },
    },
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
    {
      preHandler: [fastify.authenticate],
      schema: {
        tags: ['grammar'],
        summary: 'Submit topic results (updates progress + awards XP)',
        description: 'Score >= 70% awards GRAMMAR_TOPIC_DONE XP, otherwise GRAMMAR_EXERCISE.',
        security: authorizedSecurity,
        params: { type: 'object', properties: { slug: { type: 'string' } } },
        body: {
          type: 'object',
          required: ['score', 'total'],
          properties: {
            score: { type: 'integer', minimum: 0 },
            total: { type: 'integer', minimum: 1 },
          },
        },
      },
    },
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

      // XP only when the topic is completed (high score)
      const xpDelta = parsed.data.score >= parsed.data.total * 0.7
        ? XP_REWARDS.GRAMMAR_TOPIC_DONE
        : XP_REWARDS.GRAMMAR_EXERCISE;
      const action = await recordAction(fastify.db, request.user.userId, xpDelta);

      reply.send({
        ...result,
        xp: { gained: xpDelta, total: action.totalXp, level: action.level, leveledUp: action.leveledUp },
        unlocked: action.newlyUnlocked,
      });
    },
  );
};

export default grammarRoutes;
