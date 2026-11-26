import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  User,
  Globe,
  Phone,
  Mail,
  HeartHandshake,
  Compass,
  Check,
  ShieldCheck,
  Save,
  Sparkles,
} from 'lucide-react';
import { UserProfile, PassengerProfile, GenderType, TravelPurpose } from '../types';
import { AvatarUploader } from './AvatarUploader';
import { POPULAR_NATIONALITIES } from '../data/travelRequirementsEngine';

interface ProfileSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser?: UserProfile | null;
  passengerProfile?: PassengerProfile | null;
  onSave: (updatedUser: UserProfile, updatedPassenger?: PassengerProfile) => boolean;
}

const COUNTRY_CODES = [
  { code: '+256', country: 'Uganda 🇺🇬' },
  { code: '+1', country: 'USA/Canada 🇺🇸/🇨🇦' },
  { code: '+44', country: 'UK 🇬🇧' },
  { code: '+254', country: 'Kenya 🇰🇪' },
  { code: '+250', country: 'Rwanda 🇷🇼' },
  { code: '+255', country: 'Tanzania 🇹🇿' },
  { code: '+49', country: 'Germany 🇩🇪' },
  { code: '+33', country: 'France 🇫🇷' },
  { code: '+971', country: 'UAE 🇦🇪' },
  { code: '+91', country: 'India 🇮🇳' },
  { code: '+86', country: 'China 🇨🇳' },
  { code: '+27', country: 'South Africa 🇿🇦' },
  { code: '+61', country: 'Australia 🇦🇺' },
];

const GENDER_OPTIONS: GenderType[] = ['Male', 'Female', 'Non-Binary', 'Prefer not to say'];

const TRAVEL_PURPOSES: { value: TravelPurpose; label: string; desc: string }[] = [
  { value: 'tourism', label: 'Safari & Wildlife Tourism', desc: 'Bwindi Gorillas, Murchison Falls, Queen Elizabeth NP' },
  { value: 'business', label: 'Business & Investment', desc: 'Commercial meetings, trade, or conferences in Kampala' },
  { value: 'family', label: 'Visiting Family & Friends', desc: 'Private stay with relatives or friends residing in Uganda' },
  { value: 'studies', label: 'Academic & Research', desc: 'Field studies, Makerere Univ exchange, biological research' },
  { value: 'transit', label: 'Entebbe Airport Transit', desc: 'Layover connection via Entebbe (EBB) to 3rd country' },
  { value: 'employment', label: 'Work & Humanitarian NGO', desc: 'Official missions, diplomatic visits, or aid organizations' },
];

