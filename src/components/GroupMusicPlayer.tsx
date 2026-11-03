import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Music, Share2, Radio, Link as LinkIcon, Volume2 } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { SyncMessagePayload } from '../types';

interface GroupMusicPlayerProps {
  onPublishSyncData?: (payload: SyncMessagePayload) => void;
  incomingSyncPayload?: SyncMessagePayload | null;
}

declare global {
  interface Window {
    YT: {
      Player: new (
        elementId: string,
        config: {
          videoId?: string;
          playerVars?: Record<string, unknown>;
          events?: {
            onReady?: (event: { target: YTPlayerInstance }) => void;
            onStateChange?: (event: { data: number }) => void;
          };
        }
      ) => YTPlayerInstance;
      PlayerState: {
        PLAYING: number;
        PAUSED: number;
        ENDED: number;
      };
    };
    onYouTubeIframeAPIReady?: () => void;
  }
}

interface YTPlayerInstance {
  playVideo: () => void;
  pauseVideo: () => void;
  seekTo: (seconds: number, allowSeekAhead: boolean) => void;
  getCurrentTime: () => number;
  getDuration: () => number;
  loadVideoById: (id: string, startSeconds?: number) => void;
  destroy: () => void;
  setVolume: (volume: number) => void;
}

function extractYouTubeVideoId(url: string): string {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return match && match[2].length === 11 ? match[2] : 'jfKfPfyJRdk'; // Fallback to Lofi Girl
}

