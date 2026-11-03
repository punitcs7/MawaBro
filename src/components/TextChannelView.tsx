import React, { useState, useRef, useEffect } from 'react';
import {
  Hash,
  Send,
  Paperclip,
  Image as ImageIcon,
  Film,
  FileText,
  X,
  Download,
  Users,
  Search,
  CheckCircle,
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { ChannelInfo, TextChannelMessage, ChatAttachment } from '../types';

interface TextChannelViewProps {
  channel: ChannelInfo;
}

// Initial demo messages per channel if none stored
const DEFAULT_CHANNEL_MESSAGES: Record<string, TextChannelMessage[]> = {
  'lobby-text': [
    {
      id: 'init-1',
      channelId: 'lobby-text',
      senderId: 'user_bro_host',
      senderName: 'SquadLeader',
      content: 'Welcome to general-chat! Drop your messages, strategy notes, and memes here.',
      timestamp: Date.now() - 3600000,
    },
    {
      id: 'init-2',
      channelId: 'lobby-text',
      senderId: 'user_alex',
      senderName: 'ApexPredator',
      content: 'Voice chat latency is looking ultra crisp today (12ms SFU). Let’s get a squad game going tonight!',
      timestamp: Date.now() - 1800000,
    },
  ],
  'gaming-text': [
    {
      id: 'init-clips-1',
      channelId: 'gaming-text',
      senderId: 'user_gamer',
      senderName: 'SniperElite',
      content: 'Post your best clutch clips, highlight reels, and squad screenshots here! 🎯',
      timestamp: Date.now() - 7200000,
    },
  ],
  'music-text': [
    {
      id: 'init-music-1',
      channelId: 'music-text',
      senderId: 'user_dj',
      senderName: 'BeatsMaster',
      content: 'Drop your favorite YouTube URLs and tracks for the Group Music Jam session! 🎵',
      timestamp: Date.now() - 5400000,
    },
  ],
};

export const TextChannelView: React.FC<TextChannelViewProps> = ({ channel }) => {
  const { username, userId, activeRoom } = useAppStore();

  const [messages, setMessages] = useState<TextChannelMessage[]>(() => {
    try {
      const stored = localStorage.getItem(`mawabro_chat_${channel.id}`);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.warn('Failed to load chat history:', e);
    }
    return DEFAULT_CHANNEL_MESSAGES[channel.id] || [
      {
        id: `welcome-${channel.id}`,
        channelId: channel.id,
        senderId: 'system',
        senderName: 'MawaBro System',
        content: `Welcome to the beginning of the #${channel.name} channel! Send a message or attach clips and files to start the discussion.`,
        timestamp: Date.now(),
      },
    ];
  });

  const [inputText, setInputText] = useState('');
  const [attachments, setAttachments] = useState<ChatAttachment[]>([]);
  const [searchFilter, setSearchFilter] = useState('');
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Persist messages to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(`mawabro_chat_${channel.id}`, JSON.stringify(messages));
    } catch (e) {
      console.warn('Failed to save chat to localStorage:', e);
    }
  }, [messages, channel.id]);

  // Listen to incoming DataChannel messages if activeRoom is connected
  useEffect(() => {
    if (!activeRoom) return;

    const handleData = (payload: Uint8Array) => {
      try {
        const text = new TextDecoder().decode(payload);
        const data = JSON.parse(text);
        if (data.type === 'TEXT_CHANNEL_MESSAGE' && data.channelId === channel.id) {
          setMessages((prev) => {
            if (prev.some((m) => m.id === data.message.id)) return prev;
            return [...prev, data.message];
          });
        }
      } catch (err) {
        // Not a text message payload
      }
    };

    activeRoom.on('dataReceived', handleData);
    return () => {
      activeRoom.off('dataReceived', handleData);
    };
  }, [activeRoom, channel.id]);

  // Handle file uploads (images, videos, documents)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();

      let fileType: 'image' | 'video' | 'file' = 'file';
      if (file.type.startsWith('image/')) {
        fileType = 'image';
      } else if (file.type.startsWith('video/')) {
        fileType = 'video';
      }

      reader.onload = () => {
        const dataUrl = reader.result as string;
        const newAttachment: ChatAttachment = {
          id: `att-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          name: file.name,
          type: fileType,
          url: dataUrl,
          size: file.size,
        };

        setAttachments((prev) => [...prev, newAttachment]);
      };

      reader.readAsDataURL(file);
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  const handleSendMessage = (e?: React.FormEvent) => {
    e?.preventDefault();
    const content = inputText.trim();
    if (!content && attachments.length === 0) return;

    const newMessage: TextChannelMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      channelId: channel.id,
      senderId: userId,
      senderName: username,
      content,
      timestamp: Date.now(),
      attachments: attachments.length > 0 ? [...attachments] : undefined,
    };

    setMessages((prev) => [...prev, newMessage]);
    setInputText('');
    setAttachments([]);

    // Broadcast across active room via LiveKit DataChannel
    if (activeRoom) {
      try {
        const payload = JSON.stringify({
          type: 'TEXT_CHANNEL_MESSAGE',
          channelId: channel.id,
          message: newMessage,
        });
        const encoded = new TextEncoder().encode(payload);
        activeRoom.localParticipant.publishData(encoded, { reliable: true });
      } catch (err) {
        console.warn('Failed to publish text message via WebRTC data channel:', err);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const filteredMessages = searchFilter.trim()
    ? messages.filter((m) => m.content.toLowerCase().includes(searchFilter.toLowerCase()))
    : messages;

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="flex-1 flex flex-col h-screen bg-[#313338] select-none overflow-hidden relative">
      {/* 1. Channel Header */}
      <div className="h-14 border-b border-[#232428] px-5 flex items-center justify-between bg-[#2b2d31]/90 backdrop-blur-md z-10 shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Hash className="w-5 h-5 text-cyan-400" />
            <h1 className="font-bold text-white text-base tracking-tight">{channel.name}</h1>
          </div>
          <span className="hidden md:block text-xs text-[#b5bac1] border-l border-[#3f4147] pl-3 truncate max-w-md">
            {channel.id === 'clips-and-memes'
              ? 'Share gameplay highlight clips, screenshots, and funny moments'
              : channel.id === 'music-text'
              ? 'Track recommendations, playlist discussion & jam lounge'
              : 'General squad discussion, strategy notes, and updates'}
          </span>
        </div>

        {/* Top Right Utilities */}
        <div className="flex items-center gap-3">
          <div className="relative flex items-center hidden sm:flex">
            <Search className="w-3.5 h-3.5 text-[#949ba4] absolute left-2.5 pointer-events-none" />
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="Search in #channel"
              className="pl-8 pr-3 py-1 rounded-md bg-[#1e1f22] border border-[#3f4147] text-xs text-white placeholder-[#80848e] focus:outline-none focus:border-cyan-500 transition w-36 lg:w-48"
            />
          </div>

          <div className="flex items-center gap-1.5 text-xs text-[#b5bac1] font-mono bg-[#1e1f22] px-2.5 py-1 rounded-md border border-[#3f4147]">
            <Users className="w-3.5 h-3.5 text-cyan-400" />
            <span>Squad Active</span>
          </div>
        </div>
      </div>

      {/* 2. Message History Area */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5">
        {/* Channel Banner at top */}
        <div className="pt-4 pb-6 border-b border-[#383a40]/60 space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center shadow-lg border border-cyan-500/20">
            <Hash className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-extrabold text-white">Welcome to #{channel.name}!</h2>
          <p className="text-xs text-[#b5bac1] max-w-lg">
            This is the start of the <b className="text-white">#{channel.name}</b> channel. You can chat, attach
            images, embed gameplay video clips, and share files with your squad.
          </p>
        </div>

        {/* Render Messages */}
        {filteredMessages.map((msg) => {
          const isSelf = msg.senderId === userId || msg.senderName === username;
          const timeStr = new Date(msg.timestamp).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          });

          return (
            <div key={msg.id} className="flex items-start gap-3.5 group hover:bg-[#2e3035]/50 -mx-3 px-3 py-1.5 rounded-lg transition">
              {/* Avatar */}
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-md ${
                  isSelf
                    ? 'bg-gradient-to-br from-cyan-500 to-blue-600'
                    : 'bg-gradient-to-br from-fuchsia-600 to-indigo-700'
                }`}
              >
                {msg.senderName.substring(0, 2).toUpperCase()}
              </div>

              {/* Message Details */}
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-baseline gap-2">
                  <span
                    className={`text-sm font-bold truncate ${
                      isSelf ? 'text-cyan-400' : 'text-fuchsia-400'
                    }`}
                  >
                    {msg.senderName}
                  </span>
                  {isSelf && (
                    <span className="text-[10px] bg-cyan-500/20 text-cyan-300 px-1.5 py-0.2 rounded font-bold uppercase tracking-wider">
                      YOU
                    </span>
                  )}
                  <span className="text-[11px] text-[#80848e] font-mono">{timeStr}</span>
                </div>

                {/* Text Content */}
                {msg.content && (
                  <p className="text-sm text-[#dbdee1] leading-relaxed break-words whitespace-pre-wrap select-text">
                    {msg.content}
                  </p>
                )}

                {/* Attachments (Images, Videos, Files) */}
                {msg.attachments && msg.attachments.length > 0 && (
                  <div className="pt-2 space-y-2">
                    {msg.attachments.map((att) => {
                      if (att.type === 'image') {
                        return (
                          <div key={att.id} className="relative inline-block max-w-md rounded-xl overflow-hidden border border-white/10 group/img shadow-xl">
                            <img
                              src={att.url}
                              alt={att.name}
                              className="max-h-80 w-auto object-cover rounded-xl cursor-pointer hover:opacity-95 transition"
                              onClick={() => setLightboxImage(att.url)}
                            />
                            <div className="absolute bottom-2 left-2 px-2 py-1 rounded-md bg-black/70 backdrop-blur-sm text-[11px] text-white flex items-center gap-1.5">
                              <ImageIcon className="w-3 h-3 text-cyan-400" />
                              <span className="truncate max-w-[200px]">{att.name}</span>
                            </div>
                          </div>
                        );
                      }

                      if (att.type === 'video') {
                        return (
                          <div key={att.id} className="max-w-lg rounded-xl overflow-hidden border border-[#3f4147] bg-black shadow-xl">
                            <video
                              src={att.url}
                              controls
                              playsInline
                              className="w-full max-h-80 object-contain rounded-t-xl"
                            />
                            <div className="px-3 py-2 bg-[#1e1f22] flex items-center justify-between text-xs text-[#b5bac1]">
                              <span className="flex items-center gap-1.5 truncate">
                                <Film className="w-4 h-4 text-emerald-400 shrink-0" />
                                <span className="truncate">{att.name}</span>
                              </span>
                              {att.size && <span className="font-mono text-[11px]">{formatFileSize(att.size)}</span>}
                            </div>
                          </div>
                        );
                      }

                      // Generic File Document
                      return (
                        <div
                          key={att.id}
                          className="flex items-center justify-between p-3 rounded-xl bg-[#1e1f22] border border-[#3f4147] max-w-md shadow-md"
                        >
                          <div className="flex items-center gap-3 truncate pr-3">
                            <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 shrink-0">
                              <FileText className="w-5 h-5" />
                            </div>
                            <div className="truncate">
                              <p className="text-xs font-semibold text-white truncate">{att.name}</p>
                              {att.size && (
                                <p className="text-[11px] text-[#949ba4] font-mono">{formatFileSize(att.size)}</p>
                              )}
                            </div>
                          </div>
                          <a
                            href={att.url}
                            download={att.name}
                            className="p-2 rounded-lg bg-[#2b2d31] hover:bg-cyan-600 text-white transition shrink-0"
                            title="Download File"
                          >
                            <Download className="w-4 h-4" />
                          </a>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* 3. Input & Attachment Bar */}
      <div className="p-4 bg-[#2b2d31]/80 border-t border-[#232428] shrink-0">
        {/* Attachment Previews Tray */}
        {attachments.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-2 p-2 rounded-lg bg-[#1e1f22] border border-[#383a40]">
            {attachments.map((att) => (
              <div
                key={att.id}
                className="relative flex items-center gap-2 pl-2 pr-1 py-1 rounded-md bg-[#2b2d31] border border-[#3f4147] text-xs text-white"
              >
                {att.type === 'image' ? (
                  <ImageIcon className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                ) : att.type === 'video' ? (
                  <Film className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                ) : (
                  <FileText className="w-3.5 h-3.5 text-fuchsia-400 shrink-0" />
                )}
                <span className="truncate max-w-[120px] font-mono text-[11px]">{att.name}</span>
                <button
                  onClick={() => removeAttachment(att.id)}
                  className="p-1 rounded hover:bg-rose-500/20 text-[#949ba4] hover:text-rose-400 transition"
                  title="Remove attachment"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        <form
          onSubmit={handleSendMessage}
          className="relative flex items-end bg-[#1e1f22] rounded-xl border border-[#3f4147] focus-within:border-cyan-500 transition p-2"
        >
          {/* File Attachment Trigger */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-2 rounded-lg text-[#949ba4] hover:text-cyan-400 hover:bg-[#35373c] transition shrink-0"
            title="Attach images, videos, or files"
          >
            <Paperclip className="w-5 h-5" />
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            multiple
            className="hidden"
            accept="image/*,video/*,.pdf,.zip,.txt,.doc,.docx"
          />

          {/* Text Input */}
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Message #${channel.name}... (Press Enter to send)`}
            rows={1}
            className="w-full bg-transparent text-sm text-white placeholder-[#80848e] resize-none focus:outline-none max-h-32 px-3 py-1.5"
          />

          {/* Send Button */}
          <button
            type="submit"
            disabled={!inputText.trim() && attachments.length === 0}
            className="p-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white disabled:opacity-30 transition shadow-md shrink-0 cursor-pointer"
            title="Send Message"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>

        <div className="flex items-center justify-between text-[11px] text-[#80848e] mt-1.5 px-1">
          <span>Press <b>Enter</b> to send, <b>Shift + Enter</b> for new line</span>
          <span className="flex items-center gap-1 text-cyan-400/80">
            <CheckCircle className="w-3 h-3" /> Images, clips & file sharing active
          </span>
        </div>
      </div>

      {/* Lightbox Modal for Fullsize Image View */}
      {lightboxImage && (
        <div
          onClick={() => setLightboxImage(null)}
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4 cursor-pointer animate-in fade-in"
        >
          <div className="relative max-w-5xl max-h-[90vh]">
            <img
              src={lightboxImage}
              alt="Enlarged preview"
              className="max-h-[85vh] max-w-full rounded-xl object-contain shadow-2xl"
            />
            <button
              onClick={() => setLightboxImage(null)}
              className="absolute top-2 right-2 p-2 rounded-full bg-black/60 text-white hover:bg-black/80 transition"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
