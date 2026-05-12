import type { FastifyPluginAsync } from 'fastify';
import {
  getProfile,
  updateProfile,
  updatePassword,
  updateAvatar,
  getStats,
  getCharts,
  getStreak,
  repairStreak,
  getHomeData,
  getLevelsProgress,
} from './profile.service.js';
import { authorizedSecurity, errorSchema, userSchema } from '../../openapi/schemas.js';

const profileRoutes: FastifyPluginAsync = async (fastify) => {
  // GET /profile
  fastify.get('/', {
    preHandler: [fastify.authenticate],
    schema: {
      tags: ['profile'],
      summary: 'Current user profile',
      security: authorizedSecurity,
      response: { 200: userSchema, 404: errorSchema },
    },
  }, async (request, reply) => {
    const { userId } = request.user;
    try {
      const profile = await getProfile(fastify.db, userId);
      reply.send(profile);
    } catch {
      reply.status(404).send({ error: 'User not found' });
    }
  });

  // PATCH /profile
  fastify.patch('/', {
    preHandler: [fastify.authenticate],
    schema: {
      tags: ['profile'],
      summary: 'Update profile (name, email, uiLanguage, daily session limits)',
      security: authorizedSecurity,
      body: {
        type: 'object',
        properties: {
          name:                 { type: 'string', minLength: 1 },
          email:                { type: 'string', format: 'email' },
          uiLanguage:           { type: 'string', enum: ['ru', 'en'] },
          dailyNewWordsLimit:   { type: 'integer', minimum: 1, maximum: 100 },
          dailyDueWordsLimit:   { type: 'integer', minimum: 1, maximum: 200 },
        },
      },
      response: { 200: userSchema, 409: errorSchema },
    },
  }, async (request, reply) => {
    const { userId } = request.user;
    const body = request.body as {
      name?: string;
      email?: string;
      uiLanguage?: string;
      dailyNewWordsLimit?: number;
      dailyDueWordsLimit?: number;
    };
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

  // PATCH /profile/password
  fastify.patch('/password', {
    preHandler: [fastify.authenticate],
    schema: {
      tags: ['profile'],
      summary: 'Change password',
      security: authorizedSecurity,
      body: {
        type: 'object',
        required: ['currentPassword', 'newPassword'],
        properties: {
          currentPassword: { type: 'string' },
          newPassword:     { type: 'string', minLength: 8 },
        },
      },
      response: {
        200: { type: 'object', properties: { ok: { type: 'boolean' } } },
        400: errorSchema,
        401: errorSchema,
      },
    },
  }, async (request, reply) => {
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

  // POST /profile/avatar
  fastify.post('/avatar', {
    preHandler: [fastify.authenticate],
    schema: {
      tags: ['profile'],
      summary: 'Upload avatar (base64 data URL, max ~300KB)',
      security: authorizedSecurity,
      body: {
        type: 'object',
        required: ['avatar'],
        properties: {
          avatar: { type: 'string', description: 'data:image/...;base64,...' },
        },
      },
      response: {
        200: { type: 'object', properties: { avatarUrl: { type: 'string', nullable: true } } },
        400: errorSchema,
        413: errorSchema,
      },
    },
  }, async (request, reply) => {
    const { userId } = request.user;
    const body = request.body as { avatar: string };
    if (!body.avatar) return reply.status(400).send({ error: 'No avatar provided' });

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

  // GET /profile/stats
  fastify.get('/stats', {
    preHandler: [fastify.authenticate],
    schema: {
      tags: ['profile'],
      summary: 'Learning statistics (words, grammar, listening, week trend)',
      security: authorizedSecurity,
    },
  }, async (request, reply) => {
    const stats = await getStats(fastify.db, request.user.userId);
    reply.send(stats);
  });

  // GET /profile/charts
  fastify.get('/charts', {
    preHandler: [fastify.authenticate],
    schema: {
      tags: ['profile'],
      summary: '90-day activity, weekly accuracy, word-status breakdown',
      security: authorizedSecurity,
    },
  }, async (request, reply) => {
    const charts = await getCharts(fastify.db, request.user.userId);
    reply.send(charts);
  });

  // GET /profile/streak
  fastify.get('/streak', {
    preHandler: [fastify.authenticate],
    schema: {
      tags: ['profile'],
      summary: 'Current streak + last-7-days activity calendar',
      security: authorizedSecurity,
    },
  }, async (request, reply) => {
    const result = await getStreak(fastify.db, request.user.userId);
    reply.send(result);
  });

  // POST /profile/streak/repair
  fastify.post('/streak/repair', {
    preHandler: [fastify.authenticate],
    schema: {
      tags: ['profile'],
      summary: 'Use one-time streak repair (30-day cooldown)',
      security: authorizedSecurity,
    },
  }, async (request, reply) => {
    const { userId } = request.user;
    try {
      const result = await repairStreak(fastify.db, userId);
      reply.send(result);
    } catch (err) {
      if (err instanceof Error && err.message === 'REPAIR_COOLDOWN') {
        return reply.status(409).send({ error: 'Streak repair already used in last 30 days' });
      }
      if (err instanceof Error && err.message === 'NO_BROKEN_STREAK') {
        return reply.status(400).send({ error: 'No broken streak to repair' });
      }
      throw err;
    }
  });

  // GET /profile/home
  fastify.get('/home', {
    preHandler: [fastify.authenticate],
    schema: {
      tags: ['profile'],
      summary: 'Aggregated dashboard data (streak + level progress + today plan) in one call',
      security: authorizedSecurity,
    },
  }, async (request, reply) => {
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

  // GET /profile/levels-progress
  fastify.get('/levels-progress', {
    preHandler: [fastify.authenticate],
    schema: {
      tags: ['profile'],
      summary: 'Mastered/total words per CEFR level (A1–B2)',
      security: authorizedSecurity,
    },
  }, async (request, reply) => {
    const levels = await getLevelsProgress(fastify.db, request.user.userId);
    reply.send({ levels });
  });
};

export default profileRoutes;
