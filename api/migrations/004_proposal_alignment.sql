-- 004: Proposal alignment — signed QR passes, configurable rules, centralised officer/admin data,
-- governed knowledge base for the RAG assistant, offline sync keys and audit logging.

-- ── QR passes: no personal data, signed token, officer decisions ──
ALTER TABLE public.pt_qr_summaries ADD COLUMN IF NOT EXISTS signature_kid VARCHAR(40) NOT NULL DEFAULT 'k1';
ALTER TABLE public.pt_qr_summaries ADD COLUMN IF NOT EXISTS document_codes CHAR(6) NULL;
ALTER TABLE public.pt_qr_verifications ADD COLUMN IF NOT EXISTS decision VARCHAR(20) NULL;
ALTER TABLE public.pt_qr_verifications ADD COLUMN IF NOT EXISTS decision_note TEXT NULL;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_pt_qr_verifications_decision') THEN
    ALTER TABLE public.pt_qr_verifications ADD CONSTRAINT chk_pt_qr_verifications_decision CHECK (decision IS NULL OR decision IN ('approved','flagged'));
  END IF;
END $$;
CREATE UNIQUE INDEX IF NOT EXISTS uq_pt_qr_one_valid_per_user ON public.pt_qr_summaries (user_id) WHERE status = 'valid';

-- ── Offline synchronisation (idempotent writes) ──
ALTER TABLE public.pt_readiness_assessments ADD COLUMN IF NOT EXISTS client_key UUID NULL;
CREATE UNIQUE INDEX IF NOT EXISTS uq_pt_readiness_user_client_key ON public.pt_readiness_assessments (user_id, client_key) WHERE client_key IS NOT NULL;
ALTER TABLE public.pt_journeys ADD COLUMN IF NOT EXISTS client_updated_at TIMESTAMPTZ NULL;
CREATE UNIQUE INDEX IF NOT EXISTS uq_pt_journeys_one_open_per_user ON public.pt_journeys (user_id) WHERE status IN ('planned','ready','in_transit');

-- ── Audit log for sensitive administrator and officer actions ──
CREATE TABLE IF NOT EXISTS public.pt_admin_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_user_id UUID NULL REFERENCES public.pt_auth_users(id) ON DELETE SET NULL,
  actor_role VARCHAR(40) NULL,
  action VARCHAR(80) NOT NULL,
  entity_type VARCHAR(60) NULL,
  entity_id VARCHAR(80) NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  ip_address VARCHAR(64) NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_pt_admin_audit_created ON public.pt_admin_audit_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_pt_admin_audit_actor ON public.pt_admin_audit_logs (actor_user_id, created_at DESC);

-- ── AI-drafted content suggestions (drafts only; an administrator approves or rejects) ──
CREATE TABLE IF NOT EXISTS public.pt_ai_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kind VARCHAR(10) NOT NULL CHECK (kind IN ('ADD','UPDATE')),
  content_item_id UUID NULL REFERENCES public.pt_admin_content_items(id) ON DELETE SET NULL,
  category VARCHAR(40) NOT NULL CHECK (category IN ('immigration','health','customs','border_post','transport')),
  title VARCHAR(240) NOT NULL,
  proposed_summary TEXT NOT NULL,
  proposed_body TEXT NOT NULL,
  rationale TEXT NULL,
  source_note TEXT NULL,
  model VARCHAR(80) NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  rejection_reason TEXT NULL,
  created_by UUID NULL REFERENCES public.pt_auth_users(id) ON DELETE SET NULL,
  reviewed_by UUID NULL REFERENCES public.pt_auth_users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_pt_ai_suggestions_status ON public.pt_ai_suggestions (status, created_at DESC);

-- ── Knowledge-base chunks with embeddings for semantic retrieval (RAG) ──
-- Embeddings are stored as float arrays so the schema works on any PostgreSQL.
-- With the pgvector extension available, this column can be migrated to vector(n) for indexed search.
CREATE TABLE IF NOT EXISTS public.pt_kb_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_item_id UUID NOT NULL REFERENCES public.pt_admin_content_items(id) ON DELETE CASCADE,
  content_version INT NOT NULL,
  chunk_index INT NOT NULL,
  chunk_text TEXT NOT NULL,
  embedding DOUBLE PRECISION[] NOT NULL,
  embedding_model VARCHAR(80) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (content_item_id, chunk_index)
);

-- ── Row level security: browsers/Data API roles get no direct access to any of these tables ──
ALTER TABLE public.pt_admin_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pt_ai_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pt_kb_chunks ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    REVOKE ALL ON TABLE public.pt_admin_audit_logs, public.pt_ai_suggestions, public.pt_kb_chunks FROM anon;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    REVOKE ALL ON TABLE public.pt_admin_audit_logs, public.pt_ai_suggestions, public.pt_kb_chunks FROM authenticated;
  END IF;
END $$;

