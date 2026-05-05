import 'dotenv/config';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { sql } from 'drizzle-orm';
import { db } from './db/index.js';
import dbPlugin from './plugins/db.js';
import authPlugin from './plugins/auth.js';
import authRoutes from './modules/auth/auth.routes.js';
import wordsRoutes from './modules/words/words.routes.js';
import imageRoutes from './modules/ai-images/image.routes.js';
import grammarRoutes from './modules/grammar/grammar.routes.js';
import placementRoutes from './modules/placement/placement.routes.js';
import listeningRoutes from './modules/listening/listening.routes.js';
import conversationRoutes from './modules/conversation/conversation.routes.js';
import profileRoutes from './modules/profile/profile.routes.js';
import drillsRoutes from './modules/drills/drills.routes.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Run pending migrations on every startup (idempotent)
const migrationsFolder = join(__dirname, '../src/db/migrations');
await migrate(db, { migrationsFolder });

// Safety net: ensure audio_data column exists regardless of migrator state
await db.execute(sql`ALTER TABLE listening_exercises ADD COLUMN IF NOT EXISTS audio_data bytea`);

const isDev = process.env['NODE_ENV'] !== 'production';

const fastify = Fastify({
  logger: isDev
    ? { level: 'info', transport: { target: 'pino-pretty', options: { colorize: true } } }
    : { level: 'warn' },
  bodyLimit: 2 * 1024 * 1024, // 2MB — для base64 аватарок
});

// CORS
await fastify.register(cors, {
  origin: process.env['FRONTEND_URL'] ?? 'http://localhost:5173',
  credentials: true,
});

// Plugins
await fastify.register(dbPlugin);
await fastify.register(authPlugin);

// Routes
await fastify.register(authRoutes, { prefix: '/auth' });
await fastify.register(wordsRoutes, { prefix: '/words' });
await fastify.register(imageRoutes, { prefix: '/images' });
await fastify.register(grammarRoutes, { prefix: '/grammar' });
await fastify.register(placementRoutes, { prefix: '/placement' });
await fastify.register(listeningRoutes, { prefix: '/listening' });
await fastify.register(conversationRoutes, { prefix: '/conversation' });
await fastify.register(profileRoutes, { prefix: '/profile' });
await fastify.register(drillsRoutes, { prefix: '/drills' });

// Health check
fastify.get('/health', async () => ({ status: 'ok', timestamp: new Date().toISOString() }));

const port = parseInt(process.env['PORT'] ?? '3001', 10);
const host = '0.0.0.0';

try {
  await fastify.listen({ port, host });
  console.log(`API running on http://localhost:${port}`);
} catch (err) {
  fastify.log.error(err);
  process.exit(1);
}
