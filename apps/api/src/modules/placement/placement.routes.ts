import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { placementQuestions, savePlacementResult } from './placement.service.js';
import { users } from '../../db/schema/index.js';
import { authorizedSecurity } from '../../openapi/schemas.js';

const submitSchema = z.object({
  answers: z.record(z.string(), z.string()),
  selfReportedLevel: z.enum(['A1', 'A2', 'B1', 'B2', 'C1', 'C2']).optional(),
});

const placementRoutes: FastifyPluginAsync = async (fastify) => {
  // GET /placement/questions — get all questions including correct answers (for adaptive frontend logic)
  fastify.get(
    '/questions',
    {
      preHandler: [fastify.authenticate],
      schema: {
        tags: ['placement'],
        summary: 'All placement-test questions (with correct answers for adaptive logic)',
        security: authorizedSecurity,
      },
    },
    async (_request, reply) => {
      const questions = placementQuestions.map((q) => ({
        id: q.id,
        level: q.level,
        type: q.type,
        question: q.question,
        options: q.options,
        correct: q.correct,
      }));
      reply.send({ questions });
    },
  );

  // POST /placement/submit — submit answers, get result level
  fastify.post(
    '/submit',
    {
      preHandler: [fastify.authenticate],
      schema: {
        tags: ['placement'],
        summary: 'Submit answers, set user.level + placementTestDone',
        security: authorizedSecurity,
        body: {
          type: 'object',
          required: ['answers'],
          properties: {
            answers: {
              type: 'object',
              description: 'Map of questionId → selected option',
              additionalProperties: { type: 'string' },
            },
            selfReportedLevel: { type: 'string', enum: ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] },
          },
        },
      },
    },
    async (request, reply) => {
      const parsed = submitSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({ error: 'Invalid body' });
      }

      const result = await savePlacementResult(
        fastify.db,
        request.user.userId,
        parsed.data.answers,
        parsed.data.selfReportedLevel,
      );

      reply.send(result);
    },
  );

  // POST /placement/retake — reset placementTestDone so the user can
  // retake the test and update their level
  fastify.post(
    '/retake',
    {
      preHandler: [fastify.authenticate],
      schema: {
        tags: ['placement'],
        summary: 'Reset placementTestDone so the user can take the test again',
        security: authorizedSecurity,
      },
    },
    async (request, reply) => {
      await fastify.db
        .update(users)
        .set({ placementTestDone: false })
        .where(eq(users.id, request.user.userId));
      reply.send({ ok: true });
    },
  );
};

export default placementRoutes;
