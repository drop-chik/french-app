import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import {
  getPrompts,
  getPromptBySlug,
  getPromptById,
  saveSubmission,
  getUserSubmissions,
  getSubmissionById,
  generateFeedback,
  getUserStats,
} from './writing.service.js';

const saveSchema = z.object({
  promptId: z.string().uuid(),
  content: z.string().min(1).max(5000),
  status: z.enum(['draft', 'submitted']).default('draft'),
  submissionId: z.string().uuid().optional(),
});

const writingRoutes: FastifyPluginAsync = async (fastify) => {
  // GET /writing/prompts — list prompts (optionally filter by level & type)
  fastify.get(
    '/prompts',
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      const { level, type } = request.query as { level?: string; type?: string };
      const prompts = await getPrompts(fastify.db, level, type);
      reply.send({ prompts });
    },
  );

  // GET /writing/prompts/:slug — get single prompt
  fastify.get(
    '/prompts/:slug',
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      const { slug } = request.params as { slug: string };
      const prompt = await getPromptBySlug(fastify.db, slug);
      if (!prompt) return reply.status(404).send({ error: 'Prompt not found' });
      reply.send({ prompt });
    },
  );

  // POST /writing/submissions — save draft or submit
  fastify.post(
    '/submissions',
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      const parsed = saveSchema.safeParse(request.body);
      if (!parsed.success) return reply.status(400).send({ error: 'Invalid body' });

      const { promptId, content, status, submissionId } = parsed.data;

      const prompt = await getPromptById(fastify.db, promptId);
      if (!prompt) return reply.status(404).send({ error: 'Prompt not found' });

      const submission = await saveSubmission(
        fastify.db,
        request.user.userId,
        promptId,
        content,
        prompt.level,
        status,
        submissionId,
      );
      reply.status(submissionId ? 200 : 201).send({ submission });
    },
  );

  // GET /writing/submissions — list user submissions
  fastify.get(
    '/submissions',
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      const submissions = await getUserSubmissions(fastify.db, request.user.userId);
      reply.send({ submissions });
    },
  );

  // GET /writing/submissions/:id — get one submission with feedback
  fastify.get(
    '/submissions/:id',
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const submission = await getSubmissionById(fastify.db, request.user.userId, id);
      if (!submission) return reply.status(404).send({ error: 'Not found' });
      reply.send({ submission });
    },
  );

  // POST /writing/submissions/:id/feedback — generate AI feedback
  fastify.post(
    '/submissions/:id/feedback',
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      try {
        const feedback = await generateFeedback(fastify.db, request.user.userId, id);
        reply.send({ feedback });
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Unknown error';
        reply.status(500).send({ error: msg });
      }
    },
  );

  // GET /writing/stats — user writing statistics
  fastify.get(
    '/stats',
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      const stats = await getUserStats(fastify.db, request.user.userId);
      reply.send(stats);
    },
  );
};

export default writingRoutes;
