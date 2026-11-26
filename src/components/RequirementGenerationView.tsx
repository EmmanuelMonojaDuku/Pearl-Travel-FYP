import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import {
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Cpu,
  FileCheck,
  Compass,
  User,
  ArrowRight,
  Database,
  Lock,
} from 'lucide-react';
import { PearlTravelLogo } from './PearlTravelLogo';
import { Accordion } from './Accordion';
import { MandatoryDocsWarning } from './MandatoryDocsWarning';
import { BorderStepAccordion } from './BorderStepAccordion';
import { PassengerProfile, JourneyDetails } from '../types';

interface RequirementGenerationViewProps {
  profile: PassengerProfile;
  journey: JourneyDetails;
  onComplete: () => void;
}

const STEPS = [
  {
    number: 1,
    title: 'Validate Profile',
    summary: 'Verifying travel document type and nationality.',
    detail: 'Verifying travel document type, visa reciprocity, and residency exemptions.',
    eta: '15 s',
    authority: 'System',
    requiredDocs: ['Passport', 'Yellow Fever Certificate', 'Travel Insurance Certificate'],
  },
  {
    number: 2,
    title: 'Check Itinerary',
    summary: 'Loading clearance rules for the selected border point.',
    detail: 'Loading specific clearance rules for Malaba One-Stop Border Post (OSBP).',
    eta: '30 s',
    authority: 'System',
    requiredDocs: ['Passport', 'Yellow Fever Certificate', 'Travel Insurance Certificate'],
  },
  {
    number: 3,
    title: 'Run Requirement Engine',
    summary: 'Evaluating immigration statutes and health mandates.',
    detail: 'Evaluating Uganda DCIC immigration statutes, Yellow Fever mandates & URA customs.',
    eta: '45 s',
    authority: 'System',
    requiredDocs: ['Passport', 'Yellow Fever Certificate', 'Travel Insurance Certificate'],
  },
  {
    number: 4,
    title: 'Generate Checklist',
    summary: 'Creating personalised document checklist and QR summary.',
    detail: 'Generating readiness score, QR summary payload, and grounded guidance.',
    eta: '60 s',
    authority: 'System',
    requiredDocs: ['Passport', 'Yellow Fever Certificate', 'Travel Insurance Certificate'],
  },
];


