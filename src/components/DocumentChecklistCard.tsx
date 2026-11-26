import React, { useState } from 'react';
import {
  CheckCircle2,
  XCircle,
  MinusCircle,
  Clock,
  FileCheck,
  AlertTriangle,
  Plus,
  Edit2,
  Info,
  Check,
  Trash2,
  Eye,
  X,
} from 'lucide-react';
import { ChecklistItem, DocumentStatus } from '../types';
import { Pill, Ring } from './ui';

interface DocumentChecklistCardProps {
  checklist: ChecklistItem[];
  onUpdateItemStatus: (id: string, newStatus: DocumentStatus) => void;
  onUpdateItemDetails: (id: string, docNumber?: string, expiryDate?: string) => void;
  onOpenReviewAudit?: () => void;
}

export const DocumentChecklistCard: React.FC<DocumentChecklistCardProps> = ({
  checklist,
  onUpdateItemStatus,
  onUpdateItemDetails,
  onOpenReviewAudit,
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [tempDocNumber, setTempDocNumber] = useState('');
  const [tempExpiryDate, setTempExpiryDate] = useState('');

  const handleStartEdit = (item: ChecklistItem) => {
    setEditingId(item.id);
    setTempDocNumber(item.docNumber || '');
    setTempExpiryDate(item.expiryDate || '');
  };

  const handleSaveEdit = (id: string) => {
    onUpdateItemDetails(id, tempDocNumber.trim() || undefined, tempExpiryDate.trim() || undefined);
    setEditingId(null);
  };

  const handleClearDetails = (id: string) => {
    onUpdateItemDetails(id, undefined, undefined);
    if (editingId === id) {
      setTempDocNumber('');
      setTempExpiryDate('');
      setEditingId(null);
    }
  };

  const applicable = checklist.filter((i) => i.status !== 'not_applicable').length;
  const done = checklist.filter((i) => i.status === 'complete').length;

  return (
    <div className="w-full bg-pearl-dark rounded-2xl p-5 sm:p-7 border border-pearl-border">
      <div className="pb-4 mb-4 border-b border-pearl-border">
        <div className="flex items-center gap-4">
          <Ring value={applicable ? (done / applicable) * 100 : 0} label={`${done}/${applicable}`} sub="done" size={84} tone={done === applicable && applicable > 0 ? 'success' : 'gold'} />
          <div className="min-w-0">
            <span className="text-[11px] font-bold uppercase tracking-wider text-pearl-accent">Smart Checklist</span>
            <h2 className="text-lg font-bold text-pearl-text font-heading">{done} of {applicable} items completed</h2>
            <p className="text-xs text-pearl-text-secondary mt-0.5">Mark each document as Have It, Don&apos;t Have It, or N/A.</p>
            <div className="flex flex-wrap gap-1.5 mt-2">
              <Pill tone="success">Ready {done}</Pill>
              <Pill tone="danger">Missing {checklist.filter((i) => i.status === 'missing' || i.status === 'expired').length}</Pill>
              <Pill>N/A {checklist.length - applicable}</Pill>
            </div>
          </div>
        </div>
        {onOpenReviewAudit && (
          <button type="button" onClick={onOpenReviewAudit} className="mt-3 text-xs font-semibold text-pearl-text hover:bg-pearl-input py-1.5 px-3 rounded-lg cursor-pointer flex items-center gap-1.5 bg-pearl-surface border border-pearl-border" title="Audit and remove unwanted entries">
            <Eye className="w-3.5 h-3.5 text-pearl-text-secondary" />
            <span>Review &amp; Audit Details</span>
          </button>
        )}
      </div>

      <div className="space-y-3">
        {checklist.map((item) => {
          const isComplete = item.status === 'complete';
          const isMissing = item.status === 'missing';
          const isExpired = item.status === 'expired';
          const isNA = item.status === 'not_applicable';
          const isEditing = editingId === item.id;

          return (
            <div
              key={item.id}
              className={`rounded-xl p-4 transition-colors border ${
                isComplete || isNA
                  ? 'border-pearl-border bg-pearl-surface'
                  : isExpired
                  ? 'border-pearl-gold/50 bg-pearl-gold/10'
                  : 'border-pearl-danger/40 bg-pearl-danger/10'
              }`}
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                      isNA
                        ? 'bg-pearl-surface text-pearl-placeholder'
                        : isComplete
                        ? 'bg-pearl-success/15 text-pearl-success-light'
                        : isExpired
                        ? 'bg-pearl-gold/15 text-pearl-accent'
                        : 'bg-pearl-danger/15 text-pearl-danger-light'
                    }`}
                  >
                    {isNA ? (
                      <MinusCircle className="w-4 h-4" />
                    ) : isComplete ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : isExpired ? (
                      <Clock className="w-4 h-4" />
                    ) : (
                      <XCircle className="w-4 h-4" />
                    )}
                  </div>

                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm font-bold text-pearl-text">{item.title}</h3>
                      <span
                        className={`text-[10px] font-bold uppercase ${
                          item.mandatory ? 'text-pearl-danger-light' : 'text-pearl-placeholder'
                        }`}
                      >
                        • {item.mandatory ? 'Mandatory' : 'Optional'}
                      </span>
                    </div>
                    <p className="text-xs text-pearl-text-secondary mt-0.5">{item.description}</p>
                    {item.guidanceNote && (
                      <p className="text-[11px] text-pearl-text-secondary mt-1 italic flex items-center gap-1">
                        <Info className="w-3 h-3 text-pearl-placeholder shrink-0" />
                        <span>{item.guidanceNote}</span>
                      </p>
                    )}
                  </div>
                </div>

                {/* Status Toggle Buttons */}
                <div className="flex flex-wrap items-center gap-1.5 self-start md:self-center shrink-0">
                  <button
                    type="button"
                    onClick={() => onUpdateItemStatus(item.id, 'complete')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1 ${
                      isComplete
                        ? 'bg-pearl-success text-pearl-navy'
                        : 'bg-pearl-dark border border-pearl-border text-pearl-text-secondary hover:text-pearl-success-light'
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Have It</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onUpdateItemStatus(item.id, 'missing')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1 ${
                      isMissing
                        ? 'bg-pearl-danger text-white'
                        : 'bg-pearl-dark border border-pearl-border text-pearl-text-secondary hover:text-pearl-danger-light'
                    }`}
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Don&apos;t Have It</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onUpdateItemStatus(item.id, 'expired')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1 ${
                      isExpired
                        ? 'bg-pearl-gold text-pearl-navy'
                        : 'bg-pearl-dark border border-pearl-border text-pearl-text-secondary hover:text-pearl-accent'
                    }`}
                  >
                    <Clock className="w-3.5 h-3.5" />
                    <span>Expired</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onUpdateItemStatus(item.id, 'not_applicable')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1 ${
                      isNA
                        ? 'bg-pearl-navy text-white'
                        : 'bg-pearl-dark border border-pearl-border text-pearl-text-secondary hover:text-pearl-text'
                    }`}
                  >
                    <MinusCircle className="w-3.5 h-3.5" />
                    <span>N/A</span>
                  </button>
                </div>
              </div>

              {/* Document Reference & Expiry Info Row */}
              <div className="mt-3 pt-2.5 border-t border-pearl-border flex flex-wrap items-center justify-between text-xs text-pearl-text-secondary gap-2">
                {isEditing ? (
                  <div className="w-full flex flex-col sm:flex-row items-center gap-2 pt-1">
                    <input
                      type="text"
                      placeholder="Doc Reference # (e.g. UG-PASSPORT-442)"
                      value={tempDocNumber}
                      onChange={(e) => setTempDocNumber(e.target.value)}
                      className="w-full sm:w-1/2 px-3 py-1.5 rounded-lg bg-pearl-input border border-pearl-border text-xs font-semibold text-pearl-text outline-none"
                    />
                    <input
                      type="date"
                      value={tempExpiryDate}
                      onChange={(e) => setTempExpiryDate(e.target.value)}
                      className="w-full sm:w-1/3 px-3 py-1.5 rounded-lg bg-pearl-input border border-pearl-border text-xs font-semibold text-pearl-text outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => handleSaveEdit(item.id)}
                      className="px-3.5 py-1.5 bg-pearl-gold text-pearl-navy text-xs font-bold rounded-lg cursor-pointer hover:bg-pearl-gold-light transition-colors"
                    >
                      Save
                    </button>
                    {(tempDocNumber || tempExpiryDate) && (
                      <button
                        type="button"
                        onClick={() => handleClearDetails(item.id)}
                        className="px-2.5 py-1.5 bg-pearl-danger/10 text-pearl-danger-light text-xs font-bold rounded-lg cursor-pointer hover:bg-pearl-danger/20 transition-colors flex items-center gap-1"
                        title="Delete this document reference information"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Delete Info</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setEditingId(null)}
                      className="px-2 py-1.5 text-xs text-pearl-placeholder hover:text-pearl-text cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-3 flex-wrap">
                      {item.docNumber ? (
                        <span>
                          Ref: <strong className="text-pearl-text font-mono">{item.docNumber}</strong>
                        </span>
                      ) : (
                        <span className="text-pearl-placeholder italic">No reference ID added</span>
                      )}

                      {item.expiryDate && (
                        <span>
                          Valid until:{' '}
                          <strong className="text-pearl-text font-mono tabular-nums">{item.expiryDate}</strong>
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleStartEdit(item)}
                        className="text-xs font-bold text-pearl-text hover:text-pearl-dark flex items-center gap-1 cursor-pointer"
                      >
                        <Edit2 className="w-3 h-3" />
                        <span>{item.docNumber ? 'Edit details' : 'Add doc details'}</span>
                      </button>

                      {(item.docNumber || item.expiryDate) && (
                        <button
                          type="button"
                          onClick={() => handleClearDetails(item.id)}
                          className="text-xs font-bold text-pearl-danger-light hover:underline flex items-center gap-0.5 cursor-pointer px-1.5 py-0.5 rounded"
                          title="Delete reference number and expiry date"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Delete Ref</span>
                        </button>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
