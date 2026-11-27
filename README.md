# Pearl Travel

Pre-arrival guidance and readiness for travellers crossing into Uganda (final-year project, UCU BSIT).

| Part | Folder | Stack |
|---|---|---|
| Web app (PWA) | `/` | React 19, Vite, Tailwind v4, service worker, IndexedDB |
| API | `api/` | Node, Fastify, PostgreSQL, JWT + argon2, Ed25519 QR signing, RAG |
| Mobile app | `mobile/` | React Native (Expo), see [mobile/README.md](mobile/README.md) |
| Shared rules | `shared/` | Rules evaluator + default rules used by web, mobile and API |

What is real, and what needs your keys, is in **[docs/IMPLEMENTATION_STATUS.md](docs/IMPLEMENTATION_STATUS.md)**.

## Quick start (everything on one computer)

Prerequisites: Node 20+, PostgreSQL 14+.

```bash
# 1. Database
createdb pearl_travel
cp api/.env.example api/.env        # then edit: DATABASE_URL, JWT secrets, DB_SSL_MODE=disable for local
# 2. Install
npm install && (cd api && npm install)
# 3. Schema and demo accounts
(cd api && npm run migrate && npm run seed:demo)
# 4. Run the API (port 4000) and the web app (port 3000) together
npm run dev:full
```
Open http://localhost:3000 and use **Demo access** on the login screen. These are real server accounts (password `PearlDemo#2026`, change with `DEMO_PASSWORD`): `traveller.demo@`, `officer.demo@`, `admin.demo@` and `reviewer.demo@pearltravel.ug`. Two administrators exist because an author cannot approve their own content.

**Windows shortcut:** run `powershell -ExecutionPolicy Bypass -File .\setup.ps1` once. It creates the database, `api\.env`, tables and demo accounts, then use `npm run dev:full`.

**Windows PowerShell 5** does not accept `&&` or `(cd api && ...)`. Run each command on its own line: `cd api`, `npm install`, `npm run migrate`, `npm run seed:demo`, `cd ..`, `npm install`, `npm run dev:full`. Create `api\.env` with `copy api\.env.example api\.env` and create an empty `pearl_travel` database first.

### Configuration (api/.env, never in the web app)

