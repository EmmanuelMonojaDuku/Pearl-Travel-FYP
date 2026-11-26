import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  Compass,
  MapPin,
  Calendar,
  Truck,
  Plane,
  Train,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Check,
  Info,
} from 'lucide-react';
import { PearlTravelLogo } from './PearlTravelLogo';
import { JourneyDetails, TravelPurpose, TravelMode, PassengerProfile } from '../types';

interface JourneySetupViewProps {
  passengerProfile: PassengerProfile;
  initialJourney?: JourneyDetails;
  onGenerateRequirements: (journey: JourneyDetails) => void;
  onBackToProfile: () => void;
  onShowToast: (msg: string) => void;
}

const TRAVEL_PURPOSES: { value: TravelPurpose; label: string; description: string }[] = [
  {
    value: 'tourism',
    label: 'Tourism / Safari',
    description: 'Holiday and wildlife',
  },
  {
    value: 'business',
    label: 'Business / Trade',
    description: 'Meetings and trade',
  },
  {
    value: 'family',
    label: 'Visiting Family',
    description: 'Relatives and events',
  },
  {
    value: 'transit',
    label: 'Overland Transit',
    description: 'Passing through Uganda',
  },
  {
    value: 'studies',
    label: 'Education / Research',
    description: 'Study or research',
  },
  {
    value: 'employment',
    label: 'Official / Work Permit',
    description: 'Work or NGO assignment',
  },
];

const BORDER_POINTS = [
  {
    name: 'Malaba One-Stop Border Post (OSBP)',
    tag: 'Kenya',
    description: 'Kenya – Uganda, joint clearance, 24/7',
    featured: true,
  },
  {
    name: 'Busia One-Stop Border Post (OSBP)',
    tag: 'Kenya',
    description: 'Kenya – Uganda',
    featured: false,
  },
  {
    name: 'Entebbe International Airport (EBB)',
    tag: 'Airport',
    description: 'International airport',
    featured: false,
  },
  {
    name: 'Katuna One-Stop Border Post (OSBP)',
    tag: 'Rwanda',
    description: 'Rwanda – Uganda',
    featured: false,
  },
  {
    name: 'Mutukula One-Stop Border Post (OSBP)',
    tag: 'Tanzania',
    description: 'Tanzania – Uganda',
    featured: false,
  },
  {
    name: 'Elegu One-Stop Border Post (OSBP)',
    tag: 'South Sudan',
    description: 'South Sudan – Uganda',
    featured: false,
  },
];

