import { PassengerProfile, TravelRequirement, ChecklistItem, DocumentStatus } from '../types';

export const POPULAR_NATIONALITIES = [
  'United States',
  'United Kingdom',
  'Uganda',
  'Kenya',
  'Tanzania',
  'Rwanda',
  'Burundi',
  'South Sudan',
  'Democratic Republic of the Congo',
  'Germany',
  'Canada',
  'Australia',
  'India',
  'China',
  'South Africa',
  'Nigeria',
  'United Arab Emirates',
  'France',
  'Netherlands',
];

export const EAST_AFRICAN_COMMUNITY = [
  'Uganda',
  'Kenya',
  'Tanzania',
  'Rwanda',
  'Burundi',
  'South Sudan',
  'Democratic Republic of the Congo',
  'Somalia',
];

export const VISA_EXEMPT_COUNTRIES = [
  ...EAST_AFRICAN_COMMUNITY,
  'Antigua',
  'Bahamas',
  'Barbados',
  'Belize',
  'Fiji',
  'Gambia',
  'Grenada',
  'Jamaica',
  'Malawi',
  'Malta',
  'Mauritius',
  'Seychelles',
  'Sierra Leone',
  'Singapore',
  'Solomon Islands',
  'St. Vincent & Grenadines',
  'Tonga',
  'Vanuatu',
  'Zambia',
  'Zimbabwe',
];

export const POPULAR_DESTINATIONS = [
  'Entebbe & Kampala (City, Lake Victoria & Hub)',
  'Bwindi Impenetrable National Park (Mountain Gorillas)',
  'Murchison Falls National Park (Big 5 & River Nile)',
  'Queen Elizabeth National Park (Tree-climbing Lions & Kazinga Channel)',
  'Kibale National Park (Primate Capital & Chimpanzee Trekking)',
  'Jinja (Adventure Capital & Source of the Nile)',
  'Kidepo Valley National Park (Untamed Wilderness)',
  'Rwenzori Mountains (Mountains of the Moon)',
  'Lake Bunyonyi (Highland Relaxation)',
  'East Africa Multi-Country Circuit (Uganda + Rwanda + Kenya)',
];

