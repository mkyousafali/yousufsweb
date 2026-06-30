import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { queryOne, query } from '$lib/server/db';

/** GET /api/admin/profile */
export const GET: RequestHandler = async ({ locals: { safeGetSession } }) => {
  const { session, user } = await safeGetSession();
  if (!session || !user) error(401, 'Unauthorized');

  // Upsert profile so it always exists (handles newly created auth users)
  const profile = await queryOne(
    `INSERT INTO "YOUSUFS_profiles" (id, email, display_name, role)
     VALUES ($1, $2, $3, 'admin')
     ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email
     RETURNING *`,
    [user.id, user.email, user.email?.split('@')[0] ?? 'Admin']
  );

  return json(profile);
};

/** PATCH /api/admin/profile */
export const PATCH: RequestHandler = async ({ request, locals: { safeGetSession } }) => {
  const { session, user } = await safeGetSession();
  if (!session || !user) error(401, 'Unauthorized');

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    error(400, 'Invalid JSON body');
  }

  const allowed = ['display_name', 'bio', 'avatar_url', 'whatsapp'] as const;
  const sets: string[] = [];
  const vals: unknown[] = [];
  let p = 1;
  for (const key of allowed) {
    if (key in body) { sets.push(`"${key}" = $${p++}`); vals.push(body[key]); }
  }

  if (sets.length === 0) error(400, 'No valid fields');

  vals.push(user.id);
  try {
    const row = await queryOne(
      `UPDATE "YOUSUFS_profiles" SET ${sets.join(', ')}, updated_at = NOW()
       WHERE id = $${p} RETURNING *`,
      vals
    );
    if (!row) error(404, 'Profile not found');

    // Sync whatsapp_number to site_content so public page shows updated button
    if ('whatsapp' in body) {
      await query(
        `INSERT INTO "YOUSUFS_site_content" (content_key, content_value, content_type, label, section, is_public, sort_order)
         VALUES ('whatsapp_number', $1, 'text', 'WhatsApp Number', 'contact', true, 5)
         ON CONFLICT (content_key) DO UPDATE SET content_value = $1, updated_at = NOW()`,
        [body.whatsapp || '']
      );
    }

    return json(row);
  } catch (e: unknown) {
    if (e && typeof e === 'object' && 'status' in e) throw e;
    error(500, e instanceof Error ? e.message : 'Database error');
  }
};
