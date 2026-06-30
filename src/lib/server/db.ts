/**
 * src/lib/server/db.ts
 * Direct PostgreSQL client for server-side admin operations.
 * Bypasses PostgREST / Supabase REST API schema cache issues.
 * Used only in +server.ts files (never exposed to the browser).
 */
import pg from 'pg';
import {
  DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD
} from '$env/static/private';

const { Pool } = pg;

// Singleton connection pool
let _pool: pg.Pool | null = null;

export function getPool(): pg.Pool {
  if (!_pool) {
    _pool = new Pool({
      host:     DB_HOST,
      port:     Number(DB_PORT) || 5432,
      database: DB_NAME || 'postgres',
      user:     DB_USER,
      password: DB_PASSWORD,
      ssl:      { rejectUnauthorized: false },
      max:      5,
      idleTimeoutMillis: 30000
    });
  }
  return _pool;
}

/** Run a parameterised query and return all rows */
export async function query<T = Record<string, unknown>>(
  sql: string,
  params: unknown[] = []
): Promise<T[]> {
  const pool = getPool();
  const result = await pool.query(sql, params);
  return result.rows as T[];
}

/** Run a parameterised query and return one row (or null) */
export async function queryOne<T = Record<string, unknown>>(
  sql: string,
  params: unknown[] = []
): Promise<T | null> {
  const rows = await query<T>(sql, params);
  return rows[0] ?? null;
}
