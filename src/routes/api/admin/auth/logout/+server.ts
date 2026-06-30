import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

/** POST /api/admin/auth/logout */
export const POST: RequestHandler = async ({ locals: { supabase } }) => {
  await supabase.auth.signOut();
  return json({ ok: true });
};