-- Seed: nationality groups and the default rule set (generated from shared/defaultRules.json)
INSERT INTO public.pt_admin_settings (key, category, label, description, value_json) VALUES ('nationality_groups','application','Nationality groups','Groups used by the rules engine to decide visa rules.','{"citizen": ["Uganda"], "eac": ["Kenya", "Tanzania", "Rwanda", "Burundi", "South Sudan", "Democratic Republic of the Congo", "Somalia"], "visaExempt": ["Antigua", "Bahamas", "Barbados", "Belize", "Fiji", "Gambia", "Grenada", "Jamaica", "Malawi", "Malta", "Mauritius", "Seychelles", "Sierra Leone", "Singapore", "Solomon Islands", "St. Vincent & Grenadines", "Tonga", "Vanuatu", "Zambia", "Zimbabwe"]}'::jsonb) ON CONFLICT (key) DO NOTHING;
INSERT INTO public.pt_auth_users (email,email_normalized,password_hash,full_name,email_verified,is_active) VALUES ('system@pearltravel.invalid','system@pearltravel.invalid','!',  'Pearl Travel System',TRUE,FALSE) ON CONFLICT (email_normalized) DO NOTHING;
INSERT INTO public.pt_admin_requirements (code,category,title,summary,simple_explanation,applicable_condition,official_source,mandatory,rule_metadata,workflow_status,author_id,published_at,version) SELECT 'req-passport','entry','Valid Passport (6-Month Minimum Validity)','Passport must be valid for at least 6 months past your entry date.','Immigration officers inspect your passport to check it has at least 6 months left before it expires and at least 2 full blank visa pages.','Mandatory for all international travelers entering Uganda.','Uganda Directorate of Citizenship & Immigration Control (DCIC)',TRUE,'{"order": 10, "when": {}, "checklist": {"id": "doc-passport", "title": "Biometric / Regular Passport", "description": "Minimum 6-month validity with at least 2 consecutive blank stamp pages.", "category": "passport", "guidanceNote": "Carry the physical document. Digital scans on phones are not accepted for entry.", "issuingAuthority": "Your national passport authority"}, "verification": {"status": "pending", "verifiedAt": null, "note": "Awaiting official verification"}}'::jsonb,'published',u.id,NOW(),1 FROM public.pt_auth_users u WHERE u.email_normalized='system@pearltravel.invalid' ON CONFLICT (code) DO NOTHING;
INSERT INTO public.pt_admin_requirements (code,category,title,summary,simple_explanation,applicable_condition,official_source,mandatory,rule_metadata,workflow_status,author_id,published_at,version) SELECT 'req-visa-citizen','visa','Ugandan Citizen Entry (National ID or Passport)','No visa required. Present Ugandan passport or National ID card.','As a returning citizen of the Republic of Uganda you have the right of entry. Present your valid Ugandan passport or National ID card.','Applies to Ugandan citizens.','Ministry of Internal Affairs Uganda',TRUE,'{"order": 20, "when": {"nationalityGroups": ["citizen"]}, "checklist": {"id": "doc-visa", "title": "Citizen Identification (Passport / NIN)", "description": "Valid Ugandan ID or Passport", "category": "visa", "guidanceNote": "No advance visa fee required."}, "verification": {"status": "pending", "verifiedAt": null, "note": "Awaiting official verification"}}'::jsonb,'published',u.id,NOW(),1 FROM public.pt_auth_users u WHERE u.email_normalized='system@pearltravel.invalid' ON CONFLICT (code) DO NOTHING;
INSERT INTO public.pt_admin_requirements (code,category,title,summary,simple_explanation,applicable_condition,official_source,mandatory,rule_metadata,workflow_status,author_id,published_at,version) SELECT 'req-visa-eac','visa','East African Community (EAC) Free Movement','Visa-free entry under EAC Common Market Protocol.','Citizens of {nationality} can enter Uganda without a visa under EAC arrangements. Present a valid passport or a recognised EAC identity document.','Applicable to citizens of {nationality}.','EAC Secretariat & Uganda Immigration',TRUE,'{"order": 20, "when": {"nationalityGroups": ["eac"]}, "checklist": {"id": "doc-visa", "title": "EAC Travel Entry / Free Pass", "description": "EAC Treaty Visa Exemption Entry", "category": "visa", "guidanceNote": "No advance visa fee required."}, "verification": {"status": "pending", "verifiedAt": null, "note": "Awaiting official verification"}}'::jsonb,'published',u.id,NOW(),1 FROM public.pt_auth_users u WHERE u.email_normalized='system@pearltravel.invalid' ON CONFLICT (code) DO NOTHING;
INSERT INTO public.pt_admin_requirements (code,category,title,summary,simple_explanation,applicable_condition,official_source,mandatory,rule_metadata,workflow_status,author_id,published_at,version) SELECT 'req-visa-exempt','visa','Bilateral Visa Exemption (Up to 90 Days)','Nationals of {nationality} are exempt from tourist/business visas.','Under reciprocal agreements, visitors from {nationality} can enter without a visa for short visits. An entry endorsement stamp is issued at immigration.','Short-term leisure/business visits.','Uganda Ministry of Foreign Affairs',TRUE,'{"order": 20, "when": {"nationalityGroups": ["visa_exempt"]}, "checklist": {"id": "doc-visa", "title": "Visa-Exempt Country Status", "description": "Reciprocal 90-Day Entry Stamp", "category": "visa", "guidanceNote": "No advance visa fee required."}, "verification": {"status": "pending", "verifiedAt": null, "note": "Awaiting official verification"}}'::jsonb,'published',u.id,NOW(),1 FROM public.pt_auth_users u WHERE u.email_normalized='system@pearltravel.invalid' ON CONFLICT (code) DO NOTHING;
INSERT INTO public.pt_admin_requirements (code,category,title,summary,simple_explanation,applicable_condition,official_source,mandatory,rule_metadata,workflow_status,author_id,published_at,version) SELECT 'req-visa-evisa','visa','Mandatory Uganda Electronic Visa (e-Visa)','Must be applied for and approved online before departure.','Uganda no longer issues visas on arrival. Apply online at visas.immigration.go.ug and carry the printed approval letter.','Mandatory for citizens of {nationality} traveling for {purpose}.','Directorate of Citizenship and Immigration Control (DCIC)',TRUE,'{"order": 20, "when": {"nationalityGroups": ["visa_required"], "excludePurposes": ["transit"], "excludeDestinationKeywords": ["multi-country"]}, "checklist": {"id": "doc-visa", "title": "Uganda Electronic Visa (Approval Letter)", "description": "Printed official e-Visa approval letter from visas.immigration.go.ug", "category": "visa", "guidanceNote": "Do not use third-party visa sites. Only visas.immigration.go.ug is official."}, "verification": {"status": "pending", "verifiedAt": null, "note": "Awaiting official verification"}}'::jsonb,'published',u.id,NOW(),1 FROM public.pt_auth_users u WHERE u.email_normalized='system@pearltravel.invalid' ON CONFLICT (code) DO NOTHING;
INSERT INTO public.pt_admin_requirements (code,category,title,summary,simple_explanation,applicable_condition,official_source,mandatory,rule_metadata,workflow_status,author_id,published_at,version) SELECT 'req-visa-eatv','visa','East Africa Tourist Visa (Uganda, Rwanda, Kenya)','Joint multi-entry visa across 3 East African partner states.','Because you plan to travel across Uganda and neighbouring countries, apply for the East Africa Tourist Visa through the immigration authority of the first country you enter.','Multi-destination East Africa travel.','Uganda Immigration e-Visa Portal (visas.immigration.go.ug)',TRUE,'{"order": 20, "when": {"nationalityGroups": ["visa_required"], "excludePurposes": ["transit"], "destinationKeywords": ["multi-country"]}, "checklist": {"id": "doc-visa", "title": "East Africa Tourist Visa", "description": "Approved joint visa for Uganda, Kenya and Rwanda", "category": "visa", "guidanceNote": "Apply through the first country you enter."}, "verification": {"status": "pending", "verifiedAt": null, "note": "Awaiting official verification"}}'::jsonb,'published',u.id,NOW(),1 FROM public.pt_auth_users u WHERE u.email_normalized='system@pearltravel.invalid' ON CONFLICT (code) DO NOTHING;
INSERT INTO public.pt_admin_requirements (code,category,title,summary,simple_explanation,applicable_condition,official_source,mandatory,rule_metadata,workflow_status,author_id,published_at,version) SELECT 'req-visa-transit','visa','Transit Visa for Passing Through Uganda','A short transit visa applies when you pass through Uganda to another country.','If you only pass through Uganda on a direct overland route you need a transit visa, and proof that you can enter your next country.','Visa-required nationals travelling in transit.','DCIC Border Management Directorate',TRUE,'{"order": 20, "when": {"nationalityGroups": ["visa_required"], "purposes": ["transit"]}, "checklist": {"id": "doc-visa", "title": "Uganda Transit Visa", "description": "Transit visa for a direct overland route", "category": "visa", "guidanceNote": "Confirm the current fee and allowed days on the official portal."}, "verification": {"status": "pending", "verifiedAt": null, "note": "Awaiting official verification"}}'::jsonb,'published',u.id,NOW(),1 FROM public.pt_auth_users u WHERE u.email_normalized='system@pearltravel.invalid' ON CONFLICT (code) DO NOTHING;
INSERT INTO public.pt_admin_requirements (code,category,title,summary,simple_explanation,applicable_condition,official_source,mandatory,rule_metadata,workflow_status,author_id,published_at,version) SELECT 'req-yellow-fever','health','Yellow Fever Vaccination Certificate (Strictly Mandatory)','Mandatory for all arrivals aged 1 year and above.','Port Health officers inspect the yellow card before you reach immigration. The vaccine must have been given at least 10 days before arrival.','Strict requirement for all travelers entering Uganda.','Ministry of Health Uganda & WHO Guidelines',TRUE,'{"order": 30, "when": {}, "checklist": {"id": "doc-yellow-fever", "title": "Yellow Fever Vaccination Yellow Card", "description": "Official WHO International Certificate of Vaccination or Prophylaxis.", "category": "health", "guidanceNote": "Must be given at least 10 days before arrival. Checked by Port Health before immigration."}, "verification": {"status": "pending", "verifiedAt": null, "note": "Awaiting official verification"}}'::jsonb,'published',u.id,NOW(),1 FROM public.pt_auth_users u WHERE u.email_normalized='system@pearltravel.invalid' ON CONFLICT (code) DO NOTHING;
INSERT INTO public.pt_admin_requirements (code,category,title,summary,simple_explanation,applicable_condition,official_source,mandatory,rule_metadata,workflow_status,author_id,published_at,version) SELECT 'req-return-ticket','entry','Confirmed Return or Onward Ticket','Proof of departure within the authorised stay.','Border officers may ask for proof that you will leave Uganda within your permitted stay.','Mandatory for non-residents and visitors.','Port Immigration',TRUE,'{"order": 40, "when": {"excludeNationalityGroups": ["citizen"], "excludeTravellerTypes": ["resident"], "excludePurposes": ["transit"]}, "checklist": {"id": "doc-return-ticket", "title": "Confirmed Return / Onward Itinerary", "description": "Proof of travel leaving Uganda within your authorised stay.", "category": "travel", "guidanceNote": "A phone e-ticket or a printout is accepted."}, "verification": {"status": "pending", "verifiedAt": null, "note": "Awaiting official verification"}}'::jsonb,'published',u.id,NOW(),1 FROM public.pt_auth_users u WHERE u.email_normalized='system@pearltravel.invalid' ON CONFLICT (code) DO NOTHING;
INSERT INTO public.pt_admin_requirements (code,category,title,summary,simple_explanation,applicable_condition,official_source,mandatory,rule_metadata,workflow_status,author_id,published_at,version) SELECT 'req-accommodation','entry','Accommodation Booking or Local Host Details','Hotel confirmation, lodge reservation, or host address.','You will be asked for the address and phone number of where you will stay in Uganda.','Required on the arrival card.','Uganda Tourism Board & DCIC',TRUE,'{"order": 50, "when": {"excludePurposes": ["transit"]}, "checklist": {"id": "doc-accommodation", "title": "Proof of Accommodation / Booking", "description": "Hotel voucher, booking confirmation, or signed host invitation with a phone number.", "category": "supporting", "guidanceNote": "Needed to complete the entry card."}, "verification": {"status": "pending", "verifiedAt": null, "note": "Awaiting official verification"}}'::jsonb,'published',u.id,NOW(),1 FROM public.pt_auth_users u WHERE u.email_normalized='system@pearltravel.invalid' ON CONFLICT (code) DO NOTHING;
INSERT INTO public.pt_admin_requirements (code,category,title,summary,simple_explanation,applicable_condition,official_source,mandatory,rule_metadata,workflow_status,author_id,published_at,version) SELECT 'req-wildlife-permit','entry','Uganda Wildlife Authority (UWA) Tracking Permit','Required for gorilla trekking in Bwindi / chimpanzees in Kibale.','Permits are booked in advance through UWA or a licensed tour operator. Rangers check the voucher at the park gate.','Visiting Bwindi, Mgahinga or Kibale National Parks.','Uganda Wildlife Authority (UWA)',TRUE,'{"order": 60, "when": {"destinationKeywords": ["Bwindi", "Kibale"]}, "checklist": {"id": "doc-wildlife-permit", "title": "UWA Gorilla / Chimpanzee Trekking Permit", "description": "Official Uganda Wildlife Authority tracking voucher.", "category": "travel", "guidanceNote": "Show it at the park briefing centre."}, "verification": {"status": "pending", "verifiedAt": null, "note": "Awaiting official verification"}}'::jsonb,'published',u.id,NOW(),1 FROM public.pt_auth_users u WHERE u.email_normalized='system@pearltravel.invalid' ON CONFLICT (code) DO NOTHING;
INSERT INTO public.pt_admin_requirements (code,category,title,summary,simple_explanation,applicable_condition,official_source,mandatory,rule_metadata,workflow_status,author_id,published_at,version) SELECT 'req-travel-insurance','health','Travel Medical & Emergency Evacuation Cover','Strongly recommended, especially for safaris.','Not checked at immigration, but cover that includes medical evacuation is strongly advised for remote areas.','Recommended for all travelers.','Pearl Travel Traveller Advisory',FALSE,'{"order": 70, "when": {}, "checklist": {"id": "doc-travel-insurance", "title": "Travel & Medical Insurance", "description": "Includes emergency treatment and evacuation.", "category": "travel", "guidanceNote": "Recommended for safaris and remote parks."}, "verification": {"status": "pending", "verifiedAt": null, "note": "Awaiting official verification"}}'::jsonb,'published',u.id,NOW(),1 FROM public.pt_auth_users u WHERE u.email_normalized='system@pearltravel.invalid' ON CONFLICT (code) DO NOTHING;
INSERT INTO public.pt_admin_requirements (code,category,title,summary,simple_explanation,applicable_condition,official_source,mandatory,rule_metadata,workflow_status,author_id,published_at,version) SELECT 'req-malaba-osbp','entry','Joint Immigration Clearance at Malaba One-Stop Border Post (OSBP)','Kenya-Uganda joint clearance in one terminal.','Under the EAC OSBP arrangement you stop once on the Ugandan side. Paired immigration and health officers process your exit and entry together.','Crossing at Malaba OSBP.','EAC OSBP Secretariat & DCIC',TRUE,'{"order": 80, "when": {"borderPoints": ["Malaba"]}, "checklist": null, "verification": {"status": "pending", "verifiedAt": null, "note": "Awaiting official verification"}}'::jsonb,'published',u.id,NOW(),1 FROM public.pt_auth_users u WHERE u.email_normalized='system@pearltravel.invalid' ON CONFLICT (code) DO NOTHING;
INSERT INTO public.pt_admin_requirements (code,category,title,summary,simple_explanation,applicable_condition,official_source,mandatory,rule_metadata,workflow_status,author_id,published_at,version) SELECT 'req-road-vehicle-clearance','customs','Cross-Border Vehicle Clearance & COMESA Insurance','Required for cars, tour vehicles and trucks crossing by road.','Drivers carry the original logbook and COMESA Yellow Card insurance and obtain a URA Temporary Movement Permit (Form C32).','Overland road travel.','Uganda Revenue Authority (URA) Customs',TRUE,'{"order": 90, "when": {"travelModes": ["road"]}, "checklist": null, "verification": {"status": "pending", "verifiedAt": null, "note": "Awaiting official verification"}}'::jsonb,'published',u.id,NOW(),1 FROM public.pt_auth_users u WHERE u.email_normalized='system@pearltravel.invalid' ON CONFLICT (code) DO NOTHING;
INSERT INTO public.pt_admin_requirements (code,category,title,summary,simple_explanation,applicable_condition,official_source,mandatory,rule_metadata,workflow_status,author_id,published_at,version) SELECT 'req-exit-customs','exit','Exit Inspection & Souvenir Customs Clearance','Security screening and wildlife-product clearance on departure.','Allow time for clearance when leaving. Exporting protected wildlife products, untreated seeds or minerals without permits is prohibited.','Departure from Uganda.','Uganda Revenue Authority (URA Customs)',TRUE,'{"order": 100, "when": {}, "checklist": null, "verification": {"status": "pending", "verifiedAt": null, "note": "Awaiting official verification"}}'::jsonb,'published',u.id,NOW(),1 FROM public.pt_auth_users u WHERE u.email_normalized='system@pearltravel.invalid' ON CONFLICT (code) DO NOTHING;
INSERT INTO public.pt_admin_requirements (code,category,title,summary,simple_explanation,applicable_condition,official_source,mandatory,rule_metadata,workflow_status,author_id,published_at,version) SELECT 'req-purpose-business','entry','Business Visit: Invitation or Host Company Letter','Often requested for business visits.','Carry a letter from the company or organisation you are visiting, with contact details, in case officers ask about the purpose of your trip.','Travelling for business.','Seeded from prototype guidance; to be verified with DCIC',FALSE,'{"order": 110, "when": {"purposes": ["business"], "excludeNationalityGroups": ["citizen"]}, "checklist": {"id": "doc-purpose-business", "title": "Business Invitation / Host Company Letter", "description": "Letter from the host company or organisation with contact details.", "category": "supporting", "guidanceNote": "Keep a printed copy."}, "verification": {"status": "pending", "verifiedAt": null, "note": "Awaiting official verification"}}'::jsonb,'published',u.id,NOW(),1 FROM public.pt_auth_users u WHERE u.email_normalized='system@pearltravel.invalid' ON CONFLICT (code) DO NOTHING;
INSERT INTO public.pt_admin_requirements (code,category,title,summary,simple_explanation,applicable_condition,official_source,mandatory,rule_metadata,workflow_status,author_id,published_at,version) SELECT 'req-purpose-studies','entry','Study: Admission Letter','Proof that you are joining a school or programme.','Carry the admission or enrolment letter from your institution. Long stays may need a student pass; check with the institution and DCIC.','Travelling to study.','Seeded from prototype guidance; to be verified with DCIC',FALSE,'{"order": 110, "when": {"purposes": ["studies"], "excludeNationalityGroups": ["citizen"]}, "checklist": {"id": "doc-purpose-studies", "title": "Admission / Enrolment Letter", "description": "Letter from your school, university or programme.", "category": "supporting", "guidanceNote": "Ask the institution about a student pass for long stays."}, "verification": {"status": "pending", "verifiedAt": null, "note": "Awaiting official verification"}}'::jsonb,'published',u.id,NOW(),1 FROM public.pt_auth_users u WHERE u.email_normalized='system@pearltravel.invalid' ON CONFLICT (code) DO NOTHING;
INSERT INTO public.pt_admin_requirements (code,category,title,summary,simple_explanation,applicable_condition,official_source,mandatory,rule_metadata,workflow_status,author_id,published_at,version) SELECT 'req-purpose-family','entry','Family Visit: Host Invitation and Contact Details','Details of the relative you are visiting.','Carry your host''s name, address and phone number, and an invitation letter if possible.','Visiting family or friends.','Seeded from prototype guidance; to be verified with DCIC',FALSE,'{"order": 110, "when": {"purposes": ["family"], "excludeNationalityGroups": ["citizen"]}, "checklist": {"id": "doc-purpose-family", "title": "Host Invitation and Contact Details", "description": "Host name, address, phone number and an invitation letter if available.", "category": "supporting", "guidanceNote": "Keep the host reachable by phone on arrival day."}, "verification": {"status": "pending", "verifiedAt": null, "note": "Awaiting official verification"}}'::jsonb,'published',u.id,NOW(),1 FROM public.pt_auth_users u WHERE u.email_normalized='system@pearltravel.invalid' ON CONFLICT (code) DO NOTHING;
INSERT INTO public.pt_admin_requirements (code,category,title,summary,simple_explanation,applicable_condition,official_source,mandatory,rule_metadata,workflow_status,author_id,published_at,version) SELECT 'req-purpose-transit','entry','Transit: Entry Permission for Your Next Country','You must be able to enter the country you are travelling to.','When passing through Uganda, carry a valid visa, residence permit or proof of citizenship for your final destination.','Travelling in transit through Uganda.','Seeded from prototype guidance (DCIC Border Management); to be verified',TRUE,'{"order": 110, "when": {"purposes": ["transit"]}, "checklist": {"id": "doc-purpose-transit", "title": "Entry Permission for Next Country", "description": "Visa, residence permit or proof of citizenship for your final destination.", "category": "travel", "guidanceNote": "Officers may ask to see it."}, "verification": {"status": "pending", "verifiedAt": null, "note": "Awaiting official verification"}}'::jsonb,'published',u.id,NOW(),1 FROM public.pt_auth_users u WHERE u.email_normalized='system@pearltravel.invalid' ON CONFLICT (code) DO NOTHING;
INSERT INTO public.pt_admin_requirements (code,category,title,summary,simple_explanation,applicable_condition,official_source,mandatory,rule_metadata,workflow_status,author_id,published_at,version) SELECT 'req-purpose-employment','entry','Work or Assignment: Permit or Employer Letter','Proof of your work assignment in Uganda.','Carry your work permit, or a letter from your employer or organisation describing your assignment and its length.','Travelling for work, an NGO assignment or a posting.','Seeded from prototype guidance; to be verified with DCIC',FALSE,'{"order": 110, "when": {"purposes": ["employment"], "excludeNationalityGroups": ["citizen"]}, "checklist": {"id": "doc-purpose-employment", "title": "Work Permit / Employer Letter", "description": "Work permit, or a letter from your employer about your assignment.", "category": "supporting", "guidanceNote": "Ask your employer which permit applies to your role."}, "verification": {"status": "pending", "verifiedAt": null, "note": "Awaiting official verification"}}'::jsonb,'published',u.id,NOW(),1 FROM public.pt_auth_users u WHERE u.email_normalized='system@pearltravel.invalid' ON CONFLICT (code) DO NOTHING;

