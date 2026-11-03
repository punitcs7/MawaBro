export type ScreenSharePreset = '1080p60' | '4k30' | '4k60';

export interface ScreenShareConfig {
  preset: ScreenSharePreset;
  width: number;
  height: number;
  frameRate: number;
  maxBitrate: number; // in bps
  captureAudio: boolean;
}

export const SCREEN_SHARE_PRESETS: Record<ScreenSharePreset, ScreenShareConfig> = {
  '1080p60': {
    preset: '1080p60',
    width: 1920,
    height: 1080,
    frameRate: 60,
    maxBitrate: 6_000_000, // 6 Mbps
    captureAudio: true,
  },
  '4k30': {
    preset: '4k30',
    width: 3840,
    height: 2160,
    frameRate: 30,
    maxBitrate: 15_000_000, // 15 Mbps
    captureAudio: true,
  },
  '4k60': {
    preset: '4k60',
    width: 3840,
    height: 2160,
    frameRate: 60,
    maxBitrate: 20_000_000, // 20 Mbps
    captureAudio: true,
  },
};

export interface SoundPad {
  id: string;
  name: string;
  emoji: string;
  keybind?: string;
  url: string;
  isCustom?: boolean;
}

export interface SyncMessagePayload {
  type: 'PLAY' | 'PAUSE' | 'SEEK' | 'STATE_REQUEST' | 'STATE_SYNC';
  trackUrl: string;
  timestamp: number;
  sentAt: number;
  isPlaying: boolean;
  senderId?: string;
}

export type InputMode = 'voice_activity' | 'push_to_talk';

export interface ChannelInfo {
  id: string;
  name: string;
  type: 'voice' | 'text';
  userCount?: number;
  isCustom?: boolean;
}

export type ChimeType = 'join' | 'leave' | 'mute' | 'unmute';

export interface ChatAttachment {
  id: string;
  name: string;
  type: 'image' | 'video' | 'file';
  url: string; // Base64 Data URL or public web URL
  size?: number;
}

export interface TextChannelMessage {
  id: string;
  channelId: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: number;
  attachments?: ChatAttachment[];
}

