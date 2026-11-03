import React, { useState, useEffect } from 'react';
import {
  Mic,
  MicOff,
  Headphones,
  Monitor,
  PhoneOff,
  Radio,
  Music2,
  Signal,
  LogIn,
  MessageSquare,
  UserPlus,
  Check,
  Volume2,
  VolumeX,
  Gamepad2,
  Sparkles,
} from 'lucide-react';
import {
  LiveKitRoom,
  RoomAudioRenderer,
  useConnectionState,
  useRoomContext,
  useTracks,
} from '@livekit/components-react';
import {
  ConnectionState,
  LocalAudioTrack,
  RemoteParticipant,
  Participant,
  RoomEvent,
  Track,
} from 'livekit-client';
import { useAppStore } from '../store/useAppStore';
import { audioEngine } from '../services/audioEngine';
import { generateRoomToken } from '../services/livekitToken';
import { SCREEN_SHARE_PRESETS, SyncMessagePayload } from '../types';
import { ScreenShareModal } from './ScreenShareModal';
import { ScreenShareTheater } from './ScreenShareTheater';
import { Soundboard } from './Soundboard';
import { GroupMusicPlayer } from './GroupMusicPlayer';
import { ChatPanel } from './ChatPanel';

interface ParticipantDisplay {
  id: string;
  name: string;
  isSpeaking: boolean;
  isMuted: boolean;
  hasVideo: boolean;
  isLocal: boolean;
  remoteParticipant?: RemoteParticipant;
}

