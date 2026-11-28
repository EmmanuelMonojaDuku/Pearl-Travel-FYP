# Six-day plan (adjust if you have fewer days)

| Day | Work | You finish the day with |
|---|---|---|
| 1 | Fix the protocol (questions, criteria, dates). Run searches in 3 to 4 UCU databases plus Google Scholar (Publish or Perish) and AJOL. Export everything. | A search log (database, date, string, count) and export files |
| 2 | Import all exports into **Zotero** or **Rayyan** (both free). Remove duplicates. Screen titles and abstracts using `screening_template.csv`. Upload the CSV to me and I act as **second screener**, then you compare and settle disagreements. | Counts: identified, duplicates, screened, excluded |
| 3 | Get full texts (UCU access, Google Scholar PDF, author repositories, interlibrary request). Screen full texts. Record **one exclusion reason code** for every exclusion. | Counts: sought, not retrieved, assessed, excluded by reason, included |
| 4 | Extract data with `extraction_template.csv`. Appraise quality with MMAT using `mmat_template.csv`. Verify every number against the original paper. | Extraction table and quality ratings |
| 5 | Run `prisma_flow.py` (it refuses to draw if the numbers do not add up). Write Results and Discussion from the extraction table. | Final figure and tables, full draft |
| 6 | APA 7 references, check every citation both ways, shorten the abstract to about 250 words, similarity check, format, submit. | Submission |

## Rules that keep it honest
- Never edit a count by hand. Change the data, rerun the script.
- Papers you could not get in full text are reported as "not retrieved", not guessed from the abstract.
- Say plainly who screened what, and report AI assistance exactly as it happened.
- If a database is not available at UCU, say so in Methods. That is a limitation, not a flaw.
