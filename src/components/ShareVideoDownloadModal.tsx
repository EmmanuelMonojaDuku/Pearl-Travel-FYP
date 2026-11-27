import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Download,
  Share2,
  Copy,
  Check,
  ExternalLink,
  X,
  Sparkles,
  Smartphone,
  Monitor,
  Terminal,
  Globe,
  Film,
  FileText,
  Volume2,
  ShieldCheck,
  CheckCircle2,
  Tv,
  ArrowRight,
  HelpCircle,
  MessageCircle,
  Mail,
  Send,
  Twitter,
} from 'lucide-react';
import { PearlTravelLogo } from './PearlTravelLogo';

interface ShareVideoDownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
  language?: 'en' | 'sw';
  onShowToast: (msg: string) => void;
}

export const ShareVideoDownloadModal: React.FC<ShareVideoDownloadModalProps> = ({
  isOpen,
  onClose,
  language = 'en',
  onShowToast,
}) => {
  const [selectedFormat, setSelectedFormat] = useState<'4k' | '1080p' | 'swahili' | 'audio'>('4k');
  const [selectedDownloaderTab, setSelectedDownloaderTab] = useState<'mobile' | 'desktop' | 'vlc' | 'browser' | 'cli'>('mobile');
  const [copiedFormat, setCopiedFormat] = useState<string | null>(null);
  const [copiedCommand, setCopiedCommand] = useState<string | null>(null);

  if (!isOpen) return null;

  // Base URL resolution
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://pearltravel.ug';

  // Video resource definitions
  const videoLinks = {
    '4k': {
      title: 'Malaba OSBP Border Clearance Guide (English 4K UHD)',
      filename: 'Malaba_Border_Clearance_4K_Guide.mp4',
      url: `${origin}/videos/Malaba_Border_Clearance_4K_Guide.mp4`,
      resolution: '4K UHD / 1080p (2160p Master)',
      format: 'MP4 (H.264 High 4.1 / AAC Stereo / VLC Verified)',
      size: '7.2 MB • 1:1 SAR • FastStart',
      languageLabel: 'English',
      suitableFor: 'VLC Media Player (Desktop/Mobile), All Video Downloaders, IDM, 4K Downloader, TV',
    },
    'swahili': {
      title: 'Mwongozo wa Ukaguzi wa Mpaka wa Malaba (Kiswahili 4K UHD)',
      filename: 'Malaba_Border_Clearance_Swahili_4K.mp4',
      url: `${origin}/videos/Malaba_Border_Clearance_Swahili_4K.mp4`,
      resolution: '4K UHD / 1080p',
      format: 'MP4 (H.264 High 4.1 / AAC Stereo / VLC Verified)',
      size: '7.2 MB • 1:1 SAR • FastStart',
      languageLabel: 'Kiswahili (EAC Official)',
      suitableFor: 'VLC Media Player, All Video Downloaders, IDM, Snaptube, TubeMate',
    },
    '1080p': {
      title: 'Malaba Border Walkthrough (Full HD Mobile Data Saver)',
      filename: 'Malaba_Border_Clearance_1080p.mp4',
      url: `${origin}/videos/Malaba_Border_Clearance_1080p.mp4`,
      resolution: 'Full HD 1080p',
      format: 'MP4 (Mobile & VLC Optimized H.264)',
      size: '7.2 MB • Universal H.264',
      languageLabel: 'English & Swahili',
      suitableFor: 'VLC, Mobile Video Downloaders, WhatsApp sharing, Quick downloads',
    },
    'audio': {
      title: 'Officer Okello Audio Guide & Narration (MP3)',
      filename: 'Malaba_OSBP_Inspector_Okello_Audio_Narration.mp3',
      url: `${origin}/videos/Malaba_OSBP_Inspector_Okello_Audio_Narration.mp3`,
      resolution: '192kbps Audio',
      format: 'MP3 Stereo (VLC & Radio Compatible)',
      size: '986 KB • Lightweight',
      languageLabel: 'Inspector Voiceover Track',
      suitableFor: 'VLC, Podcast players, Car audio systems, Low-bandwidth border areas',
    },
  };

  const currentItem = videoLinks[selectedFormat];
  const sharePageUrl = `${origin}/?tab=multimedia&lang=${selectedFormat === 'swahili' ? 'sw' : 'en'}`;

  const copyToClipboard = (text: string, formatKey: string, toastMsg: string) => {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => {
        setCopiedFormat(formatKey);
        setTimeout(() => setCopiedFormat(null), 2500);
        onShowToast(toastMsg);
      }).catch(() => {
        // Fallback
        fallbackCopyTextToClipboard(text);
        setCopiedFormat(formatKey);
        setTimeout(() => setCopiedFormat(null), 2500);
        onShowToast(toastMsg);
      });
    } else {
      fallbackCopyTextToClipboard(text);
      setCopiedFormat(formatKey);
      setTimeout(() => setCopiedFormat(null), 2500);
      onShowToast(toastMsg);
    }
  };

  const fallbackCopyTextToClipboard = (text: string) => {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
      document.execCommand('copy');
    } catch (e) {
      console.warn('Fallback copy failed', e);
    }
    document.body.removeChild(textArea);
  };

  // Native share handler
  const handleNativeShare = async () => {
    const shareData = {
      title: 'Uganda Land Border Passenger Clearance Walkthrough - Malaba OSBP 4K',
      text: `Watch and download the official 4K passenger clearance orientation video for Malaba One-Stop Border Post (Uganda - Kenya border):\n${currentItem.url}`,
      url: currentItem.url,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
        onShowToast('Shared successfully!');
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          copyToClipboard(currentItem.url, 'native', 'Video download link copied to clipboard!');
        }
      }
    } else {
      copyToClipboard(currentItem.url, 'native', 'Video download link copied to clipboard!');
    }
  };

  // Direct trigger download in browser
  const handleDirectDownload = (url: string, filename: string) => {
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    onShowToast(`Downloading ${filename}...`);
  };

  // Download Subtitles (.SRT file)
  const handleDownloadSRT = (lang: 'en' | 'sw') => {
    const filename = `Malaba_OSBP_Subtitles_${lang.toUpperCase()}.srt`;
    const a = document.createElement('a');
    a.href = `/videos/${filename}`;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    onShowToast(`Subtitles (.srt) in ${lang === 'sw' ? 'Kiswahili' : 'English'} downloaded!`);
  };

  const shareText = encodeURIComponent(
    `Official Malaba OSBP 4K Border Walkthrough Video & Download Link: ${currentItem.url}`
  );

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-pearl-scrim/75 backdrop-blur-md flex items-center justify-center p-3 sm:p-5">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ duration: 0.2 }}
        className="w-full max-w-3xl bg-pearl-dark rounded-3xl shadow-2xl border border-pearl-border overflow-hidden text-pearl-text my-4 flex flex-col max-h-[92vh]"
      >
        {/* National Flag Header Strip */}
        <div className="h-2 w-full flex">
          <div className="flex-1 bg-black" />
          <div className="flex-1 bg-[#FCD116]" />
          <div className="flex-1 bg-[#D21034]" />
        </div>

        {/* Modal Top Bar */}
        <div className="px-5 sm:px-7 py-4 border-b border-pearl-border flex items-center justify-between bg-pearl-navy text-pearl-text shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-pearl-danger text-pearl-text flex items-center justify-center shadow-md shrink-0">
              <Download className="w-5 h-5 text-pearl-accent" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-pearl-accent">
                  Universal Video Downloader Hub
                </span>
                <span className="text-[9px] font-bold px-2 py-0.2 rounded-full bg-pearl-success/15 text-pearl-success-light border border-pearl-success/30">
                  Universal MP4
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-black text-pearl-text font-heading">
                Share Video Download Link
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-pearl-dark hover:bg-pearl-surface text-pearl-text-secondary hover:text-pearl-text flex items-center justify-center transition cursor-pointer"
            title="Close dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-5 sm:p-7 space-y-6 overflow-y-auto">
          {/* Format / Version Selector */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-pearl-placeholder block mb-2.5">
              Select Video Version or Audio Stream:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {[
                { id: '4k' as const, label: 'English 4K UHD', sub: 'Master 2160p MP4', icon: Film, badge: 'Popular' },
                { id: 'swahili' as const, label: 'Kiswahili 4K UHD', sub: 'EAC Official MP4', icon: Tv, badge: 'EAC' },
                { id: '1080p' as const, label: 'Full HD (1080p)', sub: 'Mobile Optimized', icon: Smartphone, badge: 'Fast' },
                { id: 'audio' as const, label: 'Audio Narration', sub: 'Voiceover MP3', icon: Volume2, badge: 'Low Data' },
              ].map((item) => {
                const isSel = selectedFormat === item.id;
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSelectedFormat(item.id)}
                    className={`p-3 rounded-2xl text-left border transition-all cursor-pointer relative flex flex-col justify-between ${
                      isSel
                        ? 'bg-pearl-gold/15 text-pearl-text border-pearl-gold ring-1 ring-pearl-gold'
                        : 'bg-pearl-surface hover:bg-pearl-surface text-pearl-text-secondary border-pearl-border'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <Icon className={`w-4 h-4 ${isSel ? 'text-pearl-accent' : 'text-pearl-placeholder'}`} />
                        <span className={`text-[9px] font-black uppercase px-1.5 py-0.2 rounded ${
                          isSel ? 'bg-pearl-gold text-pearl-navy' : 'bg-pearl-surface text-pearl-text-secondary'
                        }`}>
                          {item.badge}
                        </span>
                      </div>
                      <p className="text-xs font-black leading-tight">{item.label}</p>
                    </div>
                    <p className={`text-[10px] mt-2 ${isSel ? 'text-pearl-text-secondary' : 'text-pearl-placeholder'}`}>
                      {item.sub}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Primary Action Box: Direct Video URL for Downloaders */}
          <div className="bg-pearl-surface rounded-2xl p-4 sm:p-5 text-pearl-text border border-pearl-border shadow-lg space-y-4">
            <div className="flex items-start sm:items-center justify-between gap-3 flex-wrap">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-pearl-accent flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-pearl-success-light" />
                  Direct Download Link (Works with ALL Video Downloaders)
                </span>
                <h4 className="text-sm font-bold text-pearl-text mt-0.5">
                  {currentItem.title}
                </h4>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-pearl-dark text-pearl-text-secondary border border-pearl-border">
                  {currentItem.format}
                </span>
              </div>
            </div>

            {/* Direct URL input bar with copy & download buttons */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 bg-pearl-surface p-1.5 rounded-xl border border-pearl-border">
                <input
                  type="text"
                  readOnly
                  value={currentItem.url}
                  className="w-full bg-transparent text-xs font-mono text-pearl-accent px-2 py-1 outline-hidden select-all"
                  onClick={(e) => (e.target as HTMLInputElement).select()}
                />
                <button
                  type="button"
                  id="btn-copy-direct-video-url"
                  onClick={() =>
                    copyToClipboard(
                      currentItem.url,
                      'direct-url',
                      'Direct Video Link copied! Paste into All Video Downloader, IDM, or browser.'
                    )
                  }
                  className="px-3.5 py-2 rounded-lg bg-pearl-gold hover:bg-pearl-gold-light text-pearl-navy text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shrink-0 transition cursor-pointer shadow-xs"
                >
                  {copiedFormat === 'direct-url' ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-pearl-navy" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Link</span>
                    </>
                  )}
                </button>
              </div>

              <p className="text-[11px] text-pearl-placeholder flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-pearl-success-light shrink-0" />
                <span>
                  Paste this link into <strong>All Video Downloader</strong>, <strong>Internet Download Manager (IDM)</strong>, <strong>Snaptube</strong>, <strong>VidMate</strong>, or <strong>4K Video Downloader</strong>.
                </span>
              </p>
            </div>

            {/* Direct Action Buttons Row */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 pt-2 border-t border-pearl-border">
              <button
                type="button"
                id="btn-download-video-file-now"
                onClick={() => handleDirectDownload(currentItem.url, currentItem.filename)}
                className="flex-1 py-2.5 px-4 rounded-xl bg-pearl-danger hover:bg-pearl-danger text-pearl-text text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition cursor-pointer shadow-md"
              >
                <Download className="w-4 h-4 text-pearl-accent" />
                <span>Download Video File (.mp4)</span>
              </button>

              <button
                type="button"
                id="btn-native-share-video"
                onClick={handleNativeShare}
                className="py-2.5 px-4 rounded-xl bg-pearl-dark hover:bg-pearl-surface text-pearl-text text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer border border-pearl-border"
              >
                <Share2 className="w-4 h-4 text-pearl-accent" />
                <span>Share via Device</span>
              </button>
            </div>
          </div>

          {/* Social Share Shortcuts (WhatsApp, Telegram, Twitter, Email) */}
          <div className="bg-pearl-surface rounded-2xl p-4 border border-pearl-border">
            <label className="text-xs font-bold uppercase tracking-wider text-pearl-text-secondary block mb-2.5">
              Share Download Link Directly to Friends & Colleagues:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {/* WhatsApp */}
              <a
                href={`https://api.whatsapp.com/send?text=${shareText}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-pearl-gold hover:bg-pearl-gold-light text-pearl-text text-xs font-bold transition shadow-xs"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>WhatsApp</span>
              </a>

              {/* Telegram */}
              <a
                href={`https://t.me/share/url?url=${encodeURIComponent(currentItem.url)}&text=${encodeURIComponent('Official Uganda Malaba OSBP 4K Border Walkthrough Video')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-pearl-gold hover:bg-pearl-surface text-pearl-text text-xs font-bold transition shadow-xs"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Telegram</span>
              </a>

              {/* X / Twitter */}
              <a
                href={`https://twitter.com/intent/tweet?text=${shareText}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-pearl-navy hover:bg-pearl-surface text-pearl-text text-xs font-bold transition shadow-xs"
              >
                <Twitter className="w-3.5 h-3.5" />
                <span>X / Twitter</span>
              </a>

              {/* Email */}
              <a
                href={`mailto:?subject=${encodeURIComponent('Uganda Malaba OSBP Border Clearance Video Download Link')}&body=${shareText}`}
                className="flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-pearl-slate hover:bg-pearl-dark text-pearl-text text-xs font-bold transition shadow-xs"
              >
                <Mail className="w-3.5 h-3.5" />
                <span>Email</span>
              </a>
            </div>
          </div>

          {/* Detailed Instructions for "All Video Downloaders" */}
          <div className="border border-pearl-border rounded-2xl p-4 sm:p-5 bg-pearl-dark space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-pearl-border flex-wrap gap-2">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-pearl-danger-light block">
                  Downloader Instructions
                </span>
                <h4 className="text-sm font-black text-pearl-text">
                  How to Download with Any Video Downloader
                </h4>
              </div>

              {/* Downloader category tabs */}
              <div className="flex items-center bg-pearl-surface p-1 rounded-xl text-xs font-bold flex-wrap gap-1">
                {[
                  { id: 'mobile' as const, label: 'Mobile Apps', icon: Smartphone },
                  { id: 'desktop' as const, label: 'PC / IDM', icon: Monitor },
                  { id: 'vlc' as const, label: 'VLC Player', icon: Tv },
                  { id: 'browser' as const, label: 'Browser Ext', icon: Globe },
                  { id: 'cli' as const, label: 'yt-dlp / curl', icon: Terminal },
                ].map((tab) => {
                  const isTab = selectedDownloaderTab === tab.id;
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setSelectedDownloaderTab(tab.id)}
                      className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 cursor-pointer ${
                        isTab ? 'bg-pearl-dark text-pearl-navy shadow-xs ring-1 ring-black/10' : 'text-pearl-text-secondary hover:text-pearl-navy'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Tab 1: Mobile Video Downloaders (All Video Downloader, Snaptube, etc.) */}
            {selectedDownloaderTab === 'mobile' && (
              <div className="space-y-3 text-xs text-pearl-text-secondary">
                <p className="font-semibold text-pearl-text">
                  Works with <strong>All Video Downloader</strong>, <strong>Snaptube</strong>, <strong>VidMate</strong>, <strong>1DM</strong>, and <strong>Documents by Readdle</strong> on iOS/Android:
                </p>
                <ol className="list-decimal pl-5 space-y-1.5 leading-relaxed">
                  <li>
                    Click the <strong>"Copy Link"</strong> button above to copy the direct MP4 stream URL.
                  </li>
                  <li>
                    Open your <strong>All Video Downloader</strong> app on your Android or iPhone.
                  </li>
                  <li>
                    Paste the copied URL into the app's address or download search bar.
                  </li>
                  <li>
                    Tap the red or blue <strong>"Download"</strong> arrow that appears. Select 1080p or 4K resolution.
                  </li>
                  <li>
                    The video will save directly to your phone's Gallery or Downloads folder for offline viewing at the border!
                  </li>
                </ol>
              </div>
            )}

            {/* Tab 2: Desktop Download Managers (IDM, JDownloader, FDM) */}
            {selectedDownloaderTab === 'desktop' && (
              <div className="space-y-3 text-xs text-pearl-text-secondary">
                <p className="font-semibold text-pearl-text">
                  Works with <strong>Internet Download Manager (IDM)</strong>, <strong>JDownloader 2</strong>, and <strong>Free Download Manager (FDM)</strong>:
                </p>
                <ol className="list-decimal pl-5 space-y-1.5 leading-relaxed">
                  <li>
                    Copy the direct link using the <strong>"Copy Link"</strong> button.
                  </li>
                  <li>
                    Open <strong>Internet Download Manager (IDM)</strong> and click <strong>"Add URL"</strong> in the top toolbar.
                  </li>
                  <li>
                    IDM will automatically detect the clipboard URL and query the video size and file name.
                  </li>
                  <li>
                    Click <strong>"Start Download"</strong> to download with full multi-connection acceleration.
                  </li>
                </ol>
              </div>
            )}

            {/* Tab: VLC Media Player & Offline Playback */}
            {selectedDownloaderTab === 'vlc' && (
              <div className="space-y-3 text-xs text-pearl-text-secondary">
                <div className="p-3 bg-pearl-success/15 rounded-xl border border-pearl-success/30 text-pearl-success-light font-medium">
                  <strong>Universal VLC Compatibility Verified:</strong> This video is encoded with standard H.264 High Profile (Level 4.1), 1:1 square pixel aspect ratio, 48kHz stereo AAC audio, and FastStart moov atom headers. 100% verified to play smoothly on VLC Desktop (Windows, Mac, Linux), Android VLC, and iOS VLC.
                </div>
                <p className="font-semibold text-pearl-text">
                  How to Play Downloaded Video or Stream Directly in VLC:
                </p>
                <ol className="list-decimal pl-5 space-y-1.5 leading-relaxed">
                  <li>
                    <strong>Playing Downloaded File:</strong> Click <em>"Download Video File (.mp4)"</em> above. Once the download finishes, right-click the MP4 file in your folder and choose <em>"Open with &gt; VLC media player"</em> (or tap the file in VLC on your mobile phone).
                  </li>
                  <li>
                    <strong>Direct Network Streaming (No Download Needed):</strong> Click <em>"Copy Link"</em> above. In VLC, go to <em>Media &gt; Open Network Stream...</em> (or press <em>Ctrl+N / Cmd+N</em>), paste the video URL, and click <em>Play</em>.
                  </li>
                  <li>
                    <strong>Loading Subtitles in VLC:</strong> Click <em>"English .SRT"</em> or <em>"Kiswahili .SRT"</em> below to download subtitles. In VLC while the video is playing, go to <em>Subtitle &gt; Add Subtitle File...</em> and select the downloaded .srt file.
                  </li>
                </ol>
              </div>
            )}

            {/* Tab 3: Browser Extensions (Video DownloadHelper, etc.) */}
            {selectedDownloaderTab === 'browser' && (
              <div className="space-y-3 text-xs text-pearl-text-secondary">
                <p className="font-semibold text-pearl-text">
                  Works with Chrome / Edge / Firefox extensions (e.g. <strong>Video DownloadHelper</strong>, <strong>Video Downloader PLUS</strong>):
                </p>
                <ol className="list-decimal pl-5 space-y-1.5 leading-relaxed">
                  <li>
                    When viewing this video in the Multimedia tab, browser extensions will automatically detect the HTML5 video stream.
                  </li>
                  <li>
                    Click your extension icon in the browser toolbar and click <strong>Download MP4</strong>.
                  </li>
                  <li>
                    Alternatively, paste the direct link in a new tab, right-click the video, and choose <strong>"Save Video As..."</strong>.
                  </li>
                </ol>
              </div>
            )}

            {/* Tab 4: Command Line Tools (yt-dlp, cURL, Wget) */}
            {selectedDownloaderTab === 'cli' && (
              <div className="space-y-3 text-xs text-pearl-text-secondary">
                <p className="font-semibold text-pearl-text">
                  Instant command-line snippets for developers and power users:
                </p>
                <div className="space-y-2">
                  {[
                    { tool: 'curl', cmd: `curl -O "${currentItem.url}"` },
                    { tool: 'wget', cmd: `wget "${currentItem.url}"` },
                    { tool: 'yt-dlp', cmd: `yt-dlp "${currentItem.url}"` },
                  ].map((c) => (
                    <div key={c.tool} className="flex items-center justify-between gap-2 bg-pearl-surface text-pearl-text-secondary px-3 py-2 rounded-xl font-mono text-[11px]">
                      <span className="truncate">{c.cmd}</span>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(c.cmd, `cli-${c.tool}`, `Copied ${c.tool} command!`)}
                        className="p-1 rounded hover:bg-pearl-surface text-pearl-accent shrink-0 cursor-pointer"
                        title="Copy command"
                      >
                        {copiedFormat === `cli-${c.tool}` ? <Check className="w-3.5 h-3.5 text-pearl-success-light" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Subtitles & Transcripts Download Section */}
          <div className="bg-pearl-surface rounded-2xl p-4 border border-pearl-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold text-pearl-text flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-pearl-danger-light" />
                <span>Closed Captions & Subtitles (.SRT / .VTT)</span>
              </p>
              <p className="text-[11px] text-pearl-placeholder mt-0.5">
                Import into VLC, MX Player, or any video downloader to display synchronized subtitles offline.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleDownloadSRT('en')}
                className="px-3 py-1.5 bg-pearl-dark border border-pearl-border hover:border-black rounded-lg text-xs font-bold text-pearl-text transition cursor-pointer flex items-center gap-1 shadow-2xs"
              >
                <Download className="w-3 h-3 text-pearl-danger-light" />
                <span>English .SRT</span>
              </button>
              <button
                type="button"
                onClick={() => handleDownloadSRT('sw')}
                className="px-3 py-1.5 bg-pearl-dark border border-pearl-border hover:border-black rounded-lg text-xs font-bold text-pearl-text transition cursor-pointer flex items-center gap-1 shadow-2xs"
              >
                <Download className="w-3 h-3 text-pearl-accent" />
                <span>Kiswahili .SRT</span>
              </button>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-5 sm:px-7 py-3.5 bg-pearl-surface border-t border-pearl-border flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <PearlTravelLogo size="sm" variant="transparent" />
            <span className="text-[11px] text-pearl-placeholder hidden sm:inline">
              Pearl Travel • Grounded Border Information System
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-full bg-pearl-navy hover:bg-pearl-surface text-pearl-text text-xs font-bold transition cursor-pointer"
          >
            Done
          </button>
        </div>
      </motion.div>
    </div>
  );
};
