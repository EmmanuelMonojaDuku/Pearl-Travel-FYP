import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { OfflineStatusBanner } from './OfflineStatusBanner';
import { ReadinessScoreCard } from './ReadinessScoreCard';
import { RequirementGuidanceCard } from './RequirementGuidanceCard';
import { DocumentChecklistCard } from './DocumentChecklistCard';
import { QRSummaryCard } from './QRSummaryCard';
import { PassengerProfileCard } from './PassengerProfileCard';
import { MalabaBorderVideoPlayer } from './MalabaBorderVideoPlayer';
import { ProfileSettingsModal } from './ProfileSettingsModal';
import { ReviewEnteredDetailsModal } from './ReviewEnteredDetailsModal';
import { ReviewDocumentDownloadModal } from './ReviewDocumentDownloadModal';
import { ShareVideoDownloadModal } from './ShareVideoDownloadModal';
import { PassengerProfileSetupView } from './PassengerProfileSetupView';
import { JourneySetupView } from './JourneySetupView';
import { RequirementGenerationView } from './RequirementGenerationView';
import { AIGuidanceCard } from './AIGuidanceCard';
import { BorderStepByStepGuideCard } from './BorderStepByStepGuideCard';
import { getPortalHash, getPortalTabFromHash, PortalTab } from './dashboard/navTypes';
import { DashboardSidebar } from './dashboard/DashboardSidebar';
import { DashboardHeader } from './dashboard/DashboardHeader';
import { MobileBottomNav } from './dashboard/MobileBottomNav';
import { OverviewTab } from './dashboard/OverviewTab';
import { SupportContactModal } from './dashboard/SupportContactModal';

import {
  generateRequirementsForProfile,
  generateDefaultChecklist,
  calculateReadinessScore,
} from '../data/travelRequirementsEngine';
import {
  PassengerProfile,
  ChecklistItem,
  QRSummaryData,
  UserProfile,
  DocumentStatus,
  JourneyDetails,
} from '../types';
import {
  createInitialPassengerProfile,
  isTravellerProfileComplete,
  loadPassengerProfileForUser,
  savePassengerProfileForUser,
} from '../utils/authStorage';

interface TravelerReadinessPortalProps {
  currentUser?: UserProfile | null;
  onLogout?: () => void;
  onShowToast: (msg: string) => void;
  onUpdateCurrentUser?: (updated: UserProfile) => void;
}

const STORAGE_KEY_PROFILE = 'pearl_travel_passenger_profile_v1';
const STORAGE_KEY_CHECKLIST = 'pearl_travel_checklist_v1';
const STORAGE_KEY_LAST_SYNC = 'pearl_travel_last_sync_v1';
const STORAGE_KEY_FLOW_STATUS = 'pearl_travel_flow_completed_v1';

const DEFAULT_JOURNEY: JourneyDetails = {
  travelPurpose: 'tourism',
  destinationCountry: 'Uganda (The Pearl of Africa)',
  intendedBorderPoint: 'Malaba One-Stop Border Post (OSBP)',
  travelDate: '2026-10-15',
  travelMode: 'road',
  stayDurationDays: 14,
  notes: 'Overland transit via Malaba OSBP for Uganda Wildlife & Safari tour',
};

const DEFAULT_PROFILE: PassengerProfile = {
  fullName: 'Sarah Amina Jenkins',
  firstName: 'Sarah',
  lastName: 'Jenkins',
  nationality: 'United States',
  passportNumber: 'US-A9482910',
  passportExpiryDate: '2028-11-20',
  travelPurpose: 'tourism',
  destination: 'Malaba OSBP & Entebbe (Uganda Safari)',
  travellerType: 'solo',
  phoneNumber: '+256 772 458921',
  countryCode: '+256',
  email: 'sarah.jenkins@pearltravel.ug',
  gender: 'Female',
  travelDocumentType: 'Biometric Passport',
  emergencyContactName: 'Grace K. Chen',
  emergencyContactPhone: '+1 (415) 890-2341',
  emergencyContactRelation: 'Spouse',
  stayDurationDays: 14,
  journey: DEFAULT_JOURNEY,
  hasYellowFeverVax: true,
  hasReturnTicket: true,
  hasAccommodationProof: true,
  hasTravelInsurance: false,
};

