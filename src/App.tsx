import React, { useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { VoiceRoom } from './components/VoiceRoom';
import { TextChannelView } from './components/TextChannelView';
import { WelcomeView } from './components/WelcomeView';
import { SettingsModal } from './components/SettingsModal';
import { CreateChannelModal } from './components/CreateChannelModal';
import { JoinCodeModal } from './components/JoinCodeModal';
import { UpdateModal } from './components/UpdateModal';
import { OverlayView } from './components/OverlayView';
import { useAppStore } from './store/useAppStore';
import { initTauriPtt } from './services/tauriPtt';
import { listen } from '@tauri-apps/api/event';

export const App: React.FC = () => {
  const { currentChannel, activePanel, setActivePanel, toggleMute, toggleDeafen } = useAppStore();

  const isOverlay =
    typeof window !== 'undefined' &&
    (window.location.hash.includes('overlay') || window.location.pathname === '/overlay');

  useEffect(() => {
    let cleanupPtt: (() => void) | undefined;

    initTauriPtt().then((cleanup) => {
      cleanupPtt = cleanup;
    });

    // Listen for System Tray Actions
    let unlistenMute: (() => void) | undefined;
    let unlistenDeafen: (() => void) | undefined;

    listen('tray-toggle-mute', () => {
      toggleMute();
    }).then((un) => {
      unlistenMute = un;
    }).catch(() => {});

    listen('tray-toggle-deafen', () => {
      toggleDeafen();
    }).then((un) => {
      unlistenDeafen = un;
    }).catch(() => {});

    // Suppress default WebView2/Edge browser context menu globally
    const handleContextMenu = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      const isTextInput =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable ||
        Boolean(target.closest('input')) ||
        Boolean(target.closest('textarea'));

      if (!isTextInput) {
        e.preventDefault();
      }
    };

    window.addEventListener('contextmenu', handleContextMenu);

    return () => {
      cleanupPtt?.();
      unlistenMute?.();
      unlistenDeafen?.();
      window.removeEventListener('contextmenu', handleContextMenu);
    };
  }, [toggleMute, toggleDeafen]);

  if (isOverlay) {
    return <OverlayView />;
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#1e1f22] text-[#dbdee1]">
      <Sidebar />

      {currentChannel ? (
        currentChannel.type === 'voice' ? (
          <VoiceRoom />
        ) : (
          <TextChannelView channel={currentChannel} />
        )
      ) : (
        <WelcomeView />
      )}

      <SettingsModal
        isOpen={activePanel === 'settings'}
        onClose={() => setActivePanel(null)}
      />

      <CreateChannelModal
        isOpen={activePanel === 'create_channel'}
        onClose={() => setActivePanel(null)}
      />

      <JoinCodeModal
        isOpen={activePanel === 'join_code'}
        onClose={() => setActivePanel(null)}
      />

      <UpdateModal />
    </div>
  );
};
export default App;
