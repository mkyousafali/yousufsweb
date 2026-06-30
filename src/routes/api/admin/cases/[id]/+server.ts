import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

/** PATCH /api/admin/cases/[id] */
export const PATCH: RequestHandler = async ({ params, request, locals: { safeGetSession, supabase } }) => {
  const { session } = await safeGetSession();
  if (!session) error(401, 'Unauthorized');

  const { id } = params;
  if (!id) error(400, 'Missing id');

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    error(400, 'Invalid JSON body');
  }

  const allowed = [
    'title', 'client_name', 'industry', 'challenge', 'solution', 'outcome',
    'tech_stack', 'roi_metric', 'duration_weeks', 'status', 'is_featured',
    'tags', 'sort_order', 'meta'
  ];

  const patch: Record<string, unknown> = {};
  for (const key of allowed) {
    if (key in body) patch[key] = body[key];
  }

  if (Object.keys(patch).length === 0) error(400, 'No valid fields');

  const { data, error: dbError } = await supabase
    .from('YOUSUFS_automation_cases')
    .update(patch)
    .eq('id', id)
    .select()
    .single();

  if (dbError) error(500, dbError.message);

  return json(data);
};
