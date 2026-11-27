import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Compass,
  CheckCircle2,
  ChevronDown,
  Clock,
  FileCheck,
  ShieldCheck,
  Building2,
  UserCheck,
  Luggage,
  Truck,
  HeartPulse,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { JourneyDetails } from '../types';

import { MandatoryDocsWarning } from './MandatoryDocsWarning';

interface BorderStepByStepGuideCardProps {
  journey?: JourneyDetails | null;
  onShowToast: (msg: string) => void;
}

interface BorderStep {
  stepNumber: number;
  title: string;
  agency: string;
  icon: React.ComponentType<{ className?: string }>;
  summary: string;
  requiredDocuments: string[];
  officerAction: string;
  travelerTips: string;
}

const MALABA_STEPS: BorderStep[] = [
  {
    stepNumber: 1,
    title: 'Port Health',
    agency: 'Ministry of Health',
    icon: HeartPulse,

    summary: 'Temperature check and Yellow Fever card.',
    requiredDocuments: ['WHO Yellow Card (International Certificate of Vaccination)', 'Medical Exemption Letter (if applicable)'],
    officerAction: 'Health officer verifies that the vaccine was administered at least 10 days prior and stamps the physical health slip.',
    travelerTips: 'Keep your physical Yellow Card at the top of your pouch. Laminated or official original cards only.',
  },
  {
    stepNumber: 2,
    title: 'Document check',
    agency: 'Joint border desk',
    icon: UserCheck,

    summary: 'Passport, EAC ID or Interstate Pass.',
    requiredDocuments: ['Valid Passport (6+ months validity) or EAC National ID', 'Printed eVisa Approval Letter (for visa-required visitors)'],
    officerAction: 'Officer verifies document authenticity, scans the machine-readable zone (MRZ), and checks for valid entry clearance.',
    travelerTips: 'Ensure your passport has at least 2 consecutive blank pages for immigration stamps.',
  },
  {
    stepNumber: 3,
    title: 'Biometrics',
    agency: 'Uganda Immigration (DCIC)',
    icon: ShieldCheck,

    summary: 'Fingerprints, photo and entry stamp.',
    requiredDocuments: ['Passport / ID', 'Address of accommodation or host contact phone in Uganda'],
    officerAction: 'Officer captures fingerprints and facial image, issues the visitor pass or visa endorsement sticker, and stamps entry date.',
    travelerTips: 'State your intended duration of stay clearly and matching your return ticket or tour schedule.',
  },
  {
    stepNumber: 4,
    title: 'Customs',
    agency: 'Uganda Revenue Authority',
    icon: Luggage,

    summary: 'Bag scan and cash declaration.',
    requiredDocuments: ['Customs Declaration Form (if carrying goods or cash over $10,000 USD)', 'Purchase receipts for high-value electronics'],
    officerAction: 'Customs officers monitor the conveyor X-ray scanner and conduct random physical inspection of suspect parcels.',
    travelerTips: 'Do NOT bring civilian drones without prior Ministry of Defence clearance. Declare large commercial samples upfront.',
  },
  {
    stepNumber: 5,
    title: 'Vehicle permit',
    agency: 'URA logistics desk',
    icon: Truck,

    summary: 'For cars, vans and trucks only.',
    requiredDocuments: ['Original Vehicle Logbook', 'COMESA Yellow Card Insurance', 'Driver’s License', 'Owner Authorization Letter'],
    officerAction: 'Customs officer inspects chassis and engine numbers, collects nominal road fee (~20,000 UGX), and issues Temporary Movement Permit.',
    travelerTips: 'Passengers traveling by cross-border bus (e.g. Mash POA, Tahmeed) wait in the passenger lounge while conductors clear the bus.',
  },
  {
    stepNumber: 6,
    title: 'Exit gate',
    agency: 'Border security post',
    icon: Building2,

    summary: 'Last check, then you are in Uganda.',
    requiredDocuments: ['Stamped Passport with Entry Date Stamp', 'Gate Pass Slip'],
    officerAction: 'Gate sentry verifies entry stamp on passport and opens the security barrier into Tororo / Kampala highway.',
    travelerTips: 'Exchange currency only at licensed commercial bank forex bureaus inside the OSBP terminal, not street touts.',
  },
];

