import React, { useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Download,
  Printer,
  FileText,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  User,
  Phone,
  Globe,
  Compass,
  HeartHandshake,
  Check,
  Copy,
  ExternalLink,
  Sparkles,
  Award,
} from 'lucide-react';
import { PassengerProfile, ChecklistItem } from '../types';
import { downloadReviewDocumentPdf } from '../utils/generateReviewPdf';
import { calculateReadinessScore } from '../data/travelRequirementsEngine';
import { PearlTravelLogo } from './PearlTravelLogo';

interface ReviewDocumentDownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: PassengerProfile;
  checklist?: ChecklistItem[];
  onShowToast?: (msg: string) => void;
}

export const ReviewDocumentDownloadModal: React.FC<ReviewDocumentDownloadModalProps> = ({
  isOpen,
  onClose,
  profile,
  checklist = [],
  onShowToast,
}) => {
  const printableRef = useRef<HTMLDivElement>(null);

  const readiness = useMemo(() => {
    return calculateReadinessScore(checklist);
  }, [checklist]);

  if (!isOpen) return null;

  const safeFullName = (profile.fullName || `${profile.firstName || ''} ${profile.lastName || ''}`).trim() || 'Valued Passenger';
  const refId = `EBB-${Math.abs(safeFullName.split('').reduce((a, b) => a + b.charCodeAt(0), 0) * 137).toString().padStart(6, '0')}`;
  const currentDate = new Date().toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  // Check mandatory constraints
  const mandatoryChecks = {
    hasName: Boolean(profile.fullName?.trim() || profile.firstName?.trim()),
    hasNationality: Boolean(profile.nationality?.trim()),
    hasGender: Boolean(profile.gender && profile.gender.trim()),
    hasContact: Boolean(profile.phoneNumber?.trim()),
    hasPurpose: Boolean(profile.travelPurpose),
    hasNextOfKinName: Boolean(profile.emergencyContactName?.trim()),
    hasNextOfKinPhone: Boolean(profile.emergencyContactPhone?.trim()),
  };

  const allMandatorySatisfied = Object.values(mandatoryChecks).every(Boolean);

  const handleDownloadPdf = () => {
    try {
      downloadReviewDocumentPdf(profile, checklist, {
        referenceId: refId,
        generatedAt: currentDate,
      });
      if (onShowToast) {
        onShowToast(`Downloaded review PDF: Uganda_Border_Readiness_Review_${refId}.pdf`);
      }
    } catch (err) {
      console.error('Failed to download PDF', err);
      if (onShowToast) {
        onShowToast('Could not generate PDF. Please try the Print option.');
      }
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(
      JSON.stringify({
        officialReference: refId,
        documentType: 'Uganda Border Clearance & Readiness Review Document',
        issuedAt: new Date().toISOString(),
        passenger: {
          name: safeFullName,
          nationality: profile.nationality,
          gender: profile.gender,
          contactPhone: `${profile.countryCode || '+256'} ${profile.phoneNumber || ''}`,
          purposeOfTravel: profile.travelPurpose,
          destination: profile.destination,
          nextOfKin: {
            name: profile.emergencyContactName,
            phone: profile.emergencyContactPhone,
            relationship: profile.emergencyContactRelation,
          },
        },
        documentChecklist: checklist.map(c => ({
          title: c.title,
          category: c.category,
          mandatory: c.mandatory,
          status: c.status,
          docNumber: c.docNumber,
          expiryDate: c.expiryDate,
        })),
      }, null, 2)
    );
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `Uganda_Readiness_Audit_${refId}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    if (onShowToast) {
      onShowToast('Downloaded digital audit record (JSON).');
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-pearl-scrim/60 backdrop-blur-sm overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2 }}
          className="bg-pearl-dark w-full max-w-4xl rounded-3xl shadow-2xl border border-pearl-border overflow-hidden flex flex-col max-h-[92vh] my-auto"
        >
          {/* Header Action Bar */}
          <div className="px-5 sm:px-6 py-4 bg-pearl-navy text-pearl-text flex items-center justify-between border-b border-pearl-border shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-pearl-danger/20 border border-pearl-danger flex items-center justify-center text-pearl-danger-light">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-extrabold text-pearl-text flex items-center gap-2">
                  <span>Official Clearance Review Document</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-pearl-gold text-pearl-navy">
                    PDF & Download
                  </span>
                </h3>
                <p className="text-xs text-pearl-placeholder">
                  Ready for Uganda Immigration & Port Health Border Presentation
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                id="btn-close-review-doc-top"
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-pearl-dark hover:bg-pearl-surface text-pearl-text-secondary hover:text-pearl-text flex items-center justify-center transition-colors cursor-pointer"
                title="Close review document"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Quick Action Toolbar */}
          <div className="px-5 sm:px-6 py-3 bg-pearl-surface border-b border-pearl-border flex flex-wrap items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-xs text-pearl-text-secondary font-semibold">
                Ref: <strong className="text-pearl-text">{refId}</strong>
              </span>
              {allMandatorySatisfied ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-pearl-success-light bg-pearl-success/15 px-2.5 py-0.5 rounded-full">
                  <Check className="w-3 h-3" /> All Mandatory Fields Entered
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-pearl-accent bg-pearl-gold/10 px-2.5 py-0.5 rounded-full">
                  <AlertTriangle className="w-3 h-3 text-pearl-accent" /> Some Mandatory Fields Need Attention
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                id="btn-download-pdf-primary"
                onClick={handleDownloadPdf}
                className="px-4 py-2 rounded-full text-xs font-bold bg-pearl-danger text-pearl-text hover:bg-pearl-danger transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-95"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download PDF</span>
              </button>

              <button
                type="button"
                id="btn-print-review-doc"
                onClick={handlePrint}
                className="px-3.5 py-2 rounded-full text-xs font-bold bg-pearl-dark text-pearl-text border border-pearl-border hover:bg-pearl-surface transition-colors flex items-center gap-1.5 cursor-pointer"
                title="Print or Save as PDF using browser dialog"
              >
                <Printer className="w-3.5 h-3.5 text-pearl-text-secondary" />
                <span className="hidden sm:inline">Print / Save as PDF</span>
                <span className="sm:hidden">Print</span>
              </button>

              <button
                type="button"
                id="btn-download-json-audit"
                onClick={handleDownloadJson}
                className="px-3 py-2 rounded-full text-xs font-bold bg-pearl-dark text-pearl-text-secondary border border-pearl-border hover:bg-pearl-surface transition-colors flex items-center gap-1.5 cursor-pointer"
                title="Download JSON record"
              >
                <FileText className="w-3.5 h-3.5 text-pearl-placeholder" />
                <span className="hidden md:inline">JSON</span>
              </button>
            </div>
          </div>

          {/* Printable Document Preview Area */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-pearl-surface flex justify-center">
            <div
              ref={printableRef}
              id="printable-review-document"
              className="document-paper w-full max-w-2xl bg-pearl-dark rounded-2xl shadow-md border border-pearl-border p-6 sm:p-8 space-y-6 text-pearl-text print:shadow-none print:border-none print:p-0 print:m-0"
            >
              {/* Uganda Flag Stripes */}
              <div className="h-2 rounded-t-lg overflow-hidden flex -mt-2 -mx-2 mb-4">
                <div className="flex-1 bg-black" />
                <div className="flex-1 bg-[#FCD116]" />
                <div className="flex-1 bg-[#D21034]" />
              </div>

              {/* Official Document Header */}
              <div className="text-center pb-4 border-b border-pearl-border">
                <div className="flex justify-center mb-2">
                  <PearlTravelLogo size="sm" />
                </div>
                <h2 className="text-base sm:text-lg font-black tracking-wide text-pearl-text uppercase">
                  The Republic of Uganda
                </h2>
                <p className="text-xs font-semibold text-pearl-text-secondary uppercase tracking-wider">
                  Ministry of Internal Affairs • Directorate of Citizenship & Immigration Control
                </p>
                <p className="text-[11px] text-pearl-placeholder">
                  Port Health & Land Border Control Points: Malaba OSBP • Busia OSBP • Entebbe International Airport
                </p>
                <div className="mt-3 inline-block px-4 py-1.5 rounded-full bg-pearl-navy text-pearl-text text-xs font-black uppercase tracking-wider">
                  Border Readiness & Passenger Particulars Review
                </div>
              </div>

              {/* Reference & Metadata Bar */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 rounded-xl bg-pearl-surface border border-pearl-border text-xs">
                <div>
                  <span className="block text-[10px] uppercase text-pearl-placeholder font-bold">Reference ID</span>
                  <span className="font-mono font-bold text-pearl-text">{refId}</span>
                </div>
                <div>
                  <span className="block text-[10px] uppercase text-pearl-placeholder font-bold">Review Date</span>
                  <span className="font-bold text-pearl-text">{currentDate.split(',')[0]}</span>
                </div>
                <div>
                  <span className="block text-[10px] uppercase text-pearl-placeholder font-bold">Clearance Format</span>
                  <span className="font-bold text-pearl-text">Pass-Ready</span>
                </div>
                <div>
                  <span className="block text-[10px] uppercase text-pearl-placeholder font-bold">Official Seal</span>
                  <span className="font-bold text-pearl-success-light">Verified System</span>
                </div>
              </div>

              {/* SECTION 1: MANDATORY PASSENGER IDENTIFICATION & NEXT OF KIN */}
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-pearl-border pb-1.5">
                  <h3 className="text-xs font-black uppercase text-pearl-text-secondary flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-pearl-text-secondary" />
                    <span>1. Mandatory Border Identification & Next of Kin</span>
                  </h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-pearl-danger/15 text-pearl-danger-light">
                    * Required by Uganda Immigration
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  {/* Full Name */}
                  <div className="p-2.5 rounded-xl bg-pearl-surface border border-pearl-border">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-[10px] font-bold uppercase text-pearl-placeholder">Full Name</span>
                      <span className="text-[10px] font-black text-pearl-danger-light">* Mandatory</span>
                    </div>
                    <div className="text-sm font-bold text-pearl-text">{safeFullName}</div>
                  </div>

                  {/* Nationality */}
                  <div className="p-2.5 rounded-xl bg-pearl-surface border border-pearl-border">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-[10px] font-bold uppercase text-pearl-placeholder">Nationality</span>
                      <span className="text-[10px] font-black text-pearl-danger-light">* Mandatory</span>
                    </div>
                    <div className="text-sm font-bold text-pearl-text">{profile.nationality || 'Not Specified'}</div>
                  </div>

                  {/* Gender */}
                  <div className="p-2.5 rounded-xl bg-pearl-surface border border-pearl-border">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-[10px] font-bold uppercase text-pearl-placeholder">Gender</span>
                      <span className="text-[10px] font-black text-pearl-danger-light">* Mandatory</span>
                    </div>
                    <div className="text-sm font-bold text-pearl-text">{profile.gender || 'Prefer not to say'}</div>
                  </div>

                  {/* Contact Number */}
                  <div className="p-2.5 rounded-xl bg-pearl-surface border border-pearl-border">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-[10px] font-bold uppercase text-pearl-placeholder">Contact Number</span>
                      <span className="text-[10px] font-black text-pearl-danger-light">* Mandatory</span>
                    </div>
                    <div className="text-sm font-bold text-pearl-text">
                      {profile.phoneNumber ? `${profile.countryCode || '+256'} ${profile.phoneNumber}` : 'Not provided'}
                    </div>
                  </div>

                  {/* Purpose of Travel */}
                  <div className="p-2.5 rounded-xl bg-pearl-surface border border-pearl-border">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-[10px] font-bold uppercase text-pearl-placeholder">Purpose of Travel</span>
                      <span className="text-[10px] font-black text-pearl-danger-light">* Mandatory</span>
                    </div>
                    <div className="text-sm font-bold text-pearl-text capitalize">
                      {profile.travelPurpose || 'tourism'}
                    </div>
                  </div>

                  {/* Next of Kin Contact */}
                  <div className="p-2.5 rounded-xl bg-pearl-danger/10 border border-pearl-border">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-[10px] font-bold uppercase text-pearl-danger-light">Next of Kin / Kin Contact</span>
                      <span className="text-[10px] font-black text-pearl-danger-light">* Mandatory</span>
                    </div>
                    <div className="text-sm font-bold text-pearl-text">
                      {profile.emergencyContactName || 'Not recorded'}
                    </div>
                    <div className="text-xs text-pearl-text-secondary mt-0.5 font-medium">
                      Phone: <strong className="text-pearl-text">{profile.emergencyContactPhone || 'Not recorded'}</strong>
                      {profile.emergencyContactRelation && ` (${profile.emergencyContactRelation})`}
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION 2: OPTIONAL & LOGISTICAL TRAVEL DETAILS */}
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-pearl-border pb-1.5">
                  <h3 className="text-xs font-black uppercase text-pearl-text flex items-center gap-1.5">
                    <Compass className="w-3.5 h-3.5 text-pearl-text-secondary" />
                    <span>2. Travel Logistics & Auxiliary Information</span>
                  </h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-pearl-surface text-pearl-text-secondary">
                    Optional Details
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
                  <div className="p-2 rounded-lg bg-pearl-surface">
                    <span className="block text-[10px] text-pearl-placeholder uppercase">Destination</span>
                    <span className="font-semibold text-pearl-text">{profile.destination || 'Uganda'}</span>
                  </div>
                  <div className="p-2 rounded-lg bg-pearl-surface">
                    <span className="block text-[10px] text-pearl-placeholder uppercase">Traveler Type</span>
                    <span className="font-semibold text-pearl-text capitalize">{profile.travellerType || 'solo'}</span>
                  </div>
                  <div className="p-2 rounded-lg bg-pearl-surface">
                    <span className="block text-[10px] text-pearl-placeholder uppercase">Stay Duration</span>
                    <span className="font-semibold text-pearl-text">{profile.stayDurationDays || 14} Days</span>
                  </div>
                  <div className="p-2 rounded-lg bg-pearl-surface">
                    <span className="block text-[10px] text-pearl-placeholder uppercase">Passport Reference</span>
                    <span className="font-semibold text-pearl-text">{profile.passportNumber || 'On arrival'}</span>
                  </div>
                  <div className="p-2 rounded-lg bg-pearl-surface">
                    <span className="block text-[10px] text-pearl-placeholder uppercase">Email</span>
                    <span className="font-semibold text-pearl-text truncate block">{profile.email || 'N/A'}</span>
                  </div>
                  <div className="p-2 rounded-lg bg-pearl-surface">
                    <span className="block text-[10px] text-pearl-placeholder uppercase">Photo / Avatar</span>
                    <span className="font-semibold text-pearl-text">{profile.avatarUrl ? 'Photo Uploaded' : 'Optional (None)'}</span>
                  </div>
                </div>
              </div>

              {/* SECTION 3: DOCUMENT READINESS & HEALTH VERIFICATION */}
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-pearl-success/30 pb-1.5">
                  <h3 className="text-xs font-black uppercase text-pearl-success-light flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-pearl-success-light" />
                    <span>3. Official Entry Document Verification</span>
                  </h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-pearl-success/15 text-pearl-success-light">
                    Port Health & Immigration
                  </span>
                </div>

                <div className="border border-pearl-border rounded-xl overflow-hidden text-xs">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-pearl-surface text-pearl-text-secondary text-[10px] uppercase font-bold">
                        <th className="p-2.5">Document Requirement</th>
                        <th className="p-2.5">Rule</th>
                        <th className="p-2.5">Reference / Expiry</th>
                        <th className="p-2.5 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {checklist.slice(0, 5).map((item) => (
                        <tr key={item.id} className="hover:bg-pearl-surface">
                          <td className="p-2.5 font-bold text-pearl-text">{item.title}</td>
                          <td className="p-2.5">
                            {item.mandatory ? (
                              <span className="text-[10px] font-bold text-pearl-danger-light bg-pearl-danger/15 px-1.5 py-0.5 rounded">
                                Mandatory *
                              </span>
                            ) : (
                              <span className="text-[10px] text-pearl-placeholder">Optional</span>
                            )}
                          </td>
                          <td className="p-2.5 text-pearl-text-secondary">
                            {item.docNumber ? `${item.docNumber} (${item.expiryDate || 'Valid'})` : 'Physical document at border'}
                          </td>
                          <td className="p-2.5 text-right">
                            {item.status === 'complete' ? (
                              <span className="font-bold text-pearl-success-light bg-pearl-success/15 px-2 py-0.5 rounded-full text-[10px]">
                                Ready ✓
                              </span>
                            ) : (
                              <span className="font-bold text-pearl-accent bg-pearl-gold/10 px-2 py-0.5 rounded-full text-[10px]">
                                Pending
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Official Border Declaration & Signature Block */}
              <div className="p-4 rounded-xl border-2 border-dashed border-pearl-border space-y-4">
                <div>
                  <h4 className="text-xs font-bold text-pearl-text uppercase">Passenger Declaration</h4>
                  <p className="text-[11px] text-pearl-text-secondary leading-relaxed mt-0.5">
                    I solemnly declare that the particulars entered above, including my identity, nationality, purpose of travel,
                    and next of kin contact information, are accurate. I understand that misrepresentation to an Immigration Officer
                    constitutes an offense under Uganda Citizenship and Immigration Control laws.
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-4 pt-4 border-t border-pearl-border text-[10px] text-pearl-placeholder">
                  <div className="border-t border-pearl-text-secondary pt-1 text-center">
                    <span className="block font-bold text-pearl-text-secondary">Passenger Signature</span>
                    <span>Date: {currentDate.split(',')[0]}</span>
                  </div>
                  <div className="border-t border-pearl-text-secondary pt-1 text-center">
                    <span className="block font-bold text-pearl-text-secondary">Port Health Official</span>
                    <span>Stamp / Approval</span>
                  </div>
                  <div className="border-t border-pearl-text-secondary pt-1 text-center">
                    <span className="block font-bold text-pearl-text-secondary">Immigration Official</span>
                    <span>Malaba / Busia / EBB</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="px-5 sm:px-6 py-4 bg-pearl-dark border-t border-pearl-border flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
            <div className="text-xs text-pearl-placeholder text-center sm:text-left">
              You can present this downloaded PDF or printout directly at Port Health and Immigration desks.
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                id="btn-close-review-doc-bottom"
                onClick={onClose}
                className="w-full sm:w-auto px-4 py-2 rounded-full text-xs font-bold bg-pearl-surface text-pearl-text-secondary hover:bg-pearl-surface transition-colors cursor-pointer"
              >
                Close Preview
              </button>

              <button
                type="button"
                id="btn-download-pdf-footer"
                onClick={handleDownloadPdf}
                className="w-full sm:w-auto px-5 py-2 rounded-full text-xs font-bold bg-pearl-danger text-pearl-text hover:bg-pearl-danger transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-md active:scale-95"
              >
                <Download className="w-4 h-4" />
                <span>Download Official PDF</span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
