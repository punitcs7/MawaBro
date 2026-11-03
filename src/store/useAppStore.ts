import { create } from 'zustand';
import { ChannelInfo, InputMode, ScreenSharePreset, SoundPad } from '../types';
import { audioEngine } from '../services/audioEngine';

export const DEFAULT_SOUNDS: SoundPad[] = [
  { id: 'airhorn', name: 'Airhorn', emoji: '📢', keybind: '1', url: 'https://cdn.freesound.org/previews/414/414209_5121236-lq.mp3' },
  { id: 'badumtss', name: 'Ba-Dum Tss', emoji: '🥁', keybind: '2', url: 'https://cdn.freesound.org/previews/536/536108_1415754-lq.mp3' },
  { id: 'vineboom', name: 'Boom', emoji: '💥', keybind: '3', url: 'https://cdn.freesound.org/previews/456/456544_5121236-lq.mp3' },
  { id: 'bruh', name: 'Bruh', emoji: '🗿', keybind: '4', url: 'https://cdn.freesound.org/previews/522/522244_11861866-lq.mp3' },
  { id: 'victory', name: 'Victory', emoji: '🎺', keybind: '5', url: 'https://cdn.freesound.org/previews/270/270404_5121236-lq.mp3' },
  { id: 'applause', name: 'Applause', emoji: '👏', keybind: '6', url: 'https://cdn.freesound.org/previews/448/448080_9159316-lq.mp3' },
  { id: 'quack', name: 'Quack', emoji: '🦆', keybind: '7', url: 'https://cdn.freesound.org/previews/485/485076_6142149-lq.mp3' },
  { id: 'gameover', name: 'Game Over', emoji: '🎮', keybind: '8', url: 'https://cdn.freesound.org/previews/253/253886_321967-lq.mp3' },
];

export const INITIAL_CHANNELS: ChannelInfo[] = [
  { id: 'lounge', name: 'General Lounge', type: 'voice', userCount: 0 },
  { id: 'gaming-1', name: 'Squad Alpha', type: 'voice', userCount: 0 },
  { id: 'cinema-4k', name: '4K Cinema', type: 'voice', userCount: 0 },
  { id: 'lobby-text', name: 'general-chat', type: 'text' },
  { id: 'gaming-text', name: 'clips-and-memes', type: 'text' },
  { id: 'music-text', name: 'music', type: 'text' },
  { id: 'general-notes', name: 'text', type: 'text' },
];

export function getOrCreateUserId(): string {
  let id = localStorage.getItem('mawabro_user_id');
  if (!id) {
    id = 'user_' + Math.random().toString(36).substring(2, 8);
    localStorage.setItem('mawabro_user_id', id);
  }
  return id;
}

export function getInitialUsername(): string {
  const saved = localStorage.getItem('mawabro_user');
  if (saved && saved !== 'MawaBro_User') {
    return saved;
  }
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  const defaultName = `Bro_${randomNum}`;
  localStorage.setItem('mawabro_user', defaultName);
  return defaultName;
}

function getStoredChannels(): ChannelInfo[] {
  try {
    const raw = localStorage.getItem('mawabro_channels');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Reset any static mock userCounts to 0 so no fake counts show
        return parsed.map((c: ChannelInfo) => ({ ...c, userCount: 0 }));
      }
    }
  } catch (e) {
    console.warn('Failed to parse channels from localStorage:', e);
  }
  return INITIAL_CHANNELS;
}

interface AppState {
  // Identity & Connection
  userId: string;
  username: string;
  serverUrl: string;
  token: string;
  setUsername: (name: string) => void;
  setServerUrl: (url: string) => void;
  setToken: (token: string) => void;

  // Channels & Groups
  channels: ChannelInfo[];
  currentChannel: ChannelInfo | null;
  activeRoom: any | null;
  isTransitioning: boolean;
  addChannel: (channel: ChannelInfo) => void;
  deleteChannel: (id: string) => void;
  setCurrentChannel: (channel: ChannelInfo | null) => void;
  setActiveRoom: (room: any | null) => void;
  setIsTransitioning: (transitioning: boolean) => void;
  switchChannel: (channel: ChannelInfo) => Promise<void>;

  // Media States
  isMuted: boolean;
  wasMicMuted: boolean;
  isDeafened: boolean;
  isVideoEnabled: boolean;
  isScreenSharing: boolean;
  toggleMute: () => void;
  toggleDeafen: () => void;
  toggleVideo: () => void;
  setIsScreenSharing: (sharing: boolean) => void;

