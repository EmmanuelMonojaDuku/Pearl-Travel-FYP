#!/usr/bin/env python3
"""Draws a PRISMA 2020 flow diagram from counts in prisma_counts.json.

Usage:  python3 prisma_flow.py prisma_counts.json  [output.svg]

The script checks the arithmetic first and stops with a clear message if any number does not add up,
so the figure and the text of the manuscript cannot disagree. It never guesses or fills gaps.
"""
import json
import sys
from html import escape

c = json.load(open(sys.argv[1] if len(sys.argv) > 1 else 'prisma_counts.json'))
out = sys.argv[2] if len(sys.argv) > 2 else 'prisma_flow.svg'

dbs = c['databases']                      # [{"name": "Scopus", "n": 120}, ...]
reg = c.get('registers', [])              # usually empty for this review
other = c['other_methods']                # {"websites": 2, "citation_searching": 5, "other": 0}
dup = c['duplicates_removed']
auto = c.get('removed_by_automation_or_other', 0)
screened = c['screened']
ta_excl = c['excluded_at_title_abstract']
sought = c['reports_sought']
not_ret = c['reports_not_retrieved']
assessed = c['reports_assessed']
ft_excl = c['excluded_at_full_text']      # {"E1": 3, "E2": 5, ...}
included = c['studies_included']
other_sought = c.get('other_reports_sought', 0)
other_not_ret = c.get('other_reports_not_retrieved', 0)
other_assessed = c.get('other_reports_assessed', 0)
other_ft_excl = c.get('other_excluded_at_full_text', {})

errors = []
identified_db = sum(d['n'] for d in dbs) + sum(d['n'] for d in reg)
if identified_db - dup - auto != screened:
    errors.append(f"Identified {identified_db} - duplicates {dup} - other removals {auto} = {identified_db - dup - auto}, but 'screened' is {screened}.")
if screened - ta_excl != sought:
    errors.append(f"Screened {screened} - excluded {ta_excl} = {screened - ta_excl}, but 'reports_sought' is {sought}.")
if sought - not_ret != assessed:
    errors.append(f"Sought {sought} - not retrieved {not_ret} = {sought - not_ret}, but 'reports_assessed' is {assessed}.")
db_ft = sum(ft_excl.values())
oth_ft = sum(other_ft_excl.values())
if other_sought - other_not_ret != other_assessed:
    errors.append(f"Other methods: sought {other_sought} - not retrieved {other_not_ret} != assessed {other_assessed}.")
if (assessed - db_ft) + (other_assessed - oth_ft) != included:
    errors.append(f"Assessed (databases {assessed}, other {other_assessed}) minus exclusions ({db_ft} + {oth_ft}) = {(assessed - db_ft) + (other_assessed - oth_ft)}, but 'studies_included' is {included}.")
if auto and not c.get('removed_by_automation_or_other_reason'):
    errors.append("You removed records for 'other reasons' but did not say why: fill 'removed_by_automation_or_other_reason'.")
if errors:
    print('The numbers do not reconcile. Fix the log, then run again:\n')
    for e in errors:
        print(' -', e)
    sys.exit(1)

W, H = 1100, 920
parts = [f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}" font-family="Arial, Helvetica, sans-serif">',
         '<rect width="100%" height="100%" fill="#fff"/>',
         '<defs><marker id="a" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0L10 5L0 10z" fill="#222"/></marker></defs>']


def box(x, y, w, h, lines, fill='#fff', bold_first=False):
    parts.append(f'<rect x="{x}" y="{y}" width="{w}" height="{h}" fill="{fill}" stroke="#222" stroke-width="1.4"/>')
    ty = y + 20
    for i, ln in enumerate(lines):
        wt = 'bold' if (bold_first and i == 0) else 'normal'
        parts.append(f'<text x="{x + 10}" y="{ty}" font-size="13" font-weight="{wt}">{escape(ln)}</text>')
        ty += 18


def arrow(x1, y1, x2, y2):
    parts.append(f'<line x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}" stroke="#222" stroke-width="1.4" marker-end="url(#a)"/>')


def label(x, y, t):
    parts.append(f'<text x="{x}" y="{y}" font-size="15" font-weight="bold" fill="#1D4ED8">{escape(t)}</text>')


label(20, 30, 'Identification')
db_lines = ['Records identified from databases (n = %d)' % identified_db] + [f'  {d["name"]} (n = {d["n"]})' for d in dbs]
box(20, 45, 480, 24 + 18 * len(db_lines), db_lines, bold_first=True)
oth_total = sum(other.values())
oth_lines = [f'Records identified from other methods (n = {oth_total})'] + [f'  {k.replace("_", " ").capitalize()} (n = {v})' for k, v in other.items()]
box(580, 45, 500, 24 + 18 * len(oth_lines), oth_lines, bold_first=True)

y1 = 45 + 24 + 18 * max(len(db_lines), len(oth_lines)) + 30
box(20, y1, 480, 60, [f'Records after duplicates removed (n = {screened + auto})', f'Duplicates removed (n = {dup})'], bold_first=True)
if auto:
    box(520, y1 - 4, 560, 70, [f'Records removed before screening (n = {auto})', f'  Reason: {c["removed_by_automation_or_other_reason"]}'])
arrow(260, y1 - 24, 260, y1)

label(20, y1 + 95, 'Screening')
y2 = y1 + 110
arrow(260, y1 + 60, 260, y2)
box(20, y2, 480, 40, [f'Records screened (n = {screened})'], bold_first=True)
box(520, y2, 560, 40, [f'Records excluded at title and abstract (n = {ta_excl})'])
arrow(500, y2 + 20, 520, y2 + 20)
y3 = y2 + 75
arrow(260, y2 + 40, 260, y3)
box(20, y3, 480, 40, [f'Reports sought for retrieval (n = {sought})'], bold_first=True)
box(520, y3, 560, 40, [f'Reports not retrieved (n = {not_ret})'])
arrow(500, y3 + 20, 520, y3 + 20)
y4 = y3 + 75
arrow(260, y3 + 40, 260, y4)
box(20, y4, 480, 40, [f'Reports assessed for eligibility (n = {assessed})'], bold_first=True)
ex_lines = [f'Reports excluded (n = {db_ft})'] + [f'  {k}: n = {v}' for k, v in sorted(ft_excl.items())]
box(520, y4, 560, 24 + 18 * len(ex_lines), ex_lines, bold_first=True)
arrow(500, y4 + 20, 520, y4 + 20)
y5 = y4 + 24 + 18 * max(len(ex_lines), 2) + 50
arrow(260, y4 + 40, 260, y5)
label(20, y5 - 12, 'Included')
box(20, y5, 480, 40, [f'Studies included in the review (n = {included})'], fill='#FFF8DB', bold_first=True)
if other_sought or oth_total:
    ol = [f'Other methods: reports sought (n = {other_sought})', f'  Not retrieved (n = {other_not_ret})', f'  Assessed for eligibility (n = {other_assessed})', f'  Excluded (n = {oth_ft})'] + [f'    {k}: n = {v}' for k, v in sorted(other_ft_excl.items())]
    box(520, y5 - 10, 560, 24 + 18 * len(ol), ol, bold_first=True)
parts.append(f'<text x="20" y="{H - 14}" font-size="11" fill="#555">Adapted from Page et al. (2021), PRISMA 2020. Generated from prisma_counts.json; the script checks that all numbers reconcile.</text>')
parts.append('</svg>')
open(out, 'w').write('\n'.join(parts))
print(f'OK: numbers reconcile ({identified_db} identified from databases, {included} included). Wrote {out}')
