// Web Audio & Speech Synthesis Engine for Malaba Border Video Guide
// Works 100% offline using standard browser APIs without external audio file dependencies.

class BorderAudioEngine {
  private ctx: AudioContext | null = null;
  private ambientGain: GainNode | null = null;
  private isAmbientPlaying: boolean = false;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private isVoiceoverMuted: boolean = false;
  private volume: number = 0.8;
  private speechRate: number = 1.0;

  private initAudioContext() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  // Play an official border notification chime
  public playChime() {
    try {
      this.initAudioContext();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, now); // D5
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.15); // A5
      osc.frequency.exponentialRampToValueAtTime(1174.66, now + 0.35); // D6

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.2 * this.volume, now + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.9);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.95);
    } catch (e) {
      console.warn('Audio chime notice:', e);
    }
  }

  // Play official passport stamp thud
  public playStampSound() {
    try {
      this.initAudioContext();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;

      // Deep thump
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(140, now);
      osc.frequency.exponentialRampToValueAtTime(35, now + 0.15);

      gain.gain.setValueAtTime(0.35 * this.volume, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.22);

      // Higher click/paper snap
      const snapOsc = this.ctx.createOscillator();
      const snapGain = this.ctx.createGain();
      snapOsc.type = 'square';
      snapOsc.frequency.setValueAtTime(800, now);
      snapOsc.frequency.exponentialRampToValueAtTime(120, now + 0.06);

      snapGain.gain.setValueAtTime(0.15 * this.volume, now);
      snapGain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);

      snapOsc.connect(snapGain);
      snapGain.connect(this.ctx.destination);
      snapOsc.start(now);
      snapOsc.stop(now + 0.08);
    } catch (e) {
      console.warn('Stamp sound notice:', e);
    }
  }

  // Toggle ambient border post hall atmosphere (gentle warm terminal sound)
  public startAmbientAtmosphere() {
    if (this.isAmbientPlaying) return;
    try {
      this.initAudioContext();
      if (!this.ctx) return;

      const bufferSize = this.ctx.sampleRate * 2;
      const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.0168980;
        output[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
        output[i] *= 0.015; // very low level
        b6 = white * 0.115926;
      }

      const whiteNoise = this.ctx.createBufferSource();
      whiteNoise.buffer = noiseBuffer;
      whiteNoise.loop = true;

      // Low pass filter for warm terminal background
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(320, this.ctx.currentTime);

      this.ambientGain = this.ctx.createGain();
      this.ambientGain.gain.setValueAtTime(0.02 * this.volume, this.ctx.currentTime);

      whiteNoise.connect(filter);
      filter.connect(this.ambientGain);
      this.ambientGain.connect(this.ctx.destination);

      whiteNoise.start();
      this.isAmbientPlaying = true;
    } catch (e) {
      console.warn('Ambient start notice:', e);
    }
  }

  public stopAmbientAtmosphere() {
    if (this.ambientGain && this.ctx) {
      try {
        this.ambientGain.gain.linearRampToValueAtTime(0.0001, this.ctx.currentTime + 0.5);
      } catch {
        // ignore
      }
    }
    this.isAmbientPlaying = false;
  }

  // Voiceover narration using Web Speech Synthesis
  public speakScript(
    text: string,
    onEnd?: () => void,
    onError?: () => void,
    lang: 'en' | 'sw' = 'en'
  ) {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      return;
    }

    this.stopVoiceover();

    if (this.isVoiceoverMuted) return;

    try {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.pitch = 0.95; // slightly deeper, authoritative yet friendly officer voice
      utterance.volume = this.volume;

      // Select matching voice based on selected language
      const voices = window.speechSynthesis.getVoices();
      if (lang === 'sw') {
        const swVoice = voices.find((v) =>
          v.lang.startsWith('sw') || v.lang.includes('sw-') || v.lang.includes('swa')
        );
        if (swVoice) {
          utterance.voice = swVoice;
          utterance.lang = swVoice.lang;
        } else {
          // Fallback to regional voice with clear pronunciation rate
          const regionalVoice = voices.find((v) => v.lang === 'en-KE' || v.lang === 'en-ZA' || v.lang.startsWith('en'));
          if (regionalVoice) utterance.voice = regionalVoice;
          utterance.lang = 'sw-TZ';
        }
        utterance.rate = Math.min(this.speechRate * 0.95, 1.25);
      } else {
        const englishVoice =
          voices.find((v) => v.lang === 'en-GB' || v.lang === 'en-ZA' || v.lang === 'en-KE' || v.lang.startsWith('en')) ||
          voices[0];

        if (englishVoice) {
          utterance.voice = englishVoice;
          utterance.lang = englishVoice.lang || 'en-GB';
        }
        utterance.rate = this.speechRate;
      }

      utterance.onend = () => {
        this.currentUtterance = null;
        if (onEnd) onEnd();
      };

      utterance.onerror = (e) => {
        // 'interrupted' is normal when user scrubs or skips
        if (e.error !== 'interrupted') {
          console.warn('Speech synthesis note:', e.error);
        }
        this.currentUtterance = null;
        if (onError) onError();
      };

      this.currentUtterance = utterance;
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn('Speech synthesis execution note:', e);
    }
  }

  public stopVoiceover() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        // ignore
      }
      this.currentUtterance = null;
    }
  }

  public pauseVoiceover() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.pause();
      } catch {
        // ignore
      }
    }
  }

  public resumeVoiceover() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.resume();
      } catch {
        // ignore
      }
    }
  }

  public setMuted(muted: boolean) {
    this.isVoiceoverMuted = muted;
    if (muted) {
      this.stopVoiceover();
      this.stopAmbientAtmosphere();
    }
  }

  public setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol));
    if (this.ambientGain && this.ctx) {
      this.ambientGain.gain.setValueAtTime(0.02 * this.volume, this.ctx.currentTime);
    }
  }

  public setSpeed(rate: number) {
    this.speechRate = rate;
  }
}

export const borderAudioEngine = new BorderAudioEngine();
