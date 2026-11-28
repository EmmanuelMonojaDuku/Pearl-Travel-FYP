#!/usr/bin/env python3
"""Aligns the Pearl Travel draw.io set with the system that was actually built.

Input : Pearl_Travel_Diagrams_Original.drawio   (the diagrams as drawn from the proposal)
Output: Pearl_Travel_Diagrams_Corrected.drawio
The as-built ERD page is generated from the real database (columns and foreign keys exported from PostgreSQL).
"""
import copy
import html
import re
import sys
import xml.etree.ElementTree as ET

SRC, DST = 'Pearl_Travel_Diagrams_Original.drawio', 'Pearl_Travel_Diagrams_Corrected.drawio'
COLS, FKS = '/tmp/cols.txt', '/tmp/fks.txt'

tree = ET.parse(SRC)
root = tree.getroot()
pages = {d.get('name').strip(): d for d in root.iter('diagram')}
log = []


def cells(page):
    return {c.get('id'): c for c in pages[page].iter('mxCell')}


def get(page, suffix):
    found = [c for i, c in cells(page).items() if i == suffix or i.endswith('-' + suffix)]
    if len(found) != 1:
        sys.exit(f'{page}: expected one cell for {suffix}, found {len(found)}')
    return found[0]


def setv(page, suffix, value, why=None):
    c = get(page, suffix)
    old = re.sub(r'<[^>]+>', ' ', html.unescape(c.get('value') or '')).strip()
    c.set('value', value)
    log.append((page, old[:60], re.sub(r'<[^>]+>', ' ', value).strip()[:80], why or ''))


def add_style(page, suffix, extra):
    c = get(page, suffix)
    st = c.get('style') or ''
    if extra not in st:
        c.set('style', st + ('' if st.endswith(';') else ';') + extra)


def new_cell(page, like_suffix, new_id, value, x, y, w, h, style=None):
    like = get(page, like_suffix)
    c = copy.deepcopy(like)
    c.set('id', new_id)
    c.set('value', value)
    if style:
        c.set('style', style)
    g = c.find('mxGeometry')
    for k, v in (('x', x), ('y', y), ('width', w), ('height', h)):
        g.set(k, str(v))
    like_parent = like.getparent() if hasattr(like, 'getparent') else None
    parent_map = {ch: p for p in pages[page].iter() for ch in p}
    parent_map[like].append(c)
    return c


def new_edge(page, like_edge_id, new_id, src, tgt, label=''):
    like = cells(page)[like_edge_id]
    e = copy.deepcopy(like)
    e.set('id', new_id)
    e.set('source', src)
    e.set('target', tgt)
    e.set('value', label)
    g = e.find('mxGeometry')
    for p in list(g):
        g.remove(p)  # let draw.io route it
    parent_map = {ch: p for p in pages[page].iter() for ch in p}
    parent_map[like].append(e)
    return e


def edge_by_label(page, text):
    return [c for c in cells(page).values() if c.get('edge') == '1' and text in (c.get('value') or '')]


# ───────────────────────── 1. Flowchart ─────────────────────────
F = 'NewFlowchart'
P = '612NuZ4ZnuxN1leIFbOU-'
setv(F, P + '7', 'Traveller declares each item<br>(Have / Missing / Expired / N/A)', 'App has an Expired status')
setv(F, P + '10', 'Traveller creates<br>a QR pass?', 'QR pass is not gated on a perfect score in the built system')
setv(F, P + '11', 'Server signs QR pass<br>(random reference, score, expiry)', 'Signing happens on the server')
setv(F, P + '12', 'Display QR pass to traveller')
setv(F, P + '14', 'Officer scans or pastes QR pass', 'Pasting replaces name search (privacy)')
setv(F, P + '15', 'Server checks signature,<br>status and expiry?', 'Verification is server-side')
setv(F, P + '16', 'Show minimal summary<br>(reference, score, 6 statuses)')
setv(F, P + '17', 'Officer approves or<br>flags the pass', 'Matches Approve / Flag in the app')
setv(F, P + '18', 'Log scan event<br>(officer, border post, time, result)')
for e in edge_by_label(F, 'Redeclare'):
    e.set('value', 'Not yet: update items')
for e in edge_by_label(F, 'Back to QR generate'):
    e.set('value', 'No: "Not a valid pass"; traveller creates a new one')
setv(F, P + '41', '<b>Design rules</b><br>The score is recalculated on the server each time a pass is created. A QR pass can be created at any score: it shows the score and six document statuses, never a name or passport number. Passes expire, can be revoked, and are verified on the server.', 'Removed the "only when all Have" rule')
setv(F, P + '42', '<b>Note</b><br>The officer reviews the summary; the final immigration decision always stays with the officer. Officers can only verify at their assigned border post.')

