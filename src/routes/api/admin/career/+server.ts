import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { query, queryOne } from '$lib/server/db';

export const GET: RequestHandler = async ({ locals: { safeGetSession } }) => {
  const { session } = await safeGetSession();
  if (!session) error(401, 'Unauthorized');
  const rows = await query(`SELECT * FROM "YOUSUFS_career_timeline" ORDER BY sort_order ASC`);
  return json(rows);
};

export const POST: RequestHandler = async ({ request, locals: { safeGetSession } }) => {
  const { session } = await safeGetSession();
  if (!session) error(401, 'Unauthorized');
  const b = await request.json();
  if (!b.title || !b.org || !b.period) error(400, 'title, org and period are required');
  const row = await queryOne(
    `INSERT INTO "YOUSUFS_career_timeline" (period, title, org, location, description, sort_order)
     VALUES ($1,$2,$3,$4,$5,
       COALESCE((SELECT MAX(sort_order)+1 FROM "YOUSUFS_career_timeline"), 1))
     RETURNING *`,
    [b.period, b.title, b.org, b.location ?? '', b.description ?? '']
  );
  return json(row, { status: 201 });
};

export const PATCH: RequestHandler = async ({ request, locals: { safeGetSession } }) => {
  const { session } = await safeGetSession();
  if (!session) error(401, 'Unauthorized');
  const b = await request.json();
  if (!b.id) error(400, 'Missing id');
  const allowed = ['period','title','org','location','description','sort_order','is_active'] as const;
  const sets: string[] = []; const vals: unknown[] = []; let p = 1;
  for (const k of allowed) if (k in b) { sets.push(`"${k}"=$${p++}`); vals.push(b[k]); }
  if (!sets.length) error(400, 'No fields');
  vals.push(b.id);
  const row = await queryOne(
    `UPDATE "YOUSUFS_career_timeline" SET ${sets.join(',')}, updated_at=NOW() WHERE id=$${p} RETURNING *`,
    vals
  );
  return json(row);
};

export const DELETE: RequestHandler = async ({ request, locals: { safeGetSession } }) => {
  const { session } = await safeGetSession();
  if (!session) error(401, 'Unauthorized');
  const { id } = await request.json();
  if (!id) error(400, 'Missing id');
  await query(`DELETE FROM "YOUSUFS_career_timeline" WHERE id=$1`, [id]);
  return json({ success: true });
};
