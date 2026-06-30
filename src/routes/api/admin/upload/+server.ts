import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { query } from '$lib/server/db';
import { createClient } from '@supabase/supabase-js';
import { PUBLIC_SUPABASE_URL } from '$env/static/public';
import { env } from '$env/dynamic/private';

/**
 * POST /api/admin/upload
 * Accepts: multipart/form-data with field "file"
 * Uploads to Supabase Storage bucket "yousufs-media"
 * Returns: { url: string, path: string }
 *
 * Optionally set field "save_as_profile_photo=true" to also update
 * YOUSUFS_site_content.profile_photo_url and YOUSUFS_profiles.avatar_url
 */
export const POST: RequestHandler = async ({ request, locals: { safeGetSession } }) => {
  const { session, user } = await safeGetSession();
  if (!session || !user) error(401, 'Unauthorized');

  // Use service role client for storage operations (bypasses RLS/policy restrictions)
  const adminClient = createClient(PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    error(400, 'Expected multipart/form-data');
  }

  const file = formData.get('file') as File | null;
  if (!file || !(file instanceof File)) error(400, 'Missing "file" field');

  const saveAsProfile = formData.get('save_as_profile_photo') === 'true';

  // Validate type and size
  const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  if (!allowed.includes(file.type)) {
    error(415, 'File must be JPEG, PNG, WebP, or GIF');
  }
  if (file.size > 10 * 1024 * 1024) {
    error(413, 'File exceeds 10 MB limit');
  }

  // Build storage path: profiles/<user-id>/<timestamp>.<ext>
  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
  const storagePath = `profiles/${user.id}/${Date.now()}.${ext}`;

  // Upload to Supabase Storage using service role (bypasses storage policies)
  const arrayBuffer = await file.arrayBuffer();
  const { error: uploadError } = await adminClient.storage
    .from('yousufs-media')
    .upload(storagePath, arrayBuffer, {
      contentType: file.type,
      upsert: true
    });

  if (uploadError) {
    console.error('[upload] Storage error:', uploadError.message);
    error(500, `Upload failed: ${uploadError.message}`);
  }

  // Get the public URL
  const { data: { publicUrl } } = adminClient.storage
    .from('yousufs-media')
    .getPublicUrl(storagePath);

  // Optionally save as the public profile photo
  if (saveAsProfile) {
    // Update YOUSUFS_profiles avatar_url via direct DB
    await query(
      `UPDATE "YOUSUFS_profiles" SET avatar_url = $1, updated_at = NOW() WHERE id = $2`,
      [publicUrl, user.id]
    );

    // Update YOUSUFS_users profile_photo_url via direct DB
    await query(
      `UPDATE "YOUSUFS_users" SET profile_photo_url = $1, updated_at = NOW() WHERE auth_id = $2`,
      [publicUrl, user.id]
    );

    // Upsert into YOUSUFS_site_content so the public page can read it
    await query(
      `INSERT INTO "YOUSUFS_site_content" (content_key, content_value, content_type, label, section, is_public, sort_order)
       VALUES ($1, $2, 'url', 'Profile Photograph URL', 'about', true, 10)
       ON CONFLICT (content_key) DO UPDATE SET content_value = $2, updated_at = NOW()`,
      ['profile_photo_url', publicUrl]
    );
  }

  // Register in YOUSUFS_media_library
  await query(
    `INSERT INTO "YOUSUFS_media_library"
     (file_name, storage_path, public_url, mime_type, file_size_bytes, uploaded_by, tags, alt_text)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
    [
      file.name, storagePath, publicUrl, file.type, file.size, user.id,
      saveAsProfile ? ['profile-photo'] : [],
      saveAsProfile ? 'Profile photograph' : file.name
    ]
  );

  return json({ url: publicUrl, path: storagePath });
};
