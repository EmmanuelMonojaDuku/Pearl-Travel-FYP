import { jsPDF } from 'jspdf';
import { PassengerProfile, ChecklistItem } from '../types';
import { calculateReadinessScore } from '../data/travelRequirementsEngine';

interface ReviewPdfOptions {
  referenceId?: string;
  generatedAt?: string;
  readinessScore?: number;
  readinessStatus?: string;
}

/**
 * Generates an official, beautifully formatted Uganda Border Clearance & Readiness
 * Review Document in PDF format and triggers a download in the browser.
 */
export const downloadReviewDocumentPdf = (
  profile: PassengerProfile,
  checklist: ChecklistItem[] = [],
  options?: ReviewPdfOptions
): void => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth(); // 210mm
  const pageHeight = doc.internal.pageSize.getHeight(); // 297mm
  const margin = 12;
  const contentWidth = pageWidth - margin * 2; // 186mm
  let y = 12;

  const safeFullName = (profile.fullName || `${profile.firstName || ''} ${profile.lastName || ''}`).trim() || 'Passenger';
  const refId = options?.referenceId || `EBB-${Math.abs(safeFullName.split('').reduce((a, b) => a + b.charCodeAt(0), 0) * 137).toString().padStart(6, '0')}`;
  const dateStr = options?.generatedAt || new Date().toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  // Calculate readiness metrics
  const readiness = calculateReadinessScore(checklist);
  const scoreVal = options?.readinessScore !== undefined ? options.readinessScore : readiness.score;
  const statusVal = options?.readinessStatus || readiness.statusLabel;

  // 1. Top Uganda Flag Tricolor Header Bars
  doc.setFillColor(0, 0, 0); // Black
  doc.rect(margin, y, contentWidth / 3, 2.5, 'F');
  doc.setFillColor(252, 209, 22); // Uganda Yellow
  doc.rect(margin + contentWidth / 3, y, contentWidth / 3, 2.5, 'F');
  doc.setFillColor(210, 16, 52); // Uganda Red
  doc.rect(margin + (contentWidth / 3) * 2, y, contentWidth / 3, 2.5, 'F');
  y += 5.5;

  // 2. Official Header
  doc.setTextColor(30, 41, 59);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('THE REPUBLIC OF UGANDA', pageWidth / 2, y, { align: 'center' });
  y += 4;

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text('MINISTRY OF INTERNAL AFFAIRS | DIRECTORATE OF CITIZENSHIP & IMMIGRATION CONTROL', pageWidth / 2, y, { align: 'center' });
  y += 3.5;
  doc.text('DEPARTMENT OF PORT HEALTH & BORDER CONTROL | MALABA, BUSIA & ENTEBBE OSBP', pageWidth / 2, y, { align: 'center' });
  y += 4.5;

  // 3. Document Title Box
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(margin, y, contentWidth, 12, 1.5, 1.5, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  doc.text('PASSENGER BORDER CLEARANCE & READINESS REVIEW DOCUMENT', margin + 3.5, y + 4.8);

  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text(`Official Reference: ${refId}  |  Issued: ${dateStr}  |  Entebbe International Airport & OSBP Entry`, margin + 3.5, y + 9.2);

  // QR / Barcode indicator tag on the right
  doc.setFillColor(210, 16, 52);
  doc.roundedRect(pageWidth - margin - 30, y + 2.5, 27, 7, 1.2, 1.2, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(255, 255, 255);
  doc.text('PEARL PASS VERIFIED', pageWidth - margin - 16.5, y + 6.8, { align: 'center' });

  y += 14.5;

  // 4. BORDER READINESS & COMPLIANCE ASSESSMENT SUMMARY (High-Value Metric Box)
  const isHighReady = scoreVal >= 80;
  const isActionNeeded = scoreVal < 80;
  doc.setFillColor(isHighReady ? 240 : 254, isHighReady ? 253 : 243, isHighReady ? 244 : 199);
  doc.setDrawColor(isHighReady ? 187 : 245, isHighReady ? 247 : 158, isHighReady ? 208 : 11);
  doc.roundedRect(margin, y, contentWidth, 13, 1.5, 1.5, 'FD');

  // Readiness Score Badge
  doc.setFillColor(isHighReady ? 22 : 180, isHighReady ? 101 : 83, isHighReady ? 52 : 9);
  doc.roundedRect(margin + 2.5, y + 2, 28, 9, 1, 1, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(255, 255, 255);
  doc.text(`${scoreVal}%`, margin + 16.5, y + 6.5, { align: 'center' });
  doc.setFontSize(5);
  doc.text('READINESS SCORE', margin + 16.5, y + 9.5, { align: 'center' });

  // Readiness Breakdown Details
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);
  doc.text(
    `OVERALL STATUS: ${statusVal.toUpperCase()}  •  ${readiness.completedCount} OF ${readiness.totalCount} CLEARANCES READY`,
    margin + 34,
    y + 4.8
  );

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.8);
  doc.setTextColor(71, 85, 105);
  const mandNotice = readiness.missingMandatoryCount === 0
    ? 'All mandatory immigration & health documents verified.'
    : `Attention: ${readiness.missingMandatoryCount} mandatory requirement(s) pending completion.`;
  const yfNotice = profile.hasYellowFeverVax ? 'Yellow Fever: Verified Lifetime' : 'Yellow Fever: Required at Port Health';
  doc.text(`${mandNotice}  |  ${yfNotice}`, margin + 34, y + 9.2);

  y += 15.5;

  // 5. Section: Traveler Particulars & Next of Kin
  doc.setFillColor(239, 246, 255); // soft blue/slate
  doc.rect(margin, y, contentWidth, 5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.8);
  doc.setTextColor(30, 58, 138);
  doc.text('1. PASSENGER IDENTITY, PURPOSE OF TRAVEL & NEXT OF KIN (* REQUIRED BY IMMIGRATION)', margin + 2.5, y + 3.6);
  y += 6.5;

  // Draw 2-column key-value grid
  const drawRow = (label1: string, val1: string, isReq1: boolean, label2: string, val2: string, isReq2: boolean) => {
    const colWidth = contentWidth / 2;
    const x1 = margin + 2;
    const x2 = margin + colWidth + 2;

    // Field 1
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.8);
    doc.setTextColor(71, 85, 105);
    doc.text(label1, x1, y);
    if (isReq1) {
      doc.setTextColor(210, 16, 52);
      doc.text(' *', x1 + doc.getTextWidth(label1), y);
    }
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(7.8);
    doc.text(val1 || 'Not Specified', x1, y + 3.6);

    // Field 2
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.8);
    doc.setTextColor(71, 85, 105);
    doc.text(label2, x2, y);
    if (isReq2) {
      doc.setTextColor(210, 16, 52);
      doc.text(' *', x2 + doc.getTextWidth(label2), y);
    }
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(7.8);
    doc.text(val2 || 'Not Specified', x2, y + 3.6);

    y += 8;
  };

  drawRow(
    'FULL PASSENGER NAME',
    safeFullName,
    true,
    'NATIONALITY',
    profile.nationality || 'Not specified',
    true
  );

  drawRow(
    'GENDER',
    profile.gender || 'Prefer not to say',
    true,
    'PRIMARY CONTACT PHONE',
    `${profile.countryCode || '+256'} ${profile.phoneNumber || 'Not provided'}`,
    true
  );

  drawRow(
    'PURPOSE OF TRAVEL',
    (profile.travelPurpose || 'tourism').toUpperCase(),
    true,
    'DESTINATION IN UGANDA',
    profile.destination || 'Entebbe & Kampala',
    false
  );

  drawRow(
    'PASSPORT / TRAVEL DOC NO.',
    profile.passportNumber ? `${profile.passportNumber} (Expires: ${profile.passportExpiryDate || 'Valid'})` : 'Recorded on arrival',
    false,
    'ESTIMATED STAY DURATION',
    `${profile.stayDurationDays || 14} Days (Party: ${(profile.travellerType || 'solo').toUpperCase()})`,
    false
  );

  drawRow(
    'NEXT OF KIN FULL NAME',
    profile.emergencyContactName || 'Not recorded',
    true,
    'NEXT OF KIN CONTACT PHONE',
    profile.emergencyContactPhone ? `${profile.emergencyContactPhone} (${profile.emergencyContactRelation || 'Family'})` : 'Not recorded',
    true
  );

  y += 1;

  // 6. Section: Document Checklist & Border Readiness Verification
  doc.setFillColor(240, 253, 244); // soft green
  doc.rect(margin, y, contentWidth, 5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.8);
  doc.setTextColor(22, 101, 52);
  doc.text('2. OFFICIAL DOCUMENT READINESS & HEALTH CLEARANCES CHECKLIST', margin + 2.5, y + 3.6);
  y += 6.5;

  // Table header
  doc.setFillColor(226, 232, 240);
  doc.rect(margin, y, contentWidth, 5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.8);
  doc.setTextColor(51, 65, 85);
  doc.text('DOCUMENT / CLEARANCE', margin + 2, y + 3.4);
  doc.text('MANDATORY', margin + 70, y + 3.4);
  doc.text('DOCUMENT REF / VALIDITY', margin + 100, y + 3.4);
  doc.text('STATUS', margin + 160, y + 3.4);
  y += 5.5;

  const defaultItems: ChecklistItem[] = [
    {
      id: 'doc-passport',
      title: 'Valid Passport (>6 months validity)',
      mandatory: true,
      docNumber: profile.passportNumber || 'Recorded in profile',
      expiryDate: profile.passportExpiryDate || 'Valid',
      status: 'complete',
      category: 'passport',
      description: '',
    },
    {
      id: 'doc-yellow-fever',
      title: 'Yellow Fever Vaccination Card',
      mandatory: true,
      docNumber: profile.hasYellowFeverVax ? 'Verified' : 'Pending',
      expiryDate: 'Lifetime Immunity',
      status: profile.hasYellowFeverVax ? 'complete' : 'missing',
      category: 'health',
      description: '',
    },
    {
      id: 'doc-visa',
      title: 'Uganda e-Visa or EAC Free Movement',
      mandatory: true,
      docNumber: 'EAC Visa Waiver / e-Visa',
      expiryDate: 'Entry date',
      status: 'complete',
      category: 'visa',
      description: '',
    },
    {
      id: 'doc-return-ticket',
      title: 'Return/Onward Ticket Proof',
      mandatory: false,
      docNumber: profile.hasReturnTicket ? 'Confirmed' : 'Optional',
      expiryDate: 'N/A',
      status: profile.hasReturnTicket ? 'complete' : 'missing',
      category: 'travel',
      description: '',
    },
    {
      id: 'doc-accommodation',
      title: 'Proof of Accommodation / Host Address',
      mandatory: false,
      docNumber: profile.hasAccommodationProof ? 'Confirmed' : 'Optional',
      expiryDate: 'N/A',
      status: profile.hasAccommodationProof ? 'complete' : 'missing',
      category: 'supporting',
      description: '',
    },
  ];

  const itemsToPrint = checklist && checklist.length > 0 ? checklist : defaultItems;

  itemsToPrint.forEach((item, index) => {
    // Check if we need page break
    if (y + 6 > pageHeight - 45) {
      doc.addPage();
      y = 14;
    }

    // Zebra background
    if (index % 2 === 0) {
      doc.setFillColor(248, 250, 252);
      doc.rect(margin, y, contentWidth, 5.2, 'F');
    }

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.8);
    doc.setTextColor(15, 23, 42);

    // Title truncated if too long
    const title = item.title.length > 38 ? item.title.substring(0, 36) + '..' : item.title;
    doc.text(title, margin + 2, y + 3.6);

    // Mandatory
    doc.setFont('helvetica', item.mandatory ? 'bold' : 'normal');
    doc.setTextColor(item.mandatory ? 210 : 100, item.mandatory ? 16 : 116, item.mandatory ? 52 : 139);
    doc.text(item.mandatory ? 'YES *' : 'Optional', margin + 70, y + 3.6);

    // Doc number / expiry
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    const ref = item.docNumber ? `${item.docNumber} ${item.expiryDate ? '(' + item.expiryDate + ')' : ''}` : 'Verified upon arrival';
    const truncatedRef = ref.length > 30 ? ref.substring(0, 28) + '..' : ref;
    doc.text(truncatedRef, margin + 100, y + 3.6);

    // Status badge
    const isComplete = item.status === 'complete';
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(isComplete ? 22 : 180, isComplete ? 101 : 83, isComplete ? 52 : 9);
    doc.text(isComplete ? 'READY ✓' : 'PENDING ✕', margin + 160, y + 3.6);

    y += 5.2;
  });

  y += 2.5;

  // 7. Section: Border Inspection Protocols
  if (y + 20 > pageHeight - 45) {
    doc.addPage();
    y = 14;
  }

  doc.setFillColor(254, 243, 199); // amber background
  doc.rect(margin, y, contentWidth, 4.8, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.2);
  doc.setTextColor(146, 64, 14);
  doc.text('3. OFFICIAL BORDER POST PROTOCOLS (MALABA / BUSIA / ENTEBBE OSBP)', margin + 2.5, y + 3.4);
  y += 6.5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.4);
  doc.setTextColor(71, 85, 105);
  doc.text('• Desk 1 - Port Health: Present original Yellow Fever Certificate & undergo non-invasive thermal health screening.', margin + 2.5, y);
  y += 3.2;
  doc.text('• Desk 2 - Immigration Clearance: Present Passport / EAC National ID, e-Visa approval letter or EAC free movement endorsement.', margin + 2.5, y);
  y += 3.2;
  doc.text('• Desk 3 - Customs & Luggage: Declare commercial merchandise, foreign currency over $10,000 USD, or telecommunication drones.', margin + 2.5, y);
  y += 5;

  // 8. Official Declaration & Signatures Box
  if (y + 30 > pageHeight - 15) {
    doc.addPage();
    y = 14;
  }

  doc.setDrawColor(203, 213, 225);
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(margin, y, contentWidth, 28, 1.5, 1.5, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(30, 41, 59);
  doc.text('PASSENGER SOLEMN DECLARATION', margin + 3.5, y + 4);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.2);
  doc.setTextColor(100, 116, 139);
  doc.text(
    'I solemnly declare that all personal particulars, nationality, contacts, purpose of travel, and next of kin information stated above are true.',
    margin + 3.5,
    y + 7.5
  );
  doc.text(
    'I acknowledge that falsification of border travel documents is an offense under the Uganda Citizenship and Immigration Control Act.',
    margin + 3.5,
    y + 10.8
  );

  // Signature lines
  const sigY = y + 21;
  doc.setDrawColor(148, 163, 184);
  doc.line(margin + 3.5, sigY, margin + 50, sigY);
  doc.setFontSize(5.8);
  doc.text('Passenger Signature / Date', margin + 3.5, sigY + 3.2);

  doc.line(margin + 62, sigY, margin + 115, sigY);
  doc.text('Port Health Officer Endorsement', margin + 62, sigY + 3.2);

  doc.line(margin + 128, sigY, margin + 180, sigY);
  doc.text('Immigration Stamp / Endorsement', margin + 128, sigY + 3.2);

  y += 31.5;

  // 9. Footer Notes & Security Hash
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6);
  doc.setTextColor(148, 163, 184);
  doc.text(
    `Pearl Travel Digital Border Readiness Verification System. Official Reference: ${refId}. Valid at Entebbe Airport, Malaba, Busia & Katuna OSBP.`,
    pageWidth / 2,
    y,
    { align: 'center' }
  );

  // Save the PDF
  const filename = `Uganda_Border_Readiness_Review_${refId}.pdf`;
  doc.save(filename);
};

