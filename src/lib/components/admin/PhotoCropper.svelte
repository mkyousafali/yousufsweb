<script lang="ts">
  import { createEventDispatcher, onMount, onDestroy } from 'svelte';

  export let src: string;          // raw data-URL of selected file
  export let aspectRatio = 3 / 4; // default portrait frame

  const dispatch = createEventDispatcher<{ crop: Blob; cancel: void }>();

  // ── state ────────────────────────────────────────────────────
  let containerEl: HTMLDivElement;
  let canvasEl: HTMLCanvasElement;
  let outputSize = 800; // pixels of the exported image

  let scale    = 1;
  let offsetX  = 0;
  let offsetY  = 0;
  let dragging = false;
  let lastX    = 0;
  let lastY    = 0;

  let imgNatW  = 0;
  let imgNatH  = 0;
  let imgEl    = new Image();

  // container dimensions
  const FRAME_W = 300;
  const FRAME_H = Math.round(FRAME_W / aspectRatio);

  // fit image into frame on load
  function initFit() {
    const scaleX = FRAME_W / imgNatW;
    const scaleY = FRAME_H / imgNatH;
    scale   = Math.max(scaleX, scaleY);
    offsetX = (FRAME_W - imgNatW * scale) / 2;
    offsetY = (FRAME_H - imgNatH * scale) / 2;
    draw();
  }

  function draw() {
    if (!canvasEl) return;
    const ctx = canvasEl.getContext('2d')!;
    ctx.clearRect(0, 0, FRAME_W, FRAME_H);
    ctx.drawImage(imgEl, offsetX, offsetY, imgNatW * scale, imgNatH * scale);
  }

  function clampOffset() {
    const w = imgNatW * scale;
    const h = imgNatH * scale;
    offsetX = Math.min(0, Math.max(FRAME_W - w, offsetX));
    offsetY = Math.min(0, Math.max(FRAME_H - h, offsetY));
  }

  // ── mouse/touch drag ─────────────────────────────────────────
  function onPointerDown(e: PointerEvent) {
    dragging = true;
    lastX = e.clientX;
    lastY = e.clientY;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }
  function onPointerMove(e: PointerEvent) {
    if (!dragging) return;
    offsetX += e.clientX - lastX;
    offsetY += e.clientY - lastY;
    lastX = e.clientX;
    lastY = e.clientY;
    clampOffset();
    draw();
  }
  function onPointerUp() { dragging = false; }

  // ── wheel zoom ───────────────────────────────────────────────
  function onWheel(e: WheelEvent) {
    e.preventDefault();
    const rect   = canvasEl.getBoundingClientRect();
    const px     = e.clientX - rect.left;
    const py     = e.clientY - rect.top;
    const delta  = e.deltaY < 0 ? 1.05 : 0.95;
    const newScale = Math.min(5, Math.max(0.3, scale * delta));
    offsetX = px - (px - offsetX) * (newScale / scale);
    offsetY = py - (py - offsetY) * (newScale / scale);
    scale   = newScale;
    clampOffset();
    draw();
  }

  // ── touch pinch ──────────────────────────────────────────────
  let lastPinchDist = 0;
  function touchDist(t: TouchList) {
    return Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY);
  }
  function onTouchStart(e: TouchEvent) {
    if (e.touches.length === 2) lastPinchDist = touchDist(e.touches);
  }
  function onTouchMove(e: TouchEvent) {
    e.preventDefault();
    if (e.touches.length === 2) {
      const dist = touchDist(e.touches);
      const delta = dist / lastPinchDist;
      lastPinchDist = dist;
      scale = Math.min(5, Math.max(0.3, scale * delta));
      clampOffset();
      draw();
    } else if (e.touches.length === 1 && dragging) {
      offsetX += e.touches[0].clientX - lastX;
      offsetY += e.touches[0].clientY - lastY;
      lastX = e.touches[0].clientX;
      lastY = e.touches[0].clientY;
      clampOffset();
      draw();
    }
  }

  // ── crop & export ────────────────────────────────────────────
  async function applyCrop() {
    const out = document.createElement('canvas');
    out.width  = outputSize;
    out.height = Math.round(outputSize / aspectRatio);
    const ctx = out.getContext('2d')!;
    const sx = -offsetX / scale;
    const sy = -offsetY / scale;
    const sw = FRAME_W / scale;
    const sh = FRAME_H / scale;
    ctx.drawImage(imgEl, sx, sy, sw, sh, 0, 0, out.width, out.height);
    out.toBlob(blob => {
      if (blob) dispatch('crop', blob);
    }, 'image/jpeg', 0.92);
  }

  onMount(() => {
    imgEl.onload = () => {
      imgNatW = imgEl.naturalWidth;
      imgNatH = imgEl.naturalHeight;
      initFit();
    };
    imgEl.src = src;
  });
