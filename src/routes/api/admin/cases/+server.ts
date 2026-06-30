import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { query } from '$lib/server/db';

/** GET /api/admin/cases */
export const GET: RequestHandler = async ({ locals: { safeGetSession } }) => {
  const { session } = await safeGetSession();
  if (!session) error(401, 'Unauthorized');

  try {
    const rows = await query(
      `SELECT * FROM "YOUSUFS_automation_cases"
       ORDER BY sort_order ASC, created_at DESC`
    );
    return json(rows);
  } catch (e) {
    error(500, e instanceof Error ? e.message : 'Database error');
  }
};
