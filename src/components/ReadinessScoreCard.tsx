import React from 'react';
import { motion } from 'motion/react';
import { CheckCircle2, AlertTriangle, XCircle, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';
import { ChecklistItem } from '../types';

interface ReadinessScoreCardProps {
  score: number;
  completedCount: number;
  totalCount: number;
  missingMandatoryCount: number;
  missingItems: ChecklistItem[];
  onFocusChecklist?: () => void;
  onOpenQR?: () => void;
}

export const ReadinessScoreCard: React.FC<ReadinessScoreCardProps> = ({
  score,
  completedCount,
  totalCount,
  missingMandatoryCount,
  missingItems,
  onFocusChecklist,
  onOpenQR,
}) => {
  // Determine color scheme based on score
  const isComplete = score === 100 && missingMandatoryCount === 0;
  const isModerate = score >= 70 && score < 100;
  const isCritical = score < 70;

  // Arc gauge calculation
  const radius = 46;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className="w-full bg-pearl-navy text-pearl-text rounded-2xl p-6 sm:p-7 border border-pearl-dark flex flex-col justify-between relative overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-pearl-dark">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-pearl-gold">
            Border Readiness Engine
          </span>
          <h2 className="text-xl font-bold text-pearl-text font-heading">
            Travel Readiness Score
          </h2>
        </div>

        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-pearl-dark border border-pearl-slate">
          {isComplete ? (
            <span className="text-pearl-success-light flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" /> Ready for Crossing
            </span>
          ) : isModerate ? (
            <span className="text-pearl-gold-light flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5" /> Action Required
            </span>
          ) : (
            <span className="text-pearl-danger-light flex items-center gap-1.5">
              <XCircle className="w-3.5 h-3.5 text-pearl-danger-light" /> Crossing Risk
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 my-5 items-center">
        {/* Circular Gauge */}
        <div className="md:col-span-4 flex flex-col items-center justify-center">
          <div className="relative w-36 h-36 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
              <circle
                cx="60"
                cy="60"
                r={radius}
                stroke="#1E293B"
                strokeWidth="10"
                fill="transparent"
              />
              <motion.circle
                cx="60"
                cy="60"
                r={radius}
                stroke="var(--pearl-gold)"
                strokeWidth="10"
                strokeLinecap="round"
                fill="transparent"
                initial={{ strokeDashoffset: circumference }}
                animate={{ strokeDashoffset }}
                transition={{ duration: 0.9, ease: 'easeOut' }}
                style={{
                  strokeDasharray: circumference,
                }}
              />
            </svg>

            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <motion.span
                key={score}
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-3xl sm:text-4xl font-bold text-pearl-text tracking-tight font-heading tabular-nums"
              >
                {score}%
              </motion.span>
              <span className="text-[11px] font-bold text-pearl-placeholder uppercase tracking-wider">
                Ready
              </span>
            </div>
          </div>

          <div className="text-center mt-2">
            <span className="text-xs text-pearl-text-secondary font-medium tabular-nums">
              <strong className="text-pearl-text">{completedCount}</strong> of{' '}
              <strong className="text-pearl-text">{totalCount}</strong> requirements fulfilled
            </span>
          </div>
        </div>

        {/* Missing Requirements Diagnostic */}
        <div className="md:col-span-8 flex flex-col justify-center">
          {missingItems.length === 0 ? (
            <div className="bg-pearl-dark border border-pearl-success/50 rounded-xl p-4 text-pearl-text">
              <div className="flex items-center gap-2 font-bold text-sm text-pearl-success-light mb-1">
                <ShieldCheck className="w-5 h-5" />
                <span>All Entry Documents Complete</span>
              </div>
              <p className="text-xs text-pearl-text-secondary leading-relaxed">
                Your passport, visa directives, and mandatory health certificates satisfy current Uganda entry readiness criteria. You may generate and present your border QR summary pass.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-pearl-placeholder">
                  Outstanding Requirements
                </span>
                {missingMandatoryCount > 0 && (
                  <span className="text-[11px] font-bold text-pearl-danger-light bg-pearl-danger/20 px-2.5 py-0.5 rounded-lg border border-pearl-danger/40 tabular-nums">
                    {missingMandatoryCount} Mandatory Required
                  </span>
                )}
              </div>

              <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                {missingItems.slice(0, 4).map((item) => (
                  <div
                    key={item.id}
                    className="p-3 rounded-xl bg-pearl-dark border border-pearl-slate flex items-start gap-2.5"
                  >
                    <div
                      className={`w-5 h-5 rounded-lg mt-0.5 flex items-center justify-center shrink-0 ${
                        item.status === 'expired'
                          ? 'bg-pearl-gold/20 text-pearl-gold-light'
                          : 'bg-pearl-danger/20 text-pearl-danger-light'
                      }`}
                    >
                      {item.status === 'expired' ? (
                        <AlertTriangle className="w-3.5 h-3.5" />
                      ) : (
                        <XCircle className="w-3.5 h-3.5" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-xs font-bold text-pearl-text truncate">
                          {item.title}
                        </p>
                        {item.mandatory && (
                          <span className="text-[9px] font-bold uppercase text-pearl-danger-light bg-pearl-danger/25 px-1.5 py-0.5 rounded">
                            Required
                          </span>
                        )}
                        {item.status === 'expired' && (
                          <span className="text-[9px] font-bold uppercase text-pearl-gold-light bg-pearl-gold/25 px-1.5 py-0.5 rounded">
                            Expired
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-pearl-text-secondary mt-0.5">
                        {item.guidanceNote || item.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Action Footer */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-pearl-dark">
        <button
          type="button"
          onClick={onFocusChecklist}
          className="text-xs font-semibold text-pearl-text-secondary hover:text-pearl-gold-light transition-colors flex items-center gap-1.5 group cursor-pointer"
        >
          <span>Review & Update Document Checklist</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </button>

        <button
          type="button"
          id="btn-view-qr-summary"
          onClick={onOpenQR}
          className="w-full sm:w-auto min-h-[40px] px-5 py-2 rounded-xl font-bold text-xs tracking-wide bg-pearl-gold hover:bg-pearl-gold-light text-pearl-text flex items-center justify-center gap-2 transition-colors cursor-pointer whitespace-nowrap"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Generate Border QR Summary</span>
        </button>
      </div>
    </div>
  );
};