# ───────────────────────── 2. System architecture ─────────────────────────
A = 'System Architecture'
setv(A, 'band0', 'PRESENTATION LAYER - Web app (installable PWA) and React Native / Expo mobile app', 'Web app was missing')
setv(A, 'pt', '<b>Traveller module</b> (web + mobile)<br>profile, requirements, checklist,<br>readiness, AI assistant, guides, QR')
setv(A, 'po', '<b>Officer module</b> (web + mobile)<br>QR scan or paste, verify, scan history')
setv(A, 'pa', '<b>Administrator module</b> (web)<br>dashboard, content, rules, people,<br>audit log, AI review')
setv(A, 'pc', '<b>Offline cache</b><br>service worker + IndexedDB<br>(AsyncStorage on mobile)')
setv(A, 'ag', '<b>API gateway</b><br>Node.js / Fastify, request validation', 'Stack was shown as FastAPI / Node')
setv(A, 'ar', '<b>Security controls</b><br>TLS, rate limiting, role checks, border-post scoping')
setv(A, 's2', '<b>Requirement (Rule) Engine</b><br>rules stored as data, shared evaluator')
setv(A, 's3', '<b>Checklist & Readiness Engine</b><br>declared status (Have / Missing / Expired / N/A), score')
setv(A, 's4', '<b>QR Service</b><br>Ed25519 signed pass, expiry, revoke, verify')
setv(A, 's5', '<b>Notification Service</b> (planned)<br>in-app alerts built; SMS / e-mail planned', 'SMS and e-mail are not built')
add_style(A, 's5', 'dashed=1;')
setv(A, 's6', '<b>RAG Guidance Service</b><br>embedding search, grounded cited answers,<br>labelled general answers, refusal when out of scope')
setv(A, 's7', '<b>Content Management Service</b><br>requirements, rules, KB, FAQ, guides<br>(draft, review, approve, publish)')
setv(A, 's9', '<b>Audit Service</b><br>actions, scans, reviews, role changes')
setv(A, 'd1', '<b>Relational database (PostgreSQL)</b><br>accounts, journeys, rules, assessments, QR, audit')
setv(A, 'd2', '<b>Embeddings index</b><br>KB chunks and vectors stored in PostgreSQL', 'Chroma / Qdrant were not used')
setv(A, 'd3', '<b>Static media</b><br>guides and videos served with the web app')
setv(A, 'd4', '<b>Rules and guidance snapshot</b><br>published data cached on the device', 'Offline packages are a cached snapshot')
setv(A, 'x1', '<b>LLM & embedding API</b><br>OpenAI-compatible (Gemini / OpenAI), key kept on server')
setv(A, 'x2', '<b>Map / location</b> (planned)<br>not built')
add_style(A, 'x2', 'dashed=1;')
setv(A, 'x4', '<b>SMS / e-mail gateway</b> (planned)<br>not built')
add_style(A, 'x4', 'dashed=1;')
setv(A, 'archnote', '<b>Guardrails</b>: answers come from approved guidance with citations (or are clearly labelled as general travel answers); AI suggestions never publish without a second administrator; QR passes are signed, short-lived and carry no personal data; all admin actions and officer scans are audit-logged. <b>Dashed boxes are planned, not built.</b>')
new_edge(A, [i for i, c in cells(A).items() if c.get('edge') == '1'][0], 'sqlall', 'band2', 'band3', 'SQL (all services read and write)')

# ───────────────────────── 3. Use case ─────────────────────────
U = 'Use Case'
setv(U, 't5', 'View checklist and declare status<br>(Have / Missing / Expired / N/A)')
setv(U, 't8', 'Generate signed QR pass')
setv(U, 't12', 'Rate answer (planned)')
add_style(U, 't12', 'dashed=1;')
setv(U, 't13', 'View alerts (in-app)', 'Alerts are in-app only')
setv(U, 'o1', 'Scan or paste QR pass')
setv(U, 'o2', 'Verify pass and view minimal summary')
setv(U, 'o3', 'Approve or flag pass')
setv(U, 'o4', 'View scan history', 'Manual (name) search was removed for privacy')
setv(U, 'a6', 'Manage knowledge base (re-index for AI)')
ucs = cells(U)
t13_parent = ucs[get(U, 't13').get('id')]
new_cell(U, 't13', 't14', 'Revoke QR pass', 220, 972, 220, 48)
new_cell(U, 't13', 't15', 'Log out', 220, 1036, 220, 48)
new_cell(U, 'a8', 'a9', 'Assign officers to border posts', 890, 1032, 220, 48)
new_cell(U, 'a8', 'a10', 'Approve content (second administrator)', 890, 1096, 220, 48)
ae = [i for i, c in ucs.items() if c.get('edge') == '1' and c.get('source') == 'TRV'][0]
oe = [i for i, c in ucs.items() if c.get('edge') == '1' and c.get('source') == 'OFF'][0]
ad = [i for i, c in ucs.items() if c.get('edge') == '1' and c.get('source') == 'ADM'][0]
new_edge(U, ae, 'e_t14', 'TRV', 't14')
new_edge(U, ae, 'e_t15', 'TRV', 't15')
new_edge(U, ad, 'e_a9', 'ADM', 'a9')
new_edge(U, ad, 'e_a10', 'ADM', 'a10')
# the officer scan history edge already points at the repurposed o4
new_edge(U, 'e37', 'inc_qr', 't8', 't7', '«include»')
log.append((U, '(none)', 'Revoke QR pass, Log out, Assign officers to border posts, Approve content (second administrator), «include» QR→score', 'Built features missing from the diagram'))

