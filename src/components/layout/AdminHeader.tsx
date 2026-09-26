'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, Clock, ExternalLink, MessageSquareText } from 'lucide-react';
import { getCurrentISTDateString, formatReadableISTDate } from '@/lib/ist';

interface Props {
  title: string;
  subtitle?: string;
  action?: {
    label: string;
    href?: string;
    onClick?: () => void;
    icon?: React.ReactNode;
  };
}

export function AdminHeader({ title, subtitle, action }: Props) {
  const [istTime, setIstTime] = useState<string>('');
  const [unreadInboxCount, setUnreadInboxCount] = useState<number>(0);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const options: Intl.DateTimeFormatOptions = {
        timeZone: 'Asia/Kolkata',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
      };
      const timeStr = new Intl.DateTimeFormat('en-IN', options).format(now);
      const istDate = getCurrentISTDateString();
      setIstTime(`${formatReadableISTDate(istDate)} • ${timeStr} IST`);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    let ignore = false;
    const fetchInboxUnread = async () => {
      try {
        const res = await fetch('/api/inbox?limit=1');
        if (res.ok) {
          const data = await res.json();
          if (!ignore && typeof data.unreadCount === 'number') {
            setUnreadInboxCount(data.unreadCount);
          }
        }
      } catch {}
    };
    fetchInboxUnread();
    const interval = setInterval(fetchInboxUnread, 30000);
    return () => {
      ignore = true;
      clearInterval(interval);
    };
  }, []);

  return (
    <header className="bg-white border-b border-slate-200 px-6 py-4 mb-6 shadow-2xs">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold tracking-tight text-[#161E42]">
              {title}
            </h1>
            {istTime && (
              <span className="hidden lg:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-[#F4F6FC] text-[#2D3774] border border-[#D1D7EE]">
                <Clock className="w-3 h-3 text-[#2D3774]" />
                {istTime}
              </span>
            )}
          </div>
          {subtitle && (
            <p className="text-xs text-slate-500 mt-1">{subtitle}</p>
          )}
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/admin/inbox"
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors border border-emerald-200"
            title="View WhatsApp Client Replies"
          >
            <MessageSquareText className="w-3.5 h-3.5 text-emerald-700" />
            <span>WhatsApp Inbox</span>
            {unreadInboxCount > 0 && (
              <span className="bg-emerald-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                {unreadInboxCount}
              </span>
            )}
          </Link>

          <Link
            href="/"
            target="_blank"
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors border border-slate-200"
          >
            <ExternalLink className="w-3.5 h-3.5 text-[#2D3774]" />
            Track Token
          </Link>

          {action && action.href ? (
            <Link
              href={action.href}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#2D3774] hover:bg-[#222B5C] rounded-lg shadow-xs hover:shadow transition-all"
            >
              {action.icon || <Plus className="w-4 h-4" />}
              {action.label}
            </Link>
          ) : action && action.onClick ? (
            <button
              onClick={action.onClick}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#2D3774] hover:bg-[#222B5C] rounded-lg shadow-xs hover:shadow transition-all cursor-pointer"
            >
              {action.icon || <Plus className="w-4 h-4" />}
              {action.label}
            </button>
          ) : null}
        </div>
      </div>
    </header>
  );
}
