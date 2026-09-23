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
  Phone,
  Check,
  Sparkles,
  Edit3,
} from 'lucide-react';

export default function AdminSettingsPage() {
  const [testingCron, setTestingCron] = useState(false);
  const [cronResult, setCronResult] = useState<string | null>(null);

  // Meta WhatsApp Config & Tester state
  const [testPhone, setTestPhone] = useState('');
  const [customToken, setCustomToken] = useState('');
  const [phoneNumberId, setPhoneNumberId] = useState('1281001591773327');
  const [editPhoneIdValue, setEditPhoneIdValue] = useState('1281001591773327');
  const [isEditingPhoneId, setIsEditingPhoneId] = useState(false);
  const [businessPhone, setBusinessPhone] = useState('919029011341');
  const [businessAccountId, setBusinessAccountId] = useState('1112101401393002');
  const [hasSavedToken, setHasSavedToken] = useState(false);
  const [savingToken, setSavingToken] = useState(false);
  const [savingPhoneId, setSavingPhoneId] = useState(false);
  const [sendingTestMsg, setSendingTestMsg] = useState(false);
  const [fetchingNumbers, setFetchingNumbers] = useState(false);
  const [detectedNumbers, setDetectedNumbers] = useState<Array<{
    id: string;
    display_phone_number?: string;
    verified_name?: string;
    quality_rating?: string;
  }> | null>(null);
  const [testMsgResult, setTestMsgResult] = useState<{
    success: boolean;
    message: string;
    details?: string;
  } | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  React.useEffect(() => {
    try {
      const localToken = localStorage.getItem('rs_meta_token');
      if (localToken) {
        setCustomToken(localToken);
        setHasSavedToken(true);
      }
      const localPhoneId = localStorage.getItem('rs_meta_phone_id');
      if (localPhoneId) {
        setPhoneNumberId(localPhoneId);
        setEditPhoneIdValue(localPhoneId);
      }
    } catch {}

    fetch('/api/whatsapp/config')
      .then(res => res.json())
      .then(data => {
        if (data.hasToken) setHasSavedToken(true);
        if (data.phoneNumberId) {
          const localPhoneId = typeof window !== 'undefined' ? localStorage.getItem('rs_meta_phone_id') : null;
          if (!localPhoneId) {
            setPhoneNumberId(data.phoneNumberId);
            setEditPhoneIdValue(data.phoneNumberId);
          }
        }
        if (data.businessPhone) setBusinessPhone(data.businessPhone);
        if (data.businessAccountId) setBusinessAccountId(data.businessAccountId);
      })
      .catch(() => {});
  }, []);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleSaveToken = async () => {
    if (!customToken.trim()) return;
    setSavingToken(true);
    try {
      try {
        localStorage.setItem('rs_meta_token', customToken.trim());
      } catch {}
      const res = await fetch('/api/whatsapp/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: customToken.trim() }),
      });
      if (res.ok) {
        setHasSavedToken(true);
        setTestMsgResult({
          success: true,
          message: '💾 Token saved successfully as active system token for automated reminders!',
        });
      }
    } catch {
      // ignore
    } finally {
      setSavingToken(false);
    }
  };

  const handleSavePhoneId = async (idOverride?: string) => {
    const val = (idOverride || editPhoneIdValue).trim();
    if (!val) return;
    setSavingPhoneId(true);
    try {
      try {
        localStorage.setItem('rs_meta_phone_id', val);
      } catch {}
      const res = await fetch('/api/whatsapp/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumberId: val }),
      });
      if (res.ok) {
        setPhoneNumberId(val);
        setEditPhoneIdValue(val);
        setIsEditingPhoneId(false);
        setTestMsgResult({
          success: true,
          message: `💾 Phone Number ID updated to ${val}!`,
        });
      }
    } catch {
      // ignore
    } finally {
      setSavingPhoneId(false);
    }
  };

  const handleFetchNumbers = async () => {
    setFetchingNumbers(true);
    setTestMsgResult(null);
    try {
      const tokenParam =
        customToken.trim() ||
        (typeof window !== 'undefined' ? localStorage.getItem('rs_meta_token') || '' : '');
      const url = tokenParam
        ? `/api/whatsapp/numbers?token=${encodeURIComponent(tokenParam)}`
        : `/api/whatsapp/numbers`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.success && Array.isArray(data.numbers)) {
        setDetectedNumbers(data.numbers);
        if (data.matched) {
          setPhoneNumberId(data.matched.id);
          setEditPhoneIdValue(data.matched.id);
          try {
            localStorage.setItem('rs_meta_phone_id', data.matched.id);
          } catch {}
          setTestMsgResult({
            success: true,
            message: `🎯 Found business number ${data.matched.display_phone_number}! Auto-selected Phone Number ID: ${data.matched.id}`,
          });
        } else if (data.numbers.length > 0) {
          setTestMsgResult({
            success: true,
            message: `Found ${data.numbers.length} registered phone number(s) in Meta. Click below to use one.`,
          });
        } else {
          setTestMsgResult({
            success: false,
            message: `No phone numbers registered in Meta under WABA ID ${businessAccountId} yet. Follow the steps below to add +91 90290 11341 in Meta.`,
          });
        }
      } else {
        setTestMsgResult({
          success: false,
          message: data.error || 'Could not fetch numbers from Meta. Make sure token is entered.',
        });
      }
    } catch (e: unknown) {
      setTestMsgResult({
        success: false,
        message: e instanceof Error ? e.message : 'Error querying Meta API',
      });
    } finally {
      setFetchingNumbers(false);
    }
  };

  const handleSendTestMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testPhone.trim()) return;

    setSendingTestMsg(true);
    setTestMsgResult(null);

    try {
      const tokenParam =
        customToken.trim() ||
        (typeof window !== 'undefined' ? localStorage.getItem('rs_meta_token') || undefined : undefined);
      const res = await fetch('/api/whatsapp/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipient: testPhone.trim(),
          token: tokenParam,
          phoneNumberId: phoneNumberId.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setTestMsgResult({
          success: true,
          message: `✅ Message sent successfully! Provider Msg ID: ${data.providerId}`,
        });
      } else {
        setTestMsgResult({
          success: false,
          message: `❌ Failed: ${data.error || 'Meta API returned an error'}`,
          details: data.raw ? JSON.stringify(data.raw, null, 2) : undefined,
        });
      }
    } catch {
      setTestMsgResult({
        success: false,
        message: '❌ Network error communicating with /api/whatsapp/test.',
      });
    } finally {
      setSendingTestMsg(false);
    }
  };

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
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs space-y-5">
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
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold rounded-full">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Meta Credentials Configured
          </span>
        </div>

        {/* Credentials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          {/* Business Phone Card */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
            <div>
              <span className="text-slate-400 font-semibold block uppercase mb-0.5 text-[10px] flex items-center gap-1">
                <Phone className="w-3 h-3 text-emerald-600" />
                Sender WhatsApp Number
              </span>
              <p className="font-mono text-slate-900 font-bold text-xs">
                +91 {businessPhone.replace(/^91/, '')}
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleCopy(`+91 ${businessPhone.replace(/^91/, '')}`, 'biz_phone')}
              className="px-2.5 py-1 text-[11px] bg-white border border-slate-200 rounded-lg hover:bg-slate-100 text-slate-700 font-medium"
            >
              {copiedKey === 'biz_phone' ? 'Copied!' : 'Copy'}
            </button>
          </div>

          {/* Phone Number ID Card */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-1">
              <span className="text-slate-400 font-semibold block uppercase text-[10px]">
                Active Phone Number ID
              </span>
              <button
                type="button"
                onClick={() => setIsEditingPhoneId(!isEditingPhoneId)}
                className="text-[10px] text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-0.5"
              >
                <Edit3 className="w-2.5 h-2.5" />
                {isEditingPhoneId ? 'Cancel' : 'Change'}
              </button>
            </div>

            {isEditingPhoneId ? (
              <div className="flex items-center gap-1.5 mt-1">
                <input
                  type="text"
                  value={editPhoneIdValue}
                  onChange={e => setEditPhoneIdValue(e.target.value)}
                  placeholder="Enter Phone Number ID"
                  className="w-full px-2 py-1 text-xs font-mono rounded border border-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white"
                />
                <button
                  type="button"
                  onClick={() => handleSavePhoneId()}
                  disabled={savingPhoneId}
                  className="px-2 py-1 text-[11px] bg-emerald-600 text-white rounded font-medium hover:bg-emerald-700 disabled:opacity-50"
                >
                  Save
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <p className="font-mono text-slate-900 font-bold text-xs truncate mr-1">
                  {phoneNumberId}
                </p>
                <button
                  type="button"
                  onClick={() => handleCopy(phoneNumberId, 'phone_id')}
                  className="px-2 py-0.5 text-[11px] bg-white border border-slate-200 rounded-lg hover:bg-slate-100 text-slate-700 font-medium shrink-0"
                >
                  {copiedKey === 'phone_id' ? 'Copied!' : 'Copy'}
                </button>
              </div>
            )}
          </div>

          {/* WABA ID Card */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
            <div>
              <span className="text-slate-400 font-semibold block uppercase mb-0.5 text-[10px]">
                WhatsApp Business Account ID
              </span>
              <p className="font-mono text-slate-900 font-bold text-xs">
                {businessAccountId}
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleCopy(businessAccountId, 'waba_id')}
              className="px-2.5 py-1 text-[11px] bg-white border border-slate-200 rounded-lg hover:bg-slate-100 text-slate-700 font-medium"
            >
              {copiedKey === 'waba_id' ? 'Copied!' : 'Copy'}
            </button>
          </div>
        </div>

        {/* Sync & Auto-Detect Numbers Button */}
        <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-emerald-50/60 border border-emerald-200 rounded-xl text-xs">
          <div>
            <p className="font-bold text-emerald-950 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>Looking for your business number ID?</span>
            </p>
            <p className="text-[11px] text-emerald-800">
              Query Meta to automatically fetch registered Phone Number IDs under WABA ID {businessAccountId}.
            </p>
          </div>
          <button
            type="button"
            onClick={handleFetchNumbers}
            disabled={fetchingNumbers}
            className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-semibold text-xs transition-colors flex items-center gap-1.5 disabled:opacity-50"
          >
            <RefreshCw className={`w-3 h-3 ${fetchingNumbers ? 'animate-spin' : ''}`} />
            <span>{fetchingNumbers ? 'Scanning Meta...' : 'Auto-Detect Phone Numbers'}</span>
          </button>
        </div>

        {/* Detected numbers card if any */}
        {detectedNumbers && detectedNumbers.length > 0 && (
          <div className="p-3 bg-white border border-emerald-200 rounded-xl space-y-2 text-xs">
            <span className="font-bold text-slate-800 block text-[11px] uppercase">
              Registered Phone Numbers Found in Meta:
            </span>
            <div className="space-y-1.5">
              {detectedNumbers.map(num => (
                <div key={num.id} className="flex items-center justify-between p-2 bg-slate-50 border border-slate-200 rounded-lg">
                  <div>
                    <span className="font-bold font-mono text-slate-900">{num.display_phone_number || num.id}</span>
                    {num.verified_name && (
                      <span className="ml-2 text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded font-medium">
                        {num.verified_name}
                      </span>
                    )}
                    <span className="block text-[10px] text-slate-500 font-mono">ID: {num.id}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setPhoneNumberId(num.id);
                      setEditPhoneIdValue(num.id);
                      handleSavePhoneId();
                    }}
                    className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-colors ${
                      phoneNumberId === num.id
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {phoneNumberId === num.id ? '✓ Currently Active' : 'Use this Number ID'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Guide for 919029011341 */}
        <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-2xl space-y-2 text-xs">
          <p className="font-bold text-amber-950 flex items-center gap-1.5">
            <Phone className="w-4 h-4 text-amber-700" />
            <span>How to Link +91 90290 11341 in Meta Developer Console</span>
          </p>
          <div className="space-y-1.5 text-amber-900 text-[11px] leading-relaxed">
            <p>
              1. Open your <strong>Meta App Dashboard &gt; WhatsApp &gt; API Setup</strong>.
            </p>
            <p>
              2. Scroll down to <strong>Step 5: Add a phone number</strong>, click <strong>Add phone number</strong>, and enter display name <em>Royal Services</em> and number <em>90290 11341</em>.
            </p>
            <p>
              3. Verify the OTP sent to your phone. Once added, go back to <strong>Step 1</strong> at the top, select <strong>+91 90290 11341</strong> from the <em>From</em> dropdown.
            </p>
            <p>
              4. Meta will display your new <strong>Phone number ID</strong>. Paste it above or click <strong>Auto-Detect Phone Numbers</strong> to sync it automatically!
            </p>
          </div>
        </div>

        {/* Webhooks Setup Box */}
        <div className="p-4 bg-blue-50/70 border border-blue-200 rounded-2xl space-y-2 text-xs">
          <p className="font-bold text-blue-950 flex items-center gap-1.5">
            <Globe className="w-4 h-4 text-blue-700" />
            <span>Meta Webhook Configuration Details</span>
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div className="bg-white p-2.5 rounded-xl border border-blue-100">
              <span className="text-slate-400 text-[10px] uppercase font-bold block">
                Callback URL (for Meta Dashboard)
              </span>
              <span className="font-mono text-slate-900 text-xs break-all">
                https://rsagentapp.vercel.app/api/webhooks/whatsapp
              </span>
            </div>
            <div className="bg-white p-2.5 rounded-xl border border-blue-100">
              <span className="text-slate-400 text-[10px] uppercase font-bold block">
                Verify Token (for Meta Dashboard)
              </span>
              <span className="font-mono text-slate-900 text-xs">
                royal_services_webhook_verify_2026
              </span>
            </div>
          </div>
          <p className="text-[11px] text-blue-800 pt-1">
            In Meta App Dashboard &gt; <strong>WhatsApp &gt; Configuration &gt; Webhook</strong>, paste the Callback URL and Verify Token, then subscribe to the <strong>messages</strong> field.
          </p>
        </div>

        {/* Live Test WhatsApp Message Dispatcher */}
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
          <div>
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-800">
              🚀 Send Live Test WhatsApp Message
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Paste your Meta Access Token (from the &quot;Generate token&quot; button) and dispatch a live test message to verify connectivity.
            </p>
          </div>

          <form onSubmit={handleSendTestMessage} className="space-y-3 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 uppercase mb-1">
                  Meta Access Token <span className="text-slate-400">(from &quot;Generate token&quot; in Meta)</span>
                </label>
                <input
                  type="password"
                  value={customToken}
                  onChange={e => setCustomToken(e.target.value)}
                  placeholder="Paste token starting with EAAB..."
                  className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                />
                <div className="flex items-center justify-between mt-1">
                  <span className="text-[10px] text-slate-500">
                    {hasSavedToken ? '✅ Active token stored' : 'No permanent token saved'}
                  </span>
                  {customToken.trim() && (
                    <button
                      type="button"
                      onClick={handleSaveToken}
                      disabled={savingToken}
                      className="text-[11px] font-semibold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2 py-0.5 rounded-lg transition-colors disabled:opacity-50"
                    >
                      {savingToken ? 'Saving...' : '💾 Save as Active Token'}
                    </button>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 uppercase mb-1">
                  Recipient Mobile (+91...) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="tel"
                  required
                  value={testPhone}
                  onChange={e => setTestPhone(e.target.value)}
                  placeholder="e.g. 9820123456 or +919820123456"
                  className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-[11px] text-amber-800 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
                ⚠️ Ensure the recipient number is added in Meta &quot;Manage phone number list&quot; for the test number.
              </span>

              <button
                type="submit"
                disabled={sendingTestMsg}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-semibold shadow-xs disabled:opacity-50 transition-colors"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{sendingTestMsg ? 'Sending to WhatsApp...' : 'Send Test WhatsApp Message'}</span>
              </button>
            </div>
          </form>

          {testMsgResult && (
            <div
              className={`p-3 rounded-xl text-xs space-y-1 ${
                testMsgResult.success
                  ? 'bg-emerald-50 border border-emerald-200 text-emerald-900'
                  : 'bg-rose-50 border border-rose-200 text-rose-900'
              }`}
            >
              <p className="font-semibold">{testMsgResult.message}</p>
              {testMsgResult.details && (
                <pre className="p-2 bg-white/80 rounded-lg text-[10px] font-mono overflow-x-auto text-slate-800">
                  {testMsgResult.details}
                </pre>
              )}
            </div>
          )}
        </div>

        {/* Schedule Info */}
        <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200 text-amber-900 text-xs">
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
        <div className="pt-2 flex items-center justify-between border-t border-slate-100">
          <div>
            <p className="font-semibold text-slate-800 text-xs">Test Reminder Job (Vercel Cron simulation)</p>
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