export const RequirementGenerationView: React.FC<RequirementGenerationViewProps> = ({
  profile,
  journey,
  onComplete,
}) => {
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [progressPercent, setProgressPercent] = useState(15);

  useEffect(() => {
    const t1 = setTimeout(() => {
      setActiveStepIndex(1);
      setProgressPercent(40);
    }, 450);

    const t2 = setTimeout(() => {
      setActiveStepIndex(2);
      setProgressPercent(70);
    }, 950);

    const t3 = setTimeout(() => {
      setActiveStepIndex(3);
      setProgressPercent(95);
    }, 1450);

    const t4 = setTimeout(() => {
      setProgressPercent(100);
      onComplete();
    }, 2000);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, [onComplete]);

  return (
    <div className="w-full max-w-2xl mx-auto px-4 py-8">
      <div className="bg-pearl-dark rounded-2xl p-6 sm:p-8 border border-pearl-border text-center space-y-6">
        {/* Processing Icon */}
        <div className="mx-auto w-16 h-16 rounded-2xl bg-pearl-navy text-pearl-gold-light flex items-center justify-center ring-2 ring-pearl-gold/60">
          <Cpu className="w-8 h-8" />
        </div>

        {/* Header Text */}
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-pearl-text font-heading tracking-tight">
            Preparing your personalised travel requirements...
          </h2>
          <p className="text-xs sm:text-sm text-pearl-text-secondary mt-1.5 max-w-md mx-auto">
            Checking your profile and journey information for{' '}
            <span className="font-bold text-pearl-text">{profile.fullName}</span> ({profile.nationality}) via{' '}
            <span className="font-bold text-pearl-text">{journey.intendedBorderPoint}</span>.
          </p>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-pearl-surface rounded-lg h-2.5 overflow-hidden p-0.5 border border-pearl-border">
          <motion.div
            className="h-full rounded-md bg-pearl-gold"
            initial={{ width: '10%' }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 0.4 }}
          />
        </div>

        {/* Step-by-Step Processing Feed */}
        <div role="list" className="text-left space-y-2.5 bg-pearl-surface p-4 rounded-xl border border-pearl-border text-xs">
          {STEPS.map((step, idx) => {
            const isFinished = activeStepIndex > idx || progressPercent === 100;
            const isCurrent = activeStepIndex === idx && progressPercent < 100;
            return (
              <div
                key={step.title}
                role="listitem"
                tabIndex={0}
                aria-label={`Step ${step.number}: ${step.title}`}
                className={`flex flex-col sm:flex-row items-start gap-3 transition-opacity ${
                  isFinished ? 'text-pearl-text' : isCurrent ? 'text-pearl-text font-bold' : 'text-pearl-placeholder opacity-70'
                } focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pearl-gold`}
              >
                <div className="shrink-0 mt-0.5">
                  {isFinished ? (
                    <div className="w-4 h-4 rounded-full bg-pearl-success/15 text-pearl-text flex items-center justify-center">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    </div>
                  ) : isCurrent ? (
                    <div className="w-4 h-4 rounded-full border-2 border-pearl-gold border-t-transparent animate-spin" />
                  ) : (
                    <div className="w-4 h-4 rounded-full border border-pearl-border bg-pearl-input" />
                  )}
                </div>
                <div className="flex-1 space-y-1">
                  {/* Header row: number, title, ETA, authority */}
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-pearl-gold-light">{step.number}.</span>
                    <span className="font-bold">{step.title}</span>
                    <span className="text-xs text-pearl-text-secondary ml-2">{step.eta} • {step.authority}</span>
                  </div>
                  {/* Required documents warning */}
                  {step.requiredDocs && step.requiredDocs.length > 0 && (
                    <MandatoryDocsWarning docs={step.requiredDocs} />
                  )}
                  {/* Short summary */}
                  {step.summary && (
                    <p className="text-[11px] text-pearl-text-secondary font-normal">{step.summary}</p>
                  )}
                  {/* Accordion for full detail */}
                  <Accordion label="More details">
                    {step.detail}
                  </Accordion>
                </div>
              </div>
            );
          })}
        </div>

        {/* Conceptual Architecture Diagram */}
        <div className="p-4 rounded-xl bg-pearl-navy text-pearl-text text-left text-xs space-y-3 border border-pearl-dark">
          <div className="flex items-center justify-between pb-2 border-b border-pearl-dark text-[10px] uppercase font-bold tracking-wider text-pearl-placeholder">
            <span>Core System Architecture</span>
            <span className="text-pearl-gold-light">Rule-Based Execution</span>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-center text-[11px]">
            <div className="p-2.5 rounded-lg bg-pearl-dark border border-pearl-slate w-full sm:w-auto flex-1">
              <div className="font-bold text-pearl-gold-light">Passenger Profile</div>
              <div className="text-[10px] text-pearl-text-secondary">Identity &amp; Nationality</div>
            </div>
            <div className="text-pearl-placeholder font-bold sm:rotate-0 rotate-90">+</div>
            <div className="p-2.5 rounded-lg bg-pearl-dark border border-pearl-slate w-full sm:w-auto flex-1">
              <div className="font-bold text-pearl-gold-light">Journey Details</div>
              <div className="text-[10px] text-pearl-text-secondary">Malaba OSBP &amp; Purpose</div>
            </div>
          </div>

          <div className="flex justify-center my-1 text-pearl-gold">
            <ArrowRight className="w-4 h-4 rotate-90" />
          </div>

          <div className="p-2.5 rounded-lg bg-pearl-dark border border-pearl-gold/50 text-center">
            <div className="font-bold text-pearl-gold-light uppercase tracking-wider text-xs">
              Rule-Based Requirement Engine
            </div>
            <div className="text-[10px] text-pearl-text-secondary">
              Evaluates DCIC Immigration Statutes, Port Health &amp; URA Customs
            </div>
          </div>

          <div className="flex justify-center my-1 text-pearl-gold">
            <ArrowRight className="w-4 h-4 rotate-90" />
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-center text-[11px]">
            <div className="p-2.5 rounded-lg bg-pearl-dark border border-pearl-success/60 w-full sm:w-auto flex-1">
              <div className="font-bold text-pearl-success-light">Applicable Requirements</div>
              <div className="text-[10px] text-pearl-text-secondary">Visa, Health, Customs</div>
            </div>
            <div className="text-pearl-placeholder font-bold sm:rotate-0 rotate-90">&rarr;</div>
            <div className="p-2.5 rounded-lg bg-pearl-dark border border-pearl-success/60 w-full sm:w-auto flex-1">
              <div className="font-bold text-pearl-success-light">Personalised Checklist</div>
              <div className="text-[10px] text-pearl-text-secondary">Readiness Score &amp; QR</div>
            </div>
          </div>

          {/* Clarification Note */}
          <div className="pt-2 border-t border-pearl-dark text-[11px] text-pearl-text-secondary leading-relaxed">
            <strong className="text-pearl-text font-semibold">System Notice:</strong> The rule-based requirement engine deterministically evaluates applicable statutory requirements. The AI guidance assistant retrieves grounded explanations from the verified knowledge base.
          </div>
        </div>

        {/* Immediate Continue Button */}
        <button
          type="button"
          onClick={onComplete}
          className="w-full min-h-[44px] py-3 rounded-xl bg-pearl-gold hover:bg-pearl-gold-light text-pearl-text text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-colors"
        >
          <span>Open My Travel Dashboard</span>
          <ArrowRight className="w-4 h-4 text-pearl-text" />
        </button>
      </div>
    </div>
  );
};
