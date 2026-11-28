# Diagram change log

Every change makes a diagram match the system that was built.

| Diagram | Was | Now | Why |
|---|---|---|---|
| NewFlowchart | Traveller declares each item (Have / Missing / Not applicabl | Traveller declares each item (Have / Missing / Expired / N/A) | App has an Expired status |
| NewFlowchart | All necessary items declared "Have"? | Traveller creates a QR pass? | QR pass is not gated on a perfect score in the built system |
| NewFlowchart | Generate QR summary (signed token + expiry) | Server signs QR pass (random reference, score, expiry) | Signing happens on the server |
| NewFlowchart | Display QR summary to traveller | Display QR pass to traveller |  |
| NewFlowchart | Officer scans QR summary | Officer scans or pastes QR pass | Pasting replaces name search (privacy) |
| NewFlowchart | Token valid and not expired? | Server checks signature, status and expiry? | Verification is server-side |
| NewFlowchart | Show minimal readiness summary to officer | Show minimal summary (reference, score, 6 statuses) |  |
| NewFlowchart | Officer reviews and marks: Reviewed / Needs question | Officer approves or flags the pass | Matches Approve / Flag in the app |
| NewFlowchart | Log scan event (officer, time, result) | Log scan event (officer, border post, time, result) |  |
| NewFlowchart | Design rules  Score is recalculated on every pass. A QR summ | Design rules  The score is recalculated on the server each time a pass is create | Removed the "only when all Have" rule |
| NewFlowchart | Note  The officer reviews the summary; the final immigration | Note  The officer reviews the summary; the final immigration decision always sta |  |
| System Architecture | PRESENTATION LAYER - React Native / Expo mobile app | PRESENTATION LAYER - Web app (installable PWA) and React Native / Expo mobile ap | Web app was missing |
| System Architecture | Traveller module  profile, requirements, checklist, readines | Traveller module  (web + mobile) profile, requirements, checklist, readiness, AI |  |
| System Architecture | Officer module  QR scanner, passenger summary, scan history | Officer module  (web + mobile) QR scan or paste, verify, scan history |  |
| System Architecture | Administrator module  dashboard, content, AI review, reports | Administrator module  (web) dashboard, content, rules, people, audit log, AI rev |  |
| System Architecture | Offline cache  local store: requirements, checklist, guides  | Offline cache  service worker + IndexedDB (AsyncStorage on mobile) |  |
| System Architecture | API gateway  FastAPI / Node, request validation | API gateway  Node.js / Fastify, request validation | Stack was shown as FastAPI / Node |
| System Architecture | Security controls  TLS, rate limiting, consent checks | Security controls  TLS, rate limiting, role checks, border-post scoping |  |
| System Architecture | Requirement (Rule) Engine  deterministic rules, versions | Requirement (Rule) Engine  rules stored as data, shared evaluator |  |
| System Architecture | Checklist & Readiness Engine  declared status, score | Checklist & Readiness Engine  declared status (Have / Missing / Expired / N/A),  |  |
| System Architecture | QR Service  signed token, expiry, revoke | QR Service  Ed25519 signed pass, expiry, revoke, verify |  |
| System Architecture | Notification Service  in-app, SMS, e-mail | Notification Service  (planned) in-app alerts built; SMS / e-mail planned | SMS and e-mail are not built |
| System Architecture | RAG Guidance Service  question processing, retrieval, ground | RAG Guidance Service  embedding search, grounded cited answers, labelled general |  |
| System Architecture | Content Management Service  requirements, rules, KB, FAQ, gu | Content Management Service  requirements, rules, KB, FAQ, guides (draft, review, |  |
| System Architecture | Audit Service  actions, scans, reviews | Audit Service  actions, scans, reviews, role changes |  |
| System Architecture | Relational database  accounts, profiles, rules, assessments, | Relational database (PostgreSQL)  accounts, journeys, rules, assessments, QR, au |  |
| System Architecture | Vector store  KB chunk embeddings (Chroma / Qdrant) | Embeddings index  KB chunks and vectors stored in PostgreSQL | Chroma / Qdrant were not used |
| System Architecture | Media storage  videos, audio, text guides | Static media  guides and videos served with the web app |  |
| System Architecture | Offline packages  versioned, built by Content Mgmt | Rules and guidance snapshot  published data cached on the device | Offline packages are a cached snapshot |
| System Architecture | LLM & embedding API  RAG answers, AI drafts | LLM & embedding API  OpenAI-compatible (Gemini / OpenAI), key kept on server |  |
| System Architecture | Map / location  optional | Map / location  (planned) not built |  |
| System Architecture | SMS / e-mail gateway  notifications | SMS / e-mail gateway  (planned) not built |  |
| System Architecture | Guardrails : answers only from the verified knowledge base,  | Guardrails : answers come from approved guidance with citations (or are clearly  |  |
| Use Case | View checklist and declare item status | View checklist and declare status (Have / Missing / Expired / N/A) |  |
| Use Case | Generate QR summary | Generate signed QR pass |  |
| Use Case | Rate answer | Rate answer (planned) |  |
| Use Case | View notifications | View alerts (in-app) | Alerts are in-app only |
| Use Case | Scan QR summary | Scan or paste QR pass |  |
| Use Case | View minimal readiness summary | Verify pass and view minimal summary |  |
| Use Case | Mark reviewed / needs attention | Approve or flag pass |  |
| Use Case | Manual search | View scan history | Manual (name) search was removed for privacy |
| Use Case | Manage knowledge base | Manage knowledge base (re-index for AI) |  |
| Use Case | (none) | Revoke QR pass, Log out, Assign officers to border posts, Approve content (second administrator), «include» QR→score | Built features missing from the diagram |
| Activity diagram | Review checklist and declare each item: Have / Missing / N/A | Review checklist and declare each item: Have / Missing / Expired / N/A |  |
| Activity diagram | All mandatory items "Have"? | Traveller requests QR pass? | QR pass is not gated on a perfect score |
| Activity diagram | View missing items, guidance and AI answers | View score, missing items, guidance and AI answers |  |
| Activity diagram | Generate QR summary (signed token, expiry) | Generate signed QR pass (random reference, expiry) |  |
| Activity diagram | Scan QR summary | Scan or paste QR pass |  |
| Activity diagram | Validate signature, expiry and status | Validate signature, expiry and status (on server) |  |
| Activity diagram | Token valid? | Pass valid? |  |
| Activity diagram | Regenerate QR in the app | Create a new pass in the app |  |
| Activity diagram | View minimal readiness summary | View minimal summary (reference, score, 6 statuses) |  |
| Activity diagram | Mark Reviewed / Needs attention (final decision stays with o | Approve or flag pass (final decision stays with officer) |  |
| Activity diagram | Log scan event | Log scan event (officer, border post, result) |  |
| Activity diagram | Publish verified requirements, rules and KB content | Publish verified requirements, rules and KB content (approver is not the author) |  |
| Activity diagram | Review AI-drafted changes: approve / reject | Review new content and AI drafts: approve / reject |  |
| Activity diagram | After "Regenerate QR" the traveller returns to  Generate QR  | After "Create a new pass" the traveller returns to Generate signed QR pass. |  |
| DFD Level 0 (Context) | 0  Pearl Travel System  mobile app, rule engine, RAG guidanc | 0  Pearl Travel System  web app, mobile app, rule engine, RAG guidance, QR servi | Web app was missing |
| DFD Level 0 (Context) | manual search | scan or paste | Name search removed for privacy |
| DFD Level 0 (Context) | E5 Notification Service (SMS / e-mail) | planned | Not built |
| DFD Level 1 | E5 Notification Service | E5 Notification Service (planned) | Not built |
| DFD Level 1 | 10.0  Manage Traveller Notifications | 10.0 Manage Traveller Alerts (in-app now; SMS / e-mail planned) |  |
| DFD Level 1 | 4.0  Generate QR Summary | 4.0 Generate Signed QR Pass |  |
| DFD Level 1 | D6   Knowledge Base (chunks + vectors) | D6 Knowledge Base (chunks + embeddings) |  |
| DFD Level 1 | D5   QR Summaries & Scan Log | D5 QR Passes & Scan Log |  |
| DFD Level 1 | E4 and E6 missing | Added E4 (twice, same entity) and E6 with flows; audit flows from 5.0 and 8.0 | Balances with Level 0; audit log now receives all events |
| DFD Level 1 | tangled layout, 48 crossing-prone flows | rebuilt in three columns: 10 processes, 26 entity/store boxes, 50 flows; line crossings = 0, lines through other boxes = 0 | Lecturer's feedback: entities, then processes, then data stores, with no crossing lines |
| 7 ERD as built | (new page) | 16 tables, 31 foreign-key links, generated from PostgreSQL | Diagrams now show the real schema |
| ERD | older 9-table ERD | removed | Duplicated by ERD 1-3 and contained typos |
| M-ERD | older 9-table ERD | removed | Duplicated by ERD 1-3 and contained typos |
| ERD 1-3 | untitled design pages | labelled as conceptual design with a note on differences | Design vs implementation made explicit |
