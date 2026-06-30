import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals: { safeGetSession, supabase } }) => {
  const { session, user } = await safeGetSession();

  // Double-check — hook also guards but this is defence-in-depth
  if (!session || !user) {
    redirect(303, '/admin/login');
  }

  // Load the admin's profile
  const { data: profile } = await supabase
    .from('YOUSUFS_profiles')
    .select('id, display_name, email, avatar_url, role')
    .eq('id', user.id)
    .single();

  return {
    session,
    user,
    profile
  };
};
