-- =============================================================================
-- Migration 001: Independent Custom Authentication Schema (Additive Only)
-- Target: Supabase PostgreSQL
--
-- Safety guarantees:
-- - Does NOT modify or drop existing tables, Supabase auth.* records, or RLS policies.
-- - Uses clearly prefixed tables (`pt_auth_*`) isolated from Lovable/Supabase tables.
-- - Enables Row Level Security (RLS) on all new auth tables so PostgREST
--   `anon` and `authenticated` roles have zero direct access to credential hashes.
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. Core Users Table (Custom Authentication Identity)
CREATE TABLE IF NOT EXISTS public.pt_auth_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(320) NOT NULL,
  email_normalized VARCHAR(320) NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  full_name VARCHAR(200) NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  nationality VARCHAR(120),
  gender VARCHAR(40),
  phone_number VARCHAR(40),
  country_code VARCHAR(12),
  travel_purpose VARCHAR(60),
  emergency_contact_name VARCHAR(200),
  emergency_contact_phone VARCHAR(40),
  emergency_contact_relation VARCHAR(100),
  email_verified BOOLEAN NOT NULL DEFAULT FALSE,
  email_verified_at TIMESTAMPTZ NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  legacy_supabase_user_id UUID NULL UNIQUE,
  last_login_at TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pt_auth_users_email_norm
  ON public.pt_auth_users (email_normalized);

CREATE INDEX IF NOT EXISTS idx_pt_auth_users_legacy_sub
  ON public.pt_auth_users (legacy_supabase_user_id)
  WHERE legacy_supabase_user_id IS NOT NULL;

-- 2. Roles Catalog
CREATE TABLE IF NOT EXISTS public.pt_auth_roles (
  id SMALLINT PRIMARY KEY,
  code VARCHAR(50) NOT NULL UNIQUE,
  label VARCHAR(100) NOT NULL,
  description TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO public.pt_auth_roles (id, code, label, description)
VALUES
  (1, 'traveller', 'Traveller', 'Registered cross-border passenger using pre-arrival guidance and readiness tools.'),
  (2, 'admin_staff', 'Administrator / Staff', 'Authorized Pearl Travel research and border content administrator.'),
  (3, 'border_officer', 'Border Officer', 'Malaba OSBP immigration/border verification officer.')
ON CONFLICT (code) DO NOTHING;

-- 3. User-to-Role Assignments
CREATE TABLE IF NOT EXISTS public.pt_auth_user_roles (
  user_id UUID NOT NULL REFERENCES public.pt_auth_users(id) ON DELETE CASCADE,
  role_id SMALLINT NOT NULL REFERENCES public.pt_auth_roles(id) ON DELETE RESTRICT,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  assigned_by UUID NULL REFERENCES public.pt_auth_users(id) ON DELETE SET NULL,
  PRIMARY KEY (user_id, role_id)
);

CREATE INDEX IF NOT EXISTS idx_pt_auth_user_roles_user_id
  ON public.pt_auth_user_roles (user_id);

-- 4. Refresh Tokens (SHA-256 hashed, family-tracked for rotation & reuse detection)
CREATE TABLE IF NOT EXISTS public.pt_auth_refresh_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.pt_auth_users(id) ON DELETE CASCADE,
  token_hash CHAR(64) NOT NULL UNIQUE,
  token_family_id UUID NOT NULL,
  replaced_by_token_id UUID NULL REFERENCES public.pt_auth_refresh_tokens(id) ON DELETE SET NULL,
  user_agent TEXT,
  ip_address VARCHAR(64),
  expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ NULL,
  revocation_reason VARCHAR(100) NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pt_auth_refresh_tokens_user
  ON public.pt_auth_refresh_tokens (user_id);

CREATE INDEX IF NOT EXISTS idx_pt_auth_refresh_tokens_family
  ON public.pt_auth_refresh_tokens (token_family_id);

CREATE INDEX IF NOT EXISTS idx_pt_auth_refresh_tokens_expires
  ON public.pt_auth_refresh_tokens (expires_at);

-- 5. Single-Use Email Verification Tokens (SHA-256 hashed)
CREATE TABLE IF NOT EXISTS public.pt_auth_email_verification_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.pt_auth_users(id) ON DELETE CASCADE,
  token_hash CHAR(64) NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pt_auth_email_verif_user
  ON public.pt_auth_email_verification_tokens (user_id);

-- 6. Single-Use Password Reset Tokens (SHA-256 hashed)
CREATE TABLE IF NOT EXISTS public.pt_auth_password_reset_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.pt_auth_users(id) ON DELETE CASCADE,
  token_hash CHAR(64) NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ NULL,
  requested_ip VARCHAR(64),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pt_auth_pw_reset_user
  ON public.pt_auth_password_reset_tokens (user_id);

-- 7. Authentication Security Audit Log
CREATE TABLE IF NOT EXISTS public.pt_auth_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NULL REFERENCES public.pt_auth_users(id) ON DELETE SET NULL,
  event_type VARCHAR(80) NOT NULL,
  ip_address VARCHAR(64),
  user_agent TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pt_auth_audit_logs_user_created
  ON public.pt_auth_audit_logs (user_id, created_at DESC);

-- Enable RLS on all custom auth tables so Supabase Data API (anon/authenticated)
-- cannot query password hashes or hashed tokens directly.
ALTER TABLE public.pt_auth_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pt_auth_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pt_auth_user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pt_auth_refresh_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pt_auth_email_verification_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pt_auth_password_reset_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pt_auth_audit_logs ENABLE ROW LEVEL SECURITY;
