import React, { useState, useEffect } from 'react';
import { X, Mic, Keyboard, Server, Volume2, Headphones, Sliders, Sparkles, Gamepad2 } from 'lucide-react';
import { Room } from 'livekit-client';
import { useAppStore } from '../store/useAppStore';
import { updateBackendPttKey } from '../services/tauriPtt';
import { audioEngine } from '../services/audioEngine';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const {
    username,
    setUsername,
    serverUrl,
    setServerUrl,
    token,
    setToken,
    inputMode,
    setInputMode,
    pttKey,
    setPttKey,
    inputVolume,
    setInputVolume,
    selectedAudioInput,
    setSelectedAudioInput,
    selectedAudioOutput,
    setSelectedAudioOutput,
    activeRoom,
    isNoiseSuppressionEnabled,
    setIsNoiseSuppressionEnabled,
    isOverlayVisible,
    setIsOverlayVisible,
  } = useAppStore();

  const handleToggleOverlay = async () => {
    const next = !isOverlayVisible;
    setIsOverlayVisible(next);
    try {
      const { invoke } = await import('@tauri-apps/api/core');
      await invoke('set_overlay_visible', { visible: next });
    } catch (err) {
      console.warn('Failed to toggle overlay:', err);
    }
  };

  const [isRecordingKey, setIsRecordingKey] = useState(false);
  const [micLevel, setMicLevel] = useState(0);
  const [audioInputs, setAudioInputs] = useState<MediaDeviceInfo[]>([]);
  const [audioOutputs, setAudioOutputs] = useState<MediaDeviceInfo[]>([]);

  // Load and monitor audio input/output devices
  useEffect(() => {
    if (!isOpen) return;

    const loadDevices = async () => {
      try {
        const inputs = await Room.getLocalDevices('audioinput');
        const outputs = await Room.getLocalDevices('audiooutput');
        setAudioInputs(inputs);
        setAudioOutputs(outputs);
      } catch (err) {
        console.warn('[Settings] Failed to fetch audio devices:', err);
      }
    };

    loadDevices();

    navigator.mediaDevices.addEventListener('devicechange', loadDevices);
    return () => {
      navigator.mediaDevices.removeEventListener('devicechange', loadDevices);
    };
  }, [isOpen]);

  // Audio test meter with real-time level
  useEffect(() => {
    let audioCtx: AudioContext | null = null;
    let micStream: MediaStream | null = null;
    let animId: number;

    if (isOpen) {
      navigator.mediaDevices
        .getUserMedia({
          audio: selectedAudioInput ? { deviceId: { exact: selectedAudioInput } } : true,
        })
        .then((stream) => {
          micStream = stream;
          audioCtx = new AudioContext();
          const source = audioCtx.createMediaStreamSource(stream);
          const analyser = audioCtx.createAnalyser();
          analyser.fftSize = 256;
          source.connect(analyser);

          const dataArray = new Uint8Array(analyser.frequencyBinCount);
          const update = () => {
            analyser.getByteFrequencyData(dataArray);
            let sum = 0;
            for (let i = 0; i < dataArray.length; i++) {
              sum += dataArray[i];
            }
            const avg = sum / dataArray.length;
            setMicLevel(Math.min(100, Math.round((avg / 128) * 100 * inputVolume)));
            animId = requestAnimationFrame(update);
          };
          update();
        })
        .catch((e) => console.log('Mic test unavailable:', e));
    }

    return () => {
      cancelAnimationFrame(animId);
      if (micStream) micStream.getTracks().forEach((t) => t.stop());
      if (audioCtx) audioCtx.close();
    };
  }, [isOpen, selectedAudioInput, inputVolume]);

  // Key recording listener for Global PTT
  useEffect(() => {
    if (!isRecordingKey) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();

      const newKey = e.code;
      setPttKey(newKey);
      updateBackendPttKey(newKey);
      setIsRecordingKey(false);
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [isRecordingKey, setPttKey]);

  const handleDeviceInputChange = async (deviceId: string) => {
    setSelectedAudioInput(deviceId);
    audioEngine.switchInputDevice(deviceId);
    if (activeRoom) {
      try {
        await activeRoom.switchActiveDevice('audioinput', deviceId);
      } catch (err) {
        console.warn('[LiveKit] Failed to switch active audio input:', err);
      }
    }
  };

  const handleDeviceOutputChange = async (deviceId: string) => {
    setSelectedAudioOutput(deviceId);
    if (activeRoom) {
      try {
        await activeRoom.switchActiveDevice('audiooutput', deviceId);
      } catch (err) {
        console.warn('[LiveKit] Failed to switch active audio output:', err);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-xs z-50 flex items-center justify-center p-4 select-none animate-in fade-in duration-150">
      <div className="bg-[#313338] border border-[#3f4147] rounded-xl max-w-xl w-full overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#232428] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 p-1 rounded-xl bg-[#1e1f22] border border-cyan-500/30 flex items-center justify-center shadow-md">
              <img
                src="/logo.png"
                alt="Logo"
                className="w-full h-full object-contain drop-shadow-[0_0_8px_rgba(56,189,248,0.7)]"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white">Voice & Audio Settings</h2>
                <span className="text-[10px] px-2 py-0.5 rounded bg-gradient-to-r from-cyan-500/20 to-fuchsia-500/20 text-cyan-400 font-mono font-bold border border-cyan-500/30">
                  v1.8.3
                </span>
              </div>
              <p className="text-xs text-[#b5bac1]">Configure Devices, AI Noise Filter, In-Game Overlay & PTT</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[#949ba4] hover:text-white p-1 rounded-md hover:bg-[#35373c] transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Identity & Display Name */}
          <div>
            <label className="text-xs font-bold text-[#b5bac1] uppercase tracking-wider block mb-2">
              Display Name
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-[#1e1f22] border border-[#3f4147] text-white text-sm focus:outline-none focus:border-cyan-500"
              placeholder="e.g. MawaPro_Gamer"
            />
          </div>

          {/* Audio Input & Output Device Pickers */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Audio Input Device */}
              <div>
                <label className="text-xs font-bold text-[#b5bac1] uppercase tracking-wider block mb-2 flex items-center gap-1.5">
                  <Mic className="w-3.5 h-3.5 text-cyan-400" /> Input Device (Mic)
                </label>
                <select
                  value={selectedAudioInput}
                  onChange={(e) => handleDeviceInputChange(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[#1e1f22] border border-[#3f4147] text-white text-xs focus:outline-none focus:border-cyan-500 truncate"
                >
                  <option value="">Default System Microphone</option>
                  {audioInputs.map((device) => (
                    <option key={device.deviceId} value={device.deviceId}>
                      {device.label || `Microphone (${device.deviceId.substring(0, 8)}...)`}
                    </option>
                  ))}
                </select>
              </div>

              {/* Audio Output Device */}
              <div>
                <label className="text-xs font-bold text-[#b5bac1] uppercase tracking-wider block mb-2 flex items-center gap-1.5">
                  <Headphones className="w-3.5 h-3.5 text-cyan-400" /> Output Device (Headphones)
                </label>
                <select
                  value={selectedAudioOutput}
                  onChange={(e) => handleDeviceOutputChange(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[#1e1f22] border border-[#3f4147] text-white text-xs focus:outline-none focus:border-cyan-500 truncate"
                >
                  <option value="">Default System Output</option>
                  {audioOutputs.map((device) => (
                    <option key={device.deviceId} value={device.deviceId}>
                      {device.label || `Speaker (${device.deviceId.substring(0, 8)}...)`}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Input Volume / Sensitivity Slider (0% to 150%) */}
            <div className="p-4 bg-[#2b2d31] border border-[#3f4147] rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-bold uppercase text-[#b5bac1] flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-cyan-400" /> Input Volume / Sensitivity
                </span>
                <span className="text-xs font-mono text-cyan-400 font-bold">
                  {Math.round(inputVolume * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="1.5"
                step="0.05"
                value={inputVolume}
                onChange={(e) => setInputVolume(parseFloat(e.target.value))}
                className="w-full accent-cyan-400 cursor-pointer h-2 bg-[#1e1f22] rounded-lg"
              />
              <div className="flex justify-between text-[10px] text-[#949ba4] mt-1 font-mono">
                <span>0% (Silent)</span>
                <span>100% (Normal)</span>
                <span>150% (Boosted)</span>
              </div>
            </div>

            {/* AI Noise Suppression (RNNoise WebAssembly) Toggle */}
            <div className="p-4 bg-[#2b2d31] border border-[#3f4147] rounded-lg flex items-center justify-between">
              <div className="pr-4">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase text-[#b5bac1] flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-cyan-400" /> AI Noise Suppression
                  </span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-400 font-mono font-bold border border-cyan-500/30">
                    RNNoise Wasm
                  </span>
                </div>
                <p className="text-xs text-[#949ba4] mt-1">
                  AudioWorklet neural network denoiser eliminates background noise, fan hum, and keyboard clicks at 48kHz.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsNoiseSuppressionEnabled(!isNoiseSuppressionEnabled)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  isNoiseSuppressionEnabled ? 'bg-cyan-500' : 'bg-[#1e1f22]'
                }`}
                title="Toggle AI Noise Suppression"
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    isNoiseSuppressionEnabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Transparent In-Game Voice Overlay Toggle */}
            <div className="p-4 bg-[#2b2d31] border border-[#3f4147] rounded-lg flex items-center justify-between">
              <div className="pr-4">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase text-[#b5bac1] flex items-center gap-1.5">
                    <Gamepad2 className="w-3.5 h-3.5 text-purple-400" /> In-Game Voice Overlay
                  </span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 font-mono font-bold border border-purple-500/30">
                    Transparent HUD
                  </span>
                </div>
                <p className="text-xs text-[#949ba4] mt-1">
                  Floating transparent speaker list that stays on top of full-screen games with zero mouse-click interference.
                </p>
              </div>
              <button
                type="button"
                onClick={handleToggleOverlay}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  isOverlayVisible ? 'bg-purple-500' : 'bg-[#1e1f22]'
                }`}
                title="Toggle In-Game Voice Overlay"
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    isOverlayVisible ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Voice Input Mode (Voice Activity vs Push to Talk) */}
          <div>
            <label className="text-xs font-bold text-[#b5bac1] uppercase tracking-wider block mb-2">
              Input Mode
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setInputMode('voice_activity')}
                className={`p-3 rounded-lg border text-left transition ${
                  inputMode === 'voice_activity'
                    ? 'border-cyan-500 bg-cyan-500/10 text-white'
                    : 'border-[#3f4147] bg-[#2b2d31] text-[#949ba4] hover:border-[#4e5058]'
                }`}
              >
                <div className="font-semibold text-sm">Voice Activity</div>
                <div className="text-xs text-[#949ba4] mt-0.5">Automated VAD threshold</div>
              </button>
              <button
                onClick={() => setInputMode('push_to_talk')}
                className={`p-3 rounded-lg border text-left transition ${
                  inputMode === 'push_to_talk'
                    ? 'border-cyan-500 bg-cyan-500/10 text-white'
                    : 'border-[#3f4147] bg-[#2b2d31] text-[#949ba4] hover:border-[#4e5058]'
                }`}
              >
                <div className="font-semibold text-sm flex items-center gap-1.5">
                  <Keyboard className="w-3.5 h-3.5 text-cyan-400" />
                  Push to Talk
                </div>
                <div className="text-xs text-[#949ba4] mt-0.5">Low-level OS hook</div>
              </button>
            </div>
          </div>

          {/* Push to Talk Key Configuration */}
          {inputMode === 'push_to_talk' && (
            <div className="p-4 bg-[#2b2d31] border border-[#3f4147] rounded-lg space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-white">Global PTT Keybind</p>
                  <p className="text-xs text-[#949ba4]">
                    Listened by Windows hook (`SetWindowsHookExW` / `rdev`)
                  </p>
                </div>
                <button
                  onClick={() => setIsRecordingKey(true)}
                  className={`px-4 py-2 rounded-md font-mono text-xs font-bold transition shadow-sm ${
                    isRecordingKey
                      ? 'bg-[#f23f43] text-white animate-pulse'
                      : 'bg-[#1e1f22] text-cyan-400 border border-cyan-500/40 hover:bg-[#35373c]'
                  }`}
                >
                  {isRecordingKey ? 'Press any key...' : pttKey}
                </button>
              </div>
            </div>
          )}

          {/* Mic Test Visualizer */}
          <div className="p-4 bg-[#2b2d31] border border-[#3f4147] rounded-lg">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-bold uppercase text-[#b5bac1] flex items-center gap-1.5">
                <Volume2 className="w-3.5 h-3.5 text-[#23a55a]" /> Mic Test Input Level
              </span>
              <span className="text-xs font-mono text-[#23a55a] font-bold">{micLevel}%</span>
            </div>
            <div className="w-full h-3 bg-[#1e1f22] rounded-full overflow-hidden p-0.5">
              <div
                className="h-full bg-gradient-to-r from-[#23a55a] via-[#f0b232] to-[#f23f43] rounded-full transition-all duration-75"
                style={{ width: `${micLevel}%` }}
              />
            </div>
          </div>

          {/* Realtime LiveKit SFU Server Settings */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Server className="w-4 h-4 text-cyan-400" />
              <label className="text-xs font-bold text-[#b5bac1] uppercase tracking-wider">
                LiveKit SFU Server (Cloud / Dedicated)
              </label>
            </div>
            <div className="space-y-3">
              <div>
                <span className="text-xs text-[#949ba4] block mb-1">WebSocket URL</span>
                <input
                  type="text"
                  value={serverUrl}
                  onChange={(e) => setServerUrl(e.target.value)}
                  placeholder="wss://your-project.livekit.cloud or ws://localhost:7880"
                  className="w-full px-3 py-2 rounded-lg bg-[#1e1f22] border border-[#3f4147] text-white text-xs font-mono focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <span className="text-xs text-[#949ba4] block mb-1">Access Token</span>
                <input
                  type="password"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  placeholder="Paste JWT token (optional if testing with simulated room)"
                  className="w-full px-3 py-2 rounded-lg bg-[#1e1f22] border border-[#3f4147] text-white text-xs font-mono focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-[#2b2d31] border-t border-[#232428] flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 text-sm font-semibold text-white bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 rounded-lg transition shadow-md"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
