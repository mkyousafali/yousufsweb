<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { browser } from '$app/environment';

  interface SystemMetric {
    label: string;
    value: string;
    color: string;
  }

  let metrics: SystemMetric[] = [];
  let uptime = 0;
  let uptimeTimer: ReturnType<typeof setInterval>;

  function buildMetrics(): SystemMetric[] {
    const result: SystemMetric[] = [
      { label: 'Platform',     value: navigator.platform || 'Unknown',     color: 'text-os-accent' },
      { label: 'Language',     value: navigator.language || '—',           color: 'text-os-text'   },
      { label: 'User Agent',   value: navigator.userAgent.slice(0, 60) + '…', color: 'text-os-muted' },
      { label: 'Online',       value: navigator.onLine ? 'Yes' : 'No',    color: navigator.onLine ? 'text-os-success' : 'text-os-danger' },
      { label: 'Viewport',     value: `${window.innerWidth} × ${window.innerHeight}`, color: 'text-os-text' },
      { label: 'Device Pixel Ratio', value: `${window.devicePixelRatio}x`, color: 'text-os-text' },
      { label: 'Storage (est.)', value: 'Calculating…',                   color: 'text-os-muted'  }
    ];

    if ('connection' in navigator) {
      const conn = (navigator as Navigator & { connection?: { effectiveType?: string; downlink?: number } }).connection;
      if (conn) {
        result.push({ label: 'Network Type', value: conn.effectiveType ?? '—', color: 'text-os-accent' });
        result.push({ label: 'Downlink', value: conn.downlink ? `${conn.downlink} Mbps` : '—', color: 'text-os-text' });
      }
    }

    return result;
  }

  async function estimateStorage() {
    if (!browser || !('storage' in navigator)) return;
    try {
      const estimate = await navigator.storage.estimate();
      const used  = ((estimate.usage ?? 0) / 1024 / 1024).toFixed(2);
      const quota = ((estimate.quota ?? 0) / 1024 / 1024).toFixed(0);
      metrics = metrics.map((m) =>
        m.label === 'Storage (est.)' ? { ...m, value: `${used} MB / ${quota} MB` } : m
      );
    } catch { /* ignore */ }
  }

  function formatUptime(seconds: number): string {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return [h > 0 ? `${h}h` : null, `${m}m`, `${s}s`].filter(Boolean).join(' ');
  }

  onMount(() => {
    metrics = buildMetrics();
    estimateStorage();
    uptimeTimer = setInterval(() => uptime++, 1000);
  });

  onDestroy(() => {
    clearInterval(uptimeTimer);
  });
</script>

<div class="module-container h-full flex flex-col bg-os-window">
  <div class="px-4 pt-4 pb-3 border-b border-os-border flex-shrink-0">
    <h2 class="text-os-text font-semibold text-sm">System Monitor</h2>
    <p class="text-os-muted text-xs mt-0.5">Runtime environment diagnostics</p>
  </div>

  <div class="flex-1 overflow-y-auto p-4 space-y-3 font-mono">
    <!-- Uptime -->
    <div class="bg-os-surface border border-os-border rounded-lg p-3">
      <p class="text-os-muted text-[10px] uppercase tracking-wider mb-1">Session Uptime</p>
      <p class="text-os-accent text-xl font-bold">{formatUptime(uptime)}</p>
    </div>

    <!-- Environment metrics grid -->
    <div class="bg-os-surface border border-os-border rounded-lg overflow-hidden">
      <table class="w-full text-xs">
        <tbody class="divide-y divide-os-border">
          {#each metrics as m}
            <tr class="hover:bg-white/[0.015] transition-colors">
              <td class="px-3 py-2 text-os-muted w-36 flex-shrink-0">{m.label}</td>
              <td class="px-3 py-2 {m.color} break-all">{m.value}</td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>

    <!-- Service Worker status -->
    <div class="bg-os-surface border border-os-border rounded-lg p-3">
      <p class="text-os-muted text-[10px] uppercase tracking-wider mb-2">Service Worker (PWA)</p>
      {#if browser && 'serviceWorker' in navigator}
        <p class="text-os-success text-xs">✔ Service Worker API available</p>
      {:else}
        <p class="text-os-danger text-xs">✖ Service Worker not supported</p>
      {/if}
    </div>

    <!-- Stack info -->
    <div class="bg-os-surface border border-os-border rounded-lg p-3">
      <p class="text-os-muted text-[10px] uppercase tracking-wider mb-2">Application Stack</p>
      <div class="space-y-1 text-xs">
        {#each [['Framework', 'SvelteKit 2.x'], ['Styling', 'Tailwind CSS 3.x'], ['Database', 'Supabase (PostgreSQL)'], ['Deploy', 'Vercel'], ['Port (dev)', '6000']] as [k, v]}
          <div class="flex justify-between">
            <span class="text-os-muted">{k}</span>
            <span class="text-os-accent">{v}</span>
          </div>
        {/each}
      </div>
    </div>
  </div>
</div>
