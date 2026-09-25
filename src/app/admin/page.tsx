'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { AdminHeader } from '@/components/layout/AdminHeader';
import { DashboardMetrics, Token, ActivityLog } from '@/types';
import { TokenStatusBadge } from '@/components/tokens/TokenStatusBadge';
import { formatReadableISTDate, formatReadableISTDateTime } from '@/lib/ist';
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  Users,
  BellRing,
  Send,
  ArrowUpRight,
  Plus,
  Archive,
  RefreshCw,
  ShieldCheck,
  Check,
} from 'lucide-react';


export default function AdminDashboardPage() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [recentTokens, setRecentTokens] = useState<Token[]>([]);
  const [recentActivity, setRecentActivity] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const [evaluatingReminders, setEvaluatingReminders] = useState(false);
  const [evalMessage, setEvalMessage] = useState('');

  const fetchDashboardData = async () => {
    setFetchError(false);
    try {
      const res = await fetch('/api/dashboard');
      if (res.ok) {
        const data = await res.json();
        setMetrics(data.metrics);
        setRecentTokens(data.recentTokens || []);
        setRecentActivity(data.recentActivity || []);
      } else {
        setFetchError(true);
      }
    } catch {
      setFetchError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        const res = await fetch('/api/dashboard');
        if (res.ok) {
          const data = await res.json();
          if (!ignore) {
            setMetrics(data.metrics);
            setRecentTokens(data.recentTokens || []);
            setRecentActivity(data.recentActivity || []);
          }
        } else if (!ignore) {
          setFetchError(true);
        }
      } catch {
        if (!ignore) {
          setFetchError(true);
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    })();
    return () => {
      ignore = true;
    };
  }, []);


  const handleRunReminders = async () => {
    setEvaluatingReminders(true);
    setEvalMessage('');
    try {
      const res = await fetch('/api/cron/reminders', { method: 'POST' });
      const data = await res.json();
      setEvalMessage(data.message || 'Evaluated daily reminders.');
      fetchDashboardData();
      setTimeout(() => setEvalMessage(''), 6000);
    } catch {
      setEvalMessage('Error evaluating reminders.');
    } finally {
      setEvaluatingReminders(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-2 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs text-slate-500 font-medium">Loading Royal Services Administration...</p>
        </div>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4 max-w-sm">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center mx-auto text-rose-500">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-800">Failed to Load Dashboard</p>
            <p className="text-xs text-slate-500 mt-1">Could not fetch data from the server. Please check your connection and try again.</p>
          </div>
          <button
            onClick={() => { setLoading(true); fetchDashboardData(); }}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-[#2D3774] hover:bg-[#222B5C] rounded-xl transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <AdminHeader
        title="Super Admin Dashboard"
        subtitle="Operational overview, token status metrics, and automated WhatsApp delivery tracking"
        action={{
          label: 'Add Token',
          href: '/admin/tokens/new',
          icon: <Plus className="w-4 h-4" />,
        }}
      />

      {evalMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600" />
            <span>{evalMessage}</span>
          </div>
          <button
            onClick={() => setEvalMessage('')}
            className="text-emerald-700 hover:text-emerald-900 font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* KPI Cards Grid - FR 010, FR 011, FR 013, FR 014 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Active Tokens Card */}
        <Link
          href="/admin/tokens?status=active"
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs hover:border-emerald-300 hover:shadow-md transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Active Tokens
            </span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 group-hover:scale-110 transition-transform">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-slate-900 font-mono">
              {metrics?.active_tokens ?? 0}
            </span>
            <span className="text-[11px] text-emerald-700 font-medium flex items-center gap-0.5">
              <span>View list</span>
              <ArrowUpRight className="w-3 h-3" />
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Currently valid in IST</p>
        </Link>

        {/* Upcoming Tokens Card */}
        <Link
          href="/admin/tokens?status=upcoming"
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs hover:border-blue-300 hover:shadow-md transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Upcoming Tokens
            </span>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600 group-hover:scale-110 transition-transform">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-slate-900 font-mono">
              {metrics?.upcoming_tokens ?? 0}
            </span>
            <span className="text-[11px] text-blue-700 font-medium flex items-center gap-0.5">
              <span>View list</span>
              <ArrowUpRight className="w-3 h-3" />
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Start date is in future</p>
        </Link>

        {/* Expired Tokens Card */}
        <Link
          href="/admin/tokens?status=expired"
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs hover:border-amber-300 hover:shadow-md transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Expired Tokens
            </span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600 group-hover:scale-110 transition-transform">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-slate-900 font-mono">
              {metrics?.expired_tokens ?? 0}
            </span>
            <span className="text-[11px] text-amber-700 font-medium flex items-center gap-0.5">
              <span>Renewal ready</span>
              <ArrowUpRight className="w-3 h-3" />
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Ready for renewal draft</p>
        </Link>

        {/* Active Agents Card */}
        <Link
          href="/admin/agents"
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs hover:border-purple-300 hover:shadow-md transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Active Agents
            </span>
            <div className="p-2 rounded-xl bg-purple-50 text-purple-600 group-hover:scale-110 transition-transform">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-slate-900 font-mono">
              {metrics?.active_agents ?? 0}
            </span>
            <span className="text-[11px] text-purple-700 font-medium flex items-center gap-0.5">
              <span>{metrics?.total_agents ?? 0} total</span>
              <ArrowUpRight className="w-3 h-3" />
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Assigned representatives</p>
        </Link>
      </div>

      {/* Secondary Metrics Bar (Due Soon, WhatsApp status, Archived) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Reminders Due Soon - FR 012 */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-700">
              <BellRing className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">
                Due Soon (30d)
              </p>
              <p className="text-lg font-bold text-slate-900 font-mono">
                {metrics?.reminders_due_soon ?? 0} Tokens
              </p>
            </div>
          </div>

          <button
            onClick={handleRunReminders}
            disabled={evaluatingReminders}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-xs disabled:opacity-50"
            title="Evaluate daily IST reminders immediately"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${evaluatingReminders ? 'animate-spin' : ''}`} />
            <span>{evaluatingReminders ? 'Running...' : 'Run Job'}</span>
          </button>
        </div>

        {/* WhatsApp Deliveries & Failures - FR 012 */}
        <Link
          href="/admin/activity?targetType=reminder"
          className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between hover:border-slate-300 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-700">
              <Send className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">
                WhatsApp Delivery
              </p>
              <p className="text-lg font-bold text-slate-900 font-mono">
                {metrics?.recent_deliveries ?? 0} Sent
              </p>
            </div>
          </div>
          <div className="text-right">
            <span
              className={`text-xs px-2 py-0.5 rounded-md font-medium ${
                (metrics?.recent_failures ?? 0) > 0
                  ? 'bg-rose-100 text-rose-800'
                  : 'bg-slate-100 text-slate-600'
              }`}
            >
              {metrics?.recent_failures ?? 0} Failed
            </span>
          </div>
        </Link>

        {/* Separately Labeled Archived Total - FR 014 */}
        <Link
          href="/admin/archive"
          className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between hover:border-slate-300 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-slate-100 text-slate-700">
              <Archive className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">
                Archived Records
              </p>
              <p className="text-lg font-bold text-slate-900 font-mono">
                {metrics?.archived_tokens ?? 0} Stored
              </p>
            </div>
          </div>
          <span className="text-xs text-slate-500 font-medium">Restorable</span>
        </Link>
      </div>

      {/* Lower Section: Recent Tokens & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Latest Token Records (2 Cols) - FR 011 */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Latest Token Records
              </h2>
              <p className="text-xs text-slate-500">Most recently added service tokens</p>
            </div>
            <Link
              href="/admin/tokens"
              className="text-xs font-semibold text-[#2D3774] hover:text-[#222B5C] hover:underline"
            >
              View All ({metrics?.total_tokens ?? 0})
            </Link>
          </div>

          <div className="divide-y divide-slate-100">
            {recentTokens.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                No tokens available. Click &quot;Add Token&quot; to create your first record.
              </div>
            ) : (
              recentTokens.map(token => (
                <div
                  key={token.id}
                  className="p-4 hover:bg-slate-50 transition-colors flex items-center justify-between gap-4"
                >
                  <div className="truncate flex-1">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/admin/tokens/${token.id}`}
                        className="font-mono font-bold text-slate-900 hover:text-[#2D3774] text-xs sm:text-sm hover:underline"
                      >
                        {token.token_number}
                      </Link>
                      <TokenStatusBadge status={token.computed_status} size="sm" />
                    </div>
                    <p className="text-xs font-medium text-slate-700 mt-0.5 truncate">
                      {token.associate_name} • {token.property?.name}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Agent: {token.agent?.name} • Valid to {formatReadableISTDate(token.end_date)}
                    </p>
                  </div>

                  <Link
                    href={`/admin/tokens/${token.id}`}
                    className="shrink-0 p-2 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                    aria-label="Manage token"
                  >
                    <ArrowUpRight className="w-4 h-4" />
                  </Link>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Activity Audit Trail (1 Col) - FR 062, FR 063 */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                System Activity
              </h2>
              <p className="text-xs text-slate-500">Audit trail & WhatsApp events</p>
            </div>
            <Link
              href="/admin/activity"
              className="text-xs font-semibold text-amber-700 hover:text-amber-800 hover:underline"
            >
              Full Log
            </Link>
          </div>

          <div className="p-4 space-y-4 flex-1 overflow-y-auto">
            {recentActivity.length === 0 ? (
              <p className="text-center text-slate-400 text-xs py-8">No recent activity logged.</p>
            ) : (
              recentActivity.map(act => (
                <div key={act.id} className="flex items-start space-x-2.5 text-xs">
                  <div className="w-2 h-2 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                  <div className="space-y-0.5">
                    <p className="text-slate-800 font-medium leading-snug">
                      {act.summary}
                    </p>
                    <p className="text-[10px] text-slate-400">
                      {formatReadableISTDateTime(act.created_at)}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="p-3 bg-slate-50 border-t border-slate-100 text-center">
            <Link
              href="/admin/settings"
              className="text-[11px] text-slate-500 hover:text-slate-800 inline-flex items-center gap-1"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
              <span>Super Admin Configuration & Webhooks</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
