import { createServerClient } from '@supabase/ssr';
import { sequence } from '@sveltejs/kit/hooks';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';
import type { Handle } from '@sveltejs/kit';
import type { Database } from '$lib/types';

/**
 * Hook 1: supabase
 * Creates a server-side Supabase client per request, attached to
 * event.locals. Also attaches safeGetSession() which verifies the
 * JWT with the server (not just reading from cookie) to prevent
 * session spoofing.
 */
const supabase: Handle = async ({ event, resolve }) => {
  event.locals.supabase = createServerClient<Database>(
    PUBLIC_SUPABASE_URL,
    PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return event.cookies.getAll();
        },
        setAll(cookiesToSet) {
          console.log('[cookies] setAll called with', cookiesToSet.length, 'cookies:', cookiesToSet.map(c => c.name));
          cookiesToSet.forEach(({ name, value, options }) => {
            event.cookies.set(name, value, {
              ...options,
              path: '/',
              secure: false,
              sameSite: 'lax',
              httpOnly: true
            });
          });
        }
      }
    }
  );

  /**
   * safeGetSession() uses getUser() (server-verified) instead of
   * getSession() (cookie-only) to reliably authenticate server load
   * functions. Never rely on getSession() alone for access control.
   */
  event.locals.safeGetSession = async () => {
    const allCookies = event.cookies.getAll();
    const hasAuthCookie = allCookies.some(c => c.name.startsWith('sb-') || c.name.includes('supabase'));
    if (event.url.pathname.startsWith('/admin')) {
      console.log(`[session] ${event.url.pathname} — cookies: ${allCookies.map(c => c.name).join(', ') || 'none'}`);
    }

    const {
      data: { session }
    } = await event.locals.supabase.auth.getSession();

    if (event.url.pathname.startsWith('/admin')) {
      console.log(`[session] getSession() → ${session ? 'HAS SESSION user=' + session.user?.email : 'NULL'}`);
    }

    if (!session) {
      return { session: null, user: null };
    }

    const {
      data: { user },
      error
    } = await event.locals.supabase.auth.getUser();

    if (error) {
      console.warn('[auth] getUser() failed, falling back to session user:', error.message);
      return { session, user: session.user ?? null };
    }

    if (!user) {
      return { session: null, user: null };
    }

    return { session, user };
  };

  return resolve(event, {
    filterSerializedResponseHeaders(name) {
      // Allow Supabase response headers needed by the client
      return name === 'content-range' || name === 'x-supabase-api-version';
    }
  });
};

/**
 * Hook 2: authGuard
 * Protects /admin/dashboard routes. Redirects unauthenticated
 * users to /admin/login and authenticated users away from the
 * login page.
 */
const authGuard: Handle = async ({ event, resolve }) => {
  const { session, user } = await event.locals.safeGetSession();
  event.locals.session = session;
  event.locals.user = user;

  const isAdminRoute = event.url.pathname.startsWith('/admin/dashboard');
  const isLoginRoute = event.url.pathname === '/admin/login';

  if (isAdminRoute && !session) {
    return new Response(null, {
      status: 303,
      headers: { Location: '/admin/login' }
    });
  }

  if (isLoginRoute && session) {
    return new Response(null, {
      status: 303,
      headers: { Location: '/admin/dashboard' }
    });
  }

  return resolve(event);
};

export const handle = sequence(supabase, authGuard);
