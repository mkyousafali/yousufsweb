<script lang="ts">
  import { enhance } from '$app/forms';
  import type { ActionData } from './$types';

  export let form: ActionData;

  let loading = false;
  let showPass = false;
</script>

<svelte:head>
  <title>Admin Login — EnterpriseOS</title>
  <meta name="robots" content="noindex, nofollow" />
</svelte:head>

<main class="min-h-screen bg-os-bg flex items-center justify-center px-4 relative overflow-hidden">
  <!-- Background grid -->
  <div class="bg-grid absolute inset-0 pointer-events-none opacity-60" aria-hidden="true" />

  <!-- Ambient glow -->
  <div
    class="absolute inset-0 pointer-events-none"
    style="background: radial-gradient(ellipse 60% 50% at 50% 50%, rgba(0,212,255,0.04) 0%, transparent 100%);"
    aria-hidden="true"
  />

  <div class="relative z-10 w-full max-w-sm">
    <!-- Logo / Title -->
    <div class="text-center mb-8">
      <div class="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-os-accent/10 border border-os-accent/25 mb-4 shadow-os-glow">
        <span class="text-os-accent font-bold font-mono text-2xl">Y</span>
      </div>
      <h1 class="text-os-text font-bold text-xl">EnterpriseOS</h1>
      <p class="text-os-muted text-xs mt-1 font-mono tracking-wider">ADMINISTRATOR PORTAL</p>
    </div>

    <!-- Login card -->
    <div class="bg-os-surface border border-os-border rounded-2xl p-6 shadow-os-window">
      <p class="text-os-text font-semibold text-sm mb-5">Sign in to your account</p>

      {#if form?.error}
        <div class="mb-4 p-3 rounded-lg bg-os-danger/10 border border-os-danger/30 flex items-start gap-2" role="alert">
          <span class="text-os-danger text-sm flex-shrink-0">⚠</span>
          <p class="text-os-danger text-xs">{form.error}</p>
        </div>
      {/if}

      <form
        method="POST"
        action="?/login"
        use:enhance={() => {
          loading = true;
          return async ({ update }) => {
            await update();
            loading = false;
          };
        }}
        class="space-y-4"
        novalidate
      >
        <!-- Email -->
        <div>
          <label class="form-label" for="email">Email address</label>
          <input
            id="email"
            name="email"
            type="email"
            class="form-input"
            placeholder="admin@example.com"
            autocomplete="email"
            required
            aria-describedby={form?.error ? 'login-error' : undefined}
          />
        </div>

        <!-- Password -->
        <div>
          <label class="form-label" for="password">Password</label>
          <div class="relative">
            <input
              id="password"
              name="password"
              type={showPass ? 'text' : 'password'}
              class="form-input pr-10"
              placeholder="••••••••••••"
              autocomplete="current-password"
              required
              minlength="8"
            />
            <button
              type="button"
              class="absolute right-3 top-1/2 -translate-y-1/2 text-os-muted hover:text-os-text text-xs transition-colors"
              on:click={() => (showPass = !showPass)}
              aria-label={showPass ? 'Hide password' : 'Show password'}
            >
              {showPass ? '🙈' : '👁'}
            </button>
          </div>
        </div>

        <button
          type="submit"
          class="btn-primary w-full py-3 mt-2 text-sm"
          disabled={loading}
          aria-label="Sign in"
        >
          {#if loading}
            <span class="inline-flex items-center gap-2">
              <svg class="animate-spin w-3 h-3" viewBox="0 0 24 24" fill="none">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
              Authenticating…
            </span>
          {:else}
            Sign In →
          {/if}
        </button>
      </form>
    </div>

    <!-- Back link -->
    <div class="text-center mt-6">
      <a href="/" class="text-os-muted hover:text-os-text text-xs font-mono transition-colors">
        ← Return to portfolio
      </a>
    </div>
  </div>
</main>