const ConnectionBadge: React.FC<{ state: ConnectionState }> = ({ state }) => {
  switch (state) {
    case ConnectionState.Connected:
      return (
        <span className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded bg-[#23a55a]/15 border border-[#23a55a]/40 text-[#23a55a]">
          <span className="w-2 h-2 rounded-full bg-[#23a55a] animate-pulse" />
          Connected
        </span>
      );
    case ConnectionState.Reconnecting:
      return (
        <span className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded bg-[#f0b232]/15 border border-[#f0b232]/40 text-[#f0b232]">
          <span className="w-2 h-2 rounded-full bg-[#f0b232] animate-ping" />
          Reconnecting
        </span>
      );
    case ConnectionState.Connecting:
      return (
        <span className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded bg-[#5865f2]/15 border border-[#5865f2]/40 text-[#5865f2]">
          <span className="w-2 h-2 rounded-full bg-[#5865f2] animate-pulse" />
          Connecting
        </span>
      );
    case ConnectionState.Disconnected:
    default:
      return (
        <span className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded bg-[#f23f43]/15 border border-[#f23f43]/40 text-[#f23f43]">
          <span className="w-2 h-2 rounded-full bg-[#f23f43]" />
          Disconnected
        </span>
      );
  }
};

const VoiceRoomInner: React.FC<{
  onJoinRoom: () => void;
  isJoining: boolean;
}> = ({ onJoinRoom, isJoining }) => {
  const room = useRoomContext();
  const connectionState = useConnectionState();

  const {
    currentChannel,
    setCurrentChannel,
    setActiveRoom,
    username,
    isMuted,
    toggleMute,
    isDeafened,
    toggleDeafen,
    inputMode,
    pttKey,
    isPttActive,
    screenPreset,
    systemAudioEnabled,
    activePanel,
    setActivePanel,
    isChatOpen,
    toggleChat,
    participantVolumes,
    setParticipantVolume,
    isOverlayVisible,
    setIsOverlayVisible,
    isNoiseSuppressionEnabled,
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

  const [participants, setParticipants] = useState<ParticipantDisplay[]>([]);
  const [localIsSpeaking, setLocalIsSpeaking] = useState(false);
  const [isScreenModalOpen, setIsScreenModalOpen] = useState(false);
  const [incomingSync, setIncomingSync] = useState<SyncMessagePayload | null>(null);
  const [copiedInvite, setCopiedInvite] = useState(false);
  const [activeVolumePopup, setActiveVolumePopup] = useState<string | null>(null);

  const isActuallyMuted = isMuted || (inputMode === 'push_to_talk' && !isPttActive);

  // Monitor real-time speaking energy from microphone
  useEffect(() => {
    if (isActuallyMuted) {
      setLocalIsSpeaking(false);
      return;
    }

    const interval = setInterval(() => {
      const speaking = audioEngine.isSpeaking();
      setLocalIsSpeaking((prev) => (prev !== speaking ? speaking : prev));
    }, 80);

    return () => clearInterval(interval);
  }, [isActuallyMuted]);

  // Sync activeRoom to store for single-click clean room transitions
  useEffect(() => {
    setActiveRoom(room);
    return () => {
      setActiveRoom(null);
    };
  }, [room, setActiveRoom]);

  // Synchronize active speakers with the Transparent In-Game Voice Overlay
  useEffect(() => {
    try {
      const channel = new BroadcastChannel('mawabro_overlay_channel');
      const payload = {
        channelName: currentChannel?.name || 'Voice Lounge',
        speakers: participants.map((p) => ({
          id: p.id,
          name: p.name,
          isSpeaking: p.isSpeaking,
          isMuted: p.isMuted,
          isLocal: p.isLocal,
        })),
      };
      channel.postMessage(payload);
      channel.close();

      import('@tauri-apps/api/core')
        .then(({ invoke }) => {
          invoke('emit_overlay_speakers', { speakers: payload.speakers }).catch(() => {});
        })
        .catch(() => {});
    } catch (_) {}
  }, [participants, currentChannel]);

  // Play upbeat chime upon room connection
  useEffect(() => {
    if (connectionState === ConnectionState.Connected) {
      audioEngine.playChime('join');
    }
  }, [connectionState]);

  // Query Camera and ScreenShare tracks with useTracks hook
  const tracks = useTracks([Track.Source.Camera, Track.Source.ScreenShare]);
  const screenShareTrackRef = tracks.find(
    (t) => t.source === Track.Source.ScreenShare && t.publication && !t.publication.isMuted
  );

  const isLocalSharing = room?.localParticipant?.isScreenShareEnabled ?? false;

  // Initialize Web Audio Engine
  useEffect(() => {
    let unmounted = false;
    audioEngine
      .initialize()
      .then(() => {
        if (!unmounted) {
          audioEngine.setMicMuted(isActuallyMuted);
        }
      })
      .catch((e) => console.log('[VoiceRoom] AudioEngine fallback:', e));

    return () => {
      unmounted = true;
    };
  }, []);

  useEffect(() => {
    audioEngine.setMicMuted(isActuallyMuted);
  }, [isActuallyMuted]);

  // Publish mixed audio track (mic + soundboard) once connected to LiveKit
  useEffect(() => {
    if (connectionState === ConnectionState.Connected && room) {
      const existing = room.localParticipant.getTrackPublication(Track.Source.Microphone);
      if (!existing) {
        const mixedTrack = audioEngine.getMixedTrack();
        if (mixedTrack) {
          const localAudioTrack = new LocalAudioTrack(mixedTrack);
          room.localParticipant
            .publishTrack(localAudioTrack, {
              name: 'microphone',
              source: Track.Source.Microphone,
            })
            .catch(console.error);
        }
      }
    }
  }, [connectionState, room]);

  // DataMessages handler for Group Music Sync
  useEffect(() => {
    if (!room) return;

    const handleData = (payload: Uint8Array) => {
      try {
        const str = new TextDecoder().decode(payload);
        const data = JSON.parse(str) as SyncMessagePayload;
        setIncomingSync(data);
      } catch (err) {
        console.error('Failed to parse sync data:', err);
      }
    };

    // Active speakers detection
    const handleSpeakers = (speakers: Participant[]) => {
      const speakerIds = new Set(speakers.map((s) => s.identity));
      const isLocalSpeakingFromRoom = speakers.some(
        (s) => s.isLocal || (room && s.identity === room.localParticipant.identity)
      );
      setParticipants((prev) =>
        prev.map((p) => ({
          ...p,
          isSpeaking: p.isLocal
            ? (isLocalSpeakingFromRoom || localIsSpeaking) && !isActuallyMuted
            : speakerIds.has(p.id),
        }))
      );
    };

    // Participants list updater
    const updateParticipants = () => {
      const list: ParticipantDisplay[] = [
        {
          id: 'local',
          name: `${username} (You)`,
          isSpeaking: localIsSpeaking && !isActuallyMuted,
          isMuted: isActuallyMuted,
          hasVideo: false,
          isLocal: true,
        },
      ];

      room.remoteParticipants.forEach((p: RemoteParticipant) => {
        const displayName = p.name || p.identity.split('_user_')[0] || p.identity;
        list.push({
          id: p.identity,
          name: displayName,
          isSpeaking: p.isSpeaking,
          isMuted: !p.isMicrophoneEnabled,
          hasVideo: p.isCameraEnabled,
          isLocal: false,
          remoteParticipant: p,
        });

        // Apply saved per-user volume if present
        const savedVol = participantVolumes[p.identity];
        if (savedVol !== undefined) {
          p.setVolume(savedVol / 100);
        }
      });

      setParticipants(list);
    };

    room.on(RoomEvent.DataReceived, handleData);
    room.on(RoomEvent.ActiveSpeakersChanged, handleSpeakers);
    room.on(RoomEvent.ParticipantConnected, updateParticipants);
    room.on(RoomEvent.ParticipantDisconnected, updateParticipants);
    room.on(RoomEvent.TrackMuted, updateParticipants);
    room.on(RoomEvent.TrackUnmuted, updateParticipants);
    room.on(RoomEvent.TrackSubscribed, updateParticipants);
    room.on(RoomEvent.TrackUnsubscribed, updateParticipants);

    updateParticipants();

    return () => {
      room.off(RoomEvent.DataReceived, handleData);
      room.off(RoomEvent.ActiveSpeakersChanged, handleSpeakers);
      room.off(RoomEvent.ParticipantConnected, updateParticipants);
      room.off(RoomEvent.ParticipantDisconnected, updateParticipants);
      room.off(RoomEvent.TrackMuted, updateParticipants);
      room.off(RoomEvent.TrackUnmuted, updateParticipants);
      room.off(RoomEvent.TrackSubscribed, updateParticipants);
      room.off(RoomEvent.TrackUnsubscribed, updateParticipants);
    };
  }, [room, username, isActuallyMuted, connectionState, participantVolumes]);

  // Update speaking state for local participant on speaking / mute / PTT change
  useEffect(() => {
    setParticipants((prev) =>
      prev.map((p) => {
        if (p.isLocal) {
          return {
            ...p,
            isMuted: isActuallyMuted,
            isSpeaking: localIsSpeaking && !isActuallyMuted,
          };
        }
        return p;
      })
    );
  }, [isActuallyMuted, localIsSpeaking]);

  // Screen Sharing Publisher with dynamic 4K or 1080p preset
  const handleStartScreenShare = async () => {
    if (!room) return;
    const config = SCREEN_SHARE_PRESETS[screenPreset] || SCREEN_SHARE_PRESETS['1080p60'];
    try {
      await room.localParticipant.setScreenShareEnabled(
        true,
        {
          audio: systemAudioEnabled,
          resolution: {
            width: config.width,
            height: config.height,
            frameRate: config.frameRate,
          },
          systemAudio: systemAudioEnabled ? 'include' : 'exclude',
        },
        {
          videoEncoding: {
            maxBitrate: config.maxBitrate,
            maxFramerate: config.frameRate,
          },
        }
      );
    } catch (err) {
      console.error('[ScreenShare] Error starting screen share:', err);
    }
  };

  const handleStopScreenShare = async () => {
    if (!room) return;
    try {
      await room.localParticipant.setScreenShareEnabled(false);
    } catch (err) {
      console.error('[ScreenShare] Error stopping screen share:', err);
    }
  };

  // Copy Room Invite Template
  const handleCopyInvite = () => {
    const roomName = currentChannel?.name || 'general-voice';
    const inviteTemplate = `🎮 Join my voice room on MawaBro!\nRoom: ${roomName}\nQuick-Join Code: ${roomName}`;
    navigator.clipboard.writeText(inviteTemplate);
    setCopiedInvite(true);
    setTimeout(() => setCopiedInvite(false), 2500);
  };

  const handlePublishSyncData = (payload: SyncMessagePayload) => {
    if (room && connectionState === ConnectionState.Connected) {
      const encoded = new TextEncoder().encode(JSON.stringify(payload));
      room.localParticipant.publishData(encoded, { reliable: true });
    }
    setIncomingSync(payload);
  };

  const handleParticipantVolumeChange = (id: string, vol: number, p?: RemoteParticipant) => {
    setParticipantVolume(id, vol);
    if (p) {
      p.setVolume(vol / 100);
    }
  };

  const activeScreenParticipant = screenShareTrackRef?.participant;
  const screenSharerName =
    activeScreenParticipant?.name ||
    activeScreenParticipant?.identity.split('_user_')[0] ||
    activeScreenParticipant?.identity ||
    'Squad Member';

  const getScreenShareBadge = () => {
    if (screenShareTrackRef?.participant.isLocal) {
      if (screenPreset === '4k60') return '4K 60FPS';
      if (screenPreset === '4k30') return '4K 30FPS';
      return '1080P 60FPS';
    }
    const settings = screenShareTrackRef?.publication?.videoTrack?.mediaStreamTrack?.getSettings?.();
    if (settings?.width && settings?.height) {
      if (settings.width >= 3000 || settings.height >= 1800) {
        return settings.frameRate && settings.frameRate > 35 ? '4K 60FPS' : '4K 30FPS';
      }
      if (settings.width >= 1600 || settings.height >= 900) {
        return settings.frameRate && settings.frameRate > 35 ? '1080P 60FPS' : '1080P 30FPS';
      }
      return `${settings.width}x${settings.height}`;
    }
    return screenPreset === '4k60' ? '4K 60FPS' : screenPreset === '4k30' ? '4K 30FPS' : '1080P 60FPS';
  };

  return (
    <div className="flex-1 flex overflow-hidden relative">
      {/* Main Room Center Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#313338]">
        {/* Top Header */}
        <div className="h-14 border-b border-[#232428] px-4 flex items-center justify-between bg-[#2b2d31]/80 backdrop-blur-xs z-10">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <ConnectionBadge state={connectionState} />
              <img
                src="/logo.png"
                alt="MawaBro"
                className="w-5 h-5 object-contain drop-shadow-[0_0_8px_rgba(56,189,248,0.5)]"
              />
              <h1 className="font-bold text-white text-sm flex items-center gap-1.5">
                {currentChannel?.name || 'Voice Lounge'}
              </h1>
            </div>

            {/* Invite Friends Button */}
            <button
              onClick={handleCopyInvite}
              className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-md transition ${
                copiedInvite
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                  : 'bg-[#1e1f22] text-[#949ba4] hover:text-white hover:bg-[#35373c] border border-[#3f4147]'
              }`}
              title="Copy Room Invite Template to Clipboard"
            >
              {copiedInvite ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Invite Copied!</span>
                </>
              ) : (
                <>
                  <UserPlus className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Invite Friends</span>
                </>
              )}
            </button>
          </div>

          <div className="flex items-center gap-3">
            {inputMode === 'push_to_talk' && (
              <div
                className={`px-2.5 py-1 rounded text-xs font-semibold font-mono flex items-center gap-1.5 transition ${
                  isPttActive
                    ? 'bg-[#23a55a] text-white ptt-active-glow'
                    : 'bg-[#1e1f22] text-[#949ba4] border border-[#3f4147]'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${isPttActive ? 'bg-white' : 'bg-[#949ba4]'}`} />
                PTT: {pttKey} {isPttActive ? '[TRANSMITTING]' : '[MUTED]'}
              </div>
            )}

            <div className="flex items-center gap-1 text-xs text-[#23a55a] font-mono bg-[#1e1f22] px-2.5 py-1 rounded border border-[#3f4147]">
              <Signal className="w-3.5 h-3.5" />
              <span>12ms</span>
            </div>

            {/* RNNoise AI Noise Filter Status Badge */}
            {isNoiseSuppressionEnabled && (
              <span className="hidden lg:flex items-center gap-1 text-[11px] font-mono font-bold text-cyan-300 bg-cyan-950/40 border border-cyan-500/30 px-2 py-1 rounded-md shadow-xs">
                <Sparkles className="w-3 h-3 text-cyan-400" />
                RNNoise AI
              </span>
            )}

            {/* In-Game Overlay Toggle Button */}
            <button
              onClick={handleToggleOverlay}
              className={`p-2 rounded-lg transition relative flex items-center gap-1.5 text-xs font-semibold ${
                isOverlayVisible
                  ? 'bg-purple-500/25 text-purple-300 border border-purple-500/40 shadow-[0_0_10px_rgba(168,85,247,0.2)]'
                  : 'bg-[#1e1f22] text-[#949ba4] hover:text-white hover:bg-[#35373c] border border-[#3f4147]'
              }`}
              title="Toggle Transparent In-Game Voice Overlay"
            >
              <Gamepad2 className="w-4 h-4 text-purple-400" />
              <span className="hidden md:inline">Overlay</span>
            </button>

            {/* Toggle Chat Button */}
            <button
              onClick={toggleChat}
              className={`p-2 rounded-lg transition relative ${
                isChatOpen
                  ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 shadow-sm'
                  : 'bg-[#1e1f22] text-[#949ba4] hover:text-white hover:bg-[#35373c] border border-[#3f4147]'
              }`}
              title="Toggle In-Room Text Chat"
            >
              <MessageSquare className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tiles Area */}
        <div className="flex-1 p-4 overflow-y-auto flex flex-col gap-4">
          {/* Auto-maximized Theater Screen Share Feed with Interactive Hover Controls */}
          {screenShareTrackRef && (
            <ScreenShareTheater
              trackRef={screenShareTrackRef}
              sharerName={screenSharerName}
              screenBadge={getScreenShareBadge()}
              isLocal={Boolean(screenShareTrackRef.participant.isLocal)}
              onStopShare={handleStopScreenShare}
            />
          )}

          {/* Participant Audio Tiles Grid */}
          <div
            className={`grid gap-3 flex-1 ${
              screenShareTrackRef
                ? 'grid-cols-2 sm:grid-cols-4 max-h-44'
                : participants.length <= 2
                ? 'grid-cols-1 sm:grid-cols-2'
                : participants.length <= 4
                ? 'grid-cols-2'
                : 'grid-cols-2 sm:grid-cols-3'
            }`}
          >
            {participants.map((participant) => {
              const currentVol = participantVolumes[participant.id] ?? 100;

              return (
                <div
                  key={participant.id}
                  className={`relative rounded-xl overflow-hidden bg-[#2b2d31] border border-[#383a40] flex flex-col items-center justify-center p-4 transition duration-150 min-h-[160px] group ${
                    participant.isSpeaking ? 'speaker-glow border-[#23a55a]' : ''
                  }`}
                >
                  <div className="relative mb-2">
                    <div
                      className={`w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg ${
                        participant.isLocal
                          ? 'bg-gradient-to-br from-cyan-500 to-blue-600'
                          : 'bg-gradient-to-br from-[#4e5058] to-[#35373c]'
                      }`}
                    >
                      {participant.name.substring(0, 2).toUpperCase()}
                    </div>

                    {participant.isSpeaking && (
                      <span className="absolute -inset-1 rounded-full border-2 border-[#23a55a] animate-ping" />
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 text-xs font-semibold text-white truncate max-w-full">
                    <span className="truncate">{participant.name}</span>
                    {participant.isMuted && (
                      <span className="p-0.5 rounded bg-[#f23f43]/20 text-[#f23f43]" title="Muted">
                        <MicOff className="w-3 h-3" />
                      </span>
                    )}
                  </div>

                  {participant.isLocal ? (
                    <span className="text-[10px] text-[#949ba4] font-mono mt-0.5">
                      {inputMode === 'push_to_talk' ? `PTT [${pttKey}]` : 'Open Mic'}
                    </span>
                  ) : (
                    /* Per-User Volume Control Button & Popup */
                    <div className="relative mt-1">
                      <button
                        onClick={() =>
                          setActiveVolumePopup(activeVolumePopup === participant.id ? null : participant.id)
                        }
                        className="flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded bg-[#1e1f22] text-[#949ba4] hover:text-white hover:bg-[#35373c] border border-[#3f4147] transition"
                        title="Adjust participant volume"
                      >
                        {currentVol === 0 ? (
                          <VolumeX className="w-3 h-3 text-rose-400" />
                        ) : (
                          <Volume2 className="w-3 h-3 text-cyan-400" />
                        )}
                        <span>{currentVol}%</span>
                      </button>

                      {activeVolumePopup === participant.id && (
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 p-3 bg-[#1e1f22] border border-[#3f4147] rounded-xl shadow-2xl z-30 w-44 select-none animate-in fade-in zoom-in-95">
                          <div className="flex items-center justify-between text-xs text-white mb-2">
                            <span className="font-bold">User Volume</span>
                            <span className="font-mono text-cyan-400">{currentVol}%</span>
                          </div>
                          <input
                            type="range"
                            min="0"
                            max="200"
                            step="5"
                            value={currentVol}
                            onChange={(e) =>
                              handleParticipantVolumeChange(
                                participant.id,
                                Number(e.target.value),
                                participant.remoteParticipant
                              )
                            }
                            className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-[#35373c] rounded-lg"
                          />
                          <div className="flex justify-between text-[10px] text-[#949ba4] mt-1 font-mono">
                            <span>0%</span>
                            <span>100%</span>
                            <span>200%</span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Dynamic Sliding Panel for Soundboard / Group Music */}
          {activePanel === 'soundboard' && (
            <div className="pt-2">
              <Soundboard />
            </div>
          )}

          {activePanel === 'music' && (
            <div className="pt-2">
              <GroupMusicPlayer
                onPublishSyncData={handlePublishSyncData}
                incomingSyncPayload={incomingSync}
              />
            </div>
          )}
        </div>

        {/* Floating Bottom Media Dock (Discord-style) */}
        <div className="h-16 bg-[#2b2d31] border-t border-[#232428] px-6 flex items-center justify-between z-20">
          <div className="flex items-center gap-3">
            {/* Join Room Button (if disconnected) */}
            {connectionState === ConnectionState.Disconnected && (
              <button
                onClick={onJoinRoom}
                disabled={isJoining}
                className="flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-xs bg-cyan-600 hover:bg-cyan-500 text-white transition shadow-md"
              >
                <LogIn className="w-4 h-4" />
                <span>{isJoining ? 'Minting Token...' : 'Join Room'}</span>
              </button>
            )}

            {/* Mute Mic Button */}
            <button
              onClick={toggleMute}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-xs transition shadow-sm ${
                isActuallyMuted
                  ? 'bg-[#f23f43] text-white hover:bg-[#d83a3e]'
                  : 'bg-[#35373c] text-white hover:bg-[#3f4147]'
              }`}
            >
              {isActuallyMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4 text-[#23a55a]" />}
              <span>{isActuallyMuted ? 'Muted' : 'Unmuted'}</span>
            </button>

            {/* Deafen Button */}
            <button
              onClick={toggleDeafen}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-xs transition shadow-sm ${
                isDeafened
                  ? 'bg-[#f23f43] text-white hover:bg-[#d83a3e]'
                  : 'bg-[#35373c] text-[#dbdee1] hover:bg-[#3f4147] hover:text-white'
              }`}
              title="Deafen (Mute both output audio & mic)"
            >
              <Headphones className="w-4 h-4" />
              <span>{isDeafened ? 'Deafened' : 'Deafen'}</span>
            </button>

            {/* Screen Share Trigger */}
            <button
              onClick={() => {
                if (isLocalSharing) {
                  handleStopScreenShare();
                } else {
                  setIsScreenModalOpen(true);
                }
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-xs transition shadow-sm ${
                isLocalSharing
                  ? 'bg-[#23a55a] text-white hover:bg-[#1f934f]'
                  : 'bg-[#35373c] text-[#dbdee1] hover:bg-[#3f4147] hover:text-white'
              }`}
            >
              <Monitor className="w-4 h-4" />
              <span>{isLocalSharing ? 'Stop Screen' : 'Share Screen (4K/1080p)'}</span>
            </button>
          </div>

          {/* Middle Quick Tabs */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActivePanel(activePanel === 'soundboard' ? null : 'soundboard')}
              className={`p-2.5 rounded-lg transition ${
                activePanel === 'soundboard'
                  ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 shadow-sm'
                  : 'bg-[#35373c] text-[#949ba4] hover:text-white hover:bg-[#3f4147]'
              }`}
              title="Toggle Soundboard"
            >
              <Radio className="w-4 h-4" />
            </button>

            <button
              onClick={() => setActivePanel(activePanel === 'music' ? null : 'music')}
              className={`p-2.5 rounded-lg transition ${
                activePanel === 'music'
                  ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 shadow-sm'
                  : 'bg-[#35373c] text-[#949ba4] hover:text-white hover:bg-[#3f4147]'
              }`}
              title="Toggle Synchronized Music Player"
            >
              <Music2 className="w-4 h-4" />
            </button>
          </div>

          {/* Disconnect Button */}
          <div>
            <button
              onClick={async () => {
                audioEngine.playChime('leave');
                if (room) {
                  await room.disconnect();
                }
                setCurrentChannel(null);
              }}
              className="flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-xs bg-[#f23f43] hover:bg-[#d83a3e] text-white transition shadow-md"
            >
              <PhoneOff className="w-4 h-4" />
              <span>Disconnect</span>
            </button>
          </div>
        </div>
      </div>

      {/* Expandable In-Room Chat Drawer */}
      {isChatOpen && <ChatPanel onClose={() => toggleChat()} />}

      {/* Screen Share Configuration Modal */}
      <ScreenShareModal
        isOpen={isScreenModalOpen}
        onClose={() => setIsScreenModalOpen(false)}
        onStartShare={handleStartScreenShare}
      />
    </div>
  );
};

export const VoiceRoom: React.FC = () => {
  const { currentChannel, username, userId, serverUrl, isDeafened } = useAppStore();
  const [token, setToken] = useState<string>('');
  const [isJoining, setIsJoining] = useState<boolean>(false);
  const [shouldConnect, setShouldConnect] = useState<boolean>(true);

  const livekitUrl = (import.meta.env.VITE_LIVEKIT_URL as string) || serverUrl;

  const handleJoin = async () => {
    if (!currentChannel) return;
    setIsJoining(true);
    try {
      const roomName = currentChannel.id || currentChannel.name;
      const identity = `${username}_${userId}`;
      const generatedToken = await generateRoomToken(roomName, username, identity);
      setToken(generatedToken);
      setShouldConnect(true);
    } catch (err) {
      console.error('[LiveKit Cloud] Failed to generate token:', err);
    } finally {
      setIsJoining(false);
    }
  };

  useEffect(() => {
    handleJoin();
  }, [currentChannel?.id, username, userId]);

  return (
    <LiveKitRoom
      serverUrl={livekitUrl}
      token={token}
      connect={shouldConnect && Boolean(token)}
      audio={false}
      video={false}
      onDisconnected={() => setShouldConnect(false)}
      className="flex-1 flex flex-col h-screen bg-[#313338] overflow-hidden select-none relative"
    >
      {/* Bug 4 Fixed: Remote audio muted automatically when Deafened */}
      <RoomAudioRenderer muted={isDeafened} />
      <VoiceRoomContent onJoinRoom={handleJoin} isJoining={isJoining} />
    </LiveKitRoom>
  );
};

const VoiceRoomContent = VoiceRoomInner;
