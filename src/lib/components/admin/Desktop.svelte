<script lang="ts">
  import { windowManager, visibleWindows } from '$lib/stores/windowManager';
  import type { AppModuleId } from '$lib/stores/windowManager';
  import Window from './Window.svelte';

  // Module components
  import ContentManager   from './modules/ContentManager.svelte';
  import MediaLibrary     from './modules/MediaLibrary.svelte';
  import ProfileSettings  from './modules/ProfileSettings.svelte';
  import ContactRequests  from './modules/ContactRequests.svelte';
  import CareerTimeline   from './modules/CareerTimeline.svelte';
  import Capabilities     from './modules/Capabilities.svelte';

  // Desktop app shortcut definitions
  interface DesktopApp {
    icon: string;
    label: string;
    component: AppModuleId;
    defaultSize: { width: number; height: number };
    color: string;
  }

  const desktopApps: DesktopApp[] = [
    { icon: '✦', label: 'Content\nManager',   component: 'ContentManager',  defaultSize: { width: 760, height: 540 }, color: '#00d4ff' },
    { icon: '⬡', label: 'Media\nLibrary',     component: 'MediaLibrary',    defaultSize: { width: 800, height: 560 }, color: '#7c3aed' },
    { icon: '◈', label: 'Career\nTimeline',   component: 'CareerTimeline',  defaultSize: { width: 680, height: 580 }, color: '#f59e0b' },
    { icon: '◼', label: 'Capabilities',        component: 'Capabilities',    defaultSize: { width: 620, height: 520 }, color: '#4a9eff' },
    { icon: '✉', label: 'Contact\nRequests',  component: 'ContactRequests', defaultSize: { width: 720, height: 540 }, color: '#22c55e' },
    { icon: '◎', label: 'Profile\nSettings',  component: 'ProfileSettings', defaultSize: { width: 520, height: 460 }, color: '#64748b' }
  ];

  let selectedIcon: string | null = null;
  let lastClick = 0;

  function handleIconClick(app: DesktopApp) {
    const now = Date.now();
    if (selectedIcon === app.label && now - lastClick < 500) {
      // Double-click detected
      openApp(app);
      selectedIcon = null;
    } else {
      selectedIcon = app.label;
      lastClick = now;
    }
  }

  function openApp(app: DesktopApp) {
    const desktopW = window.innerWidth - 64;  // subtract sidebar
    const desktopH = window.innerHeight - 48; // subtract taskbar
    const cx = Math.max(80, Math.floor((desktopW - app.defaultSize.width) / 2) + 64);
    const cy = Math.max(8, Math.floor((desktopH - app.defaultSize.height) / 2));

    windowManager.open({
      title: app.label.replace('\n', ' '),
      icon: app.icon,
      component: app.component,
      position: {
        x: cx + Math.floor(Math.random() * 40 - 20),
        y: cy + Math.floor(Math.random() * 30 - 15)
      },
      size: app.defaultSize
    });
  }

  // Deselect icon when clicking desktop
  function onDesktopClick(e: MouseEvent) {
    if ((e.target as HTMLElement).classList.contains('desktop-surface')) {
      selectedIcon = null;
    }
  }
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
<div
  class="desktop-surface fixed inset-0 overflow-hidden bg-os-bg"
  style="left: 64px; bottom: 48px; right: 0; top: 0;"
  on:click={onDesktopClick}
  role="main"
  aria-label="Desktop"
>
  <!-- Background grid + ambient glow -->
  <div class="bg-grid absolute inset-0 opacity-50 pointer-events-none" aria-hidden="true" />
  <div
    class="absolute top-1/3 left-1/3 w-96 h-96 rounded-full pointer-events-none"
    style="background: radial-gradient(circle, rgba(0,212,255,0.03) 0%, transparent 70%);"
    aria-hidden="true"
  />

  <!-- Desktop icons grid -->
  <div
    class="absolute top-4 left-4 grid gap-2"
    style="grid-template-columns: repeat(auto-fill, 80px);"
    role="list"
    aria-label="Desktop application shortcuts"
  >
    {#each desktopApps as app}
      <!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
      <div
        role="listitem"
        class="desktop-icon"
        class:selected={selectedIcon === app.label}
        on:click|stopPropagation={() => handleIconClick(app)}
        title="Double-click to open {app.label.replace('\n', ' ')}"
        aria-label="{app.label.replace('\n', ' ')} — double-click to open"
      >
        <div
          class="desktop-icon-img"
          style="color: {app.color};"
        >
          {app.icon}
        </div>
        <span class="whitespace-pre-line">{app.label}</span>
      </div>
    {/each}
  </div>

  <!-- Rendered windows -->
  {#each $visibleWindows as win (win.id)}
    <Window {win}>
      {#if win.component === 'ContentManager'}
        <ContentManager />
      {:else if win.component === 'MediaLibrary'}
        <MediaLibrary />
      {:else if win.component === 'CareerTimeline'}
        <CareerTimeline />
      {:else if win.component === 'Capabilities'}
        <Capabilities />
      {:else if win.component === 'ContactRequests'}
        <ContactRequests />
      {:else if win.component === 'ProfileSettings'}
        <ProfileSettings />
      {/if}
    </Window>
  {/each}
</div>
