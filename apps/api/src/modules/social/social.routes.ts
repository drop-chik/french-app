import type { FastifyPluginAsync } from 'fastify';
import { authorizedSecurity, errorSchema } from '../../openapi/schemas.js';
import {
  searchUsers,
  getPublicProfile,
  followUser,
  unfollowUser,
  getFollowing,
  getFollowers,
  getLeaderboard,
  getFeed,
  reactToEvent,
  unreactToEvent,
} from './social.service.js';

const socialRoutes: FastifyPluginAsync = async (fastify) => {
  const guard = { preHandler: [fastify.authenticate] };

  // GET /social/search?q=
  fastify.get(
    '/search',
    {
      ...guard,
      schema: {
        tags: ['social'],
        summary: 'Search users by @tag or name',
        security: authorizedSecurity,
        querystring: {
          type: 'object',
          properties: { q: { type: 'string' } },
        },
      },
    },
    async (request, reply) => {
      const q = String((request.query as Record<string, unknown>).q ?? '');
      const results = await searchUsers(fastify.db, request.user.userId, q);
      reply.send({ results });
    },
  );

  // GET /social/users/:tag — public read-only profile
  fastify.get<{ Params: { tag: string } }>(
    '/users/:tag',
    {
      ...guard,
      schema: {
        tags: ['social'],
        summary: 'Public profile by @tag (read-only progress view)',
        security: authorizedSecurity,
        params: { type: 'object', properties: { tag: { type: 'string' } } },
      },
    },
    async (request, reply) => {
      const profile = await getPublicProfile(
        fastify.db,
        request.user.userId,
        request.params.tag,
      );
      if (!profile) return reply.status(404).send({ error: 'User not found' });
      reply.send(profile);
    },
  );

  // POST /social/follow/:userId
  fastify.post<{ Params: { userId: string } }>(
    '/follow/:userId',
    {
      ...guard,
      schema: {
        tags: ['social'],
        summary: 'Follow a user',
        security: authorizedSecurity,
        params: { type: 'object', properties: { userId: { type: 'string', format: 'uuid' } } },
        response: { 200: { type: 'object' }, 400: errorSchema, 404: errorSchema },
      },
    },
    async (request, reply) => {
      try {
        const result = await followUser(
          fastify.db,
          request.user.userId,
          request.params.userId,
        );
        reply.send(result);
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Follow failed';
        if (msg === 'CANNOT_FOLLOW_SELF') return reply.status(400).send({ error: msg });
        if (msg === 'USER_NOT_FOUND') return reply.status(404).send({ error: msg });
        throw err;
      }
    },
  );

  // DELETE /social/follow/:userId
  fastify.delete<{ Params: { userId: string } }>(
    '/follow/:userId',
    {
      ...guard,
      schema: {
        tags: ['social'],
        summary: 'Unfollow a user',
        security: authorizedSecurity,
        params: { type: 'object', properties: { userId: { type: 'string', format: 'uuid' } } },
      },
    },
    async (request, reply) => {
      const result = await unfollowUser(
        fastify.db,
        request.user.userId,
        request.params.userId,
      );
      reply.send(result);
    },
  );

  // GET /social/following
  fastify.get(
    '/following',
    {
      ...guard,
      schema: {
        tags: ['social'],
        summary: 'Users I follow',
        security: authorizedSecurity,
      },
    },
    async (request, reply) => {
      const users = await getFollowing(fastify.db, request.user.userId);
      reply.send({ users });
    },
  );

  // GET /social/followers
  fastify.get(
    '/followers',
    {
      ...guard,
      schema: {
        tags: ['social'],
        summary: 'Users who follow me',
        security: authorizedSecurity,
      },
    },
    async (request, reply) => {
      const users = await getFollowers(fastify.db, request.user.userId);
      reply.send({ users });
    },
  );

  // GET /social/leaderboard — me + people I follow, ranked by weekly activity
  fastify.get(
    '/leaderboard',
    {
      ...guard,
      schema: {
        tags: ['social'],
        summary: 'Friends leaderboard (words reviewed in the last 7 days)',
        security: authorizedSecurity,
      },
    },
    async (request, reply) => {
      const board = await getLeaderboard(fastify.db, request.user.userId);
      reply.send({ board });
    },
  );

  // GET /social/feed?cursor= — activity of people I follow
  fastify.get(
    '/feed',
    {
      ...guard,
      schema: {
        tags: ['social'],
        summary: 'Activity feed of people I follow (keyset paginated)',
        security: authorizedSecurity,
        querystring: {
          type: 'object',
          properties: { cursor: { type: 'string' } },
        },
      },
    },
    async (request, reply) => {
      const cursor = (request.query as Record<string, unknown>).cursor;
      const result = await getFeed(
        fastify.db,
        request.user.userId,
        cursor ? String(cursor) : undefined,
      );
      reply.send(result);
    },
  );

  // POST /social/feed/:eventId/react
  fastify.post<{ Params: { eventId: string } }>(
    '/feed/:eventId/react',
    {
      ...guard,
      schema: {
        tags: ['social'],
        summary: 'React (👏) to a feed event',
        security: authorizedSecurity,
        params: { type: 'object', properties: { eventId: { type: 'string', format: 'uuid' } } },
        response: { 200: { type: 'object' }, 404: errorSchema },
      },
    },
    async (request, reply) => {
      try {
        const result = await reactToEvent(
          fastify.db,
          request.user.userId,
          request.params.eventId,
        );
        reply.send(result);
      } catch (err) {
        if (err instanceof Error && err.message === 'EVENT_NOT_FOUND') {
          return reply.status(404).send({ error: 'Event not found' });
        }
        throw err;
      }
    },
  );

  // DELETE /social/feed/:eventId/react
  fastify.delete<{ Params: { eventId: string } }>(
    '/feed/:eventId/react',
    {
      ...guard,
      schema: {
        tags: ['social'],
        summary: 'Remove my reaction from a feed event',
        security: authorizedSecurity,
        params: { type: 'object', properties: { eventId: { type: 'string', format: 'uuid' } } },
      },
    },
    async (request, reply) => {
      const result = await unreactToEvent(
        fastify.db,
        request.user.userId,
        request.params.eventId,
      );
      reply.send(result);
    },
  );
};

export default socialRoutes;
