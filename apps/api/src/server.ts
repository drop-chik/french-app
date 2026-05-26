import 'dotenv/config';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import swagger from '@fastify/swagger';
import scalar from '@scalar/fastify-api-reference';
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
import writingRoutes from './modules/writing/writing.routes.js';
import readingRoutes from './modules/reading/reading.routes.js';
import conjugationRoutes from './modules/conjugation/conjugation.routes.js';
import achievementsRoutes from './modules/achievements/achievements.routes.js';
import pushRoutes from './modules/push/push.routes.js';
import adminRoutes from './modules/admin/admin.routes.js';
import socialRoutes from './modules/social/social.routes.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Run pending migrations on every startup (idempotent)
const migrationsFolder = join(__dirname, '../src/db/migrations');
await migrate(db, { migrationsFolder });

// Safety net: ensure audio_data column exists regardless of migrator state
await db.execute(sql`ALTER TABLE listening_exercises ADD COLUMN IF NOT EXISTS audio_data bytea`);

const isDev = process.env['NODE_ENV'] !== 'production';

// Fail loud in production if secret env vars are missing — otherwise we
// silently fall back to the dev defaults and an attacker can forge tokens.
if (!isDev) {
  if (!process.env['JWT_SECRET'] || process.env['JWT_SECRET'] === 'dev_secret_change_me') {
    throw new Error('JWT_SECRET must be set in production');
  }
  if (!process.env['JWT_REFRESH_SECRET'] || process.env['JWT_REFRESH_SECRET'] === 'refresh_secret') {
    throw new Error('JWT_REFRESH_SECRET must be set in production');
  }
}

const fastify = Fastify({
  logger: isDev
    ? { level: 'info', transport: { target: 'pino-pretty', options: { colorize: true } } }
    : { level: 'warn' },
  bodyLimit: 2 * 1024 * 1024, // 2MB — для base64 аватарок
});

// Security headers (X-Frame-Options, X-Content-Type-Options, Referrer-Policy
// etc). CSP is OFF here because Scalar API Reference loads inline scripts and
// external assets from cdn.jsdelivr.net — adding a strict CSP needs a
// per-route policy or moving /docs behind a separate plugin instance.
await fastify.register(helmet, {
  contentSecurityPolicy: false,
});

// Rate limit — global default (300 req/min/IP). Login/register endpoints
// tighten further via per-route config so brute force on credentials caps at
// ~10 attempts/min/IP.
await fastify.register(rateLimit, {
  max: 300,
  timeWindow: '1 minute',
  // Skip rate limit on the health check so platform pings never trip it.
  allowList: (req) => req.url === '/health',
});

// CORS
await fastify.register(cors, {
  origin: process.env['FRONTEND_URL'] ?? 'http://localhost:5173',
  credentials: true,
});

// OpenAPI spec — registered BEFORE the routes so they can attach schemas.
await fastify.register(swagger, {
  openapi: {
    info: {
      title: 'FrenchUp API',
      description: 'REST API for the FrenchUp learning app. Auth is JWT-based: log in via /auth/login, then click "Authorize" above and paste the access token.',
      version: '1.0.0',
    },
    servers: [
      { url: 'http://localhost:3001', description: 'Local development' },
      { url: 'https://french-app-production.up.railway.app', description: 'Production' },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT access token returned by /auth/login or /auth/register.',
        },
      },
    },
    tags: [
      { name: 'auth',         description: 'Registration, login, refresh, logout' },
      { name: 'words',        description: 'Vocabulary: study sessions, SRS answers, dictionary, categories' },
      { name: 'grammar',      description: 'Grammar topics, theory and exercises' },
      { name: 'listening',    description: 'Listening exercises and on-demand TTS' },
      { name: 'reading',      description: 'Reading texts and word-translation popups' },
      { name: 'writing',      description: 'Writing prompts, submissions and AI feedback' },
      { name: 'drills',       description: 'Grammar drill sets and infinite-mode questions' },
      { name: 'conversation', description: 'AI conversation sessions with streaming responses' },
      { name: 'conjugation',  description: 'Verb conjugation tables (regular + irregular)' },
      { name: 'profile',      description: 'User profile, stats, charts, streak, avatar' },
      { name: 'achievements', description: 'XP, levels and badge unlocks' },
      { name: 'placement',    description: 'Initial CEFR placement test' },
      { name: 'images',       description: 'On-demand DALL-E word illustrations' },
      { name: 'push',         description: 'Web-Push subscriptions and notifications' },
    ],
  },
});

// Scalar API Reference — modern Swagger-UI alternative. Auto-discovers the
// spec from @fastify/swagger (above) and serves a single-bundle HTML page —
// no static asset files needed (Docker / pnpm hardlinks broke them for
// swagger-ui, Scalar avoids the issue entirely).
// Spec is also exposed at /docs/json and /docs/yaml for codegen.
await fastify.register(scalar, {
  routePrefix: '/docs',
  configuration: {
    title: 'FrenchUp API',
    theme: 'purple',
    authentication: { preferredSecurityScheme: 'bearerAuth' },
  },
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
await fastify.register(writingRoutes, { prefix: '/writing' });
await fastify.register(readingRoutes, { prefix: '/reading' });
await fastify.register(conjugationRoutes, { prefix: '/conjugation' });
await fastify.register(achievementsRoutes, { prefix: '/achievements' });
await fastify.register(pushRoutes, { prefix: '/push' });
await fastify.register(adminRoutes, { prefix: '/admin' });
await fastify.register(socialRoutes, { prefix: '/social' });

// Health check
fastify.get('/health', {
  schema: {
    summary: 'Health check',
    description: 'Returns { status: "ok" } when the API is reachable. Used by Railway healthchecks.',
    tags: ['system'],
    response: {
      200: {
        type: 'object',
        properties: {
          status: { type: 'string', example: 'ok' },
          timestamp: { type: 'string', format: 'date-time' },
        },
        required: ['status', 'timestamp'],
      },
    },
  },
}, async () => ({ status: 'ok', timestamp: new Date().toISOString() }));

const port = parseInt(process.env['PORT'] ?? '3001', 10);
const host = '0.0.0.0';

try {
  await fastify.listen({ port, host });
  console.log(`API running on http://localhost:${port}`);
} catch (err) {
  fastify.log.error(err);
  process.exit(1);
}
