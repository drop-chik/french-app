import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { authorizedSecurity } from '../../openapi/schemas.js';
import {
  listUsers,
  getUserDetail,
  updateUser,
  resetUserProgress,
  type UserSort,
} from './admin.service.js';
import type { LanguageLevel } from '@french-app/shared-types';

const patchSchema = z.object({
  level: z.enum(['A1', 'A2', 'B1', 'B2', 'C1', 'C2']).optional(),
  role: z.enum(['user', 'admin']).optional(),
  name: z.string().min(1).max(255).optional(),
  email: z.string().email().max(255).optional(),
});

const adminRoutes: FastifyPluginAsync = async (fastify) => {
  const guard = { preHandler: [fastify.authenticate, fastify.requireAdmin] };

  // GET /admin/users?q=&sort=&offset=&limit=
  fastify.get(
    '/users',
    {
      ...guard,
      schema: {
        tags: ['admin'],
        summary: 'List users (admin)',
        security: authorizedSecurity,
        querystring: {
          type: 'object',
          properties: {
            q: { type: 'string' },
            sort: { type: 'string', enum: ['created', 'lastActive', 'level', 'name'] },
            offset: { type: 'integer', minimum: 0, default: 0 },
            limit: { type: 'integer', minimum: 1, maximum: 100, default: 50 },
          },
        },
      },
    },
    async (request, reply) => {
      const query = request.query as Record<string, unknown>;
      const result = await listUsers(fastify.db, {
        ...(query.q ? { q: String(query.q) } : {}),
        ...(query.sort ? { sort: String(query.sort) as UserSort } : {}),
        offset: parseInt(String(query.offset ?? '0'), 10) || 0,
        limit: parseInt(String(query.limit ?? '50'), 10) || 50,
      });
      reply.send(result);
    },
  );

  // GET /admin/users/:id — full detail (read-only "view as user")
  fastify.get<{ Params: { id: string } }>(
    '/users/:id',
    {
      ...guard,
      schema: {
        tags: ['admin'],
        summary: 'User detail with full progress (admin)',
        security: authorizedSecurity,
        params: { type: 'object', properties: { id: { type: 'string', format: 'uuid' } } },
      },
    },
    async (request, reply) => {
      const detail = await getUserDetail(fastify.db, request.params.id);
      if (!detail) return reply.status(404).send({ error: 'User not found' });
      reply.send(detail);
    },
  );

  // PATCH /admin/users/:id — change level / role / name / email
  fastify.patch<{ Params: { id: string } }>(
    '/users/:id',
    {
      ...guard,
      schema: {
        tags: ['admin'],
        summary: 'Update a user (admin)',
        security: authorizedSecurity,
        params: { type: 'object', properties: { id: { type: 'string', format: 'uuid' } } },
        body: {
          type: 'object',
          properties: {
            level: { type: 'string', enum: ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] },
            role: { type: 'string', enum: ['user', 'admin'] },
            name: { type: 'string', minLength: 1, maxLength: 255 },
            email: { type: 'string', format: 'email', maxLength: 255 },
          },
        },
      },
    },
    async (request, reply) => {
      const parsed = patchSchema.safeParse(request.body);
      if (!parsed.success) return reply.status(400).send({ error: 'Invalid body' });
      try {
        const updated = await updateUser(fastify.db, request.params.id, {
          ...(parsed.data.level ? { level: parsed.data.level as LanguageLevel } : {}),
          ...(parsed.data.role ? { role: parsed.data.role } : {}),
          ...(parsed.data.name ? { name: parsed.data.name } : {}),
          ...(parsed.data.email ? { email: parsed.data.email } : {}),
        });
        reply.send({ user: updated });
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Update failed';
        if (msg === 'USER_NOT_FOUND') return reply.status(404).send({ error: msg });
        if (msg === 'EMAIL_TAKEN') return reply.status(409).send({ error: msg });
        if (msg === 'LAST_ADMIN') return reply.status(409).send({ error: msg });
        reply.status(500).send({ error: msg });
      }
    },
  );

  // POST /admin/users/:id/reset-progress — wipe SRS state (dangerous)
  fastify.post<{ Params: { id: string } }>(
    '/users/:id/reset-progress',
    {
      ...guard,
      schema: {
        tags: ['admin'],
        summary: 'Reset a user\'s word progress (admin, destructive)',
        security: authorizedSecurity,
        params: { type: 'object', properties: { id: { type: 'string', format: 'uuid' } } },
      },
    },
    async (request, reply) => {
      const result = await resetUserProgress(fastify.db, request.params.id);
      reply.send(result);
    },
  );
};

export default adminRoutes;
