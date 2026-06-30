<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import type { ContentMap } from '$lib/types';

  export let content: ContentMap = {};

  // ── Content with fallbacks ──────────────────────────────────
  $: headline     = content['hero_headline']      ?? 'I Build Enterprise Systems That Automate Everything.';
  $: subHeadline  = content['hero_sub_headline']  ?? 'Strategic Technology Executive  ·  AI Automation Architect';
  $: tagline      = content['hero_tag_line']      ?? 'Deploying scalable infrastructure and autonomous workflows since 2015.';
  $: ctaPrimary   = content['hero_cta_primary']   ?? 'View Case Studies';
  $: ctaSecondary = content['hero_cta_secondary'] ?? 'Request Consultation';

  // ── Typewriter state ────────────────────────────────────────
  let displayText = '';
  let mounted = false;
  let typewriterTimer: ReturnType<typeof setTimeout> | null = null;

  const phrases = [
    'I Build Enterprise Systems That Automate Everything.',
    'Architecting the Future of Business Automation.',
    'Engineering Intelligence at Enterprise Scale.',
    'Turning Manual Workflows Into Autonomous Pipelines.'
  ];

  let phraseIdx = 0;
  let charIdx = 0;
  let erasing = false;

  function tick() {
    const current = phrases[phraseIdx];
    if (!erasing) {
      if (charIdx < current.length) {
        displayText = current.slice(0, charIdx + 1);
        charIdx++;
        typewriterTimer = setTimeout(tick, 48 + Math.random() * 28);
      } else {
        typewriterTimer = setTimeout(() => { erasing = true; tick(); }, 2800);
      }
    } else {
      if (charIdx > 0) {
        displayText = current.slice(0, charIdx - 1);
        charIdx--;
        typewriterTimer = setTimeout(tick, 18);
      } else {
        erasing = false;
        phraseIdx = (phraseIdx + 1) % phrases.length;
        typewriterTimer = setTimeout(tick, 400);
      }
    }
  }

  // ── Matrix canvas ───────────────────────────────────────────
  let canvasEl: HTMLCanvasElement;
  let animFrame: number;

  function initMatrix() {
    if (!canvasEl) return;
    const ctx = canvasEl.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvasEl.width  = window.innerWidth;
      canvasEl.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const CHARS = '01アイウエオカキクケコサシスセソタチツテトΩ∑∆≈≠∞';
    const SIZE  = 13;
    const cols  = Math.ceil(window.innerWidth / SIZE);
    const drops = Array.from({ length: cols }, () => Math.random() * -80);

    function draw() {
      ctx.fillStyle = 'rgba(10, 10, 15, 0.06)';
      ctx.fillRect(0, 0, canvasEl.width, canvasEl.height);
      ctx.font = `${SIZE}px "JetBrains Mono", monospace`;

      for (let i = 0; i < drops.length; i++) {
        const alpha = Math.random() * 0.4 + 0.05;
        ctx.fillStyle = `rgba(0, 212, 255, ${alpha})`;
        const char = CHARS[Math.floor(Math.random() * CHARS.length)];
        ctx.fillText(char, i * SIZE, drops[i] * SIZE);

        if (drops[i] * SIZE > canvasEl.height && Math.random() > 0.975) {
          drops[i] = 0;
        }
        drops[i] += 0.4;
      }
      animFrame = requestAnimationFrame(draw);
    }

    animFrame = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(animFrame);
      window.removeEventListener('resize', resize);
    };
  }

  // ── PWA install prompt ──────────────────────────────────────
  let deferredPrompt: BeforeInstallPromptEvent | null = null;
  let showInstallBanner = false;

  // Extend Window for non-standard BeforeInstallPromptEvent
  type BeforeInstallPromptEvent = Event & {
    prompt(): Promise<void>;
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
  };

  async function handleInstall() {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') showInstallBanner = false;
    deferredPrompt = null;
  }

  // ── Lifecycle ───────────────────────────────────────────────
  let matrixCleanup: (() => void) | undefined;

  onMount(() => {
    mounted = true;
    typewriterTimer = setTimeout(tick, 600);
    matrixCleanup = initMatrix();

    const onInstallPrompt = (e: Event) => {
      e.preventDefault();
      deferredPrompt = e as BeforeInstallPromptEvent;
      showInstallBanner = true;
    };
    window.addEventListener('beforeinstallprompt', onInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', onInstallPrompt);
    };
  });

  onDestroy(() => {
    if (typewriterTimer) clearTimeout(typewriterTimer);
    matrixCleanup?.();
  });
</script>

