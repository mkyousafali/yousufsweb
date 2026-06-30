<script lang="ts">
  import { onMount } from 'svelte';

  interface ContactRequest {
    id: string;
    name: string;
    country: string | null;
    email: string;
    whatsapp: string | null;
    message: string;
    is_read: boolean;
    created_at: string;
  }

  let contacts: ContactRequest[] = [];
  let loading = true;
  let error: string | null = null;
  let filter: 'all' | 'unread' = 'all';

  $: filtered = filter === 'unread' ? contacts.filter(c => !c.is_read) : contacts;
  $: unreadCount = contacts.filter(c => !c.is_read).length;

  async function fetchContacts() {
    loading = true;
    error = null;
    try {
      const res = await fetch('/api/admin/contacts');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      contacts = await res.json();
    } catch (e) {
      error = e instanceof Error ? e.message : 'Failed to load';
    } finally {
      loading = false;
    }
  }

  async function markRead(contact: ContactRequest) {
    if (contact.is_read) return;
    try {
      await fetch('/api/admin/contacts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: contact.id, is_read: true })
      });
      contact.is_read = true;
      contacts = [...contacts];
    } catch { /* silent */ }
  }

  function formatDate(iso: string) {
    return new Date(iso).toLocaleString('en-GB', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  }

  onMount(fetchContacts);
</script>

<div class="module-container h-full flex flex-col bg-os-window">
  <!-- Header -->
  <div class="px-4 pt-4 pb-3 border-b border-os-border flex-shrink-0">
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-os-text font-semibold text-sm">Contact Requests</h2>
        <p class="text-os-muted text-xs mt-0.5">Messages received from the public portfolio</p>
      </div>
      <button on:click={fetchContacts} class="btn-ghost text-xs" disabled={loading}>
        {loading ? 'Loading…' : '↻ Refresh'}
      </button>
    </div>

    <!-- Filter + stats -->
    <div class="flex items-center gap-2 mt-3">
      <button
        on:click={() => filter = 'all'}
        class="px-2.5 py-1 rounded text-xs font-mono transition-all
          {filter === 'all' ? 'bg-os-accent/20 text-os-accent border border-os-accent/30' : 'text-os-muted border border-transparent hover:text-os-text'}"
      >
        All ({contacts.length})
      </button>
      <button
        on:click={() => filter = 'unread'}
        class="px-2.5 py-1 rounded text-xs font-mono transition-all
          {filter === 'unread' ? 'bg-os-warn/20 text-os-warn border border-os-warn/30' : 'text-os-muted border border-transparent hover:text-os-text'}"
      >
        Unread ({unreadCount})
      </button>
    </div>
  </div>

  <!-- List -->
  <div class="flex-1 overflow-y-auto">
    {#if loading}
      <div class="flex items-center justify-center h-32 text-os-muted text-sm">Loading…</div>
    {:else if error}
      <div class="m-4 p-3 rounded bg-os-danger/10 border border-os-danger/30 text-os-danger text-xs">⚠ {error}</div>
    {:else if filtered.length === 0}
      <div class="flex flex-col items-center justify-center h-32 text-os-muted text-sm gap-2">
        <span class="text-2xl">✉</span>
        <span>{filter === 'unread' ? 'No unread messages' : 'No contact requests yet'}</span>
      </div>
    {:else}
      <ul class="divide-y divide-os-border">
        {#each filtered as contact (contact.id)}
          <!-- svelte-ignore a11y-click-events-have-key-events -->
          <!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
          <li
            class="p-4 hover:bg-white/[0.02] cursor-pointer transition-colors {!contact.is_read ? 'border-l-2 border-os-accent' : 'border-l-2 border-transparent'}"
            on:click={() => markRead(contact)}
          >
            <div class="flex items-start justify-between gap-3 mb-2">
              <div class="flex items-center gap-2 min-w-0">
                {#if !contact.is_read}
                  <span class="w-2 h-2 rounded-full bg-os-accent flex-shrink-0 animate-pulse-glow"></span>
                {/if}
                <span class="text-os-text font-semibold text-sm truncate">{contact.name}</span>
                {#if contact.country}
                  <span class="badge badge-muted text-[10px] flex-shrink-0">{contact.country}</span>
                {/if}
              </div>
              <span class="text-os-muted text-[10px] font-mono flex-shrink-0">{formatDate(contact.created_at)}</span>
            </div>

            <!-- Contact details row -->
            <div class="flex flex-wrap gap-3 mb-2">
              <a
                href="mailto:{contact.email}"
                class="text-os-accent text-xs hover:underline flex items-center gap-1"
                on:click|stopPropagation
              >
                <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                </svg>
                {contact.email}
              </a>
              {#if contact.whatsapp}
                <a
                  href="https://wa.me/{contact.whatsapp.replace(/\D/g, '')}"
                  target="_blank"
                  rel="noopener"
                  class="text-os-success text-xs hover:underline flex items-center gap-1"
                  on:click|stopPropagation
                >
                  <svg class="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                    <path d="M12 0C5.373 0 0 5.373 0 12c0 2.025.507 3.933 1.395 5.61L0 24l6.59-1.376A11.955 11.955 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.885 0-3.65-.488-5.19-1.344l-.373-.221-3.865.808.818-3.769-.24-.388A9.947 9.947 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
                  </svg>
                  +{contact.whatsapp}
                </a>
              {/if}
            </div>

            <!-- Message -->
            <p class="text-os-muted text-xs leading-relaxed line-clamp-3">{contact.message}</p>

            {#if !contact.is_read}
              <p class="text-os-muted text-[10px] mt-1.5 italic">Click to mark as read</p>
            {/if}
          </li>
        {/each}
      </ul>
    {/if}
  </div>
</div>
