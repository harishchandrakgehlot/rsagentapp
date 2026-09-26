'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { AdminHeader } from '@/components/layout/AdminHeader';
import { WhatsAppInboxMessage } from '@/types';
import { formatReadableISTDateTime } from '@/lib/ist';
import {
  MessageSquareText,
  Search,
  CheckCheck,
  RefreshCw,
  ExternalLink,
  MessageCircle,
  Ticket,
  User,
  Phone,
  MailCheck,
  Clock,
  CheckCircle2,
} from 'lucide-react';

export default function AdminWhatsAppInboxPage() {
  const [messages, setMessages] = useState<WhatsAppInboxMessage[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [filterMode, setFilterMode] = useState<'all' | 'unread' | 'linked'>('all');
  const [actionSuccess, setActionSuccess] = useState('');

  const fetchInbox = async (showRefreshing = false) => {
    if (showRefreshing) setRefreshing(true);
    try {
      const res = await fetch('/api/inbox');
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (err) {
      console.error('Error fetching inbox:', err);
    } finally {
      setLoading(false);
      if (showRefreshing) setRefreshing(false);
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
            setMessages(data.messages || []);
            setUnreadCount(data.unreadCount || 0);
          }
        }
      } catch (err) {
        console.error('Error fetching inbox:', err);
      } finally {
        if (!ignore) setLoading(false);
      }
    })();

    // Background polling every 20s for new client replies
    const timer = setInterval(() => {
      if (!ignore) fetchInbox(false);
    }, 20000);

    return () => {
      ignore = true;
      clearInterval(timer);
    };
  }, []);

  const handleToggleRead = async (msg: WhatsAppInboxMessage) => {
    const newStatus = !msg.is_read;
    // Optimistic UI update
    setMessages(prev =>
      prev.map(m => (m.id === msg.id ? { ...m, is_read: newStatus } : m))
    );
    setUnreadCount(prev => (newStatus ? Math.max(0, prev - 1) : prev + 1));

    try {
      await fetch('/api/inbox', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: msg.id, is_read: newStatus }),
      });
    } catch {
      // Revert on error
      fetchInbox();
    }
  };

  const handleMarkAllRead = async () => {
    setMessages(prev => prev.map(m => ({ ...m, is_read: true })));
    setUnreadCount(0);
    setActionSuccess('All incoming messages marked as read.');
    setTimeout(() => setActionSuccess(''), 4000);

    try {
      await fetch('/api/inbox', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'mark_all_read' }),
      });
    } catch {
      fetchInbox();
    }
  };

  // Filter messages
  const filteredMessages = messages.filter(msg => {
    // Mode filter
    if (filterMode === 'unread' && msg.is_read) return false;
    if (filterMode === 'linked' && !msg.linked_token_number) return false;

    // Search query
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      const matchText = msg.message_text.toLowerCase().includes(q);
      const matchPhone = msg.sender_phone.includes(q);
      const matchName = msg.sender_name && msg.sender_name.toLowerCase().includes(q);
      const matchToken = msg.linked_token_number && msg.linked_token_number.toLowerCase().includes(q);
      if (!matchText && !matchPhone && !matchName && !matchToken) return false;
    }

    return true;
  });

  const totalReceived = messages.length;
  const linkedCount = messages.filter(m => m.linked_token_number).length;
  const uniqueSenders = new Set(messages.map(m => m.sender_phone)).size;

  return (
    <div className="space-y-6">
      <AdminHeader
        title="WhatsApp Inbox & Client Replies"
        subtitle="Incoming customer and agent responses sent to +91 98191 43222, linked to service tokens with 1-click WhatsApp quick reply"
        action={{
          label: refreshing ? 'Checking...' : 'Refresh Inbox',
          icon: <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />,
          onClick: () => fetchInbox(true),
        }}
      />

      {/* Success Notification Alert */}
      {actionSuccess && (
        <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-medium">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* KPI Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <MessageSquareText className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Total Replies</p>
            <p className="text-2xl font-bold text-slate-900">{totalReceived}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <MailCheck className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Unread Replies</p>
            <p className="text-2xl font-bold text-emerald-600">{unreadCount}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
            <Ticket className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Linked to Tokens</p>
            <p className="text-2xl font-bold text-slate-900">{linkedCount}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
            <User className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Unique Senders</p>
            <p className="text-2xl font-bold text-slate-900">{uniqueSenders}</p>
          </div>
        </div>
      </div>

      {/* Controls & Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by sender name, mobile (+91), token number, or message content..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-[#2D3774] focus:border-transparent"
            />
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
            <button
              onClick={() => setFilterMode('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors shrink-0 ${
                filterMode === 'all'
                  ? 'bg-[#161E42] text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All ({totalReceived})
            </button>
            <button
              onClick={() => setFilterMode('unread')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors shrink-0 flex items-center gap-1.5 ${
                filterMode === 'unread'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
              }`}
            >
              Unread
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white text-emerald-800 font-bold">
                  {unreadCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setFilterMode('linked')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors shrink-0 ${
                filterMode === 'linked'
                  ? 'bg-[#161E42] text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Linked to Token ({linkedCount})
            </button>
          </div>

          {/* Mark All Read Action */}
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors shrink-0"
              title="Mark all as read"
            >
              <CheckCheck className="w-3.5 h-3.5 text-emerald-600" />
              Mark all read
            </button>
          )}
        </div>
      </div>

      {/* Messages Feed */}
      <div className="space-y-3">
        {loading ? (
          <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center">
            <RefreshCw className="w-8 h-8 text-[#2D3774] animate-spin mx-auto mb-3" />
            <p className="text-sm font-medium text-slate-600">Loading WhatsApp Inbox...</p>
          </div>
        ) : filteredMessages.length === 0 ? (
          <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
              <MessageSquareText className="w-7 h-7" />
            </div>
            <h3 className="text-base font-semibold text-slate-800">
              {search || filterMode !== 'all' ? 'No matching replies found' : 'No WhatsApp replies yet'}
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
              When clients or agents reply to automated WhatsApp token notifications sent by your business number (+91 98191 43222), their messages will instantly appear here with full token history and quick-reply options.
            </p>
            {(search || filterMode !== 'all') && (
              <button
                onClick={() => {
                  setSearch('');
                  setFilterMode('all');
                }}
                className="text-xs font-semibold text-[#2D3774] hover:underline pt-2"
              >
                Clear search & filters
              </button>
            )}
          </div>
        ) : (
          filteredMessages.map(msg => {
            const cleanPhone = msg.sender_phone.replace(/\D/g, '');
            const waLink = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(
              `Hello ${msg.sender_name || ''}, regarding Royal Services: `
            )}`;

            return (
              <div
                key={msg.id}
                className={`bg-white rounded-2xl border transition-all p-4 md:p-5 ${
                  !msg.is_read
                    ? 'border-emerald-300 ring-2 ring-emerald-50 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-3">
                  {/* Sender Details */}
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                        !msg.is_read
                          ? 'bg-emerald-600 text-white ring-2 ring-emerald-100'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {msg.sender_name ? msg.sender_name.slice(0, 2).toUpperCase() : 'WA'}
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-slate-900 text-sm">
                          {msg.sender_name || `+${msg.sender_phone}`}
                        </span>

                        {!msg.is_read && (
                          <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-500 text-white tracking-wide uppercase">
                            New Reply
                          </span>
                        )}

                        {/* Linked Token Badge */}
                        {msg.linked_token_number && (
                          <Link
                            href={`/admin/tokens/${msg.linked_token_id}`}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs font-semibold transition-colors"
                          >
                            <Ticket className="w-3 h-3" />
                            <span>{msg.linked_token_number}</span>
                            <ExternalLink className="w-2.5 h-2.5 text-blue-500" />
                          </Link>
                        )}

                        {/* Linked Agent Badge */}
                        {msg.linked_agent_name && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 text-xs font-medium">
                            <User className="w-3 h-3" />
                            <span>{msg.linked_agent_name}</span>
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3 text-slate-400" />
                          +{msg.sender_phone}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-400" />
                          {formatReadableISTDateTime(msg.timestamp)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions Right Side */}
                  <div className="flex items-center gap-2 self-end md:self-auto pt-2 md:pt-0">
                    <button
                      onClick={() => handleToggleRead(msg)}
                      className={`text-xs px-2.5 py-1.5 rounded-lg border font-medium transition-colors ${
                        msg.is_read
                          ? 'text-slate-500 hover:text-slate-700 border-slate-200 hover:bg-slate-50'
                          : 'text-emerald-700 border-emerald-200 bg-emerald-50 hover:bg-emerald-100'
                      }`}
                    >
                      {msg.is_read ? 'Mark unread' : 'Mark read'}
                    </button>

                    <a
                      href={waLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-[#25D366] text-white hover:bg-[#1EBE5D] shadow-xs transition-colors"
                      title="Open WhatsApp chat on phone or web"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>Reply on WhatsApp</span>
                    </a>
                  </div>
                </div>

                {/* WhatsApp Chat Speech Bubble */}
                <div className="mt-3 ml-0 md:ml-13">
                  <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-100/90 text-slate-800 text-sm leading-relaxed whitespace-pre-wrap font-sans">
                    {msg.message_text}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
