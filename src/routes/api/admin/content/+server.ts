import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { query } from '$lib/server/db';

/** GET /api/admin/content — list all content items (authenticated) */
export const GET: RequestHandler = async ({ locals: { safeGetSession } }) => {
  const { session } = await safeGetSession();
  if (!session) error(401, 'Unauthorized');

  try {
    const rows = await query(
      `SELECT * FROM "YOUSUFS_site_content"
       ORDER BY section ASC, sort_order ASC`
    );
    return json(rows);
  } catch (e) {
    error(500, e instanceof Error ? e.message : 'Database error');
  }
};
