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
  generateAiPrompt,
  getAiPrompts,
  type WritingType,
} from './writing.service.js';
import { authorizedSecurity } from '../../openapi/schemas.js';

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
    {
      preHandler: [fastify.authenticate],
      schema: {
        tags: ['writing'],
        summary: 'List writing prompts (filter by level/type)',
        security: authorizedSecurity,
        querystring: {
          type: 'object',
          properties: { level: { type: 'string' }, type: { type: 'string' } },
        },
      },
    },
    async (request, reply) => {
      const { level, type } = request.query as { level?: string; type?: string };
      const prompts = await getPrompts(fastify.db, level, type);
      reply.send({ prompts });
    },
  );

  // GET /writing/prompts/:slug — get single prompt
  fastify.get(
    '/prompts/:slug',
    {
      preHandler: [fastify.authenticate],
      schema: {
        tags: ['writing'],
        summary: 'Prompt detail by slug',
        security: authorizedSecurity,
        params: { type: 'object', properties: { slug: { type: 'string' } } },
      },
    },
    async (request, reply) => {
      const { slug } = request.params as { slug: string };
      const prompt = await getPromptBySlug(fastify.db, slug, request.user.userId);
      if (!prompt) return reply.status(404).send({ error: 'Prompt not found' });
      reply.send({ prompt });
    },
  );

  // GET /writing/prompts/ai — list the user's own AI-generated prompts
  fastify.get(
    '/prompts/ai',
    {
      preHandler: [fastify.authenticate],
      schema: {
        tags: ['writing'],
        summary: "List the user's AI-generated prompts (private)",
        security: authorizedSecurity,
      },
    },
    async (request, reply) => {
      const prompts = await getAiPrompts(fastify.db, request.user.userId);
      reply.send({ prompts });
    },
  );

  // POST /writing/prompts/generate — generate a fresh AI prompt for the user
  fastify.post(
    '/prompts/generate',
    {
      preHandler: [fastify.authenticate],
      schema: {
        tags: ['writing'],
        summary: 'Generate a new AI writing prompt for the current user',
        description: 'Creates a level-constrained prompt via GPT-4o and persists it. Returned immediately for the editor.',
        security: authorizedSecurity,
        body: {
          type: 'object',
          required: ['level', 'writingType'],
          properties: {
            level: { type: 'string', enum: ['A1', 'A2', 'B1', 'B2'] },
            writingType: {
              type: 'string',
              enum: ['postcard', 'message', 'letter_informal', 'letter_formal', 'email', 'description', 'blog_article', 'essay', 'narrative'],
            },
            topicHint: { type: 'string', maxLength: 200 },
          },
        },
      },
    },
    async (request, reply) => {
      const body = request.body as { level: 'A1' | 'A2' | 'B1' | 'B2'; writingType: WritingType; topicHint?: string };
      try {
        const prompt = await generateAiPrompt(fastify.db, request.user.userId, {
          level: body.level,
          writingType: body.writingType,
          ...(body.topicHint ? { topicHint: body.topicHint } : {}),
        });
        reply.status(201).send({ prompt });
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'AI generation failed';
        fastify.log.error({ err }, 'AI prompt generation failed');
        reply.status(500).send({ error: msg });
      }
    },
  );

  // POST /writing/submissions — save draft or submit
  fastify.post(
    '/submissions',
    {
      preHandler: [fastify.authenticate],
      schema: {
        tags: ['writing'],
        summary: 'Save a draft or submit a completed writing piece',
        description: 'Pass submissionId to overwrite an existing draft; omit it to create a new submission.',
        security: authorizedSecurity,
        body: {
          type: 'object',
          required: ['promptId', 'content'],
          properties: {
            promptId:     { type: 'string', format: 'uuid' },
            content:      { type: 'string', minLength: 1, maxLength: 5000 },
            status:       { type: 'string', enum: ['draft', 'submitted'], default: 'draft' },
            submissionId: { type: 'string', format: 'uuid' },
          },
        },
      },
    },
    async (request, reply) => {
      const parsed = saveSchema.safeParse(request.body);
      if (!parsed.success) return reply.status(400).send({ error: 'Invalid body' });

      const { promptId, content, status, submissionId } = parsed.data;

      const prompt = await getPromptById(fastify.db, promptId, request.user.userId);
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
    {
      preHandler: [fastify.authenticate],
      schema: {
        tags: ['writing'],
        summary: 'List user submissions (drafts and submitted)',
        security: authorizedSecurity,
      },
    },
    async (request, reply) => {
      const submissions = await getUserSubmissions(fastify.db, request.user.userId);
      reply.send({ submissions });
    },
  );

  // GET /writing/submissions/:id — get one submission with feedback
  fastify.get(
    '/submissions/:id',
    {
      preHandler: [fastify.authenticate],
      schema: {
        tags: ['writing'],
        summary: 'Submission detail (with AI feedback when generated)',
        security: authorizedSecurity,
        params: { type: 'object', properties: { id: { type: 'string', format: 'uuid' } } },
      },
    },
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
    {
      preHandler: [fastify.authenticate],
      schema: {
        tags: ['writing'],
        summary: 'Generate AI grammar / style feedback for a submission',
        security: authorizedSecurity,
        params: { type: 'object', properties: { id: { type: 'string', format: 'uuid' } } },
      },
    },
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
    {
      preHandler: [fastify.authenticate],
      schema: {
        tags: ['writing'],
        summary: 'User writing statistics',
        security: authorizedSecurity,
      },
    },
    async (request, reply) => {
      const stats = await getUserStats(fastify.db, request.user.userId);
      reply.send(stats);
    },
  );
};

export default writingRoutes;
