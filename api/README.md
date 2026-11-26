# Pearl Travel — Independent Node.js Backend (`api/`)

**Research Project:** *Mobile Pre-Arrival Guidance and Passenger Readiness Application for Uganda Land Border Points — Case Study: Malaba One-Stop Border Post (OSBP)*  
**Phase:** Phase 1 — Backend Foundation, Supabase PostgreSQL Connectivity & Custom Authentication

---

## 1. Backend Architecture

The `api/` service is a standalone, modular REST API built independently of Lovable, TanStack Start, and the React/Vite root frontend. It handles its own authentication, password hashing, token lifecycle, authorization, and direct server-side PostgreSQL access.

```text
api/
├── src/
│   ├── config/           # Zod-validated environment configuration loader
│   ├── database/         # pg.Pool connection manager, transaction helper, health check, SQL migration runner
│   ├── middleware/       # JWT authentication (`authenticate`) and RBAC (`requireRoles`) Fastify hooks
│   ├── modules/
│   │   └── auth/         # Independent auth system (schemas, Argon2id password service, JWT/opaque tokens, Postgres repository, service, Fastify routes)
│   ├── shared/
│   │   ├── email/        # Transactional email interface (`disabled` honest stub + `resend` adapter)
│   │   ├── errors.ts     # Standardized HTTP error hierarchy
│   │   └── roles.ts      # Canonical RBAC roles (`traveller`, `admin_staff`, `border_officer`)
│   ├── app.ts            # Fastify application factory (Helmet, CORS, rate-limiting, error handler, health & auth routes)
│   └── server.ts         # HTTP listener and graceful shutdown entrypoint
├── migrations/           # Forward-only, additive SQL migrations (`pt_auth_*` tables) + restricted role guide
├── tests/                # Isolated Vitest suites (no production database mutations)
├── .env.example          # Safe environment variable template (no real credentials)
├── eslint.config.mjs     # Strict ESLint TypeScript rules
├── package.json          # Independent dependencies & scripts
├── tsconfig.json         # Strict NodeNext TypeScript configuration
└── README.md             # This documentation
```

---

## 2. Technology Stack

- **Runtime:** Node.js `>= 20` (tested on Node `22.x`)
- **Language:** TypeScript (`strict: true`, `NodeNext` ESM modules)
- **Web Framework:** Fastify v5 (`@fastify/helmet`, `@fastify/cors`, `@fastify/rate-limit`)
- **Database:** Supabase-managed PostgreSQL via `pg` connection pooling
- **Password Hashing:** Argon2id (`argon2` native binding)
- **Access Tokens:** Signed HS256 JWTs (`jose`)
- **Validation & Sanitization:** Zod v3
- **Testing & Quality:** Vitest, ESLint v9 (`typescript-eslint`), `tsc --noEmit`

---

## 3. Installation Instructions

All backend commands are executed from inside `api/` (independently of the root web application):

```bash
cd api
npm install
```

---

## 4. Environment Configuration

Copy `.env.example` to `.env` inside `api/` and populate server-side secrets:

```bash
cp .env.example .env
```

Key variables:

| Variable | Purpose | Notes |
| --- | --- | --- |
| `PORT` | API HTTP port | Defaults to `4000` (frontend runs on `3000`) |
| `CORS_ORIGINS` | Comma-separated allowed web origins | e.g. `http://localhost:3000` |
| `APP_BASE_URL` | Frontend base URL for email links | Used for verification & reset links |
| `DATABASE_URL` | Supabase PostgreSQL connection URI | Prefer restricted role `pearl_api_app` over `postgres` |
| `DB_SSL_MODE` | PostgreSQL SSL mode | `require` or `verify-full` for Supabase |
| `JWT_ACCESS_SECRET` | Secret signing key for access JWTs | Min 32 random characters; server-side only |
| `JWT_REFRESH_SECRET` | Dedicated secret placeholder/rotation config | Min 32 random characters; server-side only |
| `EMAIL_PROVIDER` | `disabled` or `resend` | Defaults to `disabled` until provider is tested |
| `RESEND_API_KEY` | API key when `EMAIL_PROVIDER=resend` | Leave empty when `disabled` |

