import React, { useState, useRef, useEffect } from 'react';
import { useChat } from '@livekit/components-react';
import { Send, X, MessageSquare, Image as ImageIcon } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

interface ChatPanelProps {
  onClose?: () => void;
}

export const ChatPanel: React.FC<ChatPanelProps> = ({ onClose }) => {
  const { send, chatMessages, isSending } = useChat();
  const { username, userId } = useAppStore();
  const [draft, setDraft] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const text = draft.trim();
    if (!text || isSending) return;

    try {
      await send(text);
      setDraft('');
    } catch (err) {
      console.error('Failed to send chat message:', err);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Render message content with links and image embeds
  const renderMessageContent = (text: string) => {
    // URL regex
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = text.split(urlRegex);

    return parts.map((part, index) => {
      if (part.match(urlRegex)) {
        const isImage = /\.(jpeg|jpg|gif|png|webp)(\?.*)?$/i.test(part);
        if (isImage) {
          return (
            <div key={index} className="mt-2 rounded-lg overflow-hidden max-w-xs border border-white/10 group relative">
              <img
                src={part}
                alt="Shared attachment"
                className="max-h-48 w-auto object-cover rounded-lg hover:opacity-95 transition cursor-pointer"
                onClick={() => window.open(part, '_blank')}
                loading="lazy"
              />
              <a
                href={part}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] text-cyan-400 underline block mt-1 truncate max-w-full px-1"
              >
                {part}
              </a>
            </div>
          );
        }
        return (
          <a
            key={index}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className="text-cyan-400 hover:text-cyan-300 underline break-all transition font-medium"
          >
            {part}
          </a>
        );
      }
      return <span key={index}>{part}</span>;
    });
  };

  return (
    <div className="flex flex-col h-full w-80 lg:w-96 bg-[#2b2d31] border-l border-[#1f2023] shadow-2xl select-none animate-in slide-in-from-right duration-200">
      {/* Header */}
      <div className="h-14 px-4 border-b border-[#1f2023] flex items-center justify-between bg-[#232428]/60 backdrop-blur-xs">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400">
            <MessageSquare className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white leading-tight">In-Room Chat</h3>
            <p className="text-[11px] text-[#949ba4]">
              {chatMessages.length} message{chatMessages.length === 1 ? '' : 's'}
            </p>
          </div>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#949ba4] hover:text-white hover:bg-[#35373c] transition"
            title="Close Chat"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Message List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {chatMessages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-[#949ba4]">
            <div className="w-12 h-12 rounded-full bg-[#1e1f22] flex items-center justify-center mb-3 text-cyan-400">
              <MessageSquare className="w-6 h-6 opacity-60" />
            </div>
            <p className="text-sm font-semibold text-white">No messages yet</p>
            <p className="text-xs text-[#949ba4] mt-1 max-w-[200px]">
              Be the first to say hello or share links and image URLs with the squad!
            </p>
          </div>
        ) : (
          chatMessages.map((msg, idx) => {
            const isSelf =
              msg.from?.identity === username ||
              msg.from?.identity?.includes(userId) ||
              msg.from?.name === username;
            const senderName = msg.from?.name || msg.from?.identity || 'Anonymous';
            const timeStr = new Date(msg.timestamp).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            });

            return (
              <div key={msg.id || idx} className="flex flex-col group">
                <div className="flex items-baseline gap-2 mb-1">
                  <span
                    className={`text-xs font-bold ${
                      isSelf ? 'text-cyan-400' : 'text-fuchsia-400'
                    }`}
                  >
                    {senderName}
                  </span>
                  {isSelf && (
                    <span className="text-[10px] bg-cyan-500/20 text-cyan-300 px-1 rounded font-semibold">
                      YOU
                    </span>
                  )}
                  <span className="text-[10px] text-[#80848e]">{timeStr}</span>
                </div>

                <div
                  className={`text-sm rounded-xl px-3.5 py-2 break-words leading-relaxed ${
                    isSelf
                      ? 'bg-cyan-950/40 border border-cyan-500/20 text-[#e1e5eb]'
                      : 'bg-[#1e1f22] border border-[#35373c] text-[#dbdee1]'
                  }`}
                >
                  {renderMessageContent(msg.message)}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Box */}
      <div className="p-3 border-t border-[#1f2023] bg-[#232428]/40">
        <form onSubmit={handleSend} className="relative flex items-end bg-[#1e1f22] rounded-xl border border-[#3f4147] focus-within:border-cyan-500/80 transition p-2">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Send a message to squad..."
            rows={1}
            className="w-full bg-transparent text-sm text-white placeholder-[#80848e] resize-none focus:outline-none max-h-24 pr-10 py-1"
          />
          <button
            type="submit"
            disabled={!draft.trim() || isSending}
            className="absolute right-2.5 bottom-2 p-1.5 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 text-white disabled:opacity-30 hover:brightness-110 transition shadow-md"
            title="Send (Enter)"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
        <p className="text-[10px] text-[#80848e] mt-1.5 px-1 flex items-center justify-between">
          <span>Press <b>Enter</b> to send, <b>Shift+Enter</b> for new line</span>
          <span className="flex items-center gap-1 opacity-70">
            <ImageIcon className="w-3 h-3" /> Image links auto-preview
          </span>
        </p>
      </div>
    </div>
  );
};
