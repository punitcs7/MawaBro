# MawaBro Versioning & Release Workflow

This document tracks the release versioning rules and history for **MawaBro**.

---

## 📌 Release Directory Convention & Versioning Rules

1. **Versioning Baseline**:
   - The application versioning starts from **v1** (`1.0.0`).
2. **Minor Updates (`Changelog: Minor update`)**:
   - When a bug fix, feature refinement, or patch is completed, increment the decimal version:
     `v1` $\rightarrow$ `v1.1` $\rightarrow$ `v1.2` $\rightarrow$ ...
3. **Major Updates (`Changelog: Major Update`)**:
   - When a major architectural overhaul or large feature release is completed, increment the major version:
     `v1.x` $\rightarrow$ `v2.0` $\rightarrow$ `v3.0` ...
4. **Folder Cleanliness Protocol**:
   - Each time an update is produced:
     1. Bump version numbers in `package.json`, `src-tauri/Cargo.toml`, `src-tauri/tauri.conf.json`, `src-tauri/custom-installer.nsi`, and UI badges (`Sidebar.tsx`, `SettingsModal.tsx`, `WelcomeView.tsx`).
     2. Rebuild the release bundles (`npm run tauri -- build`).
     3. **Delete the previous release folder** (e.g., delete `MawaBro v1/` or `MawaBro v1.1/`).
     4. **Create a fresh release folder** with the Application Name and new Version (e.g. `MawaBro v1.1/`).
     5. Populate the new folder with the updated `MawaBro-Setup.exe`, `MawaBro-Portable.exe`, `MawaBro.msi`, `Launch-MawaBro.bat`, and `README.txt`.

---

## 📜 Version History

### **MawaBro v1.8.0 (MawaBro v1.8)** - *Current (Changelog: Minor update)*
- **Transparent In-Game Voice Overlay**:
  - Configured secondary Tauri desktop window (`overlay`) with transparent background, `alwaysOnTop: true`, `skipTaskbar: true`, and `decorations: false`.
  - Added click-through initialization via `window.set_ignore_cursor_events(true)` allowing full gameplay aiming and mouse pass-through.
  - Implemented React `/overlay` route rendering a vertical squad HUD with real-time green glowing active speaker indicators.
  - Inter-webview state synchronization using dual BroadcastChannel and Tauri event buses (`overlay-speakers`).
  - Added 1-click toggle buttons in top header, sidebar shortcuts, and Settings modal.
- **Windows System Tray Minimization & Background Audio**:
  - Implemented Windows system tray icon via Tauri 2.0 `TrayIconBuilder` with menu controls: "Show MawaBro HQ", "Mute / Unmute", "Deafen / Undeafen", and "Quit".
  - Left-clicking the tray icon restores and focuses the desktop window.
  - Intercepted window close requested events (`api.prevent_close()`): closing the window minimizes to the tray while keeping active LiveKit WebRTC audio connections alive in the background.
- **RNNoise WebAssembly AudioWorklet Noise Suppression**:
  - Integrated open-source RNNoise Wasm deep learning noise filter into Web Audio pipeline (`NoiseSuppressorWorklet`).
  - Implemented circular ring-buffer bridging 128-sample Web Audio API quanta into 480-sample RNNoise neural network frames at 48kHz.
  - Feeds raw mic audio through the neural network and routes cleaned output directly to the LiveKit WebRTC peer connection.
  - Added interactive toggle switch in Settings Modal ("AI Noise Suppression") with real-time audio graph bypass.
- **Release Packaging**:
  - Pruned `MawaBro v1.7/` and generated clean `MawaBro v1.8/` containing setup installer, portable binary, and MSI installer.

### **MawaBro v1.7.0 (MawaBro v1.7)** - *Archived (Changelog: Minor update)*
- **Infinite Mirror Feedback Loop Prevention (Eliminated Multiplying Cursors & Buffer Saturation)**:
  - Eliminated the recursive feedback loop caused by playing a full-screen live video of a monitor back onto that exact same monitor (the video equivalent of microphone screech).
  - Designed Discord-style **Streamer Hub** for broadcasters (`isLocal === true`):
    * High-visibility glowing monitor emblem with active channel name.
    * Dynamic resolution preset badge (`4K 60FPS` / `1080P 60FPS`).
    * Real-time transport diagnostics (WebRTC SFU, 60 FPS target, Stereo Audio loopback).
    * Prominent 1-click **Stop Streaming** button.
    * **Show Preview** toggle: opens a safe, bounded preview with an infinite mirror warning banner.
    * Fullscreen is disabled on the broadcaster's own screen to prevent infinite recursive loop traps.