# ───────────────────────── 4. Activity diagram ─────────────────────────
D = 'Activity diagram'
setv(D, 'T4', 'Review checklist and declare each<br>item: Have / Missing / Expired / N/A')
setv(D, 'D1', 'Traveller requests<br>QR pass?', 'QR pass is not gated on a perfect score')
setv(D, 'T7', 'View score, missing items, guidance<br>and AI answers')
setv(D, 'S5', 'Generate signed QR pass<br>(random reference, expiry)')
setv(D, 'O1', 'Scan or paste QR pass')
setv(D, 'S7', 'Validate signature, expiry<br>and status (on server)')
setv(D, 'D2', 'Pass valid?')
setv(D, 'T11', 'Create a new pass in the app')
setv(D, 'O2', 'View minimal summary<br>(reference, score, 6 statuses)')
setv(D, 'O3', 'Approve or flag pass<br>(final decision stays with officer)')
setv(D, 'S8', 'Log scan event<br>(officer, border post, result)')
setv(D, 'A1', 'Publish verified requirements,<br>rules and KB content<br>(approver is not the author)')
setv(D, 'A2', 'Review new content and<br>AI drafts: approve / reject')
setv(D, 'swnote', 'After "Create a new pass" the traveller returns to Generate signed QR pass.')

# ───────────────────────── 5. DFD level 0 ─────────────────────────
D0 = 'DFD Level 0 (Context)'
setv(D0, 'P0', '<b>0</b><br>Pearl Travel System<br><span style="font-size:10px">web app, mobile app, rule engine, RAG guidance, QR service, admin review</span>', 'Web app was missing')
for e in cells(D0).values():
    v = e.get('value') or ''
    if e.get('edge') == '1' and 'manual search' in v:
        e.set('value', v.replace('QR token / manual search', 'QR token (scan or paste)').replace('manual search', 'paste'))
        log.append((D0, 'manual search', 'scan or paste', 'Name search removed for privacy'))
c = get(D0, 'NOT')
c.set('value', re.sub(r'\(SMS / e-mail\)', '(planned: SMS / e-mail)', c.get('value') or ''))
add_style(D0, 'NOT', 'dashed=1;')
log.append((D0, 'E5 Notification Service (SMS / e-mail)', 'planned', 'Not built'))

# ───────────────────────── 6. DFD level 1 ─────────────────────────
D1 = 'DFD Level 1'
Q = 'nQZiFzRgapyWSU1NV4lu-'
setv(D1, Q + '82', 'E5 Notification Service (planned)', 'Not built')
add_style(D1, Q + '82', 'dashed=1;')
setv(D1, Q + '90', '10.0 Manage Traveller Alerts<br>(in-app now; SMS / e-mail planned)')
setv(D1, Q + '89', '4.0 Generate Signed QR Pass')
setv(D1, Q + '97', 'D6 Knowledge Base (chunks + embeddings)')
setv(D1, Q + '104', 'D5 QR Passes & Scan Log')
for e in cells(D1).values():
    v = e.get('value') or ''
    if e.get('edge') == '1':
        nv = v.replace('Have / Missing / N/A', 'Have / Missing / Expired / N/A').replace('Scanned token / manual search, review mark', 'Scanned or pasted token, approve / flag').replace('QR summary (token, expiry)', 'QR pass (reference, digest, expiry)')
        if nv != v:
            e.set('value', nv)
# external entities that exist in the Level 0 context diagram but were missing here (balancing)
new_cell(D1, '82', 'E6x', 'E6 Official Information Sources', 3230, 1330, 130, 70, 'rounded=0;whiteSpace=wrap;html=1;fillColor=#F8CECC;strokeColor=#000000;fontSize=11;')
new_cell(D1, '82', 'E4x', 'E4 AI / LLM Service', 3230, 2042, 130, 70, 'rounded=0;whiteSpace=wrap;html=1;fillColor=#F8CECC;strokeColor=#000000;fontSize=11;')
new_cell(D1, '82', 'E4y', 'E4 AI / LLM Service (same entity)', 1750, 1330, 240, 60, 'rounded=0;whiteSpace=wrap;html=1;fillColor=#F8CECC;strokeColor=#000000;fontSize=11;')
base = [i for i, c in cells(D1).items() if c.get('edge') == '1'][0]
new_edge(D1, base, 'f_e6_8', 'E6x', Q + '91', 'Official guidance & links (admin-reviewed)')
new_edge(D1, base, 'f_6_e4', Q + '85', 'E4y', 'Question + retrieved chunks')
new_edge(D1, base, 'f_e4_6', 'E4y', Q + '85', 'Generated answer')
new_edge(D1, base, 'f_9_e4', Q + '92', 'E4x', 'Source text for drafting')
new_edge(D1, base, 'f_e4_9', 'E4x', Q + '92', 'Draft suggestions')
new_edge(D1, base, 'f_8_d10', Q + '91', Q + '102', 'Content change audit entry')
new_edge(D1, base, 'f_5_d10', Q + '93', Q + '102', 'Scan audit entry')
n156 = get(D1, Q + '156')
n156.set('value', (n156.get('value') or '').replace('2. D10 Audit Log also receives events from 1.0, 5.0 and 8.0 (not drawn for clarity).', '2. D10 Audit Log receives events from 5.0, 8.0 and 9.0 (drawn) and from 1.0 for logins (not drawn for clarity).').replace('4. AI suggestions (D9)', '4. External services E4 and E6 are drawn as in the Level 0 context diagram (E4 appears twice to avoid long lines). 5. AI suggestions (D9)'))
log.append((D1, 'E4 and E6 missing', 'Added E4 (twice, same entity) and E6 with flows; audit flows from 5.0 and 8.0', 'Balances with Level 0; audit log now receives all events'))