export function generateRequirementsForProfile(profile?: PassengerProfile | null): TravelRequirement[] {
  const reqs: TravelRequirement[] = [];
  const nationality = profile?.nationality || 'United States';
  const destination = profile?.destination || 'Entebbe & Kampala';
  const travellerType = profile?.travellerType || 'solo';
  const travelPurpose = profile?.travelPurpose || 'tourism';

  const isEAC = EAST_AFRICAN_COMMUNITY.includes(nationality);
  const isVisaExempt = VISA_EXEMPT_COUNTRIES.includes(nationality);
  const isUgandanCitizen = nationality === 'Uganda';

  // 1. Passport / Travel Document
  reqs.push({
    id: 'req-passport',
    category: 'entry',
    title: 'Valid Passport (6-Month Minimum Validity)',
    summary: 'Passport must be valid for at least 6 months past your entry date.',
    simpleExplanation:
      'Immigration officers will inspect your passport to ensure it has at least 6 months remaining before expiration and at least 2 full blank visa stamp pages. If it expires sooner, airline staff will deny check-in.',
    applicableCondition: 'Mandatory for all international travelers entering Uganda.',
    mandatory: true,
    officialSource: 'Uganda Directorate of Citizenship & Immigration Control (DCIC)',
  });

  // 2. Visa Guidance based on Nationality
  if (isUgandanCitizen) {
    reqs.push({
      id: 'req-visa-citizen',
      category: 'visa',
      title: 'Ugandan Citizen Entry (National ID or Passport)',
      summary: 'No visa required. Present Ugandan passport or National ID card.',
      simpleExplanation:
        'As a returning citizen of the Republic of Uganda, you have unrestricted right of entry. Simply present your valid Ugandan e-Passport or National Identification Number (NIN).',
      applicableCondition: 'Applies to Ugandan citizens.',
      mandatory: true,
      officialSource: 'Ministry of Internal Affairs Uganda',
    });
  } else if (isEAC) {
    reqs.push({
      id: 'req-visa-eac',
      category: 'visa',
      title: 'East African Community (EAC) Free Movement',
      summary: 'Visa-free entry under EAC Common Market Protocol.',
      simpleExplanation:
        `Citizens of ${nationality} can enter Uganda without a visa for stays up to 90 days. You may present your valid passport or recognized EAC interstate travel pass.`,
      applicableCondition: `Applicable to citizens of ${nationality}.`,
      mandatory: true,
      officialSource: 'EAC Secretariat & Uganda Immigration',
    });
  } else if (isVisaExempt) {
    reqs.push({
      id: 'req-visa-exempt',
      category: 'visa',
      title: 'Bilateral Visa Exemption (Up to 90 Days)',
      summary: `Nationals of ${nationality} are exempt from tourist/business visas.`,
      simpleExplanation:
        `Under reciprocal diplomatic agreements, visitors from ${nationality} can enter without a visa for short-term visits. An entry endorsement stamp will be granted at Entebbe Airport.`,
      applicableCondition: 'Short-term leisure/business visits.',
      mandatory: true,
      officialSource: 'Uganda Ministry of Foreign Affairs',
    });
  } else {
    // Standard eVisa or East Africa Tourist Visa
    if (destination.includes('Multi-Country')) {
      reqs.push({
        id: 'req-visa-eatv',
        category: 'visa',
        title: 'East Africa Tourist Visa (Uganda, Rwanda, Kenya)',
        summary: 'Joint multi-entry visa across 3 East African partner states.',
        simpleExplanation:
          'Since you plan to travel across Uganda and neighbouring regional countries, apply for the East Africa Tourist Visa ($100 USD) through the immigration authority of the first country you enter.',
        applicableCondition: 'Multi-destination East Africa travel.',
        mandatory: true,
        officialSource: 'Uganda Immigration e-Visa Portal (visas.immigration.go.ug)',
      });
    } else {
      reqs.push({
        id: 'req-visa-evisa',
        category: 'visa',
        title: 'Mandatory Uganda Electronic Visa (e-Visa)',
        summary: 'Must be applied and approved online before departure.',
        simpleExplanation:
          'Uganda has completely discontinued visas on arrival at Entebbe Airport. You must submit your application online at visas.immigration.go.ug and present the printed approval travel letter to board your airline.',
        applicableCondition: `Mandatory for citizens of ${nationality} traveling for ${travelPurpose}.`,
        mandatory: true,
        officialSource: 'Directorate of Citizenship and Immigration Control (DCIC)',
      });
    }
  }

  // 3. Health & Port Health (Yellow Fever strictly mandatory)
  reqs.push({
    id: 'req-yellow-fever',
    category: 'health',
    title: 'Yellow Fever Vaccination Certificate (Strictly Mandatory)',
    summary: 'Mandatory for all arrivals aged 1 year and above.',
    simpleExplanation:
      'Port Health officers at Entebbe Airport inspect the yellow card before you reach immigration counters. The vaccine must be administered at least 10 days before your arrival date. A single dose now provides lifetime protection.',
    applicableCondition: 'Strict requirement for 100% of travelers entering Uganda.',
    mandatory: true,
    officialSource: 'Ministry of Health Uganda & WHO Guidelines',
  });

  // 4. Return Flight Ticket & Itinerary
  if (!isUgandanCitizen && travellerType !== 'resident') {
    reqs.push({
      id: 'req-return-ticket',
      category: 'entry',
      title: 'Confirmed Return or Onward Air Ticket',
      summary: 'Proof of departure within authorized visit duration.',
      simpleExplanation:
        'Airlines and border officers require evidence of confirmed onward travel exiting Uganda to ensure you will not overstay your temporary visitor status.',
      applicableCondition: 'Mandatory for non-residents and tourists.',
      mandatory: true,
      officialSource: 'Entebbe International Airport Port Immigration',
    });
  }

  // 5. Accommodation / Host Invitation
  reqs.push({
    id: 'req-accommodation',
    category: 'entry',
    title: 'Accommodation Booking or Local Host Details',
    summary: 'Hotel confirmation, safari lodge reservation, or host address.',
    simpleExplanation:
      'You will be asked on the arrival card for the physical address and phone number of where you will reside in Uganda (e.g. hotel name in Entebbe/Kampala or tour lodge in Bwindi).',
    applicableCondition: 'Required on arrival landing card.',
    mandatory: true,
    officialSource: 'Uganda Tourism Board & DCIC',
  });

  // 6. Wildlife & Gorilla Trekking Permit (Conditional)
  if (destination.includes('Bwindi') || destination.includes('Kibale')) {
    reqs.push({
      id: 'req-wildlife-permit',
      category: 'entry',
      title: 'Uganda Wildlife Authority (UWA) Tracking Permit',
      summary: 'Required for Mountain Gorilla trekking in Bwindi / Chimps in Kibale.',
      simpleExplanation:
        'Gorilla permits must be booked months in advance through Uganda Wildlife Authority or a licensed tour operator like Pearl Travel. Rangers check the physical or electronic voucher at national park gates.',
      applicableCondition: 'Visiting Bwindi, Mgahinga, or Kibale National Parks.',
      mandatory: true,
      officialSource: 'Uganda Wildlife Authority (UWA)',
    });
  }

  // 7. Travel Medical Insurance
  reqs.push({
    id: 'req-travel-insurance',
    category: 'health',
    title: 'Travel Medical & Emergency Evacuation Coverage',
    summary: 'Strongly recommended for adventure and safari safaris.',
    simpleExplanation:
      'While not legally confiscated at immigration, comprehensive insurance covering medical evacuation (such as AMREF Flying Doctors for remote national parks) is essential for peace of mind.',
    applicableCondition: 'Recommended for all travelers.',
    mandatory: false,
    officialSource: 'Pearl Travel Traveler Advisory',
  });

  // 8. Border Point Specific Procedures (Malaba OSBP / Road Travel)
  const isMalaba = profile?.journey?.intendedBorderPoint?.includes('Malaba') || destination.includes('Malaba');
  const isRoadTravel = profile?.journey?.travelMode === 'road';

  if (isMalaba || isRoadTravel) {
    reqs.push({
      id: 'req-malaba-osbp',
      category: 'entry',
      title: 'Joint Immigration Clearance at Malaba One-Stop Border Post (OSBP)',
      summary: 'Kenya-Uganda coordinated one-stop processing in the joint passenger terminal.',
      simpleExplanation:
        'Under the EAC OSBP bilateral protocol, you only stop once on the Ugandan side of the border. Paired immigration and health officers process your exit and entry simultaneously.',
      applicableCondition: 'Crossing at Malaba OSBP.',
      mandatory: true,
      officialSource: 'EAC OSBP Secretariat & Directorate of Citizenship and Immigration Control (DCIC)',
    });

    if (isRoadTravel) {
      reqs.push({
        id: 'req-road-vehicle-clearance',
        category: 'customs',
        title: 'Cross-Border Vehicle Clearance & COMESA Insurance',
        summary: 'Required for private, tour, and commercial vehicles crossing overland.',
        simpleExplanation:
          'Drivers must carry the original vehicle logbook, COMESA Yellow Card third-party insurance, and obtain a URA Temporary Movement Permit (TMP Form C32) at the customs counter.',
        applicableCondition: 'Overland road travel via border posts.',
        mandatory: true,
        officialSource: 'Uganda Revenue Authority (URA) Customs & Border Logistics',
      });
    }
  }

  // 9. Exit Procedures
  reqs.push({
    id: 'req-exit-customs',
    category: 'exit',
    title: 'Exit Inspection & Souvenir Customs Clearance',
    summary: 'Airport security screening and wildlife product clearance.',
    simpleExplanation:
      'When departing Entebbe or land border posts, allow sufficient time for clearance. Note: exporting protected wildlife trophies, untreated seeds, or minerals without UWA/Customs permits is strictly prohibited.',
    applicableCondition: 'Departure from Uganda border points.',
    mandatory: true,
    officialSource: 'Uganda Revenue Authority (URA Customs)',
  });

  return reqs;
}

