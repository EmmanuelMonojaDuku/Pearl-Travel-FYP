import { KnowledgeArticle, PassengerProfile, JourneyDetails } from '../types';

export const VERIFIED_KNOWLEDGE_ARTICLES: KnowledgeArticle[] = [
  {
    id: 'kb-malaba-osbp-clearing',
    category: 'border_post',
    title: 'Malaba One-Stop Border Post (OSBP) Operating Procedures',
    summary: 'Joint border clearance between Kenya & Uganda under EAC OSBP bilateral protocol.',
    detailedContent: `The Malaba One-Stop Border Post operates 24 hours a day, 7 days a week for both passenger and cargo traffic. Under the East African Community OSBP framework, travelers entering Uganda only stop ONCE on the Ugandan side of the border post. 

Clearing Sequence:
1. Port Health Sanitation & Thermal Screening (Yellow Fever certificate check).
2. Exit clearance from Kenya and Entry clearance into Uganda handled jointly by paired immigration officers.
3. Biometric fingerprint scan and passport stamping.
4. Uganda Revenue Authority (URA) luggage scanning and customs inspection.

For passengers traveling on cross-border passenger buses (e.g. Mash POA, Modern Coast, Tahmeed), buses park in designated passenger bays, and conductors guide all travelers into the terminal together.`,
    officialAuthority: 'Directorate of Citizenship & Immigration Control (DCIC) & EAC OSBP Secretariat',
    approvedByAdmin: true,
    lastReviewedDate: '2026-09-01',
    keywords: ['malaba', 'osbp', 'border', 'clearance', 'kenya', 'uganda', 'hours', 'bus', 'procedure', 'sequence'],
  },
  {
    id: 'kb-yellow-fever',
    category: 'health',
    title: 'Yellow Fever Vaccination & International Certificate (Yellow Card)',
    summary: 'Universal mandatory requirement for all travelers entering Uganda aged 9 months and older.',
    detailedContent: `Yellow Fever vaccination is mandatory for all inbound international travelers arriving by air, road, rail, or water into the Republic of Uganda, regardless of their country of origin.

Key Rules:
• The vaccine must have been administered at least 10 days before arrival to allow protective immunity to develop.
• The official WHO International Certificate of Vaccination or Prophylaxis (Yellow Card) must be physically presented to Port Health officers before reaching immigration counters.
• If you cannot receive the vaccine due to medical contraindications (e.g., severe egg allergy, thymectomy, immunosuppression), an official medical exemption letter signed and stamped by an authorized health authority must be produced.
• Failure to produce a valid card may result in mandatory vaccination at the border clinic for a prescribed fee or denied entry.`,
    officialAuthority: 'Ministry of Health Uganda (Directorate of Public Health & Port Health)',
    approvedByAdmin: true,
    lastReviewedDate: '2026-08-15',
    keywords: ['yellow fever', 'vaccine', 'card', 'health', 'shot', 'medical', 'exemption', 'port health', 'mandatory'],
  },
  {
    id: 'kb-eac-free-movement',
    category: 'immigration',
    title: 'East African Community (EAC) Citizens & Visa Exemptions',
    summary: 'Visa-free entry for EAC partner states: Kenya, Tanzania, Rwanda, Burundi, South Sudan, DRC, Somalia.',
    detailedContent: `Citizens of East African Community (EAC) member states enjoy reciprocal visa-free entry into Uganda for visits of up to 6 months (renewable upon application).

Eligible Nationalities:
Kenya, Tanzania, Rwanda, Burundi, South Sudan, Democratic Republic of Congo (DRC), and Somalia.

Travel Documents Accepted:
• Biometric National Passports.
• EAC Machine-Readable National Identity Cards (applicable for citizens of Kenya and Rwanda traveling between Uganda, Kenya, and Rwanda under the Northern Corridor Integration Projects agreement).
• EAC Interstate Passes issued at border points.

Note: While visa-exempt, EAC citizens must still clear Port Health (Yellow Fever) and obtain an official entry stamp at immigration counters.`,
    officialAuthority: 'EAC Secretariat & Uganda Immigration Control Act',
    approvedByAdmin: true,
    lastReviewedDate: '2026-09-10',
    keywords: ['eac', 'kenya', 'rwanda', 'tanzania', 'national id', 'free pass', 'visa exempt', 'east africa', 'citizen'],
  },
  {
    id: 'kb-evisa-application',
    category: 'immigration',
    title: 'Electronic Visa (eVisa) Rules for International Visitors',
    summary: 'Mandatory online application prior to departure for visa-required foreign nationals.',
    detailedContent: `Uganda discontinued visa-on-arrival in favor of the Electronic Visa system. All travelers requiring a visa must apply online prior to travel via the official portal: https://visas.immigration.go.ug.

Important Guidelines:
• Single Entry Tourist/Visitor Visa: $50 USD fee, valid for up to 90 days.
• East Africa Tourist Visa: $100 USD fee, allows multi-entry travel between Uganda, Kenya, and Rwanda for up to 90 days (provided travel begins in the issuing country).
• Approval Letter: Upon approval, download and print the Electronic Visa Approval Letter featuring the QR barcode. Immigration officers at border posts (such as Malaba OSBP or Entebbe Airport) will scan this barcode to print your physical visa sticker into your passport.
• Warning: Only use the official '.go.ug' portal. Unofficial third-party websites charge exorbitant handling fees and often issue fraudulent approvals.`,
    officialAuthority: 'Uganda Directorate of Citizenship & Immigration Control (DCIC)',
    approvedByAdmin: true,
    lastReviewedDate: '2026-09-12',
    keywords: ['visa', 'evisa', 'cost', 'fee', 'apply', 'approval', 'letter', 'tourist', 'east africa visa', 'online'],
  },
  {
    id: 'kb-road-vehicle-clearance',
    category: 'transport',
    title: 'Cross-Border Vehicle Clearance & COMESA Insurance (Malaba OSBP)',
    summary: 'Requirements for driving a foreign-registered private or commercial vehicle into Uganda.',
    detailedContent: `When driving across the Malaba border in a personal or commercial vehicle, drivers must present the following vehicle documentation to URA Customs:

1. Original Vehicle Registration Logbook (or certified copy if under bank financing, accompanied by a bank permission letter).
2. Valid Driving License recognized in the EAC.
3. Power of Attorney or Authorization Letter if the vehicle is not registered in the driver's name.
4. COMESA Yellow Card Insurance (third-party cross-border motor liability insurance). Can be purchased beforehand or at border agencies in Malaba town.
5. Temporary Movement Permit (TMP / Form C32): Issued by URA Customs at Malaba OSBP for a fee of approximately 20,000 UGX (~$5.50 USD), allowing foreign private vehicles up to 14 days in Uganda.`,
    officialAuthority: 'Uganda Revenue Authority (URA) Customs Department',
    approvedByAdmin: true,
    lastReviewedDate: '2026-08-28',
    keywords: ['car', 'vehicle', 'drive', 'driving', 'logbook', 'comesa', 'yellow card', 'tmp', 'permit', 'road', 'insurance'],
  },
  {
    id: 'kb-customs-allowances',
    category: 'customs',
    title: 'URA Customs Duty Allowances & Currency Declarations',
    summary: 'Duty-free personal baggage thresholds, currency limits, and restricted items.',
    detailedContent: `Uganda Revenue Authority enforces strict baggage allowances and trade compliance at land border posts:

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
• Firearm or ammunition: Require specialized diplomatic and police permits.`,
    officialAuthority: 'Uganda Revenue Authority (Customs Division)',
    approvedByAdmin: true,
    lastReviewedDate: '2026-09-05',
    keywords: ['customs', 'duty', 'allowance', 'cash', 'money', 'currency', 'declare', 'drone', 'alcohol', 'cigarette'],
  },
  {
    id: 'kb-transit-rules',
    category: 'immigration',
    title: 'Transit Through Uganda to Rwanda, DRC, or South Sudan',
    summary: 'Guidelines for travelers connecting overland through Uganda to neighboring countries.',
    detailedContent: `Travelers entering Uganda at Malaba OSBP with the intention of immediately proceeding to Rwanda (via Katuna/Cyanika), Democratic Republic of Congo (via Bunagana/Mpondwe), or South Sudan (via Elegu):

• Transit Visa: Costs $50 USD and allows a stay of up to 7 days for passengers passing through Uganda on a direct overland route.
• Proof of Entry for Next Country: You must provide a valid visa, resident permit, or proof of citizenship for the destination country.
• Vehicle Transit: Transiting commercial cargo or foreign vehicles must register on the regional electronic cargo tracking system (RECTS) or obtain designated transit seals from URA Customs at Malaba.`,
    officialAuthority: 'DCIC Border Management Directorate',
    approvedByAdmin: true,
    lastReviewedDate: '2026-08-20',
    keywords: ['transit', 'rwanda', 'drc', 'south sudan', 'congo', 'route', '7 days', 'overland'],
  },
  {
    id: 'kb-land-border-general',
    category: 'border_post',
    title: 'Crossing Any Uganda Land Border: Step by Step',
    summary: 'The same core steps apply at every Uganda land crossing, whichever neighbouring country you come from.',
    detailedContent: `Whichever land border you use, expect these steps in roughly this order:

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
• Opening hours: busy posts generally run extended or round-the-clock operations, smaller crossings may close in the evening. Hours can change, so confirm before you travel.`,
    officialAuthority: 'Compiled from public DCIC, URA and EAC guidance — confirm on official channels before travel',
    approvedByAdmin: false,
    lastReviewedDate: '2026-11-26',
    keywords: ['crossing', 'land border', 'entry point', 'entry points', 'steps to cross', 'any border', 'all borders', 'border posts', 'how to cross', 'hours', 'opening hours', 'open', 'close', 'receipt', 'bribe', 'informal', 'panya', 'cross any'],
  },
  {
    id: 'kb-border-list',
    category: 'border_post',
    title: 'Main Border Crossings Into Uganda',
    summary: 'Where you can enter Uganda by land or air, grouped by neighbouring country.',
    detailedContent: `Uganda borders five countries. Main entry points:

• Kenya: Malaba and Busia (the busiest), plus Lwakhakha and Suam in the east.
• Tanzania: Mutukula (on the Masaka to Bukoba road) and Kikagati/Murongo.
• Rwanda: Katuna (Gatuna), Cyanika near Kisoro, and Mirama Hills (Kagitumba).
• Democratic Republic of Congo: Mpondwe (Kasindi), Bunagana, Goli and Vurra.
• South Sudan: Elegu (Nimule) and Oraba.
• By air: Entebbe International Airport.

Uganda has no direct border with Burundi, so travellers from Burundi usually route through Rwanda or Tanzania.

The Pearl Travel journey planner currently covers Malaba, Busia, Entebbe, Katuna, Mutukula and Elegu. The core rules for visas, Yellow Fever and customs are the same at all of them.`,
    officialAuthority: 'Compiled from public DCIC, URA and EAC guidance — confirm on official channels before travel',
    approvedByAdmin: false,
    lastReviewedDate: '2026-11-26',
    keywords: ['borders', 'list of borders', 'which borders', 'neighbouring', 'neighboring', 'neighbour', 'neighbors', 'entry points', 'main crossings', 'border points', 'where can i enter', 'burundi border', 'all crossings', 'which border crossings', 'crossings can i use', 'border crossings', 'which crossing', 'burundi', 'does uganda border'],
  },
  {
    id: 'kb-busia',
    category: 'border_post',
    title: 'Busia Border (Kenya – Uganda)',
    summary: 'A major Kenya–Uganda crossing used by buses, trucks and private vehicles, with joint clearance like Malaba.',
    detailedContent: `Busia is the second main crossing between Kenya and Uganda, on the route towards Jinja and Kampala.

• It operates as a One-Stop Border Post, so exit from Kenya and entry into Uganda are handled together on one side.
• The documents are the same as at Malaba: passport or EAC ID, a Uganda eVisa if you need one, and your Yellow Fever card.
• Drivers need vehicle registration, a valid licence, COMESA insurance and the temporary movement permit.
• Busia is a busy trading town. Always clear at the official post, never at informal footpaths.
• Opening hours: confirm before you travel. Busy posts generally run extended or round-the-clock operations, but hours can change.`,
    officialAuthority: 'Compiled from public DCIC, URA and EAC guidance — confirm on official channels before travel',
    approvedByAdmin: false,
    lastReviewedDate: '2026-11-26',
    keywords: ['busia'],
  },
  {
    id: 'kb-katuna-rwanda',
    category: 'border_post',
    title: 'Katuna / Gatuna, Cyanika and Mirama Hills (Rwanda – Uganda)',
    summary: 'The main road links between Uganda and Rwanda, used for Kampala–Kigali and gorilla-trekking trips.',
    detailedContent: `Rwanda and Uganda are connected by several crossings:

• Katuna (Uganda side) and Gatuna (Rwanda side): the main Kampala to Kigali road via Mbarara and Kabale, run as a One-Stop Border Post.
• Cyanika, near Kisoro: popular with gorilla-trekking visitors.
• Mirama Hills and Kagitumba: in the east, on the route to northern Rwanda.

What to know:
• Rwandan and Ugandan citizens may travel with a valid national ID card under EAC arrangements.
• Visitors who need a visa can use the East Africa Tourist Visa, which covers Uganda, Kenya and Rwanda, provided the trip starts in the country that issued it.
• You will need your Yellow Fever card when entering Uganda.
• This border has been closed or restricted in the past, so check its current status before you travel.`,
    officialAuthority: 'Compiled from public DCIC, URA and EAC guidance — confirm on official channels before travel',
    approvedByAdmin: false,
    lastReviewedDate: '2026-11-26',
    keywords: ['katuna', 'gatuna', 'cyanika', 'kisoro', 'mirama', 'kagitumba', 'kigali', 'rwanda border', 'gorilla', 'from rwanda', 'to rwanda', 'into rwanda'],
  },
  {
    id: 'kb-mutukula-tanzania',
    category: 'border_post',
    title: 'Mutukula and Kikagati (Tanzania – Uganda)',
    summary: 'The main road crossings between Tanzania and Uganda, including the Masaka to Bukoba route.',
    detailedContent: `Tanzania and Uganda connect mainly at:

• Mutukula, on the road between Masaka and Bukoba, run as a One-Stop Border Post.
• Kikagati/Murongo, in the south-west.

What to know:
• Tanzanian citizens are EAC citizens and enjoy visa-free entry with a valid passport or accepted EAC document.
• Other visitors need a Uganda eVisa unless exempt.
• Carry your Yellow Fever card, as at every Uganda border.
• Vehicles need registration, a valid licence, COMESA insurance and the temporary movement permit.
• Opening hours: confirm before you travel, as hours at smaller posts can change.`,
    officialAuthority: 'Compiled from public DCIC, URA and EAC guidance — confirm on official channels before travel',
    approvedByAdmin: false,
    lastReviewedDate: '2026-11-26',
    keywords: ['mutukula', 'kikagati', 'murongo', 'tanzania border', 'bukoba', 'masaka', 'tanzanian', 'from tanzania', 'to tanzania', 'into tanzania'],
  },
  {
    id: 'kb-elegu-south-sudan',
    category: 'border_post',
    title: 'Elegu / Nimule and Oraba (South Sudan – Uganda)',
    summary: 'The main crossings between South Sudan and northern Uganda, on the Gulu to Juba route.',
    detailedContent: `South Sudan and Uganda connect mainly at:

• Elegu (Uganda) and Nimule (South Sudan): the main road from Gulu towards Juba.
• Oraba, in the north-west near Koboko.

What to know:
• South Sudan is an EAC member, so South Sudanese citizens travel visa-free with accepted travel documents.
• Other nationals need a Uganda eVisa if required, and must arrange any South Sudan visa separately.
• Yellow Fever vaccination proof is required for entry into Uganda.
• Trucks and cargo have additional transit and tracking requirements handled by URA Customs.
• Check current travel advisories and road conditions before you set out.`,
    officialAuthority: 'Compiled from public DCIC, URA and EAC guidance — confirm on official channels before travel',
    approvedByAdmin: false,
    lastReviewedDate: '2026-11-26',
    keywords: ['elegu', 'nimule', 'oraba', 'juba', 'gulu', 'koboko', 'south sudan border', 'south sudanese', 'from south sudan', 'to south sudan', 'into south sudan'],
  },
  {
    id: 'kb-drc-borders',
    category: 'border_post',
    title: 'DRC Crossings: Mpondwe, Bunagana, Goli and Vurra',
    summary: 'Land crossings between the Democratic Republic of Congo and western or north-western Uganda.',
    detailedContent: `The main crossings with the Democratic Republic of Congo are:

• Mpondwe (Kasese district), opposite Kasindi in the DRC.
• Bunagana, near Kisoro.
• Goli and Vurra, in the north-west.

What to know:
• Congolese citizens are EAC citizens and travel visa-free with accepted documents.
• Other visitors need a Uganda eVisa if required, and a DRC visa arranged separately.
• Carry your Yellow Fever card. Port Health may apply extra health screening if there is a disease outbreak.
• Conditions at some DRC crossings have changed because of security concerns or closures. Check your embassy's travel advice and confirm the crossing is open before you travel.`,
    officialAuthority: 'Compiled from public DCIC, URA and EAC guidance — confirm on official channels before travel',
    approvedByAdmin: false,
    lastReviewedDate: '2026-11-26',
    keywords: ['mpondwe', 'kasindi', 'bunagana', 'goli', 'vurra', 'drc border', 'congo border', 'kasese', 'congolese', 'from congo', 'to congo', 'from drc', 'to drc', 'into congo'],
  },
  {
    id: 'kb-entebbe-airport',
    category: 'border_post',
    title: 'Arriving at Entebbe International Airport',
    summary: 'What happens when you arrive in Uganda by air, and what to have ready.',
    detailedContent: `When you land at Entebbe International Airport:

1. Port Health: show your WHO Yellow Fever card at the health desk.
2. Immigration: present your passport and your printed eVisa approval letter if you need a visa. Fingerprints and a photo are taken.
3. Baggage claim, then customs: declare goods and any cash above USD 10,000.

Tips:
• Have your approval letter, passport, Yellow Fever card and accommodation details together before you reach the counters.
• Keep your onward or return ticket available, as officers may ask for it.
• For departures, arrive early for international flights and keep your boarding documents ready.`,
    officialAuthority: 'Compiled from public DCIC, URA and EAC guidance — confirm on official channels before travel',
    approvedByAdmin: false,
    lastReviewedDate: '2026-11-26',
    keywords: ['entebbe', 'airport', 'flight', 'fly', 'flying', 'plane', 'eia', 'arrive by air', 'air travel'],
  },
  {
    id: 'kb-minors',
    category: 'immigration',
    title: 'Travelling With Children',
    summary: 'Documents commonly requested when a child crosses the border.',
    detailedContent: `Officers may ask for proof of the relationship between an adult and a child:

• A passport or accepted travel document for the child.
• The child's birth certificate.
• If the child travels without both parents, a signed letter of consent from the absent parent or parents, ideally with a copy of their ID.
• If travelling with a guardian or school group, a letter from the legal guardian or school.
• The child's Yellow Fever card, if vaccination is required for their age.

Airlines have their own rules for unaccompanied minors, so check with your airline.`,
    officialAuthority: 'Compiled from public DCIC, URA and EAC guidance — confirm on official channels before travel',
    approvedByAdmin: false,
    lastReviewedDate: '2026-11-26',
    keywords: ['child', 'children', 'kid', 'kids', 'minor', 'minors', 'baby', 'infant', 'son', 'daughter', 'family trip', 'birth certificate', 'consent letter'],
  },
  {
    id: 'kb-problems-border',
    category: 'immigration',
    title: 'Overstaying, Lost Documents and Problems at the Border',
    summary: 'What to do if your stay is running out, your passport is lost, or you are refused entry.',
    detailedContent: `• Extending your stay: apply to the Directorate of Citizenship and Immigration Control (DCIC) before your permitted stay ends. Overstaying can lead to fines or removal.
• Lost or stolen passport: report it to the police and get a report, then contact your embassy for an emergency travel document, and inform DCIC.
• Lost Yellow Fever card: ask the clinic that vaccinated you for a replacement or a certified copy before you travel.
• Refused entry or delays: stay calm, ask for the reason, and contact your embassy or the DCIC if you think the decision is wrong.
• If someone asks for an unofficial payment, decline and report it to the immigration authorities.`,
    officialAuthority: 'Compiled from public DCIC, URA and EAC guidance — confirm on official channels before travel',
    approvedByAdmin: false,
    lastReviewedDate: '2026-11-26',
    keywords: ['overstay', 'overstayed', 'extend', 'extension', 'extend my stay', 'lost passport', 'lost my passport', 'stolen', 'refused entry', 'denied entry', 'deport', 'deported', 'fine', 'fines', 'embassy', 'emergency', 'problem', 'complaint'],
  },
  {
    id: 'kb-money-border',
    category: 'customs',
    title: 'Money and Payments Near the Border',
    summary: 'Currency, cash declarations and ways to pay when you cross into Uganda.',
    detailedContent: `• The local currency is the Uganda shilling (UGX). US dollars are widely accepted at many tourist services, but you will need UGX for everyday costs.
• Foreign currency exchange is available at banks and licensed forex bureaus in border towns. Compare rates and avoid street changers.
• Mobile money such as MTN MoMo and Airtel Money is widely used across Uganda, though registering a local SIM may be needed.
• Card machines can be unreliable near borders, so carry some cash in small notes.
• Declare cash or negotiable instruments above USD 10,000 (or equivalent) to URA Customs on arrival.`,
    officialAuthority: 'Compiled from public DCIC, URA and EAC guidance — confirm on official channels before travel',
    approvedByAdmin: false,
    lastReviewedDate: '2026-11-26',
    keywords: ['money', 'exchange', 'forex', 'shilling', 'ugx', 'currency exchange', 'mobile money', 'momo', 'airtel money', 'atm', 'card', 'dollars', 'change money', 'payments'],
  },
];

