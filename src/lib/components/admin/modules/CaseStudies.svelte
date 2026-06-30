<script lang="ts">
  import { onMount } from 'svelte';
  import type { AutomationCase } from '$lib/types';

  let cases: AutomationCase[] = [];
  let loading = true;
  let error: string | null = null;
  type FilterStatus = AutomationCase['status'] | 'all';
  let filterStatus: FilterStatus = 'all';
  function setFilter(s: string) { filterStatus = s as FilterStatus; }
  let editingCase: AutomationCase | null = null;
  let saving = false;

  const statusColors: Record<string, string> = {
    published: 'badge-success',
    draft:     'badge-warn',
    archived:  'badge-muted'
  };

  async function fetchCases() {
    loading = true;
    error = null;
    try {
      const res = await fetch('/api/admin/cases');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      cases = await res.json();
    } catch (e) {
      error = e instanceof Error ? e.message : 'Failed to load case studies';
    } finally {
      loading = false;
    }
  }

  async function updateStatus(id: string, status: AutomationCase['status']) {
    try {
      const res = await fetch(`/api/admin/cases/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (!res.ok) throw new Error();
      cases = cases.map((c) => (c.id === id ? { ...c, status } : c));
    } catch {
      error = 'Failed to update status.';
    }
  }

  async function toggleFeatured(item: AutomationCase) {
    try {
      const res = await fetch(`/api/admin/cases/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_featured: !item.is_featured })
      });
      if (!res.ok) throw new Error();
      cases = cases.map((c) => (c.id === item.id ? { ...c, is_featured: !item.is_featured } : c));
    } catch {
      error = 'Failed to toggle featured.';
    }
  }

  $: filtered = cases.filter(
    (c) => filterStatus === 'all' || c.status === filterStatus
  );

  onMount(fetchCases);
</script>

<div class="module-container h-full flex flex-col bg-os-window">
  <!-- Header -->
  <div class="px-4 pt-4 pb-3 border-b border-os-border flex-shrink-0">
    <div class="flex items-center justify-between mb-3">
      <div>
        <h2 class="text-os-text font-semibold text-sm">Case Studies</h2>
        <p class="text-os-muted text-xs mt-0.5">Manage portfolio automation engagements</p>
      </div>
      <button on:click={fetchCases} class="btn-ghost text-xs" disabled={loading}>
        {loading ? 'Loading…' : '↻ Refresh'}
      </button>
    </div>

    <!-- Status filter -->
    <div class="flex gap-2">
      {#each ['all', 'published', 'draft', 'archived'] as s}
        <button
          class="px-2.5 py-1 rounded text-xs font-mono transition-all {filterStatus === s
            ? 'bg-os-accent/20 text-os-accent border border-os-accent/30'
            : 'text-os-muted hover:text-os-text border border-transparent'}"
          on:click={() => setFilter(s)}
        >
          {s}
        </button>
      {/each}
      <span class="ml-auto text-os-muted text-xs font-mono self-center">{filtered.length} cases</span>
    </div>
  </div>

  {#if error}
    <div class="mx-4 mt-3 p-2 rounded bg-os-danger/10 border border-os-danger/30 text-os-danger text-xs flex-shrink-0">
      ⚠ {error}
    </div>
  {/if}

  <div class="flex-1 overflow-y-auto">
    {#if loading}
      <div class="flex items-center justify-center h-32 text-os-muted text-sm">Loading cases…</div>
    {:else if filtered.length === 0}
      <div class="flex flex-col items-center justify-center h-32 text-os-muted gap-2">
        <span class="text-2xl">◈</span>
        <span class="text-sm">No case studies found.</span>
      </div>
    {:else}
      <div class="divide-y divide-os-border">
        {#each filtered as item (item.id)}
          <div class="p-4 hover:bg-white/[0.015] transition-colors group">
            <div class="flex items-start gap-3">
              <!-- Featured star -->
              <button
                on:click={() => toggleFeatured(item)}
                class="flex-shrink-0 mt-0.5 text-sm transition-colors {item.is_featured ? 'text-os-warn' : 'text-os-border hover:text-os-warn'}"
                title={item.is_featured ? 'Remove from featured' : 'Mark as featured'}
                aria-label="{item.is_featured ? 'Unfeature' : 'Feature'} {item.title}"
              >
                ★
              </button>

              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2 mb-1 flex-wrap">
                  <h3 class="text-os-text text-sm font-semibold">{item.title}</h3>
                  <span class="badge {statusColors[item.status] ?? 'badge-muted'}">{item.status}</span>
                  {#if item.is_featured}
                    <span class="badge badge-warn">Featured</span>
                  {/if}
                </div>

                {#if item.client_name || item.industry}
                  <p class="text-os-muted text-xs mb-1">
                    {[item.client_name, item.industry].filter(Boolean).join(' · ')}
                  </p>
                {/if}

                <p class="text-os-text/70 text-xs leading-relaxed line-clamp-2 mb-2">
                  {item.challenge}
                </p>

                <!-- Tech stack tags -->
                <div class="flex flex-wrap gap-1 mb-2">
                  {#each item.tech_stack.slice(0, 6) as tech}
                    <span class="badge badge-accent">{tech}</span>
                  {/each}
                  {#if item.tech_stack.length > 6}
                    <span class="badge badge-muted">+{item.tech_stack.length - 6}</span>
                  {/if}
                </div>

                <!-- Metrics row -->
                <div class="flex gap-4 text-xs text-os-muted">
                  {#if item.roi_metric}
                    <span>ROI: <span class="text-os-success">{item.roi_metric}</span></span>
                  {/if}
                  {#if item.duration_weeks}
                    <span>{item.duration_weeks}w engagement</span>
                  {/if}
                  {#if item.published_at}
                    <span>Published: {new Date(item.published_at).toLocaleDateString()}</span>
                  {/if}
                </div>
              </div>

              <!-- Status actions -->
              <div class="flex flex-col gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                {#if item.status === 'draft'}
                  <button
                    class="btn-primary text-[10px] py-1 px-2"
                    on:click={() => updateStatus(item.id, 'published')}
                  >
                    Publish
                  </button>
                {:else if item.status === 'published'}
                  <button
                    class="btn-ghost text-[10px] py-1 px-2"
                    on:click={() => updateStatus(item.id, 'draft')}
                  >
                    Unpublish
                  </button>
                {/if}
                {#if item.status !== 'archived'}
                  <button
                    class="btn-danger text-[10px] py-1 px-2"
                    on:click={() => updateStatus(item.id, 'archived')}
                  >
                    Archive
                  </button>
                {:else}
                  <button
                    class="btn-ghost text-[10px] py-1 px-2"
                    on:click={() => updateStatus(item.id, 'draft')}
                  >
                    Restore
                  </button>
                {/if}
              </div>
            </div>
          </div>
        {/each}
      </div>
    {/if}
  </div>
</div>
