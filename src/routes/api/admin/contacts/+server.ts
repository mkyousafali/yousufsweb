import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { query } from '$lib/server/db';

/** GET /api/admin/contacts — list all contact requests */
export const GET: RequestHandler = async ({ locals: { safeGetSession } }) => {
  const { session } = await safeGetSession();
  if (!session) error(401, 'Unauthorized');

  const rows = await query(
    `SELECT id, name, country, email, whatsapp, message, is_read, created_at
     FROM "YOUSUFS_contact_requests"
     ORDER BY created_at DESC`
  );
  return json(rows);
};

/** PATCH /api/admin/contacts — mark a request as read */
export const PATCH: RequestHandler = async ({ request, locals: { safeGetSession } }) => {
  const { session } = await safeGetSession();
  if (!session) error(401, 'Unauthorized');

  const { id, is_read } = await request.json();
  if (!id) error(400, 'Missing id');

  const rows = await query(
    `UPDATE "YOUSUFS_contact_requests" SET is_read = $1 WHERE id = $2 RETURNING *`,
    [is_read ?? true, id]
  );
  return json(rows[0]);
};