-- Seed: knowledge-base articles (reviewed guidance) so the RAG assistant retrieves from governed content.
INSERT INTO public.pt_admin_content_items (slug,content_type,category,title,summary,body,official_authority,keywords,workflow_status,author_id,published_at,submitted_at,version) SELECT 'kb-malaba-osbp-clearing','guidance','border_post','Malaba One-Stop Border Post (OSBP) Operating Procedures','Joint border clearance between Kenya & Uganda under EAC OSBP bilateral protocol.','The Malaba One-Stop Border Post operates 24 hours a day, 7 days a week for both passenger and cargo traffic. Under the East African Community OSBP framework, travelers entering Uganda only stop ONCE on the Ugandan side of the border post. 

Clearing Sequence:
1. Port Health Sanitation & Thermal Screening (Yellow Fever certificate check).
2. Exit clearance from Kenya and Entry clearance into Uganda handled jointly by paired immigration officers.
3. Biometric fingerprint scan and passport stamping.
4. Uganda Revenue Authority (URA) luggage scanning and customs inspection.

For passengers traveling on cross-border passenger buses (e.g. Mash POA, Modern Coast, Tahmeed), buses park in designated passenger bays, and conductors guide all travelers into the terminal together.','Directorate of Citizenship & Immigration Control (DCIC) & EAC OSBP Secretariat',ARRAY['malaba','osbp','border','clearance','kenya','uganda','hours','bus','procedure','sequence']::text[],'published',u.id,NOW(),NULL,1 FROM public.pt_auth_users u WHERE u.email_normalized='system@pearltravel.invalid' ON CONFLICT (slug) DO NOTHING;
INSERT INTO public.pt_admin_content_items (slug,content_type,category,title,summary,body,official_authority,keywords,workflow_status,author_id,published_at,submitted_at,version) SELECT 'kb-yellow-fever','guidance','health','Yellow Fever Vaccination & International Certificate (Yellow Card)','Universal mandatory requirement for all travelers entering Uganda aged 9 months and older.','Yellow Fever vaccination is mandatory for all inbound international travelers arriving by air, road, rail, or water into the Republic of Uganda, regardless of their country of origin.