Generate cryptographically strong secrets with:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
```

**Never expose `.env`, `DATABASE_URL`, `JWT_*_SECRET`, or service-role keys to Vite (`VITE_*`) or Expo (`EXPO_PUBLIC_*`) clients.**

---

## 5. Database Setup & Supabase Pooling

1. In Supabase Dashboard -> **Project Settings -> Database**, copy the **Session Pooler** (`port 5432`) or **Transaction Pooler** (`port 6543`) PostgreSQL URI.
2. This backend does **not** use prepared-statement names, making it compatible with both Supabase Session Pooler and Transaction Pooler (PgBouncer).
3. **Restricted Role (Recommended):** Follow `migrations/README_RESTRICTED_ROLE.md` to create the least-privilege `pearl_api_app` PostgreSQL login role granted access solely to `public.pt_auth_*` tables, rather than connecting with unrestricted `postgres` credentials.
4. **Coexistence with Existing Supabase Auth / Lovable Tables:**
   - Migrations are strictly **additive** and use the `pt_auth_*` prefix.
   - Existing `auth.users`, `public.*` traveller tables, and RLS policies remain untouched.
   - All `pt_auth_*` tables enable Row Level Security (`ENABLE ROW LEVEL SECURITY`) and revoke privileges from `anon` and `authenticated` so Supabase PostgREST cannot expose credential or token hashes to browsers.
   - `pt_auth_users.legacy_supabase_user_id` and `pt_auth_legacy_user_mappings` provide a clean 1:1 mapping bridge for future Phase 2 migration.

---

## 6. Migration Commands

Validate migrations safely (verifies naming, non-empty SQL, and blocks destructive keywords such as `DROP TABLE`, `TRUNCATE`, `DROP POLICY`, or `DELETE FROM auth.`):

```bash
npm run migrate:validate
```

Apply pending additive migrations to the configured PostgreSQL database (requires `MIGRATION_DATABASE_URL` or `DATABASE_URL` with DDL privileges on `public`):

```bash
npm run migrate
```

Applied migrations are recorded with SHA-256 checksums in `public.pt_api_schema_migrations`.

---

## 7. Development, Build & Testing Commands

```bash
# Start development server with watch reload
npm run dev

# TypeScript typecheck
npm run typecheck

# Compile TypeScript to dist/
npm run build

# Run compiled production server
npm start

# Run ESLint
npm run lint

