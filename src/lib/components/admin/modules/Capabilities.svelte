<script lang="ts">
  import { onMount } from 'svelte';

  interface Capability { id: string; category: string; skill_text: string; sort_order: number; }

  let items: Capability[] = [];
  let loading = true;
  let saving = false;
  let error: string | null = null;
  let editing: Capability | null = null;
  let isNew = false;
  let form = { category: '', skill_text: '' };

  // Derive categories for display
  $: categories = [...new Set(items.map(i => i.category))];
  $: byCategory = (cat: string) => items.filter(i => i.category === cat);

  async function load() {
    loading = true; error = null;
    try { items = await (await fetch('/api/admin/capabilities')).json(); }
    catch { error = 'Failed to load'; }
    finally { loading = false; }
  }

  function startNew(cat = '') { form = { category: cat, skill_text: '' }; editing = null; isNew = true; }
  function startEdit(item: Capability) { form = { category: item.category, skill_text: item.skill_text }; editing = item; isNew = false; }
  function cancel() { editing = null; isNew = false; }

  async function save() {
    saving = true; error = null;
    try {
      if (isNew) {
        await fetch('/api/admin/capabilities', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      } else if (editing) {
        await fetch('/api/admin/capabilities', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: editing.id, ...form }) });
      }
      cancel(); await load();
    } catch { error = 'Save failed'; }
    finally { saving = false; }
  }

  async function del(item: Capability) {
    if (!confirm(`Delete "${item.skill_text}"?`)) return;
    await fetch('/api/admin/capabilities', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: item.id }) });
    await load();
  }

  async function move(item: Capability, dir: -1 | 1) {
    const list = byCategory(item.category);
    const idx = list.indexOf(item);
    const swap = list[idx + dir];
    if (!swap) return;
    await Promise.all([
      fetch('/api/admin/capabilities', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: item.id, sort_order: swap.sort_order }) }),
      fetch('/api/admin/capabilities', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: swap.id, sort_order: item.sort_order }) })
    ]);
    await load();
  }

  onMount(load);
</script>

<div class="module-container h-full flex flex-col bg-os-window">
  <div class="px-4 pt-4 pb-3 border-b border-os-border flex-shrink-0 flex items-center justify-between">
    <div>
      <h2 class="text-os-text font-semibold text-sm">Personal Capabilities</h2>
      <p class="text-os-muted text-xs mt-0.5">Manage skill bullet points shown on the portfolio</p>
    </div>
    <div class="flex gap-2">
      <button on:click={load} class="btn-ghost text-xs" disabled={loading}>↻</button>
      <button on:click={() => startNew()} class="btn-primary text-xs px-3 py-1.5">+ Add Skill</button>
    </div>
  </div>

  <div class="flex-1 overflow-y-auto p-4">
    {#if loading}
      <div class="flex items-center justify-center h-32 text-os-muted text-sm">Loading…</div>

    {:else if isNew || editing}
      <div class="space-y-3 max-w-sm">
        <p class="text-os-text text-sm font-semibold">{isNew ? 'New Skill' : 'Edit Skill'}</p>
        <div>
          <label class="form-label">Category</label>
          <input class="form-input" bind:value={form.category} placeholder="Enterprise Management & Strategy" />
          {#if categories.length}
            <div class="flex flex-wrap gap-1 mt-1.5">
              {#each categories as cat}
                <button type="button" on:click={() => form.category = cat}
                  class="text-[10px] px-2 py-0.5 rounded border border-os-border text-os-muted hover:text-os-text hover:border-os-accent/40 transition-colors">
                  {cat}
                </button>
              {/each}
            </div>
          {/if}
        </div>
        <div>
          <label class="form-label">Skill Text</label>
          <input class="form-input" bind:value={form.skill_text} placeholder="Supply Chain & Logistics Control" />
        </div>
        {#if error}<p class="text-os-danger text-xs">⚠ {error}</p>{/if}
        <div class="flex gap-2">
          <button on:click={cancel} class="btn-ghost flex-1 py-2">Cancel</button>
          <button on:click={save} class="btn-primary flex-1 py-2" disabled={saving || !form.skill_text || !form.category}>
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>

    {:else}
      {#if items.length === 0}
        <div class="flex flex-col items-center justify-center h-32 text-os-muted text-sm gap-2">
          <span>No capabilities yet</span>
          <button on:click={() => startNew()} class="btn-primary text-xs px-3 py-1.5">+ Add First Skill</button>
        </div>
      {:else}
        {#each categories as cat}
          <div class="mb-5">
            <div class="flex items-center justify-between mb-2">
              <p class="text-os-muted text-xs font-mono tracking-wider uppercase">{cat}</p>
              <button on:click={() => startNew(cat)} class="text-[10px] text-os-accent hover:underline">+ add</button>
            </div>
            <ul class="space-y-1">
              {#each byCategory(cat) as item, i (item.id)}
                <li class="flex items-center gap-2 group bg-os-surface border border-os-border rounded-lg px-3 py-2 hover:border-os-accent/30 transition-colors">
                  <div class="flex flex-col gap-0.5 flex-shrink-0">
                    <button on:click={() => move(item, -1)} disabled={i === 0}
                      class="text-os-muted hover:text-os-text disabled:opacity-20 text-[9px] leading-none">▲</button>
                    <button on:click={() => move(item, 1)} disabled={i === byCategory(cat).length - 1}
                      class="text-os-muted hover:text-os-text disabled:opacity-20 text-[9px] leading-none">▼</button>
                  </div>
                  <span class="w-1.5 h-1.5 rounded-full bg-os-accent flex-shrink-0"></span>
                  <span class="text-os-text text-xs flex-1">{item.skill_text}</span>
                  <div class="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button on:click={() => startEdit(item)}
                      class="px-1.5 py-0.5 text-[10px] rounded bg-os-surface border border-os-border text-os-muted hover:text-os-text">Edit</button>
                    <button on:click={() => del(item)}
                      class="px-1.5 py-0.5 text-[10px] rounded bg-os-danger/10 border border-os-danger/30 text-os-danger hover:bg-os-danger/20">Del</button>
                  </div>
                </li>
              {/each}
            </ul>
          </div>
        {/each}
      {/if}
    {/if}
  </div>
</div>