Key Rules:
• The vaccine must have been administered at least 10 days before arrival to allow protective immunity to develop.
• The official WHO International Certificate of Vaccination or Prophylaxis (Yellow Card) must be physically presented to Port Health officers before reaching immigration counters.
• If you cannot receive the vaccine due to medical contraindications (e.g., severe egg allergy, thymectomy, immunosuppression), an official medical exemption letter signed and stamped by an authorized health authority must be produced.
• Failure to produce a valid card may result in mandatory vaccination at the border clinic for a prescribed fee or denied entry.','Ministry of Health Uganda (Directorate of Public Health & Port Health)',ARRAY['yellow fever','vaccine','card','health','shot','medical','exemption','port health','mandatory']::text[],'published',u.id,NOW(),NULL,1 FROM public.pt_auth_users u WHERE u.email_normalized='system@pearltravel.invalid' ON CONFLICT (slug) DO NOTHING;
INSERT INTO public.pt_admin_content_items (slug,content_type,category,title,summary,body,official_authority,keywords,workflow_status,author_id,published_at,submitted_at,version) SELECT 'kb-eac-free-movement','guidance','immigration','East African Community (EAC) Citizens & Visa Exemptions','Visa-free entry for EAC partner states: Kenya, Tanzania, Rwanda, Burundi, South Sudan, DRC, Somalia.','Citizens of East African Community (EAC) member states enjoy reciprocal visa-free entry into Uganda for visits of up to 6 months (renewable upon application).