  // Microphone Sensitivity & Gain (0.0 to 1.5)
  inputVolume: number;
  setInputVolume: (vol: number) => void;

  // Audio Device Selection
  selectedAudioInput: string;
  selectedAudioOutput: string;
  setSelectedAudioInput: (id: string) => void;
  setSelectedAudioOutput: (id: string) => void;

  // Per-User Volume Map (0% to 200%)
  participantVolumes: Record<string, number>;
  setParticipantVolume: (participantId: string, volume: number) => void;

  // Push to talk
  inputMode: InputMode;
  pttKey: string;
  isPttActive: boolean;
  setInputMode: (mode: InputMode) => void;
  setPttKey: (key: string) => void;
  setIsPttActive: (active: boolean) => void;

  // Screen Share Presets
  screenPreset: ScreenSharePreset;
  systemAudioEnabled: boolean;
  setScreenPreset: (preset: ScreenSharePreset) => void;
  setSystemAudioEnabled: (enabled: boolean) => void;

  // Soundboard
  soundPads: SoundPad[];
  soundboardVolume: number;
  soundboardMonitorVolume: number;
  addSoundPad: (pad: SoundPad) => void;
  removeSoundPad: (id: string) => void;
  setSoundboardVolume: (volume: number) => void;
  setSoundboardMonitorVolume: (volume: number) => void;

  // Group Music Player
  musicState: {
    trackUrl: string;
    isPlaying: boolean;
    currentTime: number;
    isHost: boolean;
    hostName: string;
    lastSyncedAt: number;
  };
  setMusicState: (update: Partial<AppState['musicState']>) => void;

  // AI Noise Suppression (RNNoise Wasm)
  isNoiseSuppressionEnabled: boolean;
  setIsNoiseSuppressionEnabled: (enabled: boolean) => void;

  // In-Game Voice Overlay
  isOverlayVisible: boolean;
  setIsOverlayVisible: (visible: boolean) => void;
  overlaySpeakers: Array<{ id: string; name: string; isSpeaking: boolean; isMuted: boolean; isLocal: boolean }>;
  setOverlaySpeakers: (speakers: Array<{ id: string; name: string; isSpeaking: boolean; isMuted: boolean; isLocal: boolean }>) => void;

  // UI Panels & In-Room Text Chat
  activePanel: 'chat' | 'soundboard' | 'music' | 'settings' | 'create_channel' | 'join_code' | null;
  setActivePanel: (panel: 'chat' | 'soundboard' | 'music' | 'settings' | 'create_channel' | 'join_code' | null) => void;
  isChatOpen: boolean;
  toggleChat: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  userId: getOrCreateUserId(),
  username: getInitialUsername(),
  serverUrl: import.meta.env.VITE_LIVEKIT_URL || 'wss://mawabro-voice-app-9aglw729.livekit.cloud',
  token: import.meta.env.VITE_LIVEKIT_TOKEN || '',
  setUsername: (username) => {
    localStorage.setItem('mawabro_user', username);
    set({ username });
  },
  setServerUrl: (serverUrl) => set({ serverUrl }),
  setToken: (token) => set({ token }),

  channels: getStoredChannels(),
  currentChannel: null,
  activeRoom: null,
  isTransitioning: false,
  setActiveRoom: (room) => set({ activeRoom: room }),
  addChannel: (channel) =>
    set((state) => {
      const updated = [...state.channels, channel];
      localStorage.setItem('mawabro_channels', JSON.stringify(updated));
      return { channels: updated };
    }),
  deleteChannel: (id) =>
    set((state) => {
      const updated = state.channels.filter((c) => c.id !== id);
      localStorage.setItem('mawabro_channels', JSON.stringify(updated));
      return {
        channels: updated,
        currentChannel: state.currentChannel?.id === id ? null : state.currentChannel,
      };
    }),
  setCurrentChannel: (channel) => set({ currentChannel: channel }),
  setIsTransitioning: (isTransitioning) => set({ isTransitioning }),
  switchChannel: async (channel) => {
    const { isTransitioning, currentChannel, activeRoom } = useAppStore.getState();
    if (isTransitioning) return;
    if (currentChannel?.id === channel.id) return;

    useAppStore.getState().setIsTransitioning(true);
    try {
      if (activeRoom) {
        audioEngine.playChime('leave');
        try {
          await activeRoom.disconnect();
        } catch (e) {
          console.warn('[RoomManager] Disconnect error during channel switch:', e);
        }
      }
      useAppStore.setState({ currentChannel: channel, isChatOpen: false });
    } finally {
      setTimeout(() => {
        useAppStore.getState().setIsTransitioning(false);
      }, 250);
    }
  },

