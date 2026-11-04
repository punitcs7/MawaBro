import React, { useState, useEffect } from 'react';
import { Download, RefreshCw, Sparkles, X, ArrowUpCircle, AlertCircle } from 'lucide-react';
import { check, Update, DownloadEvent } from '@tauri-apps/plugin-updater';

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

export const UpdateModal: React.FC = () => {
  const [update, setUpdate] = useState<Update | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadedBytes, setDownloadedBytes] = useState(0);
  const [totalBytes, setTotalBytes] = useState(0);
  const [statusText, setStatusText] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Auto-check for updates on app startup
  useEffect(() => {
    let isMounted = true;

    const runCheck = async () => {
      try {
        const found = await check();
        if (found && isMounted) {
          setUpdate(found);
          setIsOpen(true);
        }
      } catch (err: any) {
        // Silently catch network / endpoint errors during local dev
        console.info('[Updater] Check skipped or endpoint unavailable:', err?.message || err);
      }
    };

    // Give the desktop app a moment to hydrate before checking
    const timer = setTimeout(runCheck, 3000);
    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, []);

  const handleDownloadAndInstall = async () => {
    if (!update) return;

    setIsDownloading(true);
    setErrorMsg(null);
    setStatusText('Connecting to release server...');
    setDownloadedBytes(0);
    setTotalBytes(0);

    let currentDownloaded = 0;

    try {
      await update.download((event: DownloadEvent) => {
        switch (event.event) {
          case 'Started': {
            const len = event.data.contentLength ?? 0;
            setTotalBytes(len);
            setStatusText(`Downloading update package (${formatBytes(len)})...`);
            break;
          }
          case 'Progress': {
            currentDownloaded += event.data.chunkLength;
            setDownloadedBytes(currentDownloaded);
            break;
          }
          case 'Finished': {
            setStatusText('Download verified! Launching installer and restarting...');
            break;
          }
        }
      });

      try {
        const { invoke } = await import('@tauri-apps/api/core');
        await invoke('prepare_for_update');
      } catch (_) {}

      await update.install({ restartAfterInstall: true });
    } catch (err: any) {
      console.error('[Updater] Download & install failed:', err);
      setErrorMsg(err?.message || 'Failed to download and install update.');
      setIsDownloading(false);
    }
  };

  const handleDismiss = async () => {
    setIsOpen(false);
    if (update && !isDownloading) {
      try {
        await update.close();
      } catch (_) {}
    }
  };

  if (!isOpen || !update) return null;

  const progressPercent =
    totalBytes > 0 ? Math.min(100, Math.round((downloadedBytes / totalBytes) * 100)) : 0;

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-xs z-50 flex items-center justify-center p-4 select-none animate-in fade-in zoom-in-95 duration-200">
      <div className="bg-[#2b2d31] border border-cyan-500/40 rounded-2xl max-w-md w-full overflow-hidden shadow-[0_0_35px_rgba(6,182,212,0.25)]">
        {/* Header */}
        <div className="px-6 py-4 bg-[#1e1f22] border-b border-[#35373c] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 p-0.5 flex items-center justify-center shadow-lg shadow-cyan-950/40">
              <ArrowUpCircle className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">Update Available</h3>
                <span className="text-[10px] px-2 py-0.5 rounded-md bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-mono font-bold uppercase shadow-sm">
                  v{update.version}
                </span>
              </div>
              <p className="text-xs text-[#949ba4]">
                Current: <span className="font-mono text-[#dbdee1]">v{update.currentVersion}</span>
              </p>
            </div>
          </div>

          {!isDownloading && (
            <button
              onClick={handleDismiss}
              className="text-[#949ba4] hover:text-white p-1 rounded-md hover:bg-[#35373c] transition"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Body Content */}
        <div className="p-6 space-y-4">
          <div className="flex items-start gap-2.5 bg-black/40 p-3 rounded-xl border border-white/5 text-xs text-[#dbdee1]">
            <Sparkles className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-semibold text-white block">What&apos;s New in v{update.version}:</span>
              <p className="text-[#949ba4] whitespace-pre-wrap leading-relaxed">
                {update.body || 'Performance enhancements, bug fixes, and audio stability improvements.'}
              </p>
            </div>
          </div>

          {/* Progress Bar (Visible while downloading) */}
          {isDownloading && (
            <div className="space-y-2 pt-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-cyan-300">{statusText}</span>
                <span className="font-mono font-bold text-white">{progressPercent}%</span>
              </div>

              <div className="w-full h-3 bg-[#1e1f22] rounded-full overflow-hidden p-0.5 border border-[#3f4147]">
                <div
                  className="h-full bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-500 rounded-full transition-all duration-150"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>

              {totalBytes > 0 && (
                <div className="flex justify-between text-[11px] font-mono text-[#949ba4]">
                  <span>{formatBytes(downloadedBytes)}</span>
                  <span>{formatBytes(totalBytes)}</span>
                </div>
              )}
            </div>
          )}

          {/* Error Banner */}
          {errorMsg && (
            <div className="flex items-center gap-2 p-3 bg-rose-500/15 border border-rose-500/40 rounded-xl text-xs text-rose-300">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-[#1e1f22] border-t border-[#35373c] flex items-center justify-end gap-3">
          {!isDownloading && (
            <button
              onClick={handleDismiss}
              className="px-4 py-2 text-xs font-semibold text-[#949ba4] hover:text-white hover:bg-[#35373c] rounded-xl transition"
            >
              Remind Me Later
            </button>
          )}

          <button
            onClick={handleDownloadAndInstall}
            disabled={isDownloading}
            className={`flex items-center gap-2 px-5 py-2 text-xs font-bold rounded-xl transition shadow-lg ${
              isDownloading
                ? 'bg-cyan-500/30 text-cyan-300 cursor-not-allowed'
                : 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-cyan-950/40 active:scale-95'
            }`}
          >
            {isDownloading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Updating...</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>Update & Restart</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