Eligible Nationalities:
Kenya, Tanzania, Rwanda, Burundi, South Sudan, Democratic Republic of Congo (DRC), and Somalia.

Travel Documents Accepted:
• Biometric National Passports.
• EAC Machine-Readable National Identity Cards (applicable for citizens of Kenya and Rwanda traveling between Uganda, Kenya, and Rwanda under the Northern Corridor Integration Projects agreement).
• EAC Interstate Passes issued at border points.

Note: While visa-exempt, EAC citizens must still clear Port Health (Yellow Fever) and obtain an official entry stamp at immigration counters.','EAC Secretariat & Uganda Immigration Control Act',ARRAY['eac','kenya','rwanda','tanzania','national id','free pass','visa exempt','east africa','citizen']::text[],'published',u.id,NOW(),NULL,1 FROM public.pt_auth_users u WHERE u.email_normalized='system@pearltravel.invalid' ON CONFLICT (slug) DO NOTHING;
INSERT INTO public.pt_admin_content_items (slug,content_type,category,title,summary,body,official_authority,keywords,workflow_status,author_id,published_at,submitted_at,version) SELECT 'kb-evisa-application','guidance','immigration','Electronic Visa (eVisa) Rules for International Visitors','Mandatory online application prior to departure for visa-required foreign nationals.','Uganda discontinued visa-on-arrival in favor of the Electronic Visa system. All travelers requiring a visa must apply online prior to travel via the official portal: https://visas.immigration.go.ug.

