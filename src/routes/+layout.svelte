<script lang="ts">
  import '../app.css';
  import { onMount } from 'svelte';
  import { invalidate } from '$app/navigation';
  import type { LayoutData } from './$types';

  export let data: LayoutData;
  export let params = {}; // Accept params prop even if unused

  $: ({ supabase, session } = data);

  onMount(() => {
    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, _session) => {
      // Re-run all load functions when auth state changes
      invalidate('supabase:auth');
    });

    return () => subscription.unsubscribe();
  });
</script>

<slot />