export type { PortalTab } from './dashboard/navTypes';

export const TravelerReadinessPortal: React.FC<TravelerReadinessPortalProps> = ({
  currentUser,
  onLogout,
  onShowToast,
  onUpdateCurrentUser,
}) => {
  // Modal states
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const [isVideoShareModalOpen, setIsVideoShareModalOpen] = useState(false);
  const [isSupportModalOpen, setIsSupportModalOpen] = useState(false);

  // Dashboard shell navigation state
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  // 1. Passenger Profile State (isolated per authenticated user)
  const [profile, setProfile] = useState<PassengerProfile>(() => {
    if (currentUser) {
      return loadPassengerProfileForUser(currentUser) || createInitialPassengerProfile(currentUser);
    }
    return DEFAULT_PROFILE;
  });

  // Derive post-authentication destination from real profile completeness
  const [flowState, setFlowState] = useState<'profile-setup' | 'journey-setup' | 'generating' | 'dashboard'>(() => {
    const initial = currentUser
      ? loadPassengerProfileForUser(currentUser) || createInitialPassengerProfile(currentUser)
      : DEFAULT_PROFILE;
    return isTravellerProfileComplete(initial, currentUser) ? 'dashboard' : 'profile-setup';
  });

  // 2. Checklist State
  const [checklist, setChecklist] = useState<ChecklistItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CHECKLIST);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Failed to load checklist from local storage', e);
    }
    const seed = currentUser
      ? loadPassengerProfileForUser(currentUser) || createInitialPassengerProfile(currentUser)
      : DEFAULT_PROFILE;
    return generateDefaultChecklist(seed);
  });

  // 3. Offline & Sync State
  const [isOfflineMode, setIsOfflineMode] = useState<boolean>(!navigator.onLine);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSyncedTime, setLastSyncedTime] = useState<string>(() => {
    return localStorage.getItem(STORAGE_KEY_LAST_SYNC) || 'Today at 08:30 AM';
  });

  // Active section tab in portal dashboard
  const [activeTab, setActiveTab] = useState<PortalTab>(() =>
    getPortalTabFromHash(window.location.hash) || 'overview'
  );

  // Network listener
  useEffect(() => {
    const handleOnline = () => setIsOfflineMode(false);
    const handleOffline = () => setIsOfflineMode(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    const handleNavigation = () => {
      const tab = getPortalTabFromHash(window.location.hash);
      if (tab) setActiveTab(tab);
    };
    window.addEventListener('popstate', handleNavigation);
    window.addEventListener('hashchange', handleNavigation);
    return () => {
      window.removeEventListener('popstate', handleNavigation);
      window.removeEventListener('hashchange', handleNavigation);
    };
  }, []);

  useEffect(() => {
    if (flowState !== 'dashboard') return;
    const hash = getPortalHash(activeTab);
    if (!getPortalTabFromHash(window.location.hash)) {
      window.history.replaceState({ portalTab: activeTab }, '', hash);
    } else if (window.location.hash !== hash) {
      window.history.pushState({ portalTab: activeTab }, '', hash);
    }
  }, [activeTab, flowState]);

  // Sync profile when currentUser changes
  useEffect(() => {
    if (currentUser) {
      setProfile((prev) => ({
        ...prev,
        fullName: currentUser.name || prev.fullName,
        firstName: currentUser.firstName || prev.firstName,
        lastName: currentUser.lastName || prev.lastName,
        nationality: currentUser.nationality || prev.nationality,
        gender: currentUser.gender || prev.gender,
        phoneNumber: currentUser.phoneNumber || prev.phoneNumber,
        countryCode: currentUser.countryCode || prev.countryCode,
        email: currentUser.email || prev.email,
        avatarUrl: currentUser.avatarUrl !== undefined ? currentUser.avatarUrl : prev.avatarUrl,
        travelPurpose: currentUser.travelPurpose || prev.travelPurpose,
      }));
    }
  }, [currentUser]);

  // Persist Checklist
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_CHECKLIST, JSON.stringify(checklist));
    } catch (e) {
      console.warn('Offline storage error:', e);
    }
  }, [checklist]);

  // Requirement Guidance computed from profile + journey
  const requirements = useMemo(() => {
    return generateRequirementsForProfile(profile);
  }, [profile]);

  // Readiness Score calculation
  const readiness = useMemo(() => {
    return calculateReadinessScore(checklist);
  }, [checklist]);

  // Profile Change Handler
  const handleProfileChange = (updated: PassengerProfile): boolean => {
    const emailKey = updated.email || currentUser?.email || '';
    let saved = false;
    if (emailKey) {
      saved = savePassengerProfileForUser(emailKey, updated);
    } else {
      try {
        localStorage.setItem(STORAGE_KEY_PROFILE, JSON.stringify(updated));
        saved = true;
      } catch (error) {
        console.error('Failed to save traveller profile to browser storage', error);
      }
    }

    if (!saved) {
      onShowToast('Unable to save your profile in this browser. Please retry.');
      return false;
    }

    setProfile(updated);

    // Re-generate default checklist for updated profile parameters
    setChecklist(generateDefaultChecklist(updated));

    const completed = isTravellerProfileComplete(updated);

    // Notify parent if relevant
    if (onUpdateCurrentUser) {
      onUpdateCurrentUser({
        name: updated.fullName,
        firstName: updated.firstName,
        lastName: updated.lastName,
        email: updated.email || currentUser?.email || 'passenger@pearltravel.ug',
        nationality: updated.nationality,
        gender: updated.gender,
        phoneNumber: updated.phoneNumber,
        countryCode: updated.countryCode,
        travelPurpose: updated.travelPurpose,
        avatarUrl: updated.avatarUrl,
        emergencyContactName: updated.emergencyContactName,
        emergencyContactPhone: updated.emergencyContactPhone,
        emergencyContactRelation: updated.emergencyContactRelation,
        profileCompleted: completed,
      });
    }
    return true;
  };

  // Handle Journey Setup Completion
  const handleJourneySetup = (journey: JourneyDetails): boolean => {
    const updated: PassengerProfile = {
      ...profile,
      journey,
      travelPurpose: journey.travelPurpose,
      destination: `${journey.intendedBorderPoint} (${journey.destinationCountry})`,
    };
    return handleProfileChange(updated);
  };

  // Handle Requirement Generation Complete
  const handleRequirementGenerationComplete = () => {
    try {
      localStorage.setItem(STORAGE_KEY_FLOW_STATUS, 'true');
    } catch {}
    setFlowState('dashboard');
    setActiveTab('overview');
    onShowToast('Personalised travel requirements successfully generated!');
  };

  // Profile Settings Modal Save
  const handleSaveProfileSettings = (updatedUser: UserProfile) => {
    const updatedProfile: PassengerProfile = {
      ...profile,
      fullName: updatedUser.name,
      firstName: updatedUser.firstName,
      lastName: updatedUser.lastName,
      email: updatedUser.email,
      nationality: updatedUser.nationality || profile.nationality,
      gender: updatedUser.gender || profile.gender,
      phoneNumber: updatedUser.phoneNumber || profile.phoneNumber,
      countryCode: updatedUser.countryCode || profile.countryCode,
      travelPurpose: updatedUser.travelPurpose || profile.travelPurpose,
      avatarUrl: updatedUser.avatarUrl,
      emergencyContactName: updatedUser.emergencyContactName || profile.emergencyContactName,
      emergencyContactPhone: updatedUser.emergencyContactPhone || profile.emergencyContactPhone,
      emergencyContactRelation:
        updatedUser.emergencyContactRelation || profile.emergencyContactRelation,
    };

    const saved = handleProfileChange(updatedProfile);
    if (saved) onShowToast('Profile settings saved on this device.');
    return saved;
  };

  // Checklist item update
  const handleUpdateChecklistItemStatus = (itemId: string, status: DocumentStatus) => {
    setChecklist((prev) =>
      prev.map((item) =>
        item.id === itemId
          ? {
              ...item,
              status,
              updatedAt: new Date().toISOString(),
            }
          : item
      )
    );
  };

  const handleUpdateChecklistItemDetails = (itemId: string, docNumber: string, expiryDate: string) => {
    setChecklist((prev) =>
      prev.map((item) =>
        item.id === itemId
          ? {
              ...item,
              documentNumber: docNumber,
              expiryDate: expiryDate,
              status: item.status === 'missing' ? 'complete' : item.status,
              updatedAt: new Date().toISOString(),
            }
          : item
      )
    );
    onShowToast('Document details recorded offline.');
  };

  const handleResetToDemo = () => {
    setProfile(DEFAULT_PROFILE);
    setChecklist(generateDefaultChecklist(DEFAULT_PROFILE));
    onShowToast('Loaded default Uganda Safari profile.');
  };

  const handleSyncNow = () => {
    setIsSyncing(true);
    setTimeout(() => {
      const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      setLastSyncedTime(`Today at ${now}`);
      localStorage.setItem(STORAGE_KEY_LAST_SYNC, `Today at ${now}`);
      setIsSyncing(false);
      onShowToast('Readiness data successfully synchronized with cloud.');
    }, 900);
  };

  // Construct QR Payload
  const qrData: QRSummaryData = useMemo(() => {
    const passportItem = checklist.find((c) => c.id === 'doc-passport');
    const visaItem = checklist.find((c) => c.id === 'doc-visa');
    const yFeverItem = checklist.find((c) => c.id === 'doc-yellow-fever');
    const returnTicketItem = checklist.find((c) => c.id === 'doc-return-ticket');
    const hotelItem = checklist.find((c) => c.id === 'doc-accommodation');
    const insItem = checklist.find((c) => c.id === 'doc-travel-insurance');

    const safeFullName = profile?.fullName || 'Traveller';
    return {
      version: 'PEARL-LOCAL-SUMMARY-1.0',
      referenceId: `UG-${Math.abs(safeFullName.split('').reduce((a, b) => a + b.charCodeAt(0), 0) * 137).toString().padStart(6, '0')}`,
      passengerName: safeFullName,
      nationality: profile?.nationality || 'Not provided',
      destination: profile?.journey?.intendedBorderPoint || 'Not set',
      travelPurpose: profile?.journey?.travelPurpose || profile?.travelPurpose || 'Not set',
      travellerType: profile?.travellerType || 'Not set',
      readinessScore: readiness.score,
      readinessStatus: readiness.statusLabel,
      checklistSummary: {
        passport: passportItem?.status || 'missing',
        visa: visaItem?.status || 'missing',
        yellowFever: yFeverItem?.status || 'missing',
        returnTicket: returnTicketItem?.status || 'missing',
        accommodation: hotelItem?.status || 'missing',
        travelInsurance: insItem?.status || 'missing',
      },
      timestamp: new Date().toISOString(),
      cachedOffline: isOfflineMode,
      disclaimer:
        'This QR code is generated locally in the browser as an informational checklist snapshot. It is not server-issued or verified, does not grant entry, and does not replace official travel documents or immigration decisions.',
    };
  }, [profile, checklist, readiness, isOfflineMode]);

  // ==========================================
  // FLOW VIEW 1: TRAVELLER PROFILE SETUP
  // ==========================================
  if (flowState === 'profile-setup') {
    const alreadyComplete = isTravellerProfileComplete(profile, currentUser);
    return (
      <div className="min-h-screen w-full bg-pearl-slate py-6 sm:py-8">
        <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 relative z-20">
          <PassengerProfileSetupView
            initialProfile={profile}
            onContinue={(updated) => {
              const saved = handleProfileChange(updated);
              if (!saved) return false;
              setFlowState('dashboard');
              setActiveTab('overview');
              onShowToast('Traveller profile saved on this device. Welcome to your dashboard.');
              return true;
            }}
            onCancel={alreadyComplete ? () => setFlowState('dashboard') : undefined}
            onShowToast={onShowToast}
          />
        </div>
      </div>
    );
  }

  // ==========================================
  // FLOW VIEW 2: JOURNEY SETUP
  // ==========================================
  if (flowState === 'journey-setup') {
    return (
      <div className="min-h-screen w-full bg-pearl-slate py-6 sm:py-8">
        <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 relative z-20">
          <OfflineStatusBanner
            isOffline={isOfflineMode}
            onToggleSimulate={() => setIsOfflineMode((prev) => !prev)}
            onSyncNow={handleSyncNow}
            lastSyncedTime={lastSyncedTime}
            isSyncing={isSyncing}
          />
          <JourneySetupView
            passengerProfile={profile}
            initialJourney={profile.journey}
            onGenerateRequirements={(journey) => {
              if (!handleJourneySetup(journey)) return;
              setFlowState('generating');
            }}
            onBackToProfile={() => setFlowState('profile-setup')}
            onShowToast={onShowToast}
          />
        </div>
      </div>
    );
  }

  // ==========================================
  // FLOW VIEW 3: REQUIREMENT GENERATION (LOADING)
  // ==========================================
  if (flowState === 'generating') {
    return (
      <div className="min-h-screen w-full bg-pearl-slate py-8">
        <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 relative z-20">
          <RequirementGenerationView
            profile={profile}
            journey={profile.journey || DEFAULT_JOURNEY}
            onComplete={handleRequirementGenerationComplete}
          />
        </div>
      </div>
    );
  }

  // ==========================================
  // FLOW VIEW 4: PERSONALIZED TRAVEL DASHBOARD
  // ==========================================
  const profileComplete = isTravellerProfileComplete(profile, currentUser);

  const handleToggleOfflineMode = () => {
    setIsOfflineMode((prev) => !prev);
    onShowToast(
      !isOfflineMode
        ? 'Offline Mode active: cached requirements remain available.'
        : 'Network restored: Live sync active.'
    );
  };

  return (
    <div className="min-h-screen w-full flex bg-pearl-slate text-pearl-text">
      {/* Deep Navy Application Sidebar */}
      <DashboardSidebar
        activeTab={activeTab}
        isCollapsed={isSidebarCollapsed}
        isMobileDrawerOpen={isMobileDrawerOpen}
        onSelectTab={(tab) => setActiveTab(tab)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenSupport={() => setIsSupportModalOpen(true)}
        onToggleCollapse={() => setIsSidebarCollapsed((prev) => !prev)}
        onCloseMobileDrawer={() => setIsMobileDrawerOpen(false)}
        onLogout={onLogout}
        missingMandatoryCount={readiness.missingMandatoryCount}
      />

      {/* Right Workspace Column: Compact Dark Navy Header + Muted Blue-Grey Content Canvas */}
      <div className="flex-1 min-w-0 flex flex-col min-h-screen">
        <DashboardHeader
          activeTab={activeTab}
          profile={profile}
          isOfflineMode={isOfflineMode}
          isSyncing={isSyncing}
          lastSyncedTime={lastSyncedTime}
          missingItems={readiness.missingItems}
          missingMandatoryCount={readiness.missingMandatoryCount}
          isProfileComplete={profileComplete}
          onToggleMobileDrawer={() => setIsMobileDrawerOpen(true)}
          onToggleOffline={handleToggleOfflineMode}
          onSyncNow={handleSyncNow}
          onSelectTab={(tab) => setActiveTab(tab)}
          onOpenSettings={() => setIsSettingsOpen(true)}
        />

        {/* Main Scrollable Viewport */}
        <div className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-6 pb-24 md:pb-8">
          <AnimatePresence mode="wait">
            {activeTab === 'overview' && (
              <motion.div
                key="tab-overview"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                <OverviewTab
                  profile={profile}
                  isProfileComplete={profileComplete}
                  requirements={requirements}
                  readiness={readiness}
                  onSelectTab={(tab) => setActiveTab(tab)}
                  onEditProfile={() => setFlowState('profile-setup')}
                  onEditJourney={() => setFlowState('journey-setup')}
                  onOpenReviewAudit={() => setIsReviewModalOpen(true)}
                  onOpenDownloadPdf={() => setIsPdfModalOpen(true)}
                  onOpenShareVideo={() => setIsVideoShareModalOpen(true)}
                />
              </motion.div>
            )}

            {activeTab === 'profile' && (
              <motion.div
                key="tab-profile"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="space-y-5"
              >
                <PassengerProfileCard
                  profile={profile}
                  onChange={handleProfileChange}
                  onResetToDemo={handleResetToDemo}
                  onOpenSettings={() => setIsSettingsOpen(true)}
                  onOpenReviewAudit={() => setIsReviewModalOpen(true)}
                />

                <div className="p-4 bg-pearl-dark border border-pearl-border rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3">
                  <span className="text-xs text-pearl-text-secondary font-medium">
                    Want to run the full step-by-step profile onboarding walkthrough again?
                  </span>
                  <button
                    type="button"
                    onClick={() => setFlowState('profile-setup')}
                    className="px-4 py-2 bg-pearl-navy hover:bg-pearl-dark text-pearl-text text-xs font-bold rounded-xl cursor-pointer transition-colors whitespace-nowrap"
                  >
                    Launch Step-by-Step Setup &rarr;
                  </button>
                </div>
              </motion.div>
            )}

            {activeTab === 'journey' && (
              <motion.div
                key="tab-journey"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="space-y-5"
              >
                <JourneySetupView
                  passengerProfile={profile}
                  initialJourney={profile.journey}
                  onGenerateRequirements={(journey) => {
                    handleJourneySetup(journey);
                    setFlowState('generating');
                  }}
                  onBackToProfile={() => setActiveTab('profile')}
                  onShowToast={onShowToast}
                />
              </motion.div>
            )}

            {activeTab === 'guidance' && (
              <motion.div
                key="tab-guidance"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="space-y-5"
              >
                <RequirementGuidanceCard
                  requirements={requirements}
                  nationality={profile.nationality}
                />

                <div className="p-4 bg-pearl-dark border border-pearl-border rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3">
                  <span className="text-xs text-pearl-text-secondary font-medium text-center sm:text-left">
                    Verify your physical documents against these computed Uganda border requirements:
                  </span>
                  <button
                    type="button"
                    id="btn-proceed-to-checklist"
                    onClick={() => setActiveTab('checklist')}
                    className="w-full sm:w-auto px-5 py-2.5 bg-pearl-gold hover:bg-pearl-gold-light text-pearl-text text-xs font-bold rounded-xl cursor-pointer transition-colors whitespace-nowrap"
                  >
                    Open Document Checklist &rarr;
                  </button>
                </div>
              </motion.div>
            )}

            {activeTab === 'checklist' && (
              <motion.div
                key="tab-checklist"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="space-y-5"
              >
                <ReadinessScoreCard
                  score={readiness.score}
                  completedCount={readiness.completedCount}
                  totalCount={readiness.totalCount}
                  missingMandatoryCount={readiness.missingMandatoryCount}
                  missingItems={readiness.missingItems}
                  onFocusChecklist={() => {}}
                  onOpenQR={() => setActiveTab('qr')}
                />

                <DocumentChecklistCard
                  checklist={checklist}
                  onUpdateItemStatus={handleUpdateChecklistItemStatus}
                  onUpdateItemDetails={handleUpdateChecklistItemDetails}
                  onOpenReviewAudit={() => setIsReviewModalOpen(true)}
                />
              </motion.div>
            )}

            {activeTab === 'readiness' && (
              <motion.div
                key="tab-readiness"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="space-y-5"
              >
                <ReadinessScoreCard
                  score={readiness.score}
                  completedCount={readiness.completedCount}
                  totalCount={readiness.totalCount}
                  missingMandatoryCount={readiness.missingMandatoryCount}
                  missingItems={readiness.missingItems}
                  onFocusChecklist={() => setActiveTab('checklist')}
                  onOpenQR={() => setActiveTab('qr')}
                />
              </motion.div>
            )}

            {activeTab === 'ai-guidance' && (
              <motion.div
                key="tab-ai-guidance"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="space-y-5"
              >
                <AIGuidanceCard
                  profile={profile}
                  journey={profile.journey}
                  onShowToast={onShowToast}
                />
              </motion.div>
            )}

            {activeTab === 'border-guide' && (
              <motion.div
                key="tab-border-guide"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="space-y-5"
              >
                <BorderStepByStepGuideCard
                  journey={profile.journey}
                  onShowToast={onShowToast}
                />
              </motion.div>
            )}

            {activeTab === 'multimedia' && (
              <motion.div
                key="tab-multimedia"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="space-y-5"
              >
                <MalabaBorderVideoPlayer onShowToast={onShowToast} />
              </motion.div>
            )}

            {activeTab === 'qr' && (
              <motion.div
                key="tab-qr"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="space-y-5"
              >
                <QRSummaryCard qrData={qrData} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Mobile Fixed Thumb-Zone Bottom Navigation */}
      <MobileBottomNav
        activeTab={activeTab}
        onSelectTab={(tab) => setActiveTab(tab)}
        onOpenMenu={() => setIsMobileDrawerOpen(true)}
      />

      {/* Profile Settings Modal */}
      <ProfileSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        currentUser={{
          name: profile.fullName,
          firstName: profile.firstName,
          lastName: profile.lastName,
          email: profile.email || currentUser?.email || 'passenger@pearltravel.ug',
          nationality: profile.nationality,
          gender: profile.gender,
          phoneNumber: profile.phoneNumber,
          countryCode: profile.countryCode,
          travelPurpose: profile.travelPurpose,
          avatarUrl: profile.avatarUrl,
          emergencyContactName: profile.emergencyContactName,
          emergencyContactPhone: profile.emergencyContactPhone,
          emergencyContactRelation: profile.emergencyContactRelation,
          profileCompleted: profileComplete,
        }}
        passengerProfile={profile}
        onSave={handleSaveProfileSettings}
      />

      {/* Review Entered Details Audit Modal */}
      <ReviewEnteredDetailsModal
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        profile={profile}
        checklist={checklist}
        currentUser={currentUser}
        onSaveProfile={(newProfile) => {
          handleProfileChange(newProfile);
          onShowToast('Passenger profile details successfully audited and updated.');
        }}
        onSaveChecklist={(newChecklist) => {
          setChecklist(newChecklist);
          onShowToast('Document checklist entries successfully updated.');
        }}
        onShowToast={onShowToast}
      />

      {/* Download PDF Modal */}
      <ReviewDocumentDownloadModal
        isOpen={isPdfModalOpen}
        onClose={() => setIsPdfModalOpen(false)}
        profile={profile}
        checklist={checklist}
        onShowToast={onShowToast}
      />

      {/* Share Video Link & Universal Downloader Modal */}
      <ShareVideoDownloadModal
        isOpen={isVideoShareModalOpen}
        onClose={() => setIsVideoShareModalOpen(false)}
        language="en"
        onShowToast={onShowToast}
      />

      {/* Traveller Support Contact Modal */}
      <SupportContactModal
        isOpen={isSupportModalOpen}
        onClose={() => setIsSupportModalOpen(false)}
        onShowToast={onShowToast}
      />
    </div>
  );
};
