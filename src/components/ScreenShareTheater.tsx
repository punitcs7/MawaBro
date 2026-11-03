import React, { useState, useRef, useEffect } from 'react';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  Camera,
  Check,
  Expand,
  Shrink,
  Activity,
  Tv,
  X,
  Monitor,
  Eye,
  EyeOff,
  AlertTriangle,
  Radio,
} from 'lucide-react';
import { VideoTrack, TrackReference } from '@livekit/components-react';

interface ScreenShareTheaterProps {
  trackRef: TrackReference;
  sharerName: string;
  screenBadge: string;
  isLocal: boolean;
  onStopShare: () => void;
}

export const ScreenShareTheater: React.FC<ScreenShareTheaterProps> = ({
  trackRef,
  sharerName,
  screenBadge,
  isLocal,
  onStopShare,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const hideTimerRef = useRef<NodeJS.Timeout | null>(null);

  const [controlsVisible, setControlsVisible] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isFillMode, setIsFillMode] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [screenshotTaken, setScreenshotTaken] = useState(false);
  const [pipSupported, setPipSupported] = useState(false);
  const [showLocalPreview, setShowLocalPreview] = useState(false);

  // Check Picture-in-Picture support
  useEffect(() => {
    if (typeof document !== 'undefined' && 'pictureInPictureEnabled' in document) {
      setPipSupported(Boolean(document.pictureInPictureEnabled));
    }
  }, []);

  // Keyboard Escape listener to exit theater fullscreen cleanly
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isFullscreen]);

  // Hover & idle cursor logic
  const handleMouseMove = () => {
    setControlsVisible(true);
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
    }
    hideTimerRef.current = setTimeout(() => {
      setControlsVisible(false);
    }, 2800);
  };

  const handleMouseEnter = () => {
    setControlsVisible(true);
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
    }
    hideTimerRef.current = setTimeout(() => {
      setControlsVisible(false);
    }, 2800);
  };

  const handleMouseLeave = () => {
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
    }
    setControlsVisible(false);
  };

  // Play / Pause video element
  const togglePlayPause = () => {
    const video = containerRef.current?.querySelector('video');
    if (!video) return;

    if (video.paused) {
      video.play().then(() => setIsPlaying(true)).catch(() => {});
    } else {
      video.pause();
      setIsPlaying(false);
    }
  };

  // Mute / Unmute video element
  const toggleMute = () => {
    const video = containerRef.current?.querySelector('video');
    if (!video) return;

    const nextMuted = !isMuted;
    video.muted = nextMuted;
    setIsMuted(nextMuted);
  };

  // Adjust volume
  const handleVolumeChange = (newVol: number) => {
    const video = containerRef.current?.querySelector('video');
    setVolume(newVol);
    if (video) {
      video.volume = newVol;
      video.muted = newVol === 0;
      setIsMuted(newVol === 0);
    }
  };

  // In-App Glitch-Free Theater Fullscreen toggle
  // Prevents WebView2 Direct3D swapchain drops and green screen corruption
  const toggleFullscreen = () => {
    if (isLocal) return; // Prevent local infinite mirror feedback loop
    setIsFullscreen((prev) => !prev);
  };

  // Picture in Picture
  const togglePiP = async () => {
    const video = containerRef.current?.querySelector('video');
    if (!video) return;

    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else if (video.requestPictureInPicture) {
        await video.requestPictureInPicture();
      }
    } catch (err) {
      console.warn('PiP failed:', err);
    }
  };

  // Instant High-Res Screenshot of stream
  const captureScreenshot = () => {
    const video = containerRef.current?.querySelector('video');
    if (!video) return;

    try {
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 1920;
      canvas.height = video.videoHeight || 1080;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/png');

      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `MawaBro-Stream-${sharerName.replace(/\s+/g, '_')}-${Date.now()}.png`;
      a.click();

      setScreenshotTaken(true);
      setTimeout(() => setScreenshotTaken(false), 2000);
    } catch (err) {
      console.warn('Screenshot capture failed:', err);
    }
  };

  // Extract raw settings for Stats for Nerds
  const trackSettings = trackRef.publication?.videoTrack?.mediaStreamTrack?.getSettings?.();

  // =========================================================================
  // CASE 1: LOCAL STREAMER DASHBOARD (DISCORD-STYLE MIRROR PROTECTION)
  // When the user is sharing their own screen, displaying a full-size video on
  // the exact same monitor creates an infinite optical feedback loop
  // (multiplying cursors, saturated GPU buffers, and green macroblock glitching).
  // We provide a dedicated streamer hub with an optional safe thumbnail preview.
  // =========================================================================
  if (isLocal && !showLocalPreview) {
    return (
      <div
        onContextMenu={(e) => e.preventDefault()}
        className="relative w-full rounded-2xl overflow-hidden bg-gradient-to-b from-[#25272b] via-[#1e1f22] to-[#18191c] border-2 border-cyan-500/50 shadow-[0_0_30px_rgba(6,182,212,0.2)] p-6 flex flex-col items-center justify-center text-center select-none z-10 min-h-[220px] transition-all"
      >
        {/* Glowing Monitor Emblem */}
        <div className="relative mb-3">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-[0_0_25px_rgba(6,182,212,0.4)]">
            <Monitor className="w-8 h-8" />
          </div>
          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 border-2 border-[#1e1f22] animate-pulse" />
        </div>

        {/* Stream Status Heading */}
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-extrabold text-white tracking-wide">
            You Are Streaming Your Screen
          </span>
          <span className="text-[10px] px-2 py-0.5 rounded-md bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-mono font-bold uppercase shadow-sm">
            {screenBadge}
          </span>
        </div>

        <p className="text-xs text-[#949ba4] max-w-md mb-4">
          Your desktop and system audio are live to everyone in the lounge with hardware-accelerated 60 FPS delivery.
        </p>

        {/* Quick Tech Specs Strip */}
        <div className="flex flex-wrap items-center justify-center gap-2 text-[11px] font-mono text-[#b5bac1] mb-5">
          <span className="flex items-center gap-1 bg-black/40 px-2.5 py-1 rounded-md border border-white/5">
            <Radio className="w-3 h-3 text-cyan-400" /> WebRTC SFU
          </span>
          <span className="flex items-center gap-1 bg-black/40 px-2.5 py-1 rounded-md border border-white/5">
            <Activity className="w-3 h-3 text-emerald-400" /> 60 FPS Target
          </span>
          <span className="flex items-center gap-1 bg-black/40 px-2.5 py-1 rounded-md border border-white/5">
            <Volume2 className="w-3 h-3 text-purple-400" /> Stereo Loopback Active
          </span>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3">
          {/* Stop Sharing Button */}
          <button
            onClick={onStopShare}
            className="flex items-center gap-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold px-4 py-2 rounded-xl transition shadow-lg shadow-rose-950/40 active:scale-95 cursor-pointer"
          >
            <X className="w-4 h-4" />
            <span>Stop Streaming</span>
          </button>

          {/* Safe Preview Toggle */}
          <button
            onClick={() => setShowLocalPreview(true)}
            className="flex items-center gap-2 bg-[#2b2d31] hover:bg-[#35373c] text-[#dbdee1] hover:text-white border border-[#3f4147] text-xs font-semibold px-3.5 py-2 rounded-xl transition shadow-sm active:scale-95 cursor-pointer"
            title="Inspect how viewers see your stream"
          >
            <Eye className="w-4 h-4 text-cyan-400" />
            <span>Show Preview</span>
          </button>
        </div>
      </div>
    );
  }

  // =========================================================================
  // CASE 2: STREAM THEATER VIEW
  // Used for Remote Viewers (full size & fullscreen) AND Local Safe Preview (with banner)
  // =========================================================================
  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onContextMenu={(e) => e.preventDefault()}
      className={`relative w-full overflow-hidden bg-black flex items-center justify-center select-none transition-all duration-200 group ${
        isFullscreen
          ? 'fixed inset-0 z-50 h-screen w-screen rounded-none border-none shadow-none'
          : 'rounded-2xl aspect-video max-h-[56vh] border-2 border-cyan-500/60 shadow-[0_0_25px_rgba(6,182,212,0.25)] z-10'
      }`}
    >
      {/* Underlying Video Stream */}
      <VideoTrack
        trackRef={trackRef}
        className={`w-full h-full transition-all duration-200 ${
          isFillMode ? 'object-cover' : 'object-contain'
        }`}
      />

      {/* Local Streamer Infinite-Mirror Warning Banner (When preview is open) */}
      {isLocal && (
        <div className="absolute top-14 inset-x-4 bg-amber-500/90 text-black text-xs font-bold py-1 px-3 rounded-lg flex items-center justify-center gap-2 shadow-lg z-30 pointer-events-none">
          <AlertTriangle className="w-4 h-4 text-black shrink-0" />
          <span>Stream Preview Active — Fullscreen is disabled on your own screen to prevent infinite mirror feedback.</span>
        </div>
      )}

      {/* Top Gradient Header Overlay (Fades on hover) */}
      <div
        className={`absolute top-0 inset-x-0 p-3 sm:p-4 bg-gradient-to-b from-black/85 via-black/40 to-transparent flex items-center justify-between z-30 transition-all duration-300 ${
          controlsVisible
            ? 'opacity-100 translate-y-0 pointer-events-auto'
            : 'opacity-0 -translate-y-2 pointer-events-none'
        }`}
      >
        {/* Left Side: Live Attribution & Resolution Badge */}
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-2 bg-black/80 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-white/10 shadow-lg">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
            <span className="text-xs font-bold text-white tracking-wide truncate max-w-[180px] sm:max-w-[280px]">
              {sharerName}&apos;s Screen - LIVE
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-md bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-mono font-bold uppercase shadow-sm">
              {screenBadge}
            </span>
          </div>

          {/* Quick Stats Badge */}
          <button
            onClick={() => setShowStats((prev) => !prev)}
            className={`p-1.5 rounded-lg border text-xs transition flex items-center gap-1 ${
              showStats
                ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/40 shadow-sm'
                : 'bg-black/60 text-[#949ba4] hover:text-white border-white/10'
            }`}
            title="Toggle Stream Statistics"
          >
            <Activity className="w-3.5 h-3.5" />
            <span className="hidden sm:inline text-[11px] font-mono">Stats</span>
          </button>
        </div>

        {/* Right Side: Capture Frame, Hide Preview, & Stop Share */}
        <div className="flex items-center gap-2">
          {/* Screenshot Button */}
          <button
            onClick={captureScreenshot}
            className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-black/70 hover:bg-black/90 text-[#dbdee1] hover:text-white border border-white/10 transition shadow-md active:scale-95"
            title="Capture High-Resolution Frame"
          >
            {screenshotTaken ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400 font-mono text-[11px]">Saved!</span>
              </>
            ) : (
              <>
                <Camera className="w-3.5 h-3.5 text-cyan-400" />
                <span className="hidden sm:inline text-[11px]">Snapshot</span>
              </>
            )}
          </button>

          {/* Hide Preview (If local streamer previewing) */}
          {isLocal && (
            <button
              onClick={() => setShowLocalPreview(false)}
              className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-black/70 hover:bg-black/90 text-[#dbdee1] hover:text-white border border-white/10 transition shadow-md active:scale-95"
              title="Return to Streamer Hub"
            >
              <EyeOff className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden sm:inline text-[11px]">Hide Preview</span>
            </button>
          )}

          {/* Stop Sharing Button (Local publisher) */}
          {isLocal && (
            <button
              onClick={onStopShare}
              className="flex items-center gap-1.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition shadow-lg shadow-rose-950/40 active:scale-95"
            >
              <X className="w-3.5 h-3.5" />
              <span>Stop Sharing</span>
            </button>
          )}
        </div>
      </div>

      {/* Technical Stats Overlay HUD */}
      {showStats && (
        <div className="absolute top-16 left-4 bg-black/90 backdrop-blur-md border border-cyan-500/30 rounded-xl p-3 z-30 text-[11px] font-mono text-[#dbdee1] space-y-1 shadow-2xl min-w-[220px] animate-in fade-in zoom-in-95">
          <div className="text-cyan-400 font-bold border-b border-white/10 pb-1 mb-1.5 flex items-center gap-1.5">
            <Tv className="w-3.5 h-3.5" />
            <span>Stream Diagnostics</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#949ba4]">Quality:</span>
            <span className="text-white font-semibold">{screenBadge}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#949ba4]">Resolution:</span>
            <span className="text-white">
              {trackSettings?.width ? `${trackSettings.width} x ${trackSettings.height}` : 'Native 4K / 1080p'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#949ba4]">Framerate:</span>
            <span className="text-emerald-400">
              {trackSettings?.frameRate ? `${Math.round(trackSettings.frameRate)} FPS` : '60 FPS Target'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#949ba4]">Transport:</span>
            <span className="text-cyan-400">LiveKit SFU (WebRTC)</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#949ba4]">Mode:</span>
            <span className="text-purple-400">{isFillMode ? 'Fill (Cover)' : 'Fit (Preserve Ratio)'}</span>
          </div>
        </div>
      )}

      {/* Center Big Play Indicator (if paused) */}
      {!isPlaying && (
        <button
          onClick={togglePlayPause}
          className="absolute inset-0 m-auto w-16 h-16 rounded-full bg-black/70 hover:bg-black/90 border border-white/20 text-white flex items-center justify-center transition shadow-2xl z-20 hover:scale-105"
          title="Resume Playback"
        >
          <Play className="w-8 h-8 fill-white translate-x-0.5" />
        </button>
      )}

      {/* Bottom Floating Controls Bar (Fades smoothly on hover & vanishes when idle / cursor leaves) */}
      <div
        className={`absolute bottom-0 inset-x-0 p-3 sm:p-4 bg-gradient-to-t from-black/95 via-black/55 to-transparent flex items-center justify-between z-30 transition-all duration-300 ${
          controlsVisible
            ? 'opacity-100 translate-y-0 pointer-events-auto'
            : 'opacity-0 translate-y-2 pointer-events-none'
        }`}
      >
        {/* Left Controls: Play/Pause, Volume Slider, Mute */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Play / Pause Toggle */}
          <button
            onClick={togglePlayPause}
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition active:scale-95"
            title={isPlaying ? 'Pause Playback' : 'Play'}
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-white" />}
          </button>

          {/* Volume Button & Slider */}
          <div className="flex items-center gap-1.5 bg-black/60 px-2.5 py-1 rounded-lg border border-white/10">
            <button
              onClick={toggleMute}
              className="text-[#949ba4] hover:text-white transition"
              title={isMuted ? 'Unmute Stream' : 'Mute Stream'}
            >
              {isMuted || volume === 0 ? (
                <VolumeX className="w-4 h-4 text-rose-400" />
              ) : (
                <Volume2 className="w-4 h-4 text-cyan-400" />
              )}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={isMuted ? 0 : volume}
              onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
              className="w-14 sm:w-20 h-1 accent-cyan-400 cursor-pointer bg-white/20 rounded-lg"
              title={`Stream Volume: ${Math.round((isMuted ? 0 : volume) * 100)}%`}
            />
            <span className="text-[10px] font-mono text-[#949ba4] w-7 text-right">
              {Math.round((isMuted ? 0 : volume) * 100)}%
            </span>
          </div>
        </div>

        {/* Center: Aspect Fit / Fill Mode */}
        <div className="flex items-center gap-1.5 bg-black/60 px-2 py-1 rounded-lg border border-white/10">
          <button
            onClick={() => setIsFillMode((prev) => !prev)}
            className="flex items-center gap-1 text-[11px] font-medium text-[#dbdee1] hover:text-white px-2 py-0.5 rounded transition hover:bg-white/10"
            title={isFillMode ? 'Switch to Fit (Preserve Aspect Ratio)' : 'Switch to Fill (Fill Window)'}
          >
            {isFillMode ? (
              <>
                <Shrink className="w-3.5 h-3.5 text-cyan-400" />
                <span className="hidden sm:inline">Fit</span>
              </>
            ) : (
              <>
                <Expand className="w-3.5 h-3.5 text-cyan-400" />
                <span className="hidden sm:inline">Fill</span>
              </>
            )}
          </button>
        </div>

        {/* Right Controls: PiP, Fullscreen */}
        <div className="flex items-center gap-2">
          {/* Picture-in-Picture */}
          {pipSupported && (
            <button
              onClick={togglePiP}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-[#dbdee1] hover:text-white transition active:scale-95"
              title="Mini Player (Picture-in-Picture)"
            >
              <Tv className="w-4 h-4" />
            </button>
          )}

          {/* Fullscreen Toggle (Disabled for local streamer to protect against mirror feedback) */}
          <button
            onClick={toggleFullscreen}
            disabled={isLocal}
            className={`p-2 rounded-lg transition active:scale-95 shadow-sm ${
              isLocal
                ? 'opacity-40 cursor-not-allowed bg-white/5 text-[#949ba4]'
                : isFullscreen
                ? 'bg-cyan-500/30 text-cyan-300 border border-cyan-500/50'
                : 'bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 border border-cyan-500/40'
            }`}
            title={
              isLocal
                ? 'Fullscreen disabled on your own stream to prevent recursive mirror feedback'
                : isFullscreen
                ? 'Exit Fullscreen Theater (ESC)'
                : 'Fullscreen Theater Mode'
            }
          >
            {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
};
