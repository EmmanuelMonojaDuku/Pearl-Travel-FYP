-- =============================================================================
-- Migration 003: Administrator Portal & Operational Schema (Additive Only)
-- Target: Supabase PostgreSQL
--
-- Safety guarantees:
-- - Additive only: does NOT modify or drop auth.* or existing tables.
-- - Uses RLS enabled + privilege revocation on `anon` and `authenticated` roles
--   so browser PostgREST clients cannot bypass Fastify RBAC enforcement.
-- - Enforces author/approver separation at database constraint level.
-- =============================================================================

-- 1. Supported Border Posts (Malaba OSBP featured case study)
CREATE TABLE IF NOT EXISTS public.pt_admin_border_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(40) NOT NULL UNIQUE,
  name VARCHAR(180) NOT NULL,
  country_pair VARCHAR(120) NOT NULL DEFAULT 'Uganda / Kenya',
  region VARCHAR(120) NOT NULL DEFAULT 'Eastern Uganda (Tororo District)',
  post_type VARCHAR(60) NOT NULL DEFAULT 'One-Stop Border Post (OSBP)',
  operating_hours VARCHAR(120) NOT NULL DEFAULT '24 Hours / 7 Days',
  status VARCHAR(30) NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'maintenance', 'restricted')),
  is_case_study BOOLEAN NOT NULL DEFAULT FALSE,
  coordinates_lat NUMERIC(9, 6) NULL,
  coordinates_lng NUMERIC(9, 6) NULL,
  notes TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO public.pt_admin_border_posts (
  code, name, country_pair, region, post_type, operating_hours,
  status, is_case_study, coordinates_lat, coordinates_lng, notes
)
VALUES (
  'MALABA-OSBP',
  'Malaba One-Stop Border Post (OSBP)',
  'Uganda / Kenya',
  'Eastern Uganda (Tororo District)',
  'One-Stop Border Post (OSBP)',
  '24 Hours / 7 Days',
  'active',
  TRUE,
  0.635800,
  34.274700,
  'Primary Pearl Travel research case study post handling joint Uganda-Kenya immigration, Port Health, and URA Customs clearance.'
)
ON CONFLICT (code) DO NOTHING;

-- 2. Border Officer Assignments (Restricts border_officer access to assigned post)
CREATE TABLE IF NOT EXISTS public.pt_admin_officer_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.pt_auth_users(id) ON DELETE CASCADE,
  border_post_id UUID NOT NULL REFERENCES public.pt_admin_border_posts(id) ON DELETE CASCADE,
  assigned_by UUID NULL REFERENCES public.pt_auth_users(id) ON DELETE SET NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, border_post_id)
);

CREATE INDEX IF NOT EXISTS idx_pt_admin_officer_assignments_user
  ON public.pt_admin_officer_assignments (user_id)
  WHERE is_active = TRUE;

-- 3. Travel Guidance, FAQs & Operational Content (Approval Workflow)
CREATE TABLE IF NOT EXISTS public.pt_admin_content_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug VARCHAR(140) NOT NULL UNIQUE,
  content_type VARCHAR(40) NOT NULL DEFAULT 'guidance'
    CHECK (content_type IN ('guidance', 'faq', 'notice')),
  category VARCHAR(40) NOT NULL
    CHECK (category IN ('immigration', 'health', 'customs', 'border_post', 'transport')),
  title VARCHAR(240) NOT NULL,
  summary TEXT NOT NULL,
  body TEXT NOT NULL,
  official_authority VARCHAR(220) NOT NULL,
  border_post_id UUID NULL REFERENCES public.pt_admin_border_posts(id) ON DELETE SET NULL,
  keywords TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  workflow_status VARCHAR(30) NOT NULL DEFAULT 'draft'
    CHECK (workflow_status IN ('draft', 'pending_review', 'approved', 'rejected', 'published', 'archived')),
  rejection_reason TEXT NULL,
  author_id UUID NOT NULL REFERENCES public.pt_auth_users(id) ON DELETE RESTRICT,
  approver_id UUID NULL REFERENCES public.pt_auth_users(id) ON DELETE SET NULL,
  submitted_at TIMESTAMPTZ NULL,
  reviewed_at TIMESTAMPTZ NULL,
  published_at TIMESTAMPTZ NULL,
  archived_at TIMESTAMPTZ NULL,
  version INT NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_pt_content_author_approver_distinct
    CHECK (approver_id IS NULL OR approver_id <> author_id)
);

CREATE INDEX IF NOT EXISTS idx_pt_admin_content_status
  ON public.pt_admin_content_items (workflow_status, updated_at DESC);

