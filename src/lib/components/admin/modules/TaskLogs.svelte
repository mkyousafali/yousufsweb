<script lang="ts">
  import { onMount } from 'svelte';
  import type { TaskLog } from '$lib/types';

  let logs: TaskLog[] = [];
  let loading = true;
  let error: string | null = null;
  let filterType: TaskLog['task_type'] | 'all' = 'all';
  let filterStatus: TaskLog['status'] | 'all' = 'all';
  let autoRefresh = false;
  let refreshInterval: ReturnType<typeof setInterval> | null = null;

  const types  = ['all', 'system', 'manual', 'scheduled', 'api', 'auth', 'error', 'content'] as const;
  const statuses = ['all', 'pending', 'running', 'success', 'failed', 'cancelled'] as const;

  const statusClass: Record<string, string> = {
    success:   'badge-success',
    failed:    'badge-danger',
    running:   'badge-accent',
    pending:   'badge-warn',
    cancelled: 'badge-muted'
  };

  const typeClass: Record<string, string> = {
    system:    'badge-accent',
    error:     'badge-danger',
    auth:      'badge-warn',
    api:       'badge-muted',
    manual:    'badge-muted',
    scheduled: 'badge-muted',
    content:   'badge-muted'
  };

  async function fetchLogs() {
    loading = true;
    error = null;
    try {
      const params = new URLSearchParams();
      if (filterType !== 'all') params.set('type', filterType);
      if (filterStatus !== 'all') params.set('status', filterStatus);
      const res = await fetch(`/api/admin/logs?${params.toString()}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      logs = await res.json();
    } catch (e) {
      error = e instanceof Error ? e.message : 'Failed to load logs';
    } finally {
      loading = false;
    }
  }

  function toggleAutoRefresh() {
    autoRefresh = !autoRefresh;
    if (autoRefresh) {
      refreshInterval = setInterval(fetchLogs, 10_000);
    } else {
      if (refreshInterval) clearInterval(refreshInterval);
      refreshInterval = null;
    }
  }

  function formatTime(ts: string | null): string {
    if (!ts) return '—';
    return new Date(ts).toLocaleString('en-US', {
      month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
      hour12: false
    });
  }

  $: filtered = logs.filter(
    (l) =>
      (filterType === 'all'   || l.task_type === filterType) &&
      (filterStatus === 'all' || l.status === filterStatus)
  );

  import { onDestroy } from 'svelte';

  onMount(fetchLogs);

  onDestroy(() => {
    if (refreshInterval) clearInterval(refreshInterval);
  });
</script>

<div class="module-container h-full flex flex-col bg-os-window">
  <!-- Header -->
  <div class="px-4 pt-4 pb-3 border-b border-os-border flex-shrink-0">
    <div class="flex items-center justify-between mb-3">
      <div>
        <h2 class="text-os-text font-semibold text-sm">Task Logs</h2>
        <p class="text-os-muted text-xs mt-0.5">System audit trail — read-only immutable log</p>
      </div>
      <div class="flex gap-2">
        <button
          class="text-xs px-3 py-1 rounded border transition-all {autoRefresh
            ? 'border-os-success/40 text-os-success bg-os-success/10'
            : 'border-os-border text-os-muted hover:text-os-text'}"
          on:click={toggleAutoRefresh}
          title={autoRefresh ? 'Stop auto-refresh' : 'Auto-refresh every 10s'}
        >
          {autoRefresh ? '⏵ Live' : '⏸ Paused'}
        </button>
        <button on:click={fetchLogs} class="btn-ghost text-xs" disabled={loading}>
          {loading ? '…' : '↻'}
        </button>
      </div>
    </div>

    <!-- Filters -->
    <div class="flex gap-1 flex-wrap mb-2">
      {#each types as t}
        <button
          class="px-2 py-0.5 rounded text-[10px] font-mono transition-all {filterType === t
            ? 'bg-os-accent/20 text-os-accent border border-os-accent/30'
            : 'text-os-muted hover:text-os-text border border-transparent'}"
          on:click={() => { filterType = t; fetchLogs(); }}
        >
          {t}
        </button>
      {/each}
    </div>
    <div class="flex gap-1 flex-wrap">
      {#each statuses as s}
        <button
          class="px-2 py-0.5 rounded text-[10px] font-mono transition-all {filterStatus === s
            ? 'bg-os-accent/20 text-os-accent border border-os-accent/30'
            : 'text-os-muted hover:text-os-text border border-transparent'}"
          on:click={() => { filterStatus = s; fetchLogs(); }}
        >
          {s}
        </button>
      {/each}
      <span class="ml-auto text-os-muted text-[10px] font-mono self-center">{filtered.length} entries</span>
    </div>
  </div>

  {#if error}
    <div class="mx-4 mt-2 p-2 rounded bg-os-danger/10 border border-os-danger/30 text-os-danger text-xs flex-shrink-0">
      ⚠ {error}
    </div>
  {/if}

  <!-- Log table -->
  <div class="flex-1 overflow-y-auto font-mono">
    {#if loading}
      <div class="flex items-center justify-center h-32 text-os-muted text-sm">Loading logs…</div>
    {:else if filtered.length === 0}
      <div class="flex items-center justify-center h-32 text-os-muted text-sm">No log entries found.</div>
    {:else}
      <table class="data-table w-full text-[11px]">
        <thead class="sticky top-0 bg-os-window z-10">
          <tr>
            <th class="w-36">Timestamp</th>
            <th class="w-16">Type</th>
            <th class="w-16">Status</th>
            <th>Task</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          {#each filtered as log (log.id)}
            <tr class:opacity-60={log.status === 'cancelled'}>
              <td class="text-os-muted whitespace-nowrap">
                {formatTime(log.created_at)}
              </td>
              <td>
                <span class="badge {typeClass[log.task_type] ?? 'badge-muted'}">{log.task_type}</span>
              </td>
              <td>
                <span class="badge {statusClass[log.status] ?? 'badge-muted'}">{log.status}</span>
              </td>
              <td class="text-os-text font-semibold">{log.task_name}</td>
              <td class="text-os-muted max-w-xs">
                <span class="line-clamp-1">{log.description ?? '—'}</span>
                {#if log.error_message}
                  <span class="text-os-danger block">{log.error_message}</span>
                {/if}
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    {/if}
  </div>
</div>
