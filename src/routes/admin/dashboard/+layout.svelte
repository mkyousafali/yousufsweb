<script lang="ts">
  import { goto } from '$app/navigation';
  import Sidebar   from '$lib/components/admin/Sidebar.svelte';
  import Taskbar   from '$lib/components/admin/Taskbar.svelte';
  import StartMenu from '$lib/components/admin/StartMenu.svelte';
  import { windowManager } from '$lib/stores/windowManager';
  import type { LayoutData } from './$types';

  export let data: LayoutData;

  $: profile = data.profile;
  $: username = profile?.display_name ?? data.user?.email ?? 'Admin';

  let startMenuOpen = false;

  function toggleStartMenu() {
    startMenuOpen = !startMenuOpen;
  }

  async function handleLogout() {
    startMenuOpen = false;
    // Sign out via Supabase
    const res = await fetch('/api/admin/auth/logout', { method: 'POST' });
    if (res.ok) {
      windowManager.reset();
      goto('/admin/login');
    }
  }
</script>

<svelte:head>
  <title>Dashboard — EnterpriseOS</title>
  <meta name="robots" content="noindex, nofollow" />
</svelte:head>

<!-- Sidebar launcher -->
<Sidebar />

<!-- Main desktop area (slot = Desktop.svelte content) -->
<div class="fixed inset-0" style="left: 64px; bottom: 48px; top: 0; right: 0; overflow: hidden;">
  <slot />
</div>

<!-- Start menu overlay -->
<StartMenu
  visible={startMenuOpen}
  on:close={() => (startMenuOpen = false)}
  on:logout={handleLogout}
/>

<!-- Taskbar -->
<Taskbar
  {username}
  onStartMenu={toggleStartMenu}
  on:logout={handleLogout}
/>
