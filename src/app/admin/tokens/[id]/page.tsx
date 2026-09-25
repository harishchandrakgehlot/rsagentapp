'use client';

import React, { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Token, Reminder, StatusOverride, ReminderType } from '@/types';
import { AdminHeader } from '@/components/layout/AdminHeader';
import { TokenStatusBadge } from '@/components/tokens/TokenStatusBadge';
import { TokenQRModal } from '@/components/tokens/TokenQRModal';
import { TokenPDFView } from '@/components/tokens/TokenPDFView';
import { formatReadableISTDate, formatReadableISTDateTime } from '@/lib/ist';
import {
  FileText,
  Building2,
  Phone,
  QrCode,
  Printer,
  ExternalLink,
  Archive,
  RefreshCw,
  Send,
  AlertTriangle,
  Link as LinkIcon,
  Image as ImageIcon,
} from 'lucide-react';


interface Props {
  params: Promise<{ id: string }>;
}

export default function TokenDetailPage({ params: paramsPromise }: Props) {
  const params = use(paramsPromise);
  const router = useRouter();

  const [token, setToken] = useState<Token | null>(null);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modals
  const [showQR, setShowQR] = useState(false);
  const [showPDF, setShowPDF] = useState(false);

  // Manual Resend State
  const [resendingType, setResendingType] = useState<ReminderType | null>(null);
  const [resendStatusMsg, setResendStatusMsg] = useState('');

  const loadToken = async () => {
    try {
      const res = await fetch(`/api/tokens/${params.id}`);
      if (!res.ok) {
        throw new Error('Token not found');
      }
      const data = await res.json();
      setToken(data.token);
      setReminders(data.reminders || []);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error loading token';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        const res = await fetch(`/api/tokens/${params.id}`);
        if (!res.ok) {
          throw new Error('Token not found');
        }
        const data = await res.json();
        if (!ignore) {
          setToken(data.token);
          setReminders(data.reminders || []);
        }
      } catch (err: unknown) {
        if (!ignore) {
          const msg = err instanceof Error ? err.message : 'Error loading token';
          setError(msg);
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
  }, [params.id]);


  const handleStatusOverride = async (newOverride: StatusOverride) => {
    if (!token) return;
    try {
      const res = await fetch(`/api/tokens/${token.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status_override: newOverride }),
      });
      const data = await res.json();
      if (data.success) {
        setToken(data.token);
      }
    } catch (err) {
      console.error('Failed to override status', err);
    }
  };

  const handleArchive = async () => {
    if (!token) return;
    if (confirm(`Are you sure you want to archive token "${token.token_number}"? It will be removed from operational lists and public search.`)) {
      try {
        const res = await fetch(`/api/tokens/${token.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'archive' }),
        });
        const data = await res.json();
        if (data.success) {
          router.push('/admin/tokens');
        }
      } catch (err) {
        console.error('Failed to archive', err);
      }
    }
  };

  const handleManualResend = async (rType: ReminderType) => {
    if (!token) return;
    setResendingType(rType);
    setResendStatusMsg('');

    try {
      const res = await fetch(`/api/tokens/${token.id}/resend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reminderType: rType }),
      });
      const data = await res.json();
      if (res.ok) {
        setResendStatusMsg(`Manual resend of ${rType} reminder dispatched! (Provider Msg ID: ${data.reminder.provider_message_id})`);
        loadToken();
      } else {
        setResendStatusMsg(`Resend failed: ${data.error}`);
      }
    } catch {
      setResendStatusMsg('Resend request failed.');
    } finally {
      setResendingType(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-3 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs text-slate-500">Loading token details...</p>
        </div>
      </div>
    );
  }

  if (error || !token) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-4">
        <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto" />
        <h2 className="text-lg font-bold text-slate-900">Token Record Not Found</h2>
        <p className="text-xs text-slate-500">{error || 'The requested token could not be loaded.'}</p>
        <Link
          href="/admin/tokens"
          className="inline-block px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold"
        >
          Return to Tokens List
        </Link>
      </div>
    );
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://rsagentapp.vercel.app';
  const trackingUrl = `${appUrl}/track/${encodeURIComponent(token.token_number)}`;

  return (
    <div className="space-y-6">
      <AdminHeader
        title={`Token: ${token.token_number}`}
        subtitle={`Managed service token for ${token.associate_name}`}
      />

      {resendStatusMsg && (
        <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center justify-between shadow-xs">
          <span>{resendStatusMsg}</span>
          <button
            onClick={() => setResendStatusMsg('')}
            className="text-amber-800 font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* Main Details Card */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xs overflow-hidden">
        {/* Top Action Bar */}
        <div className="p-6 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <h1 className="font-mono text-2xl font-bold text-slate-900">
              {token.token_number}
            </h1>
            <TokenStatusBadge status={token.computed_status} size="lg" />
            {token.status_override && (
              <span className="text-[11px] font-semibold uppercase tracking-wider text-orange-700 bg-orange-100 border border-orange-200 px-2 py-0.5 rounded">
                Manual: {token.status_override}
              </span>
            )}
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setShowQR(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-xl shadow-2xs transition-colors"
            >
              <QrCode className="w-3.5 h-3.5 text-amber-600" />
              <span>QR Code</span>
            </button>

            <button
              onClick={() => setShowPDF(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-xl shadow-2xs transition-colors"
            >
              <Printer className="w-3.5 h-3.5 text-slate-700" />
              <span>Print / PDF</span>
            </button>

            <a
              href={trackingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-xl transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Public View</span>
            </a>

            {/* Create Renewal Button - FR 030 */}
            <Link
              href={`/admin/tokens/${token.id}/renew`}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-xl shadow-xs transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Create Renewal</span>
            </Link>

            {/* Archive Button - FR 027 */}
            <button
              onClick={handleArchive}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition-colors"
              title="Archive token record"
            >
              <Archive className="w-3.5 h-3.5" />
              <span>Archive</span>
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 sm:p-8 space-y-8">
          {/* Key Parameters */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 text-xs">
            <div>
              <span className="font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                Associate / Client
              </span>
              <p className="text-sm font-semibold text-slate-900">
                {token.associate_name}
              </p>
            </div>

            <div>
              <span className="font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                Assigned Agents & Recipients ({token.assigned_recipients?.length || 1})
              </span>
              <div className="space-y-1.5 mt-0.5">
                {(token.assigned_recipients && token.assigned_recipients.length > 0
                  ? token.assigned_recipients
                  : [
                      {
                        name: token.agent?.name || 'Assigned Agent',
                        mobile: token.agent_mobile_number,
                        is_primary: true,
                      },
                    ]
                ).map((rec, idx) => (
                  <div key={idx} className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-slate-900">{rec.name}</span>
                    <span className="font-mono text-slate-600 flex items-center gap-1 text-[11px]">
                      <Phone className="w-2.5 h-2.5 text-slate-400" />
                      <span>{rec.mobile}</span>
                      <span className="text-[9px] bg-slate-100 text-slate-500 px-1 rounded">
                        Private
                      </span>
                    </span>
                    {rec.is_primary && (
                      <span className="text-[9px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.2 rounded-full">
                        ★ Primary
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div>
              <span className="font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                Assigned Property
              </span>
              <p className="text-sm font-medium text-slate-900 flex items-start gap-1">
                <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                <span>{token.property?.name}</span>
              </p>
            </div>

            <div>
              <span className="font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                Validity Period (IST)
              </span>
              <div className="flex items-center gap-2 mt-1">
                <span className="font-semibold text-slate-800">
                  {formatReadableISTDate(token.start_date)}
                </span>
                <span className="text-slate-400 font-bold">→</span>
                <span className="font-semibold text-slate-800">
                  {formatReadableISTDate(token.end_date)}
                </span>
              </div>
            </div>

            <div>
              <span className="font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                Manual Status Override Controls
              </span>
              <div className="flex items-center gap-1.5 mt-1">
                {token.status_override ? (
                  <button
                    onClick={() => handleStatusOverride(null)}
                    className="px-2.5 py-1 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg border border-slate-300 font-medium"
                  >
                    Clear Override
                  </button>
                ) : (
                  <>
                    <button
                      onClick={() => handleStatusOverride('suspended')}
                      className="px-2.5 py-1 text-xs bg-orange-50 hover:bg-orange-100 text-orange-700 rounded-lg border border-orange-200 font-medium"
                    >
                      Suspend
                    </button>
                    <button
                      onClick={() => handleStatusOverride('cancelled')}
                      className="px-2.5 py-1 text-xs bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg border border-rose-200 font-medium"
                    >
                      Cancel
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Renewal Chain Links */}
            <div>
              <span className="font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                Renewal History
              </span>
              {token.renewal_previous_token ? (
                <Link
                  href={`/admin/tokens/${token.renewal_previous_token.id}`}
                  className="inline-flex items-center gap-1 text-amber-800 hover:underline font-mono"
                >
                  <LinkIcon className="w-3 h-3" />
                  <span>Renewed from {token.renewal_previous_token.token_number}</span>
                </Link>
              ) : token.renewal_next_token ? (
                <Link
                  href={`/admin/tokens/${token.renewal_next_token.id}`}
                  className="inline-flex items-center gap-1 text-emerald-700 hover:underline font-mono"
                >
                  <LinkIcon className="w-3 h-3" />
                  <span>Succeeded by {token.renewal_next_token.token_number}</span>
                </Link>
              ) : (
                <span className="text-slate-400">Original issue (no renewals)</span>
              )}
            </div>
          </div>

          {/* Public Description & Remarks */}
          <div className="border-t border-slate-100 pt-6 space-y-4">
            <div>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                Token Description (Public)
              </span>
              <p className="text-xs sm:text-sm text-slate-700 bg-slate-50 p-4 rounded-xl border border-slate-100 whitespace-pre-line leading-relaxed">
                {token.token_description || 'No public description provided.'}
              </p>
            </div>

            <div>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                Notes & Remarks (Public)
              </span>
              <p className="text-xs sm:text-sm text-slate-700 bg-slate-50 p-4 rounded-xl border border-slate-100 whitespace-pre-line leading-relaxed">
                {token.notes_and_remarks || 'No public notes provided.'}
              </p>
            </div>
          </div>

          {/* Attachments Section */}
          <div className="border-t border-slate-100 pt-6">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-3">
              Uploaded Documents ({token.attachments?.length || 0})
            </span>

            {token.attachments && token.attachments.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {token.attachments.map(att => (
                  <div
                    key={att.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs"
                  >
                    <div className="flex items-center space-x-2 truncate mr-2">
                      {att.file_type.includes('pdf') ? (
                        <FileText className="w-4 h-4 text-rose-600 shrink-0" />
                      ) : (
                        <ImageIcon className="w-4 h-4 text-blue-600 shrink-0" />
                      )}
                      <span className="font-medium text-slate-800 truncate">
                        {att.file_name}
                      </span>
                    </div>
                    <a
                      href={att.storage_path}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-amber-700 hover:text-amber-800 font-medium shrink-0 flex items-center gap-1"
                    >
                      <span>View</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400">No attachments uploaded for this token.</p>
            )}
          </div>

          {/* WhatsApp Reminder History & Manual Resend - FR 063 & FR 012 */}
          <div className="border-t-2 border-slate-100 pt-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-3 gap-2">
              <div>
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <Send className="w-4 h-4 text-emerald-600" />
                  <span>WhatsApp Expiry Reminders (IST)</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Automated schedules at 30, 15, 7 days and on expiry date to {token.agent_mobile_number}
                </p>
              </div>

              {/* Manual Resend Trigger Buttons */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[11px] text-slate-400 font-medium mr-1">
                  Manual Trigger:
                </span>
                {(['30_day', '15_day', '7_day', 'expiry'] as ReminderType[]).map(rt => (
                  <button
                    key={rt}
                    onClick={() => handleManualResend(rt)}
                    disabled={resendingType === rt}
                    className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-semibold rounded-md border border-slate-300 disabled:opacity-50"
                  >
                    {resendingType === rt ? 'Sending...' : `Send ${rt.replace('_', ' ')}`}
                  </button>
                ))}
              </div>
            </div>

            {reminders.length === 0 ? (
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 text-slate-400 text-xs text-center">
                No reminders dispatched yet for this token. Eligible reminders trigger automatically during daily IST cron evaluation.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-600">
                  <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-semibold text-slate-700 uppercase">
                    <tr>
                      <th className="px-4 py-2.5">Reminder Type</th>
                      <th className="px-4 py-2.5">Scheduled Date</th>
                      <th className="px-4 py-2.5">Attempt Time (IST)</th>
                      <th className="px-4 py-2.5">Provider Message ID</th>
                      <th className="px-4 py-2.5">Delivery Status</th>
                      <th className="px-4 py-2.5">Mode</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {reminders.map(rem => (
                      <tr key={rem.id}>
                        <td className="px-4 py-3 font-semibold uppercase text-slate-900">
                          {rem.reminder_type.replace('_', ' ')}
                        </td>
                        <td className="px-4 py-3 font-mono">
                          {formatReadableISTDate(rem.scheduled_date)}
                        </td>
                        <td className="px-4 py-3 text-slate-500">
                          {formatReadableISTDateTime(rem.attempt_time)}
                        </td>
                        <td className="px-4 py-3 font-mono text-[11px] text-slate-400 truncate max-w-xs">
                          {rem.provider_message_id || '—'}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold capitalize ${
                              rem.delivery_status === 'delivered' || rem.delivery_status === 'read'
                                ? 'bg-emerald-100 text-emerald-800'
                                : rem.delivery_status === 'sent'
                                ? 'bg-blue-100 text-blue-800'
                                : rem.delivery_status === 'failed'
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {rem.delivery_status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-[11px] text-slate-500">
                          {rem.is_manual_resend ? 'Manual Resend' : 'Automated Cron'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* QR Modal */}
      {showQR && (
        <TokenQRModal
          isOpen={showQR}
          onClose={() => setShowQR(false)}
          tokenNumber={token.token_number}
          trackingUrl={trackingUrl}
        />
      )}

      {/* Printable PDF Modal */}
      {showPDF && (
        <TokenPDFView
          isOpen={showPDF}
          onClose={() => setShowPDF(false)}
          token={token}
        />
      )}
    </div>
  );
}