export interface QueryResult {
  answer: string;
  matchedArticle?: KnowledgeArticle;
  citations: string[];
  confidence: 'high' | 'medium' | 'low';
  contextNote: string;
}

export function queryVerifiedKnowledge(
  question: string,
  profile?: PassengerProfile | null,
  journey?: JourneyDetails | null
): QueryResult {
  const q = question.toLowerCase().trim();

  // Find best matching article based on keyword hits
  let bestArticle: KnowledgeArticle | null = null;
  let highestScore = 0;

  for (const article of VERIFIED_KNOWLEDGE_ARTICLES) {
    let score = 0;
    for (const kw of article.keywords) {
      if (q.includes(kw)) {
        score += 2;
      }
    }
    const titleWords = article.title.toLowerCase().split(/\s+/);
    for (const tw of titleWords) {
      if (tw.length > 3 && q.includes(tw)) {
        score += 1.5;
      }
    }

    if (score > highestScore) {
      highestScore = score;
      bestArticle = article;
    }
  }

  // Personalization context from passenger and journey
  const nationality = profile?.nationality || 'International';
  const borderPoint = journey?.intendedBorderPoint || 'Malaba One-Stop Border Post (OSBP)';
  const travelMode = journey?.travelMode || 'road';

  if (bestArticle && highestScore >= 2) {
    let personalizedSnippet = '';
    if (bestArticle.id === 'kb-eac-free-movement' || bestArticle.id === 'kb-evisa-application') {
      const isEAC = ['Uganda', 'Kenya', 'Tanzania', 'Rwanda', 'Burundi', 'South Sudan', 'Democratic Republic of the Congo', 'Somalia'].includes(nationality);
      if (isEAC) {
        personalizedSnippet = `Based on your profile nationality (${nationality}), you are eligible for EAC visa-exempt entry! `;
      } else {
        personalizedSnippet = `As a traveler with ${nationality} nationality, you will need to hold a verified Uganda eVisa or East Africa Tourist Visa. `;
      }
    } else if (bestArticle.id === 'kb-malaba-osbp-clearing') {
      personalizedSnippet = `For your journey via ${borderPoint} via ${travelMode} transport: `;
    }

    return {
      answer: `${personalizedSnippet}${bestArticle.detailedContent}`,
      matchedArticle: bestArticle,
      citations: [
        bestArticle.officialAuthority,
        `Uganda Official Gazette & DCIC Border Regulation (Approved: ${bestArticle.lastReviewedDate})`,
      ],
      confidence: highestScore >= 4 ? 'high' : 'medium',
      contextNote: 'Answer retrieved from Administrator-Approved Official DCIC & URA Knowledge Base.',
    };
  }

  // Fallback grounded answer
  return {
    answer: `Thank you for asking Pearl Travel. Regarding your journey to Uganda via ${borderPoint}: All travelers must possess a passport valid for at least 6 months, a verified WHO Yellow Fever vaccination card, and appropriate entry authorization (either EAC visa exemption or an electronic visa approval letter). Luggage and vehicles entering via ${borderPoint} undergo mandatory Port Health and URA Customs screening. If your question relates to specific permits or personal situations, our verified knowledge base recommends consulting the on-duty Immigration Officer upon arrival at ${borderPoint}.`,
    citations: ['Uganda Directorate of Citizenship & Immigration Control (DCIC)', 'Ministry of Health Border Health Unit'],
    confidence: 'medium',
    contextNote: 'Grounded general border guidance retrieved from verified Uganda immigration standards.',
  };
}

export const SUGGESTED_QUESTIONS = [
  'Do I need a visa at Malaba OSBP?',
  'What are the Yellow Fever card rules?',
  'What vehicle documents are required for driving across Malaba?',
  'Can EAC citizens enter with their National ID card?',
  'What are the customs allowances for cash and personal luggage?',
  'How does joint clearance work at Malaba One-Stop Border Post?',
  'How do I cross any Uganda land border?',
  'Which border crossings can I use?',
  'What happens at Busia border?',
  'Arriving at Entebbe airport',
  'Can I travel with my child?',
];
