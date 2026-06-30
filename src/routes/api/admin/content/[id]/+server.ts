import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { queryOne } from '$lib/server/db';

/** PATCH /api/admin/content/[id] — update a content item's value */
export const PATCH: RequestHandler = async ({ params, request, locals: { safeGetSession } }) => {
  const { session } = await safeGetSession();
  if (!session) error(401, 'Unauthorized');

  const { id } = params;
  if (!id) error(400, 'Missing id');

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    error(400, 'Invalid JSON body');
  }

  const allowed = ['content_value', 'label', 'description', 'is_public', 'sort_order'] as const;
  const sets: string[] = [];
  const vals: unknown[] = [];
  let p = 1;
  for (const key of allowed) {
    if (key in body) { sets.push(`"${key}" = $${p++}`); vals.push(body[key]); }
  }

  if (sets.length === 0) error(400, 'No valid fields to update');

  vals.push(id);
  try {
    const row = await queryOne(
      `UPDATE "YOUSUFS_site_content" SET ${sets.join(', ')}, updated_at = NOW()
       WHERE id = $${p} RETURNING *`,
      vals
    );
    if (!row) error(404, 'Content item not found');
    return json(row);
  } catch (e: unknown) {
    if (e && typeof e === 'object' && 'status' in e) throw e;
    error(500, e instanceof Error ? e.message : 'Database error');
  }
};