| Variable | Purpose |
|---|---|
| `DATABASE_URL`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET` | Required. Secrets must be 32+ random characters. |
| `QR_SIGNING_PRIVATE_KEY` | Ed25519 key for QR passes. Create with `node api/scripts/generate-qr-key.mjs`. Required in production. |
| `LLM_API_KEY`, `LLM_BASE_URL`, `LLM_MODEL`, `EMBEDDING_MODEL` | Switch on the AI assistant (any OpenAI-compatible provider). After adding the key, sign in as admin and press **Content > AI suggestions > Re-index guidance**. |
| `ADMIN_EMAILS` | Bootstrap administrator addresses (verified by email). |

The web app only needs `VITE_API_BASE_URL` (optional) and `VITE_GOOGLE_CLIENT_ID` (optional, public). `VITE_DEMO_MODE=true` (set by `npm run demo` and `dev:full`) shows the Demo access panel.

## How it meets the proposal

- **Assistant (RAG):** approved guidance is chunked and embedded; a question retrieves the most similar passages (cosine similarity, threshold), the LLM answers only from those passages with `[S1]`-style citations, and anything ungrounded falls back to "I could not find this in approved guidance" with a pointer to the official authority. Only the nationality group and purpose are sent to the LLM, never names or documents. New or changed guidance is re-indexed when an administrator approves it.
- **QR pass:** server-signed (Ed25519) token holding a random reference, score, expiry and six document statuses. No name or passport data. Officers verify it on the server (signature, status, expiry, revocation); unsigned or edited codes are rejected. Passes expire, can be revoked, and every scan is recorded against the officer's border post.
- **Offline-first:** installable PWA (manifest + service worker). The app shell, published rules and guidance are cached; profile, checklist and the saved QR pass live in IndexedDB. Offline changes queue and sync idempotently when you reconnect. A banner shows what needs a connection.
- **Rules engine:** rules are rows in the database (nationality group, purpose, mode, border post conditions) managed by administrators, evaluated by `shared/rulesEvaluator.ts`. Missing, unsupported or ambiguous input produces warnings, not guesses. Changing nationality or purpose rebuilds the checklist.
- **Central data and access control:** roles, officer assignments, content, rules, scans, assessments and the audit log are in PostgreSQL. The server decides roles (`/auth/me`); the browser never grants itself a role. Content and rules go draft, review, approve, publish, and the approver must be a different administrator.
- **Mobile:** React Native app reusing the same API and evaluator, with offline cache and QR display, plus the officer scanner.

## Tests

```bash
# API: unit + real-PostgreSQL integration (65 tests)
createdb pearl_test && (cd api && DATABASE_URL=postgres://localhost/pearl_test MIGRATION_DATABASE_URL=postgres://localhost/pearl_test DB_SSL_MODE=disable JWT_ACCESS_SECRET=x...32chars JWT_REFRESH_SECRET=y...32chars npm run migrate)
(cd api && TEST_DATABASE_URL=postgres://localhost/pearl_test npm test)
# Web: types and build
npm run lint && npm run build
# End to end in a browser against the real API (15 checks): offline PWA, signed QR, officer verification, admin workflow, forged-role rejection
npm run build -- --mode demo && (npx vite preview --port 4173 &) && npm run test:e2e
# Mobile
(cd mobile && npm run typecheck && npm test)
```

## Presentation guide

- `npm run dev:full`, then open http://localhost:3000 and use the Demo access buttons.
- **Register** creates the account and returns to Sign in with the email filled (no verification email). Set `REQUIRE_EMAIL_VERIFICATION=true` to turn it back on. Administrator addresses in `ADMIN_EMAILS` still verify by email.
- **Continue with Google:** create an OAuth 2.0 Web client, add `http://localhost:3000` as an authorised JavaScript origin, and set `VITE_GOOGLE_CLIENT_ID` in `.env.local`. Google accounts are browser-local travellers (the API has no Google endpoint yet).
- Without the API, travellers can still register and use the app from browser storage; officer, admin, QR creation and the assistant need the server.
- Camera scanning works in browsers on `https://` or `http://localhost`, with image upload and pasted-code fallbacks.
- The A1 poster is in `docs/poster/`.

## Maintaining content

- **Footer and legal pages:** `src/config/site.ts` and `src/content/legal.ts`.
- **Guidance, rules, users:** the admin dashboard (Content, People). Nothing is edited in code.

## Design system (colours)

All colours live in `src/index.css` as `--pearl-*` variables and are used through Tailwind classes such as `bg-pearl-dark` (white card), `bg-pearl-slate` (page), `text-pearl-text`, `bg-pearl-gold` (primary yellow). Do not hard-code hex values in components.

| Token | Value | Use |
|---|---|---|
| `--pearl-navy` / `--pearl-navy-2` | #0F172A / #1E293B | Sidebar, headers, footer, important text |
| `--pearl-gold` / `--pearl-gold-light` | #FFC400 / #EAB308 | Primary buttons, active navigation, badges; golden accent for hover |
| `--pearl-slate` / `--pearl-surface` / `--pearl-dark` | #F5F7FB / #F1F5F9 / #FFFFFF | Page background / light grey / cards and modals |
| `--pearl-border` | #E2E8F0 | Borders |
| `--pearl-text` / `-secondary` / `--pearl-placeholder` | #0F172A / #334155 / #5B6B83 | Primary, secondary, muted text |
| `--pearl-success` / `--pearl-danger` | #16A34A / #DC2626 | Status |
| `--pearl-accent`, `--pearl-success-light`, `--pearl-danger-light`, `--pearl-info` | darker shades | Gold, green, red and blue **text** on light surfaces (WCAG AA) |

Any element with a navy background (`bg-pearl-navy`) automatically switches these tokens to white-on-navy values for itself and its children, so components placed in the sidebar, header or footer stay readable. Use `bg-pearl-scrim/60` (not `bg-pearl-navy/60`) for modal backdrops.
