import React, { useState } from 'react';
import { X, Volume2, Hash, Plus } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { ChannelInfo } from '../types';

interface CreateChannelModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CreateChannelModal: React.FC<CreateChannelModalProps> = ({ isOpen, onClose }) => {
  const { addChannel, setCurrentChannel } = useAppStore();
  const [name, setName] = useState('');
  const [type, setType] = useState<'voice' | 'text'>('voice');

  if (!isOpen) return null;

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = name.trim().toLowerCase().replace(/\s+/g, '-');
    if (!cleanName) return;

    const newChannel: ChannelInfo = {
      id: `custom-${Date.now()}`,
      name: cleanName,
      type,
      userCount: 0,
      isCustom: true,
    };

    addChannel(newChannel);
    if (type === 'voice') {
      setCurrentChannel(newChannel);
    }
    setName('');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-xs z-50 flex items-center justify-center p-4 select-none animate-in fade-in duration-150">
      <div className="bg-[#313338] border border-[#3f4147] rounded-xl max-w-md w-full overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#232428] flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Plus className="w-5 h-5 text-cyan-400" /> Create Channel
            </h2>
            <p className="text-xs text-[#949ba4]">Add a custom voice lounge or text channel</p>
          </div>
          <button
            onClick={onClose}
            className="text-[#949ba4] hover:text-white p-1 rounded-md hover:bg-[#35373c] transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleCreate} className="p-6 space-y-5">
          {/* Channel Type Selector */}
          <div>
            <label className="text-xs font-bold text-[#b5bac1] uppercase tracking-wider block mb-2">
              Channel Type
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setType('voice')}
                className={`p-3 rounded-lg border text-left flex items-center gap-3 transition ${
                  type === 'voice'
                    ? 'border-cyan-500 bg-cyan-500/10 text-white'
                    : 'border-[#3f4147] bg-[#2b2d31] text-[#949ba4] hover:border-[#4e5058]'
                }`}
              >
                <div className={`p-2 rounded-lg ${type === 'voice' ? 'bg-cyan-500/20 text-cyan-400' : 'bg-[#1e1f22]'}`}>
                  <Volume2 className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-semibold text-sm text-white">Voice</p>
                  <p className="text-[11px] text-[#949ba4]">Low-latency voice & 4K share</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setType('text')}
                className={`p-3 rounded-lg border text-left flex items-center gap-3 transition ${
                  type === 'text'
                    ? 'border-cyan-500 bg-cyan-500/10 text-white'
                    : 'border-[#3f4147] bg-[#2b2d31] text-[#949ba4] hover:border-[#4e5058]'
                }`}
              >
                <div className={`p-2 rounded-lg ${type === 'text' ? 'bg-cyan-500/20 text-cyan-400' : 'bg-[#1e1f22]'}`}>
                  <Hash className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-semibold text-sm text-white">Text</p>
                  <p className="text-[11px] text-[#949ba4]">In-room messaging</p>
                </div>
              </button>
            </div>
          </div>

          {/* Channel Name Input */}
          <div>
            <label className="text-xs font-bold text-[#b5bac1] uppercase tracking-wider block mb-2">
              Channel Name
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-[#949ba4]">
                {type === 'voice' ? <Volume2 className="w-4 h-4" /> : <Hash className="w-4 h-4" />}
              </span>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="new-channel"
                className="w-full pl-9 pr-3 py-2 rounded-lg bg-[#1e1f22] border border-[#3f4147] text-white text-sm focus:outline-none focus:border-cyan-500"
                autoFocus
              />
            </div>
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
              disabled={!name.trim()}
              className="px-5 py-2 rounded-lg text-sm font-semibold bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white transition shadow-lg disabled:opacity-50"
            >
              Create Channel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
