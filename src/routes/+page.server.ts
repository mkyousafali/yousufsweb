import type { PageServerLoad } from './$types';
import type { ContentMap } from '$lib/types';
import { query } from '$lib/server/db';

export const load: PageServerLoad = async () => {
  const defaultContent: ContentMap = {
    site_title: 'Yousafali M.K. — Executive Profile',
    profile_photo_url: '',
    hero_headline: 'Enterprise Automation That Scales',
    hero_subheadline: 'Transforming manual workflows into intelligent systems',
    metric_systems: '47+',
    metric_systems_label: 'Enterprise Systems Automated',
    metric_uptime: '99.98%',
    metric_uptime_label: 'Average System Uptime',
    metric_cost_saved: '$4.2M+',
    metric_cost_saved_label: 'Operational Costs Reduced',
    metric_teams: '120+',
    metric_teams_label: 'Teams Deployed & Trained'
  };

  let content: ContentMap = { ...defaultContent };
  let cases = [];

  try {
    const rows = await query<{ content_key: string; content_value: string | null }>(
      `SELECT content_key, content_value FROM "YOUSUFS_site_content"
       WHERE is_public = true ORDER BY sort_order ASC`
    );
    for (const row of rows) {
      content[row.content_key] = row.content_value ?? '';
    }
  } catch (err) {
    console.warn('[YOUSUFS] Could not load site_content:', err instanceof Error ? err.message : String(err));
  }

  try {
    cases = await query(
      `SELECT id, title, slug, client_name, industry, outcome, tech_stack,
              roi_metric, is_featured, tags, sort_order
       FROM "YOUSUFS_automation_cases"
       WHERE status = 'published'
       ORDER BY sort_order ASC LIMIT 12`
    );
  } catch (err) {
    console.warn('[YOUSUFS] Could not load cases:', err instanceof Error ? err.message : String(err));
  }

  let languages = [];
  try {
    languages = await query(
      `SELECT name, native_name, can_read, can_write, can_speak, can_understand,
              label_read, label_write, label_speak, label_understand
       FROM "YOUSUFS_languages"
       WHERE is_active = true
       ORDER BY sort_order ASC`
    );
  } catch (err) {
    console.warn('[YOUSUFS] Could not load languages:', err instanceof Error ? err.message : String(err));
  }

  let timeline = [];
  try {
    timeline = await query(
      `SELECT id, period, title, org, location, description
       FROM "YOUSUFS_career_timeline"
       WHERE is_active = true
       ORDER BY sort_order ASC`
    );
  } catch (err) {
    console.warn('[YOUSUFS] Could not load career timeline:', err instanceof Error ? err.message : String(err));
  }

  let capabilities = [];
  try {
    capabilities = await query(
      `SELECT category, skill_text, sort_order
       FROM "YOUSUFS_capabilities"
       WHERE is_active = true
       ORDER BY sort_order ASC`
    );
  } catch (err) {
    console.warn('[YOUSUFS] Could not load capabilities:', err instanceof Error ? err.message : String(err));
  }

  return { content, cases, languages, timeline, capabilities };
};
