/**
 * MawaBro Audio Engine
 * Mixes microphone audio with soundboard audio clips in-memory using Web Audio API
 * Output track is fed to LiveKit WebRTC peer connection without requiring virtual cable drivers.
 */

import { ChimeType } from '../types';

class AudioEngine {
  private ctx: AudioContext | null = null;
  private micStream: MediaStream | null = null;
  private micSource: MediaStreamAudioSourceNode | null = null;
  private micGain: GainNode | null = null;
  private soundboardGain: GainNode | null = null;
  private monitorGain: GainNode | null = null;
  private mixedDestination: MediaStreamAudioDestinationNode | null = null;
  private audioBufferCache: Map<string, AudioBuffer> = new Map();
  private inputGainValue: number = 1.0;
  private isMutedState: boolean = false;
  private activeDeviceId: string | null = null;
  private analyser: AnalyserNode | null = null;
  private denoiserNode: AudioWorkletNode | null = null;
  private isDenoiseEnabled: boolean = typeof window !== 'undefined' && localStorage.getItem('mawabro_rnnoise') !== 'false';
  private isWorkletLoaded: boolean = false;

  public async initialize(deviceId?: string): Promise<MediaStream> {
    if (!this.ctx || this.ctx.state === 'closed') {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx({ sampleRate: 48000 });
    }

    if (this.ctx.state === 'suspended') {
      await this.ctx.resume();
    }

    if (deviceId) {
      this.activeDeviceId = deviceId;
    }

    // Capture microphone with optimal Opus 48kHz WebRTC constraints
    const audioConstraints: MediaTrackConstraints = {
      channelCount: 2,
      sampleRate: 48000,
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
    };

    if (this.activeDeviceId) {
      audioConstraints.deviceId = { exact: this.activeDeviceId };
    }

    this.micStream = await navigator.mediaDevices.getUserMedia({
      audio: audioConstraints,
      video: false,
    });

    this.micSource = this.ctx.createMediaStreamSource(this.micStream);
    this.micGain = this.ctx.createGain();
    this.micGain.gain.value = this.isMutedState ? 0 : this.inputGainValue;

    // Gain node for soundboard volume transmitted to the WebRTC room
    this.soundboardGain = this.ctx.createGain();
    this.soundboardGain.gain.value = 0.8;

    // Gain node for local monitor (user hearing their own soundboard playback)
    this.monitorGain = this.ctx.createGain();
    this.monitorGain.gain.value = 0.5;
    this.monitorGain.connect(this.ctx.destination);

    // Composite destination for the mixed stream
    this.mixedDestination = this.ctx.createMediaStreamDestination();

    // Connect mic -> [optional RNNoise denoiser] -> micGain -> mixedDestination
    this.micGain.connect(this.mixedDestination);

    // Route through RNNoise Wasm if enabled
    await this.setNoiseSuppressionEnabled(this.isDenoiseEnabled);

    // Connect micGain -> analyser for speaking detection
    this.analyser = this.ctx.createAnalyser();
    this.analyser.fftSize = 256;
    this.micGain.connect(this.analyser);

    return this.mixedDestination.stream;
  }

  public async setNoiseSuppressionEnabled(enabled: boolean): Promise<void> {
    this.isDenoiseEnabled = enabled;
    if (!this.ctx || !this.micSource || !this.micGain) return;

    try {
      if (enabled) {
        if (!this.isWorkletLoaded) {
          try {
            await this.ctx.audioWorklet.addModule('/rnnoise-worklet.js');
            this.isWorkletLoaded = true;
          } catch (e) {
            console.warn('[AudioEngine] Could not load rnnoise worklet module:', e);
          }
        }

        if (this.isWorkletLoaded && !this.denoiserNode) {
          try {
            this.denoiserNode = new AudioWorkletNode(this.ctx, 'NoiseSuppressorWorklet');
          } catch (e) {
            console.warn('[AudioEngine] Failed to instantiate NoiseSuppressorWorklet node:', e);
          }
        }

        if (this.denoiserNode) {
          this.micSource.disconnect();
          this.micSource.connect(this.denoiserNode);
          this.denoiserNode.disconnect();
          this.denoiserNode.connect(this.micGain);
          console.log('[AudioEngine] RNNoise WebAssembly Noise Suppression ACTIVE');
          return;
        }
      }

      // If disabled or worklet not ready, route directly
      if (this.denoiserNode) {
        try {
          this.denoiserNode.disconnect();
        } catch (_) {}
      }
      this.micSource.disconnect();
      this.micSource.connect(this.micGain);
      console.log('[AudioEngine] RNNoise Noise Suppression BYPASSED');
    } catch (err) {
      console.error('[AudioEngine] Failed to toggle noise suppression:', err);
      try {
        this.micSource.disconnect();
        this.micSource.connect(this.micGain);
      } catch (_) {}
    }
  }

  public getNoiseSuppressionEnabled(): boolean {
    return this.isDenoiseEnabled;
  }

  public setMicMuted(muted: boolean): void {
    this.isMutedState = muted;
    if (this.micGain && this.ctx) {
      // Smooth fade to prevent audio popping; apply user-configured input gain when unmuted
      const targetGain = muted ? 0 : this.inputGainValue;
      this.micGain.gain.setTargetAtTime(targetGain, this.ctx.currentTime, 0.015);
    }
    // Also disable underlying tracks as fallback
    if (this.micStream) {
      this.micStream.getAudioTracks().forEach((track) => {
        track.enabled = !muted;
      });
    }
  }

