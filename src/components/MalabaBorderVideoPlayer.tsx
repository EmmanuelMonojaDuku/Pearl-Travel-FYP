import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  Subtitles,
  SkipForward,
  SkipBack,
  FileCheck,
  CheckCircle2,
  AlertTriangle,
  MapPin,
  Clock,
  Shield,
  Layers,
  Sparkles,
  Download,
  Info,
  ExternalLink,
  ChevronRight,
  ChevronLeft,
  Tv,
  Share2,
  Copy,
  Check,
} from 'lucide-react';
import {
  MALABA_BORDER_SCENES,
  TOTAL_VIDEO_DURATION,
  VideoScene,
  OnScreenDocItem,
} from '../data/malabaVideoScenes';
import { MALABA_BORDER_SCENES_SWAHILI } from '../data/malabaVideoScenesSwahili';
import { borderAudioEngine } from '../utils/borderAudioEngine';
import { MalabaBorderMap } from './MalabaBorderMap';
import { ShareVideoDownloadModal } from './ShareVideoDownloadModal';

interface MalabaBorderVideoPlayerProps {
  onSyncChecklist?: (requiredItems: string[]) => void;
  onShowToast: (msg: string) => void;
  initialLanguage?: 'en' | 'sw';
}

export const MalabaBorderVideoPlayer: React.FC<MalabaBorderVideoPlayerProps> = ({
  onSyncChecklist,
  onShowToast,
  initialLanguage = 'sw',
}) => {
  // Language version state: defaults to Swahili as requested, with instant toggle to English
  const [language, setLanguage] = useState<'en' | 'sw'>(initialLanguage);
  const isSw = language === 'sw';

  // Playback state
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [showSubtitles, setShowSubtitles] = useState<boolean>(true);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'video' | 'map' | 'transcript' | 'checklists'>('video');
  const [isShareModalOpen, setIsShareModalOpen] = useState<boolean>(false);
  const [isCopiedQuickLink, setIsCopiedQuickLink] = useState<boolean>(false);

  // Active scene list based on selected language version
  const activeScenes = useMemo(() => {
    return language === 'sw' ? MALABA_BORDER_SCENES_SWAHILI : MALABA_BORDER_SCENES;
  }, [language]);

  // Video container reference for fullscreen
  const playerContainerRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Compute current active scene based on currentTime
  const currentScene: VideoScene = useMemo(() => {
    const scene = activeScenes.find(
      (s) => currentTime >= s.startTime && currentTime < s.endTime
    );
    return scene || activeScenes[activeScenes.length - 1];
  }, [currentTime, activeScenes]);

  // Compute current active subtitle line
  const activeSubtitle = useMemo(() => {
    if (!currentScene) return null;
    return currentScene.subtitles.find(
      (sub) => currentTime >= sub.startTime && currentTime < sub.endTime
    );
  }, [currentScene, currentTime]);

  // Handle Play/Pause
  const togglePlay = () => {
    if (isPlaying) {
      setIsPlaying(false);
      borderAudioEngine.pauseVoiceover();
      borderAudioEngine.stopAmbientAtmosphere();
    } else {
      setIsPlaying(true);
      borderAudioEngine.startAmbientAtmosphere();
      // Speak current dialogue segment if unmuted
      if (!isMuted) {
        borderAudioEngine.speakScript(currentScene.dialogueScript, undefined, undefined, language);
      }
    }
  };

  // Main playback timer loop
  useEffect(() => {
    if (isPlaying) {
      const intervalMs = 100 / playbackSpeed;
      timerRef.current = setInterval(() => {
        setCurrentTime((prev) => {
          const next = prev + 0.1;
          if (next >= TOTAL_VIDEO_DURATION) {
            setIsPlaying(false);
            borderAudioEngine.stopVoiceover();
            borderAudioEngine.stopAmbientAtmosphere();
            borderAudioEngine.playChime();
            return TOTAL_VIDEO_DURATION;
          }
          return next;
        });
      }, intervalMs);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, playbackSpeed]);

  // Trigger audio narration & sound effects when scene changes
  const prevSceneIdRef = useRef<number>(currentScene.id);
  useEffect(() => {
    if (prevSceneIdRef.current !== currentScene.id) {
      prevSceneIdRef.current = currentScene.id;

      // Play subtle scene transition audio
      if (currentScene.id === 6) {
        borderAudioEngine.playStampSound();
      } else {
        borderAudioEngine.playChime();
      }

      // If currently playing and audio active, narrate the scene dialogue
      if (isPlaying && !isMuted) {
        borderAudioEngine.speakScript(currentScene.dialogueScript, undefined, undefined, language);
      }
    }
  }, [currentScene, isPlaying, isMuted, language]);

  // Sync mute state with audio engine
  useEffect(() => {
    borderAudioEngine.setMuted(isMuted);
    if (!isMuted && isPlaying) {
      borderAudioEngine.speakScript(currentScene.dialogueScript, undefined, undefined, language);
    }
  }, [isMuted, language]);

  // Sync playback speed
  useEffect(() => {
    borderAudioEngine.setSpeed(playbackSpeed);
  }, [playbackSpeed]);

  // Switch narration language (English vs Swahili)
  const handleLanguageChange = (newLang: 'en' | 'sw') => {
    if (newLang === language) return;
    setLanguage(newLang);
    borderAudioEngine.stopVoiceover();
    const newScenes = newLang === 'sw' ? MALABA_BORDER_SCENES_SWAHILI : MALABA_BORDER_SCENES;
    const target = newScenes.find((s) => currentTime >= s.startTime && currentTime < s.endTime) || newScenes[0];
    if (isPlaying && !isMuted) {
      borderAudioEngine.speakScript(target.dialogueScript, undefined, undefined, newLang);
    }
    onShowToast(
      newLang === 'sw'
        ? 'Umebadili video kwenda Toleo la Kiswahili (Simulizi ya Mkaguzi David Okello)'
        : 'Switched to English walkthrough video (Narrated by Inspector David Okello)'
    );
  };

  // Jump to specific scene
  const handleJumpToScene = (sceneId: number) => {
    const target = activeScenes.find((s) => s.id === sceneId);
    if (target) {
      setCurrentTime(target.startTime);
      if (!isPlaying) {
        setIsPlaying(true);
        borderAudioEngine.startAmbientAtmosphere();
      }
      if (!isMuted) {
        borderAudioEngine.speakScript(target.dialogueScript, undefined, undefined, language);
      }
      onShowToast(
        isSw
          ? `Onyesho la ${target.id}: ${target.title.split('—')[1] || target.title}`
          : `Switched to Scene ${target.id}: ${target.title.split('—')[1] || target.title}`
      );
    }
  };

  // Scrubbing
  const handleScrub = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setCurrentTime(val);
    borderAudioEngine.stopVoiceover();
  };

  // Skip 10s forward or backward
  const handleSkip = (seconds: number) => {
    setCurrentTime((prev) => Math.max(0, Math.min(TOTAL_VIDEO_DURATION, prev + seconds)));
  };

  // Format seconds to mm:ss
  const formatTime = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = Math.floor(sec % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Toggle fullscreen
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      playerContainerRef.current?.requestFullscreen?.().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.().catch(() => {});
      setIsFullscreen(false);
    }
  };

  // Download official transcript in active language
  const handleDownloadTranscript = () => {
    const transcriptText = isSw
      ? `KITUO CHA PAMOJA CHA MPAKA CHA MALABA (MALABA OSBP)
VIDEO RASMI YA MWONGOZO WA UKAGUZI WA ABIRIA (TOLEO LA KISWAHILI)
Imetolewa na: Mkaguzi David Okello (Idara ya Uhamiaji ya Uganda - DCIC)
Muda Kamili wa Video: ${formatTime(TOTAL_VIDEO_DURATION)} | Azimio: 4K UHD 2160p
Imewezeshwa na: Pearl Travel App Uganda

==================================================
` +
        activeScenes
          .map(
            (scene) => `
[${formatTime(scene.startTime)} - ${formatTime(scene.endTime)}] ${scene.title}
Eneo: ${scene.locationName} (${scene.stationType})
Msemaji: ${scene.officerName} (${scene.officerRole})

"${scene.dialogueScript}"

HATI ZINAZOHITAJIKA:
${scene.onScreenChecklist.map((c) => `- ${c.name} (${c.category.toUpperCase()}): ${c.description}`).join('\n')}

MIONGOZO NA USHAURI WA AFISA WA UHAMIAJI:
${scene.officerSummaryPoints.map((p) => `* ${p}`).join('\n')}
--------------------------------------------------
`
          )
          .join('\n') +
        `
ILANI YA KISHERIA:
Video hii na nakala yake ya mwongozo vimetolewa kwa ajili ya kuwapa wasafiri uelewa kabla ya kufika mpakani. Maamuzi rasmi ya kisheria ya kuingia nchini, utoaji wa viza za kielektroniki, na tathmini ya forodha yanasimamiwa kisheria na Idara ya Uhamiaji ya Uganda (DCIC) chini ya Wizara ya Mambo ya Ndani, pamoja na Mamlaka ya Mapato Uganda (URA). Fuata daima maelekezo ya maafisa walio kwenye sare rasmi.
`
      : `MALABA ONE-STOP BORDER POST (OSBP)
PASSENGER CLEARANCE OFFICIAL ORIENTATION VIDEO (ENGLISH VERSION)
Presented by Inspector David Okello (Uganda Immigration Service)
Total Duration: ${formatTime(TOTAL_VIDEO_DURATION)} | Resolution: 4K UHD 2160p
Powered by Pearl Travel Uganda

==================================================
` +
        activeScenes
          .map(
            (scene) => `
[${formatTime(scene.startTime)} - ${formatTime(scene.endTime)}] ${scene.title}
Location: ${scene.locationName} (${scene.stationType})
Speaker: ${scene.officerName} (${scene.officerRole})

"${scene.dialogueScript}"

REQUIRED DOCUMENTS:
${scene.onScreenChecklist.map((c) => `- ${c.name} (${c.category.toUpperCase()}): ${c.description}`).join('\n')}

OFFICER GUIDANCE NOTES:
${scene.officerSummaryPoints.map((p) => `* ${p}`).join('\n')}
--------------------------------------------------
`
          )
          .join('\n') +
        `
DISCLAIMER:
This video guidance is published for public passenger orientation and traveler awareness. Official border clearance rules, visa categories, and customs duties are subject to confirmation by the Uganda Directorate of Citizenship and Immigration Control (DCIC) and the Uganda Revenue Authority (URA). Always comply promptly with official instructions from uniformed border officers.
`;

    const blob = new Blob([transcriptText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = isSw
      ? 'Mwongozo_wa_Ukaguzi_Mpaka_wa_Malaba_Kiswahili.txt'
      : 'Malaba_OSBP_Border_Clearance_Official_Guide_Transcript.txt';
    link.click();
    URL.revokeObjectURL(url);
    onShowToast(
      isSw
        ? 'Nakala ya mwongozo wa Kiswahili imepakuliwa kikamilifu!'
        : 'Official border transcript downloaded successfully!'
    );
  };

  return (
    <div className="w-full space-y-6">
      {/* Top Header Card with Uganda National Pride Colors */}
      <div className="bg-pearl-navy border border-pearl-border rounded-3xl p-5 sm:p-7 shadow-2xl relative overflow-hidden">
        {/* National Tricolor Top Banner */}
        <div className="absolute top-0 left-0 right-0 h-2 flex">
          <div className="flex-1 bg-black" />
          <div className="flex-1 bg-pearl-gold" />
          <div className="flex-1 bg-pearl-danger" />
        </div>

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 pt-2">
          <div>
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-pearl-gold text-pearl-text">
                {isSw ? 'Mwongozo Rasmi wa Mpakani' : 'Official Border Walkthrough'}
              </span>
              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-pearl-dark text-pearl-gold-light border border-pearl-slate">
                4K UHD • 2160p
              </span>
              <span className="text-xs font-mono text-pearl-placeholder tabular-nums">
                {isSw ? 'Muda' : 'Duration'}: {formatTime(TOTAL_VIDEO_DURATION)} (approx. 4m 15s)
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-black text-pearl-text tracking-tight flex items-center gap-2">
              <span>
                {isSw
                  ? 'Utaratibu wa Ukaguzi wa Abiria Katika Mpaka wa Nchi Kavu wa Uganda'
                  : 'Ugandan Land Border Passenger Clearance Process'}
              </span>
            </h2>
            <p className="text-sm text-pearl-text-secondary mt-1 max-w-2xl leading-relaxed">
              {isSw ? (
                <>
                  Mwongozo rasmi wa hatua kwa hatua unaofundishwa katika <strong>Kituo cha Pamoja cha Mpaka cha Malaba (OSBP)</strong>.
                  Unaongozwa na <strong>Mkaguzi David Okello</strong> kutoka Idara ya Uhamiaji ya Uganda (DCIC).
                </>
              ) : (
                <>
                  Step-by-step pre-arrival guidance video inspired by the <strong>Malaba One-Stop Border Post</strong>.
                  Hosted by <strong>Inspector David Okello</strong> of the Uganda Immigration Service.
                </>
              )}
            </p>
          </div>

          {/* Language Selector & Navigation Controls */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            {/* Prominent Language Switcher */}
            <div className="flex items-center bg-pearl-navy/90 border border-pearl-border/80 rounded-2xl p-1 shadow-inner">
              <button
                type="button"
                id="btn-lang-swahili"
                onClick={() => handleLanguageChange('sw')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  language === 'sw'
                    ? 'bg-pearl-danger text-pearl-text shadow-md ring-2 ring-pearl-gold'
                    : 'text-pearl-text-secondary hover:text-pearl-text hover:bg-pearl-surface'
                }`}
                title="Tazama video kwa lugha ya Kiswahili"
              >
                <span className="w-2 h-2 rounded-full bg-pearl-gold" />
                <span>Kiswahili</span>
                <span className="px-1 py-0.2 rounded text-[9px] font-black uppercase bg-pearl-gold text-pearl-navy">
                  EAC
                </span>
              </button>

              <button
                type="button"
                id="btn-lang-english"
                onClick={() => handleLanguageChange('en')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  language === 'en'
                    ? 'bg-pearl-gold text-pearl-navy shadow-md ring-2 ring-black'
                    : 'text-pearl-text-secondary hover:text-pearl-text hover:bg-pearl-surface'
                }`}
                title="Watch video in English"
              >
                <span>English</span>
              </button>
            </div>

            {/* Quick Action Navigation Buttons */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                type="button"
                onClick={() => setActiveTab('video')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                  activeTab === 'video'
                    ? 'bg-pearl-gold text-pearl-navy shadow-lg shadow-amber-500/20'
                    : 'bg-pearl-dark text-pearl-text-secondary hover:bg-pearl-slate'
                }`}
              >
                <Play className="w-3.5 h-3.5" />
                <span>{isSw ? 'Video' : 'Watch'}</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('map')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                  activeTab === 'map'
                    ? 'bg-pearl-gold text-pearl-navy shadow-lg shadow-amber-500/20'
                    : 'bg-pearl-dark text-pearl-text-secondary hover:bg-pearl-slate'
                }`}
              >
                <MapPin className="w-3.5 h-3.5" />
                <span>{isSw ? 'Ramani' : 'Map'}</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('transcript')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                  activeTab === 'transcript'
                    ? 'bg-pearl-gold text-pearl-navy shadow-lg shadow-amber-500/20'
                    : 'bg-pearl-dark text-pearl-text-secondary hover:bg-pearl-slate'
                }`}
              >
                <FileCheck className="w-3.5 h-3.5" />
                <span>{isSw ? 'Nakala' : 'Script'}</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadTranscript}
                className="px-3 py-2 rounded-xl text-xs font-bold bg-pearl-dark hover:bg-pearl-slate text-pearl-text-secondary border border-pearl-border flex items-center gap-1.5"
                title={isSw ? 'Pakua nakala rasmi ya mwongozo' : 'Download official passenger orientation guide'}
              >
                <Download className="w-3.5 h-3.5 text-pearl-gold-light" />
                <span className="hidden sm:inline">{isSw ? 'Nakala' : 'Script'}</span>
              </button>

              <button
                type="button"
                id="btn-share-video-link-top"
                onClick={() => setIsShareModalOpen(true)}
                className="px-3.5 py-2 rounded-xl text-xs font-black bg-pearl-danger hover:bg-pearl-danger text-pearl-text shadow-md flex items-center gap-1.5 transition cursor-pointer ring-1 ring-pearl-gold"
                title={
                  isSw
                    ? 'Shiriki kiungo cha video cha kupakua na programu zote za video downloader'
                    : 'Share video download link with All Video Downloaders, IDM, Snaptube, etc.'
                }
              >
                <Share2 className="w-3.5 h-3.5 text-pearl-gold" />
                <span>{isSw ? 'Shiriki Video' : 'Share Video'}</span>
                <span className="hidden lg:inline px-1.5 py-0.2 rounded bg-pearl-navy/40 text-[9px] font-black uppercase tracking-wider text-pearl-gold-light">
                  All Downloaders
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Video Presentation Display */}
      {activeTab === 'video' && (
        <div className="space-y-4">
          <div
            ref={playerContainerRef}
            className={`w-full bg-pearl-navy rounded-3xl overflow-hidden shadow-2xl border border-pearl-border relative select-none ${
              isFullscreen ? 'fixed inset-0 z-50 rounded-none' : ''
            }`}
          >
            {/* 16:9 Landscape Video Aspect Ratio Screen */}
            <div className="relative w-full aspect-video bg-pearl-navy flex items-center justify-center overflow-hidden">
              {/* Photorealistic Scene Visual with Ken Burns Cinematic Pan/Zoom */}
              <div
                className={`w-full h-full relative overflow-hidden transition-all duration-1000 transform ${
                  isPlaying
                    ? currentScene.cameraMotion === 'zoom-in'
                      ? 'scale-110'
                      : currentScene.cameraMotion === 'zoom-out'
                      ? 'scale-100'
                      : currentScene.cameraMotion === 'pan-right'
                      ? 'translate-x-3 scale-105'
                      : '-translate-x-3 scale-105'
                    : 'scale-100'
                }`}
              >
                <img
                  src={currentScene.imageUrl}
                  alt={currentScene.title}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover object-center pointer-events-none filter brightness-95 contrast-105"
                />

                {/* Subtle Cinematic Vignette & Lighting Filter */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-black/60 pointer-events-none" />
              </div>

              {/* Official Border Post Top Watermark & Station Badges */}
              <div className="absolute top-4 left-4 right-4 flex items-start justify-between pointer-events-none z-20">
                <div className="flex items-center gap-3 bg-pearl-navy/60 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-pearl-border/40 shadow-lg">
                  {/* Uganda Flag Shield */}
                  <div className="w-8 h-8 rounded-lg overflow-hidden flex flex-col border border-pearl-gold/40 shadow-xs">
                    <div className="flex-1 bg-black" />
                    <div className="flex-1 bg-[#FCD116]" />
                    <div className="flex-1 bg-[#D21034]" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-[11px] font-black tracking-wider text-pearl-text uppercase font-mono">
                        MALABA OSBP
                      </p>
                      <span className="w-1.5 h-1.5 rounded-full bg-pearl-success-light" />
                    </div>
                    <p className="text-[10px] text-pearl-gold-light font-semibold">
                      {isSw ? 'Idara ya Uhamiaji ya Uganda • DCIC' : 'Uganda Immigration Service • DCIC'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="bg-pearl-navy/60 backdrop-blur-md px-3 py-1.5 rounded-xl border border-pearl-border/40 text-[10px] font-mono font-bold text-pearl-text flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-pearl-danger/15 animate-pulse" />
                    <span>REC • 4K UHD</span>
                  </div>
                  <div className="hidden sm:flex bg-pearl-navy/60 backdrop-blur-md px-3 py-1.5 rounded-xl border border-pearl-border/40 text-[10px] font-semibold text-pearl-text-secondary">
                    {isSw ? `Onyesho la ${currentScene.id} kati ya 7` : `Scene ${currentScene.id} of 7`}
                  </div>
                </div>
              </div>

              {/* Center Play Overlay Trigger (when paused) */}
              {!isPlaying && (
                <button
                  type="button"
                  onClick={togglePlay}
                  className="absolute z-30 w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-pearl-gold/90 hover:bg-pearl-gold text-pearl-navy flex items-center justify-center shadow-2xl transition transform hover:scale-105 active:scale-95 cursor-pointer backdrop-blur-sm group"
                  aria-label="Play video"
                >
                  <Play className="w-10 h-10 sm:w-12 sm:h-12 fill-black translate-x-1 group-hover:scale-110 transition" />
                </button>
              )}

              {/* Dynamic On-Screen Document Checklist Floating Card */}
              <div className="absolute top-16 sm:top-20 right-4 max-w-[280px] sm:max-w-xs z-20 pointer-events-none transition-all duration-500">
                <div className="bg-pearl-navy/85 backdrop-blur-md border border-pearl-border/80 rounded-2xl p-3 sm:p-4 shadow-2xl text-left">
                  <div className="flex items-center justify-between gap-2 pb-2 border-b border-pearl-border mb-2.5">
                    <span className="text-[10px] font-black uppercase tracking-wider text-pearl-gold flex items-center gap-1">
                      <FileCheck className="w-3.5 h-3.5" /> {isSw ? 'Hati Zinazohitajika Kaunta' : 'Required at Counter'}
                    </span>
                    <span className="text-[10px] font-mono text-pearl-placeholder">
                      {isSw ? `Hatua ya ${currentScene.id}` : `Step ${currentScene.id}`}
                    </span>
                  </div>

                  <div className="space-y-2">
                    {currentScene.onScreenChecklist.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-start gap-2 bg-pearl-navy/90 rounded-xl p-2 border border-pearl-border/80"
                      >
                        <CheckCircle2 className="w-4 h-4 text-pearl-gold shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs font-bold text-pearl-text leading-tight">
                            {item.name}
                          </p>
                          <p className="text-[10px] text-pearl-text-secondary mt-0.5 leading-snug">
                            {item.description}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Officer Speaker Badge (Lower Left) */}
              <div className="absolute bottom-24 sm:bottom-28 left-4 z-20 pointer-events-none">
                <div className="bg-pearl-navy/80 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-pearl-border/40 flex items-center gap-2.5 shadow-xl">
                  <div className="w-7 h-7 rounded-full bg-pearl-danger text-pearl-text flex items-center justify-center font-black text-xs">
                    <Shield className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-pearl-text flex items-center gap-1.5 leading-tight">
                      <span>{currentScene.officerName}</span>
                      <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-pearl-gold text-pearl-navy">
                        {isSw ? 'MWONGOZAJI' : 'HOST'}
                      </span>
                    </p>
                    <p className="text-[10px] text-pearl-text-secondary">
                      {currentScene.locationName}
                    </p>
                  </div>
                </div>
              </div>

              {/* Subtitles Overlay (Synchronized Closed Captions) */}
              {showSubtitles && activeSubtitle && (
                <div className="absolute bottom-16 sm:bottom-20 left-4 right-4 z-30 flex justify-center pointer-events-none">
                  <div className="bg-pearl-navy/90 text-pearl-text px-4 py-2 sm:px-6 sm:py-2.5 rounded-full border border-pearl-gold/40 text-xs sm:text-sm font-semibold max-w-2xl text-center shadow-2xl backdrop-blur-md">
                    <span className="text-pearl-gold font-bold mr-1.5">
                      {currentScene.officerName.split(' ')[1] || 'Officer'}:
                    </span>
                    <span className="text-pearl-text tracking-wide">
                      {activeSubtitle.text}
                    </span>
                  </div>
                </div>
              )}

              {/* Bottom Video Control Bar */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/90 to-transparent pt-8 pb-3 px-4 sm:px-6 z-40">
                {/* Scrubber Timeline with Scene Notches */}
                <div className="relative mb-3 group">
                  <input
                    type="range"
                    min={0}
                    max={TOTAL_VIDEO_DURATION}
                    step={0.1}
                    value={currentTime}
                    onChange={handleScrub}
                    className="w-full h-1.5 bg-pearl-slate rounded-lg appearance-none cursor-pointer accent-pearl-gold hover:h-2.5 transition-all"
                    aria-label="Seek timeline"
                  />

                  {/* Scene Chapter Markers along the timeline */}
                  <div className="absolute top-0 left-0 right-0 h-1.5 pointer-events-none flex justify-between px-0.5">
                    {activeScenes.map((scene) => {
                      const posPct = (scene.startTime / TOTAL_VIDEO_DURATION) * 100;
                      return (
                        <div
                          key={scene.id}
                          style={{ left: `${posPct}%` }}
                          className="absolute w-0.5 h-2.5 bg-white/70 -top-0.5"
                          title={scene.title}
                        />
                      );
                    })}
                  </div>
                </div>

                {/* Controls Row */}
                <div className="flex items-center justify-between gap-2 text-pearl-text">
                  <div className="flex items-center gap-2 sm:gap-3">
                    {/* Play/Pause */}
                    <button
                      type="button"
                      onClick={togglePlay}
                      className="w-9 h-9 rounded-full bg-pearl-gold hover:bg-pearl-gold-light text-pearl-navy flex items-center justify-center transition cursor-pointer"
                      title={isPlaying ? 'Pause' : 'Play'}
                    >
                      {isPlaying ? (
                        <Pause className="w-4 h-4 fill-black" />
                      ) : (
                        <Play className="w-4 h-4 fill-black translate-x-0.5" />
                      )}
                    </button>

                    {/* Rewind 10s */}
                    <button
                      type="button"
                      onClick={() => handleSkip(-10)}
                      className="p-1.5 rounded-lg hover:bg-pearl-text/10 text-pearl-text-secondary hover:text-pearl-text transition"
                      title="Rewind 10 seconds"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>

                    {/* Forward 10s */}
                    <button
                      type="button"
                      onClick={() => handleSkip(10)}
                      className="p-1.5 rounded-lg hover:bg-pearl-text/10 text-pearl-text-secondary hover:text-pearl-text transition"
                      title="Forward 10 seconds"
                    >
                      <SkipForward className="w-4 h-4" />
                    </button>

                    {/* Audio Mute/Unmute */}
                    <button
                      type="button"
                      onClick={() => setIsMuted((m) => !m)}
                      className={`p-1.5 rounded-lg transition ${
                        isMuted ? 'text-pearl-danger-light bg-pearl-danger/10' : 'text-pearl-text-secondary hover:text-pearl-text'
                      }`}
                      title={isMuted ? 'Unmute voiceover narration' : 'Mute voiceover'}
                    >
                      {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                    </button>

                    {/* Timecode */}
                    <div className="text-xs font-mono text-pearl-text-secondary pl-1">
                      <span className="text-pearl-text font-bold">{formatTime(currentTime)}</span>
                      <span className="text-pearl-placeholder"> / {formatTime(TOTAL_VIDEO_DURATION)}</span>
                    </div>
                  </div>

                  {/* Right Controls */}
                  <div className="flex items-center gap-2 sm:gap-3">
                    {/* In-Player Language Toggle */}
                    <button
                      type="button"
                      onClick={() => handleLanguageChange(language === 'sw' ? 'en' : 'sw')}
                      className={`px-2 py-1 rounded-lg text-xs font-bold font-mono transition flex items-center gap-1 ${
                        language === 'sw'
                          ? 'bg-pearl-danger text-pearl-text ring-1 ring-pearl-gold'
                          : 'bg-pearl-gold text-pearl-navy'
                      }`}
                      title={isSw ? 'Badili kwenda Kiingereza' : 'Switch to Swahili'}
                    >
                      <span className="text-[10px]">{language === 'sw' ? 'SW' : 'EN'}</span>
                    </button>

                    {/* Speed Selector */}
                    <div className="flex items-center bg-pearl-text/10 rounded-lg p-0.5 text-[11px] font-mono">
                      {[1.0, 1.25, 1.5].map((speed) => (
                        <button
                          key={speed}
                          type="button"
                          onClick={() => setPlaybackSpeed(speed)}
                          className={`px-2 py-0.5 rounded-md transition ${
                            playbackSpeed === speed
                              ? 'bg-pearl-gold text-pearl-navy font-bold'
                              : 'text-pearl-text-secondary hover:text-pearl-text'
                          }`}
                        >
                          {speed}x
                        </button>
                      ))}
                    </div>

                    {/* Subtitles Toggle */}
                    <button
                      type="button"
                      onClick={() => setShowSubtitles((s) => !s)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition ${
                        showSubtitles
                          ? 'bg-pearl-gold text-pearl-navy'
                          : 'bg-pearl-text/10 text-pearl-text-secondary hover:text-pearl-text'
                      }`}
                      title="Toggle closed captions (Subtitles)"
                    >
                      <Subtitles className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">CC</span>
                    </button>

                    {/* Share & Download Link for All Downloaders */}
                    <button
                      type="button"
                      id="btn-player-share-link"
                      onClick={() => setIsShareModalOpen(true)}
                      className="px-2 py-1 rounded-lg bg-pearl-gold/20 hover:bg-pearl-gold/20 text-pearl-gold-light hover:text-pearl-text transition flex items-center gap-1 cursor-pointer"
                      title={
                        isSw
                          ? 'Shiriki kiungo cha video cha kupakua na programu zote za video downloader'
                          : 'Share video download link for All Video Downloaders, IDM, Snaptube'
                      }
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      <span className="text-[10px] font-bold hidden sm:inline">Share</span>
                    </button>

                    {/* Fullscreen */}
                    <button
                      type="button"
                      onClick={toggleFullscreen}
                      className="p-1.5 rounded-lg hover:bg-pearl-text/10 text-pearl-text-secondary hover:text-pearl-text transition"
                      title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
                    >
                      {isFullscreen ? (
                        <Minimize2 className="w-4 h-4" />
                      ) : (
                        <Maximize2 className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Hidden video element for DOM-based browser video downloader extensions */}
          <video
            className="hidden"
            preload="metadata"
            src="/videos/Malaba_Border_Clearance_4K_Guide.mp4"
            aria-hidden="true"
          />

          {/* Universal Video Downloader Quick Share Bar */}
          <div className="bg-pearl-navy border border-pearl-border rounded-2xl p-3 sm:p-4 shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-pearl-text">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-pearl-danger text-pearl-text flex items-center justify-center shrink-0 shadow-md">
                <Download className="w-5 h-5 text-pearl-gold" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-xs sm:text-sm font-black text-pearl-text">
                    {isSw
                      ? 'Kiungo Rasmi cha Video cha Kupakua (Universal Video Downloader)'
                      : 'Official Video Download Link (All Video Downloaders Ready)'}
                  </p>
                  <span className="px-2 py-0.2 rounded-full text-[9px] font-black uppercase bg-pearl-success/15 text-pearl-success-light border border-pearl-success/30">
                    MP4 4K / 1080p
                  </span>
                </div>
                <p className="text-[11px] text-pearl-placeholder mt-0.5 leading-snug">
                  {isSw
                    ? 'Inafanya kazi na All Video Downloader, IDM, Snaptube, VidMate, VLC, au kivinjari chako cha simu.'
                    : 'Paste into All Video Downloader, IDM, Snaptube, 4K Downloader, VLC, or browser.'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                id="btn-quick-copy-video-link"
                onClick={() => {
                  const directUrl = `${window.location.origin}/videos/Malaba_Border_Clearance_4K_Guide.mp4`;
                  if (navigator.clipboard && navigator.clipboard.writeText) {
                    navigator.clipboard.writeText(directUrl).then(() => {
                      setIsCopiedQuickLink(true);
                      setTimeout(() => setIsCopiedQuickLink(false), 2500);
                      onShowToast(
                        isSw
                          ? 'Kiungo cha video cha MP4 kimenakiliwa! Tayari kwa All Video Downloader na IDM.'
                          : 'Direct video link copied! Ready for All Video Downloader & IDM.'
                      );
                    });
                  } else {
                    onShowToast('Direct video link ready.');
                  }
                }}
                className="flex-1 sm:flex-none px-3.5 py-2 rounded-xl bg-pearl-dark hover:bg-pearl-slate text-pearl-text-secondary border border-pearl-border text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer"
                title="Copy direct MP4 video URL"
              >
                {isCopiedQuickLink ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-pearl-success-light" />
                    <span>{isSw ? 'Imenakiliwa!' : 'Copied!'}</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-pearl-gold-light" />
                    <span>{isSw ? 'Nakili Kiungo' : 'Copy Direct Link'}</span>
                  </>
                )}
              </button>

              <button
                type="button"
                id="btn-open-share-modal-bar"
                onClick={() => setIsShareModalOpen(true)}
                className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-pearl-gold hover:bg-pearl-gold-light text-pearl-navy text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition cursor-pointer shadow-md"
              >
                <Share2 className="w-3.5 h-3.5 text-pearl-navy" />
                <span>{isSw ? 'Chaguo za Kupakua' : 'Share & Downloader Hub'}</span>
              </button>
            </div>
          </div>

          {/* Scene Chapter Selector Bar */}
          <div className="bg-pearl-navy border border-pearl-border rounded-2xl p-3 sm:p-4 shadow-lg">
            <div className="flex items-center justify-between gap-2 mb-3">
              <span className="text-xs font-black uppercase tracking-wider text-pearl-placeholder flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-pearl-gold" /> {isSw ? 'Ruka Kwenye Onyesho la Ukaguzi' : 'Jump to Border Clearance Scene'}
              </span>
              <span className="text-xs text-pearl-placeholder">
                {isSw ? 'Inayocheza:' : 'Active:'} <strong className="text-pearl-text">{isSw ? `Onyesho la ${currentScene.id}` : `Scene ${currentScene.id}`}</strong>
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
              {activeScenes.map((scene) => {
                const isCurrent = scene.id === currentScene.id;
                return (
                  <button
                    key={scene.id}
                    type="button"
                    onClick={() => handleJumpToScene(scene.id)}
                    className={`p-2.5 rounded-xl text-left border transition-all cursor-pointer flex flex-col justify-between ${
                      isCurrent
                        ? 'bg-pearl-gold border-pearl-gold text-pearl-navy shadow-md'
                        : 'bg-pearl-navy/80 border-pearl-border text-pearl-text-secondary hover:border-pearl-border hover:bg-pearl-dark'
                    }`}
                  >
                    <div>
                      <span
                        className={`text-[10px] font-black uppercase tracking-wider block ${
                          isCurrent ? 'text-pearl-navy' : 'text-pearl-placeholder'
                        }`}
                      >
                        {isSw ? `Onyesho ${scene.id}` : `Scene ${scene.id}`}
                      </span>
                      <p
                        className={`text-xs font-bold line-clamp-1 leading-tight mt-0.5 ${
                          isCurrent ? 'text-pearl-navy' : 'text-pearl-text'
                        }`}
                      >
                        {scene.title.split('—')[1]?.trim() || scene.title}
                      </p>
                    </div>

                    <div
                      className={`text-[10px] font-mono mt-2 pt-1 border-t ${
                        isCurrent ? 'border-black/20 text-pearl-navy/80' : 'border-pearl-border text-pearl-placeholder'
                      }`}
                    >
                      {formatTime(scene.startTime)}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active Scene Officer Guidance & Details Card */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Left 2 Cols: Dialogue and Narrative */}
            <div className="lg:col-span-2 bg-pearl-dark rounded-2xl p-5 border border-pearl-border space-y-4">
              <div className="flex items-center justify-between gap-2 pb-3 border-b border-pearl-border">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-pearl-text bg-pearl-surface px-2.5 py-0.5 rounded-md border border-pearl-border inline-block">
                    {currentScene.stationType}
                  </span>
                  <h3 className="text-lg font-bold text-pearl-text font-heading mt-1.5">
                    {currentScene.title}
                  </h3>
                  <p className="text-xs text-pearl-text-secondary flex items-center gap-1.5 mt-0.5">
                    <MapPin className="w-3.5 h-3.5 text-pearl-gold-light" />
                    <span>{isSw ? `Eneo: ${currentScene.locationName}` : `Location: ${currentScene.locationName}`}</span>
                  </p>
                </div>

                <div className="text-right">
                  <span className="text-[10px] font-mono text-pearl-placeholder block">
                    {isSw ? 'Muda' : 'Duration'}
                  </span>
                  <span className="text-xs font-mono font-bold text-pearl-text tabular-nums">
                    {isSw ? `${currentScene.durationSeconds} sekunde` : `${currentScene.durationSeconds} seconds`}
                  </span>
                </div>
              </div>

              {/* Officer Dialogue Quote */}
              <div className="bg-pearl-surface border border-pearl-gold/50 p-4 rounded-xl">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="font-bold text-xs text-pearl-gold-light">
                    {isSw ? `Maneno Rasmi ya Afisa (${currentScene.officerName})` : `Official Dialogue (${currentScene.officerName})`}
                  </span>
                </div>
                <p className="text-sm text-pearl-text leading-relaxed italic">
                  "{currentScene.dialogueScript}"
                </p>
              </div>

              {/* Officer Key Advice Bullet Points */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-pearl-text-secondary mb-2">
                  {isSw ? 'Miongozo Muhimu na Ushauri wa Afisa wa Mpakani' : "Officer's Key Takeaways & Field Advice"}
                </h4>
                <div className="space-y-1.5">
                  {currentScene.officerSummaryPoints.map((point, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-2 text-xs text-pearl-text bg-pearl-surface p-2.5 rounded-xl border border-pearl-border"
                    >
                      <CheckCircle2 className="w-4 h-4 text-pearl-success-light shrink-0 mt-0.5" />
                      <span>{point}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Col: Required Documents Checklist for this specific scene */}
            <div className="bg-pearl-navy text-pearl-text rounded-2xl p-5 border border-pearl-dark flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-pearl-dark mb-4">
                  <div>
                    <h4 className="text-sm font-bold text-pearl-text flex items-center gap-1.5">
                      <FileCheck className="w-4 h-4 text-pearl-gold-light" />
                      <span>{isSw ? 'Hati Zinazohitajika Katika Hatua Hii' : 'Required at this Point'}</span>
                    </h4>
                    <p className="text-[11px] text-pearl-placeholder mt-0.5">
                      {isSw ? `Orodha ya Onyesho la ${currentScene.id}` : `Checklist for Scene ${currentScene.id}`}
                    </p>
                  </div>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-pearl-dark text-pearl-gold-light tabular-nums">
                    {currentScene.onScreenChecklist.length} {isSw ? 'Hati' : 'Items'}
                  </span>
                </div>

                <div className="space-y-2.5">
                  {currentScene.onScreenChecklist.map((item) => (
                    <div
                      key={item.id}
                      className="bg-pearl-dark p-3 rounded-xl border border-pearl-slate text-left"
                    >
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className="text-xs font-bold text-pearl-text">
                          {item.name}
                        </span>
                        <span
                          className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${
                            item.category === 'mandatory'
                              ? 'bg-pearl-danger/20 text-pearl-danger-light border border-pearl-danger/40'
                              : item.category === 'conditional'
                              ? 'bg-pearl-gold/20 text-pearl-gold-light border border-pearl-gold/40'
                              : 'bg-pearl-success/25 text-pearl-success-light border border-pearl-success/50'
                          }`}
                        >
                          {item.category}
                        </span>
                      </div>
                      <p className="text-[11px] text-pearl-text-secondary leading-snug">
                        {item.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Pearl Travel Connection Card */}
              <div className="mt-4 pt-4 border-t border-pearl-dark">
                <div className="bg-pearl-dark p-3 rounded-xl border border-pearl-gold/35 flex items-center justify-between gap-2">
                  <div>
                    <p className="text-xs font-bold text-pearl-text">
                      {isSw ? 'Sawazisha na Programu ya Pearl Travel' : 'Sync to Pearl Travel Checklist'}
                    </p>
                    <p className="text-[10px] text-pearl-placeholder">
                      {isSw ? 'Hamisha mahitaji haya moja kwa moja kwenye orodha yako ya safari' : 'Transfer these requirements to your portal'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      onShowToast(
                        isSw
                          ? `Mahitaji yote ${currentScene.onScreenChecklist.length} ya nyaraka yamesawazishwa na tovuti yako ya Pearl Travel!`
                          : `All ${currentScene.onScreenChecklist.length} document requirements synchronized with your Pearl Travel portal!`
                      );
                    }}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold bg-pearl-gold hover:bg-pearl-gold-light text-pearl-text transition-colors shrink-0 cursor-pointer whitespace-nowrap"
                  >
                    {isSw ? 'Sawazisha Sasa' : 'Sync Now'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Terminal Walking Map Tab */}
      {activeTab === 'map' && (
        <MalabaBorderMap
          currentSceneId={currentScene.id}
          onSelectScene={handleJumpToScene}
          language={language}
        />
      )}

      {/* Full Transcript Tab */}
      {activeTab === 'transcript' && (
        <div className="bg-pearl-dark rounded-2xl p-6 border border-pearl-border space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-pearl-border">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-pearl-gold-light bg-pearl-gold/10 px-2.5 py-0.5 rounded-md border border-pearl-gold/40 inline-block">
                {isSw ? 'Nakala Kamili ya Maneno' : 'Verbatim Script'}
              </span>
              <h3 className="text-xl font-bold text-pearl-text font-heading mt-1.5">
                {isSw
                  ? 'Nakala Rasmi ya Mwongozo wa Ukaguzi wa Abiria - Malaba OSBP'
                  : 'Official Malaba OSBP Passenger Orientation Transcript'}
              </h3>
              <p className="text-xs text-pearl-text-secondary mt-0.5">
                {isSw
                  ? 'Nakala ya simulizi ya sauti kutoka kwa Mkaguzi David Okello (Idara ya Uhamiaji ya Uganda)'
                  : 'Official audio narration transcript by Inspector David Okello'}
              </p>
            </div>

            <button
              type="button"
              onClick={handleDownloadTranscript}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-pearl-navy text-pearl-text hover:bg-pearl-dark transition-colors flex items-center gap-2 self-start sm:self-auto cursor-pointer whitespace-nowrap shrink-0"
            >
              <Download className="w-3.5 h-3.5 text-pearl-gold-light" />
              <span>{isSw ? 'Pakua Nakala Rasmi' : 'Download Official Text'}</span>
            </button>
          </div>

          <div className="space-y-4">
            {activeScenes.map((scene) => (
              <div
                key={scene.id}
                className="bg-pearl-surface rounded-xl p-4 sm:p-5 border border-pearl-border space-y-3"
              >
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-md text-xs font-bold bg-pearl-navy text-pearl-gold-light">
                      {isSw ? `Onyesho ${scene.id}` : `Scene ${scene.id}`}
                    </span>
                    <h4 className="text-sm font-bold text-pearl-text">
                      {scene.title.split('—')[1]?.trim() || scene.title}
                    </h4>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-mono text-pearl-text-secondary tabular-nums">
                    <Clock className="w-3.5 h-3.5 text-pearl-placeholder" />
                    <span>
                      {formatTime(scene.startTime)} - {formatTime(scene.endTime)}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        handleJumpToScene(scene.id);
                        setActiveTab('video');
                      }}
                      className="px-2.5 py-1 rounded-md bg-pearl-gold text-pearl-text font-sans font-bold hover:bg-pearl-gold-light transition-colors text-[11px] cursor-pointer"
                    >
                      {isSw ? 'Cheza Onyesho' : 'Play Scene'}
                    </button>
                  </div>
                </div>

                <div className="bg-pearl-input p-3.5 rounded-xl border border-pearl-border text-sm text-pearl-text leading-relaxed">
                  <strong className="text-pearl-text block font-semibold text-xs mb-1">
                    {scene.officerName} ({scene.officerRole}):
                  </strong>
                  "{scene.dialogueScript}"
                </div>

                {/* Checklist Summary in Transcript */}
                <div className="pt-1">
                  <p className="text-[11px] font-bold text-pearl-text-secondary uppercase tracking-wider mb-1.5">
                    {isSw ? 'Hati Zinazoonekana Skrini:' : 'On-Screen Checklist Requirements:'}
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {scene.onScreenChecklist.map((item) => (
                      <div
                        key={item.id}
                        className="text-xs bg-pearl-input p-2.5 rounded-lg border border-pearl-border flex items-start gap-1.5"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-pearl-success-light shrink-0 mt-0.5" />
                        <div>
                          <span className="font-bold text-pearl-text">{item.name}</span>
                          <p className="text-[11px] text-pearl-text-secondary">{item.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Official Border Authorities Disclaimer */}
          <div className="bg-pearl-surface rounded-xl p-4 border border-pearl-gold/50 text-xs text-pearl-text flex items-start gap-3">
            <Info className="w-5 h-5 text-pearl-gold-light shrink-0 mt-0.5" />
            <div>
              <strong className="block font-bold text-pearl-gold-light mb-1">
                {isSw ? 'Ilani Rasmi ya Kituo cha Mpaka' : 'Official Border Post Information Notice'}
              </strong>
              {isSw
                ? 'Video hii ya mwongozo imetolewa kwa ajili ya kuwapa wasafiri uelewa na maandalizi kabla ya kufika kwenye mipaka ya nchi kavu ya Uganda. Sheria rasmi za uhamiaji, aina za viza za kielektroniki, na tathmini ya forodha zinasimamiwa na Idara ya Uhamiaji ya Uganda (DCIC) chini ya Wizara ya Mambo ya Ndani, na Mamlaka ya Mapato Uganda (URA). Fuata daima maelekezo ya maafisa waliopo kwenye sare rasmi.'
                : 'This video demonstration is produced for public passenger awareness and pre-arrival orientation at Ugandan land borders. Official immigration laws, eVisa approvals, customs tariffs, and entry clearance decisions remain under the statutory jurisdiction of the Directorate of Citizenship and Immigration Control (DCIC) under the Ministry of Internal Affairs, and the Uganda Revenue Authority (URA). Always comply promptly with official instructions from uniformed border officers.'}
            </div>
          </div>
        </div>
      )}

      {/* Universal Video Downloader & Share Modal */}
      <ShareVideoDownloadModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        language={language}
        onShowToast={onShowToast}
      />
    </div>
  );
};
