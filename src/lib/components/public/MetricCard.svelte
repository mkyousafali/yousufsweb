<script lang="ts">
  export let value: string = '—';
  export let label: string = '';
  export let index: number = 0;
  export let color: 'cyan' | 'purple' | 'amber' = 'cyan';

  const colorMap = {
    cyan:   { accent: 'text-os-accent',  glow: 'shadow-os-glow',        border: 'border-os-accent/20',  bg: 'from-os-accent/8' },
    purple: { accent: 'text-os-accent2', glow: 'shadow-os-glow-accent2', border: 'border-os-accent2/20', bg: 'from-os-accent2/8' },
    amber:  { accent: 'text-os-warn',    glow: '',                        border: 'border-os-warn/20',    bg: 'from-os-warn/8' }
  };

  $: c = colorMap[color];
  $: delay = `${index * 100}ms`;
</script>

<div
  class="metric-card relative overflow-hidden border {c.border} bg-gradient-to-br {c.bg} to-transparent rounded-xl p-6
         opacity-0 animate-fade-in-up transition-all duration-300 hover:scale-[1.02] hover:{c.glow}"
  style="animation-delay: {delay}; animation-fill-mode: forwards;"
>
  <!-- Corner accent -->
  <div class="absolute top-0 right-0 w-12 h-12 opacity-10" aria-hidden="true">
    <div class="absolute top-0 right-0 w-full h-0.5 {c.accent} bg-current" />
    <div class="absolute top-0 right-0 h-full w-0.5 {c.accent} bg-current" />
  </div>

  <!-- Value -->
  <p class="text-3xl md:text-4xl font-extrabold {c.accent} font-mono tracking-tight mb-1">
    {value}
  </p>

  <!-- Label -->
  <p class="text-os-muted text-sm leading-snug">
    {label}
  </p>
</div>
