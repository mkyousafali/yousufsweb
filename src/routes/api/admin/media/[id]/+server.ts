import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

/** DELETE /api/admin/media/[id] — soft-delete (set is_active = false) */
export const DELETE: RequestHandler = async ({ params, locals: { safeGetSession, supabase } }) => {
  const { session } = await safeGetSession();
  if (!session) error(401, 'Unauthorized');

  const { id } = params;
  if (!id) error(400, 'Missing id');

  const { error: dbError } = await supabase
    .from('YOUSUFS_media_library')
    .update({ is_active: false })
    .eq('id', id);

  if (dbError) error(500, dbError.message);

  return json({ ok: true });
};
