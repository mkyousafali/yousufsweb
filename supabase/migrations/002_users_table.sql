-- ================================================================
-- YOUSUFWEB — Migration 002: YOUSUFS_users + profile photo support
-- ================================================================

-- ================================================================
-- TABLE: YOUSUFS_users
-- Primary user registry. Tracks all system users with full details.
-- auth_id links to Supabase auth.users when the user has login access.
-- ================================================================
CREATE TABLE IF NOT EXISTS "YOUSUFS_users" (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  auth_id             UUID UNIQUE REFERENCES auth.users(id) ON DELETE SET NULL,
  full_name           TEXT NOT NULL,
  email               TEXT NOT NULL UNIQUE,
  phone               TEXT,
  role                TEXT NOT NULL DEFAULT 'admin'
                        CHECK (role IN ('admin', 'viewer', 'contact')),
  profile_photo_url   TEXT,
  bio                 TEXT,
  position            TEXT,
  company             TEXT,
  is_active           BOOLEAN NOT NULL DEFAULT true,
  last_sign_in        TIMESTAMPTZ,
  meta                JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE "YOUSUFS_users" IS
  'Primary user registry. Tracks all system users with extended profile data.';
COMMENT ON COLUMN "YOUSUFS_users".auth_id IS
  'Optional link to Supabase auth.users — set when user has login access.';
COMMENT ON COLUMN "YOUSUFS_users".profile_photo_url IS
  'Public URL of uploaded profile photograph, stored in Supabase Storage.';

-- RLS
ALTER TABLE "YOUSUFS_users" ENABLE ROW LEVEL SECURITY;

-- Public can read active user records (for portfolio display)
DO $$ BEGIN
  CREATE POLICY "yousufs_users_public_read"
    ON "YOUSUFS_users" FOR SELECT
    USING (is_active = true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Authenticated users can manage all records
DO $$ BEGIN
  CREATE POLICY "yousufs_users_auth_all"
    ON "YOUSUFS_users" FOR ALL
    USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- updated_at trigger
CREATE TRIGGER yousufs_users_updated_at
  BEFORE UPDATE ON "YOUSUFS_users"
  FOR EACH ROW EXECUTE FUNCTION yousufs_set_updated_at();

-- Auto-link YOUSUFS_users when a new auth user is created
CREATE OR REPLACE FUNCTION yousufs_link_auth_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  -- If a YOUSUFS_users record with this email exists, link the auth_id
  UPDATE "YOUSUFS_users"
  SET auth_id = NEW.id,
      updated_at = NOW()
  WHERE email = NEW.email AND auth_id IS NULL;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created_link_yousufs ON auth.users;
CREATE TRIGGER on_auth_user_created_link_yousufs
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION yousufs_link_auth_user();

-- Index
CREATE INDEX IF NOT EXISTS yousufs_users_email_idx    ON "YOUSUFS_users" (email);
CREATE INDEX IF NOT EXISTS yousufs_users_role_idx     ON "YOUSUFS_users" (role);
CREATE INDEX IF NOT EXISTS yousufs_users_auth_id_idx  ON "YOUSUFS_users" (auth_id);

-- ================================================================
-- Add profile_photo_url key to YOUSUFS_site_content
-- This allows the public page to display the uploaded photo
-- ================================================================
INSERT INTO "YOUSUFS_site_content"
  (content_key, content_value, content_type, label, description, section, is_public, sort_order)
VALUES
  ('profile_photo_url', '', 'url',
   'Profile Photograph URL',
   'Public URL of the executive profile photo uploaded via the admin panel.',
   'about', true, 10)
ON CONFLICT (content_key) DO NOTHING;

-- ================================================================
-- Pre-populate the admin YOUSUFS_users record
-- auth_id will be linked automatically when the auth user is created
-- ================================================================
INSERT INTO "YOUSUFS_users"
  (full_name, email, role, position, company, bio)
VALUES (
  'Yousafali M.K.',
  'mk.yousafali@gmail.com',
  'admin',
  'Chief Executive Officer',
  'Urban Market',
  'Retail enterprise operations leader and self-taught systems builder. CEO at Urban Market, Jizan, Saudi Arabia. Bridging boardroom strategy and digital execution since 2009.'
)
ON CONFLICT (email) DO NOTHING;
