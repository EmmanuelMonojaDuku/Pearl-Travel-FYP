import React from 'react';
import {
  MapPin,
  Shield,
  Activity,
  FileCheck2,
  PackageCheck,
  CheckCircle,
  Smartphone,
  Navigation,
} from 'lucide-react';
import { MALABA_BORDER_SCENES } from '../data/malabaVideoScenes';

interface MalabaBorderMapProps {
  currentSceneId: number;
  onSelectScene: (sceneId: number) => void;
  language?: 'en' | 'sw';
}

export const MalabaBorderMap: React.FC<MalabaBorderMapProps> = ({
  currentSceneId,
  onSelectScene,
  language = 'en',
}) => {
  const isSw = language === 'sw';

  const steps = [
    {
      id: 1,
      title: isSw ? '1. Mapokezi ya Wasafiri' : '1. Arrival Concourse',
      subtitle: isSw ? 'Uwanja wa Kituo & Kushuka Mabasi' : 'Terminal Forecourt & Bus Drop-off',
      icon: Navigation,
      color: 'border-pearl-border text-pearl-text-secondary bg-pearl-surface',
      activeColor: 'bg-pearl-gold text-pearl-navy ring-2 ring-pearl-gold-light',
      location: isSw ? 'Mlango wa Kusini-Mashariki' : 'South-East Entry Gate',
    },
    {
      id: 2,
      title: isSw ? '2. Uhamiaji Mkuu' : '2. Primary Immigration',
      subtitle: isSw ? 'Kaunta 1-6 • Pasipoti na Biometria' : 'Counters 1-6 • Passport & Biometrics',
      icon: Shield,
      color: 'border-pearl-border text-pearl-text-secondary bg-pearl-surface',
      activeColor: 'bg-pearl-gold text-pearl-navy ring-2 ring-pearl-gold-light',
      location: isSw ? 'Ukumbi wa Kati Ghorofa ya 1' : 'Central Concourse Level 1',
    },
    {
      id: 3,
      title: isSw ? '3. Dawati la Inter-State EAC' : '3. EAC Inter-State Desk',
      subtitle: isSw ? 'Kaunta 7 • Usafiri Huru wa Afrika Mashariki' : 'Counter 7 • Regional Free Movement',
      icon: FileCheck2,
      color: 'border-pearl-border text-pearl-text-secondary bg-pearl-surface',
      activeColor: 'bg-pearl-gold text-pearl-navy ring-2 ring-pearl-gold-light',
      location: isSw ? 'Bawa la Mashariki Chumba 104' : 'East Wing Room 104',
    },
    {
      id: 4,
      title: isSw ? '4. TMP & Hati za Dharura' : '4. TMP & Emergency Pass',
      subtitle: isSw ? 'Dawati Maalum la Hati za Dharura' : 'Special Documentation Bureau',
      icon: FileCheck2,
      color: 'border-pearl-border text-pearl-text-secondary bg-pearl-surface',
      activeColor: 'bg-pearl-gold text-pearl-navy ring-2 ring-pearl-gold-light',
      location: isSw ? 'Bawa la Magharibi Jengo B' : 'West Wing Annex B',
    },
    {
      id: 5,
      title: isSw ? '5. Afya ya Mpakani & Forodha' : '5. Port Health & Customs',
      subtitle: isSw ? 'Homa ya Manjano & X-Ray ya URA' : 'Yellow Fever & URA Luggage X-Ray',
      icon: Activity,
      color: 'border-pearl-border text-pearl-text-secondary bg-pearl-surface',
      activeColor: 'bg-pearl-gold text-pearl-navy ring-2 ring-pearl-gold-light',
      location: isSw ? 'Ukumbi wa Mizigo Njia 1-3' : 'Baggage Hall Lanes 1-3',
    },
    {
      id: 6,
      title: isSw ? '6. Geti la Mwisho la Kutokea' : '6. Final Exit Gate',
      subtitle: isSw ? 'Ukaguzi wa Muhuri & Kuingia Uganda' : 'Departure Verification & Uganda Entry',
      icon: CheckCircle,
      color: 'border-pearl-border text-pearl-text-secondary bg-pearl-surface',
      activeColor: 'bg-pearl-gold text-pearl-navy ring-2 ring-pearl-gold-light',
      location: isSw ? 'Kizuizi cha Kutokea Kaskazini' : 'North Concourse Exit Barrier',
    },
    {
      id: 7,
      title: isSw ? '7. Kituo cha Pearl Travel' : '7. Pearl Travel App Hub',
      subtitle: isSw ? 'Uthibitisho wa Kidijitali Kabla ya Kufika' : 'Mobile Pre-Arrival Verification',
      icon: Smartphone,
      color: 'border-pearl-border text-pearl-text-secondary bg-pearl-surface',
      activeColor: 'bg-pearl-gold text-pearl-navy ring-2 ring-pearl-gold-light',
      location: isSw ? 'Eneo la Huduma za Kidijitali' : 'Digital Passenger Kiosk Area',
    },
  ];

  return (
    <div className="w-full bg-pearl-dark text-pearl-text rounded-2xl p-4 sm:p-6 border border-pearl-border shadow-xl overflow-hidden relative">
      {/* Uganda Flag Stripes Accent */}
      <div className="absolute top-0 left-0 right-0 h-1.5 flex">
        <div className="flex-1 bg-black" />
        <div className="flex-1 bg-[#FCD116]" />
        <div className="flex-1 bg-[#D21034]" />
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pt-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-pearl-gold text-pearl-navy">
              {isSw ? 'Muundo Rasmi wa Kituo' : 'Official Layout'}
            </span>
            <span className="text-xs text-pearl-placeholder">
              {isSw ? 'Mpangilio wa Kituo cha Pamoja cha Mpaka (OSBP)' : 'One-Stop Border Post (OSBP) Architecture'}
            </span>
          </div>
          <h3 className="text-lg font-black text-pearl-text tracking-tight mt-1 flex items-center gap-2">
            <span>{isSw ? 'Njia ya Wasafiri wa Miguu Ndani ya Kituo cha Malaba OSBP' : 'Malaba OSBP Passenger Terminal Walking Route'}</span>
          </h3>
        </div>

        <div className="flex items-center gap-2 text-xs text-pearl-text-secondary">
          <div className="w-2 h-2 rounded-full bg-pearl-success-light" />
          <span>{isSw ? 'Mwelekeo wa Ukaguzi Unaofanyika' : 'Active Clearance Route'}</span>
        </div>
      </div>

      {/* Schematic Diagram of the Border Station */}
      <div className="relative w-full bg-pearl-surface border border-pearl-border rounded-xl p-4 mb-6">
        <div className="flex items-center justify-between text-[11px] font-mono text-pearl-placeholder pb-3 border-b border-pearl-border/80 mb-4">
          <span className="flex items-center gap-1.5 text-pearl-accent font-bold">
            <MapPin className="w-3.5 h-3.5" /> {isSw ? 'KUINGIA KUTOKA MPAKA WA KENYA' : 'KENYA BORDER ENTRY'}
          </span>
          <span className="hidden sm:inline text-pearl-placeholder">
            {isSw ? 'Njia Zilizoezekwa za Wasafiri wa Miguu' : 'Sheltered Directional Passenger Walkway'}
          </span>
          <span className="flex items-center gap-1.5 text-pearl-success-light font-bold">
            <CheckCircle className="w-3.5 h-3.5" /> {isSw ? 'UKUMBI WA KUINGIA NCHINI UGANDA' : 'UGANDA INLAND CONCOURSE'}
          </span>
        </div>

        {/* Steps Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {steps.map((step) => {
            const Icon = step.icon;
            const isCurrent = step.id === currentSceneId;

            return (
              <button
                key={step.id}
                type="button"
                onClick={() => onSelectScene(step.id)}
                className={`p-3 rounded-xl text-left border transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between min-h-[96px] ${
                  isCurrent
                    ? `${step.activeColor} shadow-lg shadow-black/40 scale-[1.02]`
                    : 'bg-pearl-navy/90 border-pearl-border text-pearl-text-secondary hover:border-pearl-gold hover:bg-pearl-surface'
                }`}
              >
                {isCurrent && (
                  <span className="absolute top-2 right-2 px-1.5 py-0.5 text-[9px] font-black uppercase rounded bg-pearl-gold text-pearl-navy">
                    {isSw ? 'Inacheza' : 'Playing'}
                  </span>
                )}

                <div className="flex items-start gap-2.5">
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                      isCurrent ? 'bg-pearl-navy/10 text-pearl-navy' : 'bg-pearl-dark text-pearl-text-secondary'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold leading-tight">
                      {step.title}
                    </h4>
                    <p className={`text-[11px] mt-0.5 line-clamp-1 ${isCurrent ? 'text-pearl-navy/80' : 'text-pearl-placeholder'}`}>
                      {step.subtitle}
                    </p>
                  </div>
                </div>

                <div className="mt-2 pt-2 border-t border-pearl-border/40 flex items-center justify-between text-[10px]">
                  <span className={`${isCurrent ? 'text-pearl-navy/80' : 'text-pearl-placeholder'}`}>
                    {step.location}
                  </span>
                  <span className={`font-semibold ${isCurrent ? 'text-pearl-navy' : 'text-pearl-placeholder'}`}>
                    {isSw ? `Onyesho la ${step.id}` : `Scene ${step.id}`}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Official Malaba OSBP Facts Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-pearl-text-secondary">
        <div className="bg-pearl-surface p-3 rounded-xl border border-pearl-border/80">
          <strong className="text-pearl-text block font-bold text-xs mb-1">
            {isSw ? 'Falsafa ya Kituo cha Pamoja' : 'One-Stop Philosophy'}
          </strong>
          {isSw
            ? 'Wasafiri wanakaguliwa katika jengo moja la pamoja, bila kuhitaji kusimama mara mbili katika mipaka miwili tofauti.'
            : 'Passengers are processed in a single unified facility, eliminating the need to stop twice at separate national borders.'}
        </div>
        <div className="bg-pearl-surface p-3 rounded-xl border border-pearl-border/80">
          <strong className="text-pearl-text block font-bold text-xs mb-1">
            {isSw ? 'Huduma Saa 24 Kila Siku' : '24/7 Operations'}
          </strong>
          {isSw
            ? 'Ukaguzi wa abiria Malaba OSBP unafanyika saa 24 kila siku kupitia zamu za maafisa wa uhamiaji, forodha na afya.'
            : 'Malaba OSBP passenger clearance operates 24 hours a day with rotating shifts of immigration, customs, and port health officers.'}
        </div>
        <div className="bg-pearl-surface p-3 rounded-xl border border-pearl-border/80">
          <strong className="text-pearl-text block font-bold text-xs mb-1">
            {isSw ? 'Kupiga Vita Mawakala Haramu' : 'Zero-Touting Enforcement'}
          </strong>
          {isSw
            ? 'Huduma zote rasmi zinatolewa ndani ya kaunta rasmi za serikali. Kamwe usikabidhi hati au fedha kwa vishoka mitaani.'
            : 'Official services are strictly performed inside the terminal counters. Never hand documents or cash to unauthorized middlemen.'}
        </div>
      </div>
    </div>
  );
};