# ───────────────────────── 6b. DFD level 1: rebuilt as three columns with no crossing flows ─────────────────────────
def rebuild_dfd1():
    page = pages[D1]
    model = page.find('mxGraphModel')
    old = {c.get('id'): c for c in page.iter('mxCell')}
    pstyle = old[Q + '84'].get('style')
    sstyle = old[Q + '94'].get('style')
    estyle_w = old[Q + '77'].get('style')
    estyle_x = old[Q + '82'].get('style')
    pval = {k: old[Q + v].get('value') for k, v in {'1.0': '84', '6.0': '85', '7.0': '86', '2.0': '87', '3.0': '88', '4.0': '89', '10.0': '90', '8.0': '91', '9.0': '92', '5.0': '93'}.items()}
    PN = {'1.0': 'Authenticate & Manage Accounts', '2.0': 'Build Profile & Generate Checklist', '3.0': 'Declare Items & Assess Readiness', '4.0': 'Generate Signed QR Pass', '5.0': 'Verify QR Pass (officer)',
          '6.0': 'Generate Guidance from Knowledge Base (RAG guidance)', '7.0': 'Deliver Guidance & Offline Content', '8.0': 'Manage Requirements, Rules & Knowledge Base',
          '9.0': 'Review AI Suggestions & Content', '10.0': 'Manage Traveller Alerts (in-app now; SMS / e-mail planned)'}
    ENT = {'E1': ('E1 Traveller', 'w'), 'E2': ('E2 Border Officer', 'w'), 'E3': ('E3 Administrator', 'w'), 'E3a': ('E3 Administrator (copy)', 'w'),
           'E4': ('E4 AI / LLM Service', 'x'), 'E5': ('E5 Notification Service (planned)', 'x'), 'E6': ('E6 Official Information Sources', 'x')}
    ST = {'D1': 'D1 Accounts & Consent', 'D1b': 'D1 Accounts & Consent (copy)', 'D2': 'D2 Profiles & Checklist Items', 'D3a': 'D3 Requirements & Rules', 'D3b': 'D3 Requirements & Rules (copy)', 'D3c': 'D3 Requirements & Rules (copy)',
          'D4': 'D4 Readiness Assessments', 'D4c': 'D4 Readiness Assessments (copy)', 'D5': 'D5 QR Passes & Scan Log', 'D5c': 'D5 QR Passes & Scan Log (copy)', 'D6': 'D6 Knowledge Base (chunks + embeddings)', 'D6b': 'D6 Knowledge Base (copy)',
          'D7': 'D7 Questions & Answer Sources', 'D8': 'D8 FAQ, Guidance & Media', 'D8b': 'D8 FAQ, Guidance & Media (copy)', 'D9': 'D9 AI Suggestions', 'D10': 'D10 Audit Log', 'D10c': 'D10 Audit Log (copy)', 'D11': 'D11 Notifications'}
    # rows, top to bottom. flow = (box key, 'in' (into the process) | 'out' (from the process) | 'both', label)
    ROWS = [
        ('5.0', [('E2', 'in', 'Scanned or pasted token, approve / flag'), ('E2', 'out', 'Minimal readiness summary')],
                [('D4c', 'in', 'Assessment'), ('D5c', 'both', 'QR record / scan log'), ('D10c', 'out', 'Scan audit entry')]),
        ('1.0', [('E2', 'out', 'Officer login / session'), ('E3a', 'out', 'Admin login / session'), ('E1', 'both', 'Register, consent, login / session')],
                [('D1', 'out', 'Account, credentials, consent')]),
        ('2.0', [('E1', 'in', 'Nationality, purpose, border, date'), ('E1', 'out', 'Requirements & checklist')],
                [('D3a', 'in', 'Rules, requirements, lookups'), ('D2', 'out', 'Profile, checklist items')]),
        ('3.0', [('E1', 'in', 'Declared status (Have / Missing / Expired / N/A)'), ('E1', 'out', 'Readiness score, missing items')],
                [('D2', 'both', 'Checklist items / declared status'), ('D4', 'out', 'Assessment (score, counts)')]),
        ('4.0', [('E1', 'in', 'QR request'), ('E1', 'out', 'QR pass (signed token, expiry)')],
                [('D4', 'in', 'Assessment'), ('D5', 'out', 'QR pass (digest, expiry)')]),
        ('7.0', [('E1', 'in', 'Guidance / offline request'), ('E1', 'out', 'Guide, media, offline pack')],
                [('D3b', 'in', 'Requirements for offline pack'), ('D8', 'in', 'Guidance steps, media')]),
        ('6.0', [('E1', 'in', 'Question, feedback'), ('E1', 'out', 'Answer + sources or referral'), ('E4', 'out', 'Question + retrieved chunks'), ('E4', 'in', 'Generated answer')],
                [('D8', 'in', 'FAQ entries'), ('D6', 'in', 'Retrieved chunks'), ('D7', 'out', 'Question, answer, sources')]),
        ('9.0', [('E4', 'out', 'Source text for drafting'), ('E4', 'in', 'Draft suggestions'), ('E3', 'in', 'Approve / reject decisions'), ('E3', 'out', 'Pending suggestions and content')],
                [('D9', 'both', 'Suggestions / review status'), ('D10', 'out', 'Review audit entry')]),
        ('8.0', [('E3', 'in', 'Requirement, rule, FAQ, KB updates'), ('E3', 'out', 'Reports, confirmations'), ('E6', 'in', 'Official guidance & links (reviewed)')],
                [('D10', 'out', 'Content change audit entry'), ('D6b', 'out', 'KB documents, chunks, embeddings'), ('D8b', 'out', 'FAQs, guidance, media'), ('D3c', 'out', 'Requirements, rules, versions')]),
        ('10.0', [('E5', 'out', 'SMS / e-mail requests (planned)')],
                [('D1b', 'in', 'Contact details'), ('D11', 'out', 'Notification record')]),
    ]
    VERT = [('9.0', '8.0', 'Approved changes'), ('8.0', '10.0', 'Content-update notices')]
    EX, EW, PX, PW, SX, SW = 40, 190, 520, 260, 1050, 250
    PITCH, PAD, GAP = 42, 18, 60
    # geometry
    proc, lines = {}, []   # lines: (kind, key, y, direction, label, pid)
    y = 90
    for pid, left, right in ROWS:
        n = max(len(left), len(right))
        h = 28 + (n - 1) * PITCH + 28
        proc[pid] = (PX, y, PW, h)
        for k, (key, d, lab) in enumerate(left):
            lines.append(('L', key, y + 28 + k * PITCH, d, lab, pid))
        for k, (key, d, lab) in enumerate(right):
            lines.append(('R', key, y + 28 + k * PITCH, d, lab, pid))
        y += h + GAP
    boxes = {}
    for kind, key, yy, d, lab, pid in lines:
        b = boxes.setdefault((kind, key), [yy, yy])
        b[0], b[1] = min(b[0], yy), max(b[1], yy)
    box_geo = {}
    for (kind, key), (y0, y1) in boxes.items():
        top, bot = y0 - PAD, y1 + PAD
        if bot - top < 36:
            mid = (top + bot) / 2
            top, bot = mid - 18, mid + 18
        box_geo[(kind, key)] = (EX if kind == 'L' else SX, top, EW if kind == 'L' else SW, bot - top)
    # rebuild page content
    root_el = model.find('root')
    for c in list(root_el):
        root_el.remove(c)
    ET.SubElement(root_el, 'mxCell', {'id': 'd0'})
    ET.SubElement(root_el, 'mxCell', {'id': 'd1', 'parent': 'd0'})

    def vtx(i, val, geo, style):
        c = ET.SubElement(root_el, 'mxCell', {'id': i, 'parent': 'd1', 'value': val, 'style': style, 'vertex': '1'})
        ET.SubElement(c, 'mxGeometry', {'x': str(int(geo[0])), 'y': str(int(geo[1])), 'width': str(int(geo[2])), 'height': str(int(geo[3])), 'as': 'geometry'})

    vtx('title', '<b>DFD Level 1</b> - external entities (left), processes (centre), data stores (right). No flows cross. Items marked (copy) repeat an entity or store to keep lines straight.', (EX, 20, 1260, 40), 'text;html=1;align=left;verticalAlign=top;whiteSpace=wrap;fontSize=13;')
    vtx('hdrL', '<b>External entities</b>', (EX, 62, EW, 22), 'text;html=1;align=center;fontSize=12;fontColor=#92560A;')
    vtx('hdrP', '<b>Processes</b>', (PX, 62, PW, 22), 'text;html=1;align=center;fontSize=12;fontColor=#92560A;')
    vtx('hdrR', '<b>Data stores</b>', (SX, 62, SW, 22), 'text;html=1;align=center;fontSize=12;fontColor=#92560A;')
    for pid, g in proc.items():
        vtx('P' + pid, f'<b>{pid}</b><br>{PN[pid]}', g, pstyle)
    for (kind, key), g in box_geo.items():
        if kind == 'L':
            vtx('B_' + key, ENT[key][0], g, estyle_w if ENT[key][1] == 'w' else estyle_x)
        else:
            vtx('B_' + key, ST[key], g, sstyle)
    ebase = 'edgeStyle=none;html=1;rounded=0;strokeWidth=1.2;fontSize=9;labelBackgroundColor=#FFFFFF;endArrow=classic;endFill=1;'
    segs = []

    def edge(i, src, tgt, x_s, y_s, x_t, y_t, lab, both, sg, tg):
        ex, ey = (1 if x_s <= x_t else 0), (y_s - sg[1]) / sg[3]
        nx, ny = (0 if x_s <= x_t else 1), (y_t - tg[1]) / tg[3]
        st = ebase + f'exitX={ex};exitY={ey:.4f};entryX={nx};entryY={ny:.4f};exitPerimeter=0;entryPerimeter=0;' + ('startArrow=classic;startFill=1;' if both else '')
        c = ET.SubElement(root_el, 'mxCell', {'id': i, 'parent': 'd1', 'value': lab, 'style': st, 'edge': '1', 'source': src, 'target': tgt})
        ET.SubElement(c, 'mxGeometry', {'relative': '1', 'as': 'geometry'})

    for n_, (kind, key, yy, d, lab, pid) in enumerate(lines):
        pg = proc[pid]
        bg = box_geo[(kind, key)]
        bid = 'B_' + key
        if kind == 'L':
            xb, xp = bg[0] + bg[2], pg[0]
            if d == 'in' or d == 'both':
                edge(f'f{n_}', bid, 'P' + pid, xb, yy, xp, yy, lab, d == 'both', bg, pg)
            else:
                edge(f'f{n_}', 'P' + pid, bid, xp, yy, xb, yy, lab, False, pg, bg)
            segs.append(((xb, yy), (xp, yy)))
        else:
            xp, xb = pg[0] + pg[2], bg[0]
            if d == 'in':
                edge(f'f{n_}', bid, 'P' + pid, xb, yy, xp, yy, lab, False, bg, pg)
            elif d == 'both':
                edge(f'f{n_}', 'P' + pid, bid, xp, yy, xb, yy, lab, True, pg, bg)
            else:
                edge(f'f{n_}', 'P' + pid, bid, xp, yy, xb, yy, lab, False, pg, bg)
            segs.append(((xp, yy), (xb, yy)))
    for n_, (a, b, lab) in enumerate(VERT):
        ga, gb = proc[a], proc[b]
        cx = ga[0] + ga[2] / 2
        c = ET.SubElement(root_el, 'mxCell', {'id': f'v{n_}', 'parent': 'd1', 'value': lab, 'edge': '1', 'source': 'P' + a, 'target': 'P' + b,
                                              'style': ebase + 'exitX=0.5;exitY=1;entryX=0.5;entryY=0;exitPerimeter=0;entryPerimeter=0;'})
        ET.SubElement(c, 'mxGeometry', {'relative': '1', 'as': 'geometry'})
        segs.append(((cx, ga[1] + ga[3]), (cx, gb[1])))
    last = max(g[1] + g[3] for g in proc.values())
    vtx('notes', '<b>Notes</b><br>1. The session / role token from 1.0 accompanies every request (not drawn).<br>2. 1.0 also writes login events to the audit log (not drawn). 3.0 and 9.0 also send reminder and alert requests to 10.0, and 8.0 sends content-update notices (the 3.0 and 9.0 requests are not drawn to keep lines straight). E5 delivers reminders to travellers and officers.<br>3. Checklist items in D2 carry the rule, version and requirement level used, so scores can be reproduced. No document numbers or uploads are stored.<br>4. AI suggestions (D9) never change published content until a second administrator approves them in 9.0; 8.0 publishes approved changes. E4 and E6 are the same external entities as in the Level 0 context diagram.', (PX - 480, last + 40, 1250, 130), 'text;html=1;align=left;verticalAlign=top;whiteSpace=wrap;fontSize=11;')
    model.set('pageWidth', '1500')
    model.set('pageHeight', str(int(last + 240)))
    # proof: no two flow lines cross or touch
    def cross(a, b):
        (x1, y1), (x2, y2) = a; (x3, y3), (x4, y4) = b
        def o(ax, ay, bx, by, cx, cy): return (bx - ax) * (cy - ay) - (by - ay) * (cx - ax)
        d1, d2, d3, d4 = o(x3, y3, x4, y4, x1, y1), o(x3, y3, x4, y4, x2, y2), o(x1, y1, x2, y2, x3, y3), o(x1, y1, x2, y2, x4, y4)
        return d1 * d2 < 0 and d3 * d4 < 0
    crossings = sum(cross(segs[i], segs[j]) for i in range(len(segs)) for j in range(i + 1, len(segs)))
    # lines must not pass through any box other than their endpoints
    bad = 0
    allboxes = [g for g in proc.values()] + list(box_geo.values())
    for (p1, p2) in segs:
        for g in allboxes:
            x0, y0, w, h = g
            lo, hi = min(p1[0], p2[0]), max(p1[0], p2[0])
            ylo, yhi = min(p1[1], p2[1]), max(p1[1], p2[1])
            if lo < x0 + w - 1 and hi > x0 + 1 and ylo < y0 + h - 1 and yhi > y0 + 1:
                bad += 1
    log.append((D1, 'tangled layout, 48 crossing-prone flows', f'rebuilt in three columns: {len(proc)} processes, {len(box_geo)} entity/store boxes, {len(segs)} flows; line crossings = {crossings}, lines through other boxes = {bad}', "Lecturer's feedback: entities, then processes, then data stores, with no crossing lines"))
    print('DFD1 crossings:', crossings, 'lines through boxes:', bad)
    assert crossings == 0 and bad == 0