  public setInputVolume(gain: number): void {
    this.inputGainValue = Math.max(0, Math.min(1.5, gain));
    if (this.micGain && this.ctx && !this.isMutedState) {
      this.micGain.gain.setTargetAtTime(this.inputGainValue, this.ctx.currentTime, 0.015);
    }
  }

  public getInputVolume(): number {
    return this.inputGainValue;
  }

  public isSpeaking(): boolean {
    if (this.isMutedState || !this.analyser) return false;
    const data = new Uint8Array(this.analyser.frequencyBinCount);
    this.analyser.getByteFrequencyData(data);
    let sum = 0;
    for (let i = 0; i < data.length; i++) {
      sum += data[i];
    }
    const avg = sum / data.length;
    // Ambient noise filter: returns true only when speaking voice energy is detected
    return avg > 12;
  }

  public async switchInputDevice(deviceId: string): Promise<void> {
    this.activeDeviceId = deviceId;
    if (this.micStream) {
      this.micStream.getTracks().forEach((t) => t.stop());
    }

    if (!this.ctx) return;

    try {
      this.micStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          deviceId: { exact: deviceId },
          channelCount: 2,
          sampleRate: 48000,
          echoCancellation: true,
          noiseSuppression: true,
        },
        video: false,
      });

      if (this.micSource) {
        this.micSource.disconnect();
      }

      this.micSource = this.ctx.createMediaStreamSource(this.micStream);
      await this.setNoiseSuppressionEnabled(this.isDenoiseEnabled);
    } catch (err) {
      console.error('[AudioEngine] Failed to switch microphone device:', err);
    }
  }

  public setSoundboardVolume(volume: number): void {
    if (this.soundboardGain) {
      this.soundboardGain.gain.value = Math.max(0, Math.min(1.0, volume));
    }
  }

  public setMonitorVolume(volume: number): void {
    if (this.monitorGain) {
      this.monitorGain.gain.value = Math.max(0, Math.min(1.0, volume));
    }
  }

  public async playSound(url: string, volume: number = 0.8): Promise<void> {
    if (!this.ctx) {
      await this.initialize();
    }
    if (!this.ctx || !this.mixedDestination || !this.soundboardGain || !this.monitorGain) {
      return;
    }

    if (this.ctx.state === 'suspended') {
      await this.ctx.resume();
    }

    let buffer = this.audioBufferCache.get(url);
    if (!buffer) {
      try {
        const response = await fetch(url);
        const arrayBuffer = await response.arrayBuffer();
        buffer = await this.ctx.decodeAudioData(arrayBuffer);
        this.audioBufferCache.set(url, buffer);
      } catch (err) {
        console.error('[AudioEngine] Failed to decode audio clip:', err);
        return;
      }
    }

    const source = this.ctx.createBufferSource();
    source.buffer = buffer;

    const clipGain = this.ctx.createGain();
    clipGain.gain.value = volume;

    source.connect(clipGain);
    // Connect to room WebRTC transmission
    clipGain.connect(this.soundboardGain);
    this.soundboardGain.connect(this.mixedDestination);

    // Connect to local speaker output
    clipGain.connect(this.monitorGain);

    source.start(0);
  }

  /**
   * Synthesize clean audio chimes for voice actions (join, leave, mute, unmute)
   */
  public playChime(type: ChimeType): void {
    try {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!this.ctx || this.ctx.state === 'closed') {
        this.ctx = new AudioCtx({ sampleRate: 48000 });
      }

      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      gain.connect(this.ctx.destination);

      if (type === 'join') {
        // Upbeat ascending double tone (C5 -> G5)
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523.25, now);
        osc.frequency.setValueAtTime(783.99, now + 0.08);
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.15, now + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
        osc.connect(gain);
        osc.start(now);
        osc.stop(now + 0.26);
      } else if (type === 'leave') {
        // Descending double tone (G5 -> C5)
        osc.type = 'sine';
        osc.frequency.setValueAtTime(783.99, now);
        osc.frequency.setValueAtTime(523.25, now + 0.08);
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.12, now + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
        osc.connect(gain);
        osc.start(now);
        osc.stop(now + 0.29);
      } else if (type === 'mute') {
        // Subtle downward click
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(450, now);
        osc.frequency.exponentialRampToValueAtTime(220, now + 0.07);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
        osc.connect(gain);
        osc.start(now);
        osc.stop(now + 0.09);
      } else if (type === 'unmute') {
        // Subtle upward chirp
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(320, now);
        osc.frequency.exponentialRampToValueAtTime(640, now + 0.07);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
        osc.connect(gain);
        osc.start(now);
        osc.stop(now + 0.09);
      }
    } catch (e) {
      console.warn('[AudioEngine] Could not play synthesized chime:', e);
    }
  }

  public getMixedTrack(): MediaStreamTrack | null {
    if (!this.mixedDestination) return null;
    return this.mixedDestination.stream.getAudioTracks()[0] || null;
  }

  public cleanup(): void {
    if (this.micStream) {
      this.micStream.getTracks().forEach((track) => track.stop());
      this.micStream = null;
    }
    if (this.ctx && this.ctx.state !== 'closed') {
      this.ctx.close();
      this.ctx = null;
    }
    this.audioBufferCache.clear();
  }
}

export const audioEngine = new AudioEngine();
