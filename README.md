# MawaBro HQ v2.0 - Zero-Cost Lightweight Discord Alternative

[![Version](https://img.shields.io/badge/version-2.0.0-cyan.svg)](https://github.com/punitcs7/MawaBro/releases/latest)
[![Platform](https://img.shields.io/badge/platform-Windows%20x64-blue.svg)](https://github.com/punitcs7/MawaBro/releases/latest)
[![Tauri](https://img.shields.io/badge/Tauri-2.0%20(Rust)-orange.svg)](https://tauri.app/)
[![React](https://img.shields.io/badge/React-18%20%7C%20TypeScript-61dafb.svg)](https://reactjs.org/)
[![LiveKit](https://img.shields.io/badge/LiveKit-WebRTC%20SFU-magenta.svg)](https://livekit.io/)

**MawaBro** is an ultra-lightweight, high-performance Windows desktop communication suite built with **Tauri 2.0 (Rust backend)**, **React 18**, **TypeScript**, **Tailwind CSS**, and **LiveKit WebRTC SFU**. 

Designed as a zero-cost, privacy-first Discord alternative for gamers and squads, MawaBro delivers sub-millisecond audio responsiveness, pristine 4K 60FPS screen streaming, a transparent in-game overlay, an in-app driverless soundboard, and a bulletproof 1-click auto-updater.

---

## 📥 Download & Installation

* **Latest Release**: [GitHub Releases](https://github.com/punitcs7/MawaBro/releases/latest)
* **Direct Download**: [**`MawaBro_2.0.0_x64-setup.exe`**](https://github.com/punitcs7/MawaBro/releases/latest/download/MawaBro_2.0.0_x64-setup.exe)

> **Windows SmartScreen Note**: Because MawaBro is an independent open-source release without an enterprise EV certificate, Windows Defender SmartScreen may display *"Windows protected your PC"*. Simply click **"More info"** ➔ **"Run anyway"**.  
> **Automatic Updates**: Once installed, MawaBro automatically checks for new releases on startup and upgrades in-place on the 1st attempt.

---

## 🚀 Key Features

### 1. Low-Latency Voice Engine (Opus 48kHz)
- Built on **LiveKit WebRTC SFU** (`livekit-client`, `@livekit/components-react`).
- Native 48kHz dual-channel Opus audio with adaptive bitrate, acoustic echo cancellation (AEC), and noise suppression (ANS).
- Active speaker detection with visual glowing green ring indicators.

### 2. High-Clarity Screen Share (1080p & 4K 60FPS)
Configurable streaming presets via `navigator.mediaDevices.getDisplayMedia`:
- **1080p @ 60 FPS** (6 Mbps Bitrate): Ultra-smooth gaming clarity.
- **4K @ 30 FPS** (15 Mbps Bitrate): Desktop productivity & cinema viewing.
- **4K @ 60 FPS** (20 Mbps Bitrate): Enthusiast master-quality streaming.
- **Theater Mode**: Full-screen theater view with participant sidecar feeds (`ScreenShareTheater.tsx`).
- **System Audio Capture**: High-fidelity stereo system sound loopback for games and movies.

### 3. Transparent In-Game Squad HUD Overlay
- Secondary Tauri desktop window (`overlay`) initialized with transparency, `alwaysOnTop: true`, `skipTaskbar: true`, and `decorations: false`.
- **Zero-Latency Click-Through**: Low-level cursor event pass-through (`window.set_ignore_cursor_events(true)`), allowing uninterrupted aiming and gameplay.
- Displays real-time squad speaker status and glowing voice rings directly on top of full-screen borderless games.
- Toggleable via top header button, sidebar shortcut, or settings modal.

### 4. Global Push-to-Talk (PTT) Hook
- Implemented in the Rust backend (`src-tauri/src/lib.rs`) using low-level OS hooks (`rdev` / Windows `SetWindowsHookExW`).
- Intercepts configurable PTT key combinations (e.g., `CapsLock`, `Mouse4`, `Mouse5`, `F13-F24`) even when 3rd-party games run in **exclusive full-screen mode**.
- Real-time IPC events (`ptt-active`) dispatched to the webview with sub-millisecond responsiveness.

### 5. In-App Driverless Soundboard
- Custom soundboard pads storing `.mp3`/`.wav` audio clips in local storage.
- Powered by the **Web Audio API (`AudioContext`)** composite mixer (`services/audioEngine.ts`) mixing clips directly into your microphone stream before WebRTC transmission.
- **No virtual audio cable drivers (VB-Cable) required** — squad members hear your soundboard triggers with perfect clarity.
- Direct local monitoring route (`monitorGainNode`) so you hear your own soundboard triggers through your headphones in real time.

### 6. Synchronized Group Music Player
- Synchronized YouTube player across all room members via LiveKit DataMessages (`room.localParticipant.publishData`).
- Supported actions: `{ type: "PLAY" | "PAUSE" | "SEEK", trackUrl, timestamp, sentAt }`.
- Auto-sync algorithm compensates for network latency and keeps all listeners locked within **150ms** of the host.

### 7. Windows System Tray Minimization & Background Audio
- Native Windows system tray integration via Tauri 2.0 `TrayIconBuilder`.
- System tray context menu: *"Show MawaBro HQ"*, *"Mute / Unmute"*, *"Deafen / Undeafen"*, and *"Quit"*.
- Audio streaming and Push-to-Talk remain active in the background when the main window is closed to tray.

### 8. Bulletproof 1-Click Auto-Updater
- Integrated Tauri v2 updater (`@tauri-apps/plugin-updater`).
- Overridden NSIS pre-install macros (`!macroundef CheckIfAppIsRunning`) to bypass Windows Restart Manager locks and ensure smooth 1st-attempt automated installations.

---

## 📂 Project Architecture

```
MawaBro/
├── .github/
│   └── workflows/
│       └── release.yml                  # Automated multi-platform build & signing pipeline
├── docs/
│   ├── discord-architecture-notes.md    # Reverse-engineering notes on Discord architecture
│   └── VERSIONING-AND-RELEASES.md       # Comprehensive version history & release logs
├── src/
│   ├── components/
│   │   ├── ChatPanel.tsx                # Text channel message thread & composer
│   │   ├── CreateChannelModal.tsx       # Custom voice and text channel creator
│   │   ├── GroupMusicPlayer.tsx         # Synchronized YouTube squad music player
│   │   ├── JoinCodeModal.tsx            # Quick-Join invite code modal
│   │   ├── OverlayView.tsx              # Transparent in-game squad HUD overlay
│   │   ├── ScreenShareModal.tsx         # 1080p/4K screen share preset selector
│   │   ├── ScreenShareTheater.tsx       # Maximized theater stream viewer
│   │   ├── SettingsModal.tsx            # Audio devices, DSP, PTT keybinding recorder
│   │   ├── Sidebar.tsx                  # Channel browser, user card, mute/deafen dock
│   │   ├── Soundboard.tsx               # Audio pad grid with master volume controls
│   │   ├── TextChannelView.tsx          # Real-time text chat channel view
│   │   ├── UpdateModal.tsx              # In-app background updater modal
│   │   ├── VoiceRoom.tsx                # Core WebRTC engine & participant video grid
│   │   └── WelcomeView.tsx              # Dashboard summary & quick shortcuts
│   ├── services/
│   │   ├── audioEngine.ts               # Web Audio API composite audio mixer
│   │   ├── livekitToken.ts              # LiveKit JWT access token generator
│   │   └── tauriPtt.ts                  # Tauri IPC bridge for global PTT hook
│   ├── store/
│   │   └── useAppStore.ts               # Zustand global application state
│   ├── types/
│   │   └── index.ts                     # TypeScript definitions & stream presets
│   ├── App.tsx                          # Root React application container
│   ├── main.tsx                         # Client application entry point
│   └── index.css                        # Tailwind CSS styles and glow animations
├── src-tauri/
│   ├── capabilities/
│   │   └── default.json                 # Tauri 2.0 window security capabilities
│   ├── src/
│   │   ├── lib.rs                       # Rust backend, PTT thread, & window event loops
│   │   └── main.rs                      # Tauri runtime entry point
│   ├── Cargo.toml                       # Rust dependencies (tauri, rdev, serde, livekit-api)
│   ├── nsis-hooks.nsh                   # Custom NSIS installer process cleanup hooks
│   └── tauri.conf.json                  # Desktop window and packaging metadata
├── docker-compose.yml                   # Free self-hosted LiveKit SFU container
├── livekit.yaml                         # High-fidelity Opus audio configuration
├── .env.example                         # LiveKit Cloud Free Tier & self-hosting credentials
├── package.json
├── tailwind.config.js
├── tsconfig.json
└── vite.config.ts
```

---

## 🛠️ Getting Started (Development)

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Frontend Web Client
```bash
npm run dev
```
Runs at [http://localhost:1420](http://localhost:1420) with interactive voice, soundboard, and screen share testing.

### 3. Run Desktop Application (Tauri 2.0)
*Prerequisite: Visual Studio C++ Build Tools installed on Windows.*
```bash
npm run tauri dev
```

### 4. Build Production Installer
Generates `MawaBro_2.0.0_x64-setup.exe` in `src-tauri/target/release/bundle/nsis/`:
```bash
npm run tauri build
```

---

## ☁️ Zero-Cost Hosting Options

### Option A: LiveKit Cloud Free Tier (Recommended)
1. Sign up for free at [cloud.livekit.io](https://cloud.livekit.io) (Free forever: 50 GB/month bandwidth, 10 peak rooms).
2. Create a project and copy your WebSocket URL.
3. Configure `.env` or enter credentials directly in MawaBro's Settings modal:
   ```env
   VITE_LIVEKIT_URL=wss://your-project.livekit.cloud
   VITE_LIVEKIT_TOKEN=your-generated-room-token
   ```

### Option B: Local Docker / Oracle Cloud Always-Free VM
Run the included LiveKit SFU container:
```bash
docker compose up -d
```
Spins up a local LiveKit SFU on `ws://localhost:7880` with pre-configured 48kHz Opus audio routing.
