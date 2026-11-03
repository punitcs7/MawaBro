import React from 'react';
import { Monitor, X, Volume2, Check } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { ScreenSharePreset } from '../types';

interface ScreenShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartShare: () => void;
}

export const ScreenShareModal: React.FC<ScreenShareModalProps> = ({ isOpen, onClose, onStartShare }) => {
  const { screenPreset, setScreenPreset, systemAudioEnabled, setSystemAudioEnabled } = useAppStore();

  if (!isOpen) return null;

  const presets: { id: ScreenSharePreset; title: string; subtitle: string; badge: string }[] = [
    {
      id: '1080p60',
      title: 'Full HD 1080p @ 60 FPS',
      subtitle: 'Crisp & ultra-smooth gaming clarity • 6 Mbps Target Bitrate',
      badge: 'Recommended',
    },
    {
      id: '4k30',
      title: 'Ultra HD 4K @ 30 FPS',
      subtitle: 'Maximum resolution for desktop work & movie nights • 15 Mbps',
      badge: 'Cinema 4K',
    },
    {
      id: '4k60',
      title: 'Ultra HD 4K @ 60 FPS (Zero Compromise)',
      subtitle: 'Enthusiast level high-bitrate streaming • 20 Mbps Bitrate',
      badge: 'Master Quality',
    },
  ];

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 select-none">
      <div className="bg-[#313338] border border-[#3f4147] rounded-xl max-w-lg w-full overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#232428] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[#5865f2]/20 text-[#5865f2]">
              <Monitor className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Share Your Screen</h2>
              <p className="text-xs text-[#949ba4]">Zero-cost high-fidelity WebRTC streaming</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[#949ba4] hover:text-white p-1 rounded-md hover:bg-[#35373c] transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          {/* Resolution & Framerate Preset Options */}
          <div>
            <label className="text-xs font-bold text-[#b5bac1] uppercase tracking-wider block mb-2">
              Streaming Quality Preset
            </label>
            <div className="space-y-2">
              {presets.map((p) => {
                const isSelected = screenPreset === p.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => setScreenPreset(p.id)}
                    className={`w-full text-left p-3.5 rounded-xl border transition flex items-center justify-between ${
                      isSelected
                        ? 'border-cyan-500 bg-cyan-500/10 shadow-[0_0_15px_rgba(6,182,212,0.15)]'
                        : 'border-[#3f4147] bg-[#2b2d31] hover:border-[#4e5058]'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-white">{p.title}</span>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold ${
                            isSelected ? 'bg-cyan-500 text-white' : 'bg-[#1e1f22] text-[#949ba4]'
                          }`}
                        >
                          {p.badge}
                        </span>
                      </div>
                      <p className="text-xs text-[#b5bac1] mt-0.5">{p.subtitle}</p>
                    </div>
                    {isSelected && <Check className="w-5 h-5 text-cyan-400 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* System Audio Toggle */}
          <div className="p-3 bg-[#2b2d31] border border-[#3f4147] rounded-lg flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded bg-[#1e1f22] text-[#dbdee1]">
                <Volume2 className="w-4 h-4" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">Capture System Audio</p>
                <p className="text-xs text-[#949ba4]">Share in-game sound and music in stereo</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={systemAudioEnabled}
                onChange={(e) => setSystemAudioEnabled(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-[#4e5058] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#23a55a]"></div>
            </label>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-[#2b2d31] border-t border-[#232428] flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-[#dbdee1] hover:underline"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              onClose();
              onStartShare();
            }}
            className="px-5 py-2 text-sm font-semibold text-white bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 rounded-lg transition shadow-md flex items-center gap-2"
          >
            <Monitor className="w-4 h-4" />
            Go Live
          </button>
        </div>
      </div>
    </div>
  );
};