rebuild_dfd1()

# ───────────────────────── 7. As-built ERD (generated from the database) ─────────────────────────
cols, fks = {}, []
for line in open(COLS):
    t_, c_, dt, nul, pk = line.rstrip('\n').split('|')
    cols.setdefault(t_, []).append((c_, dt, nul, pk))
for line in open(FKS):
    a, b, c_ = line.rstrip('\n').split('|')
    fks.append((a, b, c_))
fkcols = {(a, b) for a, b, _ in fks}
GROUPS = [
    ('Identity and access', '#DAE8FC', ['pt_auth_users', 'pt_auth_roles', 'pt_auth_user_roles', 'pt_auth_refresh_tokens']),
    ('Journey, assessment and QR', '#D5E8D4', ['pt_journeys', 'pt_readiness_assessments', 'pt_qr_summaries', 'pt_qr_verifications']),
    ('Staff and audit', '#FFF2CC', ['pt_admin_border_posts', 'pt_admin_officer_assignments', 'pt_admin_audit_logs', 'pt_admin_settings']),
    ('Content, rules and AI', '#E1D5E7', ['pt_admin_requirements', 'pt_admin_content_items', 'pt_kb_chunks', 'pt_ai_suggestions']),
]
SHORT = {'character varying': 'varchar', 'timestamp with time zone': 'timestamptz', 'double precision': 'float8', 'ARRAY': 'float8[]', 'smallint': 'int2', 'integer': 'int'}
RH, W, MAXROWS = 20, 270, 13
erd = ET.SubElement(root, 'diagram', {'name': '7 ERD as built (PostgreSQL)', 'id': 'erd-as-built'})
model = ET.SubElement(erd, 'mxGraphModel', {'dx': '1200', 'dy': '800', 'grid': '1', 'gridSize': '10', 'guides': '1', 'tooltips': '1', 'connect': '1', 'arrows': '1', 'fold': '1', 'page': '0', 'pageScale': '1', 'pageWidth': '1600', 'pageHeight': '1700', 'math': '0', 'shadow': '0'})
rt = ET.SubElement(model, 'root')
ET.SubElement(rt, 'mxCell', {'id': 'r0'})
ET.SubElement(rt, 'mxCell', {'id': 'r1', 'parent': 'r0'})


