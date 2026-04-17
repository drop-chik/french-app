import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { placementQuestions, savePlacementResult } from './placement.service.js';

const submitSchema = z.object({
  answers: z.record(z.string(), z.string()),
});

const placementRoutes: FastifyPluginAsync = async (fastify) => {
  // GET /placement/questions — get all test questions (without correct answers)
  fastify.get(
    '/questions',
    { preHandler: [fastify.authenticate] },
    async (_request, reply) => {
      const questions = placementQuestions.map((q) => ({
        id: q.id,
        level: q.level,
        type: q.type,
        question: q.question,
        options: q.options,
        // correct answer NOT sent to client
      }));
      reply.send({ questions });
    },
  );

  // POST /placement/submit — submit answers, get result level
  fastify.post(
    '/submit',
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      const parsed = submitSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({ error: 'Invalid body' });
      }

      const result = await savePlacementResult(
        fastify.db,
        request.user.userId,
        parsed.data.answers,
      );

      reply.send(result);
    },
  );
};

export default placementRoutes;
