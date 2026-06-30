import { writable, derived } from 'svelte/store';

// ────────────────────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────────────────────

export type WindowState = 'normal' | 'minimized' | 'maximized';

export type AppModuleId =
  | 'ContentManager'
  | 'MediaLibrary'
  | 'ProfileSettings'
  | 'ContactRequests'
  | 'CareerTimeline'
  | 'Capabilities';

export interface AppWindow {
  id: string;
  title: string;
  icon: string;
  component: AppModuleId;
  state: WindowState;
  position: { x: number; y: number };
  size: { width: number; height: number };
  zIndex: number;
  props?: Record<string, unknown>;
  /** Preserved before maximize so we can restore exact position/size */
  snapshot?: {
    position: { x: number; y: number };
    size: { width: number; height: number };
  };
}

export type OpenWindowConfig = Omit<AppWindow, 'id' | 'state' | 'zIndex' | 'snapshot'>;

// ────────────────────────────────────────────────────────────────
// Store factory
// ────────────────────────────────────────────────────────────────

function createWindowManager() {
  const { subscribe, update, set } = writable<AppWindow[]>([]);

  let _zCounter = 100;
  let _idCounter = 0;

  function nextZ() {
    return ++_zCounter;
  }

  function genId() {
    return `wm_${++_idCounter}_${Date.now()}`;
  }

  return {
    subscribe,

    /** Open a new window. Returns the generated window id. */
    open(config: OpenWindowConfig): string {
      const id = genId();
      update((wins) => [
        ...wins,
        { ...config, id, state: 'normal', zIndex: nextZ() }
      ]);
      return id;
    },

    /** Permanently remove a window from the stack. */
    close(id: string) {
      update((wins) => wins.filter((w) => w.id !== id));
    },

    /** Minimize a window (hide from desktop, keep in taskbar). */
    minimize(id: string) {
      update((wins) =>
        wins.map((w) => (w.id === id ? { ...w, state: 'minimized' } : w))
      );
    },

    /**
     * Toggle maximized state. Saves a snapshot before maximizing
     * so the exact original position/size can be restored.
     */
    maximize(id: string) {
      update((wins) =>
        wins.map((w) => {
          if (w.id !== id) return w;
          if (w.state === 'maximized') {
            // Restore
            return {
              ...w,
              state: 'normal',
              position: w.snapshot?.position ?? w.position,
              size: w.snapshot?.size ?? w.size,
              snapshot: undefined,
              zIndex: nextZ()
            };
          }
          // Maximize
          return {
            ...w,
            state: 'maximized',
            snapshot: { position: w.position, size: w.size },
            zIndex: nextZ()
          };
        })
      );
    },

    /**
     * Bring a window to the front and restore it from minimized if needed.
     */
    focus(id: string) {
      update((wins) =>
        wins.map((w) => {
          if (w.id !== id) return w;
          return {
            ...w,
            state: w.state === 'minimized' ? 'normal' : w.state,
            zIndex: nextZ()
          };
        })
      );
    },

    /** Toggle: if focused & normal → minimize; if minimized → restore. */
    toggleFromTaskbar(id: string, highestZ: number) {
      update((wins) => {
        const win = wins.find((w) => w.id === id);
        if (!win) return wins;

        // If this is the topmost normal window, minimize it
        const isTopmost = win.zIndex === highestZ && win.state === 'normal';
        return wins.map((w) => {
          if (w.id !== id) return w;
          if (isTopmost) return { ...w, state: 'minimized' };
          return { ...w, state: 'normal', zIndex: nextZ() };
        });
      });
    },

    /** Update window position (called during drag). */
    move(id: string, position: { x: number; y: number }) {
      update((wins) =>
        wins.map((w) => (w.id === id ? { ...w, position } : w))
      );
    },

    /** Update window size (called during resize). */
    resize(id: string, size: { width: number; height: number }) {
      update((wins) =>
        wins.map((w) => (w.id === id ? { ...w, size } : w))
      );
    },

    /** Update both position and size atomically (resize from edges). */
    moveAndResize(
      id: string,
      position: { x: number; y: number },
      size: { width: number; height: number }
    ) {
      update((wins) =>
        wins.map((w) => (w.id === id ? { ...w, position, size } : w))
      );
    },

    /** Clear all windows (e.g. on logout). */
    reset() {
      set([]);
      _zCounter = 100;
      _idCounter = 0;
    }
  };
}

export const windowManager = createWindowManager();

// ────────────────────────────────────────────────────────────────
// Derived stores
// ────────────────────────────────────────────────────────────────

/** All windows regardless of state */
export const allWindows = derived(windowManager, ($w) => $w);

/** Only non-minimized windows visible on the desktop */
export const visibleWindows = derived(windowManager, ($w) =>
  $w.filter((w) => w.state !== 'minimized')
);

/** Taskbar shows all open windows (including minimized) */
export const taskbarWindows = derived(windowManager, ($w) => $w);

/** The z-index of the topmost normal window (used for taskbar toggle logic) */
export const topmostZIndex = derived(windowManager, ($w) => {
  const normal = $w.filter((w) => w.state === 'normal');
  return normal.length ? Math.max(...normal.map((w) => w.zIndex)) : 0;
});
