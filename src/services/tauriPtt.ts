/**
 * MawaBro Tauri IPC Integration for Global Push-to-Talk (PTT)
 */
import { useAppStore } from '../store/useAppStore';

interface PttPayload {
  active: boolean;
  key: string;
}

export async function initTauriPtt(): Promise<() => void> {
  const isTauri = typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;

  if (isTauri) {
    try {
      const { listen } = await import('@tauri-apps/api/event');
      const { invoke } = await import('@tauri-apps/api/core');

      console.log('[Tauri PTT] Registering global PTT IPC event listener');

      // Sync initial key setting with backend
      const currentKey = useAppStore.getState().pttKey;
      await invoke('set_ptt_key', { key: currentKey });

      const unlisten = await listen<PttPayload>('ptt-active', (event) => {
        console.log('[Tauri PTT Event received]', event.payload);
        const { inputMode } = useAppStore.getState();
        if (inputMode === 'push_to_talk') {
          useAppStore.getState().setIsPttActive(event.payload.active);
        }
      });

      return () => {
        unlisten();
      };
    } catch (e) {
      console.warn('[Tauri PTT] Failed to register Tauri IPC listener, using browser fallback:', e);
    }
  }

  // Webview / Browser fallback when testing without Tauri binary
  const handleKeyDown = (e: KeyboardEvent) => {
    const { inputMode, pttKey, isPttActive } = useAppStore.getState();
    if (inputMode === 'push_to_talk' && e.code.toLowerCase() === pttKey.toLowerCase()) {
      if (!isPttActive) {
        useAppStore.getState().setIsPttActive(true);
      }
    }
  };

  const handleKeyUp = (e: KeyboardEvent) => {
    const { inputMode, pttKey } = useAppStore.getState();
    if (inputMode === 'push_to_talk' && e.code.toLowerCase() === pttKey.toLowerCase()) {
      useAppStore.getState().setIsPttActive(false);
    }
  };

  window.addEventListener('keydown', handleKeyDown);
  window.addEventListener('keyup', handleKeyUp);

  return () => {
    window.removeEventListener('keydown', handleKeyDown);
    window.removeEventListener('keyup', handleKeyUp);
  };
}

export async function updateBackendPttKey(key: string): Promise<void> {
  const isTauri = typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
  if (isTauri) {
    try {
      const { invoke } = await import('@tauri-apps/api/core');
      await invoke('set_ptt_key', { key });
    } catch (e) {
      console.error('[Tauri PTT] Error updating backend PTT key:', e);
    }
  }
}
