import React, { useState } from 'react';
import {
  Compass,
  User,
  Globe,
  FileCheck,
  ShieldCheck,
  Bot,
  MapPinned,
  QrCode,
  Video,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Share2,
  Download,
  Eye,
  Calendar,
  Truck,
  Plane,
  Train,
  Edit3,
} from 'lucide-react';
import malabaBorderPhoto from '../../assets/images/malaba_border_post_1795029549812.jpg';
import {
  PassengerProfile,
  ChecklistItem,
  TravelRequirement,
} from '../../types';
import { PortalTab } from './navTypes';

interface OverviewTabProps {
  profile: PassengerProfile;
  isProfileComplete: boolean;
  requirements: TravelRequirement[];
  readiness: {
    score: number;
    completedCount: number;
    totalCount: number;
    missingMandatoryCount: number;
    missingItems: ChecklistItem[];
    statusLabel: string;
  };
  onSelectTab: (tab: PortalTab) => void;
  onEditProfile: () => void;
  onEditJourney: () => void;
  onOpenReviewAudit: () => void;
  onOpenDownloadPdf: () => void;
  onOpenShareVideo: () => void;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({
  profile,
  isProfileComplete,
  requirements,
  readiness,
  onSelectTab,
  onEditProfile,
  onEditJourney,
  onOpenReviewAudit,
  onOpenDownloadPdf,
  onOpenShareVideo,
}) => {
  const [bannerImgError, setBannerImgError] = useState(false);

  const firstName =
    profile.firstName?.trim() || profile.fullName?.split(' ')[0] || 'Traveller';
  const currentBorderPoint = profile.journey?.intendedBorderPoint || 'Not set';
  const currentDestination = profile.journey?.destinationCountry || 'Not set';
  const currentTravelDate = profile.journey?.travelDate || 'Not set';
  const currentMode = profile.journey?.travelMode || 'Not set';
  const hasJourney = Boolean(
    profile.journey?.travelPurpose &&
      profile.journey.destinationCountry &&
      profile.journey.intendedBorderPoint &&
      profile.journey.travelDate &&
      profile.journey.travelMode
  );

  const initials = (profile.fullName || 'PT')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase())
    .join('');

  // Circular gauge math
  const hasAssessment = readiness.totalCount > 0;
  const radius = 44;
  const circumference = 2 * Math.PI * radius;
  const clampedScore = Math.max(0, Math.min(100, readiness.score));
  const strokeDashoffset = hasAssessment
    ? circumference - (clampedScore / 100) * circumference
    : circumference;

  const isAllReady =
    hasAssessment && readiness.score === 100 && readiness.missingMandatoryCount === 0;
  const hasCriticalMissing = readiness.missingMandatoryCount > 0;

  // Dynamic "What You Need To Do Next" resolution derived from real state
  const mandatoryMissing = readiness.missingItems.filter((i) => i.mandatory);
  const optionalMissing = readiness.missingItems.filter((i) => !i.mandatory);

  let nextActionTitle = 'Review Your Document Checklist';
  let nextActionSummary =
    'Confirm your travel documents so your readiness status stays accurate.';
  let nextActionItems: string[] = [];
  let nextActionButtonLabel = 'Open checklist';
  let nextActionHandler = () => onSelectTab('checklist');
  let nextActionTone: 'warning' | 'critical' | 'success' = 'warning';

