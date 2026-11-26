import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  User,
  Phone,
  Mail,
  Globe,
  Compass,
  MapPin,
  Calendar,
  HeartHandshake,
  HeartPulse,
  Plane,
  Building,
  ShieldAlert,
  Camera,
  Trash2,
  Edit3,
  Check,
  RotateCcw,
  Sparkles,
  FileCheck,
  AlertCircle,
  Eye,
  Search,
  Filter,
} from 'lucide-react';
import { PassengerProfile, ChecklistItem, UserProfile, GenderType, TravelPurpose, TravellerType } from '../types';
import { POPULAR_NATIONALITIES, POPULAR_DESTINATIONS } from '../data/travelRequirementsEngine';

interface ReviewEnteredDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: PassengerProfile;
  checklist?: ChecklistItem[];
  currentUser?: UserProfile | null;
  onSaveProfile: (updated: PassengerProfile) => void;
  onSaveChecklist?: (updated: ChecklistItem[]) => void;
  onShowToast: (msg: string) => void;
}

type FilterCategory = 'all' | 'identity' | 'contact' | 'travel' | 'clearances' | 'checklist';

export const ReviewEnteredDetailsModal: React.FC<ReviewEnteredDetailsModalProps> = ({
  isOpen,
  onClose,
  profile,
  checklist = [],
  currentUser,
  onSaveProfile,
  onSaveChecklist,
  onShowToast,
}) => {
  // Local editable copy of profile & checklist
  const [draftProfile, setDraftProfile] = useState<PassengerProfile>({ ...profile });
  const [draftChecklist, setDraftChecklist] = useState<ChecklistItem[]>([...checklist]);

  // Track deleted fields for undo
  const [undoStack, setUndoStack] = useState<{
    profile: PassengerProfile;
    checklist: ChecklistItem[];
    label: string;
  } | null>(null);

  // Active category filter & search query
  const [activeCategory, setActiveCategory] = useState<FilterCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Editing states for specific fields: key -> boolean
  const [editingField, setEditingField] = useState<string | null>(null);
  const [tempValue, setTempValue] = useState<string>('');

  // Confirm modal for bulk clear
  const [showBulkClearConfirm, setShowBulkClearConfirm] = useState(false);

  // Sync draft when modal opens
  React.useEffect(() => {
    if (isOpen) {
      setDraftProfile({ ...profile });
      setDraftChecklist([...checklist]);
      setUndoStack(null);
      setEditingField(null);
      setSearchQuery('');
    }
  }, [isOpen, profile, checklist]);

  // Count populated fields (declared unconditionally before early return)
  const stats = useMemo(() => {
    let populated = 0;
    const total = 14;

    if (draftProfile.firstName) populated++;
    if (draftProfile.lastName) populated++;
    if (draftProfile.nationality) populated++;
    if (draftProfile.gender && draftProfile.gender !== 'Prefer not to say') populated++;
    if (draftProfile.phoneNumber) populated++;
    if (draftProfile.email) populated++;
    if (draftProfile.emergencyContactName) populated++;
    if (draftProfile.emergencyContactPhone) populated++;
    if (draftProfile.destination) populated++;
    if (draftProfile.travelPurpose) populated++;
    if (draftProfile.passportNumber) populated++;
    if (draftProfile.passportExpiryDate) populated++;
    if (draftProfile.notes) populated++;
    if (draftProfile.avatarUrl) populated++;

    return {
      populated,
      total,
      optionalBlank: total - populated,
    };
  }, [draftProfile]);

  if (!isOpen) return null;

  // Helper to push state for undo
  const pushUndo = (label: string) => {
    setUndoStack({
      profile: { ...draftProfile },
      checklist: [...draftChecklist],
      label,
    });
  };

  const handleUndo = () => {
    if (undoStack) {
      setDraftProfile(undoStack.profile);
      setDraftChecklist(undoStack.checklist);
      onShowToast(`Undid: ${undoStack.label}`);
      setUndoStack(null);
    }
  };

  // Field Deletion Handlers
  const handleDeleteField = (fieldKey: keyof PassengerProfile, label: string) => {
    pushUndo(`Deleted ${label}`);
    const updated = { ...draftProfile };

    if (fieldKey === 'phoneNumber') {
      updated.phoneNumber = '';
    } else if (fieldKey === 'email') {
      updated.email = '';
    } else if (fieldKey === 'emergencyContactName') {
      updated.emergencyContactName = '';
    } else if (fieldKey === 'emergencyContactPhone') {
      updated.emergencyContactPhone = '';
    } else if (fieldKey === 'emergencyContactRelation') {
      updated.emergencyContactRelation = '';
    } else if (fieldKey === 'avatarUrl') {
      updated.avatarUrl = undefined;
    } else if (fieldKey === 'notes') {
      updated.notes = '';
    } else if (fieldKey === 'passportNumber') {
      updated.passportNumber = '';
    } else if (fieldKey === 'passportExpiryDate') {
      updated.passportExpiryDate = '';
    } else if (fieldKey === 'lastName') {
      updated.lastName = '';
      updated.fullName = updated.firstName || 'Passenger';
    } else if (fieldKey === 'gender') {
      updated.gender = 'Prefer not to say';
    }

    setDraftProfile(updated);
    onShowToast(`Deleted ${label}. You can undo if this was accidental.`);
  };

  // Clear entire Emergency Contact section
  const handleClearEmergencySection = () => {
    pushUndo('Emergency Contact Section');
    setDraftProfile({
      ...draftProfile,
      emergencyContactName: '',
      emergencyContactPhone: '',
      emergencyContactRelation: '',
    });
    onShowToast('Cleared all emergency contact details.');
  };

  // Clear all non-mandatory optional information
  const handleBulkClearOptionalData = () => {
    pushUndo('All Optional Details');
    setDraftProfile({
      ...draftProfile,
      phoneNumber: '',
      emergencyContactName: '',
      emergencyContactPhone: '',
      emergencyContactRelation: '',
      avatarUrl: undefined,
      notes: '',
      passportNumber: '',
      passportExpiryDate: '',
      hasTravelInsurance: false,
    });

    // Also clear custom document references on checklist
    const clearedChecklist = draftChecklist.map((item) => ({
      ...item,
      docNumber: undefined,
      expiryDate: undefined,
    }));
    setDraftChecklist(clearedChecklist);

    setShowBulkClearConfirm(false);
    onShowToast('Removed all optional information entered in error.');
  };

  // Delete checklist item reference info
  const handleDeleteChecklistItemDetails = (itemId: string, itemTitle: string) => {
    pushUndo(`Doc details for ${itemTitle}`);
    setDraftChecklist((prev) =>
      prev.map((item) =>
        item.id === itemId
          ? {
              ...item,
              docNumber: undefined,
              expiryDate: undefined,
            }
          : item
      )
    );
    onShowToast(`Removed document reference for ${itemTitle}.`);
  };

  // Start inline edit
  const startEdit = (fieldKey: string, initialVal: string) => {
    setEditingField(fieldKey);
    setTempValue(initialVal);
  };

  // Save inline edit
  const saveEdit = (fieldKey: keyof PassengerProfile) => {
    const updated = { ...draftProfile };
    if (fieldKey === 'firstName') {
      updated.firstName = tempValue.trim();
      updated.fullName = `${tempValue.trim()} ${updated.lastName || ''}`.trim() || 'Passenger';
    } else if (fieldKey === 'lastName') {
      updated.lastName = tempValue.trim();
      updated.fullName = `${updated.firstName || ''} ${tempValue.trim()}`.trim() || 'Passenger';
    } else if (fieldKey === 'stayDurationDays') {
      updated.stayDurationDays = parseInt(tempValue) || 1;
    } else {
      (updated as any)[fieldKey] = tempValue;
    }

    setDraftProfile(updated);
    setEditingField(null);
    onShowToast('Updated details.');
  };

  // Save all changes & exit
  const handleSaveAllAndClose = () => {
    onSaveProfile(draftProfile);
    if (onSaveChecklist) {
      onSaveChecklist(draftChecklist);
    }
    onShowToast('All reviewed details saved successfully!');
    onClose();
  };


  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-pearl-navy/60 backdrop-blur-xs">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ duration: 0.25 }}
        className="relative w-full max-w-3xl bg-pearl-dark rounded-2xl p-5 sm:p-7 max-h-[92vh] flex flex-col shadow-2xl border border-pearl-border overflow-hidden"
      >
        {/* Top Header */}
        <div className="flex items-center justify-between pb-4 border-b border-pearl-border shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-pearl-navy text-pearl-gold-light flex items-center justify-center shrink-0">
              <Eye className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-pearl-gold-light">
                  Passenger Verification • Audit &amp; Cleanse Data
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-pearl-text font-heading">
                Review Entered Details
              </h2>
              <p className="text-xs text-pearl-text-secondary mt-0.5">
                Audit every piece of information entered. Correct typos or delete anything you did not intend to input.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-pearl-surface border border-pearl-border flex items-center justify-center text-pearl-text-secondary hover:text-pearl-text hover:bg-pearl-input cursor-pointer transition-colors"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Undo Floating Notification Bar */}
        {undoStack && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-3 py-2 px-3 rounded-xl bg-pearl-gold/10 border border-pearl-border flex items-center justify-between text-xs text-pearl-gold-light shrink-0"
          >
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-pearl-gold-light shrink-0" />
              <span>
                {undoStack.label} was removed.
              </span>
            </div>
            <button
              type="button"
              onClick={handleUndo}
              className="px-2.5 py-1 rounded-lg bg-pearl-gold/10 hover:bg-pearl-gold-light text-pearl-gold-light font-bold text-xs flex items-center gap-1 cursor-pointer transition"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Undo</span>
            </button>
          </motion.div>
        )}

        {/* Search & Category Filter Bar */}
        <div className="pt-3 pb-2 space-y-2 shrink-0">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
            {/* Search Input */}
            <div className="relative flex-1 bg-pearl-input border border-pearl-border focus-within:border-pearl-border rounded-xl px-3 py-2 flex items-center gap-2">
              <Search className="w-3.5 h-3.5 text-pearl-placeholder shrink-0" />
              <input
                type="text"
                placeholder="Search entered detail (e.g., phone, emergency, passport)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-transparent text-xs font-semibold text-pearl-text outline-none placeholder:text-pearl-placeholder"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="text-pearl-placeholder hover:text-pearl-text text-xs cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Field counter & Bulk Clear */}
            <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
              <span className="text-[11px] font-bold px-2.5 py-1 rounded-md bg-pearl-surface border border-pearl-border text-pearl-text tabular-nums">
                {stats.populated} / {stats.total} Fields Filled
              </span>

              {/* Bulk Clear Button */}
              <button
                type="button"
                onClick={() => setShowBulkClearConfirm(true)}
                className="text-[11px] font-semibold text-pearl-danger-light hover:bg-pearl-input px-2.5 py-1 rounded-lg border border-pearl-danger/30 bg-pearl-input flex items-center gap-1 cursor-pointer transition-colors"
                title="Purge all non-essential optional details entered by mistake"
              >
                <Trash2 className="w-3 h-3" />
                <span>Clear Optional Info</span>
              </button>
            </div>
          </div>

          {/* Categories Filter Bar */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
            {[
              { key: 'all', label: 'All Details' },
              { key: 'identity', label: 'Personal Identity' },
              { key: 'contact', label: 'Contact & Emergency' },
              { key: 'travel', label: 'Travel & Itinerary' },
              { key: 'clearances', label: 'Clearances' },
              { key: 'checklist', label: 'Checklist Refs' },
            ].map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveCategory(tab.key as FilterCategory)}
                className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                  activeCategory === tab.key
                    ? 'bg-pearl-navy text-pearl-text'
                    : 'bg-pearl-surface text-pearl-text-secondary border border-pearl-border hover:text-pearl-text hover:bg-pearl-input'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-4 pt-2">
          {/* SECTION 1: PERSONAL IDENTITY */}
          {(activeCategory === 'all' || activeCategory === 'identity') && (
            <div className="bg-pearl-surface rounded-xl p-4 border border-pearl-border space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-pearl-border">
                <span className="text-xs font-bold uppercase tracking-wider text-pearl-text flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-pearl-gold-light" /> Personal Identity &amp; Photo
                </span>
                <span className="text-[10px] text-pearl-placeholder font-mono">Section 1</span>
              </div>

              {/* Profile Photo */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-pearl-dark border border-pearl-border/80 gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full overflow-hidden bg-pearl-surface border border-pearl-border flex items-center justify-center shrink-0">
                    {draftProfile.avatarUrl ? (
                      <img
                        src={draftProfile.avatarUrl}
                        alt="Avatar"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="w-5 h-5 text-pearl-placeholder" />
                    )}
                  </div>
                  <div>
                    <span className="text-xs font-bold text-pearl-text block">Passenger Photo</span>
                    <span className="text-[11px] text-pearl-placeholder">
                      {draftProfile.avatarUrl ? 'Custom photo attached' : 'No photo uploaded (Default initials)'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {draftProfile.avatarUrl && (
                    <button
                      type="button"
                      onClick={() => handleDeleteField('avatarUrl', 'Passenger Photo')}
                      className="px-2.5 py-1 rounded-lg text-xs font-bold text-pearl-danger-light bg-pearl-danger/15 hover:bg-pearl-danger/15 flex items-center gap-1 cursor-pointer transition"
                      title="Delete / Remove Photo if not intended"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete Photo</span>
                    </button>
                  )}
                </div>
              </div>

              {/* First Name */}
              <div className="p-3 rounded-xl bg-pearl-dark border border-pearl-border/80 flex items-center justify-between gap-3">
                <div className="flex-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-pearl-placeholder block">
                    First Name
                  </span>
                  {editingField === 'firstName' ? (
                    <div className="flex items-center gap-2 mt-1">
                      <input
                        type="text"
                        value={tempValue}
                        onChange={(e) => setTempValue(e.target.value)}
                        className="bg-pearl-input border border-pearl-border focus:border-pearl-border rounded-lg px-2.5 py-1 text-xs font-semibold text-pearl-text outline-none w-full max-w-xs"
                      />
                      <button
                        type="button"
                        onClick={() => saveEdit('firstName')}
                        className="p-1.5 rounded-lg bg-pearl-navy text-pearl-text hover:bg-pearl-surface"
                        title="Save"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingField(null)}
                        className="p-1.5 text-pearl-placeholder hover:text-pearl-text-secondary"
                        title="Cancel"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <p className="text-xs font-bold text-pearl-text mt-0.5">
                      {draftProfile.firstName || <span className="text-pearl-placeholder italic">Not set</span>}
                    </p>
                  )}
                </div>

                {editingField !== 'firstName' && (
                  <button
                    type="button"
                    onClick={() => startEdit('firstName', draftProfile.firstName || '')}
                    className="p-1.5 rounded-lg text-pearl-placeholder hover:text-pearl-navy hover:bg-pearl-surface transition"
                    title="Edit First Name"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Last Name */}
              <div className="p-3 rounded-xl bg-pearl-dark border border-pearl-border/80 flex items-center justify-between gap-3">
                <div className="flex-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-pearl-placeholder block">
                    Last Name (Optional if single legal name)
                  </span>
                  {editingField === 'lastName' ? (
                    <div className="flex items-center gap-2 mt-1">
                      <input
                        type="text"
                        value={tempValue}
                        onChange={(e) => setTempValue(e.target.value)}
                        className="bg-pearl-input border border-pearl-border focus:border-pearl-border rounded-lg px-2.5 py-1 text-xs font-semibold text-pearl-text outline-none w-full max-w-xs"
                      />
                      <button
                        type="button"
                        onClick={() => saveEdit('lastName')}
                        className="p-1.5 rounded-lg bg-pearl-navy text-pearl-text hover:bg-pearl-surface"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingField(null)}
                        className="p-1.5 text-pearl-placeholder hover:text-pearl-text-secondary"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <p className="text-xs font-bold text-pearl-text mt-0.5">
                      {draftProfile.lastName || <span className="text-pearl-placeholder italic">Not provided</span>}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-1">
                  {editingField !== 'lastName' && (
                    <button
                      type="button"
                      onClick={() => startEdit('lastName', draftProfile.lastName || '')}
                      className="p-1.5 rounded-lg text-pearl-placeholder hover:text-pearl-navy hover:bg-pearl-surface transition"
                      title="Edit Last Name"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                  )}
                  {draftProfile.lastName && (
                    <button
                      type="button"
                      onClick={() => handleDeleteField('lastName', 'Last Name')}
                      className="p-1.5 rounded-lg text-pearl-danger-light hover:text-pearl-danger-light hover:bg-pearl-danger/15 transition"
                      title="Delete Last Name"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Nationality */}
              <div className="p-3 rounded-xl bg-pearl-dark border border-pearl-border/80 flex items-center justify-between gap-3">
                <div className="flex-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-pearl-placeholder block">
                    Passport Nationality
                  </span>
                  {editingField === 'nationality' ? (
                    <div className="flex items-center gap-2 mt-1">
                      <select
                        value={tempValue}
                        onChange={(e) => setTempValue(e.target.value)}
                        className="bg-pearl-input border border-pearl-border focus:border-pearl-border rounded-lg px-2.5 py-1 text-xs font-semibold text-pearl-text outline-none w-full max-w-xs cursor-pointer"
                      >
                        {POPULAR_NATIONALITIES.map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => saveEdit('nationality')}
                        className="p-1.5 rounded-lg bg-pearl-navy text-pearl-text hover:bg-pearl-surface"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingField(null)}
                        className="p-1.5 text-pearl-placeholder hover:text-pearl-text-secondary"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <p className="text-xs font-bold text-pearl-text mt-0.5">
                      {draftProfile.nationality}
                    </p>
                  )}
                </div>

                {editingField !== 'nationality' && (
                  <button
                    type="button"
                    onClick={() => startEdit('nationality', draftProfile.nationality)}
                    className="p-1.5 rounded-lg text-pearl-placeholder hover:text-pearl-navy hover:bg-pearl-surface transition"
                    title="Change Nationality"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Gender */}
              <div className="p-3 rounded-xl bg-pearl-dark border border-pearl-border/80 flex items-center justify-between gap-3">
                <div className="flex-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-pearl-placeholder block">
                    Gender Identity
                  </span>
                  <p className="text-xs font-bold text-pearl-text mt-0.5">
                    {draftProfile.gender || 'Prefer not to say'}
                  </p>
                </div>

                <div className="flex items-center gap-1">
                  {draftProfile.gender && draftProfile.gender !== 'Prefer not to say' && (
                    <button
                      type="button"
                      onClick={() => handleDeleteField('gender', 'Gender specification')}
                      className="px-2 py-1 rounded-lg text-xs font-bold text-pearl-danger-light hover:bg-pearl-danger/15 flex items-center gap-1 transition"
                      title="Reset gender back to unspecified"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Delete Specification</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* SECTION 2: CONTACT & EMERGENCY DETAILS */}
          {(activeCategory === 'all' || activeCategory === 'contact') && (
            <div className="bg-pearl-surface/80 rounded-2xl p-4 border border-pearl-border space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-pearl-border/70">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black uppercase tracking-wider text-pearl-text-secondary flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-pearl-gold" /> Contact & Emergency Details
                  </span>
                  <span className="text-[10px] font-semibold px-2 py-0.2 rounded-full bg-pearl-surface text-pearl-text-secondary">
                    Optional
                  </span>
                </div>

                {(draftProfile.emergencyContactName || draftProfile.emergencyContactPhone) && (
                  <button
                    type="button"
                    onClick={handleClearEmergencySection}
                    className="text-[11px] font-bold text-pearl-danger-light hover:text-pearl-danger-light hover:bg-pearl-danger/15 px-2 py-0.5 rounded-lg border border-pearl-border flex items-center gap-1 cursor-pointer transition"
                    title="Delete entire emergency contact section"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Clear Emergency Section</span>
                  </button>
                )}
              </div>

              {/* Primary Phone */}
              <div className="p-3 rounded-xl bg-pearl-dark border border-pearl-border/80 flex items-center justify-between gap-3">
                <div className="flex-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-pearl-placeholder block">
                    Phone Number (Mobile / WhatsApp)
                  </span>
                  {editingField === 'phoneNumber' ? (
                    <div className="flex items-center gap-2 mt-1">
                      <input
                        type="tel"
                        value={tempValue}
                        onChange={(e) => setTempValue(e.target.value)}
                        placeholder="+256 772 000000"
                        className="bg-pearl-input border border-pearl-border focus:border-pearl-border rounded-lg px-2.5 py-1 text-xs font-semibold text-pearl-text outline-none w-full max-w-xs"
                      />
                      <button
                        type="button"
                        onClick={() => saveEdit('phoneNumber')}
                        className="p-1.5 rounded-lg bg-pearl-navy text-pearl-text hover:bg-pearl-surface"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingField(null)}
                        className="p-1.5 text-pearl-placeholder hover:text-pearl-text-secondary"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <p className="text-xs font-bold text-pearl-text mt-0.5">
                      {draftProfile.phoneNumber || <span className="text-pearl-placeholder italic">No phone number recorded</span>}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-1">
                  {editingField !== 'phoneNumber' && (
                    <button
                      type="button"
                      onClick={() => startEdit('phoneNumber', draftProfile.phoneNumber || '')}
                      className="p-1.5 rounded-lg text-pearl-placeholder hover:text-pearl-navy hover:bg-pearl-surface transition"
                      title="Edit Phone Number"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                  )}
                  {draftProfile.phoneNumber && (
                    <button
                      type="button"
                      onClick={() => handleDeleteField('phoneNumber', 'Phone Number')}
                      className="p-1.5 rounded-lg text-pearl-danger-light hover:text-pearl-danger-light hover:bg-pearl-danger/15 transition"
                      title="Delete Phone Number (Clear entered data)"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Email Address */}
              <div className="p-3 rounded-xl bg-pearl-dark border border-pearl-border/80 flex items-center justify-between gap-3">
                <div className="flex-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-pearl-placeholder block">
                    Contact Email Address
                  </span>
                  {editingField === 'email' ? (
                    <div className="flex items-center gap-2 mt-1">
                      <input
                        type="email"
                        value={tempValue}
                        onChange={(e) => setTempValue(e.target.value)}
                        className="bg-pearl-input border border-pearl-border focus:border-pearl-border rounded-lg px-2.5 py-1 text-xs font-semibold text-pearl-text outline-none w-full max-w-xs"
                      />
                      <button
                        type="button"
                        onClick={() => saveEdit('email')}
                        className="p-1.5 rounded-lg bg-pearl-navy text-pearl-text hover:bg-pearl-surface"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingField(null)}
                        className="p-1.5 text-pearl-placeholder hover:text-pearl-text-secondary"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <p className="text-xs font-bold text-pearl-text mt-0.5">
                      {draftProfile.email || <span className="text-pearl-placeholder italic">No email recorded</span>}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-1">
                  {editingField !== 'email' && (
                    <button
                      type="button"
                      onClick={() => startEdit('email', draftProfile.email || '')}
                      className="p-1.5 rounded-lg text-pearl-placeholder hover:text-pearl-navy hover:bg-pearl-surface transition"
                      title="Edit Email"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                  )}
                  {draftProfile.email && (
                    <button
                      type="button"
                      onClick={() => handleDeleteField('email', 'Email Address')}
                      className="p-1.5 rounded-lg text-pearl-danger-light hover:text-pearl-danger-light hover:bg-pearl-danger/15 transition"
                      title="Delete Email Address"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Emergency Contact Name */}
              <div className="p-3 rounded-xl bg-pearl-dark border border-pearl-border/80 flex items-center justify-between gap-3">
                <div className="flex-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-pearl-placeholder block">
                    Emergency Contact Name
                  </span>
                  {editingField === 'emergencyContactName' ? (
                    <div className="flex items-center gap-2 mt-1">
                      <input
                        type="text"
                        value={tempValue}
                        onChange={(e) => setTempValue(e.target.value)}
                        placeholder="Relative, safari guide, or friend"
                        className="bg-pearl-input border border-pearl-border focus:border-pearl-border rounded-lg px-2.5 py-1 text-xs font-semibold text-pearl-text outline-none w-full max-w-xs"
                      />
                      <button
                        type="button"
                        onClick={() => saveEdit('emergencyContactName')}
                        className="p-1.5 rounded-lg bg-pearl-navy text-pearl-text hover:bg-pearl-surface"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingField(null)}
                        className="p-1.5 text-pearl-placeholder hover:text-pearl-text-secondary"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <p className="text-xs font-bold text-pearl-text mt-0.5">
                      {draftProfile.emergencyContactName || (
                        <span className="text-pearl-placeholder italic">No emergency contact entered</span>
                      )}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-1">
                  {editingField !== 'emergencyContactName' && (
                    <button
                      type="button"
                      onClick={() => startEdit('emergencyContactName', draftProfile.emergencyContactName || '')}
                      className="p-1.5 rounded-lg text-pearl-placeholder hover:text-pearl-navy hover:bg-pearl-surface transition"
                      title="Edit Emergency Contact Name"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                  )}
                  {draftProfile.emergencyContactName && (
                    <button
                      type="button"
                      onClick={() => handleDeleteField('emergencyContactName', 'Emergency Contact Name')}
                      className="p-1.5 rounded-lg text-pearl-danger-light hover:text-pearl-danger-light hover:bg-pearl-danger/15 transition"
                      title="Delete Emergency Contact Name"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Emergency Contact Phone */}
              <div className="p-3 rounded-xl bg-pearl-dark border border-pearl-border/80 flex items-center justify-between gap-3">
                <div className="flex-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-pearl-placeholder block">
                    Emergency Contact Phone Number
                  </span>
                  {editingField === 'emergencyContactPhone' ? (
                    <div className="flex items-center gap-2 mt-1">
                      <input
                        type="tel"
                        value={tempValue}
                        onChange={(e) => setTempValue(e.target.value)}
                        placeholder="+1 (555) 019-2831"
                        className="bg-pearl-input border border-pearl-border focus:border-pearl-border rounded-lg px-2.5 py-1 text-xs font-semibold text-pearl-text outline-none w-full max-w-xs"
                      />
                      <button
                        type="button"
                        onClick={() => saveEdit('emergencyContactPhone')}
                        className="p-1.5 rounded-lg bg-pearl-navy text-pearl-text hover:bg-pearl-surface"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingField(null)}
                        className="p-1.5 text-pearl-placeholder hover:text-pearl-text-secondary"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <p className="text-xs font-bold text-pearl-text mt-0.5">
                      {draftProfile.emergencyContactPhone || (
                        <span className="text-pearl-placeholder italic">No emergency phone entered</span>
                      )}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-1">
                  {editingField !== 'emergencyContactPhone' && (
                    <button
                      type="button"
                      onClick={() => startEdit('emergencyContactPhone', draftProfile.emergencyContactPhone || '')}
                      className="p-1.5 rounded-lg text-pearl-placeholder hover:text-pearl-navy hover:bg-pearl-surface transition"
                      title="Edit Emergency Phone"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                  )}
                  {draftProfile.emergencyContactPhone && (
                    <button
                      type="button"
                      onClick={() => handleDeleteField('emergencyContactPhone', 'Emergency Contact Phone')}
                      className="p-1.5 rounded-lg text-pearl-danger-light hover:text-pearl-danger-light hover:bg-pearl-danger/15 transition"
                      title="Delete Emergency Contact Phone"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* SECTION 3: TRAVEL ITINERARY & PASSPORT DETAILS */}
          {(activeCategory === 'all' || activeCategory === 'travel') && (
            <div className="bg-pearl-surface/80 rounded-2xl p-4 border border-pearl-border space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-pearl-border/70">
                <span className="text-xs font-black uppercase tracking-wider text-pearl-text-secondary flex items-center gap-1.5">
                  <Compass className="w-3.5 h-3.5 text-pearl-success-light" /> Travel Itinerary & Passport Details
                </span>
                <span className="text-[10px] text-pearl-placeholder font-mono">Section 3</span>
              </div>

              {/* Passport Number */}
              <div className="p-3 rounded-xl bg-pearl-dark border border-pearl-border/80 flex items-center justify-between gap-3">
                <div className="flex-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-pearl-placeholder block">
                    Passport / Travel Document Number
                  </span>
                  {editingField === 'passportNumber' ? (
                    <div className="flex items-center gap-2 mt-1">
                      <input
                        type="text"
                        value={tempValue}
                        onChange={(e) => setTempValue(e.target.value)}
                        placeholder="e.g. US-99384721"
                        className="bg-pearl-input border border-pearl-border focus:border-pearl-border rounded-lg px-2.5 py-1 text-xs font-semibold text-pearl-text outline-none w-full max-w-xs font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => saveEdit('passportNumber')}
                        className="p-1.5 rounded-lg bg-pearl-navy text-pearl-text hover:bg-pearl-surface"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingField(null)}
                        className="p-1.5 text-pearl-placeholder hover:text-pearl-text-secondary"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <p className="text-xs font-bold text-pearl-text mt-0.5 font-mono">
                      {draftProfile.passportNumber || (
                        <span className="text-pearl-placeholder font-sans italic font-normal">No passport number recorded</span>
                      )}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-1">
                  {editingField !== 'passportNumber' && (
                    <button
                      type="button"
                      onClick={() => startEdit('passportNumber', draftProfile.passportNumber || '')}
                      className="p-1.5 rounded-lg text-pearl-placeholder hover:text-pearl-navy hover:bg-pearl-surface transition"
                      title="Edit Passport Number"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                  )}
                  {draftProfile.passportNumber && (
                    <button
                      type="button"
                      onClick={() => handleDeleteField('passportNumber', 'Passport Number')}
                      className="p-1.5 rounded-lg text-pearl-danger-light hover:text-pearl-danger-light hover:bg-pearl-danger/15 transition"
                      title="Delete Passport Number"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Passport Expiry Date */}
              <div className="p-3 rounded-xl bg-pearl-dark border border-pearl-border/80 flex items-center justify-between gap-3">
                <div className="flex-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-pearl-placeholder block">
                    Passport Expiry Date
                  </span>
                  {editingField === 'passportExpiryDate' ? (
                    <div className="flex items-center gap-2 mt-1">
                      <input
                        type="date"
                        value={tempValue}
                        onChange={(e) => setTempValue(e.target.value)}
                        className="bg-pearl-input border border-pearl-border focus:border-pearl-border rounded-lg px-2.5 py-1 text-xs font-semibold text-pearl-text outline-none w-full max-w-xs"
                      />
                      <button
                        type="button"
                        onClick={() => saveEdit('passportExpiryDate')}
                        className="p-1.5 rounded-lg bg-pearl-navy text-pearl-text hover:bg-pearl-surface"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingField(null)}
                        className="p-1.5 text-pearl-placeholder hover:text-pearl-text-secondary"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <p className="text-xs font-bold text-pearl-text mt-0.5 font-mono">
                      {draftProfile.passportExpiryDate || (
                        <span className="text-pearl-placeholder font-sans italic font-normal">No expiry date set</span>
                      )}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-1">
                  {editingField !== 'passportExpiryDate' && (
                    <button
                      type="button"
                      onClick={() => startEdit('passportExpiryDate', draftProfile.passportExpiryDate || '')}
                      className="p-1.5 rounded-lg text-pearl-placeholder hover:text-pearl-navy hover:bg-pearl-surface transition"
                      title="Edit Expiry Date"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                  )}
                  {draftProfile.passportExpiryDate && (
                    <button
                      type="button"
                      onClick={() => handleDeleteField('passportExpiryDate', 'Passport Expiry Date')}
                      className="p-1.5 rounded-lg text-pearl-danger-light hover:text-pearl-danger-light hover:bg-pearl-danger/15 transition"
                      title="Delete Expiry Date"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Primary Destination */}
              <div className="p-3 rounded-xl bg-pearl-dark border border-pearl-border/80 flex items-center justify-between gap-3">
                <div className="flex-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-pearl-placeholder block">
                    Primary Uganda Destination
                  </span>
                  {editingField === 'destination' ? (
                    <div className="flex items-center gap-2 mt-1">
                      <select
                        value={tempValue}
                        onChange={(e) => setTempValue(e.target.value)}
                        className="bg-pearl-input border border-pearl-border focus:border-pearl-border rounded-lg px-2.5 py-1 text-xs font-semibold text-pearl-text outline-none w-full max-w-xs cursor-pointer"
                      >
                        {POPULAR_DESTINATIONS.map((d) => (
                          <option key={d} value={d}>{d}</option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => saveEdit('destination')}
                        className="p-1.5 rounded-lg bg-pearl-navy text-pearl-text hover:bg-pearl-surface"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingField(null)}
                        className="p-1.5 text-pearl-placeholder hover:text-pearl-text-secondary"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <p className="text-xs font-bold text-pearl-text mt-0.5">
                      {draftProfile.destination}
                    </p>
                  )}
                </div>

                {editingField !== 'destination' && (
                  <button
                    type="button"
                    onClick={() => startEdit('destination', draftProfile.destination)}
                    className="p-1.5 rounded-lg text-pearl-placeholder hover:text-pearl-navy hover:bg-pearl-surface transition"
                    title="Change Destination"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Travel Purpose */}
              <div className="p-3 rounded-xl bg-pearl-dark border border-pearl-border/80 flex items-center justify-between gap-3">
                <div className="flex-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-pearl-placeholder block">
                    Purpose of Travel
                  </span>
                  <p className="text-xs font-bold text-pearl-text mt-0.5 capitalize">
                    {draftProfile.travelPurpose}
                  </p>
                </div>
              </div>

              {/* Stay Duration */}
              <div className="p-3 rounded-xl bg-pearl-dark border border-pearl-border/80 flex items-center justify-between gap-3">
                <div className="flex-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-pearl-placeholder block">
                    Intended Stay Duration
                  </span>
                  {editingField === 'stayDurationDays' ? (
                    <div className="flex items-center gap-2 mt-1">
                      <input
                        type="number"
                        min="1"
                        max="365"
                        value={tempValue}
                        onChange={(e) => setTempValue(e.target.value)}
                        className="bg-pearl-input border border-pearl-border focus:border-pearl-border rounded-lg px-2.5 py-1 text-xs font-semibold text-pearl-text outline-none w-24"
                      />
                      <span className="text-xs text-pearl-placeholder">Days</span>
                      <button
                        type="button"
                        onClick={() => saveEdit('stayDurationDays')}
                        className="p-1.5 rounded-lg bg-pearl-navy text-pearl-text hover:bg-pearl-surface"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingField(null)}
                        className="p-1.5 text-pearl-placeholder hover:text-pearl-text-secondary"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <p className="text-xs font-bold text-pearl-text mt-0.5">
                      {draftProfile.stayDurationDays} Days
                    </p>
                  )}
                </div>

                {editingField !== 'stayDurationDays' && (
                  <button
                    type="button"
                    onClick={() => startEdit('stayDurationDays', draftProfile.stayDurationDays.toString())}
                    className="p-1.5 rounded-lg text-pearl-placeholder hover:text-pearl-navy hover:bg-pearl-surface transition"
                    title="Change Stay Duration"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Travel Notes */}
              <div className="p-3 rounded-xl bg-pearl-dark border border-pearl-border/80 flex items-center justify-between gap-3">
                <div className="flex-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-pearl-placeholder block">
                    Travel Notes & Special Declarations
                  </span>
                  {editingField === 'notes' ? (
                    <div className="flex items-center gap-2 mt-1">
                      <input
                        type="text"
                        value={tempValue}
                        onChange={(e) => setTempValue(e.target.value)}
                        placeholder="Safari tour, medical note, or border permit remarks"
                        className="bg-pearl-input border border-pearl-border focus:border-pearl-border rounded-lg px-2.5 py-1 text-xs font-semibold text-pearl-text outline-none w-full"
                      />
                      <button
                        type="button"
                        onClick={() => saveEdit('notes')}
                        className="p-1.5 rounded-lg bg-pearl-navy text-pearl-text hover:bg-pearl-surface"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingField(null)}
                        className="p-1.5 text-pearl-placeholder hover:text-pearl-text-secondary"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <p className="text-xs font-semibold text-pearl-text mt-0.5">
                      {draftProfile.notes || (
                        <span className="text-pearl-placeholder italic font-normal">No special travel notes added</span>
                      )}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-1">
                  {editingField !== 'notes' && (
                    <button
                      type="button"
                      onClick={() => startEdit('notes', draftProfile.notes || '')}
                      className="p-1.5 rounded-lg text-pearl-placeholder hover:text-pearl-navy hover:bg-pearl-surface transition"
                      title="Edit Notes"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                  )}
                  {draftProfile.notes && (
                    <button
                      type="button"
                      onClick={() => handleDeleteField('notes', 'Travel Notes')}
                      className="p-1.5 rounded-lg text-pearl-danger-light hover:text-pearl-danger-light hover:bg-pearl-danger/15 transition"
                      title="Delete Travel Notes"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* SECTION 4: CLEARANCES */}
          {(activeCategory === 'all' || activeCategory === 'clearances') && (
            <div className="bg-pearl-surface/80 rounded-2xl p-4 border border-pearl-border space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-pearl-border/70">
                <span className="text-xs font-black uppercase tracking-wider text-pearl-text-secondary flex items-center gap-1.5">
                  <ShieldAlert className="w-3.5 h-3.5 text-pearl-gold-light" /> Travel Clearances & Bookings
                </span>
                <span className="text-[10px] text-pearl-placeholder font-mono">Section 4</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {/* Yellow Fever Card */}
                <div className="p-3 rounded-xl bg-pearl-dark border border-pearl-border flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-pearl-text block">Yellow Fever Card</span>
                    <span className="text-[11px] text-pearl-placeholder">
                      {draftProfile.hasYellowFeverVax ? 'Marked as Possessed' : 'Not marked / Pending'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setDraftProfile({
                        ...draftProfile,
                        hasYellowFeverVax: !draftProfile.hasYellowFeverVax,
                      })
                    }
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                      draftProfile.hasYellowFeverVax
                        ? 'bg-pearl-success/15 text-pearl-success-light'
                        : 'bg-pearl-surface text-pearl-text-secondary'
                    }`}
                  >
                    {draftProfile.hasYellowFeverVax ? 'Yes' : 'No'}
                  </button>
                </div>

                {/* Return Ticket */}
                <div className="p-3 rounded-xl bg-pearl-dark border border-pearl-border flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-pearl-text block">Outbound Ticket</span>
                    <span className="text-[11px] text-pearl-placeholder">
                      {draftProfile.hasReturnTicket ? 'Booked & Confirmed' : 'Not booked yet'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setDraftProfile({
                        ...draftProfile,
                        hasReturnTicket: !draftProfile.hasReturnTicket,
                      })
                    }
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                      draftProfile.hasReturnTicket
                        ? 'bg-pearl-success/15 text-pearl-success-light'
                        : 'bg-pearl-surface text-pearl-text-secondary'
                    }`}
                  >
                    {draftProfile.hasReturnTicket ? 'Yes' : 'No'}
                  </button>
                </div>

                {/* Accommodation */}
                <div className="p-3 rounded-xl bg-pearl-dark border border-pearl-border flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-pearl-text block">Hotel / Lodge Proof</span>
                    <span className="text-[11px] text-pearl-placeholder">
                      {draftProfile.hasAccommodationProof ? 'Booking confirmed' : 'No lodging proof'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setDraftProfile({
                        ...draftProfile,
                        hasAccommodationProof: !draftProfile.hasAccommodationProof,
                      })
                    }
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                      draftProfile.hasAccommodationProof
                        ? 'bg-pearl-success/15 text-pearl-success-light'
                        : 'bg-pearl-surface text-pearl-text-secondary'
                    }`}
                  >
                    {draftProfile.hasAccommodationProof ? 'Yes' : 'No'}
                  </button>
                </div>

                {/* Travel Insurance */}
                <div className="p-3 rounded-xl bg-pearl-dark border border-pearl-border flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-pearl-text block">Medical Evacuation Policy</span>
                    <span className="text-[11px] text-pearl-placeholder">
                      {draftProfile.hasTravelInsurance ? 'Active policy' : 'Not purchased'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setDraftProfile({
                        ...draftProfile,
                        hasTravelInsurance: !draftProfile.hasTravelInsurance,
                      })
                    }
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                      draftProfile.hasTravelInsurance
                        ? 'bg-pearl-success/15 text-pearl-success-light'
                        : 'bg-pearl-surface text-pearl-text-secondary'
                    }`}
                  >
                    {draftProfile.hasTravelInsurance ? 'Yes' : 'No'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 5: CHECKLIST DOCUMENT REFERENCES */}
          {(activeCategory === 'all' || activeCategory === 'checklist') && (
            <div className="bg-pearl-surface/80 rounded-2xl p-4 border border-pearl-border space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-pearl-border/70">
                <span className="text-xs font-black uppercase tracking-wider text-pearl-text-secondary flex items-center gap-1.5">
                  <FileCheck className="w-3.5 h-3.5 text-pearl-danger-light" /> Checklist Document References
                </span>
                <span className="text-[10px] text-pearl-placeholder font-mono">Custom Doc Numbers</span>
              </div>

              <div className="space-y-2">
                {draftChecklist.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 rounded-xl bg-pearl-dark border border-pearl-border/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-pearl-text">{item.title}</span>
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                            item.status === 'complete'
                              ? 'bg-pearl-success/15 text-pearl-success-light'
                              : item.status === 'expired'
                              ? 'bg-pearl-gold/10 text-pearl-gold-light'
                              : 'bg-pearl-danger/15 text-pearl-danger-light'
                          }`}
                        >
                          {item.status}
                        </span>
                      </div>
                      <div className="text-[11px] text-pearl-placeholder flex items-center gap-2 mt-0.5">
                        {item.docNumber ? (
                          <span>
                            Ref: <strong className="font-mono text-pearl-text">{item.docNumber}</strong>
                          </span>
                        ) : (
                          <span className="italic text-pearl-placeholder">No doc reference number saved</span>
                        )}
                        {item.expiryDate && (
                          <span>
                            · Expiry: <strong className="font-mono text-pearl-text">{item.expiryDate}</strong>
                          </span>
                        )}
                      </div>
                    </div>

                    {(item.docNumber || item.expiryDate) && (
                      <button
                        type="button"
                        onClick={() => handleDeleteChecklistItemDetails(item.id, item.title)}
                        className="px-2 py-1 rounded-lg text-xs font-bold text-pearl-danger-light hover:bg-pearl-danger/15 flex items-center gap-1 self-start sm:self-auto cursor-pointer transition"
                        title="Delete this custom document reference"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Delete Reference</span>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Confirmation Dialog for Bulk Clear */}
        <AnimatePresence>
          {showBulkClearConfirm && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="absolute inset-0 z-50 bg-pearl-navy/60 backdrop-blur-xs flex items-center justify-center p-4"
            >
              <div className="bg-pearl-dark rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-pearl-border text-center">
                <div className="w-12 h-12 rounded-full bg-pearl-danger/15 text-pearl-danger-light flex items-center justify-center mx-auto mb-3">
                  <Trash2 className="w-6 h-6" />
                </div>
                <h3 className="text-base font-black text-pearl-text">
                  Delete All Unintended Details?
                </h3>
                <p className="text-xs text-pearl-placeholder mt-1.5 leading-relaxed">
                  This will remove non-mandatory details including phone number, emergency contacts, notes, photo, and custom document reference IDs. Essential passport name and citizenship remain intact.
                </p>
                <div className="flex items-center justify-center gap-2 mt-5">
                  <button
                    type="button"
                    onClick={() => setShowBulkClearConfirm(false)}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-pearl-surface text-pearl-text-secondary hover:bg-pearl-surface cursor-pointer transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleBulkClearOptionalData}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-pearl-danger hover:bg-pearl-danger text-pearl-text cursor-pointer transition shadow-xs"
                  >
                    Yes, Delete Optional Data
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bottom Action Footer */}
        <div className="pt-4 mt-2 border-t border-pearl-border flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-pearl-text-secondary flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-pearl-gold-light" />
            <span>Changes are previewed live in this audit window.</span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-none min-h-[40px] px-4 py-2 rounded-xl text-xs font-semibold bg-pearl-surface border border-pearl-border text-pearl-text hover:bg-pearl-input cursor-pointer transition-colors"
            >
              Cancel / Close
            </button>
            <button
              type="button"
              onClick={handleSaveAllAndClose}
              className="flex-1 sm:flex-none min-h-[42px] px-5 py-2 rounded-xl text-xs font-bold bg-pearl-gold text-pearl-text hover:bg-pearl-gold-light transition-colors cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap"
            >
              <Check className="w-4 h-4 text-pearl-text" />
              <span>Apply &amp; Save All Changes</span>
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