export const ProfileSettingsModal: React.FC<ProfileSettingsModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  passengerProfile,
  onSave,
}) => {
  const parseNames = (fullName?: string | null) => {
    const parts = (fullName || '').trim().split(' ');
    const first = parts[0] || '';
    const last = parts.slice(1).join(' ') || '';
    return { first, last };
  };

  const initialNames = parseNames(passengerProfile?.fullName || currentUser?.name || '');

  const [firstName, setFirstName] = useState(
    currentUser?.firstName || passengerProfile?.firstName || initialNames.first
  );
  const [lastName, setLastName] = useState(
    currentUser?.lastName || passengerProfile?.lastName || initialNames.last
  );
  const [nationality, setNationality] = useState(
    currentUser?.nationality || passengerProfile?.nationality || 'United States'
  );
  const [gender, setGender] = useState<GenderType>(
    currentUser?.gender || passengerProfile?.gender || 'Prefer not to say'
  );
  const [countryCode, setCountryCode] = useState(
    currentUser?.countryCode || passengerProfile?.countryCode || '+256'
  );
  const [phoneNumber, setPhoneNumber] = useState(
    currentUser?.phoneNumber || passengerProfile?.phoneNumber || '+256 772 458921'
  );
  const [email, setEmail] = useState(
    currentUser?.email || passengerProfile?.email || 'traveler@pearltravel.ug'
  );
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(
    currentUser?.avatarUrl || passengerProfile?.avatarUrl
  );
  const [travelPurpose, setTravelPurpose] = useState<TravelPurpose>(
    currentUser?.travelPurpose || passengerProfile?.travelPurpose || 'tourism'
  );
  const [emergencyContactName, setEmergencyContactName] = useState(
    currentUser?.emergencyContactName || passengerProfile?.emergencyContactName || 'Grace K. Chen'
  );
  const [emergencyContactPhone, setEmergencyContactPhone] = useState(
    currentUser?.emergencyContactPhone || passengerProfile?.emergencyContactPhone || '+1 (415) 890-2341'
  );
  const [emergencyContactRelation, setEmergencyContactRelation] = useState(
    currentUser?.emergencyContactRelation || passengerProfile?.emergencyContactRelation || 'Spouse / Next of Kin'
  );

  const [activeTab, setActiveTab] = useState<'profile' | 'contact' | 'travel'>('profile');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  if (!isOpen) return null;

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!firstName.trim()) newErrors.firstName = 'First Name is mandatory';
    if (!nationality.trim()) newErrors.nationality = 'Nationality is mandatory';
    if (!gender) newErrors.gender = 'Gender is mandatory';
    if (!phoneNumber.trim()) newErrors.phoneNumber = 'Contact phone number is mandatory';
    if (!travelPurpose) newErrors.travelPurpose = 'Purpose of travel is mandatory';
    if (!emergencyContactName.trim()) newErrors.emergencyContactName = 'Emergency contact name is mandatory';
    if (!emergencyContactPhone.trim()) newErrors.emergencyContactPhone = 'Emergency contact phone is mandatory';
    setErrors(newErrors);
    if (newErrors.firstName || newErrors.nationality || newErrors.gender) setActiveTab('profile');
    else if (newErrors.phoneNumber || newErrors.emergencyContactName || newErrors.emergencyContactPhone) setActiveTab('contact');
    else if (newErrors.travelPurpose) setActiveTab('travel');
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSaveError('');
    const fullName = `${firstName.trim()} ${lastName.trim()}`.trim() || 'Valued Passenger';
    const updatedUser: UserProfile = {
      ...currentUser,
      name: fullName,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim(),
      nationality,
      gender,
      countryCode,
      phoneNumber: phoneNumber.trim(),
      avatarUrl,
      travelPurpose,
      emergencyContactName: emergencyContactName.trim(),
      emergencyContactPhone: emergencyContactPhone.trim(),
      emergencyContactRelation: emergencyContactRelation.trim(),
    };
    const updatedPassenger: PassengerProfile = {
      ...passengerProfile,
      fullName,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      nationality,
      gender,
      countryCode,
      phoneNumber: phoneNumber.trim(),
      email: email.trim(),
      avatarUrl,
      travelPurpose,
      emergencyContactName: emergencyContactName.trim(),
      emergencyContactPhone: emergencyContactPhone.trim(),
      emergencyContactRelation: emergencyContactRelation.trim(),
    };
    if (!onSave(updatedUser, updatedPassenger)) {
      setSaveError('Your profile was not saved. Please retry.');
      return;
    }
    setSaveSuccess(true);
    setTimeout(() => { setSaveSuccess(false); onClose(); }, 650);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-pearl-navy/50 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.25 }}
          className="relative w-full max-w-2xl bg-pearl-dark rounded-2xl p-6 sm:p-8 max-h-[90vh] overflow-y-auto scrollbar-thin shadow-2xl border border-pearl-border"
        >
          {/* Close Button */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-5 right-5 w-8 h-8 rounded-lg bg-pearl-surface border border-pearl-border flex items-center justify-center text-pearl-text-secondary hover:text-pearl-text hover:bg-pearl-input cursor-pointer transition-colors"
            title="Close Settings"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Header */}
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-pearl-border">
            <div className="w-10 h-10 rounded-xl bg-pearl-navy text-pearl-gold-light flex items-center justify-center shrink-0">
              <User className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-pearl-gold-light">
                  Pearl Travel Account • Profile Settings
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-pearl-text font-heading">
                Passenger Profile & Settings
              </h2>
            </div>
          </div>

          {/* Sub Navigation Tabs */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-pearl-surface border border-pearl-border mb-6">
            <button
              type="button"
              onClick={() => setActiveTab('profile')}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === 'profile' ? 'bg-pearl-navy text-pearl-text' : 'text-pearl-text-secondary hover:text-pearl-text'
              }`}
            >
              <User className={`w-3.5 h-3.5 ${activeTab === 'profile' ? 'text-pearl-gold-light' : 'text-pearl-placeholder'}`} />
              <span>Identity & Avatar</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('contact')}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === 'contact' ? 'bg-pearl-navy text-pearl-text' : 'text-pearl-text-secondary hover:text-pearl-text'
              }`}
            >
              <Phone className={`w-3.5 h-3.5 ${activeTab === 'contact' ? 'text-pearl-gold-light' : 'text-pearl-placeholder'}`} />
              <span>Contact & Emergency</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('travel')}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === 'travel' ? 'bg-pearl-navy text-pearl-text' : 'text-pearl-text-secondary hover:text-pearl-text'
              }`}
            >
              <Compass className={`w-3.5 h-3.5 ${activeTab === 'travel' ? 'text-pearl-gold-light' : 'text-pearl-placeholder'}`} />
              <span>Travel Purpose</span>
            </button>
          </div>

          <form onSubmit={handleSave}>
            {/* TAB 1: IDENTITY & AVATAR */}
            {activeTab === 'profile' && (
              <div className="space-y-5">
                {/* Upload Image Section */}
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 p-4 rounded-xl bg-pearl-surface border border-pearl-border">
                  <AvatarUploader
                    currentAvatarUrl={avatarUrl}
                    userName={`${firstName} ${lastName}`}
                    onAvatarChange={setAvatarUrl}
                    size="lg"
                  />
                  <div className="flex-1 text-center sm:text-left">
                    <h3 className="text-sm font-bold text-pearl-text">Passenger Profile Photo</h3>
                    <p className="text-xs text-pearl-text-secondary mt-0.5 leading-relaxed">
                      Upload your passenger photo or choose a preset. This image appears on your Malaba & Entebbe boarding summary and traveller readiness badge.
                    </p>
                    <div className="mt-3 flex items-center justify-center sm:justify-start gap-1.5 text-[11px] text-pearl-success-light font-semibold">
                      <ShieldCheck className="w-4 h-4" />
                      <span>Stored locally in your browser profile</span>
                    </div>
                  </div>
                </div>

                {/* Names */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label htmlFor="profile-settings-first-name" className="block text-xs font-bold text-pearl-text uppercase tracking-wide">
                        First Name <span className="text-pearl-danger-light">*</span>
                      </label>
                      <span className="text-[10px] font-bold text-pearl-danger-light">Required</span>
                    </div>
                    <div className="bg-pearl-input border border-pearl-border focus-within:border-pearl-border rounded-xl px-3.5 py-2.5">
                      <input
                        id="profile-settings-first-name"
                        type="text"
                        value={firstName}
                        onChange={(e) => {
                          setFirstName(e.target.value);
                          if (errors.firstName) setErrors({ ...errors, firstName: '' });
                        }}
                        placeholder="e.g. Maya"
                        className="w-full bg-transparent text-sm font-semibold text-pearl-text outline-none"
                      />
                    </div>
                    {errors.firstName && (
                      <p className="text-[11px] text-pearl-danger-light font-semibold mt-1">{errors.firstName}</p>
                    )}
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label htmlFor="profile-settings-last-name" className="block text-xs font-bold text-pearl-text uppercase tracking-wide">
                        Last Name
                      </label>
                      <span className="text-[10px] font-semibold text-pearl-placeholder">Optional</span>
                    </div>
                    <div className="bg-pearl-input border border-pearl-border focus-within:border-pearl-border rounded-xl px-3.5 py-2.5">
                      <input
                        id="profile-settings-last-name"
                        type="text"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        placeholder="e.g. Chen"
                        className="w-full bg-transparent text-sm font-semibold text-pearl-text outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Nationality */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label htmlFor="profile-settings-nationality" className="text-xs font-bold text-pearl-text uppercase tracking-wide flex items-center gap-1.5">
                      <Globe className="w-3.5 h-3.5 text-pearl-placeholder" />
                      Nationality (Issuing Passport Country)
                      <span className="text-pearl-danger-light">*</span>
                    </label>
                    <span className="text-[10px] font-bold text-pearl-danger-light">Required</span>
                  </div>
                  <div className="bg-pearl-input border border-pearl-border focus-within:border-pearl-border rounded-xl px-3.5 py-2.5">
                    <select
                      id="profile-settings-nationality"
                      value={nationality}
                      onChange={(e) => {
                        setNationality(e.target.value);
                        if (errors.nationality) setErrors({ ...errors, nationality: '' });
                      }}
                      className="w-full bg-transparent text-sm font-semibold text-pearl-text outline-none cursor-pointer"
                    >
                      {POPULAR_NATIONALITIES.map((country) => (
                        <option key={country} value={country}>
                          {country}
                        </option>
                      ))}
                    </select>
                  </div>
                  {errors.nationality && (
                    <p className="text-[11px] text-pearl-danger-light font-semibold mt-1">{errors.nationality}</p>
                  )}
                </div>

                {/* Gender */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span id="profile-settings-gender-label" className="block text-xs font-bold text-pearl-text uppercase tracking-wide">
                      Gender Identity <span className="text-pearl-danger-light">*</span>
                    </span>
                    <span className="text-[10px] font-bold text-pearl-danger-light">Required</span>
                  </div>
                  <div role="radiogroup" aria-labelledby="profile-settings-gender-label" className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {GENDER_OPTIONS.map((g) => (
                      <button
                        key={g}
                        type="button"
                        role="radio"
                        aria-checked={gender === g}
                        onClick={() => {
                          setGender(g);
                          if (errors.gender) setErrors({ ...errors, gender: '' });
                        }}
                        className={`min-h-[44px] py-2 px-3 rounded-xl text-xs font-bold transition-colors cursor-pointer border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pearl-gold ${
                          gender === g
                            ? 'bg-pearl-navy text-pearl-text border-pearl-gold ring-1 ring-pearl-gold-light'
                            : 'bg-pearl-input text-pearl-text border-pearl-border hover:bg-pearl-slate hover:border-pearl-gold'
                        }`}
                      >
                        {g}
                      </button>
                    ))}
                  </div>
                  {errors.gender && (
                    <p className="text-[11px] text-pearl-danger-light font-semibold mt-1">{errors.gender}</p>
                  )}
                </div>
              </div>
            )}

            {/* TAB 2: CONTACT & EMERGENCY */}
            {activeTab === 'contact' && (
              <div className="space-y-5">
                {/* Email */}
                <div>
                  <label htmlFor="profile-settings-email" className="text-xs font-bold text-pearl-text uppercase tracking-wide mb-1.5 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-pearl-placeholder" />
                    Email Address
                  </label>
                  <div className="bg-pearl-input border border-pearl-border focus-within:border-pearl-border rounded-xl px-3.5 py-2.5">
                    <input
                      id="profile-settings-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="traveler@domain.com"
                      required
                      className="w-full bg-transparent text-sm font-semibold text-pearl-text outline-none"
                    />
                  </div>
                </div>

                {/* Phone Contact */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label htmlFor="profile-settings-phone" className="text-xs font-bold text-pearl-text uppercase tracking-wide flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-pearl-placeholder" />
                      Contact Number (WhatsApp / Mobile)
                      <span className="text-pearl-danger-light">*</span>
                    </label>
                    <span className="text-[10px] font-bold text-pearl-danger-light">Required</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="bg-pearl-input border border-pearl-border focus-within:border-pearl-border rounded-xl px-3 py-2.5">
                      <select
                        aria-label="Country calling code"
                        value={countryCode}
                        onChange={(e) => setCountryCode(e.target.value)}
                        className="w-full bg-transparent text-xs font-bold text-pearl-text outline-none cursor-pointer"
                      >
                        {COUNTRY_CODES.map((c) => (
                          <option key={c.code} value={c.code}>
                            {c.country} ({c.code})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="col-span-2 bg-pearl-input border border-pearl-border focus-within:border-pearl-border rounded-xl px-3.5 py-2.5">
                      <input
                        id="profile-settings-phone"
                        type="tel"
                        value={phoneNumber}
                        onChange={(e) => {
                          setPhoneNumber(e.target.value);
                          if (errors.phoneNumber) setErrors({ ...errors, phoneNumber: '' });
                        }}
                        placeholder="772 123456"
                        className="w-full bg-transparent text-sm font-semibold text-pearl-text outline-none"
                      />
                    </div>
                  </div>
                  {errors.phoneNumber && (
                    <p className="text-[11px] text-pearl-danger-light font-semibold mt-1">{errors.phoneNumber}</p>
                  )}
                </div>

                {/* Emergency Contact */}
                <div className="p-4 rounded-xl bg-pearl-surface border border-pearl-border space-y-3.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <HeartHandshake className="w-4 h-4 text-pearl-gold-light" />
                      <span className="text-xs font-bold text-pearl-text uppercase tracking-wide">
                        Next of Kin & Emergency Contact
                      </span>
                    </div>
                    <span className="text-[10px] font-bold text-pearl-danger-light">Required</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label htmlFor="profile-settings-emergency-name" className="block text-[11px] font-semibold text-pearl-text-secondary mb-1">
                        Contact Person Full Name <span className="text-pearl-danger-light">*</span>
                      </label>
                      <input
                        id="profile-settings-emergency-name"
                        type="text"
                        value={emergencyContactName}
                        onChange={(e) => {
                          setEmergencyContactName(e.target.value);
                          if (errors.emergencyContactName) setErrors({ ...errors, emergencyContactName: '' });
                        }}
                        placeholder="Full name of family or next of kin"
                        className="w-full bg-pearl-input border border-pearl-border focus:border-pearl-border px-3 py-2 rounded-xl text-xs font-semibold text-pearl-text outline-none"
                      />
                      {errors.emergencyContactName && (
                        <p className="text-[10px] text-pearl-danger-light font-semibold mt-0.5">
                          {errors.emergencyContactName}
                        </p>
                      )}
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label htmlFor="profile-settings-emergency-relationship" className="block text-[11px] font-semibold text-pearl-text-secondary">
                          Relationship
                        </label>
                        <span className="text-[10px] font-medium text-pearl-placeholder">Optional</span>
                      </div>
                      <input
                        id="profile-settings-emergency-relationship"
                        type="text"
                        value={emergencyContactRelation}
                        onChange={(e) => setEmergencyContactRelation(e.target.value)}
                        placeholder="e.g. Spouse / Parent / Brother / Friend"
                        className="w-full bg-pearl-input border border-pearl-border focus:border-pearl-border px-3 py-2 rounded-xl text-xs font-semibold text-pearl-text outline-none"
                      />
                    </div>
                    <div>
                      <label htmlFor="profile-settings-emergency-phone" className="block text-[11px] font-semibold text-pearl-text-secondary mb-1">
                        Emergency Phone Number <span className="text-pearl-danger-light">*</span>
                      </label>
                      <input
                        id="profile-settings-emergency-phone"
                        type="tel"
                        value={emergencyContactPhone}
                        onChange={(e) => {
                          setEmergencyContactPhone(e.target.value);
                          if (errors.emergencyContactPhone) setErrors({ ...errors, emergencyContactPhone: '' });
                        }}
                        placeholder="+256 701 234567"
                        className="w-full bg-pearl-input border border-pearl-border focus:border-pearl-border px-3 py-2 rounded-xl text-xs font-semibold text-pearl-text outline-none"
                      />
                      {errors.emergencyContactPhone && (
                        <p className="text-[10px] text-pearl-danger-light font-semibold mt-0.5">
                          {errors.emergencyContactPhone}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: PURPOSE OF TRAVEL */}
            {activeTab === 'travel' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs text-pearl-text-secondary leading-relaxed">
                    Selecting your primary purpose of travel allows Pearl Travel and the immigration rule engine to calculate your applicable requirements.
                  </p>
                  <span className="text-[10px] font-bold text-pearl-gold-light bg-pearl-gold/10 px-2 py-0.5 rounded-md border border-pearl-gold/40 whitespace-nowrap">
                    Required Rule
                  </span>
                </div>
                {errors.travelPurpose && (
                  <p className="text-xs text-pearl-danger-light font-semibold">{errors.travelPurpose}</p>
                )}
                <div role="radiogroup" aria-label="Purpose of travel" className="grid grid-cols-1 gap-2.5">
                  {TRAVEL_PURPOSES.map((purpose) => {
                    const isSelected = travelPurpose === purpose.value;
                    return (
                      <button
                        type="button"
                        role="radio"
                        aria-checked={isSelected}
                        key={purpose.value}
                        onClick={() => {
                          setTravelPurpose(purpose.value);
                          if (errors.travelPurpose) setErrors({ ...errors, travelPurpose: '' });
                        }}
                        className={`w-full text-left p-3.5 rounded-xl cursor-pointer transition-colors border flex items-start justify-between focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pearl-gold ${
                          isSelected ? 'bg-pearl-gold text-pearl-navy border-pearl-gold ring-2 ring-pearl-gold-light' : 'bg-pearl-surface border-pearl-border text-pearl-text hover:bg-pearl-input'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className={`w-5 h-5 rounded-full mt-0.5 flex items-center justify-center shrink-0 ${
                              isSelected ? 'bg-pearl-gold text-pearl-navy' : 'bg-pearl-input border border-pearl-border'
                            }`}
                          >
                            {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                          </div>
                          <div>
                            <p className="text-xs font-bold text-pearl-text">{purpose.label}</p>
                            <p className="text-[11px] mt-0.5 text-pearl-text-secondary">{purpose.desc}</p>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Modal Actions */}
            {saveError && (
              <p role="alert" className="mt-4 text-sm font-medium text-pearl-danger-light">
                {saveError}
              </p>
            )}
            <div className="mt-8 pt-5 border-t border-pearl-border flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={onClose}
                className="min-h-[40px] py-2 px-5 rounded-xl text-xs font-semibold bg-pearl-surface border border-pearl-border text-pearl-text hover:bg-pearl-input cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                id="btn-save-profile-settings"
                disabled={saveSuccess}
                className="min-h-[42px] py-2.5 px-6 rounded-xl text-xs font-bold tracking-wider uppercase bg-pearl-gold text-pearl-text hover:bg-pearl-gold-light cursor-pointer transition-colors flex items-center gap-2 whitespace-nowrap"
              >
                {saveSuccess ? (
                  <>
                    <Check className="w-4 h-4 text-pearl-success-light stroke-[3]" />
                    <span>Saved!</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 text-pearl-text" />
                    <span>Save Profile Settings</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
