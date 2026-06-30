<script lang="ts">
  import { taskbarWindows, windowManager, topmostZIndex } from '$lib/stores/windowManager';
  import type { AppWindow } from '$lib/stores/windowManager';
  import { createEventDispatcher } from 'svelte';

  export let onStartMenu: () => void;
  export let username: string = 'Admin';

  const dispatch = createEventDispatcher<{ logout: void }>();

  $: wins = $taskbarWindows;
  $: topZ  = $topmostZIndex;

  function handleTaskbarClick(win: AppWindow) {
    windowManager.toggleFromTaskbar(win.id, topZ);
  }

  function getStatusClass(win: AppWindow): string {
    if (win.state === 'minimized') return 'opacity-50';
    if (win.zIndex === topZ && win.state === 'normal') return 'ring-1 ring-os-accent/40 bg-os-accent/10';
    return 'bg-white/5';
  }

  // Clock
  let timeStr = '';
  let dateStr = '';

  function updateClock() {
    const now = new Date();
    timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
    dateStr = now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  }

  updateClock();
  const clockInterval = setInterval(updateClock, 1000);

  import { onDestroy } from 'svelte';
  onDestroy(() => clearInterval(clockInterval));
</script>

<footer
  class="fixed bottom-0 left-0 right-0 h-12 bg-os-taskbar border-t border-os-border flex items-center z-[9999]"
  style="box-shadow: 0 -4px 24px rgba(0,0,0,0.6);"
>
  <!-- ── Start button ── -->
  <button
    on:click={onStartMenu}
    class="flex items-center gap-2 px-4 h-full border-r border-os-border hover:bg-white/5 transition-colors flex-shrink-0 group"
    aria-label="Open start menu"
    aria-haspopup="true"
  >
    <span class="text-base leading-none">⬡</span>
    <span class="text-os-accent text-xs font-bold font-mono tracking-widest hidden sm:block group-hover:text-glow-cyan">
      SYS
    </span>
  </button>

  <!-- ── Window tabs ── -->
  <div class="flex items-center gap-1 px-2 flex-1 overflow-x-auto min-w-0 h-full">
    {#each wins as win (win.id)}
      <button
        on:click={() => handleTaskbarClick(win)}
        class="flex items-center gap-1.5 px-3 py-1 rounded text-xs transition-all max-w-[160px] h-8 flex-shrink-0 {getStatusClass(win)}"
        title={win.title}
        aria-label="Window: {win.title} ({win.state})"
        aria-pressed={win.state !== 'minimized'}
      >
        <span class="text-sm leading-none flex-shrink-0">{win.icon}</span>
        <span class="text-os-text truncate">{win.title}</span>
        {#if win.state === 'minimized'}
          <span class="text-os-muted text-[10px] ml-auto flex-shrink-0">▼</span>
        {/if}
      </button>
    {/each}
  </div>

  <!-- ── Right system tray ── -->
  <div class="flex items-center gap-3 px-4 border-l border-os-border flex-shrink-0">
    <!-- User indicator -->
    <div class="hidden md:flex items-center gap-1.5">
      <div class="w-5 h-5 rounded-full bg-os-accent/20 border border-os-accent/30 flex items-center justify-center">
        <span class="text-[9px] text-os-accent font-bold uppercase">{username.charAt(0)}</span>
      </div>
      <span class="text-os-muted text-xs font-mono truncate max-w-[80px]">{username}</span>
    </div>

    <!-- Clock -->
    <div class="text-right">
      <p class="text-os-text font-mono text-xs leading-tight">{timeStr}</p>
      <p class="text-os-muted font-mono text-[10px] leading-tight">{dateStr}</p>
    </div>

    <!-- Logout button -->
    <button
      on:click={() => dispatch('logout')}
      class="text-os-muted hover:text-os-danger transition-colors p-1 rounded hover:bg-os-danger/10"
      title="Sign out"
      aria-label="Sign out"
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
        <polyline points="16 17 21 12 16 7"/>
        <line x1="21" y1="12" x2="9" y2="12"/>
      </svg>
    </button>
  </div>
</footer>
