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

  // GET /words/dictionary — learned words with pagination (?offset=0&limit=200)
  fastify.get(
    '/dictionary',
    { preHandler: [fastify.authenticate] },
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

  // GET /words/categories?level=B2 — distinct categories with counts + mastered count
  fastify.get(
    '/categories',
    { preHandler: [fastify.authenticate] },
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
    { preHandler: [fastify.authenticate] },
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
      const q = query.q ? String(query.q).trim() : null;
      const offset = Math.max(0, parseInt(String(query.offset ?? '0'), 10) || 0);
      const limit = Math.min(500, Math.max(1, parseInt(String(query.limit ?? '100'), 10) || 100));
      const result = await browseWords(fastify.db, request.user.userId, level, category, lang, limit, offset, q);
      reply.send(result);
    },
  );

  // POST /words/:id/mark — manually mark word as study or mastered
  fastify.post<{ Params: { id: string } }>(
    '/:id/mark',
    { preHandler: [fastify.authenticate] },
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
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      const result = await requestWordImage(fastify.db, request.params.id);
      reply.send(result);
    },
  );
};

export default wordsRoutes;
