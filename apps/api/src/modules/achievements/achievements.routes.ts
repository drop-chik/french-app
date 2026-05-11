import type { FastifyPluginAsync } from 'fastify';
import {
  collectMetrics,
  getAchievementsForUser,
  getXpSummary,
  checkAndAwardAchievements,
} from './achievements.service.js';
import { getStreak } from '../profile/profile.service.js';

const achievementsRoutes: FastifyPluginAsync = async (fastify) => {
  // GET /achievements — full catalog + per-user progress + unlock state.
  // Visiting this page also acts as a sync point: if any threshold is already
  // met but the unlock row wasn't persisted yet (e.g. metric was bumped through
  // a route that doesn't hook into recordAction), award it now. Idempotent.
  fastify.get('/', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const { userId } = request.user;
    const streak = await getStreak(fastify.db, userId);
    const metrics = await collectMetrics(fastify.db, userId, { streakDays: streak.streak });
    await checkAndAwardAchievements(fastify.db, userId, metrics);
    const items = await getAchievementsForUser(fastify.db, userId, metrics);
    const xpSummary = await getXpSummary(fastify.db, userId);
    reply.send({ items, metrics, xp: xpSummary });
  });

  // GET /achievements/recent?limit=5 — recently unlocked achievements for home/profile widgets
  fastify.get('/recent', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const { userId } = request.user;
    const limit = Math.min(20, Math.max(1, parseInt(String((request.query as { limit?: string }).limit ?? '5'), 10) || 5));
    // Auto-award before returning so widgets never miss freshly-earned ones either.
    const streak = await getStreak(fastify.db, userId);
    const metrics = await collectMetrics(fastify.db, userId, { streakDays: streak.streak });
    await checkAndAwardAchievements(fastify.db, userId, metrics);
    const items = await getAchievementsForUser(fastify.db, userId, metrics);
    const recent = items
      .filter((i) => i.unlocked && i.unlockedAt)
      .sort((a, b) => new Date(b.unlockedAt!).getTime() - new Date(a.unlockedAt!).getTime())
      .slice(0, limit);
    reply.send({ items: recent });
  });

  // GET /achievements/xp — lightweight XP summary for the profile header
  fastify.get('/xp', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const summary = await getXpSummary(fastify.db, request.user.userId);
    reply.send(summary);
  });
};

export default achievementsRoutes;
