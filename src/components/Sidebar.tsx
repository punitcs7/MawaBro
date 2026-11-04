import React from 'react';
import {
  Volume2,
  Hash,
  Mic,
  MicOff,
  Headphones,
  Settings,
  Music2,
  Radio,
  Plus,
  Compass,
  Trash2,
  KeyRound,
  Loader2,
  Gamepad2,
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

export const Sidebar: React.FC = () => {
  const {
    username,
    channels,
    deleteChannel,
    currentChannel,
    switchChannel,
    setCurrentChannel,
    isTransitioning,
    isMuted,
    isDeafened,
    toggleMute,
    toggleDeafen,
    inputMode,
    isPttActive,
    pttKey,
    setActivePanel,
    activePanel,
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

  const voiceChannels = channels.filter((c) => c.type === 'voice');
  const textChannels = channels.filter((c) => c.type === 'text');

  const isActuallyMuted = isMuted || (inputMode === 'push_to_talk' && !isPttActive);

  return (
    <div className="flex h-screen select-none">
      {/* Server Guild Icons Bar (Left-most) */}
      <div className="w-[72px] bg-[#1e1f22] flex flex-col items-center py-3 space-y-2 border-r border-[#141517] z-20">
        <button
          onClick={() => setCurrentChannel(null)}
          className="relative group w-12 h-12 rounded-[24px] hover:rounded-[16px] bg-gradient-to-br from-[#1e1f22] to-[#2b2d31] hover:from-[#232428] hover:to-[#313338] flex items-center justify-center p-1.5 transition-all duration-200 shadow-xl border border-cyan-500/30 hover:border-cyan-400"
          title="MawaBro Headquarters (Home)"
        >
          <img
            src="/logo.png"
            alt="MawaBro Logo"
            className="w-full h-full object-contain drop-shadow-[0_0_10px_rgba(56,189,248,0.7)] group-hover:scale-110 transition duration-200"
          />
          <div className="absolute left-0 w-1 h-2 bg-white rounded-r group-hover:h-8 transition-all duration-200 -translate-x-3 group-hover:-translate-x-1" />
        </button>

        <div className="w-8 h-[2px] bg-[#35373c] rounded my-1" />

        {/* Create Channel Quick Button */}
        <button
          onClick={() => setActivePanel('create_channel')}
          className="w-12 h-12 rounded-[24px] hover:rounded-[16px] bg-[#2b2d31] hover:bg-cyan-600 flex items-center justify-center text-[#dbdee1] hover:text-white transition-all duration-200 group"
          title="Create New Channel"
        >
          <Plus className="w-6 h-6" />
        </button>

        {/* Join via Code Quick Button */}
        <button
          onClick={() => setActivePanel('join_code')}
          className="w-12 h-12 rounded-[24px] hover:rounded-[16px] bg-[#2b2d31] hover:bg-fuchsia-600 flex items-center justify-center text-[#dbdee1] hover:text-white transition-all duration-200 group"
          title="Join via Code / Invite Link"
        >
          <KeyRound className="w-5 h-5" />
        </button>

        <button
          className="w-12 h-12 rounded-[24px] hover:rounded-[16px] bg-[#2b2d31] hover:bg-[#5865f2] flex items-center justify-center text-[#dbdee1] hover:text-white transition-all duration-200 group"
          title="Discover Public Rooms"
        >
          <Compass className="w-6 h-6" />
        </button>
      </div>

      {/* Channels Sidebar */}
      <div className="w-60 bg-[#2b2d31] flex flex-col h-full border-r border-[#1f2023]">
        {/* Workspace Brand Header */}
        <div
          onClick={() => setCurrentChannel(null)}
          className="h-14 px-4 border-b border-[#1f2023] flex items-center justify-between font-semibold text-white shadow-xs hover:bg-[#35373c]/40 cursor-pointer transition"
        >
          <span className="truncate flex items-center gap-2">
            <img
              src="/logo.png"
              alt="MawaBro"
              className="w-5 h-5 object-contain drop-shadow-[0_0_8px_rgba(56,189,248,0.6)]"
            />
            <span className="font-bold tracking-tight text-white text-sm">MawaBro HQ</span>
          </span>
          <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-mono font-bold tracking-wide border border-cyan-500/30">
            v1.8.3
          </span>
        </div>

        {/* Channels List with Improved Clear Hierarchy */}
        <div className="flex-1 overflow-y-auto px-2 py-4 space-y-6">
          {/* GROUP 1: WORKSPACES (Voice Lounges) */}
          <div>
            <div className="px-2 mb-2 flex items-center justify-between">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#c4c9d0]">
                Workspaces
              </span>
              <button
                onClick={() => setActivePanel('create_channel')}
                className="p-1 rounded hover:bg-[#35373c] hover:text-white transition text-[#949ba4]"
                title="Create Workspace / Voice Lounge"
              >
                <Plus className="w-3.5 h-3.5 text-cyan-400" />
              </button>
            </div>

            <div className="space-y-1">
              {voiceChannels.map((channel) => {
                const isActive = currentChannel?.id === channel.id;
                return (
                  <div
                    key={channel.id}
                    className={`group relative w-full flex items-center justify-between pl-3 pr-2 py-2 rounded-lg text-sm transition ${
                      isActive
                        ? 'bg-[#35373c] text-white font-semibold shadow-xs'
                        : 'text-[#dbdee1] hover:bg-[#35373c]/60 hover:text-white'
                    } ${isTransitioning ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
                    onClick={() => {
                      if (isTransitioning) return;
                      switchChannel(channel);
                    }}
                  >
                    {/* Strengthened Active State: Vertical Neon Indicator */}
                    {isActive && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-cyan-400 rounded-r shadow-[0_0_10px_rgba(6,182,212,0.9)]" />
                    )}

                    <div className="flex items-center gap-2 truncate">
                      {isTransitioning && isActive ? (
                        <Loader2 className="w-4 h-4 animate-spin text-cyan-400 shrink-0" />
                      ) : (
                        <Volume2
                          className={`w-4 h-4 shrink-0 transition ${
                            isActive
                              ? 'text-cyan-400 drop-shadow-[0_0_6px_rgba(6,182,212,0.8)]'
                              : 'text-[#949ba4] group-hover:text-cyan-300'
                          }`}
                        />
                      )}
                      <span className="truncate">{channel.name}</span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {channel.isCustom && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteChannel(channel.id);
                          }}
                          className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-rose-500/20 text-[#949ba4] hover:text-rose-400 transition"
                          title="Delete Channel"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {/* Live Activity Badge (only rendered if users are actively in the channel) */}
                      {channel.userCount && channel.userCount > 0 ? (
                        <span className="flex items-center gap-1 text-[11px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          <span>{channel.userCount}</span>
                        </span>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* GROUP 2: CHANNELS (Text Rooms) */}
          <div>
            <div className="px-2 mb-2 flex items-center justify-between">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#c4c9d0]">
                Channels
              </span>
              <button
                onClick={() => setActivePanel('create_channel')}
                className="p-1 rounded hover:bg-[#35373c] hover:text-white transition text-[#949ba4]"
                title="Create Text Channel"
              >
                <Plus className="w-3.5 h-3.5 text-cyan-400" />
              </button>
            </div>

            <div className="space-y-1">
              {textChannels.map((channel) => {
                const isActive = currentChannel?.id === channel.id;
                return (
                  <div
                    key={channel.id}
                    onClick={() => setCurrentChannel(channel)}
                    className={`group relative w-full flex items-center justify-between pl-3 pr-2 py-2 rounded-lg text-sm transition cursor-pointer ${
                      isActive
                        ? 'bg-[#35373c] text-white font-semibold shadow-xs'
                        : 'text-[#dbdee1] hover:bg-[#35373c]/60 hover:text-white'
                    }`}
                  >
                    {isActive && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-cyan-400 rounded-r shadow-[0_0_10px_rgba(6,182,212,0.9)]" />
                    )}

                    <div className="flex items-center gap-2 truncate">
                      <Hash
                        className={`w-4 h-4 shrink-0 transition ${
                          isActive ? 'text-cyan-400' : 'text-[#949ba4] group-hover:text-cyan-300'
                        }`}
                      />
                      <span className="truncate">{channel.name}</span>
                    </div>

                    {channel.isCustom && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteChannel(channel.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-rose-500/20 text-[#949ba4] hover:text-rose-400 transition"
                        title="Delete Channel"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* GROUP 3: SHORTCUTS */}
          <div className="pt-2 border-t border-[#35373c]/60">
            <div className="px-2 mb-2">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#c4c9d0]">
                Shortcuts
              </span>
            </div>

            <div className="space-y-1">
              <button
                onClick={() => setActivePanel('join_code')}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition ${
                  activePanel === 'join_code'
                    ? 'bg-fuchsia-500/20 text-fuchsia-300 font-semibold border border-fuchsia-500/40'
                    : 'text-[#dbdee1] hover:bg-[#35373c]/60 hover:text-white'
                }`}
              >
                <KeyRound className="w-4 h-4 text-fuchsia-400 shrink-0" />
                <span className="truncate">Join with Code / Invite</span>
              </button>

              <button
                onClick={() => setActivePanel(activePanel === 'soundboard' ? null : 'soundboard')}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition ${
                  activePanel === 'soundboard'
                    ? 'bg-cyan-500/20 text-cyan-300 font-semibold border border-cyan-500/40'
                    : 'text-[#dbdee1] hover:bg-[#35373c]/60 hover:text-white'
                }`}
              >
                <Radio className="w-4 h-4 text-cyan-400 shrink-0" />
                <span className="truncate">Local Soundboard</span>
              </button>

              <button
                onClick={() => setActivePanel(activePanel === 'music' ? null : 'music')}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition ${
                  activePanel === 'music'
                    ? 'bg-cyan-500/20 text-cyan-300 font-semibold border border-cyan-500/40'
                    : 'text-[#dbdee1] hover:bg-[#35373c]/60 hover:text-white'
                }`}
              >
                <Music2 className="w-4 h-4 text-cyan-400 shrink-0" />
                <span className="truncate">Group Music Sync</span>
              </button>

              <button
                onClick={handleToggleOverlay}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition ${
                  isOverlayVisible
                    ? 'bg-purple-500/20 text-purple-300 font-semibold border border-purple-500/40'
                    : 'text-[#dbdee1] hover:bg-[#35373c]/60 hover:text-white'
                }`}
              >
                <Gamepad2 className="w-4 h-4 text-purple-400 shrink-0" />
                <span className="truncate">In-Game Overlay ({isOverlayVisible ? 'ON' : 'OFF'})</span>
              </button>

              <button
                onClick={() => setActivePanel(activePanel === 'settings' ? null : 'settings')}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition ${
                  activePanel === 'settings'
                    ? 'bg-cyan-500/20 text-cyan-300 font-semibold border border-cyan-500/40'
                    : 'text-[#dbdee1] hover:bg-[#35373c]/60 hover:text-white'
                }`}
              >
                <Settings className="w-4 h-4 text-cyan-400 shrink-0" />
                <span className="truncate">Voice & Audio Settings</span>
              </button>
            </div>
          </div>
        </div>

        {/* Current Active Channel Status Bar */}
        {currentChannel && (
          <div className="px-3 py-2.5 bg-[#232428] border-t border-[#1f2023] flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 truncate">
              <span className="w-2.5 h-2.5 rounded-full bg-[#23a55a] animate-pulse" />
              <div>
                <p className="font-bold text-[#23a55a] truncate leading-tight">Voice Connected</p>
                <p className="text-[#dbdee1] text-[11px] truncate leading-tight">{currentChannel.name}</p>
              </div>
            </div>
            <button
              onClick={() => setCurrentChannel(null)}
              className="text-[#f23f43] hover:underline text-[11px] font-semibold"
            >
              Disconnect
            </button>
          </div>
        )}

        {/* User Profile Bar (Bottom) */}
        <div className="h-[56px] bg-[#232428] px-2.5 flex items-center justify-between border-t border-[#1f2023]">
          <div
            onClick={() => setActivePanel('settings')}
            className="flex items-center gap-2.5 min-w-0 pr-1 cursor-pointer hover:bg-[#35373c]/50 p-1.5 rounded-lg transition"
            title="Click to open settings"
          >
            <div className="relative shrink-0">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white font-bold text-sm shadow-md">
                {username.substring(0, 2).toUpperCase()}
              </div>
              <div
                className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-[#232428] ${
                  isActuallyMuted ? 'bg-[#f23f43]' : 'bg-[#23a55a]'
                }`}
              />
            </div>
            <div className="truncate">
              <p className="text-sm font-semibold text-white leading-tight truncate hover:underline">{username}</p>
              <p className="text-[11px] text-[#b5bac1] leading-tight truncate">
                {inputMode === 'push_to_talk' ? `PTT [${pttKey}]` : 'Voice Activity'}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-0.5 text-[#b5bac1]">
            <button
              onClick={toggleMute}
              className={`p-1.5 rounded-lg hover:bg-[#35373c] hover:text-white transition ${
                isActuallyMuted ? 'text-[#f23f43]' : ''
              }`}
              title={isActuallyMuted ? 'Unmute' : 'Mute'}
            >
              {isActuallyMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>

            <button
              onClick={toggleDeafen}
              className={`p-1.5 rounded-lg hover:bg-[#35373c] hover:text-white transition ${
                isDeafened ? 'text-[#f23f43]' : ''
              }`}
              title={isDeafened ? 'Undeafen' : 'Deafen'}
            >
              <Headphones className="w-4 h-4" />
            </button>

            <button
              onClick={() => setActivePanel(activePanel === 'settings' ? null : 'settings')}
              className="p-1.5 rounded-lg hover:bg-[#35373c] hover:text-white transition"
              title="User Settings"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
