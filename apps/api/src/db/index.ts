import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import * as schema from './schema/index.js';
import * as relations from './relations.js';

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env['DATABASE_URL'],
});

export const db = drizzle(pool, { schema: { ...schema, ...relations } });
export type DB = typeof db;
