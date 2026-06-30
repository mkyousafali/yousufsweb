import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { query } from '$lib/server/db';

/** POST /api/contact — save a public contact form submission */
export const POST: RequestHandler = async ({ request }) => {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    error(400, 'Invalid JSON');
  }

  const name     = (body.name     as string)?.trim();
  const email    = (body.email    as string)?.trim();
  const message  = (body.message  as string)?.trim();
  const country  = (body.country  as string)?.trim() || null;
  const whatsapp = (body.whatsapp as string)?.trim() || null;

  if (!name || name.length < 2)          error(400, 'Name is required');
  if (!email || !email.includes('@'))    error(400, 'Valid email is required');
  if (!message || message.length < 5)    error(400, 'Message is required');

  const rows = await query(
    `INSERT INTO "YOUSUFS_contact_requests" (name, country, email, whatsapp, message)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, created_at`,
    [name, country, email, whatsapp, message]
  );

  return json({ success: true, id: (rows[0] as any).id }, { status: 201 });
};
