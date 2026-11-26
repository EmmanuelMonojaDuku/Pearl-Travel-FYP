// Malaba One-Stop Border Post Passenger Clearance Video Data
// Official informational guidance series presented by Officer Okello (Uganda Immigration)

export interface TimedSubtitle {
  startTime: number; // in seconds
  endTime: number;   // in seconds
  text: string;
}

export interface OnScreenDocItem {
  id: string;
  name: string;
  category: 'mandatory' | 'recommended' | 'conditional';
  description: string;
  iconType: 'passport' | 'id' | 'visa' | 'health' | 'ticket' | 'form' | 'photo' | 'receipt' | 'app';
}

export interface VideoScene {
  id: number;
  title: string;
  locationName: string;
  stationType: string;
  imageUrl: string;
  durationSeconds: number; // total duration of this scene in seconds
  startTime: number;       // cumulative start time in seconds
  endTime: number;         // cumulative end time in seconds
  officerName: string;
  officerRole: string;
  dialogueScript: string;
  subtitles: TimedSubtitle[];
  onScreenChecklist: OnScreenDocItem[];
  officerSummaryPoints: string[];
  cameraMotion: 'pan-left' | 'pan-right' | 'zoom-in' | 'zoom-out';
  mapCoordinates: { x: number; y: number; label: string };
}

