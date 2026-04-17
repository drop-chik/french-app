import type { FastifyPluginAsync } from 'fastify';
import { eq } from 'drizzle-orm';
import { words } from '../../db/schema/index.js';
import { generateWordImage } from './image.service.js';

const imageRoutes: FastifyPluginAsync = async (fastify) => {
  // POST /images/words/:id — generate image for a word (synchronous for now)
  fastify.post<{ Params: { id: string } }>(
    '/words/:id',
    { preHandler: [fastify.authenticate] },
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