</script>

<!-- ── Backdrop ────────────────────────────────────────────── -->
<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
<div
  class="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
  on:click|self={() => dispatch('cancel')}
>
  <div class="bg-[#0d0d1a] border border-[#2a2a40] rounded-2xl p-5 flex flex-col items-center gap-4 max-w-sm w-full shadow-2xl">

    <div class="text-center">
      <p class="text-white font-semibold text-sm">Adjust your photo</p>
      <p class="text-[#8892a4] text-xs mt-0.5">Drag to reposition · Scroll or pinch to zoom</p>
    </div>

    <!-- Canvas crop frame -->
    <div
      class="relative overflow-hidden rounded-xl border-2 border-[#4a9eff]/60 shadow-[0_0_20px_rgba(74,158,255,0.2)] cursor-grab active:cursor-grabbing"
      style="width:{FRAME_W}px; height:{FRAME_H}px; touch-action: none;"
      bind:this={containerEl}
    >
      <canvas
        bind:this={canvasEl}
        width={FRAME_W}
        height={FRAME_H}
        on:pointerdown={onPointerDown}
        on:pointermove={onPointerMove}
        on:pointerup={onPointerUp}
        on:wheel={onWheel}
        on:touchstart={onTouchStart}
        on:touchmove|preventDefault={onTouchMove}
      />
      <!-- Corner brackets -->
      <div class="pointer-events-none absolute inset-0">
        <div class="absolute top-2 left-2 w-5 h-5 border-t-2 border-l-2 border-[#4a9eff] rounded-tl"></div>
        <div class="absolute top-2 right-2 w-5 h-5 border-t-2 border-r-2 border-[#4a9eff] rounded-tr"></div>
        <div class="absolute bottom-2 left-2 w-5 h-5 border-b-2 border-l-2 border-[#4a9eff] rounded-bl"></div>
        <div class="absolute bottom-2 right-2 w-5 h-5 border-b-2 border-r-2 border-[#4a9eff] rounded-br"></div>
      </div>
    </div>

    <!-- Zoom slider -->
    <div class="w-full flex items-center gap-3">
      <span class="text-[#8892a4] text-xs">−</span>
      <input
        type="range" min="0.5" max="3" step="0.01"
        bind:value={scale}
        on:input={() => { clampOffset(); draw(); }}
        class="flex-1 h-1 accent-[#4a9eff] cursor-pointer"
      />
      <span class="text-[#8892a4] text-xs">+</span>
    </div>

    <!-- Actions -->
    <div class="flex gap-3 w-full">
      <button
        on:click={() => dispatch('cancel')}
        class="flex-1 py-2.5 rounded-lg border border-[#2a2a40] text-[#8892a4] text-sm hover:border-[#4a4a60] hover:text-white transition-colors"
      >
        Cancel
      </button>
      <button
        on:click={applyCrop}
        class="flex-1 py-2.5 rounded-lg bg-[#4a9eff] hover:bg-[#3a8eef] text-white font-semibold text-sm transition-colors"
      >
        Apply & Upload
      </button>
    </div>
  </div>
</div>
