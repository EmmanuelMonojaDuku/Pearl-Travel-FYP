# Restricted PostgreSQL Role Setup (Supabase SQL Editor)

In production and staging, the Node.js backend (`api/`) should connect to Supabase PostgreSQL using a **restricted application role** (`pearl_api_app`) rather than the unrestricted `postgres` administrative role.

Execute the following once in the **Supabase Dashboard -> SQL Editor** (as `postgres`) after running migrations `001` and `002`:

```sql
-- 1. Create dedicated login role for Pearl Travel Node.js backend
CREATE ROLE pearl_api_app
  WITH LOGIN
  PASSWORD 'REPLACE_WITH_STRONG_RANDOM_PASSWORD'
  NOSUPERUSER
  NOCREATEDB
  NOCREATEROLE
  NOREPLICATION;

-- 2. Allow connection & schema usage
GRANT CONNECT ON DATABASE postgres TO pearl_api_app;
GRANT USAGE ON SCHEMA public TO pearl_api_app;

-- 3. Grant least-privilege table access ONLY to custom auth tables
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE
  public.pt_auth_users,
  public.pt_auth_roles,
  public.pt_auth_user_roles,
  public.pt_auth_refresh_tokens,
  public.pt_auth_email_verification_tokens,
  public.pt_auth_password_reset_tokens,
  public.pt_auth_audit_logs,
  public.pt_auth_legacy_user_mappings
TO pearl_api_app;

-- 4. Explicit RLS policies allowing ONLY `pearl_api_app` (never `anon` or `authenticated`)
CREATE POLICY pt_api_app_all_users ON public.pt_auth_users
  FOR ALL TO pearl_api_app USING (true) WITH CHECK (true);

CREATE POLICY pt_api_app_all_roles ON public.pt_auth_roles
  FOR ALL TO pearl_api_app USING (true) WITH CHECK (true);

CREATE POLICY pt_api_app_all_user_roles ON public.pt_auth_user_roles
  FOR ALL TO pearl_api_app USING (true) WITH CHECK (true);

CREATE POLICY pt_api_app_all_refresh_tokens ON public.pt_auth_refresh_tokens
  FOR ALL TO pearl_api_app USING (true) WITH CHECK (true);

CREATE POLICY pt_api_app_all_email_verif ON public.pt_auth_email_verification_tokens
  FOR ALL TO pearl_api_app USING (true) WITH CHECK (true);

CREATE POLICY pt_api_app_all_pw_reset ON public.pt_auth_password_reset_tokens
  FOR ALL TO pearl_api_app USING (true) WITH CHECK (true);

CREATE POLICY pt_api_app_all_audit ON public.pt_auth_audit_logs
  FOR ALL TO pearl_api_app USING (true) WITH CHECK (true);

CREATE POLICY pt_api_app_all_legacy_map ON public.pt_auth_legacy_user_mappings
  FOR ALL TO pearl_api_app USING (true) WITH CHECK (true);
```

## How Custom-Authenticated Users Map to Existing Records

1. Existing Supabase Auth users (`auth.users.id`) and Lovable traveller tables remain untouched.
2. `pt_auth_users.legacy_supabase_user_id` and `pt_auth_legacy_user_mappings` store the 1:1 link between our new `pt_auth_users.id` (UUID) and `auth.users.id`.
3. In Phase 2 (traveller services & checklists), backend endpoints will authenticate requests via Node.js JWT (`request.authUser.userId`), look up any linked `legacy_supabase_user_id` if migrating historic traveller data, and enforce authorization exclusively in Fastify middleware and parameterized SQL queries rather than relying on Supabase `auth.uid()`.