  isMuted: false,
  wasMicMuted: false,
  isDeafened: false,
  isVideoEnabled: false,
  isScreenSharing: false,
  toggleMute: () =>
    set((state) => {
      const newMuted = !state.isMuted;
      audioEngine.setMicMuted(newMuted);
      audioEngine.playChime(newMuted ? 'mute' : 'unmute');
      return { isMuted: newMuted };
    }),
  toggleDeafen: () =>
    set((state) => {
      const willDeafen = !state.isDeafened;
      if (willDeafen) {
        audioEngine.playChime('mute');
        audioEngine.setMicMuted(true);
        return {
          isDeafened: true,
          wasMicMuted: state.isMuted,
          isMuted: true,
        };
      } else {
        audioEngine.playChime('unmute');
        audioEngine.setMicMuted(state.wasMicMuted);
        return {
          isDeafened: false,
          isMuted: state.wasMicMuted,
        };
      }
    }),
  toggleVideo: () => set((state) => ({ isVideoEnabled: !state.isVideoEnabled })),
  setIsScreenSharing: (isScreenSharing) => set({ isScreenSharing }),

  inputVolume: 1.0,
  setInputVolume: (inputVolume) => {
    audioEngine.setInputVolume(inputVolume);
    set({ inputVolume });
  },

  selectedAudioInput: localStorage.getItem('mawabro_audio_input') || '',
  selectedAudioOutput: localStorage.getItem('mawabro_audio_output') || '',
  setSelectedAudioInput: (id) => {
    localStorage.setItem('mawabro_audio_input', id);
    audioEngine.switchInputDevice(id);
    set({ selectedAudioInput: id });
  },
  setSelectedAudioOutput: (id) => {
    localStorage.setItem('mawabro_audio_output', id);
    set({ selectedAudioOutput: id });
  },

  participantVolumes: {},
  setParticipantVolume: (participantId, volume) =>
    set((state) => ({
      participantVolumes: { ...state.participantVolumes, [participantId]: volume },
    })),

  inputMode: 'voice_activity',
  pttKey: 'CapsLock',
  isPttActive: false,
  setInputMode: (inputMode) => set({ inputMode }),
  setPttKey: (pttKey) => set({ pttKey }),
  setIsPttActive: (isPttActive) => set({ isPttActive }),

  screenPreset: '1080p60',
  systemAudioEnabled: true,
  setScreenPreset: (screenPreset) => set({ screenPreset }),
  setSystemAudioEnabled: (systemAudioEnabled) => set({ systemAudioEnabled }),

  soundPads: DEFAULT_SOUNDS,
  soundboardVolume: 0.8,
  soundboardMonitorVolume: 0.5,
  addSoundPad: (pad) => set((state) => ({ soundPads: [...state.soundPads, pad] })),
  removeSoundPad: (id) =>
    set((state) => ({ soundPads: state.soundPads.filter((p) => p.id !== id) })),
  setSoundboardVolume: (soundboardVolume) => set({ soundboardVolume }),
  setSoundboardMonitorVolume: (soundboardMonitorVolume) => set({ soundboardMonitorVolume }),

  musicState: {
    trackUrl: 'https://www.youtube.com/watch?v=jfKfPfyJRdk',
    isPlaying: false,
    currentTime: 0,
    isHost: false,
    hostName: '',
    lastSyncedAt: Date.now(),
  },
  setMusicState: (update) =>
    set((state) => ({
      musicState: { ...state.musicState, ...update },
    })),

  isNoiseSuppressionEnabled: localStorage.getItem('mawabro_rnnoise') !== 'false',
  setIsNoiseSuppressionEnabled: (enabled) => {
    localStorage.setItem('mawabro_rnnoise', String(enabled));
    audioEngine.setNoiseSuppressionEnabled(enabled);
    set({ isNoiseSuppressionEnabled: enabled });
  },

  isOverlayVisible: false,
  setIsOverlayVisible: (isOverlayVisible) => set({ isOverlayVisible }),
  overlaySpeakers: [],
  setOverlaySpeakers: (overlaySpeakers) => set({ overlaySpeakers }),

  activePanel: null,
  setActivePanel: (activePanel) => set({ activePanel }),
  isChatOpen: false,
  toggleChat: () => set((state) => ({ isChatOpen: !state.isChatOpen })),
}));