-- 4. Governed Travel Requirements (Versioned & Approval-Gated)
CREATE TABLE IF NOT EXISTS public.pt_admin_requirements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(80) NOT NULL UNIQUE,
  category VARCHAR(40) NOT NULL
    CHECK (category IN ('entry', 'exit', 'visa', 'health', 'customs')),
  title VARCHAR(240) NOT NULL,
  summary TEXT NOT NULL,
  simple_explanation TEXT NOT NULL,
  applicable_condition TEXT NOT NULL,
  official_source VARCHAR(220) NOT NULL,
  mandatory BOOLEAN NOT NULL DEFAULT TRUE,
  rule_metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  border_post_id UUID NULL REFERENCES public.pt_admin_border_posts(id) ON DELETE SET NULL,
  workflow_status VARCHAR(30) NOT NULL DEFAULT 'draft'
    CHECK (workflow_status IN ('draft', 'pending_review', 'approved', 'rejected', 'published', 'archived')),
  rejection_reason TEXT NULL,
  author_id UUID NOT NULL REFERENCES public.pt_auth_users(id) ON DELETE RESTRICT,
  approver_id UUID NULL REFERENCES public.pt_auth_users(id) ON DELETE SET NULL,
  submitted_at TIMESTAMPTZ NULL,
  reviewed_at TIMESTAMPTZ NULL,
  published_at TIMESTAMPTZ NULL,
  archived_at TIMESTAMPTZ NULL,
  version INT NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_pt_requirements_author_approver_distinct
    CHECK (approver_id IS NULL OR approver_id <> author_id)
);

CREATE INDEX IF NOT EXISTS idx_pt_admin_requirements_status
  ON public.pt_admin_requirements (workflow_status, category);

-- 5. Registered Traveller Journeys
CREATE TABLE IF NOT EXISTS public.pt_journeys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.pt_auth_users(id) ON DELETE CASCADE,
  border_post_id UUID NULL REFERENCES public.pt_admin_border_posts(id) ON DELETE SET NULL,
  intended_border_point VARCHAR(180) NOT NULL,
  destination_country VARCHAR(140) NOT NULL DEFAULT 'Uganda',
  travel_purpose VARCHAR(60) NOT NULL DEFAULT 'tourism',
  travel_mode VARCHAR(30) NOT NULL DEFAULT 'road'
    CHECK (travel_mode IN ('road', 'air', 'rail')),
  travel_date DATE NOT NULL,
  stay_duration_days INT NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'planned'
    CHECK (status IN ('planned', 'ready', 'in_transit', 'crossed', 'cancelled')),
  notes TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pt_journeys_user_created
  ON public.pt_journeys (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_pt_journeys_border_date
  ON public.pt_journeys (border_post_id, travel_date DESC);

-- 6. Server-Computed Readiness Assessments
CREATE TABLE IF NOT EXISTS public.pt_readiness_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.pt_auth_users(id) ON DELETE CASCADE,
  journey_id UUID NULL REFERENCES public.pt_journeys(id) ON DELETE SET NULL,
  border_post_id UUID NULL REFERENCES public.pt_admin_border_posts(id) ON DELETE SET NULL,
  nationality VARCHAR(120) NOT NULL,
  requirements_version INT NOT NULL DEFAULT 1,
  score SMALLINT NOT NULL CHECK (score >= 0 AND score <= 100),
  readiness_status VARCHAR(60) NOT NULL
    CHECK (readiness_status IN ('Ready', 'Action Needed', 'Critical Requirements Missing')),
  completed_items INT NOT NULL DEFAULT 0,
  total_items INT NOT NULL DEFAULT 0,
  missing_mandatory_count INT NOT NULL DEFAULT 0,
  checklist_snapshot JSONB NOT NULL DEFAULT '[]'::jsonb,
  assessed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pt_readiness_user_assessed
  ON public.pt_readiness_assessments (user_id, assessed_at DESC);

CREATE INDEX IF NOT EXISTS idx_pt_readiness_nationality
  ON public.pt_readiness_assessments (nationality, readiness_status);

-- 7. Server-Issued QR Readiness Summaries (token_digest hashed, never exposed)
CREATE TABLE IF NOT EXISTS public.pt_qr_summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reference_code VARCHAR(40) NOT NULL UNIQUE,
  user_id UUID NOT NULL REFERENCES public.pt_auth_users(id) ON DELETE CASCADE,
  assessment_id UUID NULL REFERENCES public.pt_readiness_assessments(id) ON DELETE SET NULL,
  border_post_id UUID NULL REFERENCES public.pt_admin_border_posts(id) ON DELETE SET NULL,
  token_digest CHAR(64) NOT NULL UNIQUE,
  requirements_version INT NOT NULL DEFAULT 1,
  readiness_score SMALLINT NOT NULL CHECK (readiness_score >= 0 AND readiness_score <= 100),
  readiness_status VARCHAR(60) NOT NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'valid'
    CHECK (status IN ('valid', 'expired', 'revoked')),
  issued_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ NULL,
  revoked_by UUID NULL REFERENCES public.pt_auth_users(id) ON DELETE SET NULL,
  revocation_reason TEXT NULL
);

CREATE INDEX IF NOT EXISTS idx_pt_qr_summaries_status
  ON public.pt_qr_summaries (status, issued_at DESC);