export const JourneySetupView: React.FC<JourneySetupViewProps> = ({
  passengerProfile,
  initialJourney,
  onGenerateRequirements,
  onBackToProfile,
  onShowToast,
}) => {
  const [travelPurpose, setTravelPurpose] = useState<TravelPurpose | ''>(
    initialJourney?.travelPurpose || passengerProfile.travelPurpose || ''
  );
  const [destinationCountry, setDestinationCountry] = useState<string>(
    initialJourney?.destinationCountry || ''
  );
  const [borderPoint, setBorderPoint] = useState<string>(
    initialJourney?.intendedBorderPoint || ''
  );
  const [travelDate, setTravelDate] = useState<string>(initialJourney?.travelDate || '');
  const [travelMode, setTravelMode] = useState<TravelMode | ''>(initialJourney?.travelMode || '');

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!travelPurpose || !destinationCountry || !borderPoint || !travelDate || !travelMode) {
      onShowToast('Please complete all journey fields.');
      return;
    }

    const journey: JourneyDetails = {
      travelPurpose,
      destinationCountry,
      intendedBorderPoint: borderPoint,
      travelDate,
      travelMode,
      notes: `Crossing via ${borderPoint} on ${travelDate} for ${travelPurpose}`,
    };

    onGenerateRequirements(journey);
  };

  return (
    <div className="w-full max-w-3xl mx-auto px-2 sm:px-4 py-4">
      <div className="bg-pearl-dark rounded-2xl p-6 sm:p-8 border border-pearl-border">
        {/* Step Indicator and Branding */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-pearl-border">
          <div className="flex items-center gap-3">
            <div className="p-1.5 rounded-xl bg-pearl-input border border-pearl-border">
              <PearlTravelLogo size="sm" variant="transparent" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-pearl-text">
                  Pearl Travel
                </span>
                <span className="text-pearl-placeholder">•</span>
                <span className="text-xs font-semibold text-pearl-text-secondary">Journey Setup</span>
              </div>
              <span className="text-[11px] text-pearl-text-secondary font-medium">
                Passenger: <strong className="text-pearl-text font-semibold">{passengerProfile.fullName}</strong> ({passengerProfile.nationality || 'Nationality not set'})
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-pearl-navy text-pearl-text">
            <span className="text-xs font-bold tracking-wide">Journey</span>
          </div>
        </div>

        {/* Title & Subtitle */}
        <div className="mt-6 mb-7 text-center sm:text-left">
          <h1 className="text-2xl sm:text-3xl font-bold text-pearl-text font-heading tracking-tight">
            Plan your trip
          </h1>
        </div>

        {/* Form */}
        <form onSubmit={handleGenerate} className="space-y-6">
          {/* Field 1: Travel Purpose */}
          <div>
            <span id="journey-purpose-label" className="block text-xs font-bold uppercase text-pearl-text mb-2 tracking-wider">
              Travel Purpose <span className="text-pearl-danger-light">*</span>
            </span>
            <div role="group" aria-labelledby="journey-purpose-label" className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {TRAVEL_PURPOSES.map((item) => {
                const isSelected = travelPurpose === item.value;
                return (
                  <button
                    type="button"
                    key={item.value}
                    onClick={() => setTravelPurpose(item.value)}
                    aria-pressed={isSelected}
                    className={`p-3.5 rounded-xl border text-left transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pearl-gold ${
                      isSelected
                        ? 'bg-pearl-gold/15 text-pearl-text border-pearl-gold ring-1 ring-pearl-gold'
                        : 'bg-pearl-surface border-pearl-border text-pearl-text hover:bg-pearl-input'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold">{item.label}</span>
                      {isSelected && (
                        <CheckCircle2 className="w-3.5 h-3.5 text-pearl-accent" />
                      )}
                    </div>
                    <span className={`text-[11px] leading-tight block ${isSelected ? 'text-pearl-text-secondary' : 'text-pearl-text-secondary'}`}>
                      {item.description}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Field 2: Destination Country */}
          <div>
            <label htmlFor="select-setup-destination" className="block text-xs font-bold uppercase text-pearl-text mb-1.5 tracking-wider">
              Destination Country <span className="text-pearl-danger-light">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <MapPin className="w-4 h-4 text-pearl-accent" />
              </div>
              <select
                id="select-setup-destination"
                value={destinationCountry}
                onChange={(e) => setDestinationCountry(e.target.value)}
                className={`w-full pl-10 pr-4 py-3 rounded-xl bg-pearl-input border border-pearl-border text-sm font-semibold focus:outline-none focus:border-pearl-gold focus:ring-2 focus:ring-pearl-gold/35 transition-colors cursor-pointer ${
                  destinationCountry ? 'text-pearl-text' : 'text-pearl-placeholder'
                }`}
              >
                <option value="">Select destination</option>
                <option value="Uganda (The Pearl of Africa)">Uganda (The Pearl of Africa)</option>
                <option value="Uganda & East Africa Multi-Country (Uganda + Kenya + Rwanda)">
                  Uganda, Kenya and Rwanda (East Africa Tourist Visa)
                </option>
              </select>
            </div>
          </div>

          {/* Field 3: Intended Border Point */}
          <div>
            <div className="flex items-center justify-between gap-2 flex-wrap mb-2">
              <span id="journey-border-point-label" className="block text-xs font-bold uppercase text-pearl-text tracking-wider">
                Intended Border Crossing Point <span className="text-pearl-danger-light">*</span>
              </span>
              <span className="text-[11px] font-medium text-pearl-placeholder">
                Choose your border
              </span>
            </div>

            <div role="group" aria-labelledby="journey-border-point-label" className="space-y-2.5">
              {BORDER_POINTS.map((bp) => {
                const isSelected = borderPoint === bp.name;
                return (
                  <button
                    type="button"
                    key={bp.name}
                    onClick={() => setBorderPoint(bp.name)}
                    aria-pressed={isSelected}
                    className={`w-full p-3.5 rounded-xl border text-left transition-colors cursor-pointer flex items-start justify-between gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pearl-gold ${
                      isSelected
                        ? 'bg-pearl-gold/15 text-pearl-text border-pearl-gold ring-1 ring-pearl-gold'
                        : bp.featured
                        ? 'bg-pearl-surface border-pearl-gold/50 text-pearl-text hover:bg-pearl-input'
                        : 'bg-pearl-surface border-pearl-border text-pearl-text hover:bg-pearl-input'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold">{bp.name}</span>
                        <span
                          className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-md ${
                            isSelected
                              ? 'bg-pearl-gold text-pearl-text'
                              : bp.featured
                              ? 'bg-pearl-gold text-pearl-navy font-bold'
                              : 'bg-pearl-dark text-pearl-text-secondary border border-pearl-border'
                          }`}
                        >
                          {bp.tag}
                        </span>
                      </div>
                      <p className={`text-[11px] leading-relaxed ${isSelected ? 'text-pearl-text-secondary' : 'text-pearl-text-secondary'}`}>
                        {bp.description}
                      </p>
                    </div>
                    <div className="shrink-0 pt-0.5">
                      <div
                        className={`w-5 h-5 rounded-full flex items-center justify-center ${
                          isSelected ? 'bg-pearl-gold text-pearl-text' : 'border border-pearl-border bg-pearl-input'
                        }`}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Grid: Travel Date & Travel Mode */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Field 4: Travel Date */}
            <div>
              <label htmlFor="input-setup-traveldate" className="block text-xs font-bold uppercase text-pearl-text mb-1.5 tracking-wider">
                Planned Travel Date <span className="text-pearl-danger-light">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-pearl-placeholder">
                  <Calendar className="w-4 h-4" />
                </div>
                <input
                  type="date"
                  id="input-setup-traveldate"
                  value={travelDate}
                  onChange={(e) => setTravelDate(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-pearl-input border border-pearl-border text-sm font-semibold text-pearl-text focus:outline-none focus:border-pearl-gold focus:ring-2 focus:ring-pearl-gold/35 transition-colors cursor-pointer"
                />
              </div>
              <p className="text-[11px] text-pearl-text-secondary mt-1">Yellow Fever shot: at least 10 days before.</p>
            </div>

            {/* Field 5: Travel Mode */}
            <div>
              <span id="journey-travel-mode-label" className="block text-xs font-bold uppercase text-pearl-text mb-1.5 tracking-wider">
                Travel Mode <span className="text-pearl-danger-light">*</span>
              </span>
              <div role="group" aria-labelledby="journey-travel-mode-label" className="grid grid-cols-3 gap-2">
                {[
                  { mode: 'road' as TravelMode, label: 'Road', icon: Truck, desc: 'Bus / Car' },
                  { mode: 'air' as TravelMode, label: 'Air', icon: Plane, desc: 'Flight' },
                  { mode: 'rail' as TravelMode, label: 'Rail', icon: Train, desc: 'SGR Train' },
                ].map((item) => {
                  const Icon = item.icon;
                  const isSelected = travelMode === item.mode;
                  return (
                    <button
                      type="button"
                      key={item.mode}
                      onClick={() => setTravelMode(item.mode)}
                      aria-pressed={isSelected}
                      className={`py-2.5 px-2 rounded-xl border text-center transition-colors cursor-pointer flex flex-col items-center justify-center gap-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pearl-gold ${
                        isSelected
                          ? 'bg-pearl-gold/15 text-pearl-text border-pearl-gold ring-1 ring-pearl-gold'
                          : 'bg-pearl-surface border-pearl-border text-pearl-text hover:bg-pearl-input'
                      }`}
                    >
                      <Icon className={`w-4 h-4 ${isSelected ? 'text-pearl-accent' : 'text-pearl-text-secondary'}`} />
                      <span className="text-xs font-bold leading-none">{item.label}</span>
                      <span className={`text-[10px] ${isSelected ? 'text-pearl-text-secondary' : 'text-pearl-placeholder'}`}>{item.desc}</span>
                    </button>
                  );
                })}
              </div>
              <p className="text-[11px] text-pearl-text-secondary mt-1">
                {travelMode === 'road'
                  ? 'Road travel may require vehicle and COMESA documentation.'
                  : 'Pick how you will travel.'}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-4 flex flex-col-reverse sm:flex-row items-center justify-between gap-3 border-t border-pearl-border">
            <button
              type="button"
              id="btn-back-to-profile"
              onClick={onBackToProfile}
              className="w-full sm:w-auto min-h-[42px] px-5 py-2.5 rounded-xl text-xs font-semibold text-pearl-text bg-pearl-surface hover:bg-pearl-input border border-pearl-border transition-colors cursor-pointer flex items-center justify-center gap-2 whitespace-nowrap shrink-0"
            >
              <ArrowLeft className="w-4 h-4 text-pearl-text-secondary" />
              <span>Back</span>
            </button>

            <button
              type="submit"
              id="btn-generate-requirements"
              className="w-full sm:w-auto min-h-[44px] px-6 py-2.5 rounded-xl bg-pearl-gold hover:bg-pearl-gold-light text-pearl-text text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              <Sparkles className="w-4 h-4 text-pearl-text" />
              <span>Get my requirements</span>
              <ArrowRight className="w-4 h-4 text-pearl-text" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
