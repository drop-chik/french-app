import type { FastifyPluginAsync } from 'fastify';
import { eq } from 'drizzle-orm';
import { words } from '../../db/schema/index.js';
import { generateWordImage } from './image.service.js';
import { authorizedSecurity } from '../../openapi/schemas.js';

const imageRoutes: FastifyPluginAsync = async (fastify) => {
  // POST /images/words/:id — generate image for a word (synchronous for now)
  fastify.post<{ Params: { id: string } }>(
    '/words/:id',
    {
      preHandler: [fastify.authenticate],
      schema: {
        tags: ['images'],
        summary: 'Generate (or fetch) DALL-E illustration for a word',
        description: 'Synchronous — DALL-E takes ~5-10s. If the word already has an imageUrl it is returned without re-generating.',
        security: authorizedSecurity,
        params: { type: 'object', properties: { id: { type: 'string', format: 'uuid' } } },
      },
    },
    async (request, reply) => {
      const word = await fastify.db.query.words.findFirst({
        where: eq(words.id, request.params.id),
      });

      if (!word) return reply.status(404).send({ error: 'Word not found' });
      if (word.imageUrl) return reply.send({ imageUrl: word.imageUrl });

      // Generate synchronously (DALL-E takes ~5-10s)
      const imageUrl = await generateWordImage(fastify.db, request.params.id);

      if (!imageUrl) {
        return reply.status(500).send({ error: 'Image generation failed' });
      }

      reply.send({ imageUrl });
    },
  );
};

export default imageRoutes;