def vertex(i, parent, value, x, y, w, h, style):
    c = ET.SubElement(rt, 'mxCell', {'id': i, 'parent': parent, 'value': value, 'style': style, 'vertex': '1'})
    ET.SubElement(c, 'mxGeometry', {'x': str(x), 'y': str(y), 'width': str(w), 'height': str(h), 'as': 'geometry'})


vertex('title', 'r1', '<b>ERD as built</b> (exported from the PostgreSQL schema, migrations 001-004)', 40, -50, 1400, 30, 'text;html=1;align=left;fontSize=16;')
vertex('legend', 'r1', 'PK = primary key, FK = foreign key. Rules are stored as JSON in <b>pt_admin_requirements.rule_metadata</b> (nationality groups, purposes, travel mode, border post) instead of separate lookup tables. Roles use a join table (many roles per user). Officers can be assigned to several border posts. The QR table stores a SHA-256 digest of the signed token, never the token itself. Content and rules follow draft, pending review, approved, published.', 40, -15, 1400, 52, 'text;html=1;align=left;verticalAlign=top;whiteSpace=wrap;fontSize=11;')
pos = {}
for gi, (gname, color, tables) in enumerate(GROUPS):
    x = 40 + gi * 360
    vertex(f'g{gi}', 'r1', f'<b>{gname}</b>', x, 50, W, 26, f'text;html=1;align=left;fontSize=13;fontColor=#1E293B;')
    y = 85
    for t_ in tables:
        rows = cols[t_]
        shown = rows[:MAXROWS]
        extra = len(rows) - len(shown)
        h = 28 + RH * (len(shown) + (1 if extra else 0))
        tid = 't_' + t_
        vertex(tid, 'r1', f'<b>{t_.replace("pt_", "")}</b>', x, y, W, h, f'swimlane;fontStyle=0;childLayout=stackLayout;horizontal=1;startSize=28;horizontalStack=0;resizeParent=1;resizeParentMax=0;resizeLast=0;collapsible=0;marginBottom=0;fillColor={color};strokeColor=#666666;fontSize=12;html=1;')
        for ri, (c_, dt, nul, pk) in enumerate(shown):
            tag = 'PK ' if pk else ('FK ' if (t_, c_) in fkcols else '')
            style = 'text;strokeColor=none;fillColor=#FFFFFF;align=left;verticalAlign=middle;spacingLeft=6;spacingRight=4;overflow=hidden;rotatable=0;html=1;fontSize=10;' + ('fontStyle=1;' if pk else '')
            vertex(f'{tid}_{ri}', tid, f'{tag}{c_}  <font color="#64748B">{SHORT.get(dt, dt)}</font>', 0, 28 + RH * ri, W, RH, style)
        if extra:
            vertex(f'{tid}_more', tid, f'<i>+ {extra} more columns</i>', 0, 28 + RH * len(shown), W, RH, 'text;strokeColor=none;fillColor=#FFFFFF;align=left;spacingLeft=6;fontSize=10;fontColor=#64748B;html=1;')
        pos[t_] = tid
        y += h + 24
