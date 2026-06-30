<script lang="ts">
  import { onMount } from 'svelte';
  import type { MediaItem } from '$lib/types';

  let items: MediaItem[] = [];
  let loading = true;
  let error: string | null = null;
  let view: 'grid' | 'list' = 'grid';
  let searchQuery = '';

  async function fetchMedia() {
    loading = true;
    error = null;
    try {
      const res = await fetch('/api/admin/media');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      items = await res.json();
    } catch (e) {
      error = e instanceof Error ? e.message : 'Failed to load media';
    } finally {
      loading = false;
    }
  }

  async function deactivate(id: string) {
    if (!confirm('Remove this media item from the library?')) return;
    try {
      await fetch(`/api/admin/media/${id}`, { method: 'DELETE' });
      items = items.filter((m) => m.id !== id);
    } catch {
      error = 'Failed to remove item.';
    }
  }

  function formatSize(bytes: number | null): string {
    if (!bytes) return '—';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
  }

  $: filtered = items.filter((m) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      m.file_name.toLowerCase().includes(q) ||
      (m.alt_text ?? '').toLowerCase().includes(q) ||
      m.tags.some((t) => t.toLowerCase().includes(q))
    );
  });

  onMount(fetchMedia);
</script>

<div class="module-container h-full flex flex-col bg-os-window">
  <!-- Header -->
  <div class="px-4 pt-4 pb-3 border-b border-os-border flex-shrink-0">
    <div class="flex items-center justify-between mb-3">
      <div>
        <h2 class="text-os-text font-semibold text-sm">Media Library</h2>
        <p class="text-os-muted text-xs mt-0.5">{items.length} asset{items.length !== 1 ? 's' : ''} stored</p>
      </div>
      <div class="flex gap-2">
        <button
          class="p-1.5 rounded transition-colors {view === 'grid' ? 'bg-os-accent/20 text-os-accent' : 'text-os-muted hover:text-os-text'}"
          on:click={() => (view = 'grid')}
          aria-label="Grid view"
          title="Grid view"
        >
          ⊞
        </button>
        <button
          class="p-1.5 rounded transition-colors {view === 'list' ? 'bg-os-accent/20 text-os-accent' : 'text-os-muted hover:text-os-text'}"
          on:click={() => (view = 'list')}
          aria-label="List view"
          title="List view"
        >
          ☰
        </button>
        <button on:click={fetchMedia} class="btn-ghost text-xs" disabled={loading}>
          {loading ? '…' : '↻'}
        </button>
      </div>
    </div>

    <input
      class="form-input text-xs py-1.5 w-full"
      type="search"
      placeholder="Search by filename, alt text, or tag…"
      bind:value={searchQuery}
      aria-label="Search media"
    />
  </div>

  {#if error}
    <div class="mx-4 mt-3 p-2 rounded bg-os-danger/10 border border-os-danger/30 text-os-danger text-xs flex-shrink-0">
      ⚠ {error}
    </div>
  {/if}

  <div class="flex-1 overflow-y-auto p-4">
    {#if loading}
      <div class="flex items-center justify-center h-32 text-os-muted text-sm">Loading media…</div>
    {:else if filtered.length === 0}
      <div class="flex flex-col items-center justify-center h-32 text-os-muted gap-2">
        <span class="text-3xl">🖼</span>
        <span class="text-sm">No media assets found.</span>
        <p class="text-xs">Upload images via the Supabase Storage dashboard.</p>
      </div>
    {:else if view === 'grid'}
      <div class="grid grid-cols-3 gap-3">
        {#each filtered as item (item.id)}
          <div class="group relative bg-os-surface border border-os-border rounded-lg overflow-hidden hover:border-os-accent/30 transition-colors">
            {#if item.public_url}
              <img
                src={item.public_url}
                alt={item.alt_text ?? item.file_name}
                class="w-full h-24 object-cover bg-os-bg"
                loading="lazy"
              />
            {:else}
              <div class="w-full h-24 bg-os-bg flex items-center justify-center text-os-muted text-2xl">
                📄
              </div>
            {/if}
            <div class="p-2">
              <p class="text-os-text text-xs font-medium truncate">{item.file_name}</p>
              <p class="text-os-muted text-[10px] mt-0.5">{formatSize(item.file_size_bytes)}</p>
            </div>
            <div class="absolute inset-0 bg-os-bg/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
              {#if item.public_url}
                <a
                  href={item.public_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  class="btn-ghost text-[10px] py-1 px-2"
                  aria-label="View {item.file_name}"
                >
                  View
                </a>
              {/if}
              <button
                class="btn-danger text-[10px] py-1 px-2"
                on:click={() => deactivate(item.id)}
                aria-label="Remove {item.file_name}"
              >
                Remove
              </button>
            </div>
          </div>
        {/each}
      </div>
    {:else}
      <table class="data-table w-full text-xs">
        <thead>
          <tr>
            <th>File</th>
            <th>Type</th>
            <th>Size</th>
            <th>Tags</th>
            <th class="text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {#each filtered as item (item.id)}
            <tr>
              <td class="font-mono text-os-accent">{item.file_name}</td>
              <td class="text-os-muted">{item.mime_type}</td>
              <td class="text-os-muted">{formatSize(item.file_size_bytes)}</td>
              <td>
                {#each item.tags.slice(0, 3) as tag}
                  <span class="badge badge-muted mr-1">{tag}</span>
                {/each}
              </td>
              <td class="text-right">
                {#if item.public_url}
                  <a href={item.public_url} target="_blank" rel="noopener noreferrer" class="text-os-accent hover:underline mr-3 text-xs">View</a>
                {/if}
                <button class="text-os-danger/70 hover:text-os-danger text-xs" on:click={() => deactivate(item.id)}>Remove</button>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    {/if}
  </div>
</div>
