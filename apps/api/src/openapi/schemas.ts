/**
 * Reusable JSON-schema fragments for Fastify routes. Keep these as plain
 * objects (not Zod / TypeBox) so they're cheap and Fastify swallows them
 * directly without conversion.
 */

export const errorSchema = {
  type: 'object',
  properties: {
    error: { type: 'string' },
    message: { type: 'string' },
  },
  required: ['error'],
} as const;

export const userSchema = {
  type: 'object',
  properties: {
    id:                  { type: 'string', format: 'uuid' },
    email:               { type: 'string', format: 'email' },
    name:                { type: 'string' },
    level:               { type: 'string', enum: ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] },
    avatarUrl:           { type: 'string', nullable: true },
    uiLanguage:          { type: 'string' },
    placementTestDone:   { type: 'boolean' },
    role:                { type: 'string', enum: ['user', 'admin'] },
    dailyNewWordsLimit:  { type: 'integer' },
    dailyDueWordsLimit:  { type: 'integer' },
    createdAt:           { type: 'string', format: 'date-time' },
  },
  required: ['id', 'email', 'name', 'level'],
} as const;

export const wordStatusSchema = {
  type: 'string',
  enum: ['new', 'learning', 'review', 'mastered'],
} as const;

export const xpSummarySchema = {
  type: 'object',
  properties: {
    xp:              { type: 'integer', minimum: 0 },
    level:           { type: 'integer', minimum: 1 },
    xpAtLevel:       { type: 'integer', minimum: 0 },
    xpForNextLevel:  { type: 'integer', minimum: 0 },
    pctToNext:       { type: 'integer', minimum: 0, maximum: 100 },
  },
  required: ['xp', 'level', 'xpAtLevel', 'xpForNextLevel', 'pctToNext'],
} as const;

export const authorizedSecurity = [{ bearerAuth: [] }] as const;

/** Bilingual query — most routes accept ?lang=ru|en. */
export const langQuery = {
  type: 'object',
  properties: {
    lang: { type: 'string', enum: ['ru', 'en'], default: 'ru' },
  },
} as const;
