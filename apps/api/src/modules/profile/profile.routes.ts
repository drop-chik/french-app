import type { FastifyPluginAsync } from 'fastify';
import {
  getProfile,
  updateProfile,
  updatePassword,
  updateAvatar,
  getStats,
  getCharts,
  getStreak,
  getHomeData,
} from './profile.service.js';

const profileRoutes: FastifyPluginAsync = async (fastify) => {
  // GET /profile — get current user profile
  fastify.get('/', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const { userId } = request.user;
    try {
      const profile = await getProfile(fastify.db, userId);
      reply.send(profile);
    } catch {
      reply.status(404).send({ error: 'User not found' });
    }
  });

  // PATCH /profile — update name, email, uiLanguage
  fastify.patch('/', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const { userId } = request.user;
    const body = request.body as { name?: string; email?: string; uiLanguage?: string };

    try {
      const updated = await updateProfile(fastify.db, userId, body);
      reply.send(updated);
    } catch (err) {
      if (err instanceof Error && err.message === 'EMAIL_TAKEN') {
        return reply.status(409).send({ error: 'Email already in use' });
      }
      throw err;
    }
  });

  // PATCH /profile/password — change password
  fastify.patch('/password', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const { userId } = request.user;
    const body = request.body as { currentPassword: string; newPassword: string };

    if (!body.currentPassword || !body.newPassword || body.newPassword.length < 8) {
      return reply.status(400).send({ error: 'Invalid input' });
    }

    try {
      await updatePassword(fastify.db, userId, body.currentPassword, body.newPassword);
      reply.send({ ok: true });
    } catch (err) {
      if (err instanceof Error && err.message === 'INVALID_CREDENTIALS') {
        return reply.status(401).send({ error: 'Current password is incorrect' });
      }
      throw err;
    }
  });

  // POST /profile/avatar — upload avatar (base64 data URL)
  fastify.post('/avatar', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const { userId } = request.user;
    const body = request.body as { avatar: string };

    if (!body.avatar) {
      return reply.status(400).send({ error: 'No avatar provided' });
    }

    try {
      const result = await updateAvatar(fastify.db, userId, body.avatar);
      reply.send({ avatarUrl: result?.avatarUrl });
    } catch (err) {
      if (err instanceof Error && err.message === 'AVATAR_TOO_LARGE') {
        return reply.status(413).send({ error: 'Avatar too large (max ~300KB)' });
      }
      if (err instanceof Error && err.message === 'INVALID_AVATAR') {
        return reply.status(400).send({ error: 'Invalid image format' });
      }
      throw err;
    }
  });

  // GET /profile/stats — learning statistics
  fastify.get('/stats', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const { userId } = request.user;
    const stats = await getStats(fastify.db, userId);
    reply.send(stats);
  });

  // GET /profile/charts — data for progress charts
  fastify.get('/charts', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const { userId } = request.user;
    const charts = await getCharts(fastify.db, userId);
    reply.send(charts);
  });

  // GET /profile/streak — consecutive days streak + whether user studied today
  fastify.get('/streak', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const { userId } = request.user;
    const result = await getStreak(fastify.db, userId);
    reply.send(result);
  });

  // GET /profile/home — aggregated dashboard data
  fastify.get('/home', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const { userId } = request.user;
    const user = await fastify.db.query.users.findFirst({
      where: (u, { eq }) => eq(u.id, userId),
      columns: { level: true, uiLanguage: true },
    });
    if (!user) return reply.status(404).send({ error: 'User not found' });
    const lang = (user.uiLanguage === 'en' ? 'en' : 'ru') as 'ru' | 'en';
    const data = await getHomeData(fastify.db, userId, user.level, lang);
    reply.send(data);
  });
};

export default profileRoutes;
