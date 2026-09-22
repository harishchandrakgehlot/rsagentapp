'use client';

import React, { useState, useEffect } from 'react';
import { ActivityLog } from '@/types';
import { AdminHeader } from '@/components/layout/AdminHeader';
import { formatReadableISTDateTime } from '@/lib/ist';
import {
  History,
  Search,
  Filter,
  Send,
  Ticket,
  Users,
  Building2,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';

export default function AdminActivityPage() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [search, setSearch] = useState('');
  const [targetType, setTargetType] = useState('all');
  const [actionFilter, setActionFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  const loadLogs = async () => {
    try {
      let url = '/api/activity?';
      if (targetType !== 'all') url += `&targetType=${targetType}`;
      if (actionFilter !== 'all') url += `&action=${actionFilter}`;
      if (search.trim()) url += `&search=${encodeURIComponent(search)}`;

      const res = await fetch(url);
      const data = await res.json();
      setLogs(data.logs || []);
    } catch (err) {
      console.error('Error loading logs', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, [targetType, actionFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadLogs();
  };

  const getTargetIcon = (type: string) => {
    switch (type) {
      case 'token':
        return <Ticket className="w-3.5 h-3.5 text-amber-600" />;
      case 'reminder':
        return <Send className="w-3.5 h-3.5 text-emerald-600" />;
      case 'agent':
        return <Users className="w-3.5 h-3.5 text-purple-600" />;
      case 'property':
        return <Building2 className="w-3.5 h-3.5 text-blue-600" />;
      default:
        return <ShieldCheck className="w-3.5 h-3.5 text-slate-600" />;
    }
  };

  return (
    <div className="space-y-6">
      <AdminHeader
        title="Activity History & WhatsApp Audit"
        subtitle="Complete immutable log of administrative changes, status overrides, and WhatsApp delivery events"
        action={{
          label: 'Refresh Log',
          onClick: loadLogs,
          icon: <RefreshCw className="w-4 h-4" />,
        }}
      />

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search activity by token number, agent, or action..."
              className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-900 placeholder:text-slate-400"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400 shrink-0" />
            <select
              value={targetType}
              onChange={e => setTargetType(e.target.value)}
              className="px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="all">All Targets</option>
              <option value="token">Tokens</option>
              <option value="reminder">WhatsApp Reminders</option>
              <option value="agent">Agents</option>
              <option value="property">Properties</option>
              <option value="auth">Admin Authentication</option>
            </select>
          </div>

          <button
            type="submit"
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold"
          >
            Apply Filters
          </button>
        </form>

        <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-100">
          <span>Showing <strong className="text-slate-800">{logs.length}</strong> logged events</span>
          {(search || targetType !== 'all') && (
            <button
              onClick={() => {
                setSearch('');
                setTargetType('all');
              }}
              className="text-amber-700 hover:text-amber-800 font-medium"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Activity Timeline List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-xs text-slate-400">Loading activity trail...</div>
        ) : logs.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">No activity events recorded.</div>
        ) : (
          <div className="divide-y divide-slate-100">
            {logs.map(log => (
              <div
                key={log.id}
                className="p-4 hover:bg-slate-50 transition-colors flex items-start justify-between gap-4"
              >
                <div className="flex items-start space-x-3 flex-1">
                  <div className="p-2 rounded-xl bg-slate-100 shrink-0 mt-0.5 border border-slate-200">
                    {getTargetIcon(log.target_type)}
                  </div>

                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-xs text-slate-900 uppercase tracking-wide">
                        {log.action.replace(/_/g, ' ')}
                      </span>
                      <span className="text-[10px] font-mono bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                        Target: {log.target_id}
                      </span>
                    </div>

                    <p className="text-xs text-slate-700 leading-relaxed">
                      {log.summary}
                    </p>

                    {log.details && (
                      <div className="mt-1.5 p-2 bg-slate-50 rounded-lg text-[11px] font-mono text-slate-600 border border-slate-200/60 overflow-x-auto max-w-xl">
                        {JSON.stringify(log.details)}
                      </div>
                    )}
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-[11px] text-slate-400 whitespace-nowrap">
                    {formatReadableISTDateTime(log.created_at)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