export function generateDefaultChecklist(profile?: PassengerProfile | null): ChecklistItem[] {
  const nationality = profile?.nationality || 'United States';
  const destination = profile?.destination || 'Entebbe & Kampala';
  const passportNumber = profile?.passportNumber || '';
  const passportExpiryDate = profile?.passportExpiryDate || '2028-06-15';
  const hasYellowFeverVax = profile ? Boolean(profile.hasYellowFeverVax) : true;
  const hasReturnTicket = profile ? Boolean(profile.hasReturnTicket) : true;
  const hasAccommodationProof = profile ? Boolean(profile.hasAccommodationProof) : true;
  const hasTravelInsurance = profile ? Boolean(profile.hasTravelInsurance) : false;

  const isEAC = EAST_AFRICAN_COMMUNITY.includes(nationality);
  const isUgandanCitizen = nationality === 'Uganda';
  const isVisaExempt = VISA_EXEMPT_COUNTRIES.includes(nationality);

  const items: ChecklistItem[] = [
    {
      id: 'doc-passport',
      category: 'passport',
      title:
        profile?.travelDocumentType === 'EAC National ID Card'
          ? 'EAC National Identity Card (Biometric)'
          : profile?.travelDocumentType || 'Biometric / Regular Passport',
      description:
        profile?.travelDocumentType === 'EAC National ID Card'
          ? 'Recognized travel ID for citizens of Uganda, Kenya, and Rwanda under Northern Corridor pact.'
          : 'Minimum 6-month validity with at least 2 consecutive blank stamp pages.',
      status: passportNumber ? 'complete' : 'missing',
      mandatory: true,
      docNumber: passportNumber || undefined,
      expiryDate: passportExpiryDate,
      guidanceNote: 'Carry physical document. Digital scans on phones are not accepted for entry.',
    },
    {
      id: 'doc-visa',
      category: 'visa',
      title: isUgandanCitizen
        ? 'Citizen Identification (Passport / NIN)'
        : isEAC
        ? 'EAC Travel Entry / Free Pass'
        : isVisaExempt
        ? 'Visa-Exempt Country Status'
        : 'Uganda Electronic Visa (Approval Letter)',
      description: isUgandanCitizen
        ? 'Valid Ugandan ID or Passport'
        : isEAC
        ? 'EAC Treaty Visa Exemption Entry'
        : isVisaExempt
        ? 'Reciprocal 90-Day Entry Stamp'
        : 'Printed official eVisa approval barcode letter from visas.immigration.go.ug',
      status: isUgandanCitizen || isEAC || isVisaExempt ? 'complete' : 'missing',
      mandatory: !isUgandanCitizen && !isEAC && !isVisaExempt,
      docNumber: isUgandanCitizen ? 'UG-CITIZEN-AUTH' : isEAC ? 'EAC-COMMON-PASS' : 'EVISA-UG-88291',
      guidanceNote: isUgandanCitizen || isEAC || isVisaExempt
        ? 'No advance visa fee required.'
        : 'Do NOT use third-party scam visa sites. Only visas.immigration.go.ug is official.',
    },
    {
      id: 'doc-yellow-fever',
      category: 'health',
      title: 'Yellow Fever Vaccination Yellow Card',
      description: 'Official WHO International Certificate of Vaccination or Prophylaxis.',
      status: hasYellowFeverVax ? 'complete' : 'missing',
      mandatory: true,
      docNumber: 'ICVP-UG-YELLOW-771',
      guidanceNote: 'Must be administered at least 10 days prior to arrival. Checked by Port Health before immigration.',
    },
    {
      id: 'doc-return-ticket',
      category: 'travel',
      title: 'Confirmed Return / Onward Flight Itinerary',
      description: 'Proof of flight departing Entebbe Airport (EBB) within authorized stay.',
      status: hasReturnTicket ? 'complete' : 'missing',
      mandatory: !isUgandanCitizen,
      docNumber: 'EBB-OUT-TK-4491',
      guidanceNote: 'Digital e-ticket receipt on your smartphone or printout is accepted.',
    },
    {
      id: 'doc-accommodation',
      category: 'supporting',
      title: 'Proof of Accommodation / Safari Tour Booking',
      description: 'Hotel voucher, Airbnb confirmation, or signed host invitation with contact phone.',
      status: hasAccommodationProof ? 'complete' : 'missing',
      mandatory: true,
      docNumber: 'PT-SAFARI-BK-2026',
      guidanceNote: 'Required for filling out the physical or electronic entry card.',
    },
    {
      id: 'doc-travel-insurance',
      category: 'travel',
      title: 'Comprehensive Travel & Medical Insurance',
      description: 'Includes emergency medical treatment and flying doctors bush evacuation.',
      status: hasTravelInsurance ? 'complete' : 'missing',
      mandatory: false,
      docNumber: 'PEARL-CARE-INS-990',
      guidanceNote: 'Recommended for safaris and remote game reserves in Uganda.',
    },
  ];

  if (destination.includes('Bwindi') || destination.includes('Kibale')) {
    items.push({
      id: 'doc-wildlife-permit',
      category: 'travel',
      title: 'UWA Gorilla / Chimpanzee Trekking Permit',
      description: 'Official Uganda Wildlife Authority tracking booking voucher.',
      status: 'complete',
      mandatory: true,
      docNumber: 'UWA-BWINDI-GORILLA-3049',
      guidanceNote: 'Must be presented to the chief warden at national park briefing center.',
    });
  }

  return items;
}

