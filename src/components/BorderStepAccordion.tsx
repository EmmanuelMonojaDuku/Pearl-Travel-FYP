import React from 'react';
import { Accordion } from './Accordion';
import { FileCheck, AlertCircle } from 'lucide-react';
import { MandatoryDocsWarning } from './MandatoryDocsWarning';

export interface BorderStep {
  stepNumber: number;
  title: string;
  agency: string;
  approxTime: string;
  summary: string;
  requiredDocuments: string[];
  officerAction: string;
  travelerTips: string;
}

interface Props {
  steps: BorderStep[];
}

export const BorderStepAccordion: React.FC<Props> = ({ steps }) => {
  return (
    <div className="space-y-3">
      {steps.map(step => (
        <div key={step.stepNumber} className="rounded-xl border bg-pearl-surface border-pearl-border p-4">
          <div className="flex items-center gap-2">
            <span className="font-mono font-bold text-pearl-accent">{step.stepNumber}.</span>
            <span className="font-bold text-pearl-text">{step.title}</span>
            <span className="text-pearl-placeholder text-xs hidden sm:inline">• {step.agency}</span>
            <span className="ml-auto text-pearl-text-secondary text-xs">{step.approxTime}</span>
          </div>
          <p className="text-pearl-text-secondary mt-1 text-sm">{step.summary}</p>
          {step.requiredDocuments && step.requiredDocuments.length > 0 && (
            <MandatoryDocsWarning docs={step.requiredDocuments} />
          )}
          <Accordion label="More details">
            <div className="p-2 space-y-2">
              <div className="flex items-center space-x-2">
                <FileCheck className="w-4 h-4 text-pearl-accent" />
                <span className="font-medium">Officer Action:</span>
                <span>{step.officerAction}</span>
              </div>
              <div className="flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-pearl-accent" />
                <span className="font-medium">Traveller Tip:</span>
                <span>{step.travelerTips}</span>
              </div>
            </div>
          </Accordion>
        </div>
      ))}
    </div>
  );
};
