<script lang="ts">
  import { onMount } from 'svelte';
  import type { SiteContent } from '$lib/types';

  let items: SiteContent[] = [];
  let loading = true;
  let saving: string | null = null;
  let error: string | null = null;
  let editingId: string | null = null;
  let editValue = '';
  let filterSection = 'all';
  let searchQuery = '';

  const sections = ['all', 'global', 'hero', 'metrics', 'about', 'footer'];

  async function fetchContent() {
    loading = true;
    error = null;
    try {
      const res = await fetch('/api/admin/content');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      items = await res.json();
    } catch (e) {
      error = e instanceof Error ? e.message : 'Failed to load content';
    } finally {
      loading = false;
    }
  }

  async function saveItem(item: SiteContent) {
    saving = item.id;
    error = null;
    try {
      const res = await fetch(`/api/admin/content/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content_value: editValue })
      });
      if (!res.ok) throw new Error(`Save failed: HTTP ${res.status}`);
      items = items.map((c) => (c.id === item.id ? { ...c, content_value: editValue } : c));
      editingId = null;
    } catch (e) {
      error = e instanceof Error ? e.message : 'Save failed';
    } finally {
      saving = null;
    }
  }

  function startEdit(item: SiteContent) {
    editingId = item.id;
    editValue = item.content_value ?? '';
  }

  function cancelEdit() {
    editingId = null;
    editValue = '';
  }

  $: filtered = items
    .filter((c) => filterSection === 'all' || c.section === filterSection)
    .filter((c) => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (
        c.content_key.toLowerCase().includes(q) ||
        (c.label ?? '').toLowerCase().includes(q) ||
        (c.content_value ?? '').toLowerCase().includes(q)
      );
    })
    .sort((a, b) => a.sort_order - b.sort_order || a.content_key.localeCompare(b.content_key));

  onMount(fetchContent);
</script>

<div class="module-container h-full flex flex-col bg-os-window">
  <!-- Header -->
  <div class="px-4 pt-4 pb-3 border-b border-os-border flex-shrink-0">
    <div class="flex items-center justify-between mb-3">
      <div>
        <h2 class="text-os-text font-semibold text-sm">Content Manager</h2>
        <p class="text-os-muted text-xs mt-0.5">Edit all public-facing site text & configuration</p>
      </div>
      <button on:click={fetchContent} class="btn-ghost text-xs" disabled={loading}>
        {loading ? 'Loading…' : '↻ Refresh'}
      </button>
    </div>

    <!-- Filters -->
    <div class="flex gap-2 flex-wrap">
      {#each sections as sec}
        <button
          class="px-2.5 py-1 rounded text-xs font-mono transition-all {filterSection === sec
            ? 'bg-os-accent/20 text-os-accent border border-os-accent/30'
            : 'text-os-muted hover:text-os-text border border-transparent'}"
          on:click={() => (filterSection = sec)}
        >
          {sec}
        </button>
      {/each}

      <input
        class="form-input ml-auto w-36 text-xs py-1"
        type="search"
        placeholder="Search…"
        bind:value={searchQuery}
        aria-label="Search content"
      />
    </div>
  </div>

  <!-- Error banner -->
  {#if error}
    <div class="mx-4 mt-3 p-2 rounded bg-os-danger/10 border border-os-danger/30 text-os-danger text-xs flex-shrink-0">
      ⚠ {error}
    </div>
  {/if}

  <!-- Table -->
  <div class="flex-1 overflow-y-auto">
    {#if loading}
      <div class="flex items-center justify-center h-32 text-os-muted text-sm">
        Loading content…
      </div>
    {:else if filtered.length === 0}
      <div class="flex items-center justify-center h-32 text-os-muted text-sm">
        No content items found.
      </div>
    {:else}
      <table class="data-table w-full">
        <thead class="sticky top-0 bg-os-window z-10">
          <tr>
            <th class="w-48">Key</th>
            <th class="w-20">Section</th>
            <th>Value</th>
            <th class="w-20 text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {#each filtered as item (item.id)}
            <tr>
              <td>
                <span class="font-mono text-os-accent text-xs">{item.content_key}</span>
                {#if item.label}
                  <p class="text-os-muted text-[10px] mt-0.5">{item.label}</p>
                {/if}
              </td>
              <td>
                <span class="badge badge-muted">{item.section}</span>
              </td>
              <td>
                {#if editingId === item.id}
                  <div class="flex flex-col gap-1.5">
                    <textarea
                      class="form-input resize-none text-xs"
                      rows="3"
                      bind:value={editValue}
                      aria-label="Edit value for {item.content_key}"
                    />
                    <div class="flex gap-1.5">
                      <button
                        class="btn-primary py-1"
                        on:click={() => saveItem(item)}
                        disabled={saving === item.id}
                      >
                        {saving === item.id ? 'Saving…' : 'Save'}
                      </button>
                      <button class="btn-ghost py-1" on:click={cancelEdit}>Cancel</button>
                    </div>
                  </div>
                {:else}
                  {#if item.content_value}
                    <p class="text-os-text text-xs leading-relaxed line-clamp-2 max-w-xs">{item.content_value}</p>
                  {:else}
                    <span class="text-os-muted italic text-xs">empty</span>
                  {/if}
                {/if}
              </td>
              <td class="text-right">
                {#if editingId !== item.id}
                  <button
                    class="text-os-muted hover:text-os-accent text-xs transition-colors px-2 py-1 rounded hover:bg-os-accent/10"
                    on:click={() => startEdit(item)}
                    aria-label="Edit {item.content_key}"
                  >
                    Edit
                  </button>
                {/if}
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    {/if}
  </div>

  <!-- Footer count -->
  <div class="px-4 py-2 border-t border-os-border flex-shrink-0 flex items-center justify-between">
    <span class="text-os-muted text-xs font-mono">{filtered.length} / {items.length} items</span>
    {#if editingId}
      <span class="text-os-warn text-xs">● Unsaved changes</span>
    {/if}
  </div>
</div>
