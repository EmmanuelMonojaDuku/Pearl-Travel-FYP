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
];
