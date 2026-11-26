import React, { useState } from 'react';
import { ChevronDown, Info } from 'lucide-react';
import { Button, Card, Ring } from './ui';

interface Props {
  score: number;
  statusLabel: string;
  readyCount: number;
  missingCount: number;
  notApplicableCount: number;
  missingMandatoryCount: number;
  lastSavedTime: string;
  onViewMissing: () => void;
  onBack: () => void;
  onOpenQR: () => void;
}

/** Readiness screen: score ring, Ready / Missing / N/A breakdown, explanation and last-saved note. */
export const ReadinessAssessmentView: React.FC<Props> = ({
  score, statusLabel, readyCount, missingCount, notApplicableCount, missingMandatoryCount, lastSavedTime, onViewMissing, onBack, onOpenQR,
}) => {
  const [explain, setExplain] = useState(false);
  const tone = score >= 80 && missingMandatoryCount === 0 ? 'success' : score >= 50 ? 'gold' : 'danger';
  const message =
    missingMandatoryCount === 0 && missingCount === 0
      ? 'All documents are in place. You are prepared for border clearance.'
      : missingMandatoryCount > 0
        ? `Good progress. Complete the ${missingMandatoryCount} missing mandatory item${missingMandatoryCount > 1 ? 's' : ''} to be fully ready.`
        : 'Mandatory documents are complete. A few recommended items are still pending.';
  const rows: [string, number, string][] = [
    ['Ready', readyCount, 'bg-pearl-success'],
    ['Missing', missingCount, 'bg-pearl-danger'],
    ['Not Applicable', notApplicableCount, 'bg-pearl-placeholder'],
  ];

  return (
    <div className="max-w-md mx-auto space-y-5">
      <div className="text-center">
        <p className="text-[11px] font-bold uppercase tracking-wider text-pearl-accent">Malaba clearance score</p>
        <div className="flex justify-center mt-4"><Ring value={score} label={`${score}%`} sub="Ready" size={150} tone={tone} /></div>
        <h2 className="mt-4 text-lg font-bold font-heading">Your Readiness Score</h2>
        <p className="text-xs text-pearl-text-secondary mt-1">{statusLabel} · {message}</p>
      </div>

      <Card className="divide-y divide-pearl-border p-0">
        {rows.map(([label, n, dot]) => (
          <div key={label} className="flex items-center justify-between px-4 py-3 text-sm">
            <span className="flex items-center gap-2"><span className={`w-2 h-2 rounded-full ${dot}`} />{label}</span>
            <span className="font-bold tabular-nums">{n}</span>
          </div>
        ))}
      </Card>

      <div className="space-y-3">
        <Button onClick={onViewMissing}>View Missing Items</Button>
        {score >= 1 && <Button variant="outline" onClick={onOpenQR}>Generate Border QR Summary</Button>}
        <Button variant="outline" onClick={onBack}>Back</Button>
      </div>

      <div>
        <p className="text-[11px] font-bold text-pearl-text-secondary">Last saved assessment</p>
        <p className="text-[11px] text-pearl-placeholder mt-1">
          {lastSavedTime}. This is a traveller preparation/readiness indicator. It is not an immigration approval or clearance decision.
        </p>
      </div>

      <div>
        <button
          type="button"
          aria-expanded={explain}
          onClick={() => setExplain((v) => !v)}
          className="w-full h-11 rounded-xl border border-pearl-border bg-pearl-surface text-sm font-semibold flex items-center justify-center gap-2 cursor-pointer hover:bg-pearl-input"
        >
          <Info className="w-4 h-4 text-pearl-accent" /> How does my score work?
          <ChevronDown className={`w-4 h-4 transition-transform ${explain ? 'rotate-180' : ''}`} />
        </button>
        {explain && (
          <Card className="mt-2 text-xs text-pearl-text-secondary space-y-2">
            <p>Each checklist item counts toward your score. <strong className="text-pearl-text">Mandatory</strong> documents count double; optional ones count once.</p>
            <p>Items marked <strong className="text-pearl-text">Have It</strong> earn their points. Missing or expired items earn none. Items marked <strong className="text-pearl-text">N/A</strong> are removed from the calculation entirely.</p>
            <p>You are &ldquo;Ready&rdquo; only at 100% with no mandatory item missing.</p>
          </Card>
        )}
      </div>
    </div>
  );
};
