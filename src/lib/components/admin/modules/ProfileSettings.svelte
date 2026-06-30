<script lang="ts">
  import { onMount } from 'svelte';
  import type { Profile } from '$lib/types';
  import PhotoCropper from '$lib/components/admin/PhotoCropper.svelte';

  let profile: Profile | null = null;
  let loading = true;
  let saving = false;
  let uploadingPhoto = false;
  let error: string | null = null;
  let success = false;
  let fileInput: HTMLInputElement;
  let dragOver = false;

  // Cropper state
  let cropperSrc: string | null = null;
  let pendingFile: File | null = null;

  let form = {
    display_name: '',
    bio: '',
    avatar_url: '',
    whatsapp: ''
  };

  async function fetchProfile() {
    loading = true;
    error = null;
    try {
      const res = await fetch('/api/admin/profile');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      profile = await res.json();
      if (profile) {
        form.display_name = profile.display_name ?? '';
        form.bio          = profile.bio ?? '';
        form.avatar_url   = profile.avatar_url ?? '';
        form.whatsapp     = (profile as any).whatsapp ?? '';
      }
    } catch (e) {
      error = e instanceof Error ? e.message : 'Failed to load profile';
    } finally {
      loading = false;
    }
  }

  async function uploadPhoto(file: File) {
    if (!file) return;
    uploadingPhoto = true;
    error = null;
    try {
      const fd = new FormData();
      fd.append('file', file, file.name.replace(/\.[^.]+$/, '.jpg'));
      fd.append('save_as_profile_photo', 'true');

      const res = await fetch('/api/admin/upload', { method: 'POST', body: fd });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message ?? `HTTP ${res.status}`);
      }
      const { url } = await res.json();
      form.avatar_url = url;
      await saveProfile(true);
    } catch (e) {
      error = e instanceof Error ? e.message : 'Upload failed';
    } finally {
      uploadingPhoto = false;
    }
  }

  function onFileChange(e: Event) {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    // Show cropper before uploading
    const reader = new FileReader();
    reader.onload = ev => {
      cropperSrc = ev.target?.result as string;
      pendingFile = file;
    };
    reader.readAsDataURL(file);
    input.value = '';
  }

  function onDrop(e: DragEvent) {
    e.preventDefault();
    dragOver = false;
    const file = e.dataTransfer?.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      cropperSrc = ev.target?.result as string;
      pendingFile = file;
    };
    reader.readAsDataURL(file);
  }

  async function onCropApply(e: CustomEvent<Blob>) {
    cropperSrc = null;
    const blob = e.detail;
    const ext  = pendingFile?.name.split('.').pop()?.toLowerCase() || 'jpg';
    const file = new File([blob], `photo.${ext}`, { type: 'image/jpeg' });
    pendingFile = null;
    await uploadPhoto(file);
  }

  async function onCropCancel() {
    cropperSrc = null;
    pendingFile = null;
  }

  // Load existing uploaded photo into cropper for re-adjustment
  let loadingAdjust = false;
  async function adjustExistingPhoto() {
    if (!form.avatar_url) return;
    loadingAdjust = true;
    error = null;
    try {
      const res = await fetch(form.avatar_url);
      const blob = await res.blob();
      const reader = new FileReader();
      reader.onload = ev => {
        cropperSrc = ev.target?.result as string;
        // Create a synthetic File so uploadPhoto can use the correct name/type
        pendingFile = new File([blob], 'profile.jpg', { type: blob.type || 'image/jpeg' });
      };
      reader.readAsDataURL(blob);
    } catch {
      error = 'Could not load photo for editing';
    } finally {
      loadingAdjust = false;
    }
  }

  async function saveProfile(silent = false) {
    saving = true;
    if (!silent) { error = null; success = false; }
    try {
      const res = await fetch('/api/admin/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      profile = { ...profile!, ...form };
      if (!silent) { success = true; setTimeout(() => (success = false), 3000); }
    } catch (e) {
      error = e instanceof Error ? e.message : 'Save failed';
    } finally {
      saving = false;
    }
  }

  onMount(fetchProfile);
</script>

{#if cropperSrc}
  <PhotoCropper src={cropperSrc} on:crop={onCropApply} on:cancel={onCropCancel} />
{/if}

<div class="module-container h-full flex flex-col bg-os-window">
  <div class="px-4 pt-4 pb-3 border-b border-os-border flex-shrink-0">
    <h2 class="text-os-text font-semibold text-sm">Profile Settings</h2>
    <p class="text-os-muted text-xs mt-0.5">Manage your administrator account &amp; public photograph</p>
  </div>

  <div class="flex-1 overflow-y-auto p-4">
    {#if loading}
      <div class="flex items-center justify-center h-32 text-os-muted text-sm">Loading profile…</div>
    {:else if profile}
      <form on:submit|preventDefault={() => saveProfile(false)} class="space-y-5 max-w-sm">

        <!-- ── Photo Upload ─────────────────────────────────── -->
        <div>
          <label class="form-label mb-2 block">Profile Photograph</label>

          <!-- Drop zone -->
          <!-- svelte-ignore a11y-no-static-element-interactions -->
          <div
            class="relative rounded-xl border-2 border-dashed transition-colors duration-200 overflow-hidden cursor-pointer
              {dragOver ? 'border-os-accent bg-os-accent/5' : 'border-os-border hover:border-os-accent/40'}"
            style="aspect-ratio: 3/4; max-height: 260px;"
            on:click={() => fileInput.click()}
            on:dragover|preventDefault={() => (dragOver = true)}
            on:dragleave={() => (dragOver = false)}
            on:drop={onDrop}
            role="button"
            tabindex="0"
            on:keydown={e => e.key === 'Enter' && fileInput.click()}
            aria-label="Upload profile photograph"
          >
            {#if uploadingPhoto}
              <!-- Uploading state -->
              <div class="absolute inset-0 flex flex-col items-center justify-center bg-os-window/90 z-10">
                <svg class="w-6 h-6 text-os-accent animate-spin mb-2" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
                <p class="text-os-muted text-xs">Uploading…</p>
              </div>
            {/if}

            {#if form.avatar_url}
              <!-- Photo preview -->
              <img
                src={form.avatar_url}
                alt="Profile"
                class="w-full h-full object-cover object-top"
              />
              <!-- Overlay on hover: two actions -->
              <div class="absolute inset-0 bg-black/60 opacity-0 hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-3">
                <!-- Replace -->
                <button
                  type="button"
                  on:click|stopPropagation={() => fileInput.click()}
                  class="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs transition-colors"
                >
                  <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Replace Photo
                </button>
                <!-- Adjust existing -->
                <button
                  type="button"
                  on:click|stopPropagation={adjustExistingPhoto}
                  disabled={loadingAdjust}
                  class="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#4a9eff]/20 hover:bg-[#4a9eff]/40 border border-[#4a9eff]/40 text-[#4a9eff] text-xs transition-colors disabled:opacity-50"
                >
                  {#if loadingAdjust}
                    <svg class="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                    </svg>
                  {:else}
                    <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                    </svg>
                  {/if}
                  {loadingAdjust ? 'Loading…' : 'Adjust / Crop'}
                </button>
              </div>
            {:else}
              <!-- Empty state -->
              <div class="absolute inset-0 flex flex-col items-center justify-center gap-2 text-os-muted">
                <svg class="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p class="text-xs text-center leading-relaxed px-4">
                  Click or drag &amp; drop<br/>
                  <span class="text-[10px]">JPEG · PNG · WebP — max 10 MB</span>
                </p>
              </div>
            {/if}
          </div>

          <input
            bind:this={fileInput}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            class="hidden"
            on:change={onFileChange}
          />

          {#if form.avatar_url}
            <p class="text-os-success text-[10px] mt-1.5 flex items-center gap-1">
              <span>✔</span> Photo uploaded — hover to Replace or Adjust
            </p>
          {/if}
        </div>

        <!-- ── Read-only info ──────────────────────────────── -->
        <div class="bg-os-surface border border-os-border rounded-lg p-3 space-y-1">
          <div class="flex justify-between text-xs">
            <span class="text-os-muted">Email</span>
            <span class="text-os-text font-mono">{profile.email ?? '—'}</span>
          </div>
          <div class="flex justify-between text-xs">
            <span class="text-os-muted">Role</span>
            <span class="badge badge-accent">{profile.role}</span>
          </div>
          <div class="flex justify-between text-xs">
            <span class="text-os-muted">Member since</span>
            <span class="text-os-text font-mono">{new Date(profile.created_at).toLocaleDateString()}</span>
          </div>
        </div>

        <!-- ── Editable fields ────────────────────────────── -->
        <div>
          <label class="form-label" for="display_name">Display Name</label>
          <input
            id="display_name"
            type="text"
            class="form-input"
            bind:value={form.display_name}
            placeholder="Your name"
            required
            maxlength="100"
          />
        </div>

        <div>
          <label class="form-label" for="bio">Bio</label>
          <textarea
            id="bio"
            class="form-input resize-none"
            rows="4"
            bind:value={form.bio}
            placeholder="A brief professional description…"
            maxlength="500"
          />
          <p class="text-os-muted text-[10px] mt-1">{form.bio.length} / 500</p>
        </div>

        <div>
          <label class="form-label" for="whatsapp">WhatsApp Number</label>
          <div class="relative">
            <span class="absolute left-3 top-1/2 -translate-y-1/2 text-os-success text-xs select-none font-mono">+</span>
            <input
              id="whatsapp"
              type="tel"
              class="form-input pl-6"
              bind:value={form.whatsapp}
              placeholder="919526380670"
              maxlength="20"
            />
          </div>
          <p class="text-os-muted text-[10px] mt-1">Country code without +, e.g. 919526380670. Shown as floating button on public page.</p>
        </div>

        {#if error}
          <p class="text-os-danger text-xs">⚠ {error}</p>
        {/if}
        {#if success}
          <p class="text-os-success text-xs">✔ Profile saved successfully.</p>
        {/if}

        <button type="submit" class="btn-primary w-full py-2" disabled={saving || uploadingPhoto}>
          {saving ? 'Saving…' : 'Save Changes'}
        </button>
      </form>
    {:else}
      <p class="text-os-muted text-sm">Profile not found.</p>
    {/if}
  </div>
</div>


<div class="module-container h-full flex flex-col bg-os-window">
  <div class="px-4 pt-4 pb-3 border-b border-os-border flex-shrink-0">
    <h2 class="text-os-text font-semibold text-sm">Profile Settings</h2>
    <p class="text-os-muted text-xs mt-0.5">Manage your administrator account</p>
  </div>

  <div class="flex-1 overflow-y-auto p-4">
    {#if loading}
      <div class="flex items-center justify-center h-32 text-os-muted text-sm">Loading profile…</div>
    {:else if profile}
      <form on:submit|preventDefault={saveProfile} class="space-y-5 max-w-sm">

        <!-- Avatar preview -->
        {#if form.avatar_url}
          <div class="flex justify-center">
            <img
              src={form.avatar_url}
              alt="Avatar"
              class="w-20 h-20 rounded-full border-2 border-os-accent/30 object-cover"
            />
          </div>
        {/if}

        <!-- Read-only info -->
        <div class="bg-os-surface border border-os-border rounded-lg p-3 space-y-1">
          <div class="flex justify-between text-xs">
            <span class="text-os-muted">Email</span>
            <span class="text-os-text font-mono">{profile.email ?? '—'}</span>
          </div>
          <div class="flex justify-between text-xs">
            <span class="text-os-muted">Role</span>
            <span class="badge badge-accent">{profile.role}</span>
          </div>
          <div class="flex justify-between text-xs">
            <span class="text-os-muted">Member since</span>
            <span class="text-os-text font-mono">{new Date(profile.created_at).toLocaleDateString()}</span>
          </div>
        </div>

        <!-- Editable fields -->
        <div>
          <label class="form-label" for="display_name">Display Name</label>
          <input
            id="display_name"
            type="text"
            class="form-input"
            bind:value={form.display_name}
            placeholder="Your name"
            required
            maxlength="100"
          />
        </div>

        <div>
          <label class="form-label" for="avatar_url">Avatar URL</label>
          <input
            id="avatar_url"
            type="url"
            class="form-input"
            bind:value={form.avatar_url}
            placeholder="https://example.com/avatar.jpg"
          />
          <p class="text-os-muted text-[10px] mt-1">Link to an image hosted on Supabase Storage or CDN</p>
        </div>

        <div>
          <label class="form-label" for="bio">Bio</label>
          <textarea
            id="bio"
            class="form-input resize-none"
            rows="4"
            bind:value={form.bio}
            placeholder="A brief professional description…"
            maxlength="500"
          />
          <p class="text-os-muted text-[10px] mt-1">{form.bio.length} / 500</p>
        </div>

        <!-- Errors / success -->
        {#if error}
          <p class="text-os-danger text-xs">⚠ {error}</p>
        {/if}
        {#if success}
          <p class="text-os-success text-xs">✔ Profile saved successfully.</p>
        {/if}

        <button type="submit" class="btn-primary w-full py-2" disabled={saving}>
          {saving ? 'Saving…' : 'Save Changes'}
        </button>
      </form>
    {:else}
      <p class="text-os-muted text-sm">Profile not found.</p>
    {/if}
  </div>
</div>
