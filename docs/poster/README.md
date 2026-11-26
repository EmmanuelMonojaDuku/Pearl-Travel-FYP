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
- 22/22 API tests: `cd api && npx vitest run`
- 39 browser checks and 0 contrast failures across 50 screen checks: scripted Playwright and axe runs against `npm run demo`
- 36 test profiles → 3 distinct rule sets: profile matrix over 6 nationalities × 6 purposes using `src/data/travelRequirementsEngine.ts`

Update the "Not yet available" box (Results panel) when survey, interview and SUS/TAM data exist.
The UCU logo in `assets/ucu-logo.png` is low resolution (copied from the proposal cover); replace it with the official high-resolution file before printing.
