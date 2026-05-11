import type { FastifyPluginAsync } from 'fastify';
import {
  collectMetrics,
  getAchievementsForUser,
  getXpSummary,
} from './achievements.service.js';
import { getStreak } from '../profile/profile.service.js';

const achievementsRoutes: FastifyPluginAsync = async (fastify) => {
  // GET /achievements — full catalog + per-user progress + unlock state
  fastify.get('/', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const { userId } = request.user;
    const streak = await getStreak(fastify.db, userId);
    const metrics = await collectMetrics(fastify.db, userId, { streakDays: streak.streak });
    const items = await getAchievementsForUser(fastify.db, userId, metrics);
    const xpSummary = await getXpSummary(fastify.db, userId);
    reply.send({ items, metrics, xp: xpSummary });
  });

  // GET /achievements/xp — lightweight XP summary for the profile header
  fastify.get('/xp', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const summary = await getXpSummary(fastify.db, request.user.userId);
    reply.send(summary);
  });
};

export default achievementsRoutes;
