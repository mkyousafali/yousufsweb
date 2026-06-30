/**
 * src/lib/server/db.ts
 * Direct PostgreSQL client for server-side operations.
 * Uses a fresh connection per query — compatible with Vercel serverless.
 */
import pg from 'pg';
import { env } from '$env/dynamic/private';

const { Client } = pg;

function makeClient() {
  return new Client({
    host:     env.DB_HOST,
    port:     Number(env.DB_PORT) || 5432,
    database: env.DB_NAME || 'postgres',
    user:     env.DB_USER,
    password: env.DB_PASSWORD,
    ssl:      { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000,
    query_timeout:           15000
  });
}

/** Run a parameterised query — opens and closes its own connection */
export async function query<T = Record<string, unknown>>(
  sql: string,
  params: unknown[] = []
): Promise<T[]> {
  const client = makeClient();
  await client.connect();
  try {
    const result = await client.query(sql, params);
    return result.rows as T[];
  } finally {
    await client.end().catch(() => {});
  }
}

/** Run a parameterised query and return one row (or null) */
export async function queryOne<T = Record<string, unknown>>(
  sql: string,
  params: unknown[] = []
): Promise<T | null> {
  const rows = await query<T>(sql, params);
  return rows[0] ?? null;
}
