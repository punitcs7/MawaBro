import React, { useState, useEffect } from 'react';
import { MicOff } from 'lucide-react';
import { listen } from '@tauri-apps/api/event';

export interface OverlaySpeaker {
  id: string;
  name: string;
  isSpeaking: boolean;
  isMuted: boolean;
  isLocal: boolean;
}

export const OverlayView: React.FC = () => {
  const [speakers, setSpeakers] = useState<OverlaySpeaker[]>([]);
  const [channelName, setChannelName] = useState<string>('Voice Lounge');

  useEffect(() => {
    // Ensure body background is 100% transparent for in-game overlay
    document.body.style.backgroundColor = 'transparent';
    document.documentElement.style.backgroundColor = 'transparent';

    // 1. Listen via Web BroadcastChannel (instant sub-millisecond inter-webview sync)
    let channel: BroadcastChannel | null = null;
    try {
      channel = new BroadcastChannel('mawabro_overlay_channel');
      channel.onmessage = (event) => {
        if (event.data?.speakers) {
          setSpeakers(event.data.speakers);
        }
        if (event.data?.channelName) {
          setChannelName(event.data.channelName);
        }
      };
    } catch (e) {
      console.warn('BroadcastChannel not supported:', e);
    }

    // 2. Listen via Tauri Desktop Event
    let unlistenTauri: (() => void) | undefined;
    try {
      listen<any>('overlay-speakers', (event) => {
        if (Array.isArray(event.payload)) {
          setSpeakers(event.payload);
        } else if (event.payload?.speakers) {
          setSpeakers(event.payload.speakers);
          if (event.payload.channelName) {
            setChannelName(event.payload.channelName);
          }
        }
      }).then((unlisten) => {
        unlistenTauri = unlisten;
      });
    } catch (e) {
      console.warn('Tauri event listener failed:', e);
    }

    return () => {
      channel?.close();
      unlistenTauri?.();
    };
  }, []);

  return (
    <div className="w-full h-full p-2.5 bg-transparent select-none pointer-events-none flex flex-col gap-2 font-sans antialiased overflow-hidden">
      {/* Sleek In-Game Header Chip */}
      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/75 backdrop-blur-md border border-cyan-500/40 w-fit shadow-[0_0_15px_rgba(6,182,212,0.2)]">
        <img
          src="/logo.png"
          alt="MawaBro"
          className="w-4 h-4 object-contain drop-shadow-[0_0_6px_rgba(56,189,248,0.7)]"
        />
        <span className="text-[10px] font-mono font-bold text-cyan-300 tracking-wider uppercase">
          {channelName}
        </span>
      </div>

      {/* Speakers List */}
      <div className="flex flex-col gap-1.5 max-w-[240px]">
        {speakers.length === 0 ? (
          <div className="px-3 py-2 rounded-xl bg-black/60 backdrop-blur-md border border-white/10 text-[11px] text-[#949ba4] font-medium shadow-md">
            Waiting for squad comms...
          </div>
        ) : (
          speakers.map((s) => (
            <div
              key={s.id}
              className={`flex items-center gap-2 px-2.5 py-1.5 rounded-xl transition-all duration-150 border backdrop-blur-md ${
                s.isSpeaking
                  ? 'bg-black/90 border-emerald-400/80 shadow-[0_0_15px_rgba(52,211,153,0.35)] scale-[1.02]'
                  : 'bg-black/60 border-white/10 opacity-75'
              }`}
            >
              {/* Avatar with speaking ring */}
              <div className="relative shrink-0">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold text-white transition-all ${
                    s.isLocal
                      ? 'bg-gradient-to-br from-cyan-500 to-blue-600'
                      : 'bg-gradient-to-br from-[#4e5058] to-[#35373c]'
                  } ${s.isSpeaking ? 'ring-2 ring-emerald-400 ring-offset-1 ring-offset-black' : ''}`}
                >
                  {s.name.substring(0, 2).toUpperCase()}
                </div>
                {s.isSpeaking && (
                  <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                )}
              </div>

              {/* Name & status */}
              <div className="flex-1 min-w-0 flex items-center justify-between gap-1">
                <span
                  className={`text-xs font-semibold truncate ${
                    s.isSpeaking ? 'text-white' : 'text-[#dbdee1]'
                  }`}
                >
                  {s.name}
                </span>

                {s.isMuted && (
                  <span className="p-0.5 rounded bg-rose-500/20 text-rose-400 shrink-0">
                    <MicOff className="w-3 h-3" />
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
