-- =============================================================================
-- Migration 002: Legacy Supabase User Mapping & Updated Timestamp Trigger (Additive Only)
-- Target: Supabase PostgreSQL
--
-- Purpose:
-- - Provides an additive mapping table linking custom Node.js auth users (`pt_auth_users.id`)
--   to existing Lovable/Supabase Auth records (`legacy_supabase_user_id`) without touching `auth.users`.
-- - Adds automatic `updated_at` trigger on `pt_auth_users`.
-- - Explicitly revokes `anon` and `authenticated` privileges from custom auth tables.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.pt_set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_pt_auth_users_updated_at ON public.pt_auth_users;
CREATE TRIGGER trg_pt_auth_users_updated_at
  BEFORE UPDATE ON public.pt_auth_users
  FOR EACH ROW
  EXECUTE FUNCTION public.pt_set_updated_at();

-- Bridge table for future Phase 2 migration of existing Supabase Auth traveller records
-- without altering Supabase's `auth.users` or breaking existing `auth.uid()` RLS policies.
CREATE TABLE IF NOT EXISTS public.pt_auth_legacy_user_mappings (
  custom_user_id UUID PRIMARY KEY REFERENCES public.pt_auth_users(id) ON DELETE CASCADE,
  legacy_supabase_user_id UUID NOT NULL UNIQUE,
  legacy_email_normalized VARCHAR(320) NOT NULL,
  migration_status VARCHAR(40) NOT NULL DEFAULT 'linked',
  linked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  notes TEXT
);

ALTER TABLE public.pt_auth_legacy_user_mappings ENABLE ROW LEVEL SECURITY;

-- Ensure Supabase browser roles (anon, authenticated) cannot read/write custom auth tables
-- even if default schema privileges exist. Safe no-op if roles do not exist in non-Supabase DBs.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    REVOKE ALL ON TABLE
      public.pt_auth_users,
      public.pt_auth_roles,
      public.pt_auth_user_roles,
      public.pt_auth_refresh_tokens,
      public.pt_auth_email_verification_tokens,
      public.pt_auth_password_reset_tokens,
      public.pt_auth_audit_logs,
      public.pt_auth_legacy_user_mappings
    FROM anon;
  END IF;

  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    REVOKE ALL ON TABLE
      public.pt_auth_users,
      public.pt_auth_roles,
      public.pt_auth_user_roles,
      public.pt_auth_refresh_tokens,
      public.pt_auth_email_verification_tokens,
      public.pt_auth_password_reset_tokens,
      public.pt_auth_audit_logs,
      public.pt_auth_legacy_user_mappings
    FROM authenticated;
  END IF;
END
$$;