drawn = 0
for a, b, c_ in fks:
    if a in pos and c_ in pos and a != c_:
        e = ET.SubElement(rt, 'mxCell', {'id': f'fk_{a}_{b}_{c_}', 'parent': 'r1', 'source': pos[c_], 'target': pos[a], 'edge': '1', 'value': '',
                                         'style': 'edgeStyle=orthogonalEdgeStyle;rounded=0;html=1;endArrow=ERmany;startArrow=ERone;endFill=0;startFill=0;strokeColor=#64748B;'})
        ET.SubElement(e, 'mxGeometry', {'relative': '1', 'as': 'geometry'})
        drawn += 1
log.append(('7 ERD as built', '(new page)', f'{len(pos)} tables, {drawn} foreign-key links, generated from PostgreSQL', 'Diagrams now show the real schema'))

# ───────────────────────── 8. Design ERDs: label as conceptual, drop duplicates ─────────────────────────
for dup in ('ERD', 'M-ERD'):
    root.remove(pages[dup])
    log.append((dup, 'older 9-table ERD', 'removed', 'Duplicated by ERD 1-3 and contained typos'))
NOTE = '<b>Conceptual design ERD.</b> The built schema is on page 7 "ERD as built". Main differences: rules are JSON metadata rather than lookup tables, roles are a join table, officers can have several border posts, QR stores a token digest, content has a review workflow, notifications and media tables are not built.'
for key in ('ERD 1 - Traveller journey', 'ERD 2 - Rules and lookups', 'ERD 3 - Knowledge, AI and content'):
    page = pages[key]
    texts = [c for c in page.iter('mxCell') if c.get('vertex') == '1' and (c.get('style') or '').startswith('text;') and c.find('mxGeometry') is not None]
    title = min(texts, key=lambda c: float(c.find('mxGeometry').get('y', 0)))
    g = title.find('mxGeometry')
    note = copy.deepcopy(title)
    note.set('id', 'design-note-' + key[:5].replace(' ', ''))
    note.set('value', NOTE)
    ng = note.find('mxGeometry')
    ng.set('y', str(float(g.get('y', 0)) + float(g.get('height', 30)) + 8))
    ng.set('height', '60')
    {c: p for p in page.iter() for c in p}[title].append(note)
