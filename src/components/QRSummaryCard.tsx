import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
  QrCode,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  Copy,
  Check,
  Download,
  Eye,
  AlertTriangle,
  FileCheck,
  Building,
} from 'lucide-react';
import { QRSummaryData } from '../types';

interface QRSummaryCardProps {
  qrData: QRSummaryData;
  onClose?: () => void;
}

export const QRSummaryCard: React.FC<QRSummaryCardProps> = ({ qrData, onClose }) => {
  const [copied, setCopied] = useState(false);
  const [officerMode, setOfficerMode] = useState(false);

  const qrPayloadString = JSON.stringify(qrData);

  const handleCopyPayload = () => {
    navigator.clipboard.writeText(qrPayloadString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full bg-pearl-dark rounded-2xl p-5 sm:p-7 border border-pearl-border">
      <div className="flex flex-wrap items-center justify-between pb-4 mb-4 border-b border-pearl-border gap-3">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-pearl-gold-light">
            QR Summary
          </span>
          <h2 className="text-xl font-bold text-pearl-text font-heading">
            Readiness QR Code
          </h2>
          <p className="text-[11px] text-pearl-text-secondary mt-0.5">
            Scan this code to share your travel readiness status.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setOfficerMode(!officerMode)}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
              officerMode
                ? 'bg-pearl-navy text-pearl-gold'
                : 'bg-pearl-surface border border-pearl-border text-pearl-text hover:bg-pearl-input'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>{officerMode ? 'Back to QR' : 'Officer View'}</span>
          </button>
        </div>
      </div>

      {!officerMode ? (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          {/* QR Code Canvas — white backing preserved intentionally for scannable contrast */}
          <div className="md:col-span-5 flex flex-col items-center justify-center p-5 rounded-xl bg-pearl-surface border border-pearl-border">
            <div className="p-3 bg-pearl-input rounded-xl border border-pearl-border">
              <QRCodeSVG
                value={qrPayloadString}
                size={180}
                level="M"
                includeMargin={true}
                className="w-44 h-44 sm:w-48 sm:h-48"
              />
            </div>

            <span className="text-[11px] font-mono text-pearl-text-secondary mt-3 font-semibold tabular-nums">
              Local Ref: {qrData.referenceId}
            </span>

            <div className="flex items-center gap-1.5 mt-1">
              <span className="w-2 h-2 rounded-full bg-pearl-success/15" />
              <span className="text-[10px] font-bold text-pearl-text-secondary uppercase tracking-wide">
                Not verified
              </span>
            </div>
          </div>

          {/* Scannable Passenger Summary */}
          <div className="md:col-span-7 flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-pearl-placeholder uppercase tracking-wider">
                  Summary
                </span>
                <span
                  className={`text-xs font-bold tabular-nums ${
                    qrData.readinessScore >= 80 ? 'text-pearl-success-light' : 'text-pearl-gold-light'
                  }`}
                >
                  {qrData.readinessScore}% Ready
                </span>
              </div>
              <h3 className="text-lg font-bold text-pearl-text mt-1 font-heading">
                {qrData.passengerName}
              </h3>
              <p className="text-xs text-pearl-text-secondary">
                {qrData.nationality} • {qrData.destination}
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
              {[
                { label: 'Passport', status: qrData.checklistSummary.passport },
                { label: 'Visa/Entry', status: qrData.checklistSummary.visa },
                { label: 'Yellow Fever', status: qrData.checklistSummary.yellowFever },
                { label: 'Return Ticket', status: qrData.checklistSummary.returnTicket },
                { label: 'Accommodation', status: qrData.checklistSummary.accommodation },
                { label: 'Insurance', status: qrData.checklistSummary.travelInsurance },
              ].map((cell) => (
                <div key={cell.label} className="p-2.5 rounded-xl bg-pearl-surface border border-pearl-border">
                  <span className="text-[10px] font-bold text-pearl-placeholder block uppercase">
                    {cell.label}
                  </span>
                  <span className="font-bold text-pearl-text capitalize flex items-center gap-1 mt-0.5">
                    {cell.status === 'complete' ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-pearl-success-light" />
                    ) : (
                      <XCircle className="w-3.5 h-3.5 text-pearl-danger-light" />
                    )}
                    {cell.status}
                  </span>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={handleCopyPayload}
                className="px-3.5 py-2 rounded-lg text-xs font-bold bg-pearl-navy hover:bg-pearl-dark text-pearl-text transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-pearl-gold" /> : <Copy className="w-3.5 h-3.5 text-pearl-gold" />}
                <span>{copied ? 'Copied Data' : 'Copy QR Data'}</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Officer Terminal View Simulator */
        <div className="bg-pearl-navy text-pearl-success-light p-5 rounded-xl font-mono text-xs space-y-4 border border-pearl-dark">
          <div className="flex flex-wrap items-center justify-between border-b border-pearl-dark pb-3 text-pearl-text-secondary gap-2">
            <div className="flex items-center gap-2">
              <Building className="w-4 h-4 text-pearl-gold" />
              <span className="font-bold text-pearl-text tracking-wider">
                PEARL TRAVEL • OFFICER VIEW
              </span>
            </div>
            <span className="bg-pearl-dark text-pearl-gold px-2 py-0.5 rounded text-[10px] border border-pearl-slate">
              NOT OFFICIAL
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-pearl-text-secondary">
            <div>
              <p className="text-pearl-placeholder text-[10px]">PASSENGER NAME</p>
              <p className="text-pearl-text font-bold text-sm">{qrData.passengerName}</p>
            </div>
            <div>
              <p className="text-pearl-placeholder text-[10px]">LOCAL REFERENCE</p>
              <p className="text-pearl-gold font-bold tabular-nums">{qrData.referenceId}</p>
            </div>
            <div>
              <p className="text-pearl-placeholder text-[10px]">NATIONALITY / PURPOSE</p>
              <p className="text-pearl-text">
                {qrData.nationality} ({qrData.travelPurpose.toUpperCase()})
              </p>
            </div>
            <div>
              <p className="text-pearl-placeholder text-[10px]">DESTINATION HUB</p>
              <p className="text-pearl-text">{qrData.destination}</p>
            </div>
            <div>
              <p className="text-pearl-placeholder text-[10px]">CHECKLIST SNAPSHOT</p>
              <p className="text-pearl-success-light font-bold tabular-nums">
                {qrData.readinessScore}% - {qrData.readinessStatus.toUpperCase()}
              </p>
            </div>
            <div>
              <p className="text-pearl-placeholder text-[10px]">VERIFICATION TIMESTAMP</p>
              <p className="text-pearl-placeholder tabular-nums">{qrData.timestamp}</p>
            </div>
          </div>

          <div className="border-t border-pearl-dark pt-3">
            <p className="text-[10px] text-pearl-placeholder mb-2">CHECKLIST SUMMARY:</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px]">
              <div>PASSPORT: {qrData.checklistSummary.passport.toUpperCase()}</div>
              <div>VISA: {qrData.checklistSummary.visa.toUpperCase()}</div>
              <div>Y-FEVER: {qrData.checklistSummary.yellowFever.toUpperCase()}</div>
              <div>RETURN TK: {qrData.checklistSummary.returnTicket.toUpperCase()}</div>
              <div>HOTEL/TOUR: {qrData.checklistSummary.accommodation.toUpperCase()}</div>
              <div>INSURANCE: {qrData.checklistSummary.travelInsurance.toUpperCase()}</div>
            </div>
          </div>
        </div>
      )}

      {/* Notice */}
      <div className="mt-5 p-3.5 rounded-xl bg-pearl-surface border border-pearl-gold/50 flex items-start gap-2.5">
        <ShieldAlert className="w-4 h-4 text-pearl-gold-light shrink-0 mt-0.5" />
        <p className="text-[11px] text-pearl-text leading-relaxed font-medium">
          <strong>Notice:</strong> {qrData.disclaimer}
        </p>
      </div>
    </div>
  );
};
