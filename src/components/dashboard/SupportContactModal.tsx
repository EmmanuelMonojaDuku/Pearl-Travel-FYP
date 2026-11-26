import React, { useState } from 'react';
import { HelpCircle, Mail, MapPin, ShieldCheck, Copy, Check, X } from 'lucide-react';

interface SupportContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShowToast: (msg: string) => void;
}

export const SupportContactModal: React.FC<SupportContactModalProps> = ({
  isOpen,
  onClose,
  onShowToast,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopyEmail = () => {
    navigator.clipboard?.writeText('support@pearltravel.ug');
    setCopied(true);
    onShowToast('Support email copied: support@pearltravel.ug');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-pearl-navy/60 backdrop-blur-xs">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="support-modal-title"
        className="w-full max-w-md bg-pearl-dark border border-pearl-border rounded-2xl shadow-2xl overflow-hidden text-pearl-text"
      >
        <div className="bg-pearl-navy px-5 py-4 flex items-center justify-between text-pearl-text">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-pearl-gold text-pearl-text flex items-center justify-center">
              <HelpCircle className="w-4 h-4" />
            </div>
            <div>
              <h2 id="support-modal-title" className="font-heading text-sm font-bold text-pearl-text">
                Pearl Travel Traveller Support
              </h2>
              <p className="text-[11px] text-pearl-placeholder">Pre-Arrival & Border Guidance Desk</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close support dialog"
            className="min-h-[36px] min-w-[36px] flex items-center justify-center rounded-lg text-pearl-placeholder hover:text-pearl-text hover:bg-pearl-dark cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-3 text-xs">
          <div className="p-3.5 rounded-xl bg-pearl-surface border border-pearl-border flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <Mail className="w-4 h-4 text-pearl-text shrink-0" />
              <div className="min-w-0">
                <p className="font-bold text-pearl-text">Support Email</p>
                <p className="text-pearl-text-secondary truncate">support@pearltravel.ug</p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleCopyEmail}
              className="px-3 py-1.5 rounded-lg bg-pearl-navy hover:bg-pearl-dark text-pearl-text font-semibold flex items-center gap-1.5 cursor-pointer shrink-0"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-pearl-gold" /> : <Copy className="w-3.5 h-3.5 text-pearl-gold" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>

          <div className="p-3.5 rounded-xl bg-pearl-surface border border-pearl-border flex items-start gap-2.5">
            <MapPin className="w-4 h-4 text-pearl-text shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-pearl-text">Malaba One-Stop Border Post (OSBP)</p>
              <p className="text-pearl-text-secondary mt-0.5 leading-relaxed">
                Joint Immigration & Port Health Desk operates 24/7 on the Ugandan side of the terminal. Always present original travel documents upon arrival.
              </p>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-pearl-surface border border-pearl-border flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-pearl-success-light shrink-0 mt-0.5" />
            <p className="text-pearl-text-secondary leading-relaxed">
              Statutory entry clearance and visa eligibility decisions are made exclusively by Uganda Directorate of Citizenship and Immigration Control (DCIC) officers.
            </p>
          </div>
        </div>

        <div className="px-5 py-3 bg-pearl-surface border-t border-pearl-border flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-pearl-gold hover:bg-pearl-gold-light text-pearl-text text-xs font-bold cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