- **Glitch-Free In-App Fullscreen Theater Mode (Eliminated Green Screen D3D11 Crash)**:
  - Replaced WebView2's browser-level `element.requestFullscreen()` with native **In-App Immersive Theater Mode** (`fixed inset-0 z-50 bg-black`).
  - Completely prevents DirectX 11 swapchain presentation tearing (`DXGI_SWAP_EFFECT_FLIP_DISCARD`) and Chromium hardware video decoder texture drops that previously turned video feeds solid neon green.
  - Remote squad viewers can watch streams in borderless, distraction-free fullscreen with zero lag, zero green screen, and smooth ESC key support.
- **Release Packaging**:
  - Pruned `MawaBro v1.6/` and generated clean `MawaBro v1.7/` containing setup installer, portable binary, and MSI installer.

### **MawaBro v1.6.0 (MawaBro v1.6)** - *Archived (Changelog: Minor update)*
- **Global Browser Context Menu Suppression (Pure Native Desktop Experience)**:
  - Eliminated the Microsoft Edge WebView2 default context menu ("Share", "Back", "Reload", "Print", "Inspect") via global frontend event suppression in `App.tsx` and pre-mount listener in `index.html`.
  - Right-clicking anywhere on the app no longer displays web browser options, delivering the authentic feel of a dedicated desktop client like Discord or Steam.
  - Standard Copy, Cut, and Paste interactions are preserved on text input and textarea fields.
- **Interactive Stream Hover Controls (Auto-Fade on Hover & Idle)**:
  - Built `ScreenShareTheater.tsx` providing an automated controls overlay for both local broadcasts and remote squad streams:
    * **Play / Pause**: direct stream video playback toggle.
    * **Stream Volume Slider & Mute**: interactive 0% to 100% volume control and 1-click Mute/Unmute.
    * **True Fullscreen Theater Mode**: HTML5 Fullscreen with automatic keyboard ESC key listener and CSS fallback.
    * **Fit vs. Fill**: 1-click toggle between Aspect Ratio Fit (`object-contain`) and Fill (`object-cover`).
    * **Picture-in-Picture (PiP)**: mini-player button for watching streams while navigating other channels.
    * **High-Res Screenshot**: 1-click snapshot tool extracting instant PNG frames directly from the stream.
    * **Stream Diagnostics ("Stats for Nerds")**: live HUD displaying stream resolution, FPS, transport protocol, and mode.
    * **Auto-Fade Behavior**: Controls smoothly fade in when hovering or moving the mouse, and fade out after 2.8 seconds of inactivity or upon mouse leave.
- **Release Packaging**:
  - Pruned `MawaBro v1.5/` and generated clean `MawaBro v1.6/` containing setup installer, portable binary, and MSI installer.

### **MawaBro v1.5.0 (MawaBro v1.5)** - *Archived (Changelog: Minor update)*
- **Screen Share 4K 60FPS Native Streaming & Dynamic Badges**:
  - Fixed root cause where `VoiceRoom.tsx` was hardcoded to `ScreenSharePresets.h1080fps30.resolution` and displayed a static `"1080P 60FPS"` badge.
  - Linked screen sharing initiation directly to `SCREEN_SHARE_PRESETS[screenPreset]`.
  - When the 4K preset is selected, WebRTC `getDisplayMedia` requests native 4K UHD (`3840x2160 @ 60 FPS`) at 20 Mbps with stereo audio loopback.
  - Dynamic resolution badge detects local preset (`4K 60FPS` / `4K 30FPS` / `1080P 60FPS`) and probes incoming remote `MediaStreamTrack.getSettings()` for precise real-time stream resolution rendering.
  - Refined Screen Share selection modal with neon cyan accent borders and active preset indication.
- **Microphone Speaking Detection & Green Border/Ping Fix**:
  - Fixed root cause where `VoiceRoom.tsx` set `isSpeaking: !isActuallyMuted`, causing the participant border and green pulsing ring to illuminate permanently whenever unmuted.
  - Connected Web Audio `AnalyserNode` directly to the raw mic gain pipeline in `audioEngine.ts`.
  - Implemented real-time RMS/frequency energy calculation with threshold filtering (`avg > 12 / 255`) to detect true speech vs. background silence.
  - Combined `audioEngine.isSpeaking()` polling with LiveKit SFU `ActiveSpeakersChanged` events so avatar borders and green pulse rings glow **only when the user is actively speaking**.
- **Release Packaging**:
  - Pruned `MawaBro v1.4/` and generated clean `MawaBro v1.5/` containing setup, portable binary, and MSI installer.

