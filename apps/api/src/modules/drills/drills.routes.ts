import type { FastifyPluginAsync } from 'fastify';
import { getDrills, getDrillSession, submitDrillSession, generateInfiniteQuestions } from './drills.service.js';

function parseLang(query: Record<string, unknown>): 'ru' | 'en' {
  return query.lang === 'en' ? 'en' : 'ru';
}

const drillsRoutes: FastifyPluginAsync = async (fastify) => {
  // GET /drills?lang=ru
  fastify.get('/', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const query = request.query as Record<string, unknown>;
    const lang = parseLang(query);
    const drills = await getDrills(fastify.db, request.user.userId, lang);
    reply.send({ drills });
  });

  // GET /drills/:slug?lang=ru
  fastify.get<{ Params: { slug: string } }>(
    '/:slug',
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      const query = request.query as Record<string, unknown>;
      const lang = parseLang(query);
      const session = await getDrillSession(fastify.db, request.params.slug, request.user.userId, lang);
      if (!session) return reply.status(404).send({ error: 'Drill not found' });
      reply.send({ drill: session });
    },
  );

  // POST /drills/:slug/infinite — generate AI questions
  fastify.post<{ Params: { slug: string } }>(
    '/:slug/infinite',
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      const questions = await generateInfiniteQuestions(fastify.db, request.params.slug);
      if (!questions) return reply.status(404).send({ error: 'Drill not found or generation failed' });
      reply.send({ questions });
    },
  );

  // POST /drills/:slug/submit
  fastify.post<{ Params: { slug: string }; Body: { answers: Record<string, unknown> } }>(
    '/:slug/submit',
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      const { answers } = request.body;
      if (!answers || typeof answers !== 'object') {
        return reply.status(400).send({ error: 'answers required' });
      }
      const result = await submitDrillSession(
        fastify.db,
        request.user.userId,
        request.params.slug,
        answers,
      );
      if (!result) return reply.status(404).send({ error: 'Drill not found' });
      reply.send(result);
    },
  );
};

export default drillsRoutes;
