import type { FastifyPluginAsync } from 'fastify';
import { eq } from 'drizzle-orm';
import { users } from '../../db/schema/index.js';
import { generateLevelTestQuestions, submitLevelTest } from './level-test.service.js';
import { getCurrentLevelMastery } from '../profile/promotion.service.js';
import { authorizedSecurity } from '../../openapi/schemas.js';

const ORDER = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as const;
type Level = typeof ORDER[number];
const MIN_MASTERY_TO_TEST = 0.4; // 40% mastered before they can test

const levelTestRoutes: FastifyPluginAsync = async (fastify) => {
  // GET /progression/level-test/start — returns 15 random questions
  // covering the user's current level (~70%) + next level (~30%).
  // Gated by minimum mastery so beginners can't spam the endpoint.
  fastify.get('/start', {
    preHandler: [fastify.authenticate],
    config: { rateLimit: { max: 10, timeWindow: '1 hour' } },
    schema: {
      tags: ['progression'],
      summary: 'Get a randomised level-up test (15 questions)',
      security: authorizedSecurity,
    },
  }, async (request, reply) => {
    const [user] = await fastify.db.select({ level: users.level }).from(users).where(eq(users.id, request.user.userId));
    if (!user) return reply.status(404).send({ error: 'User not found' });
    if (!ORDER.includes(user.level as Level)) return reply.status(400).send({ error: 'Invalid current level' });
    if (user.level === 'C2') return reply.status(400).send({ error: 'Already at C2 — no further level to test for' });

    const mastery = await getCurrentLevelMastery(fastify.db, request.user.userId);
    if (mastery && mastery.ratio < MIN_MASTERY_TO_TEST) {
      return reply.status(403).send({
        error: 'Not enough mastery yet',
        message: `Reach ${Math.round(MIN_MASTERY_TO_TEST * 100)}% mastery on ${user.level} before testing — currently at ${Math.round(mastery.ratio * 100)}%.`,
        currentRatio: mastery.ratio,
        threshold: MIN_MASTERY_TO_TEST,
      });
    }

    const questions = generateLevelTestQuestions(user.level as Level);
    reply.send({
      questions,
      fromLevel: user.level,
      passThreshold: 0.7,
    });
  });

  // POST /progression/level-test/submit — { answers: { qid: option } }
  fastify.post<{ Body: { answers: Record<string, string> } }>('/submit', {
    preHandler: [fastify.authenticate],
    config: { rateLimit: { max: 20, timeWindow: '1 hour' } },
    schema: {
      tags: ['progression'],
      summary: 'Submit a level-up test; promotes if score >= 70%',
      security: authorizedSecurity,
      body: {
        type: 'object',
        required: ['answers'],
        properties: {
          answers: { type: 'object', additionalProperties: { type: 'string' } },
        },
      },
    },
  }, async (request, reply) => {
    const answers = request.body?.answers ?? {};
    if (typeof answers !== 'object' || Object.keys(answers).length === 0) {
      return reply.status(400).send({ error: 'answers required' });
    }
    const result = await submitLevelTest(fastify.db, request.user.userId, answers);
    reply.send(result);
  });
};

export default levelTestRoutes;
