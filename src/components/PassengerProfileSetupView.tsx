import React, { useState } from 'react';
import {
  User,
  Phone,
  Compass,
  HeartHandshake,
  AlertCircle,
  Loader2,
  ArrowRight,
  ArrowLeft,
  ChevronDown,
  Check,
} from 'lucide-react';
import { PearlTravelLogo } from './PearlTravelLogo';
import { FormField } from './FormField';
import { SearchableCountrySelect } from './SearchableCountrySelect';
import { AvatarUploader } from './AvatarUploader';
import { COUNTRY_CALLING_CODES, RELATIONSHIP_OPTIONS } from '../data/countryOptions';
import { GenderType, PassengerProfile, TravelPurpose } from '../types';
import { isTravellerProfileComplete } from '../utils/authStorage';

interface PassengerProfileSetupViewProps {
  initialProfile: PassengerProfile;
  onContinue: (updatedProfile: PassengerProfile) => boolean;
  onCancel?: () => void;
  onShowToast: (msg: string) => void;
}

const GENDER_OPTIONS: GenderType[] = [
  'Male',
  'Female',
  'Non-Binary',
  'Prefer not to say',
];

const TRAVEL_PURPOSE_OPTIONS: {
  value: TravelPurpose;
  label: string;
  description: string;
}[] = [
  {
    value: 'tourism',
    label: 'Safari & Wildlife Tourism',
    description: 'Holidays, wildlife parks, and leisure visits',
  },
  {
    value: 'business',
    label: 'Business & Investment',
    description: 'Commercial meetings, trade, or conferences',
  },
  {
    value: 'family',
    label: 'Visiting Family & Friends',
    description: 'Personal stay with family or hosts in Uganda',
  },
  {
    value: 'studies',
    label: 'Academic & Research Studies',
    description: 'University enrollment or field research',
  },
  {
    value: 'transit',
    label: 'Transit',
    description: 'Passing through Uganda to a third country',
  },
  {
    value: 'employment',
    label: 'Work & Humanitarian NGO',
    description: 'Employment, official mission, or NGO assignment',
  },
];

function extractPhoneDigits(rawPhone?: string, code?: string): string {
  if (!rawPhone) return '';
  const trimmed = rawPhone.trim();
  if (code && trimmed.startsWith(code)) {
    return trimmed.slice(code.length).trim();
  }
  return trimmed;
}

