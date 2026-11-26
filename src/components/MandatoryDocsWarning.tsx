import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface MandatoryDocsWarningProps {
  docs: string[];
}

/**
 * Renders a distinct warning for required/admin documents.
 * Uses the Pearl Travel warning colour palette (red/orange) and includes
 * an accessible icon.
 */
export const MandatoryDocsWarning: React.FC<MandatoryDocsWarningProps> = ({ docs }) => {
  if (!docs || docs.length === 0) return null;
  return (
    <div
      role="alert"
      className="flex items-center gap-2 bg-pearl-danger/10 border border-pearl-danger/30 text-pearl-danger-light text-sm rounded-md p-2 mt-1"
    >
      <AlertTriangle className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
      <span className="font-medium">Required documents:</span>
      <span className="flex flex-wrap gap-1">
        {docs.map((doc, i) => (
          <span
            key={i}
            className="rounded bg-pearl-surface px-2 py-0.5 text-xs text-pearl-text-secondary border border-pearl-border"
          >
            {doc}
          </span>
        ))}
      </span>
    </div>
  );
};
