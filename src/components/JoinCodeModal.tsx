import React, { useState } from 'react';
import { X, LogIn, KeyRound } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

interface JoinCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const JoinCodeModal: React.FC<JoinCodeModalProps> = ({ isOpen, onClose }) => {
  const { channels, addChannel, setCurrentChannel } = useAppStore();
  const [inputCode, setInputCode] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const raw = inputCode.trim();
    if (!raw) return;

    // Support full invite template extraction or raw code
    let roomName = raw;
    const codeMatch = raw.match(/Quick-Join Code:\s*([^\r\n]+)/i);
    const roomMatch = raw.match(/Room:\s*([^\r\n]+)/i);

    if (codeMatch && codeMatch[1]) {
      roomName = codeMatch[1].trim();
    } else if (roomMatch && roomMatch[1]) {
      roomName = roomMatch[1].trim();
    }

    const cleanRoom = roomName.toLowerCase().replace(/[^a-z0-9_-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
    if (!cleanRoom) {
      setError('Invalid invite code or room name. Please try again.');
      return;
    }

    // Check if channel already exists in list
    let target = channels.find((c) => c.id === cleanRoom || c.name.toLowerCase() === cleanRoom);
    if (!target) {
      target = {
        id: cleanRoom,
        name: cleanRoom,
        type: 'voice',
        userCount: 0,
        isCustom: true,
      };
      addChannel(target);
    }

    setCurrentChannel(target);
    setInputCode('');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-xs z-50 flex items-center justify-center p-4 select-none animate-in fade-in duration-150">
      <div className="bg-[#313338] border border-[#3f4147] rounded-xl max-w-md w-full overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#232428] flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-cyan-400" /> Join via Code / Invite
            </h2>
            <p className="text-xs text-[#949ba4]">Paste an invite link, message, or room code</p>
          </div>
          <button
            onClick={onClose}
            className="text-[#949ba4] hover:text-white p-1 rounded-md hover:bg-[#35373c] transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleJoin} className="p-6 space-y-5">
          <div>
            <label className="text-xs font-bold text-[#b5bac1] uppercase tracking-wider block mb-2">
              Invite Code or Room Message
            </label>
            <textarea
              rows={3}
              value={inputCode}
              onChange={(e) => {
                setInputCode(e.target.value);
                if (error) setError(null);
              }}
              placeholder={`Paste invite here, e.g.:\nQuick-Join Code: squad-alpha\nor just 'squad-alpha'`}
              className="w-full px-3 py-2 rounded-lg bg-[#1e1f22] border border-[#3f4147] text-white text-sm focus:outline-none focus:border-cyan-500 font-mono resize-none"
              autoFocus
            />
            {error && <p className="text-xs text-rose-400 mt-1.5">{error}</p>}
          </div>

          <div className="bg-[#2b2d31] p-3 rounded-lg border border-[#3f4147]/50 text-xs text-[#949ba4] space-y-1">
            <p className="font-semibold text-white">💡 Quick Tip:</p>
            <p>You can paste the entire text message copied from an invite button, or simply type the room name.</p>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm text-[#949ba4] hover:text-white transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!inputCode.trim()}
              className="px-5 py-2 rounded-lg text-sm font-semibold bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white transition shadow-lg disabled:opacity-50 flex items-center gap-2"
            >
              <LogIn className="w-4 h-4" /> Join Room
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
