import React, { useState } from 'react';
import {
  HelpCircle,
  FileText,
  ShieldCheck,
  PlaneTakeoff,
  PlaneLanding,
  CheckCircle2,
  AlertCircle,
  Info,
} from 'lucide-react';
import { TravelRequirement } from '../types';

interface RequirementGuidanceCardProps {
  requirements: TravelRequirement[];
  nationality: string;
  purpose?: string;
}

export const RequirementGuidanceCard: React.FC<RequirementGuidanceCardProps> = ({
  requirements,
  nationality,
  purpose,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const categories = [
    { id: 'all', label: 'All Guidance' },
    { id: 'entry', label: 'Entry Clearance' },
    { id: 'visa', label: 'Visa Rules' },
    { id: 'health', label: 'Port Health' },
    { id: 'exit', label: 'Exit Procedures' },
  ];

  const filteredRequirements =
    selectedCategory === 'all'
      ? requirements
      : requirements.filter((r) => r.category === selectedCategory);

  return (
    <div className="w-full bg-pearl-dark rounded-2xl p-5 sm:p-7 border border-pearl-border">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-4 border-b border-pearl-border gap-2">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-pearl-gold-light">
            Official Compliance & Rules
          </span>
          <h2 className="text-xl font-bold text-pearl-text font-heading">
            Requirement Guidance
          </h2>
          <p className="text-xs text-pearl-text-secondary mt-0.5">
            Explaining Uganda border & immigration requirements in clear, plain language.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 self-start sm:self-auto">
          <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-pearl-gold text-pearl-navy">{nationality}</span>
          {purpose && <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-pearl-surface border border-pearl-border text-pearl-text capitalize">{purpose}</span>}
        </div>
      </div>

      {/* Category Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none mb-4">
        {categories.map((cat) => {
          const active = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                active
                  ? 'bg-pearl-gold text-pearl-navy font-bold'
                  : 'bg-pearl-surface border border-pearl-border text-pearl-text-secondary hover:text-pearl-text hover:bg-pearl-input'
              }`}
            >
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* Requirements List */}
      <div className="space-y-3">
        {filteredRequirements.map((req) => {
          const isExpanded = expandedId === req.id;
          return (
            <div
              key={req.id}
              className="rounded-xl border border-pearl-border bg-pearl-surface p-4 transition-colors hover:border-pearl-border/40"
            >
              <div
                className="flex items-start justify-between gap-3 cursor-pointer"
                onClick={() => setExpandedId(isExpanded ? null : req.id)}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                      req.mandatory
                        ? 'bg-pearl-danger/10 text-pearl-danger-light'
                        : 'bg-pearl-success/10 text-pearl-success-light'
                    }`}
                  >
                    {req.category === 'exit' ? (
                      <PlaneTakeoff className="w-4 h-4" />
                    ) : req.category === 'entry' ? (
                      <PlaneLanding className="w-4 h-4" />
                    ) : req.category === 'health' ? (
                      <ShieldCheck className="w-4 h-4" />
                    ) : (
                      <FileText className="w-4 h-4" />
                    )}
                  </div>

                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm font-bold text-pearl-text">{req.title}</h3>
                      <span
                        className={`text-[10px] font-bold uppercase ${
                          req.mandatory ? 'text-pearl-danger-light' : 'text-pearl-success-light'
                        }`}
                      >
                        • {req.mandatory ? 'Mandatory' : 'Recommended'}
                      </span>
                    </div>
                    <p className="text-xs text-pearl-text-secondary mt-1">{req.summary}</p>
                  </div>
                </div>

                <div className="text-pearl-text text-xs font-bold pt-1 shrink-0">
                  {isExpanded ? 'Hide' : 'Details'}
                </div>
              </div>

              {isExpanded && (
                <div className="mt-3 pt-3 border-t border-pearl-border pl-11 text-xs space-y-2">
                  <div className="bg-pearl-input p-3 rounded-xl border border-pearl-border">
                    <p className="font-medium text-pearl-text leading-relaxed">
                      <strong>In Plain Language:</strong> {req.simpleExplanation}
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between text-[11px] text-pearl-text-secondary gap-1 pt-1">
                    <span>
                      <strong>Condition:</strong> {req.applicableCondition}
                    </span>
                    {req.officialSource && (
                      <span className="italic text-pearl-placeholder">
                        Source: {req.officialSource}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