-- 8. Officer QR Verification Records
CREATE TABLE IF NOT EXISTS public.pt_qr_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  qr_summary_id UUID NOT NULL REFERENCES public.pt_qr_summaries(id) ON DELETE CASCADE,
  officer_user_id UUID NULL REFERENCES public.pt_auth_users(id) ON DELETE SET NULL,
  border_post_id UUID NULL REFERENCES public.pt_admin_border_posts(id) ON DELETE SET NULL,
  outcome VARCHAR(30) NOT NULL
    CHECK (outcome IN ('verified', 'expired', 'revoked', 'invalid')),
  notes TEXT NULL,
  verified_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pt_qr_verifications_time
  ON public.pt_qr_verifications (verified_at DESC);

-- 9. Controlled System Settings (Non-secret operational configuration only)
CREATE TABLE IF NOT EXISTS public.pt_admin_settings (
  key VARCHAR(100) PRIMARY KEY,
  category VARCHAR(40) NOT NULL
    CHECK (category IN ('application', 'border_post', 'content', 'security', 'operational')),
  label VARCHAR(160) NOT NULL,
  description TEXT NOT NULL,
  value_json JSONB NOT NULL,
  updated_by UUID NULL REFERENCES public.pt_auth_users(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO public.pt_admin_settings (key, category, label, description, value_json)
VALUES
  (
    'case_study_border_post_code',
    'border_post',
    'Primary Case-Study Border Post',
    'Default One-Stop Border Post highlighted across Pearl Travel pre-arrival analytics and checklists.',
    '"MALABA-OSBP"'::jsonb
  ),
  (
    'qr_summary_ttl_hours',
    'operational',
    'QR Readiness Pass Validity (Hours)',
    'Lifetime of server-issued QR readiness summaries before automatic expiry.',
    '72'::jsonb
  ),
  (
    'enforce_author_approver_separation',
    'content',
    'Require Separate Content Approver',
    'Blocks content or requirement authors from approving their own submissions before publication.',
    'true'::jsonb
  ),
  (
    'enforce_officer_post_scoping',
    'security',
    'Restrict Officers to Assigned Border Post',
    'Enforces backend border-post scoping on verification and operational queries for border_officer accounts.',
    'true'::jsonb
  ),
  (
    'default_readiness_passing_score',
    'application',
    'Minimum Ready Score Threshold (%)',
    'Percentage threshold used alongside zero missing mandatory items to classify a crossing as Ready.',
    '100'::jsonb
  )
ON CONFLICT (key) DO NOTHING;

-- Updated-at triggers on mutable operational tables
DROP TRIGGER IF EXISTS trg_pt_admin_border_posts_updated_at ON public.pt_admin_border_posts;
CREATE TRIGGER trg_pt_admin_border_posts_updated_at
  BEFORE UPDATE ON public.pt_admin_border_posts
  FOR EACH ROW EXECUTE FUNCTION public.pt_set_updated_at();

DROP TRIGGER IF EXISTS trg_pt_admin_content_items_updated_at ON public.pt_admin_content_items;
CREATE TRIGGER trg_pt_admin_content_items_updated_at
  BEFORE UPDATE ON public.pt_admin_content_items
  FOR EACH ROW EXECUTE FUNCTION public.pt_set_updated_at();

DROP TRIGGER IF EXISTS trg_pt_admin_requirements_updated_at ON public.pt_admin_requirements;
CREATE TRIGGER trg_pt_admin_requirements_updated_at
  BEFORE UPDATE ON public.pt_admin_requirements
  FOR EACH ROW EXECUTE FUNCTION public.pt_set_updated_at();

DROP TRIGGER IF EXISTS trg_pt_journeys_updated_at ON public.pt_journeys;
CREATE TRIGGER trg_pt_journeys_updated_at
  BEFORE UPDATE ON public.pt_journeys
  FOR EACH ROW EXECUTE FUNCTION public.pt_set_updated_at();

-- Enable RLS and revoke PostgREST anon/authenticated privileges on all admin/operational tables
ALTER TABLE public.pt_admin_border_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pt_admin_officer_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pt_admin_content_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pt_admin_requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pt_journeys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pt_readiness_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pt_qr_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pt_qr_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pt_admin_settings ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    REVOKE ALL ON TABLE
      public.pt_admin_border_posts,
      public.pt_admin_officer_assignments,
      public.pt_admin_content_items,
      public.pt_admin_requirements,
      public.pt_journeys,
      public.pt_readiness_assessments,
      public.pt_qr_summaries,
      public.pt_qr_verifications,
      public.pt_admin_settings
    FROM anon;
  END IF;

  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    REVOKE ALL ON TABLE
      public.pt_admin_border_posts,
      public.pt_admin_officer_assignments,
      public.pt_admin_content_items,
      public.pt_admin_requirements,
      public.pt_journeys,
      public.pt_readiness_assessments,
      public.pt_qr_summaries,
      public.pt_qr_verifications,
      public.pt_admin_settings
    FROM authenticated;
  END IF;
END
$$;