  if (!isProfileComplete) {
    nextActionTitle = 'Complete Your Traveller Profile';
    nextActionSummary =
      'Required identity, nationality, contact, and emergency details are missing from your traveller record.';
    nextActionItems = [
      'Verify passport nationality & document type',
      'Add primary phone and emergency contact details',
    ];
    nextActionButtonLabel = 'Finish profile';
    nextActionHandler = onEditProfile;
    nextActionTone = 'warning';
  } else if (!hasJourney) {
    nextActionTitle = 'Set up your journey';
    nextActionSummary =
      'Select your Uganda border crossing post, planned date, and transport mode to compute requirements.';
    nextActionButtonLabel = 'Set up journey';
    nextActionHandler = onEditJourney;
    nextActionTone = 'warning';
  } else if (mandatoryMissing.length > 0) {
    nextActionTitle = `Complete ${mandatoryMissing.length} required document${mandatoryMissing.length > 1 ? 's' : ''}`;
    nextActionSummary = `Required before border presentation at ${currentBorderPoint.split('(')[0].trim()}:`;
    nextActionItems = mandatoryMissing.slice(0, 3).map((item) => item.title);
    nextActionButtonLabel = 'Open checklist';
    nextActionHandler = () => onSelectTab('checklist');
    nextActionTone = 'critical';
  } else if (optionalMissing.length > 0) {
    nextActionTitle = `Review ${optionalMissing.length} optional item${optionalMissing.length > 1 ? 's' : ''}`;
    nextActionSummary =
      'All mandatory documents are verified. Confirm remaining recommended items for smooth crossing:';
    nextActionItems = optionalMissing.slice(0, 3).map((item) => item.title);
    nextActionButtonLabel = 'Open checklist';
    nextActionHandler = () => onSelectTab('checklist');
    nextActionTone = 'warning';
  } else {
    nextActionTitle = 'You are ready to cross';
    nextActionSummary = `All ${readiness.totalCount} checklist items for ${currentBorderPoint.split('(')[0].trim()} are complete. Keep your QR Readiness Summary handy for officer inspection.`;
    nextActionButtonLabel = 'Show QR pass';
    nextActionHandler = () => onSelectTab('qr');
    nextActionTone = 'success';
  }

  const ModeIcon =
    currentMode === 'air' ? Plane : currentMode === 'rail' ? Train : Truck;

  const services: {
    id: string;
    tab: PortalTab;
    title: string;
    description: string;
    metric: string;
    icon: React.ComponentType<{ className?: string }>;
  }[] = [
    {
      id: 'btn-view-requirements-card',
      tab: 'guidance',
      title: 'Requirements',
      description: '',
      metric: `${requirements.length} rules`,
      icon: Globe,
    },
    {
      id: 'btn-check-documents-card',
      tab: 'checklist',
      title: 'Checklist',
      description: '',
      metric: `${readiness.completedCount}/${readiness.totalCount} done`,
      icon: FileCheck,
    },
    {
      id: 'btn-view-readiness-card',
      tab: 'readiness',
      title: 'Readiness',
      description: '',
      metric: hasAssessment ? `${readiness.score}% score` : 'Pending setup',
      icon: ShieldCheck,
    },
    {
      id: 'btn-ask-ai-guidance-card',
      tab: 'ai-guidance',
      title: 'Assistant',
      description: '',
      metric: 'Ask anything',
      icon: Bot,
    },
    {
      id: 'btn-view-border-guide-card',
      tab: 'border-guide',
      title: 'Border Guide',
      description: '',
      metric: '6 steps',
      icon: MapPinned,
    },
    {
      id: 'btn-view-qr-card',
      tab: 'qr',
      title: 'QR Pass',
      description: '',
      metric: 'Show at border',
      icon: QrCode,
    },
    {
      id: 'btn-watch-video-card',
      tab: 'multimedia',
      title: 'Videos',
      description: '',
      metric: 'Swahili · English',
      icon: Video,
    },
  ];

