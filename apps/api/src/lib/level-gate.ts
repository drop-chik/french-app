/**
 * Hard CEFR level gate.
 *
 * Many content endpoints accept ?level=X from the client and use it to
 * filter content. Without a gate a curious user could ask for C2
 * grammar/listening/reading even when their profile is A1 and read
 * "above their pay grade" content. The vocabulary endpoints already
 * filter through levelsUpTo(user.level) on the service side, but other
 * modules trust the query param.
 *
 * This helper takes the requested level + the user's stored level and:
 *   - returns the requested level if user.level >= requested
 *   - returns null + writes 403 if requested is higher than user.level
 *
 * Usage in a route handler:
 *
 *   const allowed = await ensureLevelAllowed(fastify, request, reply, requested);
 *   if (!allowed) return;  // reply already sent
 *   // ... continue with `allowed` as the validated level
 */
import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { eq } from 'drizzle-orm';
import { users } from '../db/schema/index.js';
import type { LanguageLevel } from '@french-app/shared-types';

const ORDER: LanguageLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

export async function ensureLevelAllowed(
  fastify: FastifyInstance,
  request: FastifyRequest,
  reply: FastifyReply,
  requestedLevel: LanguageLevel,
): Promise<LanguageLevel | null> {
  const [user] = await fastify.db
    .select({ level: users.level })
    .from(users)
    .where(eq(users.id, request.user.userId));
  if (!user) {
    reply.status(404).send({ error: 'User not found' });
    return null;
  }
  const userIdx = ORDER.indexOf(user.level as LanguageLevel);
  const reqIdx = ORDER.indexOf(requestedLevel);
  if (reqIdx === -1) {
    reply.status(400).send({ error: 'Invalid level' });
    return null;
  }
  if (reqIdx > userIdx) {
    reply.status(403).send({
      error: 'Level not unlocked',
      message: `Your current level is ${user.level}. Reach ${requestedLevel} via placement test or progression.`,
      currentLevel: user.level,
      requestedLevel,
    });
    return null;
  }
  return requestedLevel;
}
