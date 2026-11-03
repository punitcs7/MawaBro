/**
 * LiveKit Cloud Token Service
 * Calls Tauri IPC `generate_room_token` command, with Web Crypto fallback for browser dev mode.
 */

import { getOrCreateUserId } from '../store/useAppStore';

function base64UrlEncode(data: string | Uint8Array): string {
  let base64: string;
  if (typeof data === 'string') {
    base64 = btoa(data);
  } else {
    let binary = '';
    const bytes = data;
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    base64 = btoa(binary);
  }
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function createBrowserFallbackJwt(
  roomName: string,
  participantIdentity: string,
  participantName: string,
  apiKey: string,
  apiSecret: string
): Promise<string> {
  const header = {
    alg: 'HS256',
    typ: 'JWT',
  };

  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: apiKey,
    sub: participantIdentity, // Unique participant identity for LiveKit SFU (prevents duplicate kicking)
    name: participantName,     // Human-readable display name for UI
    nbf: now - 5,
    exp: now + 86400, // 24 hours
    video: {
      room: roomName,
      roomJoin: true,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true,
    },
  };

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const dataToSign = `${encodedHeader}.${encodedPayload}`;

  const encoder = new TextEncoder();
  const keyData = encoder.encode(apiSecret);
  const cryptoKey = await window.crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await window.crypto.subtle.sign(
    'HMAC',
    cryptoKey,
    encoder.encode(dataToSign)
  );

  const encodedSignature = base64UrlEncode(new Uint8Array(signature));
  return `${dataToSign}.${encodedSignature}`;
}

export async function generateRoomToken(
  roomName: string,
  participantName: string,
  participantIdentity?: string
): Promise<string> {
  const isTauri = typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
  const identity = participantIdentity || `${participantName}_${getOrCreateUserId()}`;

  if (isTauri) {
    try {
      const { invoke } = await import('@tauri-apps/api/core');
      console.log(`[LiveKit Cloud] Requesting token: room=${roomName}, name=${participantName}, id=${identity}`);
      const token = await invoke<string>('generate_room_token', {
        roomName,
        participantIdentity: identity,
        participantName,
      });
      return token;
    } catch (err) {
      console.warn('[LiveKit Cloud] Tauri IPC token mint failed, falling back to client signer:', err);
    }
  }

  // Browser / Web fallback using credentials
  const apiKey = (import.meta.env.LIVEKIT_API_KEY as string) || 'APIGWo8aKmTzdbe';
  const apiSecret = (import.meta.env.LIVEKIT_API_SECRET as string) || 'tqwEsye14TpvwBrvK7GgneYvirKgghMKcKMsZ6K1HQI';

  return createBrowserFallbackJwt(roomName, identity, participantName, apiKey, apiSecret);
}