### **MawaBro v1.4.0 (MawaBro v1.4)** - *Archived (Changelog: Minor update)*
- **Removed Static Numbers & Fake Presence Badges**:
  - Eliminated hardcoded counts (`4`, `2`, `1`) from channel presets and sanitized cached `localStorage`.
  - Presence badges in the sidebar only appear when users are genuinely connected inside a channel. When empty, no green boxes are displayed.
- **Dynamic Real-Time Squad Status**:
  - Replaced the hardcoded "7 Online" badge with live status.
  - When alone/idle, it now displays `Online (You)`. When squad members join a room, it reflects the true active participant count (`X in Room`).
  - Active Voice Lounge cards now display `Available` when empty, and only show live member badges when peers are actively present.
- **Release Packaging**:
  - Pruned `MawaBro v1.3/` and generated clean `MawaBro v1.4/`.

### **MawaBro v1.3.0 (MawaBro v1.3)** - *Archived (Changelog: Minor update)*
- **Critical Bug Fix 1 (Removed Random Bot Placeholders)**:
  - Deleted mock participant stubs (`CyberSamurai`, `GhostRider_99`) from `VoiceRoom.tsx`.
  - Only genuine, authenticated squad members connected to the LiveKit room will ever appear in voice calls.
- **Critical Bug Fix 2 (Interactive Text Channels & File/Media Attachments)**:
  - Fixed non-interactive text channels in the sidebar; clicking any channel (`#general-chat`, `#clips-and-memes`, `#music`, `#text`, or custom text rooms) opens the dedicated rich view.
  - Implemented `TextChannelView.tsx` with real-time text chat, timestamps, sender badges, and local persistence.
  - **Image Attachments**: Supported PNG, JPG, GIF, WebP uploads with inline preview cards and click-to-enlarge lightbox modal.
  - **Video Clip Embedding**: Supported MP4, WebM gameplay video uploads with inline HTML5 video players for instant watching.
  - **File Sharing**: Supported PDF, ZIP, TXT, DOCX documents with file size badges and 1-click download actions.
  - LiveKit DataChannel synchronization transmitting messages and attachments across connected squad members.
- **Release Packaging**:
  - Pruned `MawaBro v1.2/` and generated clean `MawaBro v1.3/`.

### **MawaBro v1.2.0 (MawaBro v1.2)** - *Archived (Changelog: Minor update)*
- **Dominant Primary Action**:
  - Transformed "Join a Voice Channel" into a single, dominant glowing primary button.
  - Placed "Create Channel" as a secondary bordered action, with "Join via Code / Link" as a clean sub-link below.
- **Reduced Empty Central Space (Command Center)**:
  - Added live voice lounge cards with real-time active member count badges and 1-click connect.
  - Added live squad status & system specifications widget (7 Online, Opus 48kHz, 60 FPS, Global PTT).
  - Added recommended room hubs with quick-jump into synchronized YouTube music jams.
- **Restructured Sidebar Hierarchy**:
  - Divided channels into three clear groups: `WORKSPACES` (Voice), `CHANNELS` (Text), and `SHORTCUTS` (Actions).
  - Brighter heading typography (`text-[#c4c9d0]`) and increased spacing between groups.
- **Strengthened Active States**:
  - Added vertical neon cyan indicator bar on active channel.
  - Brighter active background, higher text contrast, and presence pulse badges.
- **Useful Compact Top Bar**:
  - Added workspace badge (`MawaBro HQ`), global search bar with `Ctrl+K` shortcut, real-time connection status (`Cloud SFU • 12ms`), notifications menu, settings shortcut, and user profile chip.
- **Simplified Architecture Cards & Improved Typography**:
  - Established three clear text levels (large page title, medium section heading, small supporting description).
  - High-contrast text colors (`text-[#dbdee1]` / `text-[#b5bac1]`) for high readability on dark backgrounds.
  - Condensed platform feature cards to short titles, 1-line descriptions, and clean icons.
- **Release Packaging**:
  - Pruned `MawaBro v1.1/` and produced clean `MawaBro v1.2/`.

### **MawaBro v1.1.0 (MawaBro v1.1)** - *Archived (Changelog: Minor update)*
- **Bug Fix 1 (60 FPS Remote Screen Share)**:
  - Enabled 1080p 60FPS publication via `room.localParticipant.setScreenShareEnabled(true, ...)`.
  - Upgraded receiving grid to query tracks using `useTracks([Track.Source.Camera, Track.Source.ScreenShare])`.
  - Added auto-pinning theater mode with high z-index and active participant attribution badge ("X's Screen - LIVE").