export const BorderStepByStepGuideCard: React.FC<BorderStepByStepGuideCardProps> = ({
  journey,
  onShowToast,
}) => {
  const [expandedStep, setExpandedStep] = useState<number>(1);
  const borderPointName = journey?.intendedBorderPoint || 'Malaba One-Stop Border Post (OSBP)';

  return (
    <div className="bg-pearl-dark rounded-2xl p-5 sm:p-6 border border-pearl-border space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-pearl-border">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-pearl-navy text-pearl-accent flex items-center justify-center shrink-0">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-bold text-pearl-text uppercase tracking-wide font-heading">
                Border Guide
              </h3>
            </div>
            <p className="text-[11px] text-pearl-text-secondary font-medium">{borderPointName}</p>
          </div>
        </div>

        <div className="px-3 py-1.5 rounded-lg bg-pearl-surface border border-pearl-border text-pearl-text text-xs font-bold flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-pearl-success-light" />
          <span>Open 24/7</span>
        </div>
      </div>

      {/* Overview Banner */}
      <div className="p-4 rounded-xl bg-pearl-navy text-pearl-text flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs border border-pearl-border">
        <div>
          <span className="text-pearl-accent font-bold uppercase text-[10px] tracking-wider block">
            The One-Stop Border Post Concept
          </span>
          <p className="text-pearl-text-secondary text-[11px] mt-0.5 leading-relaxed">
            You only stop ONCE on the Ugandan side of the border. Kenya exit and Uganda entry officers sit side-by-side in the same clearance hall.
          </p>
        </div>
        <div className="px-3 py-2 rounded-lg bg-pearl-dark border border-pearl-border shrink-0 text-center">
          <span className="block text-[9px] uppercase text-pearl-placeholder font-bold">Total Est. Clearance</span>
          <span className="font-mono font-bold text-sm text-pearl-accent tabular-nums">25 - 45 mins</span>
        </div>
      </div>

      {/* Step by Step Timeline */}
      <div className="space-y-3">
        {MALABA_STEPS.map((step) => {
          const isExpanded = expandedStep === step.stepNumber;

          return (
            <div
              key={step.stepNumber}
              className={`rounded-xl border transition-colors ${
                isExpanded
                  ? 'bg-pearl-input border-pearl-border/40'
                  : 'bg-pearl-surface border-pearl-border hover:border-pearl-border/30'
              }`}
            >
              <button
                type="button"
                onClick={() => setExpandedStep(isExpanded ? 0 : step.stepNumber)}
                className="w-full p-3.5 flex items-center justify-between gap-3 text-left cursor-pointer"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center font-mono font-bold text-xs shrink-0 tabular-nums ${
                      isExpanded
                        ? 'bg-pearl-gold text-pearl-navy font-bold'
                        : 'bg-pearl-dark text-pearl-text border border-pearl-border'
                    }`}
                  >
                    {step.stepNumber}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-xs font-bold text-pearl-text">{step.title}</h4>
                      <span className="text-[10px] font-semibold text-pearl-placeholder hidden sm:inline">
                        • {step.agency}
                      </span>
                    </div>
                    <p className="text-[11px] text-pearl-text-secondary line-clamp-1">{step.summary}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">

                  <ChevronDown
                    className={`w-4 h-4 text-pearl-placeholder transition-transform ${
                      isExpanded ? 'rotate-180 text-pearl-text' : ''
                    }`}
                  />
                </div>
              </button>

              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden border-t border-pearl-border p-4 pt-3 space-y-3 text-xs"
                  >
                    <div>
                      <span className="text-[10px] font-bold uppercase text-pearl-placeholder block mb-1.5">
                        Required Documents for this Desk
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {step.requiredDocuments.map((doc) => (
                          <span
                            key={doc}
                            className="px-2.5 py-1 rounded-lg bg-pearl-surface border border-pearl-border text-pearl-text text-[11px] font-semibold flex items-center gap-1.5"
                          >
                            <FileCheck className="w-3 h-3 text-pearl-accent" />
                            {doc}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-pearl-surface border border-pearl-border space-y-1">
                      <span className="text-[10px] font-bold uppercase text-pearl-text block">
                        What Happens at the Counter
                      </span>
                      <p className="text-pearl-text-secondary leading-relaxed">{step.officerAction}</p>
                    </div>

                    <div className="p-3 rounded-xl bg-pearl-surface border border-pearl-gold/50 text-pearl-text flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-pearl-accent shrink-0 mt-0.5" />
                      <div>
                        <strong className="font-bold">Traveller Tip: </strong>
                        <span>{step.travelerTips}</span>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
};
