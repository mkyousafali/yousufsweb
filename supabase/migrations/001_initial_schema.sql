-- ================================================================
-- YOUSUFWEB — Initial Database Schema Migration
-- File: supabase/migrations/001_initial_schema.sql
--
-- CRITICAL: All tables use YOUSUFS_ prefix to prevent namespace
-- collisions with other applications in this shared Supabase
-- database instance.
--
-- Run this migration in the Supabase SQL Editor or via CLI:
--   supabase db push
-- ================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For fast text search

-- ================================================================
-- TABLE: YOUSUFS_profiles
-- Links to auth.users. Auto-created on signup via trigger.
-- ================================================================
CREATE TABLE IF NOT EXISTS "YOUSUFS_profiles" (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name  TEXT NOT NULL DEFAULT 'Administrator',
  email         TEXT,
  avatar_url    TEXT,
  bio           TEXT,
  role          TEXT NOT NULL DEFAULT 'admin'
                  CHECK (role IN ('admin', 'viewer')),
  meta          JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE "YOUSUFS_profiles" IS
  'Admin profile records linked to Supabase auth.users.';

-- RLS
ALTER TABLE "YOUSUFS_profiles" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "yousufs_profiles_owner_all"
  ON "YOUSUFS_profiles" FOR ALL
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- updated_at trigger
CREATE OR REPLACE FUNCTION yousufs_set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER yousufs_profiles_updated_at
  BEFORE UPDATE ON "YOUSUFS_profiles"
  FOR EACH ROW EXECUTE FUNCTION yousufs_set_updated_at();

-- Auto-create profile on new auth user signup
CREATE OR REPLACE FUNCTION yousufs_handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO "YOUSUFS_profiles" (id, email, display_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$;

-- Drop trigger if it exists to support re-runs
DROP TRIGGER IF EXISTS on_auth_user_created_yousufs ON auth.users;

CREATE TRIGGER on_auth_user_created_yousufs
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION yousufs_handle_new_user();

-- ================================================================
-- TABLE: YOUSUFS_site_content
-- Key-value store for all public-facing text and configuration.
-- ================================================================
CREATE TABLE IF NOT EXISTS "YOUSUFS_site_content" (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  content_key    TEXT NOT NULL UNIQUE,
  content_value  TEXT,
  content_type   TEXT NOT NULL DEFAULT 'text'
                   CHECK (content_type IN ('text', 'html', 'json', 'url', 'boolean', 'number')),
  label          TEXT,
  description    TEXT,
  section        TEXT NOT NULL DEFAULT 'general',
  is_public      BOOLEAN NOT NULL DEFAULT true,
  sort_order     INTEGER NOT NULL DEFAULT 0,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE "YOUSUFS_site_content" IS
  'Key-value store for all dynamic public site text, headers, CTAs, and UI configuration.';
COMMENT ON COLUMN "YOUSUFS_site_content".content_key IS
  'Unique identifier used in code to retrieve this content item.';
COMMENT ON COLUMN "YOUSUFS_site_content".section IS
  'Logical grouping: hero | metrics | about | footer | global';

ALTER TABLE "YOUSUFS_site_content" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "yousufs_site_content_public_read"
  ON "YOUSUFS_site_content" FOR SELECT
  USING (is_public = true);

CREATE POLICY "yousufs_site_content_auth_all"
  ON "YOUSUFS_site_content" FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE TRIGGER yousufs_site_content_updated_at
  BEFORE UPDATE ON "YOUSUFS_site_content"
  FOR EACH ROW EXECUTE FUNCTION yousufs_set_updated_at();

CREATE INDEX IF NOT EXISTS yousufs_site_content_section_idx
  ON "YOUSUFS_site_content" (section);

-- ── Seed default content ────────────────────────────────────────
INSERT INTO "YOUSUFS_site_content"
  (content_key, content_value, content_type, label, section, sort_order)
VALUES
  -- Global
  ('site_title',             'Yousuf — Enterprise Technology Architect',
   'text', 'Site Title', 'global', 1),
  ('site_description',       'Executive portfolio showcasing enterprise automation systems, AI-integrated workflows, and scalable infrastructure deployments.',
   'text', 'Site Meta Description', 'global', 2),

  -- Hero
  ('hero_headline',          'I Build Enterprise Systems That Automate Everything.',
   'text', 'Hero Headline', 'hero', 1),
  ('hero_sub_headline',      'Strategic Technology Executive  ·  Systems Architect  ·  AI Automation Engineer',
   'text', 'Hero Sub Headline', 'hero', 2),
  ('hero_tag_line',          'Deploying scalable infrastructure and autonomous workflows since 2015.',
   'text', 'Hero Tagline', 'hero', 3),
  ('hero_cta_primary',       'View Case Studies',
   'text', 'Primary CTA Text', 'hero', 4),
  ('hero_cta_secondary',     'Request Consultation',
   'text', 'Secondary CTA Text', 'hero', 5),

  -- Metrics
  ('metric_systems',         '47+',
   'text', 'Systems Automated Count', 'metrics', 1),
  ('metric_systems_label',   'Enterprise Systems Automated',
   'text', 'Systems Label', 'metrics', 2),
  ('metric_uptime',          '99.98%',
   'text', 'Uptime Metric', 'metrics', 3),
  ('metric_uptime_label',    'Average System Uptime',
   'text', 'Uptime Label', 'metrics', 4),
  ('metric_cost_saved',      '$4.2M+',
   'text', 'Cost Savings Metric', 'metrics', 5),
  ('metric_cost_saved_label','Operational Costs Reduced',
   'text', 'Cost Savings Label', 'metrics', 6),
  ('metric_teams',           '120+',
   'text', 'Teams Count Metric', 'metrics', 7),
  ('metric_teams_label',     'Teams Deployed & Trained',
   'text', 'Teams Label', 'metrics', 8),

  -- About
  ('about_name',             'Yousuf',
   'text', 'Full Name', 'about', 1),
  ('about_title',            'Chief Technology Architect',
   'text', 'Professional Title', 'about', 2),
  ('about_description',      'A results-driven technology executive specialising in designing and deploying enterprise-grade automation frameworks, AI-integrated workflows, and mission-critical infrastructure at scale.',
   'text', 'About Description', 'about', 3),

  -- Footer
  ('footer_copyright',       '© 2025 Yousuf. All Rights Reserved.',
   'text', 'Footer Copyright', 'footer', 1)

ON CONFLICT (content_key) DO NOTHING;

-- ================================================================
-- TABLE: YOUSUFS_media_library
-- Cloud storage asset registry (Supabase Storage or external CDN).
-- ================================================================
CREATE TABLE IF NOT EXISTS "YOUSUFS_media_library" (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  file_name        TEXT NOT NULL,
  storage_path     TEXT NOT NULL,
  public_url       TEXT,
  alt_text         TEXT,
  description      TEXT,
  mime_type        TEXT NOT NULL,
  file_size_bytes  BIGINT,
  width            INTEGER,
  height           INTEGER,
  tags             TEXT[] NOT NULL DEFAULT '{}',
  is_active        BOOLEAN NOT NULL DEFAULT true,
  uploaded_by      UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  meta             JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE "YOUSUFS_media_library" IS
  'Registry of all uploaded media assets. public_url points to CDN/Supabase Storage.';

ALTER TABLE "YOUSUFS_media_library" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "yousufs_media_public_read"
  ON "YOUSUFS_media_library" FOR SELECT
  USING (is_active = true);

CREATE POLICY "yousufs_media_auth_all"
  ON "YOUSUFS_media_library" FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE TRIGGER yousufs_media_updated_at
  BEFORE UPDATE ON "YOUSUFS_media_library"
  FOR EACH ROW EXECUTE FUNCTION yousufs_set_updated_at();

CREATE INDEX IF NOT EXISTS yousufs_media_active_idx
  ON "YOUSUFS_media_library" (is_active) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS yousufs_media_tags_idx
  ON "YOUSUFS_media_library" USING GIN (tags);

-- ================================================================
-- TABLE: YOUSUFS_automation_cases
-- Portfolio case studies for enterprise automation engagements.
-- ================================================================
CREATE TABLE IF NOT EXISTS "YOUSUFS_automation_cases" (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title            TEXT NOT NULL,
  slug             TEXT NOT NULL UNIQUE,
  client_name      TEXT,
  industry         TEXT,
  challenge        TEXT NOT NULL,
  solution         TEXT NOT NULL,
  outcome          TEXT NOT NULL,
  tech_stack       TEXT[] NOT NULL DEFAULT '{}',
  roi_metric       TEXT,
  duration_weeks   INTEGER,
  status           TEXT NOT NULL DEFAULT 'draft'
                     CHECK (status IN ('draft', 'published', 'archived')),
  is_featured      BOOLEAN NOT NULL DEFAULT false,
  cover_image_id   UUID REFERENCES "YOUSUFS_media_library"(id) ON DELETE SET NULL,
  tags             TEXT[] NOT NULL DEFAULT '{}',
  sort_order       INTEGER NOT NULL DEFAULT 0,
  meta             JSONB NOT NULL DEFAULT '{}'::jsonb,
  published_at     TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE "YOUSUFS_automation_cases" IS
  'Enterprise automation case studies displayed on the public portfolio.';

ALTER TABLE "YOUSUFS_automation_cases" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "yousufs_cases_published_read"
  ON "YOUSUFS_automation_cases" FOR SELECT
  USING (status = 'published');

CREATE POLICY "yousufs_cases_auth_all"
  ON "YOUSUFS_automation_cases" FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE INDEX IF NOT EXISTS yousufs_cases_slug_idx
  ON "YOUSUFS_automation_cases" (slug);
CREATE INDEX IF NOT EXISTS yousufs_cases_status_idx
  ON "YOUSUFS_automation_cases" (status);
CREATE INDEX IF NOT EXISTS yousufs_cases_featured_idx
  ON "YOUSUFS_automation_cases" (is_featured) WHERE is_featured = true;
CREATE INDEX IF NOT EXISTS yousufs_cases_tags_idx
  ON "YOUSUFS_automation_cases" USING GIN (tags);
CREATE INDEX IF NOT EXISTS yousufs_cases_tech_stack_idx
  ON "YOUSUFS_automation_cases" USING GIN (tech_stack);

-- Auto-set published_at and updated_at
CREATE OR REPLACE FUNCTION yousufs_cases_on_update()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  IF NEW.status = 'published' AND (OLD.status IS DISTINCT FROM 'published') THEN
    NEW.published_at = COALESCE(NEW.published_at, NOW());
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER yousufs_cases_updated_at
  BEFORE UPDATE ON "YOUSUFS_automation_cases"
  FOR EACH ROW EXECUTE FUNCTION yousufs_cases_on_update();

-- Seed sample case study
INSERT INTO "YOUSUFS_automation_cases"
  (title, slug, client_name, industry, challenge, solution, outcome,
   tech_stack, roi_metric, duration_weeks, status, is_featured, sort_order)
VALUES (
  'Enterprise ERP Automation Suite',
  'enterprise-erp-automation',
  'Fortune 500 Logistics Corp',
  'Logistics & Supply Chain',
  'Manual invoice processing across 12 regional offices consuming 3,200 staff-hours per month with a 4.7% error rate.',
  'Designed and deployed an AI-driven document processing pipeline integrating OCR, NLP classification, and ERP API connectors with real-time exception dashboards.',
  'Reduced processing time by 94%. Error rate dropped to 0.2%. Freed 3,000+ hours/month for strategic work.',
  ARRAY['Python', 'FastAPI', 'PostgreSQL', 'Apache Kafka', 'AWS Lambda', 'Tesseract OCR', 'OpenAI GPT-4'],
  '$1.8M annual savings',
  14,
  'published',
  true,
  1
) ON CONFLICT (slug) DO NOTHING;

-- ================================================================
-- TABLE: YOUSUFS_tasks_logs
-- Internal audit trail and system activity log for the dashboard.
-- ================================================================
CREATE TABLE IF NOT EXISTS "YOUSUFS_tasks_logs" (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_name      TEXT NOT NULL,
  task_type      TEXT NOT NULL DEFAULT 'system'
                   CHECK (task_type IN ('system', 'manual', 'scheduled', 'api', 'auth', 'error', 'content')),
  status         TEXT NOT NULL DEFAULT 'success'
                   CHECK (status IN ('pending', 'running', 'success', 'failed', 'cancelled')),
  description    TEXT,
  payload        JSONB NOT NULL DEFAULT '{}'::jsonb,
  result         JSONB NOT NULL DEFAULT '{}'::jsonb,
  error_message  TEXT,
  duration_ms    INTEGER,
  triggered_by   UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ip_address     INET,
  user_agent     TEXT,
  started_at     TIMESTAMPTZ,
  completed_at   TIMESTAMPTZ,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE "YOUSUFS_tasks_logs" IS
  'Immutable audit log for all system, manual, and scheduled operations.';

ALTER TABLE "YOUSUFS_tasks_logs" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "yousufs_tasks_auth_read"
  ON "YOUSUFS_tasks_logs" FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "yousufs_tasks_auth_insert"
  ON "YOUSUFS_tasks_logs" FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Logs are immutable — no UPDATE or DELETE policies

CREATE INDEX IF NOT EXISTS yousufs_tasks_type_idx
  ON "YOUSUFS_tasks_logs" (task_type);
CREATE INDEX IF NOT EXISTS yousufs_tasks_status_idx
  ON "YOUSUFS_tasks_logs" (status);
CREATE INDEX IF NOT EXISTS yousufs_tasks_created_idx
  ON "YOUSUFS_tasks_logs" (created_at DESC);

-- Seed initial system log entries
INSERT INTO "YOUSUFS_tasks_logs" (task_name, task_type, status, description) VALUES
  ('Database Schema Deployed',   'system',  'success', 'Migration 001_initial_schema.sql applied successfully'),
  ('Content Seeds Applied',      'system',  'success', 'Default content seeded to YOUSUFS_site_content'),
  ('RLS Policies Activated',     'system',  'success', 'Row Level Security enabled on all YOUSUFS_ tables'),
  ('Sample Case Study Seeded',   'system',  'success', 'Demo automation case study inserted into YOUSUFS_automation_cases'),
  ('Schema Indexes Created',     'system',  'success', 'Performance indexes created on all YOUSUFS_ tables');