Important Guidelines:
• Single Entry Tourist/Visitor Visa: $50 USD fee, valid for up to 90 days.
• East Africa Tourist Visa: $100 USD fee, allows multi-entry travel between Uganda, Kenya, and Rwanda for up to 90 days (provided travel begins in the issuing country).
• Approval Letter: Upon approval, download and print the Electronic Visa Approval Letter featuring the QR barcode. Immigration officers at border posts (such as Malaba OSBP or Entebbe Airport) will scan this barcode to print your physical visa sticker into your passport.
• Warning: Only use the official ''.go.ug'' portal. Unofficial third-party websites charge exorbitant handling fees and often issue fraudulent approvals.','Uganda Directorate of Citizenship & Immigration Control (DCIC)',ARRAY['visa','evisa','cost','fee','apply','approval','letter','tourist','east africa visa','online']::text[],'published',u.id,NOW(),NULL,1 FROM public.pt_auth_users u WHERE u.email_normalized='system@pearltravel.invalid' ON CONFLICT (slug) DO NOTHING;
INSERT INTO public.pt_admin_content_items (slug,content_type,category,title,summary,body,official_authority,keywords,workflow_status,author_id,published_at,submitted_at,version) SELECT 'kb-road-vehicle-clearance','guidance','transport','Cross-Border Vehicle Clearance & COMESA Insurance (Malaba OSBP)','Requirements for driving a foreign-registered private or commercial vehicle into Uganda.','When driving across the Malaba border in a personal or commercial vehicle, drivers must present the following vehicle documentation to URA Customs:

1. Original Vehicle Registration Logbook (or certified copy if under bank financing, accompanied by a bank permission letter).
2. Valid Driving License recognized in the EAC.
3. Power of Attorney or Authorization Letter if the vehicle is not registered in the driver''s name.
4. COMESA Yellow Card Insurance (third-party cross-border motor liability insurance). Can be purchased beforehand or at border agencies in Malaba town.
5. Temporary Movement Permit (TMP / Form C32): Issued by URA Customs at Malaba OSBP for a fee of approximately 20,000 UGX (~$5.50 USD), allowing foreign private vehicles up to 14 days in Uganda.','Uganda Revenue Authority (URA) Customs Department',ARRAY['car','vehicle','drive','driving','logbook','comesa','yellow card','tmp','permit','road','insurance']::text[],'published',u.id,NOW(),NULL,1 FROM public.pt_auth_users u WHERE u.email_normalized='system@pearltravel.invalid' ON CONFLICT (slug) DO NOTHING;
INSERT INTO public.pt_admin_content_items (slug,content_type,category,title,summary,body,official_authority,keywords,workflow_status,author_id,published_at,submitted_at,version) SELECT 'kb-customs-allowances','guidance','customs','URA Customs Duty Allowances & Currency Declarations','Duty-free personal baggage thresholds, currency limits, and restricted items.','Uganda Revenue Authority enforces strict baggage allowances and trade compliance at land border posts:

Duty-Free Allowances:
• Used personal clothing, toilet requisites, and travel gear for personal use.
• Up to 200 cigarettes or 50 cigars or 250g of tobacco.
• Up to 1 litre of spirits or 2 litres of wine.
• Up to 500ml of perfume/eau de toilette.

Currency Regulations:
Travelers carrying cash or negotiable monetary instruments exceeding $10,000 USD (or equivalent in foreign currency) must declare this to URA Customs on arrival using the official Cash Declaration Form. There are no limits on total funds, provided they are declared.

Prohibited / Restricted Goods:
• Drones: Civilian drones are strictly prohibited unless prior written authorization is secured from the Ministry of Defence and Civil Aviation Authority.
• Single-use plastic bags (kaveera): Banned under environmental statutes.
• Firearm or ammunition: Require specialized diplomatic and police permits.','Uganda Revenue Authority (Customs Division)',ARRAY['customs','duty','allowance','cash','money','currency','declare','drone','alcohol','cigarette']::text[],'published',u.id,NOW(),NULL,1 FROM public.pt_auth_users u WHERE u.email_normalized='system@pearltravel.invalid' ON CONFLICT (slug) DO NOTHING;
INSERT INTO public.pt_admin_content_items (slug,content_type,category,title,summary,body,official_authority,keywords,workflow_status,author_id,published_at,submitted_at,version) SELECT 'kb-transit-rules','guidance','immigration','Transit Through Uganda to Rwanda, DRC, or South Sudan','Guidelines for travelers connecting overland through Uganda to neighboring countries.','Travelers entering Uganda at Malaba OSBP with the intention of immediately proceeding to Rwanda (via Katuna/Cyanika), Democratic Republic of Congo (via Bunagana/Mpondwe), or South Sudan (via Elegu):

• Transit Visa: Costs $50 USD and allows a stay of up to 7 days for passengers passing through Uganda on a direct overland route.
• Proof of Entry for Next Country: You must provide a valid visa, resident permit, or proof of citizenship for the destination country.
• Vehicle Transit: Transiting commercial cargo or foreign vehicles must register on the regional electronic cargo tracking system (RECTS) or obtain designated transit seals from URA Customs at Malaba.','DCIC Border Management Directorate',ARRAY['transit','rwanda','drc','south sudan','congo','route','7 days','overland']::text[],'published',u.id,NOW(),NULL,1 FROM public.pt_auth_users u WHERE u.email_normalized='system@pearltravel.invalid' ON CONFLICT (slug) DO NOTHING;
INSERT INTO public.pt_admin_content_items (slug,content_type,category,title,summary,body,official_authority,keywords,workflow_status,author_id,published_at,submitted_at,version) SELECT 'kb-land-border-general','guidance','border_post','Crossing Any Uganda Land Border: Step by Step','The same core steps apply at every Uganda land crossing, whichever neighbouring country you come from.','Whichever land border you use, expect these steps in roughly this order:

1. Exit formalities with the country you are leaving (passport stamp or exit record).
2. Port Health screening: present your WHO Yellow Fever card and expect a temperature check.
3. Uganda immigration: show your passport and your eVisa approval letter if you need a visa. Fingerprints and a photo are taken.
4. Customs (URA): declare goods for sale and any cash above USD 10,000, and have bags scanned if asked.
5. Vehicles only: present registration, driving licence, insurance and the temporary movement permit.

Good practice:
• Keep every document together, in originals, in one easy-to-reach pouch.
• Complete all formalities at the official post only. Informal crossing points are illegal and unsafe.
• Pay official fees only at official counters and keep the receipt. No payment is needed to speed up clearance.
• Check your entry stamp before leaving the counter: it shows how long you may stay.
• Opening hours: busy posts generally run extended or round-the-clock operations, smaller crossings may close in the evening. Hours can change, so confirm before you travel.','Compiled from public DCIC, URA and EAC guidance — confirm on official channels before travel',ARRAY['crossing','land border','entry point','entry points','steps to cross','any border','all borders','border posts','how to cross','hours','opening hours','open','close','receipt','bribe','informal','panya','cross any','queue','skip the queue','speed up','pay someone','unofficial payment','payment','fees']::text[],'pending_review',u.id,NULL,NOW(),1 FROM public.pt_auth_users u WHERE u.email_normalized='system@pearltravel.invalid' ON CONFLICT (slug) DO NOTHING;
INSERT INTO public.pt_admin_content_items (slug,content_type,category,title,summary,body,official_authority,keywords,workflow_status,author_id,published_at,submitted_at,version) SELECT 'kb-border-list','guidance','border_post','Main Border Crossings Into Uganda','Where you can enter Uganda by land or air, grouped by neighbouring country.','Uganda borders five countries. Main entry points:

