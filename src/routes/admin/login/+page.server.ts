import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { PUBLIC_SUPABASE_URL } from '$env/static/public';

export const load: PageServerLoad = async ({ locals: { safeGetSession } }) => {
  const { session } = await safeGetSession();
  if (session) {
    redirect(303, '/admin/dashboard');
  }
  return {};
};

export const actions: Actions = {
  login: async (event) => {
    const { request, locals: { supabase }, cookies } = event;
    const formData = await request.formData();
    const email    = formData.get('email');
    const password = formData.get('password');

    // Basic validation
    if (typeof email !== 'string' || !email.includes('@')) {
      return fail(400, { error: 'Please enter a valid email address.' });
    }
    if (typeof password !== 'string' || password.length < 8) {
      return fail(400, { error: 'Please enter your password.' });
    }

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      console.error('[LOGIN] signInWithPassword error:', error.message, error.status);
      return fail(401, { error: 'Invalid credentials. Please try again.' });
    }

    // Manually set session cookies because the new Supabase key format
    // doesn't trigger the SSR setAll callback automatically
    if (data.session) {
      const projectRef = new URL(PUBLIC_SUPABASE_URL).hostname.split('.')[0];
      const cookieName = `sb-${projectRef}-auth-token`;
      const sessionData = JSON.stringify({
        access_token:  data.session.access_token,
        refresh_token: data.session.refresh_token,
        expires_at:    data.session.expires_at,
        expires_in:    data.session.expires_in,
        token_type:    data.session.token_type,
        user:          data.session.user
      });
      // Supabase SSR chunks large cookies
      const chunkSize = 3600;
      const chunks = [];
      for (let i = 0; i < sessionData.length; i += chunkSize) {
        chunks.push(sessionData.slice(i, i + chunkSize));
      }
      const cookieOpts = { path: '/', httpOnly: true, sameSite: 'lax' as const, secure: false, maxAge: 60 * 60 * 24 * 7 };
      if (chunks.length === 1) {
        cookies.set(cookieName, chunks[0], cookieOpts);
      } else {
        chunks.forEach((chunk, i) => {
          cookies.set(`${cookieName}.${i}`, chunk, cookieOpts);
        });
        cookies.set(`${cookieName}.0`, chunks[0], cookieOpts);
      }
      console.log('[LOGIN] Session cookies set manually — chunks:', chunks.length);
    }

    console.log('[LOGIN] Success — redirecting to dashboard');
    redirect(303, '/admin/dashboard');
  }
};
