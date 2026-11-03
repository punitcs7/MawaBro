# Discord Architectural Analysis & Reverse Engineering Notes

*Derived from inspection of Discord Windows Desktop Client (`app-1.0.9266`) via REA (`analyze_javascript_application`, `inspect_analysis_view`) and module disassembly of `discord_voice` and `discord_utils`.*

---

## 1. Voice Channel Connection Lifecycle

Discord structures its real-time voice and video subsystem around a two-layer control and media plane:

```
[UI / React State] 
       │ 
       ▼ (IPC / Gateway Dispatch)
[Gateway WebSocket] ─── VOICE_STATE_UPDATE ───► [Discord Gateway]
       │                                              │
       │                                     VOICE_SERVER_UPDATE
       │                                     (token, endpoint)
       ▼                                              │
[VoiceEngine (WebRTC Native / SFU)] ◄─────────────────┘
       │
       ├── State 1: DISCONNECTED (Initial state)
       ├── State 2: CONNECTING (Signaling WebSocket connecting to Voice SFU)
       ├── State 3: RTC_CONNECTING (ICE gathering, STUN UDP hole-punching, DTLS/SRTP)
       ├── State 4: CONNECTED (RTC established, Opus audio pipeline running)
       └── Modifiers:
           ├── self_mute: Inactivates mic input stream (or zero-samples track)
           ├── self_deaf: Silences all incoming WebRTC audio sink buffers + auto-mutes mic
           ├── speaking_status: VAD or PTT triggers speaking flag sent over WebRTC data/SSRC
           └── rtc_reconnect: fastUdpReconnect() triggered upon packet loss or endpoint migration
```

### Key API & Lifecycle Hooks (Observed in `discord_voice`):
- `VoiceEngine.createVoiceConnectionWithOptions(userId, connectionOptions, onConnectCallback)`
- `setTransportOptions(options)`: Configures ICE servers, STUN/TURN, bitrate caps, and encryption modes.
- `setUdpEndpoint(address, port)` & `fastUdpReconnect()`: Handles direct WebRTC UDP voice transport migration.
- `setSelfMute(mute)` & `setSelfDeafen(deaf)`: Synchronizes both the local OS audio device capture state and signaling state.
- `setOnSpeakingCallback(callback)`: Realtime voice-activity detection (VAD) callback providing speaking visual indicators to the UI.
- `setOnSpeakingWhileMutedCallback(callback)`: Notifies the user if audio energy is detected while muted.

---

## 2. Audio Routing and Soundboard Mixing

In Discord, soundboard clips and system sound sharing do **not** require virtual audio cable drivers (e.g., VB-Cable). Instead, they are mixed directly into the audio pipeline:

```
              ┌─────────────────────────┐
Microphone ──►│ Web Audio / Input DSP   │
              │ (Krisp NS, AEC, AGC)    │────┐
              └─────────────────────────┘    │
                                             ▼
                                     ┌───────────────┐
                                     │  Audio Mixer  │──► [WebRTC Audio Track] ──► SFU / Peers
                                     └───────────────┘    (Opus 48kHz, 64-128kbps)
                                             ▲
              ┌─────────────────────────┐    │
Soundboard ──►│ Local Audio Buffer / PCM│────┤
Clip (.mp3)   └─────────────────────────┘    │
                         │                   │
                         ▼                   │
              ┌─────────────────────┐        │
              │ Local Output Device │◄───────┘ (Direct Monitoring)
              │ (Headphones/Speakers│
              └─────────────────────┘
```

### Architectural Principles:
1. **In-Pipeline Audio Mixing**: Soundboard playback creates an audio source node connected to a composite `MediaStreamDestinationNode`. The local microphone stream connects to the same destination node. The resulting combined track is supplied to the WebRTC peer connection.
2. **Dual-Route Soundboard Output**:
   - **Upstream Route**: Scaled with a gain node and sent to remote peers via the WebRTC stream.
   - **Local Feedback Route**: Directed simultaneously to the user's local output device (`AudioContext.destination`) so the sender hears the audio clip in real time without network round-trip delay.
3. **Soundshare / Screen Audio**:
   - On Windows, uses WASAPI Loopback capture (`features.declareSupported('soundshare_loopback')`) to capture system audio alongside desktop capture, muxed into the video/audio stream.

---

## 3. Hotkey Handling for Global Push-to-Talk (PTT)

Discord implements global hotkey capture through `discord_utils` via native OS hooks:

```
[Global OS Events] (WH_KEYBOARD_LL / WH_MOUSE_LL or RawInput)
       │
       ▼
[discord_utils.node / Native Background Hook]
       │
       ├── Filters & Validates (Scan codes, modifier states)
       ├── Detects: State 1 (Key Pressed) -> Trigger PTT Active
       └── Detects: State 0 (Key Released) -> Trigger PTT Inactive
       │
       ▼ (Inter-process Communication / Event Dispatch)
[VoiceEngine.setPTTActive(active, priority, muteOverride)]
       │
       ├── When Active: Unmutes audio pipeline, transmits Opus packets, signals speaking = true
       └── When Inactive: Mutes audio pipeline, stops Opus transmission, signals speaking = false
```

### Technical Implementation Details:
- **Low-level OS Hooking**: In Windows, Discord hooks low-level keyboard and mouse messages using `SetWindowsHookExW(WH_KEYBOARD_LL, ...)` and `SetWindowsHookExW(WH_MOUSE_LL, ...)` or raw input. This allows capturing keys like `CapsLock`, `Mouse4`, `Mouse5`, or arbitrary key combos even when games or full-screen applications have exclusive focus.
- **Debounce & Release Protection**: State transitions (`state === 1` for press, `state === 0` for release) ensure that when multiple keys are pressed in combination, the channel stays open until all bound keys are released.
- **Immediate PTT Action**: The native hook directly informs the voice engine (`setPTTActive`) to minimize latency between key press and audio unmuting (eliminating clipping of initial syllables).

---

## 4. Application to MawaBro (Tauri 2.0 Architecture)

For our lightweight desktop alternative **MawaBro**:
1. **Desktop Shell & Native Backend**: Tauri 2.0 (Rust) provides low-memory overhead (<50MB vs Discord's 300MB+ Electron footprint).
2. **Global PTT Hook**: Implemented in Rust using a dedicated background thread with `rdev` / Windows `SetWindowsHookExW`, emitting native Tauri IPC events (`tauri::Emitter::emit`) to the React frontend.
3. **WebRTC SFU**: Powered by LiveKit (`livekit-client` + `@livekit/components-react`), providing low-latency Opus 48kHz audio, adaptive bitrate, and high-performance WebRTC SFU streaming.
4. **Web Audio Soundboard**: Web Audio `AudioContext` mixes local microphone audio and soundboard audio pads into a `MediaStreamAudioDestinationNode`, feeding the combined track into LiveKit's `createCustomAudioTrack`.
5. **Synchronized Music Player**: LiveKit lossless DataMessages (`room.localParticipant.publishData`) synchronize playback timestamp and state across all room participants in sub-150ms.
