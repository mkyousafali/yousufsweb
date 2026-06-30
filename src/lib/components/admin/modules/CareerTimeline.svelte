<script lang="ts">
  import { onMount } from 'svelte';

  interface CareerEntry {
    id: string;
    period: string;
    title: string;
    org: string;
    location: string;
    description: string;
    sort_order: number;
    is_active: boolean;
  }

  let entries: CareerEntry[] = [];
  let loading = true;
  let saving = false;
  let error: string | null = null;

  // editing state
  let editing: CareerEntry | null = null;
  let isNew = false;
  const blank = (): Omit<CareerEntry, 'id' | 'sort_order' | 'is_active'> => ({
    period: '', title: '', org: '', location: '', description: ''
  });
  let form = blank();

  async function load() {
    loading = true; error = null;
    try {
      const r = await fetch('/api/admin/career');
      entries = await r.json();
    } catch { error = 'Failed to load'; }
    finally { loading = false; }
  }

  function startNew() {
    form = blank();
    editing = null;
    isNew = true;
  }

  function startEdit(e: CareerEntry) {
    form = { period: e.period, title: e.title, org: e.org, location: e.location, description: e.description };
    editing = e;
    isNew = false;
  }

  function cancelEdit() { editing = null; isNew = false; form = blank(); }

  async function saveEntry() {
    saving = true; error = null;
    try {
      if (isNew) {
        await fetch('/api/admin/career', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      } else if (editing) {
        await fetch('/api/admin/career', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: editing.id, ...form }) });
      }
      cancelEdit();
      await load();
    } catch { error = 'Save failed'; }
    finally { saving = false; }
  }

  async function deleteEntry(e: CareerEntry) {
    if (!confirm(`Delete "${e.title}" at ${e.org}?`)) return;
    await fetch('/api/admin/career', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: e.id }) });
    await load();
  }

  async function move(e: CareerEntry, dir: -1 | 1) {
    const idx = entries.indexOf(e);
    const swap = entries[idx + dir];
    if (!swap) return;
    await Promise.all([
      fetch('/api/admin/career', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: e.id,    sort_order: swap.sort_order }) }),
      fetch('/api/admin/career', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: swap.id, sort_order: e.sort_order }) })
    ]);
    await load();
  }

  onMount(load);
</script>

<div class="module-container h-full flex flex-col bg-os-window">
  <!-- Header -->
  <div class="px-4 pt-4 pb-3 border-b border-os-border flex-shrink-0 flex items-center justify-between">
    <div>
      <h2 class="text-os-text font-semibold text-sm">Career Timeline</h2>
      <p class="text-os-muted text-xs mt-0.5">Manage your executive career history</p>
    </div>
    <div class="flex gap-2">
      <button on:click={load} class="btn-ghost text-xs" disabled={loading}>↻</button>
      <button on:click={startNew} class="btn-primary text-xs px-3 py-1.5">+ Add Entry</button>
    </div>
  </div>

  <div class="flex-1 overflow-y-auto">
    {#if loading}
      <div class="flex items-center justify-center h-32 text-os-muted text-sm">Loading…</div>

    {:else if isNew || editing}
      <!-- ── Edit / Add form ── -->
      <div class="p-4 space-y-3 max-w-lg">
        <p class="text-os-text text-sm font-semibold">{isNew ? 'New Entry' : 'Edit Entry'}</p>

        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="form-label">Period</label>
            <input class="form-input" bind:value={form.period} placeholder="2023 – Present" />
          </div>
          <div>
            <label class="form-label">Location</label>
            <input class="form-input" bind:value={form.location} placeholder="Jizan, Saudi Arabia" />
          </div>
        </div>

        <div>
          <label class="form-label">Job Title</label>
          <input class="form-input" bind:value={form.title} placeholder="Chief Executive Officer" />
        </div>

        <div>
          <label class="form-label">Company / Organisation</label>
          <input class="form-input" bind:value={form.org} placeholder="Urban Market" />
        </div>

        <div>
          <label class="form-label">Description</label>
          <textarea class="form-input resize-none" rows="3" bind:value={form.description}
            placeholder="Brief description of responsibilities and achievements…" />
        </div>

        {#if error}<p class="text-os-danger text-xs">⚠ {error}</p>{/if}

        <div class="flex gap-2">
          <button on:click={cancelEdit} class="btn-ghost flex-1 py-2">Cancel</button>
          <button on:click={saveEntry} class="btn-primary flex-1 py-2" disabled={saving || !form.title || !form.org || !form.period}>
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>

    {:else}
      <!-- ── Entry list ── -->
      {#if entries.length === 0}
        <div class="flex flex-col items-center justify-center h-32 text-os-muted text-sm gap-2">
          <span>No career entries yet</span>
          <button on:click={startNew} class="btn-primary text-xs px-3 py-1.5">+ Add First Entry</button>
        </div>
      {:else}
        <ul class="divide-y divide-os-border">
          {#each entries as entry, i (entry.id)}
            <li class="p-4 flex gap-3 hover:bg-white/[0.02] transition-colors group">
              <!-- Reorder arrows -->
              <div class="flex flex-col gap-0.5 flex-shrink-0 pt-0.5">
                <button on:click={() => move(entry, -1)} disabled={i === 0}
                  class="text-os-muted hover:text-os-text disabled:opacity-20 text-[10px] leading-none p-0.5">▲</button>
                <button on:click={() => move(entry, 1)} disabled={i === entries.length - 1}
                  class="text-os-muted hover:text-os-text disabled:opacity-20 text-[10px] leading-none p-0.5">▼</button>
              </div>

              <div class="flex-1 min-w-0">
                <div class="flex items-start justify-between gap-2">
                  <div>
                    <p class="text-os-accent font-mono text-[10px] tracking-wider">{entry.period}</p>
                    <p class="text-os-text font-semibold text-sm">{entry.title}</p>
                    <p class="text-os-muted text-xs">{entry.org} · {entry.location}</p>
                  </div>
                  <!-- Actions -->
                  <div class="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                    <button on:click={() => startEdit(entry)}
                      class="px-2 py-1 text-[10px] rounded bg-os-surface border border-os-border text-os-muted hover:text-os-text transition-colors">
                      Edit
                    </button>
                    <button on:click={() => deleteEntry(entry)}
                      class="px-2 py-1 text-[10px] rounded bg-os-danger/10 border border-os-danger/30 text-os-danger hover:bg-os-danger/20 transition-colors">
                      Del
                    </button>
                  </div>
                </div>
                <p class="text-os-muted text-[11px] mt-1 leading-relaxed line-clamp-2">{entry.description}</p>
              </div>
            </li>
          {/each}
        </ul>
      {/if}
    {/if}
  </div>
</div>
