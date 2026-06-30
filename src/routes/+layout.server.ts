import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals: { safeGetSession }, cookies }) => {
  const { session, user } = await safeGetSession();

  return {
    session,
    user,
    // Pass cookies to the universal load function for SSR Supabase client
    cookies: cookies.getAll()
  };
};