export const MALABA_BORDER_SCENES: VideoScene[] = [
  {
    id: 1,
    title: 'Scene 1 — Welcome to Malaba OSBP & Introduction',
    locationName: 'Arrival Concourse & Terminal Forecourt',
    stationType: 'Arrival Point & Passenger Welcome',
    imageUrl: '/src/assets/images/malaba_border_intro_1789375133477.jpg',
    durationSeconds: 32,
    startTime: 0,
    endTime: 32,
    officerName: 'Inspector David Okello',
    officerRole: 'Uganda Immigration Service Officer',
    dialogueScript:
      'Welcome to Uganda, the Pearl of Africa! My name is Inspector David Okello from the Uganda Immigration Service. Here at the Malaba One-Stop Border Post, our goal is to ensure your crossing is smooth, lawful, and safe. If you are crossing a land border for the first time, this passenger guidance walkthrough will demonstrate step-by-step how to prepare your documents and complete every clearance counter without stress. Let us walk through the process together.',
    subtitles: [
      { startTime: 0, endTime: 5, text: 'Welcome to Uganda, the Pearl of Africa!' },
      { startTime: 5, endTime: 11, text: 'My name is Inspector David Okello from the Uganda Immigration Service.' },
      { startTime: 11, endTime: 18, text: 'Here at the Malaba One-Stop Border Post, our goal is to ensure your crossing is smooth, lawful, and safe.' },
      { startTime: 18, endTime: 25, text: 'If you are crossing a land border for the first time, this walkthrough will demonstrate how to complete clearance.' },
      { startTime: 25, endTime: 32, text: 'Let us walk through the process together from arrival to your final exit into Uganda.' },
    ],
    onScreenChecklist: [
      {
        id: 'chk-arrival-prep',
        name: 'Have All Travel Documents In Hand',
        category: 'mandatory',
        description: 'Keep your physical passport or ID ready before entering the terminal.',
        iconType: 'passport',
      },
      {
        id: 'chk-follow-signage',
        name: 'Follow Designated Passenger Walkways',
        category: 'mandatory',
        description: 'Pedestrians and bus passengers use the sheltered terminal concourse.',
        iconType: 'form',
      },
      {
        id: 'chk-port-health-first',
        name: 'Proceed to Port Health First',
        category: 'mandatory',
        description: 'Yellow fever certification check is mandatory prior to immigration booths.',
        iconType: 'health',
      },
    ],
    officerSummaryPoints: [
      'Malaba operates as a One-Stop Border Post (OSBP) where exit and entry are completed under one roof.',
      'Always use official pedestrian walkways and carry your documents in your hand luggage.',
      'Immigration officers wear official uniforms with service shoulder insignia and name badges.',
    ],
    cameraMotion: 'zoom-in',
    mapCoordinates: { x: 15, y: 75, label: '1. Passenger Arrival' },
  },
  {
    id: 2,
    title: 'Scene 2 — Passport & Immigration Clearance',
    locationName: 'Primary Passenger Clearance Hall — Counters 1 to 6',
    stationType: 'Immigration & Biometric Inspection',
    imageUrl: '/src/assets/images/malaba_passport_clearance_1789375152233.jpg',
    durationSeconds: 38,
    startTime: 32,
    endTime: 70,
    officerName: 'Inspector David Okello',
    officerRole: 'Uganda Immigration Service Officer',
    dialogueScript:
      'This is where passport and immigration clearance is done. When you approach the counter, please remove hats and sunglasses. Present your valid international passport with at least six months of remaining validity and your approved electronic visa or visa exemption confirmation. The officer will verify your identity, capture your digital fingerprints, and place the official entry stamp into your passport. Please check the stamp before leaving the counter to confirm your allowed duration of stay.',
    subtitles: [
      { startTime: 32, endTime: 37, text: 'This is where passport and immigration clearance is done.' },
      { startTime: 37, endTime: 44, text: 'When you approach the counter, please remove hats and sunglasses.' },
      { startTime: 44, endTime: 53, text: 'Present your valid international passport with at least 6 months remaining validity and your approved eVisa.' },
      { startTime: 53, endTime: 61, text: 'The officer will verify your identity, capture digital fingerprints, and place the official entry endorsement stamp.' },
      { startTime: 61, endTime: 70, text: 'Always inspect the stamp before leaving the booth to confirm your authorized days of stay.' },
    ],
    onScreenChecklist: [
      {
        id: 'chk-valid-passport',
        name: 'Valid Passport (6+ Months Validity)',
        category: 'mandatory',
        description: 'Must have at least 2 consecutive blank pages for immigration stamps.',
        iconType: 'passport',
      },
      {
        id: 'chk-evisa-approval',
        name: 'Printed Uganda eVisa Approval Slip',
        category: 'mandatory',
        description: 'Visas on arrival are discontinued. Apply online at visas.immigration.go.ug.',
        iconType: 'visa',
      },
      {
        id: 'chk-biometric-capture',
        name: 'Biometric Verification',
        category: 'mandatory',
        description: 'Facial recognition photo and 4-fingerprint digital scan at counter.',
        iconType: 'form',
      },
      {
        id: 'chk-return-itinerary',
        name: 'Return Ticket / Travel Itinerary',
        category: 'recommended',
        description: 'Proof of onward travel or transport booking leaving Uganda.',
        iconType: 'ticket',
      },
    ],
    officerSummaryPoints: [
      'Visas on arrival are not issued at Ugandan land borders — apply online prior to arrival.',
      'Verify that the officer stamped the exact date and allocated number of days.',
      'Keep your entry passport safe and accessible throughout your journey.',
    ],
    cameraMotion: 'pan-right',
    mapCoordinates: { x: 38, y: 55, label: '2. Immigration Counters' },
  },
  {
    id: 3,
    title: 'Scene 3 — Inter-State Pass Clearance',
    locationName: 'EAC Regional Mobility Desk — Counter 7',
    stationType: 'East African Community Free Movement',
    imageUrl: '/src/assets/images/malaba_interstate_pass_1789375165908.jpg',
    durationSeconds: 36,
    startTime: 70,
    endTime: 106,
    officerName: 'Inspector David Okello',
    officerRole: 'Uganda Immigration Service Officer',
    dialogueScript:
      'If you are travelling using an Inter-State Pass, these are the documents you need. The Inter-State Pass allows citizens of East African Community partner states, such as Kenya, Uganda, Rwanda, Tanzania, and South Sudan, to cross borders conveniently. You will need your official National ID card, two clear passport-sized photos, and your passenger declaration form. The counter officer will verify your citizenship and issue your travel permit, allowing you up to six months of visa-free regional travel under the EAC Common Market Protocol.',
    subtitles: [
      { startTime: 70, endTime: 76, text: 'If you are travelling using an Inter-State Pass, these are the documents you need.' },
      { startTime: 76, endTime: 84, text: 'The Inter-State Pass allows citizens of East African Community partner states to cross borders conveniently.' },
      { startTime: 84, endTime: 92, text: 'You will need your original National Identification Card and two clear passport-sized photos.' },
      { startTime: 92, endTime: 99, text: 'The counter officer will verify your East African citizenship and issue your interstate pass.' },
      { startTime: 99, endTime: 106, text: 'This permits up to 6 months of lawful regional stay under the EAC Common Market Protocol.' },
    ],
    onScreenChecklist: [
      {
        id: 'chk-eac-national-id',
        name: 'Original EAC National ID Card',
        category: 'mandatory',
        description: 'Valid government-issued National ID (Ugandan NIRA, Kenyan Huduma/National ID, etc.).',
        iconType: 'id',
      },
      {
        id: 'chk-two-passport-photos',
        name: 'Two Recent Passport Photographs',
        category: 'mandatory',
        description: 'Color photos with white background taken within the last 6 months.',
        iconType: 'photo',
      },
      {
        id: 'chk-statutory-fee-receipt',
        name: 'Official Statutory Fee Receipt',
        category: 'mandatory',
        description: 'Standard administrative processing fee paid at the official border bank booth.',
        iconType: 'receipt',
      },
      {
        id: 'chk-local-verification',
        name: 'Student ID or Local Authority Letter',
        category: 'conditional',
        description: 'Applicable for students or cross-border community members.',
        iconType: 'form',
      },
    ],
    officerSummaryPoints: [
      'Applicable strictly to bona fide citizens of recognized East African Community member nations.',
      'Always present original physical National IDs; digital phone photos are not admissible.',
      'Processing takes only 5 to 10 minutes when your photographs and fees are prepared in advance.',
    ],
    cameraMotion: 'pan-left',
    mapCoordinates: { x: 52, y: 40, label: '3. EAC Inter-State Desk' },
  },
  {
    id: 4,
    title: 'Scene 4 — Temporary Movement/Travel Document (TMP)',
    locationName: 'Emergency Documentation & TMP Bureau',
    stationType: 'Special Document Services',
    imageUrl: '/src/assets/images/malaba_tmp_office_1789375177805.jpg',
    durationSeconds: 38,
    startTime: 106,
    endTime: 144,
    officerName: 'Inspector David Okello',
    officerRole: 'Uganda Immigration Service Officer',
    dialogueScript:
      'We now move to the Temporary Movement Document office, commonly referred to as the TMP desk. You may need a TMP if your passport was lost or damaged while in transit, or if an emergency arises requiring immediate cross-border travel before a full passport can be issued. To apply, present an official Police Loss Report or National ID, two passport photos, and your travel statement explaining your trip. The immigration team will conduct swift identity verification and issue a single or return-journey TMP valid for authorized regional travel.',
    subtitles: [
      { startTime: 106, endTime: 112, text: 'We now move to the Temporary Movement Document office, known as the TMP desk.' },
      { startTime: 112, endTime: 120, text: 'A TMP is needed if your travel document was lost or damaged, or during an urgent travel emergency.' },
      { startTime: 120, endTime: 128, text: 'To apply, present an official Police Loss Report or National ID, two passport photos, and your travel statement.' },
      { startTime: 128, endTime: 136, text: 'The immigration team conducts identity verification and issues your temporary clearance pass.' },
      { startTime: 136, endTime: 144, text: 'Remember that the TMP is strictly for specified regional travel and has an exact validity date.' },
    ],
    onScreenChecklist: [
      {
        id: 'chk-police-report',
        name: 'Police Loss Abstract / Report',
        category: 'mandatory',
        description: 'Required if your primary passport or travel pass was stolen or lost.',
        iconType: 'form',
      },
      {
        id: 'chk-tmp-national-id',
        name: 'National ID or Birth Certificate',
        category: 'mandatory',
        description: 'Primary proof of citizenship and identity for verification.',
        iconType: 'id',
      },
      {
        id: 'chk-two-passport-photos-tmp',
        name: 'Two Passport Photographs',
        category: 'mandatory',
        description: 'Attached directly to the physical serialized TMP document.',
        iconType: 'photo',
      },
      {
        id: 'chk-statutory-tmp-fee',
        name: 'TMP Issuance Fee Receipt',
        category: 'mandatory',
        description: 'Paid at the border post bank counter (official government revenue receipt).',
        iconType: 'receipt',
      },
    ],
    officerSummaryPoints: [
      'The Temporary Movement Permit is a lawful emergency travel document recognized across the EAC.',
      'It cannot be used for intercontinental international air travel; it is specifically for regional land travel.',
      'Check the expiration date on your TMP to avoid overstay penalties.',
    ],
    cameraMotion: 'zoom-out',
    mapCoordinates: { x: 62, y: 35, label: '4. TMP Documentation Office' },
  },
  {
    id: 5,
    title: 'Scene 5 — Port Health, Customs & Inspection Lanes',
    locationName: 'Uganda Revenue Authority (URA) & Ministry of Health Lanes',
    stationType: 'Customs & Port Health Clearance',
    imageUrl: '/src/assets/images/malaba_customs_health_1789375190085.jpg',
    durationSeconds: 38,
    startTime: 144,
    endTime: 182,
    officerName: 'Inspector David Okello',
    officerRole: 'Uganda Immigration Service Officer',
    dialogueScript:
      'After immigration clearance, all travellers proceed through Port Health and Customs. Port Health officers verify your yellow fever vaccination card and perform routine temperature checks. Next, at Uganda Revenue Authority Customs, your baggage passes through the non-intrusive luggage scanner. If you are carrying commercial goods, currency exceeding ten thousand US dollars, controlled medications, or agricultural items, you must declare them using the official customs declaration slip. Officers are here to assist you with honest declarations.',
    subtitles: [
      { startTime: 144, endTime: 151, text: 'After immigration, all travellers proceed through Port Health and Customs inspection.' },
      { startTime: 151, endTime: 159, text: 'Port Health officers verify your WHO yellow fever card and conduct routine wellness checks.' },
      { startTime: 159, endTime: 167, text: 'Next, Uganda Revenue Authority Customs screens luggage through modern non-intrusive scanners.' },
      { startTime: 167, endTime: 175, text: 'Declare currency exceeding $10,000 USD, commercial goods, or restricted agricultural items.' },
      { startTime: 175, endTime: 182, text: 'Officers are available to provide clear guidance on statutory allowances and duty payments.' },
    ],
    onScreenChecklist: [
      {
        id: 'chk-yellow-fever-card',
        name: 'Yellow Fever Vaccination Yellow Card',
        category: 'mandatory',
        description: 'Administered at least 10 days before travel (mandatory under Uganda Ministry of Health).',
        iconType: 'health',
      },
      {
        id: 'chk-customs-declaration',
        name: 'Customs Passenger Declaration Form',
        category: 'conditional',
        description: 'Required if transporting goods beyond personal allowance or currency > $10,000.',
        iconType: 'form',
      },
      {
        id: 'chk-scanner-baggage',
        name: 'Baggage Security X-Ray Scanning',
        category: 'mandatory',
        description: 'Place all luggage, backpacks, and duty-free packages on the scanning belt.',
        iconType: 'ticket',
      },
      {
        id: 'chk-agricultural-clearance',
        name: 'Agricultural & Biosecurity Clearance',
        category: 'conditional',
        description: 'Required when carrying seeds, fresh plants, animal products, or pets.',
        iconType: 'receipt',
      },
    ],
    officerSummaryPoints: [
      'Yellow fever vaccination cards must be the original physical WHO yellow card certificate.',
      'Declare all commercial merchandise to avoid confiscation or penalties under the EAC Customs Management Act.',
      'Keep medication in its original packaging along with the corresponding medical prescription.',
    ],
    cameraMotion: 'pan-right',
    mapCoordinates: { x: 74, y: 60, label: '5. Customs & Port Health' },
  },
  {
    id: 6,
    title: 'Scene 6 — Final Clearance & Officer Summary',
    locationName: 'Departure Concourse & Uganda Border Exit Barrier',
    stationType: 'Final Passenger Gate & Exit to Transport Hub',
    imageUrl: '/src/assets/images/malaba_final_exit_1789375203378.jpg',
    durationSeconds: 38,
    startTime: 182,
    endTime: 220,
    officerName: 'Inspector David Okello',
    officerRole: 'Uganda Immigration Service Officer',
    dialogueScript:
      'Congratulations! You have completed all clearance checks and are now authorized to enter Uganda. Let us quickly summarize the golden rules for every border traveller: One, prepare your required documents in advance. Two, report to the designated clearance points in order. Three, present your physical documents respectfully. Four, follow instructions from uniformed border officials. And five, verify your passport stamp before proceeding to your onward bus or taxi. Enjoy your travels across our beautiful country!',
    subtitles: [
      { startTime: 182, endTime: 188, text: 'Congratulations! You have completed all clearance checks and are now authorized to enter Uganda.' },
      { startTime: 188, endTime: 195, text: 'One: Prepare all your required documents before reaching the border post.' },
      { startTime: 195, endTime: 201, text: 'Two: Report to the correct clearance point in the designated sequence.' },
      { startTime: 201, endTime: 208, text: 'Three: Present your physical documents and follow instructions from uniformed officials.' },
      { startTime: 208, endTime: 214, text: 'Four: Verify your passport entry stamp before boarding your transport.' },
      { startTime: 214, endTime: 220, text: 'Have a wonderful, safe, and memorable journey through the Pearl of Africa!' },
    ],
    onScreenChecklist: [
      {
        id: 'chk-step-1',
        name: '1. Prepare Required Documents In Advance',
        category: 'mandatory',
        description: 'Keep passport, eVisa, yellow card, and travel funds organized.',
        iconType: 'passport',
      },
      {
        id: 'chk-step-2',
        name: '2. Report to Correct Clearance Point',
        category: 'mandatory',
        description: 'Follow Port Health -> Immigration -> Customs in sequence.',
        iconType: 'form',
      },
      {
        id: 'chk-step-3',
        name: '3. Present Documents & Cooperate with Officers',
        category: 'mandatory',
        description: 'Answer questions courteously and verify physical entry stamps.',
        iconType: 'id',
      },
      {
        id: 'chk-step-4',
        name: '4. Keep Receipt of Departure & Exit Gate Pass',
        category: 'mandatory',
        description: 'Show your stamped passport to the exit gate officer to proceed.',
        iconType: 'ticket',
      },
    ],
    officerSummaryPoints: [
      'Always retain your passport and entry slip safely throughout your stay in Uganda.',
      'Never give documents or money to unauthorized touts; only deal with uniformed officers at counters.',
      'Official registered transport operators (coaches, registered taxis) are available immediately outside the exit terminal.',
    ],
    cameraMotion: 'zoom-in',
    mapCoordinates: { x: 88, y: 80, label: '6. Final Exit Gate' },
  },
  {
    id: 7,
    title: 'Scene 7 — Pearl Travel Connection & Pre-Arrival Readiness',
    locationName: 'Pearl Travel Mobile Readiness Integration',
    stationType: 'Digital Pre-Arrival Readiness Suite',
    imageUrl: '/src/assets/images/malaba_pearl_app_1789375216363.jpg',
    durationSeconds: 35,
    startTime: 220,
    endTime: 255,
    officerName: 'Inspector David Okello',
    officerRole: 'Uganda Immigration Service Officer',
    dialogueScript:
      'To make your land border clearance effortless, we encourage every passenger to use Pearl Travel before setting off. Pearl Travel allows you to input your traveller profile, check live visa and entry requirements, verify your customized document checklist, monitor your readiness score, and carry an offline border guidance pass on your phone. Even when mobile data is limited at the border, your requirements stay securely cached. Plan ahead, travel with confidence, and welcome to Uganda!',
    subtitles: [
      { startTime: 220, endTime: 226, text: 'To make your land border clearance effortless, use Pearl Travel before setting off.' },
      { startTime: 226, endTime: 233, text: 'Pearl Travel provides your personalized traveller profile and live border entry requirements.' },
      { startTime: 233, endTime: 241, text: 'Track your document checklist, compute your readiness score, and generate your offline border pass.' },
      { startTime: 241, endTime: 248, text: 'Even without mobile internet at remote crossings, your full checklist remains 100% accessible offline.' },
      { startTime: 248, endTime: 255, text: 'Plan ahead, travel with complete confidence, and welcome to Uganda!' },
    ],
    onScreenChecklist: [
      {
        id: 'chk-app-profile',
        name: 'Traveller Profile & Nationality Engine',
        category: 'mandatory',
        description: 'Customizes visa rules and checklists specifically for your passport.',
        iconType: 'app',
      },
      {
        id: 'chk-app-readiness',
        name: 'Dynamic Readiness Score (0 - 100%)',
        category: 'mandatory',
        description: 'Instant visual calculation of your compliance before reaching the border.',
        iconType: 'app',
      },
      {
        id: 'chk-app-checklist',
        name: 'Document Checklist with Status Tracking',
        category: 'mandatory',
        description: 'Mark missing, pending, or completed documents with expiry alerts.',
        iconType: 'app',
      },
      {
        id: 'chk-app-offline',
        name: '100% Offline Border Access',
        category: 'mandatory',
        description: 'Local storage caching ensures access even with zero cellular signal.',
        iconType: 'app',
      },
    ],
    officerSummaryPoints: [
      'Pearl Travel is your trusted digital companion for East African border travel.',
      'Check your requirements 48 hours prior to travel to ensure eVisa and vaccinations are ready.',
      'Designed with Uganda national pride: black, yellow, and red identity.',
    ],
    cameraMotion: 'pan-left',
    mapCoordinates: { x: 92, y: 50, label: '7. Pearl Travel Digital Hub' },
  },
];

export const TOTAL_VIDEO_DURATION = MALABA_BORDER_SCENES.reduce(
  (sum, scene) => sum + scene.durationSeconds,
  0
);
