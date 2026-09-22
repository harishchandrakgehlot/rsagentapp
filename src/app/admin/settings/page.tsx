'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { AdminHeader } from '@/components/layout/AdminHeader';
import {
  ShieldCheck,
  Send,
  Database,
  Globe,
  KeyRound,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';

export default function AdminSettingsPage() {
  const [testingCron, setTestingCron] = useState(false);
  const [cronResult, setCronResult] = useState<string | null>(null);

  const handleTestCron = async () => {
    setTestingCron(true);
    setCronResult(null);
    try {
      const res = await fetch('/api/cron/reminders', { method: 'POST' });
      const data = await res.json();
      setCronResult(
        data.success
          ? `✅ Successfully verified IST reminder execution: ${data.message}`
          : `⚠️ Cron returned: ${data.error}`
      );
    } catch {
      setCronResult('❌ Network error testing cron endpoint.');
    } finally {
      setTestingCron(false);
    }
  };

  return (
    <div className="space-y-6">
      <AdminHeader
        title="Settings & Integration Status"
        subtitle="Manage administrator profile, verify Supabase database health, and inspect Meta WhatsApp Cloud API credentials"
      />

      {/* Card 1: Super Admin Account */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-700 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Super Admin Account
              </h2>
              <p className="text-xs text-slate-500">Sole administrator authorization credentials</p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold rounded-full">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Active Session
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <span className="text-slate-400 uppercase font-semibold block mb-1">
              Registered Email (PRD Confirmed)
            </span>
            <p className="font-semibold text-slate-900 font-mono text-sm">
              harishchandrakgehlot@gmail.com
            </p>
          </div>

          <div>
            <span className="text-slate-400 uppercase font-semibold block mb-1">
              Role & Permissions
            </span>
            <p className="font-semibold text-slate-900">
              Single Super Admin (Full Read, Write, Archive & Override)
            </p>
          </div>
        </div>

        <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-600 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-amber-600" />
            <span>Password resets are sent directly to the registered email address.</span>
          </div>
          <Link
            href="/admin/login"
            className="text-amber-700 hover:text-amber-800 font-semibold"
          >
            Reset Password
          </Link>
        </div>
      </div>

      {/* Card 2: Meta WhatsApp Business Cloud API */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 flex items-center justify-center">
              <Send className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Meta WhatsApp Business Cloud API
              </h2>
              <p className="text-xs text-slate-500">Automated IST expiry reminder engine & webhooks</p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-700 border border-blue-200 text-xs font-semibold rounded-full">
            Simulation & Live Ready
          </span>
        </div>

        <div className="space-y-3 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-slate-400 font-semibold block uppercase mb-1">
                Webhook Callback Endpoint
              </span>
              <p className="font-mono text-slate-800 text-[11px] truncate">
                /api/webhooks/whatsapp
              </p>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-slate-400 font-semibold block uppercase mb-1">
                Webhook Verification Secret
              </span>
              <p className="font-mono text-slate-800 text-[11px]">
                royal_services_webhook_verify_2026
              </p>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs">
            <p className="font-semibold mb-1">WhatsApp Expiry Reminder Schedule (IST):</p>
            <p>• <strong>30 Days Before:</strong> Advance renewal notice sent to assigned agent token mobile.</p>
            <p>• <strong>15 Days Before:</strong> Mid-term reminder notification.</p>
            <p>• <strong>7 Days Before:</strong> Urgent expiry alert.</p>
            <p>• <strong>Expiry Date:</strong> Final expiration notice.</p>
            <p className="text-[11px] text-amber-700 mt-2">
              All sends are idempotent — identical scheduled reminders are never sent twice for the same token.
            </p>
          </div>

          {/* Test Cron Button */}
          <div className="pt-2 flex items-center justify-between">
            <div>
              <p className="font-semibold text-slate-800">Test Reminder Job (Vercel Cron simulation)</p>
              <p className="text-[11px] text-slate-500">
                Executes the IST reminder evaluation and records notifications.
              </p>
            </div>
            <button
              onClick={handleTestCron}
              disabled={testingCron}
              className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold shadow-xs disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${testingCron ? 'animate-spin' : ''}`} />
              <span>{testingCron ? 'Evaluating...' : 'Trigger Daily Job'}</span>
            </button>
          </div>

          {cronResult && (
            <p className="p-3 bg-slate-100 rounded-xl text-xs font-mono text-slate-800">
              {cronResult}
            </p>
          )}
        </div>
      </div>

      {/* Card 3: Database & Hosting Deployment */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs space-y-4">
        <div className="flex items-center space-x-3 border-b border-slate-100 pb-4">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-700 flex items-center justify-center">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Deployment & Database Architecture
            </h2>
            <p className="text-xs text-slate-500">Production environment parameters</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-slate-400 font-semibold block uppercase mb-1">
              Hosting Platform
            </span>
            <p className="font-semibold text-slate-800">Vercel (Production)</p>
            <p className="text-[11px] text-slate-500 font-mono mt-0.5">
              rsagentapp.vercel.app
            </p>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-slate-400 font-semibold block uppercase mb-1">
              Database Provider
            </span>
            <p className="font-semibold text-slate-800">Supabase PostgreSQL</p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              RLS + Storage Buckets enabled
            </p>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-slate-400 font-semibold block uppercase mb-1">
              System Timezone
            </span>
            <p className="font-semibold text-slate-800">Asia/Kolkata (IST)</p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              UTC+05:30 canonical
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
