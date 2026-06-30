import { createBrowserClient, createServerClient, isBrowser } from '@supabase/ssr';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';
import type { Database } from '$lib/types';

/**
 * Creates the correct Supabase client depending on execution context.
 * Use this in +layout.ts (universal load function) only.
 *
 * - Browser: createBrowserClient (manages cookies automatically)
 * - Server: createServerClient (reads cookies from the fetch context)
 *
 * Do NOT use this in +layout.server.ts or hooks.server.ts —
 * those use event.locals.supabase created by the hook.
 */
export function createSupabaseLoadClient(
  fetch: typeof globalThis.fetch,
  cookies?: Array<{ name: string; value: string }>
) {
  if (isBrowser()) {
    return createBrowserClient<Database>(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY, {
      global: { fetch }
    });
  }

  return createServerClient<Database>(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY, {
    global: { fetch },
    cookies: {
      getAll() {
        return cookies ?? [];
      }
    }
  });
}
