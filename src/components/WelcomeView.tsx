import React, { useState } from 'react';
import {
  Volume2,
  Monitor,
  Music,
  Shield,
  Zap,
  KeyRound,
  Plus,
  Search,
  Bell,
  Settings,
  Signal,
  ArrowRight,
  Headphones,
  Sliders,
  Sparkles,
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

export const WelcomeView: React.FC = () => {
  const {
    channels,
    setCurrentChannel,
    setActivePanel,
    username,
    inputMode,
    pttKey,
    activeRoom,
  } = useAppStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);

  const voiceChannels = channels.filter((c) => c.type === 'voice');

  // Filter channels based on quick search
  const filteredChannels = searchQuery.trim()
    ? channels.filter((c) => c.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : voiceChannels.slice(0, 3);

  const handleJoinPrimary = () => {
    const primary = voiceChannels[0] || { id: 'lounge', name: 'General Lounge', type: 'voice' };
    setCurrentChannel(primary);
  };

  return (
    <div className="flex-1 flex flex-col h-screen bg-[#1e1f22] select-none overflow-hidden">
      {/* 1. Compact, Full-Featured Top Bar */}
      <div className="h-14 border-b border-[#2b2d31] px-5 flex items-center justify-between bg-[#232428]/90 backdrop-blur-md z-20 shrink-0">
        {/* Workspace Brand Identity */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-white text-sm tracking-tight flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
              MawaBro HQ
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 font-mono font-bold border border-cyan-500/30">
              PUBLIC
            </span>
          </div>
        </div>

        {/* Global Search Bar */}
        <div className="flex-1 max-w-md mx-6 hidden md:block">
          <div className="relative flex items-center">
            <Search className="w-4 h-4 text-[#949ba4] absolute left-3 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search channels, rooms, or squad members... (Ctrl+K)"
              className="w-full pl-9 pr-14 py-1.5 rounded-lg bg-[#1e1f22] border border-[#3f4147] text-xs text-white placeholder-[#80848e] focus:outline-none focus:border-cyan-500/80 transition"
            />
            <kbd className="absolute right-2 px-1.5 py-0.5 rounded bg-[#2b2d31] border border-[#3f4147] text-[10px] text-[#949ba4] font-mono">
              Ctrl+K
            </kbd>
          </div>
        </div>

        {/* Top Right Utilities: Status, Notifications, Settings, Profile */}
        <div className="flex items-center gap-3">
          {/* Connection Status Badge */}
          <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-mono bg-[#1e1f22] px-2.5 py-1 rounded-md border border-[#35373c]">
            <Signal className="w-3.5 h-3.5" />
            <span>Cloud SFU • 12ms</span>
          </div>

          {/* Notifications Flyout Trigger */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-1.5 rounded-lg text-[#b5bac1] hover:text-white hover:bg-[#35373c] transition relative"
              title="Recent Activity & Notifications"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-cyan-400 ring-2 ring-[#232428] animate-pulse" />
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-72 bg-[#2b2d31] border border-[#3f4147] rounded-xl shadow-2xl p-3 z-30 animate-in fade-in zoom-in-95">
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#3f4147]">
                  <span className="text-xs font-bold text-white">Squad Activity</span>
                  <span className="text-[10px] text-cyan-400 font-mono">Real-time</span>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="p-2 rounded-lg bg-[#1e1f22] border border-[#35373c]">
                    <p className="font-semibold text-white">Voice & Text Ready</p>
                    <p className="text-[11px] text-[#b5bac1]">LiveKit SFU 48kHz Opus channels active.</p>
                  </div>
                  <div className="p-2 rounded-lg bg-[#1e1f22] border border-[#35373c]">
                    <p className="font-semibold text-white">In-Room Text Chat</p>
                    <p className="text-[11px] text-[#b5bac1]">New message preview cards enabled.</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Settings Shortcut */}
          <button
            onClick={() => setActivePanel('settings')}
            className="p-1.5 rounded-lg text-[#b5bac1] hover:text-white hover:bg-[#35373c] transition"
            title="Open Audio & PTT Settings"
          >
            <Settings className="w-4 h-4" />
          </button>

          {/* User Profile Mini-Chip */}
          <div
            onClick={() => setActivePanel('settings')}
            className="flex items-center gap-2 pl-2 border-l border-[#35373c] cursor-pointer hover:opacity-90 transition"
            title="Logged in as"
          >
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white font-bold text-xs shadow-md">
              {username.substring(0, 2).toUpperCase()}
            </div>
            <div className="hidden lg:block text-left">
              <p className="text-xs font-bold text-white leading-tight truncate max-w-[100px]">{username}</p>
              <p className="text-[10px] text-emerald-400 leading-tight">Online</p>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Main Scrollable Command Center */}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
        <div className="max-w-5xl mx-auto space-y-6">
          {/* Hero Command Banner */}
          <div className="relative rounded-2xl bg-gradient-to-b from-[#2b2d31] to-[#232428] border border-[#383a40] p-6 lg:p-8 shadow-xl overflow-hidden">
            {/* Ambient Cyber Neon Background Glow */}
            <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 rounded-full bg-fuchsia-500/10 blur-3xl pointer-events-none" />

            <div className="relative flex flex-col md:flex-row items-center gap-6 justify-between">
              {/* Left Column: Brand Logo + Clear Three-Tier Typography */}
              <div className="flex items-center gap-5 text-left">
                <div className="relative group shrink-0">
                  <div className="absolute -inset-2 bg-gradient-to-r from-cyan-500 to-fuchsia-500 rounded-2xl blur-md opacity-60 group-hover:opacity-90 transition duration-300" />
                  <div className="relative w-20 h-20 p-2 rounded-xl bg-[#1e1f22] border border-cyan-500/50 flex items-center justify-center shadow-2xl">
                    <img
                      src="/logo.png"
                      alt="MawaBro"
                      className="w-full h-full object-contain drop-shadow-[0_0_12px_rgba(56,189,248,0.8)]"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-mono uppercase tracking-wider shadow-sm">
                      MawaBro v1.8.5
                    </span>
                    <span className="text-xs text-cyan-400 font-semibold flex items-center gap-1">
                      <Zap className="w-3.5 h-3.5" /> High Performance
                    </span>
                  </div>

                  {/* Level 1: Large Page Title */}
                  <h1 className="text-2xl lg:text-3xl font-extrabold text-white tracking-tight">
                    Squad Command Center
                  </h1>

                  {/* Level 2: Medium Section Heading */}
                  <p className="text-sm font-semibold text-[#dbdee1]">
                    Ultra-low latency voice, 4K 60FPS screen share & collaborative audio.
                  </p>

                  {/* Level 3: Small Supporting Description */}
                  <p className="text-xs text-[#b5bac1] leading-relaxed max-w-xl">
                    Zero-cost Discord alternative powered by Tauri 2.0, driverless Web Audio mixing, and LiveKit WebRTC SFU.
                  </p>
                </div>
              </div>

              {/* Right Column: Clear Action Hierarchy with Dominant Primary Button */}
              <div className="flex flex-col items-center md:items-end gap-2 shrink-0">
                <div className="flex items-center gap-3">
                  {/* Dominant Primary Button */}
                  <button
                    onClick={handleJoinPrimary}
                    className="flex items-center gap-2.5 px-6 py-3 rounded-xl font-bold text-sm bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-blue-500 text-white transition-all shadow-[0_0_20px_rgba(6,182,212,0.4)] hover:shadow-[0_0_30px_rgba(6,182,212,0.6)] transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
                  >
                    <Volume2 className="w-5 h-5 text-cyan-200" />
                    <span>Join a Voice Channel</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  {/* Secondary Action */}
                  <button
                    onClick={() => setActivePanel('create_channel')}
                    className="flex items-center gap-2 px-4 py-3 rounded-xl font-semibold text-sm bg-[#1e1f22] hover:bg-[#35373c] border border-[#3f4147] hover:border-cyan-500/50 text-[#dbdee1] hover:text-white transition shadow-sm"
                  >
                    <Plus className="w-4 h-4 text-cyan-400" />
                    <span>Create Channel</span>
                  </button>
                </div>

                {/* Sub-Link below main button */}
                <button
                  onClick={() => setActivePanel('join_code')}
                  className="text-xs text-[#b5bac1] hover:text-cyan-400 flex items-center gap-1.5 underline decoration-cyan-500/40 underline-offset-4 hover:decoration-cyan-400 transition pt-1 cursor-pointer"
                >
                  <KeyRound className="w-3.5 h-3.5 text-fuchsia-400" />
                  <span>Join via Code / Invite Link</span>
                </button>
              </div>
            </div>
          </div>

          {/* 3. Reduce Empty Space: Live Lounges & Live Stats Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Left 2 Cols: Recent / Active Voice Lounges */}
            <div className="lg:col-span-2 space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Volume2 className="w-4 h-4 text-cyan-400" /> Active Voice Lounges
                </h2>
                <span className="text-xs text-[#b5bac1] font-mono">1-Click Fast Connect</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {filteredChannels.map((channel) => (
                  <div
                    key={channel.id}
                    onClick={() => setCurrentChannel(channel)}
                    className="p-4 rounded-xl bg-[#2b2d31] hover:bg-[#35373c] border border-[#383a40] hover:border-cyan-500/60 transition group cursor-pointer shadow-md flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="w-9 h-9 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                          <Volume2 className="w-5 h-5" />
                        </div>
                        {channel.userCount && channel.userCount > 0 ? (
                          <span className="flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                            <span>{channel.userCount} Live</span>
                          </span>
                        ) : (
                          <span className="text-[11px] font-mono text-[#b5bac1] bg-[#1e1f22] px-2 py-0.5 rounded">
                            Available
                          </span>
                        )}
                      </div>
                      <h3 className="font-bold text-white text-sm group-hover:text-cyan-300 transition">
                        {channel.name}
                      </h3>
                      <p className="text-xs text-[#b5bac1] mt-0.5">
                        {channel.id === 'cinema-4k'
                          ? '4K 60FPS stream theater with audio loopback'
                          : channel.id === 'gaming-1'
                          ? 'Competitive squad comms with low-latency PTT'
                          : 'Opus 48kHz stereo voice with speaker detection'}
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-[#383a40]/60 flex items-center justify-between text-xs font-semibold text-cyan-400 group-hover:translate-x-0.5 transition-transform">
                      <span>Connect Now</span>
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right 1 Col: Live Squad Stats & Last Session Widget */}
            <div className="space-y-3">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Shield className="w-4 h-4 text-cyan-400" /> System & Squad Status
              </h2>

              <div className="p-4 rounded-xl bg-[#2b2d31] border border-[#383a40] space-y-3 shadow-md">
                <div className="flex items-center justify-between pb-2.5 border-b border-[#383a40]">
                  <span className="text-xs text-[#b5bac1]">Squad Members</span>
                  <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    {activeRoom && activeRoom.remoteParticipants && activeRoom.remoteParticipants.size > 0
                      ? `${activeRoom.remoteParticipants.size + 1} in Room`
                      : 'Online (You)'}
                  </span>
                </div>

                <div className="flex items-center justify-between pb-2.5 border-b border-[#383a40]">
                  <span className="text-xs text-[#b5bac1]">Voice Engine</span>
                  <span className="text-xs font-mono font-bold text-white">Opus 48kHz WebRTC</span>
                </div>

                <div className="flex items-center justify-between pb-2.5 border-b border-[#383a40]">
                  <span className="text-xs text-[#b5bac1]">Screen Presets</span>
                  <span className="text-xs font-mono font-bold text-cyan-400">1080p & 4K 60FPS</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xs text-[#b5bac1]">Global PTT Key</span>
                  <span className="text-xs font-mono font-bold text-fuchsia-400">
                    {inputMode === 'push_to_talk' ? `[${pttKey}] Active` : 'Voice Activity'}
                  </span>
                </div>
              </div>

              {/* Quick Jump into Sync Music Player */}
              <div
                onClick={() => {
                  setCurrentChannel({ id: 'music-jam', name: 'Group Music Jam', type: 'voice' });
                  setActivePanel('music');
                }}
                className="p-3 rounded-xl bg-gradient-to-r from-cyan-950/40 to-blue-950/40 border border-cyan-500/30 hover:border-cyan-500/60 transition p-3 cursor-pointer group flex items-center gap-3"
              >
                <div className="w-10 h-10 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0">
                  <Music className="w-5 h-5" />
                </div>
                <div className="truncate">
                  <p className="text-xs font-bold text-white group-hover:text-cyan-300">Group Music Jam</p>
                  <p className="text-[11px] text-[#b5bac1] truncate">Synchronized YouTube playback (sub-150ms drift)</p>
                </div>
              </div>
            </div>
          </div>

          {/* 4. Simplified Feature Cards at Bottom (Short title, 1-line description, 1 icon) */}
          <div className="space-y-3">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-400" /> Platform Architecture
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-[#2b2d31] border border-[#383a40] space-y-1.5 shadow-sm hover:border-[#4e5058] transition">
                <div className="flex items-center gap-2">
                  <Headphones className="w-4 h-4 text-cyan-400" />
                  <h3 className="font-bold text-white text-sm">Low-Latency Opus Audio</h3>
                </div>
                <p className="text-xs text-[#b5bac1]">
                  Web Audio API mixing routes raw microphone and custom soundboard clips directly without drivers.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-[#2b2d31] border border-[#383a40] space-y-1.5 shadow-sm hover:border-[#4e5058] transition">
                <div className="flex items-center gap-2">
                  <Monitor className="w-4 h-4 text-emerald-400" />
                  <h3 className="font-bold text-white text-sm">60 FPS Screen Share</h3>
                </div>
                <p className="text-xs text-[#b5bac1]">
                  Auto-pinned theater presentation mode with hardware-accelerated 1080p and 4K stream delivery.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-[#2b2d31] border border-[#383a40] space-y-1.5 shadow-sm hover:border-[#4e5058] transition">
                <div className="flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-fuchsia-400" />
                  <h3 className="font-bold text-white text-sm">Fine-Grained Audio DSP</h3>
                </div>
                <p className="text-xs text-[#b5bac1]">
                  Per-user volume adjustment (0-200%) and input sensitivity gain (0-150%) with zero clipping.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
