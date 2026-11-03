import React, { useState, useEffect } from 'react';
import { Radio, Plus, Trash2, Volume2, Headphones } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { audioEngine } from '../services/audioEngine';
import { SoundPad } from '../types';

export const Soundboard: React.FC = () => {
  const {
    soundPads,
    addSoundPad,
    removeSoundPad,
    soundboardVolume,
    setSoundboardVolume,
    soundboardMonitorVolume,
    setSoundboardMonitorVolume,
  } = useAppStore();

  const [activeTriggerId, setActiveTriggerId] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newSoundName, setNewSoundName] = useState('');
  const [newSoundEmoji, setNewSoundEmoji] = useState('🎵');
  const [newSoundUrl, setNewSoundUrl] = useState('');

  // Handle number key triggers for quick soundboard firing
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't fire if typing in an input
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;

      const pad = soundPads.find((p) => p.keybind && p.keybind.toLowerCase() === e.key.toLowerCase());
      if (pad) {
        triggerSound(pad);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [soundPads, soundboardVolume]);

  const triggerSound = async (pad: SoundPad) => {
    setActiveTriggerId(pad.id);
    await audioEngine.playSound(pad.url, soundboardVolume);
    setTimeout(() => {
      setActiveTriggerId(null);
    }, 600);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      const newPad: SoundPad = {
        id: `custom_${Date.now()}`,
        name: file.name.replace(/\.[^/.]+$/, ''),
        emoji: '🔥',
        url,
        isCustom: true,
      };
      addSoundPad(newPad);
    }
  };

  const handleAddCustomUrl = () => {
    if (!newSoundName.trim() || !newSoundUrl.trim()) return;
    const newPad: SoundPad = {
      id: `custom_${Date.now()}`,
      name: newSoundName.trim(),
      emoji: newSoundEmoji || '🎵',
      url: newSoundUrl.trim(),
      isCustom: true,
    };
    addSoundPad(newPad);
    setNewSoundName('');
    setNewSoundUrl('');
    setShowAddModal(false);
  };

  return (
    <div className="bg-[#2b2d31] border border-[#1f2023] rounded-xl p-5 shadow-xl select-none max-w-2xl w-full mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-[#35373c]">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-[#5865f2]/20 text-[#5865f2]">
            <Radio className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-white text-base flex items-center gap-2">
              In-App Soundboard
              <span className="text-[10px] px-2 py-0.5 rounded bg-[#23a55a]/20 text-[#23a55a] font-mono">
                Direct Web Audio Mix
              </span>
            </h3>
            <p className="text-xs text-[#949ba4]">
              Broadcasts to channel peers + local speakers (No virtual audio cable required)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <label className="cursor-pointer px-3 py-1.5 rounded-md bg-[#35373c] hover:bg-[#3f4147] text-xs font-medium text-white transition flex items-center gap-1.5 shadow-sm">
            <Plus className="w-3.5 h-3.5" />
            Upload Clip
            <input type="file" accept="audio/*" onChange={handleFileUpload} className="hidden" />
          </label>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-3 py-1.5 rounded-md bg-[#5865f2] hover:bg-[#4752c4] text-xs font-semibold text-white transition flex items-center gap-1.5 shadow-sm"
          >
            Add URL
          </button>
        </div>
      </div>

      {/* Volume Control Sliders */}
      <div className="grid grid-cols-2 gap-4 py-4 border-b border-[#35373c] text-xs">
        <div>
          <div className="flex justify-between text-[#dbdee1] mb-1 font-medium">
            <span className="flex items-center gap-1.5">
              <Volume2 className="w-3.5 h-3.5 text-[#5865f2]" /> Transmit Volume (Peers Hear)
            </span>
            <span className="font-mono text-[#949ba4]">{Math.round(soundboardVolume * 100)}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={soundboardVolume}
            onChange={(e) => {
              const val = parseFloat(e.target.value);
              setSoundboardVolume(val);
              audioEngine.setSoundboardVolume(val);
            }}
            className="w-full accent-[#5865f2] h-1.5 bg-[#1e1f22] rounded-lg cursor-pointer"
          />
        </div>

        <div>
          <div className="flex justify-between text-[#dbdee1] mb-1 font-medium">
            <span className="flex items-center gap-1.5">
              <Headphones className="w-3.5 h-3.5 text-[#23a55a]" /> Local Feedback Volume
            </span>
            <span className="font-mono text-[#949ba4]">{Math.round(soundboardMonitorVolume * 100)}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={soundboardMonitorVolume}
            onChange={(e) => {
              const val = parseFloat(e.target.value);
              setSoundboardMonitorVolume(val);
              audioEngine.setMonitorVolume(val);
            }}
            className="w-full accent-[#23a55a] h-1.5 bg-[#1e1f22] rounded-lg cursor-pointer"
          />
        </div>
      </div>

      {/* Sound Pads Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-4">
        {soundPads.map((pad) => {
          const isTriggered = activeTriggerId === pad.id;
          return (
            <button
              key={pad.id}
              onClick={() => triggerSound(pad)}
              className={`relative group p-3 rounded-lg border transition-all duration-150 flex flex-col items-center justify-center text-center ${
                isTriggered
                  ? 'bg-[#5865f2] border-white scale-95 shadow-lg shadow-[#5865f2]/50'
                  : 'bg-[#313338] border-[#383a40] hover:border-[#5865f2] hover:bg-[#35373c]'
              }`}
            >
              {pad.isCustom && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeSoundPad(pad.id);
                  }}
                  className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 p-1 text-[#f23f43] hover:bg-[#1e1f22] rounded transition"
                  title="Delete pad"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}

              <span className="text-2xl mb-1 group-hover:scale-110 transition-transform">
                {pad.emoji}
              </span>
              <span className="text-xs font-semibold text-white truncate max-w-full">
                {pad.name}
              </span>

              {pad.keybind && (
                <span className="absolute bottom-1 right-1 text-[9px] font-mono text-[#949ba4] bg-[#1e1f22] px-1 rounded">
                  {pad.keybind}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Add Custom Sound Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-[#313338] border border-[#3f4147] rounded-xl p-5 max-w-md w-full shadow-2xl">
            <h4 className="font-bold text-white mb-3">Add Custom Sound Link</h4>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-[#949ba4] uppercase font-bold block mb-1">Emoji</label>
                <input
                  type="text"
                  maxLength={2}
                  value={newSoundEmoji}
                  onChange={(e) => setNewSoundEmoji(e.target.value)}
                  className="w-16 p-2 rounded bg-[#1e1f22] border border-[#3f4147] text-white text-center text-lg"
                />
              </div>
              <div>
                <label className="text-xs text-[#949ba4] uppercase font-bold block mb-1">
                  Sound Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Anime Wow"
                  value={newSoundName}
                  onChange={(e) => setNewSoundName(e.target.value)}
                  className="w-full p-2 rounded bg-[#1e1f22] border border-[#3f4147] text-white text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-[#949ba4] uppercase font-bold block mb-1">
                  Audio URL (.mp3 / .wav)
                </label>
                <input
                  type="text"
                  placeholder="https://.../sound.mp3"
                  value={newSoundUrl}
                  onChange={(e) => setNewSoundUrl(e.target.value)}
                  className="w-full p-2 rounded bg-[#1e1f22] border border-[#3f4147] text-white text-sm"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-5">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-3 py-1.5 text-xs text-[#dbdee1] hover:underline"
              >
                Cancel
              </button>
              <button
                onClick={handleAddCustomUrl}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-[#5865f2] hover:bg-[#4752c4] rounded-md transition"
              >
                Add Sound
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
