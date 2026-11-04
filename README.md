# MawaBro - Zero-Cost Lightweight Discord Alternative

**MawaBro** is an ultra-lightweight Windows desktop communication application built with **Tauri 2.0 (Rust)**, **React 18**, **TypeScript**, **Tailwind CSS**, and **LiveKit WebRTC SFU**.

It features low-latency voice channels, high-clarity 1080p & 4K screen sharing, a driver-less in-app soundboard, and a synchronized group music player.

---

## 🚀 Key Features

### 1. Low-Latency Voice Engine (Opus 48kHz)
- Built on **LiveKit WebRTC SFU** (`livekit-client`, `@livekit/components-react`).
- Native 48kHz dual-channel Opus audio with adaptive bitrate, acoustic echo cancellation (AEC), and noise suppression (ANS).
- Active speaker detection with visual glowing green ring indicators.

### 2. High-Clarity Screen Share (1080p & 4K)
Configurable streaming presets via `navigator.mediaDevices.getDisplayMedia`:
- **1080p @ 60 FPS** (6 Mbps Bitrate): Ultra-smooth gaming clarity.
- **4K @ 30 FPS** (15 Mbps Bitrate): Desktop productivity & cinema viewing.
- **4K @ 60 FPS** (20 Mbps Bitrate): Enthusiast master-quality streaming.
- **System Audio Capture**: Stereo system sound loopback for games and movies.

### 3. Global Push-to-Talk (PTT) Hook
- Implemented in Rust backend (`src-tauri/src/lib.rs`) using low-level OS hooks (`rdev` / Windows `SetWindowsHookExW`).
- Intercepts configurable PTT key combinations (e.g., `CapsLock`, `Mouse4`, `F13-F24`) even when 3rd-party games are running in **exclusive full-screen mode**.
- Emits real-time IPC events (`ptt-active`) to the Tauri webview with sub-millisecond responsiveness.

### 4. In-App Driverless Soundboard
- Custom soundboard pads storing `.mp3`/`.wav` clips in local application storage.
- Uses the **Web Audio API (`AudioContext`)** to mix audio clips directly into the microphone stream before transmitting it over WebRTC. **Channel members hear the clips without needing virtual audio cable drivers (VB-Cable).**
- Direct local monitoring route (`monitorGainNode`) so you hear your own sound triggers through your headphones in real time.

### 5. Synchronized Group Music Player
- Embedded YouTube IFrame player synchronized across room members via LiveKit DataMessages (`room.localParticipant.publishData`).
- Carries payloads: `{ type: "PLAY" | "PAUSE" | "SEEK", trackUrl, timestamp, sentAt }`.
- Auto-sync algorithm accounts for network flight time and keeps all room members strictly within **150ms** of the host.

---

## 📂 Project Architecture

```
MawaBro/
├── docs/
│   ├── discord-architecture-notes.md    # REA reverse-engineering analysis of Discord
│   └── VERSIONING-AND-RELEASES.md       # Version history and release tracking
├── src/
│   ├── components/
│   │   ├── GroupMusicPlayer.tsx         # Synchronized YouTube group player
│   │   ├── ScreenShareModal.tsx         # 1080p/4K preset selection modal
│   │   ├── SettingsModal.tsx            # PTT keybinding recorder & audio DSP settings
│   │   ├── Sidebar.tsx                  # Discord-style channels and user status dock
│   │   ├── Soundboard.tsx               # Audio pad grid with volume controls
│   │   ├── VoiceRoom.tsx                # Core WebRTC engine & participant video grid
│   │   ├── WelcomeView.tsx              # Channel dashboard & architectural summary
│   │   ├── OverlayView.tsx              # In-game squad HUD overlay
│   │   └── UpdateModal.tsx              # In-app auto-updater modal
│   ├── services/
│   │   ├── audioEngine.ts               # Web Audio API composite audio mixer
│   │   └── tauriPtt.ts                  # Tauri IPC bridge for global PTT hook
│   ├── store/
│   │   └── useAppStore.ts               # Zustand application state management
│   ├── types/
│   │   └── index.ts                     # TypeScript definitions & screen share configs
│   ├── App.tsx                          # Root application container
│   ├── main.tsx                         # Entry point
│   └── index.css                        # Tailwind CSS styles and glow animations
├── src-tauri/
│   ├── capabilities/
│   │   └── default.json                 # Tauri 2.0 window security capabilities
│   ├── src/
│   │   ├── lib.rs                       # Rust backend & background OS hook thread
│   │   └── main.rs                      # Tauri runtime entry point
│   ├── Cargo.toml                       # Rust dependencies (tauri, rdev, serde)
│   ├── nsis-hooks.nsh                   # Custom NSIS installer hooks
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

## 🛠️ Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Frontend Development Server
```bash
npm run dev
```
Open [http://localhost:1420](http://localhost:1420) in your browser. The app runs in interactive mode with full voice, soundboard, and screen-sharing capabilities.

### 3. Run Desktop Application (Tauri 2.0)
*Prerequisite: Visual Studio C++ Build Tools installed on Windows.*
```bash
npm run tauri dev
```

### 4. Official Windows Installer & Releases
The official release is distributed via the **Windows Setup Installer** (`MawaBro_<version>_x64-setup.exe`):
- **Automated In-App Updates**: Built-in Tauri v2 updater automatically detects and installs new releases seamlessly on the 1st attempt.
- **Full Windows Integration**: Automatically configures Start Menu shortcuts, desktop icons, and proper background process cleanup hooks.
- **Latest Release Download**: [GitHub Releases](https://github.com/punitcs7/MawaBro/releases/latest)

To rebuild the release installer locally:
```bash
npm run tauri build
```

---

## ☁️ Zero-Cost Hosting Options

### Option A: LiveKit Cloud Free Tier (Recommended)
1. Sign up for free at [cloud.livekit.io](https://cloud.livekit.io) (Free forever: 50 GB/month bandwidth, 10 peak rooms).
2. Create a project and copy your WebSocket URL.
3. Configure `.env` or enter the credentials directly in MawaBro's in-app Settings modal:
   ```env
   VITE_LIVEKIT_URL=wss://your-project.livekit.cloud
   VITE_LIVEKIT_TOKEN=your-generated-room-token
   ```

### Option B: Local Docker / Oracle Cloud Always-Free VM
Run the included LiveKit SFU instance:
```bash
docker compose up -d
```
This spins up a local LiveKit SFU on `ws://localhost:7880` with pre-configured 48kHz Opus audio routing.
