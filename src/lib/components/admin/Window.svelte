<script lang="ts">
  import { windowManager } from '$lib/stores/windowManager';
  import type { AppWindow } from '$lib/stores/windowManager';

  export let win: AppWindow;

  const MIN_W = 420;
  const MIN_H = 300;

  // ── Drag ──────────────────────────────────────────────────
  let dragging = false;
  let dragStart = { mx: 0, my: 0, wx: 0, wy: 0 };

  function onTitleMouseDown(e: MouseEvent) {
    if ((e.target as HTMLElement).closest('.win-controls')) return;
    if (win.state === 'maximized') return;
    dragging = true;
    dragStart = { mx: e.clientX, my: e.clientY, wx: win.position.x, wy: win.position.y };
    windowManager.focus(win.id);
    e.preventDefault();
  }

  // ── Resize ────────────────────────────────────────────────
  let resizing = false;
  let resizeDir = '';
  let resStart = { mx: 0, my: 0, wx: 0, wy: 0, ww: 0, wh: 0 };

  function onResizeMouseDown(e: MouseEvent, dir: string) {
    if (win.state === 'maximized') return;
    e.preventDefault();
    e.stopPropagation();
    resizing = true;
    resizeDir = dir;
    resStart = {
      mx: e.clientX,
      my: e.clientY,
      wx: win.position.x,
      wy: win.position.y,
      ww: win.size.width,
      wh: win.size.height
    };
    windowManager.focus(win.id);
  }

  // ── Global mousemove / mouseup ────────────────────────────
  function onDocMouseMove(e: MouseEvent) {
    if (dragging) {
      const dx = e.clientX - dragStart.mx;
      const dy = e.clientY - dragStart.my;
      windowManager.move(win.id, {
        x: Math.max(0, dragStart.wx + dx),
        y: Math.max(0, dragStart.wy + dy)
      });
    }

    if (resizing) {
      const dx = e.clientX - resStart.mx;
      const dy = e.clientY - resStart.my;
      const dir = resizeDir;

      let nx = resStart.wx;
      let ny = resStart.wy;
      let nw = resStart.ww;
      let nh = resStart.wh;

      if (dir.includes('e')) nw = Math.max(MIN_W, resStart.ww + dx);
      if (dir.includes('s')) nh = Math.max(MIN_H, resStart.wh + dy);
      if (dir.includes('w')) {
        const candidate = resStart.ww - dx;
        nw = Math.max(MIN_W, candidate);
        nx = resStart.wx + (resStart.ww - nw);
      }
      if (dir.includes('n')) {
        const candidate = resStart.wh - dy;
        nh = Math.max(MIN_H, candidate);
        ny = resStart.wy + (resStart.wh - nh);
      }

      windowManager.moveAndResize(win.id, { x: nx, y: ny }, { width: nw, height: nh });
    }
  }

  function onDocMouseUp() {
    dragging = false;
    resizing = false;
    resizeDir = '';
  }

  // Double-click title bar → toggle maximize
  function onTitleDblClick() {
    windowManager.maximize(win.id);
  }
</script>

<svelte:document on:mousemove={onDocMouseMove} on:mouseup={onDocMouseUp} />

{#if win.state !== 'minimized'}
  <!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
  <div
    role="dialog"
    aria-label={win.title}
    class="app-window"
    class:ring-1={win.state !== 'minimized'}
    style:left="{win.state === 'maximized' ? '0' : win.position.x + 'px'}"
    style:top="{win.state === 'maximized' ? '0' : win.position.y + 'px'}"
    style:width="{win.state === 'maximized' ? '100%' : win.size.width + 'px'}"
    style:height="{win.state === 'maximized' ? 'calc(100vh - 48px)' : win.size.height + 'px'}"
    style:z-index={win.zIndex}
    on:mousedown={() => windowManager.focus(win.id)}
  >
    <!-- Resize handles (hidden when maximized) -->
    {#if win.state !== 'maximized'}
      {#each ['n','ne','e','se','s','sw','w','nw'] as dir}
        <!-- svelte-ignore a11y-no-static-element-interactions -->
        <div
          class="resize-handle resize-{dir}"
          on:mousedown={(e) => onResizeMouseDown(e, dir)}
        />
      {/each}
    {/if}

    <!-- Title bar -->
    <div
      class="win-titlebar"
      on:mousedown={onTitleMouseDown}
      on:dblclick={onTitleDblClick}
      role="toolbar"
      aria-label="Window controls for {win.title}"
    >
      <span class="text-base leading-none flex-shrink-0" aria-hidden="true">{win.icon}</span>
      <span class="win-title text-xs text-os-text font-medium truncate flex-1 ml-1">{win.title}</span>

      <div class="win-controls" role="group" aria-label="Window action buttons">
        <!-- Minimize -->
        <button
          class="win-btn minimize"
          on:click|stopPropagation={() => windowManager.minimize(win.id)}
          title="Minimize"
          aria-label="Minimize {win.title}"
        >
          <svg width="10" height="2" viewBox="0 0 10 2" fill="currentColor"><rect width="10" height="2"/></svg>
        </button>

        <!-- Maximize / Restore -->
        <button
          class="win-btn maximize"
          on:click|stopPropagation={() => windowManager.maximize(win.id)}
          title={win.state === 'maximized' ? 'Restore' : 'Maximize'}
          aria-label="{win.state === 'maximized' ? 'Restore' : 'Maximize'} {win.title}"
        >
          {#if win.state === 'maximized'}
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" stroke-width="1.5">
              <rect x="3" y="0" width="7" height="7"/>
              <path d="M0 3h7v7H0z"/>
            </svg>
          {:else}
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" stroke-width="1.5">
              <rect x="0" y="0" width="10" height="10"/>
            </svg>
          {/if}
        </button>

        <!-- Close -->
        <button
          class="win-btn close"
          on:click|stopPropagation={() => windowManager.close(win.id)}
          title="Close"
          aria-label="Close {win.title}"
        >
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round">
            <line x1="1" y1="1" x2="9" y2="9"/>
            <line x1="9" y1="1" x2="1" y2="9"/>
          </svg>
        </button>
      </div>
    </div>

    <!-- Window body — slot for module content -->
    <div class="win-body">
      <slot />
    </div>
  </div>
{/if}