export const PassengerProfileSetupView: React.FC<PassengerProfileSetupViewProps> = ({
  initialProfile,
  onContinue,
  onCancel,
  onShowToast,
}) => {
  const initialCode = initialProfile.countryCode || '+256';
  const [nationality, setNationality] = useState(initialProfile.nationality || '');
  const [gender, setGender] = useState<GenderType | ''>(initialProfile.gender || '');
  const [countryCode, setCountryCode] = useState(initialCode);
  const [phoneNumber, setPhoneNumber] = useState(
    extractPhoneDigits(initialProfile.phoneNumber, initialCode)
  );
  const [travelPurpose, setTravelPurpose] = useState<TravelPurpose | ''>(
    initialProfile.travelPurpose || ''
  );

  const [emergencyContactName, setEmergencyContactName] = useState(
    initialProfile.emergencyContactName || ''
  );
  const [emergencyContactPhone, setEmergencyContactPhone] = useState(
    initialProfile.emergencyContactPhone || ''
  );

  const existingRelation = (initialProfile.emergencyContactRelation || '').trim();
  const isPresetRelation = RELATIONSHIP_OPTIONS.includes(existingRelation);
  const [relationSelect, setRelationSelect] = useState(
    existingRelation
      ? isPresetRelation
        ? existingRelation
        : 'Other'
      : ''
  );
  const [customRelation, setCustomRelation] = useState(
    existingRelation && !isPresetRelation ? existingRelation : ''
  );

  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(
    initialProfile.avatarUrl
  );

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  const resolvedRelationship =
    relationSelect === 'Other' ? customRelation.trim() : relationSelect.trim();
  const isProfileComplete = isTravellerProfileComplete({
    ...initialProfile,
    nationality,
    gender: gender || undefined,
    countryCode,
    phoneNumber,
    travelPurpose: travelPurpose || undefined,
    emergencyContactName,
    emergencyContactPhone,
    emergencyContactRelation: resolvedRelationship,
  });

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!nationality.trim()) {
      newErrors.nationality = 'Please select your nationality.';
    }

    if (!gender) {
      newErrors.gender = 'Please select a gender option.';
    }

    if (!countryCode.trim()) {
      newErrors.countryCode = 'Please select a country calling code.';
    }

    const phoneDigits = phoneNumber.replace(/\D/g, '');
    if (!phoneNumber.trim()) {
      newErrors.phoneNumber = 'Contact phone number is required.';
    } else if (phoneDigits.length < 6) {
      newErrors.phoneNumber = 'Please enter a valid contact phone number (at least 6 digits).';
    }

    if (!travelPurpose) {
      newErrors.travelPurpose = 'Please select your purpose of travel.';
    }

    if (!emergencyContactName.trim()) {
      newErrors.emergencyContactName = 'Next of kin full name is required.';
    } else if (emergencyContactName.trim().length < 2) {
      newErrors.emergencyContactName = 'Please enter a valid full name.';
    }

    const kinPhoneDigits = emergencyContactPhone.replace(/\D/g, '');
    if (!emergencyContactPhone.trim()) {
      newErrors.emergencyContactPhone = 'Next of kin phone number is required.';
    } else if (kinPhoneDigits.length < 6) {
      newErrors.emergencyContactPhone = 'Please enter a valid emergency phone number.';
    }

    if (!resolvedRelationship) {
      newErrors.relationship = 'Please specify your relationship to your next of kin.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving) return;

    if (!validate()) {
      setSaveError('');
      onShowToast('Please complete all required traveller profile fields.');
      return;
    }

    setIsSaving(true);
    setSaveError('');

    const formattedPhone = phoneNumber.trim().startsWith('+')
      ? phoneNumber.trim()
      : `${countryCode} ${phoneNumber.trim()}`;

    const updatedProfile: PassengerProfile = {
      ...initialProfile,
      nationality: nationality.trim(),
      gender: gender as GenderType,
      countryCode,
      phoneNumber: formattedPhone,
      travelPurpose: travelPurpose as TravelPurpose,
      emergencyContactName: emergencyContactName.trim(),
      emergencyContactPhone: emergencyContactPhone.trim(),
      emergencyContactRelation: resolvedRelationship,
      avatarUrl,
    };

    const saved = onContinue(updatedProfile);
    setIsSaving(false);
    if (!saved) {
      setSaveError('Your profile could not be saved in this browser. Your entries are still here; please retry.');
      onShowToast('Unable to save your profile. Please retry.');
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto px-4 py-4 sm:py-6">
      <div className="bg-pearl-input border border-pearl-border rounded-2xl p-6 sm:p-8 shadow-xs">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-pearl-border">
          <div className="flex items-center gap-3.5">
            <PearlTravelLogo size="sm" showText={false} variant="transparent" className="shrink-0" />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-pearl-text">
                  Pearl Travel
                </span>
                <span className="h-1.5 w-1.5 rounded-full bg-pearl-danger" aria-hidden="true" />
                <span className="text-xs font-medium text-pearl-text-secondary">
                  Traveller Profile Setup
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-pearl-text tracking-tight font-heading mt-0.5">
                Complete Your Traveller Profile
              </h1>
            </div>
          </div>

          {onCancel && (
            <button
              type="button"
              id="btn-cancel-profile-setup"
              onClick={onCancel}
              className="h-9 px-3.5 rounded-xl border border-pearl-border bg-pearl-input hover:bg-pearl-input text-xs font-semibold text-pearl-text flex items-center gap-1.5 self-start sm:self-auto cursor-pointer transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Dashboard</span>
            </button>
          )}
        </div>

        {/* Authenticated Account Summary (No duplicated Name/Email inputs) */}
        <div className="mt-5 p-3.5 rounded-xl bg-pearl-input border border-pearl-border flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-pearl-navy text-pearl-gold-light flex items-center justify-center shrink-0">
              <User className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-pearl-text-secondary">Authenticated Account</p>
              <p className="text-sm font-semibold text-pearl-text truncate">
                {initialProfile.fullName}
                {initialProfile.email ? ` • ${initialProfile.email}` : ''}
              </p>
            </div>
          </div>
          <span className="text-xs font-medium text-pearl-text-secondary shrink-0">
            Fields marked <span className="text-pearl-danger-light font-bold">*</span> are required
          </span>
        </div>

        <section
          aria-label="Traveller profile photo and completion"
          className="mt-5 p-4 rounded-xl bg-pearl-dark border border-pearl-border flex flex-col sm:flex-row sm:items-center gap-4"
        >
          <AvatarUploader
            currentAvatarUrl={avatarUrl}
            userName={initialProfile.fullName}
            onAvatarChange={setAvatarUrl}
            size="md"
          />
          <div className="min-w-0 flex-1 text-center sm:text-left">
            <p className="text-xs font-semibold uppercase tracking-wide text-pearl-gold-light">
              Traveller Profile
            </p>
            <h2 className="mt-1 text-base font-bold text-pearl-text truncate">
              {initialProfile.fullName}
            </h2>
            <p className="mt-1 text-xs text-pearl-text-secondary">
              Profile status:{' '}
              <span className={isProfileComplete ? 'text-pearl-success-light' : 'text-pearl-gold-light'}>
                {isProfileComplete ? 'Complete' : 'In progress'}
              </span>
            </p>
            <p className="mt-1 text-xs text-pearl-placeholder">
              A profile photo is optional. Add or change it anytime.
            </p>
          </div>
        </section>

        <form onSubmit={handleSubmit} noValidate className="mt-6 space-y-8">
          {/* SECTION 1: PERSONAL INFORMATION */}
          <section aria-labelledby="section-personal-travel" className="space-y-5">
            <div className="pb-2 border-b border-pearl-border flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Compass className="w-4 h-4 text-pearl-text" />
                <h2
                  id="section-personal-travel"
                  className="text-base font-bold text-pearl-text font-heading"
                >
                  Personal Information
                </h2>
              </div>
              <span className="text-xs font-semibold text-pearl-danger-light">Required</span>
            </div>

            {/* Nationality (Searchable) */}
            <SearchableCountrySelect
              id="profile-nationality"
              label="Nationality"
              value={nationality}
              onChange={(val) => {
                setNationality(val);
                if (errors.nationality) setErrors({ ...errors, nationality: undefined });
              }}
              error={errors.nationality}
              helperText="Requested to determine Uganda visa requirements, EAC exemptions, and entry rules."
              required
              disabled={isSaving}
            />

            {/* Gender (Accessible Radio Group) */}
            <div>
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <span id="profile-gender-label" className="text-sm font-semibold text-pearl-text">
                  Gender <span className="text-pearl-danger-light ml-0.5" aria-hidden="true">*</span>
                </span>
              </div>
              <div
                role="radiogroup"
                aria-labelledby="profile-gender-label"
                className="grid grid-cols-2 sm:grid-cols-4 gap-2.5"
              >
                {GENDER_OPTIONS.map((option) => {
                  const selected = gender === option;
                  return (
                    <button
                      key={option}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      disabled={isSaving}
                      onClick={() => {
                        setGender(option);
                        if (errors.gender) setErrors({ ...errors, gender: undefined });
                      }}
                      className={`h-11 px-3 rounded-xl border text-sm font-medium transition-colors flex items-center justify-center gap-1.5 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-pearl-gold ${
                        selected
                          ? 'bg-pearl-navy text-pearl-text border-pearl-gold'
                          : 'bg-pearl-input text-pearl-text border-pearl-border hover:bg-pearl-slate hover:border-pearl-gold'
                      } disabled:opacity-60 disabled:cursor-not-allowed`}
                    >
                      {selected && <Check className="w-3.5 h-3.5 text-pearl-gold-light shrink-0" />}
                      <span className="truncate">{option}</span>
                    </button>
                  );
                })}
              </div>
              {errors.gender ? (
                <p role="alert" className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-pearl-danger-light">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{errors.gender}</span>
                </p>
              ) : (
                <p className="mt-1.5 text-xs text-pearl-text-secondary">
                  Requested to align your profile with passport and immigration arrival records.
                </p>
              )}
            </div>

            {/* Contact Number with Country Calling-Code Selector */}
            <div>
              <label
                htmlFor="profile-contact-number"
                className="block text-sm font-semibold text-pearl-text mb-1.5"
              >
                Contact Number <span className="text-pearl-danger-light ml-0.5" aria-hidden="true">*</span>
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
                <div className="sm:col-span-5 relative">
                  <select
                    id="profile-country-code"
                    aria-label="Country calling code"
                    value={countryCode}
                    disabled={isSaving}
                    onChange={(e) => {
                      setCountryCode(e.target.value);
                      if (errors.countryCode) setErrors({ ...errors, countryCode: undefined });
                    }}
                    className="w-full h-11 pl-3.5 pr-9 rounded-xl bg-pearl-input border border-pearl-border hover:border-pearl-border focus:border-pearl-gold focus:ring-2 focus:ring-pearl-gold/35 focus:outline-none text-sm font-medium text-pearl-text appearance-none cursor-pointer"
                  >
                    {COUNTRY_CALLING_CODES.map((c) => (
                      <option key={`${c.iso}-${c.code}`} value={c.code}>
                        {c.iso} ({c.code}) — {c.country}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-pearl-gold-light pointer-events-none absolute right-3 top-1/2 -translate-y-1/2" />
                </div>

                <div className="sm:col-span-7 relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-pearl-text-secondary">
                    <Phone className="w-4 h-4" />
                  </div>
                  <input
                    id="profile-contact-number"
                    type="tel"
                    value={phoneNumber}
                    disabled={isSaving}
                    onChange={(e) => {
                      setPhoneNumber(e.target.value);
                      if (errors.phoneNumber) setErrors({ ...errors, phoneNumber: undefined });
                    }}
                    placeholder="772 123 456"
                    aria-invalid={Boolean(errors.phoneNumber)}
                    className={`w-full h-11 pl-10 pr-3.5 rounded-xl bg-pearl-input border text-sm text-pearl-text placeholder:text-pearl-placeholder focus:outline-none transition-colors ${
                      errors.phoneNumber
                        ? 'border-pearl-danger focus:border-pearl-danger focus:ring-2 focus:ring-pearl-danger/20'
                        : 'border-pearl-border hover:border-pearl-border focus:border-pearl-gold focus:ring-2 focus:ring-pearl-gold/35'
                    }`}
                  />
                </div>
              </div>

              {errors.phoneNumber || errors.countryCode ? (
                <p role="alert" className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-pearl-danger-light">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{errors.phoneNumber || errors.countryCode}</span>
                </p>
              ) : (
                <p className="mt-1.5 text-xs text-pearl-text-secondary">
                  Used for Port Health notifications and urgent border-crossing updates.
                </p>
              )}
            </div>

          </section>

          {/* SECTION 2: TRAVEL INFORMATION */}
          <section aria-labelledby="section-travel-information" className="space-y-5">
            <div className="pb-2 border-b border-pearl-border flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Compass className="w-4 h-4 text-pearl-text" />
                <h2
                  id="section-travel-information"
                  className="text-base font-bold text-pearl-text font-heading"
                >
                  Travel Information
                </h2>
              </div>
              <span className="text-xs font-semibold text-pearl-danger-light">Required</span>
            </div>

            <div>
              <span
                id="profile-purpose-label"
                className="block text-sm font-semibold text-pearl-text mb-1.5"
              >
                Purpose of Travel <span className="text-pearl-danger-light ml-0.5" aria-hidden="true">*</span>
              </span>
              <div
                role="radiogroup"
                aria-labelledby="profile-purpose-label"
                className="grid grid-cols-1 sm:grid-cols-2 gap-2.5"
              >
                {TRAVEL_PURPOSE_OPTIONS.map((purpose) => {
                  const selected = travelPurpose === purpose.value;
                  return (
                    <button
                      key={purpose.value}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      disabled={isSaving}
                      onClick={() => {
                        setTravelPurpose(purpose.value);
                        if (errors.travelPurpose) {
                          setErrors({ ...errors, travelPurpose: undefined });
                        }
                      }}
                      className={`p-3 rounded-xl border text-left transition-colors cursor-pointer flex items-start justify-between gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-pearl-gold ${
                        selected
                          ? 'bg-pearl-navy text-pearl-text border-pearl-border'
                          : 'bg-pearl-input text-pearl-text border-pearl-border hover:bg-pearl-input hover:border-pearl-border'
                      } disabled:opacity-60 disabled:cursor-not-allowed`}
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-semibold">{purpose.label}</p>
                        <p
                          className={`text-xs mt-0.5 leading-snug ${
                            selected ? 'text-pearl-text-secondary' : 'text-pearl-text-secondary'
                          }`}
                        >
                          {purpose.description}
                        </p>
                      </div>
                      <span
                        aria-hidden="true"
                        className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${
                          selected
                            ? 'bg-pearl-gold border-pearl-gold text-pearl-text'
                            : 'border-pearl-border bg-pearl-input'
                        }`}
                      >
                        {selected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                      </span>
                    </button>
                  );
                })}
              </div>
              {errors.travelPurpose ? (
                <p role="alert" className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-pearl-danger-light">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{errors.travelPurpose}</span>
                </p>
              ) : (
                <p className="mt-1.5 text-xs text-pearl-text-secondary">
                  Helps tailor your visa category, permit guidance, and border document checklist.
                </p>
              )}
            </div>
          </section>

          {/* SECTION 3: EMERGENCY CONTACT */}
          <section aria-labelledby="section-emergency-contact" className="space-y-4">
            <div className="pb-2 border-b border-pearl-border flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <HeartHandshake className="w-4 h-4 text-pearl-text" />
                <h2
                  id="section-emergency-contact"
                  className="text-base font-bold text-pearl-text font-heading"
                >
                  Emergency Contact
                </h2>
              </div>
              <span className="text-xs font-semibold text-pearl-danger-light">Required</span>
            </div>

            <p className="text-xs text-pearl-text-secondary leading-relaxed">
              Requested so border authorities or Pearl Travel support can notify a trusted contact if an urgent travel or health situation arises.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                id="profile-kin-name"
                label="Next of Kin Full Name"
                type="text"
                value={emergencyContactName}
                onChange={(e) => {
                  setEmergencyContactName(e.target.value);
                  if (errors.emergencyContactName) {
                    setErrors({ ...errors, emergencyContactName: undefined });
                  }
                }}
                placeholder="Full name of next of kin"
                error={errors.emergencyContactName}
                disabled={isSaving}
                required
              />

              <FormField
                id="profile-kin-phone"
                label="Next of Kin Phone Number"
                type="tel"
                value={emergencyContactPhone}
                onChange={(e) => {
                  setEmergencyContactPhone(e.target.value);
                  if (errors.emergencyContactPhone) {
                    setErrors({ ...errors, emergencyContactPhone: undefined });
                  }
                }}
                placeholder="+256 700 123 456"
                error={errors.emergencyContactPhone}
                disabled={isSaving}
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="profile-kin-relationship"
                  className="block text-sm font-semibold text-pearl-text mb-1.5"
                >
                  Relationship <span className="text-pearl-danger-light ml-0.5" aria-hidden="true">*</span>
                </label>
                <div className="relative">
                  <select
                    id="profile-kin-relationship"
                    value={relationSelect}
                    disabled={isSaving}
                    onChange={(e) => {
                      setRelationSelect(e.target.value);
                      if (errors.relationship) {
                        setErrors({ ...errors, relationship: undefined });
                      }
                    }}
                    aria-invalid={Boolean(errors.relationship)}
                    className={`w-full h-11 pl-3.5 pr-9 rounded-xl bg-pearl-input border text-sm font-medium appearance-none cursor-pointer focus:outline-none transition-colors ${
                      errors.relationship
                        ? 'border-pearl-danger focus:border-pearl-danger focus:ring-2 focus:ring-pearl-danger/20'
                        : 'border-pearl-border hover:border-pearl-border focus:border-pearl-gold focus:ring-2 focus:ring-pearl-gold/35'
                    } ${relationSelect ? 'text-pearl-text' : 'text-pearl-placeholder'}`}
                  >
                    <option value="">Select relationship</option>
                    {RELATIONSHIP_OPTIONS.map((rel) => (
                      <option key={rel} value={rel} className="text-pearl-text">
                        {rel}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-pearl-gold-light pointer-events-none absolute right-3 top-1/2 -translate-y-1/2" />
                </div>
                {errors.relationship && relationSelect !== 'Other' && (
                  <p role="alert" className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-pearl-danger-light">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{errors.relationship}</span>
                  </p>
                )}
              </div>

              {relationSelect === 'Other' && (
                <FormField
                  id="profile-kin-custom-relation"
                  label="Specify Relationship"
                  type="text"
                  value={customRelation}
                  onChange={(e) => {
                    setCustomRelation(e.target.value);
                    if (errors.relationship) {
                      setErrors({ ...errors, relationship: undefined });
                    }
                  }}
                  placeholder="e.g. Guardian, Tour Coordinator"
                  error={errors.relationship}
                  disabled={isSaving}
                  required
                />
              )}
            </div>
          </section>

          {/* Submit Action */}
          <div className="pt-4 border-t border-pearl-border flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-xs text-pearl-text-secondary">
              You can update any of these details later from your dashboard.
            </p>
            <button
              type="submit"
              id="btn-save-traveller-profile"
              disabled={isSaving}
              className="w-full sm:w-auto h-11 px-7 rounded-xl bg-pearl-gold hover:bg-pearl-gold-light active:bg-pearl-gold text-pearl-text font-semibold text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-pearl-gold focus-visible:ring-offset-2 shrink-0"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving Profile...</span>
                </>
              ) : (
                <>
                  <span>Save Profile</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
          {saveError && (
            <p role="alert" className="text-sm font-medium text-pearl-danger-light">
              {saveError}
            </p>
          )}
        </form>
      </div>
    </div>
  );
};
