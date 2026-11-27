# Implementation status: proposal vs final

Verified by running the code on the dates and in the environment noted under "Tests". Anything marked **not verified** was built but could not be exercised here.

| # | Proposal requirement | Before | Now | Verified by |
|---|---|---|---|---|
| 1 | RAG assistant: semantic retrieval from approved KB, LLM answers, citations, fallback, admin review | Keyword matching, no LLM | Chunk + embed approved guidance (pgvector-free, `double precision[]`), cosine retrieval above a threshold, grounded prompt, `[S#]` citations validated, fallbacks (no sources, not found, out of scope, ungrounded, provider down). Only nationality group and purpose are sent to the LLM. Admin approval re-indexes. 503 "not configured" without a key. The old keyword engine remains only as a labelled offline fallback. | 65 API tests with stand-in providers. **Live LLM/embeddings: not verified** (no API key, network blocked). |
| 2 | Secure QR | Unsigned, showed name | Ed25519-signed token (random reference, score, expiry, six statuses, no PII). Server verifies signature, status, expiry, revocation; score recomputed on the server; one valid pass per user; revoke; officer needs an active border-post assignment; each scan recorded. Unsigned or edited codes show "Not a valid pass". | API tests (tamper, wrong key, expiry, revoke, post scoping) + browser e2e. |
| 3 | Offline-first | Data in browser only, fake "Sync now" | Manifest, service worker (shell, assets, public guidance cached; private API never cached), IndexedDB for profile/checklist/saved pass/outbox, online banner, idempotent sync (assessment `clientKey`, journey last-write-wins), clear messages for online-only actions. | e2e: reload offline opens the app, shows banner, saved pass visible, create disabled. |
| 4 | Rules by nationality and purpose, admin-configurable | Nationality only, hard-coded | Rules are database rows (`rule_metadata`: nationality groups, purposes, mode, border post, destination) edited via the admin workflow; shared evaluator; warnings for missing/unsupported/ambiguous input; checklist rebuilds on change; unverified rules are labelled. | Evaluator unit tests, rules integration tests, mobile tests, profile matrix (36 profiles, 7 checklists). |
| 5 | React Native app | Web only | `mobile/` Expo app: server login (secure store), journey, checklist, readiness, assistant, signed QR, offline cache + outbox, officer scanner; reuses `shared/` evaluator and the same API. Admin stays on web. | `tsc`, 4 logic tests, `expo export` bundles. **Not verified on a device or emulator.** |
| 6 | Central officer/admin data, server RBAC, scoping, audit | Local `opsStore`, client-fabricated demo roles | Content, rules, AI suggestions, users, roles, assignments, scans, assessments and audit log in PostgreSQL. Roles from `/auth/me`; app re-checks roles on start; forged local roles ignored; demo access signs in to seeded server accounts. Author cannot approve own item (DB constraint). | Admin integration tests + e2e (forged-role test, two-admin approval). |

## Known gaps and blockers
- **LLM / embedding key:** set `LLM_API_KEY` (+ base URL/model) in `api/.env`, then re-index from the admin dashboard. Until then the assistant reports it is not configured. Retrieval quality and answer grounding with a real model are untested.
- **Rules verification:** every seeded rule is `pending` (not verified against official sources). The app shows this; an administrator marks a rule verified by approving it.
- **Mobile:** needs a device check (camera scanning, NetInfo sync). Profile edits are kept on the phone; only journey and assessments sync (the API has no profile-update endpoint).
- **Google sign-in** still creates browser-local travellers (no API endpoint).
- **QR signing key:** without `QR_SIGNING_PRIVATE_KEY` an ephemeral key is used in development; production refuses to start without it.
- **Not built:** push notifications, background sync API in the service worker (sync runs when the app is open), user evaluation (survey/SUS/TAM).

## Tests (run 27 Nov 2026, PostgreSQL 16, Linux)
| Suite | Result |
|---|---|
| API unit + integration (`api`, real PostgreSQL, migrations 001-004) | 65 passed, 0 failed |
| API typecheck / web typecheck / web production build | pass |
| Browser end-to-end (`npm run test:e2e`, Chromium, real API) | 15 passed, 0 failed |
| Mobile logic tests / typecheck / `expo export` | 4 passed / pass / bundles |
| Mobile on device, live LLM | not run |

One API test was flaky during development (it altered only unused bits of a base64 signature); fixed to alter a middle character.

## Files
New: `api/migrations/004_proposal_alignment.sql`, `api/src/modules/{qr,rules,content,assistant,me}/*`, `api/src/modules/admin/management.ts`, `api/src/shared/audit.ts`, `api/scripts/{generate-qr-key.mjs,seed-demo.ts}`, `api/tests/**` (new), `shared/{rulesEvaluator.ts,defaultRules.json}`, `src/utils/api.ts`, `src/offline/*`, `src/data/{ruleStore,knowledgeStore}.ts`, `src/components/ConnectionBanner.tsx`, `public/{sw.js,manifest.webmanifest,icon-*.png}`, `scripts/{dev-full.mjs,e2e.mjs}`, `mobile/**`, `docs/poster/evidence/profile-matrix.mts`.
Modified: `api/src/{app.ts,config/env.ts,shared/errors.ts}`, `api/package.json`, `src/App.tsx`, `src/main.tsx`, `src/types.ts`, `src/components/{AdminDashboard,LoginPage,QRSummaryCard,AIGuidanceCard,RequirementGuidanceCard,TravelerReadinessPortal}.tsx`, `src/components/officer/OfficerPortal.tsx`, `src/data/{assistantEngine,travelRequirementsEngine}.ts`, `src/utils/{apiClient,authStorage,alerts}.ts`, `index.html`, `vite.config.ts`, `package.json`, `README.md`, `docs/poster/*`.
Removed: `src/utils/opsStore.ts`.
