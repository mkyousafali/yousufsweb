import { writable } from 'svelte/store';
import type { User, Session } from '@supabase/supabase-js';

interface AuthState {
  user: User | null;
  session: Session | null;
  initialized: boolean;
}

function createAuthStore() {
  const { subscribe, set, update } = writable<AuthState>({
    user: null,
    session: null,
    initialized: false
  });

  return {
    subscribe,
    setSession(session: Session | null) {
      update((s) => ({
        ...s,
        session,
        user: session?.user ?? null,
        initialized: true
      }));
    },
    clear() {
      set({ user: null, session: null, initialized: true });
    }
  };
}

export const authStore = createAuthStore();
