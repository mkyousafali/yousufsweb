import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { query, queryOne } from '$lib/server/db';

export const GET: RequestHandler = async ({ locals: { safeGetSession } }) => {
  const { session } = await safeGetSession();
  if (!session) error(401, 'Unauthorized');
  const rows = await query(`SELECT * FROM "YOUSUFS_capabilities" WHERE is_active=true ORDER BY sort_order ASC`);
  return json(rows);
};

export const POST: RequestHandler = async ({ request, locals: { safeGetSession } }) => {
  const { session } = await safeGetSession();
  if (!session) error(401, 'Unauthorized');
  const b = await request.json();
  if (!b.skill_text || !b.category) error(400, 'skill_text and category required');
  const row = await queryOne(
    `INSERT INTO "YOUSUFS_capabilities" (category, skill_text, sort_order)
     VALUES ($1,$2,COALESCE((SELECT MAX(sort_order)+1 FROM "YOUSUFS_capabilities"),1))
     RETURNING *`,
    [b.category, b.skill_text]
  );
  return json(row, { status: 201 });
};

export const PATCH: RequestHandler = async ({ request, locals: { safeGetSession } }) => {
  const { session } = await safeGetSession();
  if (!session) error(401, 'Unauthorized');
  const b = await request.json();
  if (!b.id) error(400, 'Missing id');
  const allowed = ['category','skill_text','sort_order','is_active'] as const;
  const sets: string[] = []; const vals: unknown[] = []; let p = 1;
  for (const k of allowed) if (k in b) { sets.push(`"${k}"=$${p++}`); vals.push(b[k]); }
  if (!sets.length) error(400, 'No fields');
  vals.push(b.id);
  const row = await queryOne(
    `UPDATE "YOUSUFS_capabilities" SET ${sets.join(',')},updated_at=NOW() WHERE id=$${p} RETURNING *`,
    vals
  );
  return json(row);
};

export const DELETE: RequestHandler = async ({ request, locals: { safeGetSession } }) => {
  const { session } = await safeGetSession();
  if (!session) error(401, 'Unauthorized');
  const { id } = await request.json();
  await query(`DELETE FROM "YOUSUFS_capabilities" WHERE id=$1`, [id]);
  return json({ success: true });
};