- **Bug Fix 2 (Microphone Input Sensitivity & Volume Slider)**:
  - Added 0% to 150% sensitivity slider in Settings.
  - Routed raw microphone MediaStream through Web Audio API `GainNode` before publishing to LiveKit for real-time gain adjustment.
- **Bug Fix 3 (Single-Click Channel Switching Race Condition)**:
  - Implemented `isTransitioning` lock state in store preventing double clicks.
  - Awaited clean room disconnection, cleared tracks, minted fresh room token, and connected cleanly.
- **Bug Fix 4 (Decoupled Deafen)**:
  - Muted all incoming remote audio elements via `<RoomAudioRenderer muted={isDeafened} />`.
  - Saved previous microphone state (`wasMicMuted`) and restored it seamlessly upon undeafening.
- **Feature 5 (Channel & Group Management)**:
  - Added "+" modal to create custom voice and text lounges, backed by persistent `localStorage`.
  - Rendered delete/trash buttons on user-created channels.
- **Feature 6 (Room Invite Links & Quick-Join Code)**:
  - Added "Invite Friends" button copying formatted squad invite template to clipboard.
  - Added "Join via Code / Link" modal with auto-parser for direct room joining.
- **Feature 7 (Audio Input & Output Device Picker)**:
  - Added dropdowns for selecting specific microphones and headphones via `Room.getLocalDevices()`.
  - Added real-time device change detection via `navigator.mediaDevices.ondevicechange`.
- **Feature 8 (In-Room Text Chat)**:
  - Built expandable chat drawer using LiveKit DataChannels / `useChat()`.
  - Supported timestamps, sender nicknames, clickable links, and image thumbnail auto-preview.
- **Feature 9 (Per-User Volume Control)**:
  - Added per-participant volume popover (0% to 200%) controlling individual output volume via `remoteParticipant.setVolume()`.
- **Feature 10 (Synthesized Audio Chimes)**:
  - Added Web Audio API oscillators for room join, leave, mute, and unmute tones.
- **Release Packaging**:
  - Deleted old folder and generated clean `MawaBro v1.1/` release package.

### **MawaBro v1.0.0 (MawaBro v1)** - *Initial Release*
  - Added real-time device change detection via `navigator.mediaDevices.ondevicechange`.
- **Feature 8 (In-Room Text Chat)**:
  - Built expandable chat drawer using LiveKit DataChannels / `useChat()`.
  - Supported timestamps, sender nicknames, clickable links, and image thumbnail auto-preview.
- **Feature 9 (Per-User Volume Control)**:
  - Added per-participant volume popover (0% to 200%) controlling individual output volume via `remoteParticipant.setVolume()`.
- **Feature 10 (Synthesized Audio Chimes)**:
  - Added Web Audio API oscillators for room join, leave, mute, and unmute tones.
- **Automated Old Release Pruning**:
  - Deleted `MawaBro v2/` and published complete `MawaBro v3/` release package.

### **MawaBro v2.0.0 (MawaBro v2)** - *Archived*
- **Custom Brand Identity**: Integrated user's glowing cyberpunk neon logo into Windows desktop application icons (`icon.ico`, `icon.icns`, PNG store/dock sets).
- **In-App UI Integration**:
  - Centerpiece neon hero logo on the Welcome screen with ambient glow.
  - Interactive MawaBro logo in the top guild dock.
  - Channel header branding and Settings modal identity.
- **Dynamic Version Badges**: UI upgraded to `v2.0` across sidebar, settings, and welcome dashboards.
- **Automated Old Release Pruning**: Deleted `MawaBro v1/` and produced clean `MawaBro v2/`.

### **MawaBro v1.0.0 (MawaBro v1)** - *Archived*
- **LiveKit Cloud WebRTC SFU**: Low-latency 48kHz Opus audio engine with active speaker detection.
- **Multi-User Identity**: Persistent per-device ID generation preventing duplicate identity disconnections.
- **Audio Rendering**: Automatic remote track playback via `<RoomAudioRenderer />`.
- **4K / 1080p Screen Sharing**: Configurable frame rate and bitrate presets with stereo system audio loopback.
- **In-App Driver-less Soundboard**: Web Audio API composite stream mixer transmitting audio clips directly to channel participants.
- **Synchronized Group YouTube Player**: Auto-sync playback (<150ms drift) via LiveKit DataMessages.
- **Global Push-to-Talk (PTT)**: Low-level Windows hook (`rdev`) operating in exclusive full-screen games.
- **Bulletproof Setup Installer**: Custom NSIS installer with 64-bit WOW64 process tree termination (`${DisableX64FSRedirection}`) preventing "Failed to kill" errors.
