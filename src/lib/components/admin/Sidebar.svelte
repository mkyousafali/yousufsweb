<script lang="ts">
  import { windowManager } from '$lib/stores/windowManager';
  import type { AppModuleId } from '$lib/stores/windowManager';
  import { createEventDispatcher } from 'svelte';

  const dispatch = createEventDispatcher<{ openApp: { component: AppModuleId } }>();

  interface SidebarItem {
    icon: string;
    label: string;
    component: AppModuleId;
    color: string;
    defaultSize: { width: number; height: number };
  }

  const items: SidebarItem[] = [
    { icon: '✦',  label: 'Content',      component: 'ContentManager',  color: 'text-os-accent',  defaultSize: { width: 760, height: 540 } },
    { icon: '⬡',  label: 'Media',        component: 'MediaLibrary',    color: 'text-os-accent2', defaultSize: { width: 800, height: 560 } },
    { icon: '◈',  label: 'Career',       component: 'CareerTimeline',  color: 'text-os-warn',    defaultSize: { width: 680, height: 580 } },
    { icon: '◼',  label: 'Skills',       component: 'Capabilities',    color: 'text-os-accent',  defaultSize: { width: 620, height: 520 } },
    { icon: '✉',  label: 'Contacts',     component: 'ContactRequests', color: 'text-os-success', defaultSize: { width: 720, height: 540 } },
    { icon: '◎',  label: 'Profile',      component: 'ProfileSettings', color: 'text-os-muted',   defaultSize: { width: 520, height: 460 } }
  ];

  function openApp(item: SidebarItem) {
    const centerX = Math.max(80, Math.floor((window.innerWidth - item.defaultSize.width) / 2));
    const centerY = Math.max(0, Math.floor((window.innerHeight - item.defaultSize.height - 48) / 2));

    windowManager.open({
      title: item.label,
      icon: item.icon,
      component: item.component,
      position: { x: centerX + Math.floor(Math.random() * 60 - 30), y: centerY + Math.floor(Math.random() * 40 - 20) },
      size: item.defaultSize
    });
  }
</script>

<nav
  class="fixed left-0 top-0 bottom-12 w-16 bg-os-taskbar border-r border-os-border flex flex-col items-center py-3 gap-1 z-[9998] overflow-y-auto"
  aria-label="Application launcher sidebar"
>
  <!-- Logo mark -->
  <div class="mb-3 flex-shrink-0">
    <div
      class="w-9 h-9 rounded-lg bg-os-accent/10 border border-os-accent/25 flex items-center justify-center"
      title="EnterpriseOS"
    >
      <span class="text-os-accent font-bold font-mono text-sm">Y</span>
    </div>
  </div>

  <div class="w-8 h-px bg-os-border mb-2 flex-shrink-0" />

  <!-- App launcher buttons -->
  {#each items as item}
    <button
      on:click={() => openApp(item)}
      class="group relative w-10 h-10 rounded-lg flex items-center justify-center transition-all hover:bg-white/8 flex-shrink-0"
      title={item.label}
      aria-label="Open {item.label}"
    >
      <span class="text-base {item.color} group-hover:scale-110 transition-transform leading-none">
        {item.icon}
      </span>

      <!-- Tooltip -->
      <span
        class="absolute left-full ml-3 px-2 py-1 bg-os-surface border border-os-border rounded text-xs text-os-text whitespace-nowrap
               opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 font-mono"
        role="tooltip"
      >
        {item.label}
      </span>
    </button>
  {/each}

  <!-- Spacer -->
  <div class="flex-1" />

  <div class="w-8 h-px bg-os-border mt-2 flex-shrink-0" />

  <!-- Settings shortcut -->
  <button
    on:click={() => openApp(items[5])}
    class="group w-10 h-10 rounded-lg flex items-center justify-center hover:bg-white/8 transition-all flex-shrink-0 mt-1"
    title="Profile Settings"
    aria-label="Open profile settings"
  >
    <svg
      class="text-os-muted group-hover:text-os-text transition-colors"
      width="16" height="16" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" stroke-width="2"
      stroke-linecap="round" stroke-linejoin="round"
    >
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
    </svg>
  </button>
</nav>
