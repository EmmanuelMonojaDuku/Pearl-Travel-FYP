# Research poster (DSC3114, Milestone One)

- `Pearl-Travel-Poster-A1.pdf` – print file, A1 landscape (841 × 594 mm), vector text. Same ratio as A0, so it can be enlarged without changes.
- `poster-preview.png` – screen preview.
- `poster.html` – editable source (open in Chrome). `assets/` holds the screenshots and logo.
- `render.cjs` – re-creates the PDF and PNG after editing: `node render.cjs` (needs Playwright).
- `evidence/` – the scripts behind the Results panel, so every number can be reproduced:
  - `assistant-benchmark-dev-set.mts` (39 questions; first run 34/39, five defects found and fixed)
  - `assistant-benchmark-heldout.mts` (27 unseen questions, run once, 21/27, not tuned afterwards)
  - run from the project root: `npx tsx docs/poster/evidence/assistant-benchmark-heldout.mts`

Numbers on the poster and where they come from
- 65/65 API tests: `cd api && TEST_DATABASE_URL=... npx vitest run` (real PostgreSQL, see root README)
- 15/15 end-to-end checks: `npm run test:e2e` (real API + built web app)
- 4/4 mobile tests: `cd mobile && npm test`
- 36 profiles -> 7 distinct checklists: `npx tsx docs/poster/evidence/profile-matrix.mts`
- Assistant benchmark (21/27) measures the on-device keyword fallback only. The live RAG assistant has not been benchmarked (no API key in the build environment).

Update the "Not yet available" box (Results panel) when survey, interview and SUS/TAM data exist.
The UCU logo in `assets/ucu-logo.png` is low resolution (copied from the proposal cover); replace it with the official high-resolution file before printing.