export const GroupMusicPlayer: React.FC<GroupMusicPlayerProps> = ({
  onPublishSyncData,
  incomingSyncPayload,
}) => {
  const { musicState, setMusicState, username } = useAppStore();
  const [inputUrl, setInputUrl] = useState(musicState.trackUrl);
  const [driftMs, setDriftMs] = useState<number>(0);
  const [playerVolume, setPlayerVolume] = useState<number>(80);

  const playerRef = useRef<YTPlayerInstance | null>(null);
  const isInternalAction = useRef<boolean>(false);

  // Load YouTube IFrame API script dynamically
  useEffect(() => {
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag?.parentNode?.insertBefore(tag, firstScriptTag);
    }

    const initPlayer = () => {
      const videoId = extractYouTubeVideoId(musicState.trackUrl);
      playerRef.current = new window.YT.Player('mawabro-youtube-player', {
        videoId,
        playerVars: {
          autoplay: 0,
          controls: 0,
          disablekb: 1,
          fs: 0,
          modestbranding: 1,
          rel: 0,
        },
        events: {
          onReady: (event) => {
            event.target.setVolume(playerVolume);
          },
        },
      });
    };

    if (window.YT && window.YT.Player) {
      initPlayer();
    } else {
      window.onYouTubeIframeAPIReady = initPlayer;
    }

    return () => {
      if (playerRef.current) {
        playerRef.current.destroy();
        playerRef.current = null;
      }
    };
  }, []);

  // Handle incoming LiveKit room DataMessages
  useEffect(() => {
    if (!incomingSyncPayload || !playerRef.current) return;

    const payload = incomingSyncPayload;
    const now = Date.now();
    const networkLatencySec = Math.max(0, (now - payload.sentAt) / 1000);
    const expectedTime = payload.isPlaying ? payload.timestamp + networkLatencySec : payload.timestamp;

    const currentTime = playerRef.current.getCurrentTime() || 0;
    const currentDrift = Math.abs(currentTime - expectedTime) * 1000;
    setDriftMs(Math.round(currentDrift));

    // Auto-sync: If drift is larger than 150ms (or on seek/track change), adjust player
    if (payload.type === 'SEEK' || currentDrift > 150) {
      isInternalAction.current = true;
      playerRef.current.seekTo(expectedTime, true);
      setTimeout(() => {
        isInternalAction.current = false;
      }, 200);
    }

    if (payload.isPlaying && !musicState.isPlaying) {
      playerRef.current.playVideo();
      setMusicState({ isPlaying: true, currentTime: expectedTime });
    } else if (!payload.isPlaying && musicState.isPlaying) {
      playerRef.current.pauseVideo();
      setMusicState({ isPlaying: false, currentTime: expectedTime });
    }

    // If new track URL
    if (payload.trackUrl !== musicState.trackUrl) {
      const newId = extractYouTubeVideoId(payload.trackUrl);
      playerRef.current.loadVideoById(newId, payload.timestamp);
      setMusicState({ trackUrl: payload.trackUrl, currentTime: payload.timestamp });
    }
  }, [incomingSyncPayload]);

  const broadcastSync = (type: 'PLAY' | 'PAUSE' | 'SEEK', isPlaying: boolean, seekTimestamp?: number) => {
    const player = playerRef.current;
    if (!player) return;

    const timestamp = seekTimestamp !== undefined ? seekTimestamp : player.getCurrentTime() || 0;
    const payload: SyncMessagePayload = {
      type,
      trackUrl: musicState.trackUrl,
      timestamp,
      sentAt: Date.now(),
      isPlaying,
      senderId: username,
    };

    onPublishSyncData?.(payload);
    setMusicState({ isPlaying, currentTime: timestamp, isHost: true });
  };

  const handlePlay = () => {
    if (playerRef.current) {
      playerRef.current.playVideo();
      broadcastSync('PLAY', true);
    }
  };

  const handlePause = () => {
    if (playerRef.current) {
      playerRef.current.pauseVideo();
      broadcastSync('PAUSE', false);
    }
  };

  const handleSeek = (newSeconds: number) => {
    if (playerRef.current) {
      playerRef.current.seekTo(newSeconds, true);
      broadcastSync('SEEK', musicState.isPlaying, newSeconds);
    }
  };

  const handleLoadTrack = () => {
    if (!inputUrl.trim() || !playerRef.current) return;
    const videoId = extractYouTubeVideoId(inputUrl);
    playerRef.current.loadVideoById(videoId, 0);
    setMusicState({ trackUrl: inputUrl, currentTime: 0, isPlaying: true });

    const payload: SyncMessagePayload = {
      type: 'PLAY',
      trackUrl: inputUrl,
      timestamp: 0,
      sentAt: Date.now(),
      isPlaying: true,
      senderId: username,
    };
    onPublishSyncData?.(payload);
  };

  return (
    <div className="bg-[#2b2d31] border border-[#1f2023] rounded-xl p-5 shadow-xl select-none max-w-2xl w-full mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-[#35373c]">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-[#5865f2]/20 text-[#5865f2]">
            <Music className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-white text-base flex items-center gap-2">
              Synchronized Group Music Player
              <span className="text-[10px] px-2 py-0.5 rounded bg-[#5865f2]/20 text-[#5865f2] font-mono">
                LiveKit DataMessages
              </span>
            </h3>
            <p className="text-xs text-[#949ba4]">
              Listen together with room members synchronized within &lt;150ms
            </p>
          </div>
        </div>

        {/* Sync Drift Indicator */}
        <div className="flex items-center gap-2 text-xs font-mono bg-[#1e1f22] px-3 py-1.5 rounded-lg border border-[#35373c]">
          <span className="w-2 h-2 rounded-full bg-[#23a55a] animate-pulse" />
          <span className="text-[#dbdee1]">Drift: </span>
          <span className="text-[#23a55a] font-semibold">{driftMs}ms</span>
        </div>
      </div>

      {/* URL Input Bar */}
      <div className="flex gap-2 my-4">
        <div className="relative flex-1">
          <LinkIcon className="absolute left-3 top-2.5 w-4 h-4 text-[#949ba4]" />
          <input
            type="text"
            value={inputUrl}
            onChange={(e) => setInputUrl(e.target.value)}
            placeholder="Paste YouTube Video URL (e.g., https://www.youtube.com/watch?v=...)"
            className="w-full pl-9 pr-3 py-2 rounded-lg bg-[#1e1f22] border border-[#3f4147] text-white text-sm focus:outline-none focus:border-[#5865f2]"
          />
        </div>
        <button
          onClick={handleLoadTrack}
          className="px-4 py-2 bg-[#5865f2] hover:bg-[#4752c4] text-white text-xs font-semibold rounded-lg transition shadow-md flex items-center gap-1.5 shrink-0"
        >
          <Share2 className="w-3.5 h-3.5" />
          Queue & Sync
        </button>
      </div>

      {/* YouTube Player Frame (Hidden or compact visualizer) */}
      <div className="relative rounded-lg overflow-hidden bg-[#1e1f22] aspect-video max-h-56 mb-4 flex items-center justify-center border border-[#35373c]">
        <div id="mawabro-youtube-player" className="w-full h-full" />
      </div>

      {/* Playback Controls */}
      <div className="flex items-center justify-between pt-2">
        <div className="flex items-center gap-3">
          <button
            onClick={musicState.isPlaying ? handlePause : handlePlay}
            className="w-10 h-10 rounded-full bg-[#5865f2] hover:bg-[#4752c4] text-white flex items-center justify-center transition shadow-md"
          >
            {musicState.isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
          </button>

          <button
            onClick={() => handleSeek(0)}
            className="p-2 rounded-lg bg-[#35373c] hover:bg-[#3f4147] text-[#dbdee1] transition"
            title="Restart from beginning"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <div className="text-xs text-[#949ba4]">
            {musicState.isPlaying ? (
              <span className="text-[#23a55a] font-medium flex items-center gap-1">
                <Radio className="w-3.5 h-3.5 animate-pulse" /> Playing for all members
              </span>
            ) : (
              <span>Paused</span>
            )}
          </div>
        </div>

        {/* Local Player Volume Slider */}
        <div className="flex items-center gap-2 text-xs">
          <Volume2 className="w-4 h-4 text-[#949ba4]" />
          <input
            type="range"
            min="0"
            max="100"
            value={playerVolume}
            onChange={(e) => {
              const val = parseInt(e.target.value, 10);
              setPlayerVolume(val);
              playerRef.current?.setVolume(val);
            }}
            className="w-24 accent-[#5865f2] h-1.5 bg-[#1e1f22] rounded-lg cursor-pointer"
          />
          <span className="font-mono text-[#949ba4] w-7">{playerVolume}%</span>
        </div>
      </div>
    </div>
  );
};