log.append(('ERD 1-3', 'untitled design pages', 'labelled as conceptual design with a note on differences', 'Design vs implementation made explicit'))

# ───────────────────────── 9. Tab names and order ─────────────────────────
RENAME = {
    'NewFlowchart': '1 Flowchart',
    'System Architecture': '2 System Architecture',
    'Use Case': '3 Use Case',
    'Activity diagram': '4 Activity diagram',
    'DFD Level 0 (Context)': '5 DFD Level 0 (Context)',
    'DFD Level 1': '6 DFD Level 1',
    '7 ERD as built (PostgreSQL)': '7 ERD as built (PostgreSQL)',
    'ERD 1 - Traveller journey': '8 ERD design 1 - Traveller journey',
    'ERD 2 - Rules and lookups': '9 ERD design 2 - Rules and lookups',
    'ERD 3 - Knowledge, AI and content': '10 ERD design 3 - Knowledge, AI and content',
}
order = list(RENAME)
all_pages = {d.get('name').strip(): d for d in root.iter('diagram')}
for d in list(root.iter('diagram')):
    root.remove(d)
for name in order:
    d = all_pages[name]
    d.set('name', RENAME[name])
    root.append(d)
root.set('pages', str(len(order)))

ET.indent(tree, space='  ')
tree.write(DST, encoding='utf-8', xml_declaration=False)

with open('CHANGE_LOG.md', 'w') as f:
    f.write('# Diagram change log\n\nEvery change makes a diagram match the system that was built.\n\n| Diagram | Was | Now | Why |\n|---|---|---|---|\n')
    for p, o, n, w in log:
        f.write(f'| {p} | {o} | {n} | {w} |\n')
print(f'{len(log)} changes written; {DST}')