  return (
    <div className="space-y-5">
      {/* 1. Welcome Banner */}
      <section
        aria-label="Welcome Overview"
        className="relative rounded-2xl bg-pearl-navy border border-pearl-border overflow-hidden text-pearl-text"
      >
        <div className="grid grid-cols-1 md:grid-cols-12 items-stretch">
          {/* Left Copy */}
          <div className="md:col-span-7 p-5 sm:p-7 flex flex-col justify-between gap-4 relative z-10">
            <div className="space-y-1.5">
              <h2 className="font-heading text-2xl sm:text-3xl font-bold text-pearl-text tracking-tight leading-tight">
                Welcome back, {firstName}
              </h2>
              <p className="text-sm text-pearl-text-secondary max-w-xl">
                {nextActionTone === 'success' ? nextActionTitle : `Next: ${nextActionTitle}`}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 pt-1">
              <button
                type="button"
                onClick={nextActionHandler}
                className="min-h-[40px] px-4 py-2 rounded-xl bg-pearl-gold hover:bg-pearl-gold-light text-pearl-text text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap"
              >
                <span>{nextActionButtonLabel}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

            </div>
          </div>

          {/* Right Malaba Border Post Photo with Gold Accent Divider */}
          <div className="hidden md:block md:col-span-5 relative min-h-[190px] bg-pearl-dark">
            {!bannerImgError ? (
              <img
                src={malabaBorderPhoto}
                alt="Malaba One-Stop Border Post terminal canopy"
                referrerPolicy="no-referrer"
                onError={() => setBannerImgError(true)}
                className="absolute inset-0 w-full h-full object-cover object-center"
              />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-pearl-dark to-pearl-navy" />
            )}

            {/* Leftward navy gradient fade for seamless blend */}
            <div
              className="absolute inset-0 bg-gradient-to-r from-pearl-navy via-pearl-navy/45 to-transparent pointer-events-none"
              aria-hidden="true"
            />

            {/* Curved Pearl Gold accent divider connecting dark navy panel & border photo */}
            <svg
              className="absolute inset-y-0 left-0 h-full w-14 text-pearl-accent pointer-events-none"
              viewBox="0 0 64 220"
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              <path d="M0 0 H28 C52 72, 52 148, 28 220 H0 Z" fill="currentColor" />
              <path
                d="M28 0 C52 72, 52 148, 28 220"
                fill="none"
                stroke="var(--pearl-gold)"
                strokeWidth="3.5"
              />
            </svg>
          </div>
        </div>
      </section>

      {/* 2. Journey & Profile Summary Row */}
      <section
        aria-label="Journey and Profile Summary"
        className="grid grid-cols-1 lg:grid-cols-2 gap-4"
      >
        {/* Your Upcoming Journey Card */}
        <div className="bg-pearl-dark border border-pearl-border rounded-2xl p-5 flex flex-col justify-between gap-4">
          <div className="flex items-start justify-between gap-3 pb-3 border-b border-pearl-border">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-pearl-navy text-pearl-accent flex items-center justify-center shrink-0">
                <Compass className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <h3 className="font-heading text-sm font-bold text-pearl-text">
                  Your Upcoming Journey
                </h3>
                <p className={`text-[11px] font-semibold ${hasJourney ? 'text-pearl-success-light' : 'text-pearl-accent'}`}>
                  {hasJourney ? 'Journey configured' : 'No journey configured'}
                </p>
              </div>
            </div>

            <button
              type="button"
              id="btn-edit-journey-shortcut"
              onClick={onEditJourney}
              className="min-h-[36px] px-3 py-1.5 rounded-lg bg-pearl-surface hover:bg-pearl-input border border-pearl-border text-xs font-semibold text-pearl-text flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              <Edit3 className="w-3.5 h-3.5 text-pearl-text-secondary" />
              <span>{hasJourney ? 'Edit Journey' : 'Set Up Journey'}</span>
            </button>
          </div>

          {hasJourney ? (
            <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="col-span-2 sm:col-span-1 p-3 rounded-xl bg-pearl-surface border border-pearl-border/80">
              <span className="text-[10px] font-bold uppercase tracking-wider text-pearl-placeholder block">
                Border Point
              </span>
              <span className="font-bold text-pearl-text mt-0.5 block truncate" title={currentBorderPoint}>
                {currentBorderPoint}
              </span>
            </div>

            <div className="col-span-2 sm:col-span-1 p-3 rounded-xl bg-pearl-surface border border-pearl-border/80">
              <span className="text-[10px] font-bold uppercase tracking-wider text-pearl-placeholder block">
                Destination
              </span>
              <span className="font-bold text-pearl-text mt-0.5 block truncate" title={currentDestination}>
                {currentDestination}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-pearl-surface border border-pearl-border/80 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-pearl-text-secondary shrink-0" />
              <div className="min-w-0">
                <span className="text-[10px] font-bold uppercase tracking-wider text-pearl-placeholder block">
                  Travel Date
                </span>
                <span className="font-bold text-pearl-text tabular-nums block truncate">
                  {currentTravelDate}
                </span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-pearl-surface border border-pearl-border/80 flex items-center gap-2">
              <ModeIcon className="w-4 h-4 text-pearl-text-secondary shrink-0" />
              <div className="min-w-0">
                <span className="text-[10px] font-bold uppercase tracking-wider text-pearl-placeholder block">
                  Transport Mode
                </span>
                <span className="font-bold text-pearl-text uppercase block truncate">
                  {currentMode}
                </span>
              </div>
            </div>
            </div>
          ) : (
            <div className="rounded-xl bg-pearl-surface border border-pearl-border/80 p-4">
              <p className="text-sm font-semibold text-pearl-text">No journey yet.</p>
              <p className="mt-1 text-xs text-pearl-text-secondary">
                Choose your border, date and transport.
              </p>
            </div>
          )}
        </div>

        {/* Traveller Profile Card */}
        <div className="bg-pearl-dark border border-pearl-border rounded-2xl p-5 flex flex-col justify-between gap-4">
          <div className="flex items-start justify-between gap-3 pb-3 border-b border-pearl-border">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-pearl-navy text-pearl-accent flex items-center justify-center shrink-0">
                <User className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <h3 className="font-heading text-sm font-bold text-pearl-text">
                  Traveller Profile
                </h3>
                <p
                  className={`text-[11px] font-semibold ${
                    isProfileComplete ? 'text-pearl-success-light' : 'text-pearl-accent'
                  }`}
                >
                  {isProfileComplete ? 'Profile Complete' : 'Profile Incomplete'}
                </p>
              </div>
            </div>

            <button
              type="button"
              id="btn-edit-profile-shortcut"
              onClick={() => onSelectTab('profile')}
              className="min-h-[36px] px-3 py-1.5 rounded-lg bg-pearl-surface hover:bg-pearl-input border border-pearl-border text-xs font-semibold text-pearl-text flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              <Eye className="w-3.5 h-3.5 text-pearl-text-secondary" />
              <span>View Profile</span>
            </button>
          </div>

          <div className="flex items-center gap-3.5 p-3 rounded-xl bg-pearl-surface border border-pearl-border/80">
            {profile.avatarUrl ? (
              <img
                src={profile.avatarUrl}
                alt={profile.fullName}
                referrerPolicy="no-referrer"
                className="w-12 h-12 rounded-xl object-cover border border-pearl-border shrink-0"
              />
            ) : (
              <div className="w-12 h-12 rounded-xl bg-pearl-navy text-pearl-accent font-bold text-base flex items-center justify-center shrink-0">
                {initials || 'PT'}
              </div>
            )}

            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-pearl-text truncate">{profile.fullName}</p>
              <p className="text-xs text-pearl-text-secondary truncate">
                {profile.nationality || 'Nationality not provided'}
              </p>
              <p className="text-[11px] text-pearl-placeholder truncate mt-0.5 capitalize">
                Travel purpose: {profile.travelPurpose || 'Not set'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-2.5 rounded-xl bg-pearl-surface border border-pearl-border/80">
              <span className="text-[10px] font-bold uppercase tracking-wider text-pearl-placeholder block">
                Profile Status
              </span>
              <span className={`font-semibold truncate block mt-0.5 ${isProfileComplete ? 'text-pearl-success-light' : 'text-pearl-accent'}`}>
                {isProfileComplete ? 'Complete' : 'In progress'}
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-pearl-surface border border-pearl-border/80 flex items-center">
              <button
                type="button"
                onClick={() => onSelectTab('profile')}
                className="min-h-[36px] w-full text-left font-semibold text-pearl-text hover:text-pearl-accent transition-colors cursor-pointer"
              >
                Review profile details
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Travel Readiness (Primary Feature) + What You Need To Do Next */}
      <section
        aria-label="Travel Readiness and Next Steps"
        className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch"
      >
        {/* Dark Navy Travel Readiness Panel */}
        <div className="lg:col-span-12 rounded-2xl bg-pearl-navy border border-pearl-border p-5 sm:p-6 text-pearl-text flex flex-col justify-between gap-5">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-pearl-border">
            <div>
              <h3 className="font-heading text-lg font-bold text-pearl-text">
                Travel Readiness
              </h3>
            </div>

            <span
              className={`text-xs font-bold flex items-center gap-1.5 ${
                !hasAssessment
                  ? 'text-pearl-placeholder'
                  : isAllReady
                  ? 'text-pearl-success-light'
                  : hasCriticalMissing
                  ? 'text-pearl-danger-light'
                  : 'text-pearl-accent'
              }`}
            >
              {isAllReady ? (
                <CheckCircle2 className="w-4 h-4 text-pearl-success-light" />
              ) : (
                <AlertCircle className="w-4 h-4" />
              )}
              <span>
                {!hasAssessment
                  ? 'Assessment Pending'
                  : isAllReady
                  ? 'Ready for Crossing'
                  : hasCriticalMissing
                  ? 'Critical Requirements Missing'
                  : 'Action Needed'}
              </span>
            </span>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-6">
            {/* Circular Progress Gauge */}
            <div className="relative w-32 h-32 shrink-0 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 110 110">
                <circle
                  cx="55"
                  cy="55"
                  r={radius}
                  stroke="var(--pearl-border)"
                  strokeWidth="10"
                  fill="transparent"
                />
                <circle
                  cx="55"
                  cy="55"
                  r={radius}
                  stroke="var(--pearl-gold)"
                  strokeWidth="10"
                  strokeLinecap="round"
                  fill="transparent"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  className="transition-all duration-700 ease-out"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="font-heading text-3xl font-bold text-pearl-text tabular-nums leading-none">
                  {hasAssessment ? `${readiness.score}%` : '--'}
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-pearl-placeholder mt-1">
                  Readiness
                </span>
              </div>
            </div>

            {/* Readiness Counters */}
            <div className="flex-1 w-full space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-pearl-dark border border-pearl-border">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-pearl-placeholder block">
                    Completed
                  </span>
                  <span className="text-lg font-bold text-pearl-text tabular-nums mt-0.5 block">
                    {readiness.completedCount} / {readiness.totalCount}
                  </span>
                  <span className="text-[11px] text-pearl-text-secondary">Verified</span>
                </div>

                <div className="p-3 rounded-xl bg-pearl-dark border border-pearl-border">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-pearl-placeholder block">
                    Outstanding
                  </span>
                  <span
                    className={`text-lg font-bold tabular-nums mt-0.5 block ${
                      readiness.missingMandatoryCount > 0
                        ? 'text-pearl-danger-light'
                        : readiness.missingItems.length > 0
                        ? 'text-pearl-accent'
                        : 'text-pearl-success-light'
                    }`}
                  >
                    {readiness.missingItems.length}
                  </span>
                  <span className="text-[11px] text-pearl-text-secondary">
                    {readiness.missingMandatoryCount > 0
                      ? `${readiness.missingMandatoryCount} mandatory`
                      : 'No mandatory gaps'}
                  </span>
                </div>
              </div>

              {hasCriticalMissing && (
                <div className="p-3 rounded-xl bg-pearl-danger/15 border border-pearl-danger/40 text-xs text-pearl-danger-light flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-pearl-danger-light shrink-0 mt-0.5" />
                  <span>
                    Missing mandatory item
                    {mandatoryMissing.length > 1 ? 's' : ''}:{' '}
                    <strong className="text-pearl-text">
                      {mandatoryMissing.map((m) => m.title).join(', ')}
                    </strong>
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-pearl-border">
            <button
              type="button"
              onClick={() => onSelectTab('checklist')}
              className="min-h-[40px] px-4 py-2 rounded-xl bg-pearl-gold hover:bg-pearl-gold-light text-pearl-text text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap"
            >
              <span>Open Checklist</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              id="btn-view-qr-summary"
              onClick={() => onSelectTab('qr')}
              className="min-h-[40px] px-4 py-2 rounded-xl bg-pearl-dark hover:bg-pearl-surface border border-pearl-border text-pearl-text text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
            >
              <QrCode className="w-3.5 h-3.5 text-pearl-accent" />
              <span>QR Pass</span>
            </button>
          </div>
        </div>

      </section>

      {/* 4. Travel Services Grid */}
      <section aria-label="Travel Services" className="space-y-3 pt-1">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h3 className="font-heading text-base sm:text-lg font-bold text-pearl-text">
              Shortcuts
            </h3>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {services.map((service) => {
            const Icon = service.icon;
            const isMultimedia = service.tab === 'multimedia';
            return (
              <div
                key={service.tab}
                className="bg-pearl-dark hover:bg-pearl-surface border border-pearl-border hover:border-pearl-border/40 rounded-2xl p-4 sm:p-5 flex flex-col justify-between gap-4 transition-colors"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="w-10 h-10 rounded-xl bg-pearl-navy text-pearl-accent flex items-center justify-center shrink-0">
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-[11px] font-semibold text-pearl-text-secondary tabular-nums">
                      {service.metric}
                    </span>
                  </div>

                  <div>
                    <h4 className="font-heading text-sm font-bold text-pearl-text">
                      {service.title}
                    </h4>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-pearl-border/70">
                  <button
                    type="button"
                    id={service.id}
                    onClick={() => onSelectTab(service.tab)}
                    className="flex-1 min-h-[38px] px-3 py-1.5 rounded-lg bg-pearl-navy hover:bg-pearl-dark text-pearl-text text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
                  >
                    <span>Open</span>
                    <ArrowRight className="w-3.5 h-3.5 text-pearl-accent" />
                  </button>

                  {isMultimedia && (
                    <button
                      type="button"
                      id="btn-share-video-card"
                      onClick={onOpenShareVideo}
                      title="Share video download link for All Video Downloaders"
                      className="min-h-[38px] px-3 py-1.5 rounded-lg bg-pearl-surface hover:bg-pearl-input border border-pearl-border text-pearl-text text-xs font-semibold flex items-center justify-center gap-1 transition-colors cursor-pointer shrink-0"
                    >
                      <Share2 className="w-3.5 h-3.5 text-pearl-text-secondary" />
                      <span>Share</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 5. Secondary Utility Strip: Audit & Readiness PDF Export */}
      <section
        aria-label="Audit and Export"
        className="bg-pearl-dark border border-pearl-border rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-pearl-navy text-pearl-accent flex items-center justify-center shrink-0">
            <Download className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-heading text-sm font-bold text-pearl-text">
              Review & export
            </h4>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
          <button
            type="button"
            id="btn-open-audit-modal-overview"
            onClick={onOpenReviewAudit}
            className="flex-1 sm:flex-none min-h-[40px] px-4 py-2 rounded-xl bg-pearl-surface hover:bg-pearl-input border border-pearl-border text-xs font-semibold text-pearl-text flex items-center justify-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
          >
            <Eye className="w-3.5 h-3.5 text-pearl-text-secondary" />
            <span>Audit Details</span>
          </button>

          <button
            type="button"
            id="btn-download-pdf-overview"
            onClick={onOpenDownloadPdf}
            className="flex-1 sm:flex-none min-h-[40px] px-4 py-2 rounded-xl bg-pearl-gold hover:bg-pearl-gold-light text-pearl-text text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download PDF</span>
          </button>
        </div>
      </section>
    </div>
  );
};
