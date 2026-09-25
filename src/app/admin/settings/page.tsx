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
  Phone,
  Sparkles,
  Edit3,
  Eye,
  EyeOff,
  Trash2,
} from 'lucide-react';


export default function AdminSettingsPage() {
  const [testingCron, setTestingCron] = useState(false);
  const [cronResult, setCronResult] = useState<string | null>(null);
  const [showToken, setShowToken] = useState(false);

  // Meta WhatsApp Config & Tester state
  const [testPhone, setTestPhone] = useState('');
  const [customToken, setCustomToken] = useState('');
  const [testMode, setTestMode] = useState<'template' | 'custom'>('template');
  const [phoneNumberId, setPhoneNumberId] = useState('1387005294491815');
  const [editPhoneIdValue, setEditPhoneIdValue] = useState('1387005294491815');
  const [isEditingPhoneId, setIsEditingPhoneId] = useState(false);
  const [businessPhone, setBusinessPhone] = useState('919819143222');
  const [businessAccountId, setBusinessAccountId] = useState('2150898739182078');
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
  const [selectedTemplate, setSelectedTemplate] = useState('royal_services_notification');
  const [selectedTemplateLang, setSelectedTemplateLang] = useState('en_US');
  const [fetchingTemplates, setFetchingTemplates] = useState(false);
  const [detectedTemplates, setDetectedTemplates] = useState<Array<{
    name: string;
    language: string;
    status: string;
    category?: string;
  }> | null>(null);
  const [testMsgResult, setTestMsgResult] = useState<{
    success: boolean;
    message: string;
    details?: string;
  } | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  React.useEffect(() => {
    let ignore = false;
    // Restore any token stored locally in localStorage asynchronously
    const timer = setTimeout(() => {
      if (ignore) return;
      try {
        const localToken = localStorage.getItem('rs_meta_token');
        if (localToken) {
          if (/[^\x20-\x7E]/.test(localToken) || localToken.startsWith('❌')) {
            localStorage.removeItem('rs_meta_token');
            setCustomToken('');
            setHasSavedToken(false);
          } else {
            setCustomToken(localToken);
            setHasSavedToken(true);
          }
        }
        const localPhoneId = localStorage.getItem('rs_meta_phone_id');
        if (localPhoneId) {
          setPhoneNumberId(localPhoneId);
          setEditPhoneIdValue(localPhoneId);
        }
      } catch {}
    }, 0);


    // Fetch server-side config with AbortController to avoid setState on unmounted component
    const controller = new AbortController();
    fetch('/api/whatsapp/config', { signal: controller.signal })
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
      .catch(err => {
        if (err.name !== 'AbortError') {
          // Network error — ignore silently, user can still use the form
        }
      });

    return () => {
      ignore = true;
      clearTimeout(timer);
      controller.abort();
    };
  }, []);



  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleClearToken = async () => {
    try {
      localStorage.removeItem('rs_meta_token');
    } catch {}
    setCustomToken('');
    setHasSavedToken(false);
    setTestMsgResult(null);
    try {
      await fetch('/api/whatsapp/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: '' }),
      });
    } catch {}
  };

  const handleSaveToken = async () => {
    const trimmed = customToken.trim();
    if (!trimmed) return;

    if (/[^\x20-\x7E]/.test(trimmed) || trimmed.startsWith('❌')) {
      setTestMsgResult({
        success: false,
        message: '⚠️ Invalid Token: You have pasted an error message or non-ASCII characters (e.g. ❌) into the token field! Please clear the field and paste your actual Meta Access Token starting with "EAA...".',
      });
      return;
    }

    setSavingToken(true);
    try {
      try {
        localStorage.setItem('rs_meta_token', trimmed);
      } catch {}
      const res = await fetch('/api/whatsapp/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: trimmed }),
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
            message: `No phone numbers registered in Meta under WABA ID ${businessAccountId} yet. Follow the steps below to add +91 98191 43222 in Meta.`,
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

  const handleFetchTemplates = async () => {
    setFetchingTemplates(true);
    setTestMsgResult(null);
    try {
      const tokenParam =
        customToken.trim() ||
        (typeof window !== 'undefined' ? localStorage.getItem('rs_meta_token') || '' : '');
      const url = tokenParam
        ? `/api/whatsapp/templates?token=${encodeURIComponent(tokenParam)}&wabaId=${businessAccountId}`
        : `/api/whatsapp/templates?wabaId=${businessAccountId}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.success && Array.isArray(data.templates)) {
        setDetectedTemplates(data.templates);
        if (data.templates.length > 0) {
          setTestMsgResult({
            success: true,
            message: `📋 Loaded ${data.templates.length} template(s) from Meta! Click any template below to select it.`,
          });
        } else {
          setTestMsgResult({
            success: false,
            message: `No custom templates registered in Meta WABA yet. Using Meta's built-in default "hello_world".`,
          });
        }
      } else {
        setTestMsgResult({
          success: false,
          message: data.error || 'Could not fetch templates from Meta.',
        });
      }
    } catch (e: unknown) {
      setTestMsgResult({
        success: false,
        message: e instanceof Error ? e.message : 'Error querying Meta templates',
      });
    } finally {
      setFetchingTemplates(false);
    }
  };

  const [creatingTemplate, setCreatingTemplate] = useState(false);

  const handleCreateTemplate = async () => {
    setCreatingTemplate(true);
    setTestMsgResult(null);
    try {
      const tokenParam = (
        customToken.trim() ||
        (typeof window !== 'undefined' ? localStorage.getItem('rs_meta_token') || '' : '')
      ).trim();
      const res = await fetch('/api/whatsapp/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: tokenParam || undefined,
          wabaId: businessAccountId,
          name: 'royal_services_notification',
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSelectedTemplate('royal_services_notification');
        setSelectedTemplateLang('en_US');
        setTestMsgResult({
          success: true,
          message: `🎉 ${data.message} Ready to send!`,
        });
        handleFetchTemplates();
      } else {
        setTestMsgResult({
          success: false,
          message: data.error || 'Failed to create template in Meta.',
        });
      }
    } catch (e: unknown) {
      setTestMsgResult({
        success: false,
        message: e instanceof Error ? e.message : 'Error creating template in Meta',
      });
    } finally {
      setCreatingTemplate(false);
    }
  };

  const handleSendTestMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testPhone.trim()) return;

    setSendingTestMsg(true);
    setTestMsgResult(null);

    try {
      const tokenParam = (
        customToken.trim() ||
        (typeof window !== 'undefined' ? localStorage.getItem('rs_meta_token') || '' : '')
      ).trim();

      if (tokenParam && (/[^\x20-\x7E]/.test(tokenParam) || tokenParam.startsWith('❌'))) {
        setTestMsgResult({
          success: false,
          message: '⚠️ Invalid Token: The token field contains an error message or non-ASCII characters (e.g. ❌). Please click "Clear Token" and paste your real Meta Access Token starting with "EAA...".',
        });
        setSendingTestMsg(false);
        return;
      }

      const res = await fetch('/api/whatsapp/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipient: testPhone.trim(),
          token: tokenParam || undefined,
          phoneNumberId: phoneNumberId.trim() || undefined,
          mode: testMode,
          templateName: selectedTemplate,
          templateLanguage: selectedTemplateLang,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setTestMsgResult({
          success: true,
          message: `✅ Message sent successfully! ${data.message || ''} Provider Msg ID: ${data.providerId}`,
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

        {/* Guide for 9819143222 */}
        <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-2xl space-y-2 text-xs">
          <p className="font-bold text-amber-950 flex items-center gap-1.5">
            <Phone className="w-4 h-4 text-amber-700" />
            <span>How to Link +91 98191 43222 in Meta Developer Console</span>
          </p>
          <div className="space-y-1.5 text-amber-900 text-[11px] leading-relaxed">
            <p>
              1. Open your <strong>Meta App Dashboard &gt; WhatsApp &gt; API Setup</strong>.
            </p>
            <p>
              2. Scroll down to <strong>Step 5: Add a phone number</strong>, click <strong>Add phone number</strong>, and enter display name <em>Royal Services</em> and number <em>98191 43222</em>.
            </p>
            <p>
              3. Verify the OTP sent to your phone. Once added, go back to <strong>Step 1</strong> at the top, select <strong>+91 98191 43222</strong> from the <em>From</em> dropdown.
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
                <div className="relative">
                  <input
                    type={showToken ? 'text' : 'password'}
                    value={customToken}
                    onChange={e => setCustomToken(e.target.value)}
                    placeholder="Paste token starting with EAAB..."
                    className={`w-full pl-3 pr-10 py-2 text-xs font-mono rounded-xl border focus:outline-none focus:ring-2 bg-white ${
                      customToken && (/[^\x20-\x7E]/.test(customToken) || customToken.startsWith('❌'))
                        ? 'border-rose-400 focus:ring-rose-500 bg-rose-50/30'
                        : 'border-slate-300 focus:ring-emerald-500'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowToken(!showToken)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                    title={showToken ? 'Hide token' : 'Show token'}
                  >
                    {showToken ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>

                {customToken && (/[^\x20-\x7E]/.test(customToken) || customToken.startsWith('❌')) && (
                  <p className="text-[10px] text-rose-700 bg-rose-50 border border-rose-200 p-1.5 rounded-lg mt-1 font-semibold flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3 shrink-0 text-rose-600" />
                    <span>Contains error message or invalid characters! Click &quot;Clear&quot; and paste your real token (starts with EAA...).</span>
                  </p>
                )}

                <div className="flex items-center justify-between mt-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-500">
                      {hasSavedToken ? '✅ Active token stored' : 'No permanent token saved'}
                    </span>
                    {(hasSavedToken || customToken) && (
                      <button
                        type="button"
                        onClick={handleClearToken}
                        className="text-[10px] text-rose-600 hover:text-rose-800 font-semibold inline-flex items-center gap-0.5 hover:underline"
                        title="Clear saved token from memory and browser"
                      >
                        <Trash2 className="w-2.5 h-2.5" />
                        <span>Clear</span>
                      </button>
                    )}
                  </div>
                  {customToken.trim() && !(customToken && (/[^\x20-\x7E]/.test(customToken) || customToken.startsWith('❌'))) && (
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

            {/* Message Delivery Mode Selection */}
            <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-3">
              <span className="text-[11px] font-semibold text-slate-700 uppercase block">
                Select Message Format:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <label
                  onClick={() => setTestMode('template')}
                  className={`flex items-start gap-2.5 p-2.5 rounded-lg border cursor-pointer transition-colors ${
                    testMode === 'template'
                      ? 'bg-emerald-50/80 border-emerald-300 text-emerald-950 font-medium ring-1 ring-emerald-400'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <input
                    type="radio"
                    name="testMode"
                    checked={testMode === 'template'}
                    onChange={() => setTestMode('template')}
                    className="mt-0.5 text-emerald-600 focus:ring-emerald-500"
                  />
                  <div>
                    <span className="font-bold block text-[11px] text-emerald-900 flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-emerald-600" />
                      Verified Template (Bypasses 24-hr limit)
                    </span>
                    <span className="text-[10px] text-slate-500 block leading-tight mt-0.5">
                      Guaranteed instant delivery anytime, even without an active conversation window.
                    </span>
                  </div>
                </label>

                <label
                  onClick={() => setTestMode('custom')}
                  className={`flex items-start gap-2.5 p-2.5 rounded-lg border cursor-pointer transition-colors ${
                    testMode === 'custom'
                      ? 'bg-emerald-50/80 border-emerald-300 text-emerald-950 font-medium ring-1 ring-emerald-400'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <input
                    type="radio"
                    name="testMode"
                    checked={testMode === 'custom'}
                    onChange={() => setTestMode('custom')}
                    className="mt-0.5 text-emerald-600 focus:ring-emerald-500"
                  />
                  <div>
                    <span className="font-bold block text-[11px] text-slate-900">
                      Custom Text Notification
                    </span>
                    <span className="text-[10px] text-slate-500 block leading-tight mt-0.5">
                      Delivers only if recipient sent a message to +91 98191 43222 in the last 24 hours.
                    </span>
                  </div>
                </label>
              </div>

              {testMode === 'template' && (
                <div className="pt-2 border-t border-slate-100 space-y-2.5">
                  <div className="flex flex-wrap items-center justify-between gap-1.5">
                    <span className="text-[10px] font-semibold text-slate-600 uppercase">
                      Select Production Template to Dispatch:
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleCreateTemplate}
                        disabled={creatingTemplate}
                        className="text-[10px] bg-emerald-100 hover:bg-emerald-200 text-emerald-900 border border-emerald-300 font-semibold px-2 py-0.5 rounded-lg inline-flex items-center gap-1 transition-colors disabled:opacity-50"
                        title="Register official production template in Meta with 1-click"
                      >
                        <Sparkles className={`w-2.5 h-2.5 text-emerald-700 ${creatingTemplate ? 'animate-spin' : ''}`} />
                        <span>{creatingTemplate ? 'Registering...' : '✨ Register Template in Meta'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleFetchTemplates}
                        disabled={fetchingTemplates}
                        className="text-[10px] text-indigo-700 hover:text-indigo-900 font-semibold inline-flex items-center gap-1 hover:underline"
                      >
                        <RefreshCw className={`w-2.5 h-2.5 ${fetchingTemplates ? 'animate-spin' : ''}`} />
                        <span>{fetchingTemplates ? 'Scanning...' : 'Fetch Templates from Meta'}</span>
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedTemplate('royal_services_notification');
                        setSelectedTemplateLang('en_US');
                      }}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${
                        selectedTemplate === 'royal_services_notification'
                          ? 'bg-emerald-700 text-white shadow-xs'
                          : 'bg-emerald-50 text-emerald-900 border border-emerald-200 hover:bg-emerald-100'
                      }`}
                    >
                      royal_services_notification (en_US) ★ Production
                    </button>
                    {detectedTemplates?.map(t => (
                      <button
                        key={`${t.name}_${t.language}`}
                        type="button"
                        onClick={() => {
                          setSelectedTemplate(t.name);
                          setSelectedTemplateLang(t.language);
                        }}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${
                          selectedTemplate === t.name
                            ? 'bg-emerald-700 text-white shadow-xs'
                            : 'bg-indigo-50 text-indigo-800 border border-indigo-200 hover:bg-indigo-100'
                        }`}
                      >
                        {t.name} ({t.language}) {t.status === 'APPROVED' ? '✓' : ''}
                      </button>
                    ))}
                  </div>

                  <p className="text-[10px] text-amber-900 bg-amber-50/90 p-2 rounded-lg border border-amber-200 leading-tight">
                    ℹ️ <strong>Meta Production Rule:</strong> The built-in <code>hello_world</code> template is only allowed on test/sandbox numbers. For your live number (<strong>+91 98191 43222</strong>), click <strong>✨ Register Template in Meta</strong> above, or use <strong>Custom Text Notification</strong> (by texting &quot;Hi&quot; to +91 98191 43222 first)!
                  </p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-[11px] text-blue-900 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200">
                💡 <strong>Tip:</strong> Send &quot;Hi&quot; from your phone to <strong>+91 98191 43222</strong> on WhatsApp to unlock the 24-hour custom message window!
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
