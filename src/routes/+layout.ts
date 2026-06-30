import { createSupabaseLoadClient } from '$lib/supabase';
import type { LayoutLoad } from './$types';

/**
 * Universal load function (runs on both server and browser).
 * Creates the correct Supabase client for the current context
 * and re-validates on every auth state change via 'supabase:auth'.
 */
export const load: LayoutLoad = async ({ fetch, data, depends }) => {
  depends('supabase:auth');

  const supabase = createSupabaseLoadClient(fetch, data.cookies);

  // getSession here is safe for UI purposes (real verification done in hooks)
  const {
    data: { session }
  } = await supabase.auth.getSession();

  return {
    supabase,
    session: session ?? data.session,
    user: data.user
  };
};