export function calculateReadinessScore(checklist: ChecklistItem[]): {
  score: number;
  totalCount: number;
  completedCount: number;
  missingMandatoryCount: number;
  missingItems: ChecklistItem[];
  statusLabel: 'Ready' | 'Action Needed' | 'Critical Requirements Missing';
} {
  if (!checklist || checklist.length === 0) {
    return {
      score: 0,
      totalCount: 0,
      completedCount: 0,
      missingMandatoryCount: 0,
      missingItems: [],
      statusLabel: 'Critical Requirements Missing',
    };
  }

  let totalWeight = 0;
  let earnedWeight = 0;
  const missingItems: ChecklistItem[] = [];
  let missingMandatoryCount = 0;
  let completedCount = 0;

  checklist.forEach((item) => {
    const weight = item.mandatory ? 2 : 1;
    totalWeight += weight;

    if (item.status === 'complete') {
      earnedWeight += weight;
      completedCount++;
    } else {
      missingItems.push(item);
      if (item.mandatory) {
        missingMandatoryCount++;
      }
    }
  });

  const rawScore = totalWeight > 0 ? Math.round((earnedWeight / totalWeight) * 100) : 0;
  const score = Math.max(0, Math.min(100, rawScore));

  let statusLabel: 'Ready' | 'Action Needed' | 'Critical Requirements Missing' = 'Action Needed';
  if (score === 100 && missingMandatoryCount === 0) {
    statusLabel = 'Ready';
  } else if (missingMandatoryCount > 0 || score < 70) {
    statusLabel = 'Critical Requirements Missing';
  }

  return {
    score,
    totalCount: checklist.length,
    completedCount,
    missingMandatoryCount,
    missingItems,
    statusLabel,
  };
}
