<script lang="ts">
  import { windowManager } from '$lib/stores/windowManager';
  import type { AppModuleId } from '$lib/stores/windowManager';
  import { createEventDispatcher } from 'svelte';

  export let visible: boolean = false;
  const dispatch = createEventDispatcher<{ close: void; logout: void }>();

  interface MenuApp {
    icon: string;
    label: string;
    desc: string;
    component: AppModuleId;
    size: { width: number; height: number };
  }

  const apps: MenuApp[] = [
    { icon: '✦', label: 'Content Manager',  desc: 'Edit text, headings, labels',   component: 'ContentManager',  size: { width: 760, height: 540 } },
    { icon: '⬡', label: 'Media Library',    desc: 'Manage uploaded media assets',  component: 'MediaLibrary',    size: { width: 800, height: 560 } },
    { icon: '◈', label: 'Career Timeline',  desc: 'Add & edit career history',     component: 'CareerTimeline',  size: { width: 680, height: 580 } },
    { icon: '◼', label: 'Capabilities',      desc: 'Manage skill bullet points',    component: 'Capabilities',    size: { width: 620, height: 520 } },
    { icon: '✉', label: 'Contact Requests', desc: 'View messages from visitors',   component: 'ContactRequests', size: { width: 720, height: 540 } },
    { icon: '◎', label: 'Profile',          desc: 'Manage admin account & photo',  component: 'ProfileSettings', size: { width: 520, height: 460 } }
  ];

  function launch(app: MenuApp) {
    const cx = Math.max(80, Math.floor((window.innerWidth - app.size.width) / 2));
    const cy = Math.max(0, Math.floor((window.innerHeight - app.size.height - 48) / 2));
    windowManager.open({
      title: app.label,
      icon: app.icon,
      component: app.component,
      position: { x: cx, y: cy },
      size: app.size
    });
    dispatch('close');
  }

  function handleOverlayClick() {
    dispatch('close');
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') dispatch('close');
  }

  $: systemTime = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
  $: systemDate = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
</script>

<svelte:window on:keydown={handleKeydown} />

{#if visible}
  <!-- Overlay -->
  <!-- svelte-ignore a11y-click-events-have-key-events -->
  <!-- svelte-ignore a11y-no-static-element-interactions -->
  <div
    class="fixed inset-0 z-[9998]"
    on:click={handleOverlayClick}
    aria-hidden="true"
  />

  <!-- Start Menu panel -->
  <div
    class="fixed bottom-12 left-0 w-80 bg-os-surface border border-os-border rounded-tr-xl shadow-os-window z-[9999] overflow-hidden animate-slide-up"
    role="dialog"
    aria-label="Start menu"
    aria-modal="true"
  >
    <!-- Header -->
    <div class="px-4 py-4 border-b border-os-border bg-gradient-to-r from-os-accent/5 to-transparent">
      <p class="text-os-accent font-mono font-bold text-xl">{systemTime}</p>
      <p class="text-os-muted font-mono text-xs mt-0.5">{systemDate}</p>
    </div>

    <!-- App grid -->
    <div class="p-3">
      <p class="text-os-muted text-[10px] font-mono uppercase tracking-widest px-1 mb-2">Applications</p>
      <div class="grid grid-cols-1 gap-0.5">
        {#each apps as app}
          <button
            on:click={() => launch(app)}
            class="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/6 transition-colors text-left group"
          >
            <span class="text-xl leading-none w-7 text-center group-hover:scale-110 transition-transform flex-shrink-0">
              {app.icon}
            </span>
            <div class="min-w-0">
              <p class="text-os-text text-sm font-medium leading-tight">{app.label}</p>
              <p class="text-os-muted text-xs leading-tight mt-0.5">{app.desc}</p>
            </div>
          </button>
        {/each}
      </div>
    </div>

    <!-- Footer actions -->
    <div class="border-t border-os-border px-3 py-2 flex justify-between items-center">
      <a
        href="/"
        target="_blank"
        rel="noopener noreferrer"
        class="text-os-muted hover:text-os-text text-xs font-mono transition-colors flex items-center gap-1"
        on:click={() => dispatch('close')}
      >
        ↗ View Portfolio
      </a>
      <button
        on:click={() => { dispatch('logout'); dispatch('close'); }}
        class="text-os-danger/70 hover:text-os-danger text-xs font-mono transition-colors flex items-center gap-1"
      >
        ⏻ Sign Out
      </button>
    </div>
  </div>
{/if}