• Kenya: Malaba and Busia (the busiest), plus Lwakhakha and Suam in the east.
• Tanzania: Mutukula (on the Masaka to Bukoba road) and Kikagati/Murongo.
• Rwanda: Katuna (Gatuna), Cyanika near Kisoro, and Mirama Hills (Kagitumba).
• Democratic Republic of Congo: Mpondwe (Kasindi), Bunagana, Goli and Vurra.
• South Sudan: Elegu (Nimule) and Oraba.
• By air: Entebbe International Airport.

Uganda has no direct border with Burundi, so travellers from Burundi usually route through Rwanda or Tanzania.

The Pearl Travel journey planner currently covers Malaba, Busia, Entebbe, Katuna, Mutukula and Elegu. The core rules for visas, Yellow Fever and customs are the same at all of them.','Compiled from public DCIC, URA and EAC guidance — confirm on official channels before travel',ARRAY['borders','list of borders','which borders','neighbouring','neighboring','neighbour','neighbors','entry points','main crossings','border points','where can i enter','burundi border','all crossings','which border crossings','crossings can i use','border crossings','which crossing','burundi','does uganda border']::text[],'pending_review',u.id,NULL,NOW(),1 FROM public.pt_auth_users u WHERE u.email_normalized='system@pearltravel.invalid' ON CONFLICT (slug) DO NOTHING;
INSERT INTO public.pt_admin_content_items (slug,content_type,category,title,summary,body,official_authority,keywords,workflow_status,author_id,published_at,submitted_at,version) SELECT 'kb-busia','guidance','border_post','Busia Border (Kenya – Uganda)','A major Kenya–Uganda crossing used by buses, trucks and private vehicles, with joint clearance like Malaba.','Busia is the second main crossing between Kenya and Uganda, on the route towards Jinja and Kampala.

• It operates as a One-Stop Border Post, so exit from Kenya and entry into Uganda are handled together on one side.
• The documents are the same as at Malaba: passport or EAC ID, a Uganda eVisa if you need one, and your Yellow Fever card.
• Drivers need vehicle registration, a valid licence, COMESA insurance and the temporary movement permit.
• Busia is a busy trading town. Always clear at the official post, never at informal footpaths.
• Opening hours: confirm before you travel. Busy posts generally run extended or round-the-clock operations, but hours can change.','Compiled from public DCIC, URA and EAC guidance — confirm on official channels before travel',ARRAY['busia']::text[],'pending_review',u.id,NULL,NOW(),1 FROM public.pt_auth_users u WHERE u.email_normalized='system@pearltravel.invalid' ON CONFLICT (slug) DO NOTHING;
INSERT INTO public.pt_admin_content_items (slug,content_type,category,title,summary,body,official_authority,keywords,workflow_status,author_id,published_at,submitted_at,version) SELECT 'kb-katuna-rwanda','guidance','border_post','Katuna / Gatuna, Cyanika and Mirama Hills (Rwanda – Uganda)','The main road links between Uganda and Rwanda, used for Kampala–Kigali and gorilla-trekking trips.','Rwanda and Uganda are connected by several crossings:

• Katuna (Uganda side) and Gatuna (Rwanda side): the main Kampala to Kigali road via Mbarara and Kabale, run as a One-Stop Border Post.
• Cyanika, near Kisoro: popular with gorilla-trekking visitors.
• Mirama Hills and Kagitumba: in the east, on the route to northern Rwanda.

What to know:
• Rwandan and Ugandan citizens may travel with a valid national ID card under EAC arrangements.
• Visitors who need a visa can use the East Africa Tourist Visa, which covers Uganda, Kenya and Rwanda, provided the trip starts in the country that issued it.
• You will need your Yellow Fever card when entering Uganda.
• This border has been closed or restricted in the past, so check its current status before you travel.','Compiled from public DCIC, URA and EAC guidance — confirm on official channels before travel',ARRAY['katuna','gatuna','cyanika','kisoro','mirama','kagitumba','kigali','rwanda border','gorilla','from rwanda','to rwanda','into rwanda']::text[],'pending_review',u.id,NULL,NOW(),1 FROM public.pt_auth_users u WHERE u.email_normalized='system@pearltravel.invalid' ON CONFLICT (slug) DO NOTHING;
INSERT INTO public.pt_admin_content_items (slug,content_type,category,title,summary,body,official_authority,keywords,workflow_status,author_id,published_at,submitted_at,version) SELECT 'kb-mutukula-tanzania','guidance','border_post','Mutukula and Kikagati (Tanzania – Uganda)','The main road crossings between Tanzania and Uganda, including the Masaka to Bukoba route.','Tanzania and Uganda connect mainly at:

• Mutukula, on the road between Masaka and Bukoba, run as a One-Stop Border Post.
• Kikagati/Murongo, in the south-west.

What to know:
• Tanzanian citizens are EAC citizens and enjoy visa-free entry with a valid passport or accepted EAC document.
• Other visitors need a Uganda eVisa unless exempt.
• Carry your Yellow Fever card, as at every Uganda border.
• Vehicles need registration, a valid licence, COMESA insurance and the temporary movement permit.
• Opening hours: confirm before you travel, as hours at smaller posts can change.','Compiled from public DCIC, URA and EAC guidance — confirm on official channels before travel',ARRAY['mutukula','kikagati','murongo','tanzania border','bukoba','masaka','tanzanian','from tanzania','to tanzania','into tanzania']::text[],'pending_review',u.id,NULL,NOW(),1 FROM public.pt_auth_users u WHERE u.email_normalized='system@pearltravel.invalid' ON CONFLICT (slug) DO NOTHING;
INSERT INTO public.pt_admin_content_items (slug,content_type,category,title,summary,body,official_authority,keywords,workflow_status,author_id,published_at,submitted_at,version) SELECT 'kb-elegu-south-sudan','guidance','border_post','Elegu / Nimule and Oraba (South Sudan – Uganda)','The main crossings between South Sudan and northern Uganda, on the Gulu to Juba route.','South Sudan and Uganda connect mainly at:

• Elegu (Uganda) and Nimule (South Sudan): the main road from Gulu towards Juba.
• Oraba, in the north-west near Koboko.