# Run automated Vitest test suite (isolated in-memory/mocked fixtures; zero prod DB writes)
npm test
```

---

## 8. API Endpoint Documentation

### System & Database Health

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| `GET` | `/health` | Public | Returns service liveness, environment, uptime, and version (`200 OK`). |
| `GET` | `/health/database` | Public | Runs `SELECT 1` via the `pg` pool. Returns `200 OK` when connected, or `503 Service Unavailable` when unconfigured/unreachable (sanitized error output, no credentials). |

### Authentication (`/api/v1/auth`)

All auth mutation routes enforce strict per-IP rate limiting (`AUTH_RATE_LIMIT_MAX` per `AUTH_RATE_LIMIT_WINDOW_MS`).

| Method | Path | Auth | Success Status | Description |
| --- | --- | --- | --- | --- |
| `POST` | `/api/v1/auth/register` | Public | `201 Created` | Registers a new Traveller (`traveller` role), hashes password with Argon2id, stores single-use hashed email verification token, triggers email interface. Rejects duplicates with `409`. |
| `POST` | `/api/v1/auth/login` | Public | `200 OK` | Verifies email & Argon2id password, issues short-lived Bearer JWT access token + opaque refresh token (stored SHA-256 hashed). Returns `401` on bad credentials, `403` if inactive. |
| `POST` | `/api/v1/auth/verify-email` | Public | `200 OK` | Consumes single-use verification token (`{ token }`), marks user `emailVerified: true`. |
| `POST` | `/api/v1/auth/resend-verification` | Public | `200 OK` | Issues a fresh single-use verification token if an unverified active account exists, invalidating prior unused tokens. Constant non-enumerable response. |
| `POST` | `/api/v1/auth/refresh` | Public | `200 OK` | Rotates `{ refreshToken }` atomically: revokes presented token, issues new access + refresh token pair. Reusing an already-rotated token revokes the entire token family (`401`). |
| `POST` | `/api/v1/auth/logout` | Optional Bearer | `200 OK` | Revokes the provided `{ refreshToken }` (or all user refresh tokens if `allSessions: true` with valid Bearer access token). |
| `POST` | `/api/v1/auth/forgot-password` | Public | `200 OK` | Creates single-use hashed reset token if active user exists and dispatches via EmailService. **Always returns identical `200` message** regardless of whether email exists. |
| `POST` | `/api/v1/auth/reset-password` | Public | `200 OK` | Validates `{ token, newPassword }`, updates Argon2id hash, marks reset token used, and revokes all active refresh tokens for the account. |
| `GET` | `/api/v1/auth/me` | Bearer JWT | `200 OK` | Validates `Authorization: Bearer <accessToken>` via `authenticate` middleware and returns the sanitized user profile and assigned roles. |

### Administrator Dashboard (`/api/v1/admin`)

| Method | Path | Auth | Success Status | Description |
| --- | --- | --- | --- | --- |
| `GET` | `/api/v1/admin/overview` | Bearer JWT + `admin_staff` role | `200 OK` | Returns live traveller, journey, assessment, content-review, QR, and database-health metrics. |

Set `ADMIN_EMAILS` in the API environment to a comma-separated list of bootstrap administrator emails. A configured account receives the `admin_staff` role only after the account verifies its email and successfully authenticates; the assignment is persisted in `pt_auth_user_roles` and included in the signed access token. Configure a real email provider so the verification link can be delivered. Do not use a client-side email check to authorize admin access.

The frontend uses `VITE_API_BASE_URL` (defaults to `http://localhost:4000/api/v1`) and `VITE_ADMIN_EMAILS` (defaults to the configured Pearl Travel bootstrap account) for API connection and to prevent offline/local-only sign-in for bootstrap admin addresses. The frontend email list is not an authorization control; the API role check is authoritative.

---

## 9. Authentication Flow

1. **Registration:** Client posts email, password (min 8 chars, mixed case + digit), and traveller details to `POST /api/v1/auth/register`. Server normalizes email, hashes password with Argon2id, creates `pt_auth_users` row + `traveller` role, hashes a 256-bit verification token with SHA-256, and calls `EmailService`.
2. **Login:** Client posts credentials to `POST /api/v1/auth/login`. Server verifies Argon2id hash, mints a 15-minute JWT access token (`sub`, `email`, `roles`, `jti`, `iss`, `aud`), and stores a SHA-256 digest of a new 256-bit refresh token under a fresh `token_family_id`.
3. **Authenticated Requests & RBAC:** Clients send `Authorization: Bearer <accessToken>`. Fastify middleware `authenticate` validates signature & expiry; `requireRoles('border_officer')` / `requireRoles('admin_staff')` enforces role permissions.
4. **Refresh Rotation & Theft Mitigation:** `POST /api/v1/auth/refresh` marks the current refresh token `revoked_at = NOW()` (`replaced_by_token_id` linked) and returns a fresh token pair. Any replay of an already-rotated token invalidates the entire `token_family_id`.
5. **Password Recovery:** `POST /api/v1/auth/forgot-password` produces a single-use SHA-256-hashed reset token without revealing account existence; `POST /api/v1/auth/reset-password` updates the Argon2id hash and revokes all existing sessions.

---

## 10. Security Considerations

- Passwords are hashed exclusively with **Argon2id** (`memoryCost: 64 MiB`, `timeCost: 3`, `parallelism: 1` in runtime; never stored or returned in plaintext or hash form).
- Refresh, verification, and password reset tokens are generated with `crypto.randomBytes(32)` and stored only as **SHA-256** digests.
- Request validation via Zod trims and normalizes inputs and returns `400` with field-level details.
- `@fastify/helmet`, strict origin-checked `@fastify/cors`, and global + per-route `@fastify/rate-limit` protect endpoints.
- Email delivery uses an explicit `EmailService` interface defaulting to `EMAIL_PROVIDER=disabled` so email sending is never faked before real credentials are configured and tested.