<section class="hero-root relative min-h-screen flex flex-col justify-center overflow-hidden bg-os-bg">
  <!-- Matrix rain canvas -->
  <canvas
    bind:this={canvasEl}
    class="absolute inset-0 pointer-events-none opacity-25"
    aria-hidden="true"
  />

  <!-- Grid overlay -->
  <div class="bg-grid absolute inset-0 pointer-events-none opacity-100" aria-hidden="true" />

  <!-- Ambient glow spheres -->
  <div
    class="absolute top-1/3 left-1/5 w-[500px] h-[500px] rounded-full pointer-events-none"
    style="background: radial-gradient(circle, rgba(0,212,255,0.06) 0%, transparent 70%);"
    aria-hidden="true"
  />
  <div
    class="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full pointer-events-none"
    style="background: radial-gradient(circle, rgba(124,58,237,0.06) 0%, transparent 70%);"
    aria-hidden="true"
  />

  <!-- PWA install banner -->
  {#if showInstallBanner}
    <div class="fixed top-4 right-4 z-50 bg-os-surface border border-os-accent/25 rounded-xl p-4 shadow-os-glow flex items-center gap-4 animate-slide-in-right max-w-sm">
      <div class="flex-1 min-w-0">
        <p class="text-os-text font-semibold text-sm">Install EnterpriseOS</p>
        <p class="text-os-muted text-xs mt-0.5 truncate">Add to home screen for native experience</p>
      </div>
      <button
        on:click={handleInstall}
        class="btn-primary whitespace-nowrap"
      >
        Install
      </button>
      <button
        on:click={() => (showInstallBanner = false)}
        class="text-os-muted hover:text-os-text transition-colors text-sm flex-shrink-0"
        aria-label="Dismiss install banner"
      >
        ✕
      </button>
    </div>
  {/if}

  <!-- Main hero content -->
  <div class="relative z-10 max-w-7xl mx-auto px-6 lg:px-12 xl:px-16 py-28 w-full">

    <!-- System status indicator -->
    <div
      class="inline-flex items-center gap-2 mb-10 opacity-0 animate-fade-in-up"
      style="animation-delay: 0ms; animation-fill-mode: forwards;"
    >
      <span class="relative flex h-2 w-2">
        <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-os-success opacity-75" />
        <span class="relative inline-flex rounded-full h-2 w-2 bg-os-success" />
      </span>
      <span class="text-os-muted font-mono text-xs tracking-widest uppercase">
        Systems Online — Available for Engagement
      </span>
    </div>

    <!-- Headline typewriter -->
    <div
      class="mb-6 opacity-0 animate-fade-in-up"
      style="animation-delay: 100ms; animation-fill-mode: forwards;"
    >
      <h1 class="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold text-os-text leading-tight tracking-tight">
        {#if mounted}
          <span>{displayText}</span><span
            class="inline-block w-[3px] h-[0.85em] bg-os-accent ml-1 translate-y-[0.05em] animate-type-cursor"
            aria-hidden="true"
          />
        {:else}
          <span>{headline}</span>
        {/if}
      </h1>
    </div>

    <!-- Sub headline -->
    <div
      class="mb-5 opacity-0 animate-fade-in-up"
      style="animation-delay: 200ms; animation-fill-mode: forwards;"
    >
      <p class="text-os-accent font-mono text-base md:text-lg lg:text-xl tracking-wide text-glow-cyan">
        {subHeadline}
      </p>
    </div>

    <!-- Tagline -->
    <div
      class="mb-14 opacity-0 animate-fade-in-up"
      style="animation-delay: 300ms; animation-fill-mode: forwards;"
    >
      <p class="text-os-muted text-base md:text-lg max-w-2xl leading-relaxed">
        {tagline}
      </p>
    </div>

    <!-- CTAs -->
    <div
      class="flex flex-wrap gap-4 opacity-0 animate-fade-in-up"
      style="animation-delay: 400ms; animation-fill-mode: forwards;"
    >
      <a
        href="#cases"
        class="group inline-flex items-center gap-2 bg-os-accent text-os-bg font-bold text-sm px-8 py-3.5 rounded uppercase tracking-wider transition-all hover:shadow-os-glow-lg hover:brightness-110"
      >
        {ctaPrimary}
        <span class="group-hover:translate-x-1 transition-transform duration-150">→</span>
      </a>
      <a
        href="mailto:contact@yousuf.dev"
        class="inline-flex items-center gap-2 border border-os-border text-os-text font-semibold text-sm px-8 py-3.5 rounded uppercase tracking-wider transition-all hover:border-os-accent/40 hover:text-os-accent"
      >
        {ctaSecondary}
      </a>
    </div>

    <!-- Subtle admin portal link -->
    <div
      class="mt-20 opacity-0 animate-fade-in-up"
      style="animation-delay: 600ms; animation-fill-mode: forwards;"
    >
      <a
        href="/admin/login"
        class="text-os-border hover:text-os-muted/60 transition-colors text-xs font-mono tracking-widest"
        tabindex="-1"
        aria-label="Admin portal"
      >
        sys://admin.portal
      </a>
    </div>
  </div>

  <!-- Scroll indicator -->
  <div class="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-pulse pointer-events-none" aria-hidden="true">
    <span class="text-os-muted/50 font-mono text-[10px] tracking-widest">SCROLL</span>
    <div class="w-px h-8 bg-gradient-to-b from-os-muted/50 to-transparent" />
  </div>
</section>