What to know:
• South Sudan is an EAC member, so South Sudanese citizens travel visa-free with accepted travel documents.
• Other nationals need a Uganda eVisa if required, and must arrange any South Sudan visa separately.
• Yellow Fever vaccination proof is required for entry into Uganda.
• Trucks and cargo have additional transit and tracking requirements handled by URA Customs.
• Check current travel advisories and road conditions before you set out.','Compiled from public DCIC, URA and EAC guidance — confirm on official channels before travel',ARRAY['elegu','nimule','oraba','juba','gulu','koboko','south sudan border','south sudanese','from south sudan','to south sudan','into south sudan']::text[],'pending_review',u.id,NULL,NOW(),1 FROM public.pt_auth_users u WHERE u.email_normalized='system@pearltravel.invalid' ON CONFLICT (slug) DO NOTHING;
INSERT INTO public.pt_admin_content_items (slug,content_type,category,title,summary,body,official_authority,keywords,workflow_status,author_id,published_at,submitted_at,version) SELECT 'kb-drc-borders','guidance','border_post','DRC Crossings: Mpondwe, Bunagana, Goli and Vurra','Land crossings between the Democratic Republic of Congo and western or north-western Uganda.','The main crossings with the Democratic Republic of Congo are:

• Mpondwe (Kasese district), opposite Kasindi in the DRC.
• Bunagana, near Kisoro.
• Goli and Vurra, in the north-west.

What to know:
• Congolese citizens are EAC citizens and travel visa-free with accepted documents.
• Other visitors need a Uganda eVisa if required, and a DRC visa arranged separately.
• Carry your Yellow Fever card. Port Health may apply extra health screening if there is a disease outbreak.
• Conditions at some DRC crossings have changed because of security concerns or closures. Check your embassy''s travel advice and confirm the crossing is open before you travel.','Compiled from public DCIC, URA and EAC guidance — confirm on official channels before travel',ARRAY['mpondwe','kasindi','bunagana','goli','vurra','drc border','congo border','kasese','congolese','from congo','to congo','from drc','to drc','into congo']::text[],'pending_review',u.id,NULL,NOW(),1 FROM public.pt_auth_users u WHERE u.email_normalized='system@pearltravel.invalid' ON CONFLICT (slug) DO NOTHING;
INSERT INTO public.pt_admin_content_items (slug,content_type,category,title,summary,body,official_authority,keywords,workflow_status,author_id,published_at,submitted_at,version) SELECT 'kb-entebbe-airport','guidance','border_post','Arriving at Entebbe International Airport','What happens when you arrive in Uganda by air, and what to have ready.','When you land at Entebbe International Airport:

1. Port Health: show your WHO Yellow Fever card at the health desk.
2. Immigration: present your passport and your printed eVisa approval letter if you need a visa. Fingerprints and a photo are taken.
3. Baggage claim, then customs: declare goods and any cash above USD 10,000.

Tips:
• Have your approval letter, passport, Yellow Fever card and accommodation details together before you reach the counters.
• Keep your onward or return ticket available, as officers may ask for it.
• For departures, arrive early for international flights and keep your boarding documents ready.','Compiled from public DCIC, URA and EAC guidance — confirm on official channels before travel',ARRAY['entebbe','airport','flight','fly','flying','plane','eia','arrive by air','air travel']::text[],'pending_review',u.id,NULL,NOW(),1 FROM public.pt_auth_users u WHERE u.email_normalized='system@pearltravel.invalid' ON CONFLICT (slug) DO NOTHING;
INSERT INTO public.pt_admin_content_items (slug,content_type,category,title,summary,body,official_authority,keywords,workflow_status,author_id,published_at,submitted_at,version) SELECT 'kb-minors','guidance','immigration','Travelling With Children','Documents commonly requested when a child crosses the border.','Officers may ask for proof of the relationship between an adult and a child:

• A passport or accepted travel document for the child.
• The child''s birth certificate.
• If the child travels without both parents, a signed letter of consent from the absent parent or parents, ideally with a copy of their ID.
• If travelling with a guardian or school group, a letter from the legal guardian or school.
• The child''s Yellow Fever card, if vaccination is required for their age.

Airlines have their own rules for unaccompanied minors, so check with your airline.','Compiled from public DCIC, URA and EAC guidance — confirm on official channels before travel',ARRAY['child','children','kid','kids','minor','minors','baby','infant','son','daughter','family trip','birth certificate','consent letter']::text[],'pending_review',u.id,NULL,NOW(),1 FROM public.pt_auth_users u WHERE u.email_normalized='system@pearltravel.invalid' ON CONFLICT (slug) DO NOTHING;
INSERT INTO public.pt_admin_content_items (slug,content_type,category,title,summary,body,official_authority,keywords,workflow_status,author_id,published_at,submitted_at,version) SELECT 'kb-problems-border','guidance','immigration','Overstaying, Lost Documents and Problems at the Border','What to do if your stay is running out, your passport is lost, or you are refused entry.','• Extending your stay: apply to the Directorate of Citizenship and Immigration Control (DCIC) before your permitted stay ends. Overstaying can lead to fines or removal.
• Lost or stolen passport: report it to the police and get a report, then contact your embassy for an emergency travel document, and inform DCIC.
• Lost Yellow Fever card: ask the clinic that vaccinated you for a replacement or a certified copy before you travel.
• Refused entry or delays: stay calm, ask for the reason, and contact your embassy or the DCIC if you think the decision is wrong.
• If someone asks for an unofficial payment, decline and report it to the immigration authorities.','Compiled from public DCIC, URA and EAC guidance — confirm on official channels before travel',ARRAY['overstay','overstayed','extend','extension','extend my stay','lost passport','lost my passport','stolen','refused entry','denied entry','deport','deported','fine','fines','embassy','emergency','problem','complaint']::text[],'pending_review',u.id,NULL,NOW(),1 FROM public.pt_auth_users u WHERE u.email_normalized='system@pearltravel.invalid' ON CONFLICT (slug) DO NOTHING;
INSERT INTO public.pt_admin_content_items (slug,content_type,category,title,summary,body,official_authority,keywords,workflow_status,author_id,published_at,submitted_at,version) SELECT 'kb-money-border','guidance','customs','Money and Payments Near the Border','Currency, cash declarations and ways to pay when you cross into Uganda.','• The local currency is the Uganda shilling (UGX). US dollars are widely accepted at many tourist services, but you will need UGX for everyday costs.
• Foreign currency exchange is available at banks and licensed forex bureaus in border towns. Compare rates and avoid street changers.
• Mobile money such as MTN MoMo and Airtel Money is widely used across Uganda, though registering a local SIM may be needed.
• Card machines can be unreliable near borders, so carry some cash in small notes.
• Declare cash or negotiable instruments above USD 10,000 (or equivalent) to URA Customs on arrival.','Compiled from public DCIC, URA and EAC guidance — confirm on official channels before travel',ARRAY['money','exchange','forex','shilling','ugx','currency exchange','mobile money','momo','airtel money','atm','card','dollars','change money','payments']::text[],'pending_review',u.id,NULL,NOW(),1 FROM public.pt_auth_users u WHERE u.email_normalized='system@pearltravel.invalid' ON CONFLICT (slug) DO NOTHING;

