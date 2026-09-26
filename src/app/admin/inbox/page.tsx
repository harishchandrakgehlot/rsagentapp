'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { WhatsAppInboxMessage, WhatsAppChatThread } from '@/types';
import {
  MessageSquareText,
  Search,
  CheckCheck,
  RefreshCw,
  ExternalLink,
  Ticket,
  Send,
  ArrowLeft,
  Smile,
  Paperclip,
  Moon,
  Sun,
  X,
  Lock,
  AlertCircle,
} from 'lucide-react';

function createTempMessage(text: string, thread: WhatsAppChatThread): WhatsAppInboxMessage {
  const tempId = `temp-${Date.now()}`;
  return {
    id: tempId,
    provider_message_id: tempId,
    sender_phone: thread.phone,
    sender_name: 'Royal Services Admin',
    message_text: text,
    message_type: 'text',
    timestamp: new Date().toISOString(),
    is_read: true,
    direction: 'outbound',
    linked_token_id: thread.linkedTokenId,
    linked_token_number: thread.linkedTokenNumber,
    linked_agent_id: thread.linkedAgentId,
    linked_agent_name: thread.linkedAgentName,
  };
}

export default function AdminWhatsAppWebPage() {
  const [threads, setThreads] = useState<WhatsAppChatThread[]>([]);
  const [selectedPhone, setSelectedPhone] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filterMode, setFilterMode] = useState<'all' | 'unread' | 'tokens' | 'agents'>('all');
  const [darkMode, setDarkMode] = useState(true);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Fetch threads and messages from backend
  const fetchInboxData = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const res = await fetch('/api/inbox');
      if (res.ok) {
        const data = await res.json();
        const incomingThreads: WhatsAppChatThread[] = data.threads || [];
        setThreads(incomingThreads);

        // Auto-select first thread if none selected on desktop
        if (!selectedPhone && incomingThreads.length > 0 && typeof window !== 'undefined' && window.innerWidth >= 768) {
          setSelectedPhone(incomingThreads[0].phone);
        }
      }
    } catch (err) {
      console.error('Error fetching inbox:', err);
    } finally {
      setLoading(false);
      if (isManual) setRefreshing(false);
    }
  };

  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        const res = await fetch('/api/inbox');
        if (res.ok) {
          const data = await res.json();
          if (!ignore) {
            const incomingThreads: WhatsAppChatThread[] = data.threads || [];
            setThreads(incomingThreads);
            if (incomingThreads.length > 0 && typeof window !== 'undefined' && window.innerWidth >= 768) {
              setSelectedPhone(incomingThreads[0].phone);
            }
          }
        }
      } catch (err) {
        console.error('Error initializing inbox:', err);
      } finally {
        if (!ignore) setLoading(false);
      }
    })();

    // Background polling every 8s for live message updates
    const pollTimer = setInterval(() => {
      if (!ignore) fetchInboxData(false);
    }, 8000);

    return () => {
      ignore = true;
      clearInterval(pollTimer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Scroll to bottom when messages in active thread change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selectedPhone, threads]);

  // Find currently active thread
  const activeThread = threads.find(t => t.phone === selectedPhone) || null;

  // Mark thread as read when selected
  const handleSelectThread = async (phone: string) => {
    setSelectedPhone(phone);
    setSendError(null);
    setTimeout(() => inputRef.current?.focus(), 100);

    // Optimistically clear unread count for this thread
    setThreads(prev =>
      prev.map(t => (t.phone === phone ? { ...t, unreadCount: 0 } : t))
    );

    try {
      await fetch('/api/inbox', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'mark_thread_read', phone }),
      });
    } catch {}
  };

  // Send reply from website via Meta WhatsApp Cloud API
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || !activeThread || sending) return;

    const textToSend = inputText.trim();
    setInputText('');
    setSending(true);
    setSendError(null);

    // Optimistic message append
    const optimisticMsg = createTempMessage(textToSend, activeThread);
    const tempId = optimisticMsg.id;

    setThreads(prev =>
      prev.map(t => {
        if (t.phone === activeThread.phone) {
          return {
            ...t,
            lastMessage: optimisticMsg,
            messages: [...t.messages, optimisticMsg],
          };
        }
        return t;
      })
    );

    try {
      const res = await fetch('/api/inbox', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipientPhone: activeThread.phone,
          recipientName: activeThread.contactName,
          messageText: textToSend,
          linkedTokenId: activeThread.linkedTokenId,
          linkedAgentId: activeThread.linkedAgentId,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setSendError(data.error || 'Failed to dispatch via Meta API');
      } else if (data.message) {
        // Replace optimistic message with actual provider message
        setThreads(prev =>
          prev.map(t => {
            if (t.phone === activeThread.phone) {
              return {
                ...t,
                messages: t.messages.map(m => (m.id === tempId ? data.message : m)),
                lastMessage: data.message,
              };
            }
            return t;
          })
        );
      }
    } catch (err) {
      setSendError(err instanceof Error ? err.message : 'Network error');
    } finally {
      setSending(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  };

  // Filter threads
  const filteredThreads = threads.filter(t => {
    if (filterMode === 'unread' && t.unreadCount === 0) return false;
    if (filterMode === 'tokens' && !t.linkedTokenNumber) return false;
    if (filterMode === 'agents' && !t.linkedAgentName) return false;

    if (search.trim()) {
      const q = search.toLowerCase().trim();
      return (
        t.contactName.toLowerCase().includes(q) ||
        t.phone.includes(q) ||
        (t.linkedTokenNumber && t.linkedTokenNumber.toLowerCase().includes(q)) ||
        (t.linkedAgentName && t.linkedAgentName.toLowerCase().includes(q)) ||
        t.lastMessage.message_text.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Time formatter
  const formatMsgTime = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString('en-IN', {
        timeZone: 'Asia/Kolkata',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });
    } catch {
      return '';
    }
  };

  const formatThreadDate = (isoString: string) => {
    try {
      const d = new Date(isoString);
      const now = new Date();
      const isToday = d.toDateString() === now.toDateString();
      if (isToday) {
        return d.toLocaleTimeString('en-IN', {
          timeZone: 'Asia/Kolkata',
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
        });
      }
      return d.toLocaleDateString('en-IN', {
        timeZone: 'Asia/Kolkata',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    } catch {
      return '';
    }
  };

  // Color generator for contact avatars
  const getAvatarBg = (name: string) => {
    const colors = [
      'bg-emerald-600',
      'bg-blue-600',
      'bg-purple-600',
      'bg-amber-600',
      'bg-rose-600',
      'bg-teal-600',
      'bg-indigo-600',
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash += name.charCodeAt(i);
    return colors[Math.abs(hash) % colors.length];
  };

  return (
    <div
      className={`rounded-2xl overflow-hidden border shadow-xl transition-colors duration-200 ${
        darkMode
          ? 'bg-[#111b21] border-[#222d34] text-[#e9edef]'
          : 'bg-white border-slate-200 text-slate-800'
      } h-[calc(100vh-6.5rem)] flex flex-col`}
    >
      {/* WhatsApp Top Navigation Bar */}
      <div
        className={`px-4 py-2.5 flex items-center justify-between border-b ${
          darkMode ? 'bg-[#202c33] border-[#222d34]' : 'bg-[#f0f2f5] border-slate-200'
        }`}
      >
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-[#00a884] flex items-center justify-center text-white shadow-xs">
            <MessageSquareText className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-sm tracking-tight">Royal Services WhatsApp Web</span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-[#00a884]/20 text-[#00a884]">
                LIVE META API
              </span>
            </div>
            <p className="text-[11px] opacity-70">
              Business Number: <span className="font-mono font-medium">+91 98191 43222</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchInboxData(true)}
            className={`p-2 rounded-full transition-colors ${
              darkMode ? 'hover:bg-[#374248] text-[#aebac1]' : 'hover:bg-slate-200 text-slate-600'
            }`}
            title="Refresh messages"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => setDarkMode(!darkMode)}
            className={`p-2 rounded-full transition-colors ${
              darkMode ? 'hover:bg-[#374248] text-[#aebac1]' : 'hover:bg-slate-200 text-slate-600'
            }`}
            title={darkMode ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
          >
            {darkMode ? <Sun className="w-4 h-4 text-amber-300" /> : <Moon className="w-4 h-4 text-slate-700" />}
          </button>
        </div>
      </div>

      {/* Main 2-Pane Container */}
      <div className="flex-1 flex overflow-hidden">
        {/* ============================================================ */}
        {/* LEFT COLUMN: CHAT THREADS LIST (Desktop: 380px, Mobile: full if no chat) */}
        {/* ============================================================ */}
        <div
          className={`${
            selectedPhone ? 'hidden md:flex' : 'flex'
          } w-full md:w-[380px] lg:w-[420px] flex-col border-r ${
            darkMode ? 'bg-[#111b21] border-[#222d34]' : 'bg-white border-slate-200'
          }`}
        >
          {/* Search Bar */}
          <div className="p-2.5 space-y-2">
            <div
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs ${
                darkMode
                  ? 'bg-[#202c33] border-transparent text-[#e9edef] focus-within:border-[#00a884]'
                  : 'bg-[#f0f2f5] border-transparent text-slate-800 focus-within:border-[#00a884]'
              }`}
            >
              <Search className="w-4 h-4 opacity-50 shrink-0" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search or start a new chat"
                className="bg-transparent outline-none w-full placeholder:opacity-50 text-xs"
              />
              {search && (
                <button onClick={() => setSearch('')} className="opacity-50 hover:opacity-100">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto text-[11px] pb-1 scrollbar-none">
              {(['all', 'unread', 'tokens', 'agents'] as const).map(mode => (
                <button
                  key={mode}
                  onClick={() => setFilterMode(mode)}
                  className={`px-3 py-1 rounded-full font-medium capitalize shrink-0 transition-all ${
                    filterMode === mode
                      ? 'bg-[#00a884] text-white font-semibold'
                      : darkMode
                      ? 'bg-[#202c33] text-[#8696a0] hover:bg-[#2a3942]'
                      : 'bg-[#f0f2f5] text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>

          {/* Threads List */}
          <div className="flex-1 overflow-y-auto divide-y divide-transparent">
            {loading ? (
              <div className="p-8 text-center opacity-60 flex flex-col items-center gap-2">
                <RefreshCw className="w-6 h-6 animate-spin text-[#00a884]" />
                <p className="text-xs">Loading conversations...</p>
              </div>
            ) : filteredThreads.length === 0 ? (
              <div className="p-8 text-center opacity-60 space-y-2">
                <MessageSquareText className="w-8 h-8 mx-auto text-[#00a884]" />
                <p className="text-xs font-semibold">No chats found</p>
                <p className="text-[11px] opacity-75">
                  Incoming replies sent to +91 98191 43222 will appear here automatically.
                </p>
              </div>
            ) : (
              filteredThreads.map(thread => {
                const isSelected = thread.phone === selectedPhone;
                const lastMsg = thread.lastMessage;
                const isOutbound = lastMsg?.direction === 'outbound';

                return (
                  <button
                    key={thread.phone}
                    onClick={() => handleSelectThread(thread.phone)}
                    className={`w-full text-left p-3 flex items-start gap-3 transition-colors ${
                      isSelected
                        ? darkMode
                          ? 'bg-[#2a3942]'
                          : 'bg-[#f0f2f5]'
                        : darkMode
                        ? 'hover:bg-[#202c33]'
                        : 'hover:bg-slate-50'
                    }`}
                  >
                    {/* Contact Avatar */}
                    <div
                      className={`w-11 h-11 rounded-full shrink-0 flex items-center justify-center text-white font-bold text-sm shadow-xs ${getAvatarBg(
                        thread.contactName
                      )}`}
                    >
                      {thread.contactName.slice(0, 2).toUpperCase()}
                    </div>

                    {/* Chat Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-semibold text-xs truncate">
                          {thread.contactName}
                        </span>
                        <span
                          className={`text-[10px] shrink-0 ${
                            thread.unreadCount > 0 ? 'text-[#00a884] font-bold' : 'opacity-50'
                          }`}
                        >
                          {formatThreadDate(lastMsg.timestamp)}
                        </span>
                      </div>

                      {/* Phone & Linked Token Pill */}
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[10px] opacity-60 font-mono">
                          +{thread.phone}
                        </span>
                        {thread.linkedTokenNumber && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-semibold bg-amber-500/15 text-amber-500">
                            {thread.linkedTokenNumber}
                          </span>
                        )}
                        {thread.linkedAgentName && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-medium bg-purple-500/15 text-purple-400 truncate">
                            {thread.linkedAgentName}
                          </span>
                        )}
                      </div>

                      {/* Last Message Preview with Double Checkmarks if outbound */}
                      <div className="flex items-center justify-between gap-2 mt-1">
                        <div className="flex items-center gap-1 text-[11px] opacity-70 truncate">
                          {isOutbound && (
                            <CheckCheck className="w-3.5 h-3.5 text-[#53bdeb] shrink-0" />
                          )}
                          <span className="truncate">{lastMsg.message_text}</span>
                        </div>

                        {/* Unread Badge */}
                        {thread.unreadCount > 0 && (
                          <span className="bg-[#00a884] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0">
                            {thread.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* ============================================================ */}
        {/* RIGHT COLUMN: ACTIVE CONVERSATION CANVAS */}
        {/* ============================================================ */}
        <div
          className={`${
            !selectedPhone ? 'hidden md:flex' : 'flex'
          } flex-1 flex-col overflow-hidden relative ${
            darkMode ? 'bg-[#0b141a]' : 'bg-[#efeae2]'
          }`}
          style={{
            backgroundImage: darkMode
              ? 'radial-gradient(#1f2c34 1px, transparent 1px)'
              : 'radial-gradient(#d1d7db 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
        >
          {activeThread ? (
            <>
              {/* Active Chat Header */}
              <div
                className={`p-3 flex items-center justify-between border-b z-10 shrink-0 ${
                  darkMode ? 'bg-[#202c33] border-[#222d34]' : 'bg-[#f0f2f5] border-slate-200'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  {/* Mobile Back Button */}
                  <button
                    onClick={() => setSelectedPhone(null)}
                    className="md:hidden p-1.5 rounded-lg opacity-70 hover:opacity-100"
                    aria-label="Back to chat list"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>

                  <div
                    className={`w-10 h-10 rounded-full shrink-0 flex items-center justify-center text-white font-bold text-xs shadow-xs ${getAvatarBg(
                      activeThread.contactName
                    )}`}
                  >
                    {activeThread.contactName.slice(0, 2).toUpperCase()}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h2 className="font-semibold text-xs truncate">
                        {activeThread.contactName}
                      </h2>
                      <span className="text-[11px] opacity-60 font-mono">
                        +{activeThread.phone}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-[10px] opacity-75 mt-0.5">
                      {activeThread.linkedTokenNumber ? (
                        <Link
                          href={`/admin/tokens/${activeThread.linkedTokenId || activeThread.linkedTokenNumber}`}
                          className="hover:underline flex items-center gap-1 text-amber-400 font-semibold"
                        >
                          <Ticket className="w-3 h-3" />
                          <span>Token: {activeThread.linkedTokenNumber}</span>
                        </Link>
                      ) : (
                        <span className="flex items-center gap-1">
                          <Lock className="w-2.5 h-2.5 text-[#00a884]" />
                          <span>Connected via Meta Cloud API</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Action Buttons */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <a
                    href={`https://wa.me/${activeThread.phone}`}
                    target="_blank"
                    rel="noreferrer"
                    className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                      darkMode
                        ? 'bg-[#00a884]/20 hover:bg-[#00a884]/30 text-[#00a884]'
                        : 'bg-emerald-100 hover:bg-emerald-200 text-emerald-800'
                    }`}
                    title="Open chat in WhatsApp Desktop/Mobile"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Open in WhatsApp</span>
                  </a>
                </div>
              </div>

              {/* Message Stream */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 z-0">
                {/* Security Banner */}
                <div className="flex justify-center my-2">
                  <div
                    className={`max-w-md text-center px-4 py-2 rounded-lg text-[11px] shadow-xs flex items-center gap-2 ${
                      darkMode
                        ? 'bg-[#182229] text-[#ffd279] border border-[#222d34]'
                        : 'bg-[#fff5c4] text-amber-900 border border-amber-200'
                    }`}
                  >
                    <Lock className="w-3.5 h-3.5 shrink-0" />
                    <span>
                      Messages are processed live via the official Meta WhatsApp Cloud API from{' '}
                      <strong>+91 98191 43222</strong>.
                    </span>
                  </div>
                </div>

                {/* Messages Feed */}
                {activeThread.messages.map((msg, index) => {
                  const isOutbound = msg.direction === 'outbound';

                  return (
                    <div
                      key={msg.id || index}
                      className={`flex ${isOutbound ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`relative max-w-[85%] sm:max-w-[70%] rounded-xl px-3 py-2 text-xs shadow-xs break-words ${
                          isOutbound
                            ? darkMode
                              ? 'bg-[#005c4b] text-[#e9edef] rounded-tr-none'
                              : 'bg-[#d9fdd3] text-slate-900 rounded-tr-none'
                            : darkMode
                            ? 'bg-[#202c33] text-[#e9edef] rounded-tl-none'
                            : 'bg-white text-slate-900 rounded-tl-none'
                        }`}
                      >
                        {/* Sender info if incoming */}
                        {!isOutbound && msg.sender_name && (
                          <div className="text-[10px] font-bold text-[#53bdeb] mb-0.5">
                            {msg.sender_name}
                          </div>
                        )}

                        {/* Message Body */}
                        <div className="whitespace-pre-wrap leading-relaxed">
                          {msg.message_text}
                        </div>

                        {/* Timestamp & Double Checkmarks */}
                        <div className="flex items-center justify-end gap-1 mt-1 text-[10px] opacity-60">
                          <span>{formatMsgTime(msg.timestamp)}</span>
                          {isOutbound && (
                            <CheckCheck className="w-3.5 h-3.5 text-[#53bdeb]" />
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Send Error Notice */}
              {sendError && (
                <div className="px-4 py-2 bg-rose-500/20 text-rose-300 text-xs flex items-center justify-between border-t border-rose-500/30">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-400" />
                    <span>{sendError}</span>
                  </div>
                  <button onClick={() => setSendError(null)} className="font-bold">
                    ✕
                  </button>
                </div>
              )}

              {/* Bottom Message Input Bar */}
              <form
                onSubmit={handleSendMessage}
                className={`p-3 flex items-center gap-2 border-t z-10 shrink-0 ${
                  darkMode ? 'bg-[#202c33] border-[#222d34]' : 'bg-[#f0f2f5] border-slate-200'
                }`}
              >
                <div className="flex items-center gap-1 opacity-70">
                  <button
                    type="button"
                    className="p-1.5 rounded-lg hover:opacity-100 transition-opacity"
                    title="Insert emoji"
                    onClick={() => setInputText(prev => prev + ' 👍')}
                  >
                    <Smile className="w-5 h-5" />
                  </button>
                  <button
                    type="button"
                    className="p-1.5 rounded-lg hover:opacity-100 transition-opacity"
                    title="Attach reference"
                    onClick={() => {
                      if (activeThread.linkedTokenNumber) {
                        setInputText(prev => prev + ` [Token: ${activeThread.linkedTokenNumber}]`);
                      }
                    }}
                  >
                    <Paperclip className="w-5 h-5" />
                  </button>
                </div>

                <input
                  ref={inputRef}
                  type="text"
                  value={inputText}
                  onChange={e => setInputText(e.target.value)}
                  placeholder="Type a message"
                  disabled={sending}
                  className={`flex-1 px-4 py-2.5 rounded-lg outline-none text-xs transition-colors ${
                    darkMode
                      ? 'bg-[#2a3942] text-white placeholder-[#8696a0] focus:ring-1 focus:ring-[#00a884]'
                      : 'bg-white text-slate-800 placeholder-slate-400 focus:ring-1 focus:ring-[#00a884]'
                  }`}
                />

                <button
                  type="submit"
                  disabled={!inputText.trim() || sending}
                  className={`p-2.5 rounded-full text-white font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
                    inputText.trim()
                      ? 'bg-[#00a884] hover:bg-[#029072] scale-100'
                      : 'bg-slate-600 scale-95'
                  }`}
                  title="Send message (Enter)"
                >
                  {sending ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </button>
              </form>
            </>
          ) : (
            /* Empty State: No chat selected */
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center opacity-70 space-y-4">
              <div
                className={`w-20 h-20 rounded-full flex items-center justify-center ${
                  darkMode ? 'bg-[#202c33]' : 'bg-slate-200'
                }`}
              >
                <MessageSquareText className="w-10 h-10 text-[#00a884]" />
              </div>
              <div className="max-w-md space-y-1.5">
                <h3 className="font-bold text-base">Royal Services WhatsApp Web</h3>
                <p className="text-xs opacity-75">
                  Send and receive WhatsApp messages directly from the website without switching
                  to another device or app.
                </p>
                <p className="text-[11px] opacity-60">
                  Select a chat on the left to start viewing messages and typing replies.
                </p>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] opacity-50 mt-4">
                <Lock className="w-3.5 h-3.5 text-[#00a884]" />
                <span>Connected to Meta WhatsApp Cloud API (+91 98191 43222)</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
