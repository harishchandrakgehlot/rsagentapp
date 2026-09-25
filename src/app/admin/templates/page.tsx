'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  MessageSquareQuote,
  Calendar,
  Clock,
  Plus,
  Trash2,
  Save,
  RotateCcw,
  Sparkles,
  RefreshCw,
  Send,
  Eye,
  CheckCircle2,
  AlertTriangle,
  Info,
  FileCode2,
} from 'lucide-react';
import { ReminderDepartureRule, TemplatePlaceholder } from '@/types';

export default function AdminTemplatesPage() {
  const [activeTab, setActiveTab] = useState<'schedule' | 'meta' | 'test'>('schedule');
  const [rules, setRules] = useState<ReminderDepartureRule[]>([]);
  const [placeholders, setPlaceholders] = useState<TemplatePlaceholder[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  // Expanded rule editor state (which rule is currently being edited/previewed)
  const [expandedRuleId, setExpandedRuleId] = useState<string>('30_day');

  // Quick test sender state
  const [testRecipient, setTestRecipient] = useState('');
  const [testSelectedRuleId, setTestSelectedRuleId] = useState('30_day');
  const [sendingTest, setSendingTest] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; details?: string } | null>(null);

  // Meta WABA Templates state
  const [metaTemplates, setMetaTemplates] = useState<Array<{ name: string; language: string; status: string; category?: string }>>([]);
  const [fetchingMetaTemplates, setFetchingMetaTemplates] = useState(false);
  const [newMetaName, setNewMetaName] = useState('royal_services_notification');
  const [newMetaCategory, setNewMetaCategory] = useState<'UTILITY' | 'MARKETING'>('UTILITY');
  const [newMetaBody, setNewMetaBody] = useState('Hello! This is an official verified notification from Royal Services. Your account messaging and reminders are active.');
  const [creatingMetaTemplate, setCreatingMetaTemplate] = useState(false);

  // Sample data for preview rendering
  const sampleToken = {
    agentName: 'Ramesh Patel',
    tokenNumber: 'RS-2026-0842',
    associateName: 'Apex Real Estate Ventures',
    property: 'Imperial Heights, Tower B - 402, Mumbai',
    startDate: '01 Oct 2026',
    expiryDate: '31 Oct 2026',
    status: 'ACTIVE',
    trackingUrl: 'https://rsagentapp.vercel.app/track/RS-2026-0842',
  };


  const fetchMetaTemplatesList = async () => {
    setFetchingMetaTemplates(true);
    try {
      const res = await fetch('/api/whatsapp/templates');
      const data = await res.json();
      if (data.success && Array.isArray(data.templates)) {
        setMetaTemplates(data.templates);
      }
    } catch {
      // ignore
    } finally {
      setFetchingMetaTemplates(false);
    }
  };

  // Now that both fetch functions are declared, call them on mount with cleanup
  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        const res = await fetch('/api/admin/reminder-templates');
        const data = await res.json();
        if (!ignore && data.success && Array.isArray(data.rules)) {
          setRules(data.rules);
          if (data.placeholders) setPlaceholders(data.placeholders);
          if (data.rules.length > 0 && !data.rules.find((r: ReminderDepartureRule) => r.id === expandedRuleId)) {
            setExpandedRuleId(data.rules[0].id);
          }
        }
      } catch {
        if (!ignore) {
          setStatusMessage({ type: 'error', text: 'Failed to load departure rules from server.' });
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    })();

    (async () => {
      try {
        const res = await fetch('/api/whatsapp/templates');
        const data = await res.json();
        if (!ignore && data.success && Array.isArray(data.templates)) {
          setMetaTemplates(data.templates);
        }
      } catch {
        // ignore
      } finally {
        if (!ignore) {
          setFetchingMetaTemplates(false);
        }
      }
    })();

    return () => {
      ignore = true;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);



  const handleSaveAll = async () => {

    setSaving(true);
    setStatusMessage(null);
    try {
      const res = await fetch('/api/admin/reminder-templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rules }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setRules(data.rules);
        setStatusMessage({ type: 'success', text: '✅ All WhatsApp departure intervals and message templates successfully saved!' });
      } else {
        setStatusMessage({ type: 'error', text: data.error || 'Failed to save changes.' });
      }
    } catch {
      setStatusMessage({ type: 'error', text: 'Network error saving templates.' });
    } finally {
      setSaving(false);
    }
  };

  const handleResetDefaults = async () => {
    if (!confirm('Are you sure you want to reset all departure schedule days and message templates to the original Royal Services defaults?')) {
      return;
    }
    setResetting(true);
    setStatusMessage(null);
    try {
      const res = await fetch('/api/admin/reminder-templates', { method: 'DELETE' });
      const data = await res.json();
      if (res.ok && data.success) {
        setRules(data.rules);
        setStatusMessage({ type: 'info', text: '🔄 Departure schedule and message templates have been reset to factory defaults.' });
      } else {
        setStatusMessage({ type: 'error', text: data.error || 'Failed to reset rules.' });
      }
    } catch {
      setStatusMessage({ type: 'error', text: 'Network error resetting rules.' });
    } finally {
      setResetting(false);
    }
  };

  const handleAddRule = () => {
    const newDays = 3;
    const newId = `custom_${newDays}_day_${Date.now()}`;
    const newRule: ReminderDepartureRule = {
      id: newId,
      days_before_expiry: newDays,
      label: `${newDays}-Day Final Urgent Warning`,
      is_active: true,
      message_template:
`*Royal Services — ${newDays}-Day Urgent Departure Warning* ⚠️

Hello *{{agent_name}}*,

Your service token is scheduled to expire in just *${newDays} days*. Immediate renewal action is requested.

*Token Details:*
• Token No: {{token_number}}
• Client: {{associate_name}}
• Property: {{property}}
• Expiry Date: *{{expiry_date}}*
• Status: {{status}}

📎 View & Track:
{{tracking_url}}

Please contact the Royal Services administration immediately.

_Royal Services Administration Portal_`,
      meta_template_name: 'royal_services_notification',
      meta_template_language: 'en_US',
    };

    setRules(prev => [...prev, newRule]);
    setExpandedRuleId(newId);
  };

  const handleDeleteRule = (id: string) => {
    if (!confirm('Are you sure you want to delete this departure milestone?')) return;
    setRules(prev => prev.filter(r => r.id !== id));
    if (expandedRuleId === id) {
      const remaining = rules.filter(r => r.id !== id);
      if (remaining.length > 0) setExpandedRuleId(remaining[0].id);
    }
  };

  const handleUpdateRule = (id: string, updates: Partial<ReminderDepartureRule>) => {
    setRules(prev =>
      prev.map(r => (r.id === id ? { ...r, ...updates } : r))
    );
  };

  const handleInsertPlaceholder = (ruleId: string, placeholderKey: string) => {
    const rule = rules.find(r => r.id === ruleId);
    if (!rule) return;
    const updated = `${rule.message_template} ${placeholderKey}`;
    handleUpdateRule(ruleId, { message_template: updated });
  };

  // Preview renderer substituting sample placeholders
  const renderPreview = (template: string, daysBefore: number) => {
    return template
      .replace(/\{\{agent_name\}\}/g, sampleToken.agentName)
      .replace(/\{\{token_number\}\}/g, sampleToken.tokenNumber)
      .replace(/\{\{associate_name\}\}/g, sampleToken.associateName)
      .replace(/\{\{property\}\}/g, sampleToken.property)
      .replace(/\{\{start_date\}\}/g, sampleToken.startDate)
      .replace(/\{\{expiry_date\}\}/g, sampleToken.expiryDate)
      .replace(/\{\{status\}\}/g, sampleToken.status)
      .replace(/\{\{tracking_url\}\}/g, sampleToken.trackingUrl)
      .replace(/\{\{days_left\}\}/g, String(daysBefore));
  };

  const handleSendTestMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testRecipient.trim()) return;

    setSendingTest(true);
    setTestResult(null);

    const rule = rules.find(r => r.id === testSelectedRuleId);
    const bodyToSend = rule
      ? renderPreview(rule.message_template, rule.days_before_expiry)
      : 'Hello from Royal Services WhatsApp Integration Test!';

    try {
      const res = await fetch('/api/whatsapp/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipient: testRecipient.trim(),
          mode: 'custom',
          message: bodyToSend,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setTestResult({
          success: true,
          message: `✅ Message sent successfully! Msg ID: ${data.providerId}`,
        });
      } else {
        setTestResult({
          success: false,
          message: `❌ Failed: ${data.error || 'Meta WhatsApp API returned an error'}`,
          details: data.raw ? JSON.stringify(data.raw, null, 2) : undefined,
        });
      }
    } catch {
      setTestResult({
        success: false,
        message: '❌ Network error communicating with WhatsApp test endpoint.',
      });
    } finally {
      setSendingTest(false);
    }
  };

  const handleRegisterMetaTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingMetaTemplate(true);
    setStatusMessage(null);
    try {
      const res = await fetch('/api/whatsapp/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newMetaName,
          category: newMetaCategory,
          text: newMetaBody,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setStatusMessage({
          type: 'success',
          text: `🎉 Meta Template "${data.name}" registered! Status: ${data.status || 'APPROVED'}. Ready to send!`,
        });
        fetchMetaTemplatesList();
      } else {
        setStatusMessage({
          type: 'error',
          text: data.error || 'Failed to register template with Meta API.',
        });
      }
    } catch {
      setStatusMessage({ type: 'error', text: 'Network error registering template with Meta.' });
    } finally {
      setCreatingMetaTemplate(false);
    }
  };

  const activeRule = rules.find(r => r.id === expandedRuleId);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-emerald-100 text-emerald-800 rounded-xl">
              <MessageSquareQuote className="w-5 h-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              WhatsApp Templates & Departure Schedule
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Configure departure intervals (days before expiry), edit message content with dynamic tags, and sync with Meta OpenAPI.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Link
            href="/admin/openapi"
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
          >
            <FileCode2 className="w-3.5 h-3.5 text-blue-600" />
            <span>Meta OpenAPI Specs</span>
          </Link>

          <button
            type="button"
            onClick={handleResetDefaults}
            disabled={resetting || loading}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors disabled:opacity-50"
            title="Reset departure schedule and templates to factory defaults"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${resetting ? 'animate-spin' : ''}`} />
            <span>Reset Defaults</span>
          </button>

          <button
            type="button"
            onClick={handleSaveAll}
            disabled={saving || loading}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors disabled:opacity-50"
          >
            <Save className={`w-3.5 h-3.5 ${saving ? 'animate-spin' : ''}`} />
            <span>{saving ? 'Saving...' : 'Save All Changes'}</span>
          </button>
        </div>
      </div>

      {/* Status banner */}
      {statusMessage && (
        <div
          className={`p-3.5 rounded-xl border text-xs sm:text-sm flex items-start justify-between gap-3 ${
            statusMessage.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : statusMessage.type === 'error'
              ? 'bg-rose-50 border-rose-200 text-rose-900'
              : 'bg-blue-50 border-blue-200 text-blue-900'
          }`}
        >
          <div className="flex items-center gap-2">
            {statusMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : statusMessage.type === 'error' ? (
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            ) : (
              <Info className="w-4 h-4 text-blue-600 shrink-0" />
            )}
            <span>{statusMessage.text}</span>
          </div>
          <button
            onClick={() => setStatusMessage(null)}
            className="text-slate-400 hover:text-slate-600 text-xs font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* Summary Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 bg-white border border-slate-200 rounded-xl shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            Departure Milestones
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-xl sm:text-2xl font-bold text-slate-900">{rules.length}</span>
            <span className="text-[11px] text-emerald-600 font-medium">
              {rules.filter(r => r.is_active).length} Active
            </span>
          </div>
        </div>

        <div className="p-3.5 bg-white border border-slate-200 rounded-xl shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            Cron Evaluation
          </span>
          <div className="flex items-center gap-1.5 mt-1">
            <Clock className="w-4 h-4 text-indigo-600" />
            <span className="text-xs sm:text-sm font-bold text-slate-800">Daily 09:00 IST</span>
          </div>
        </div>

        <div className="p-3.5 bg-white border border-slate-200 rounded-xl shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            Sender Number
          </span>
          <div className="text-xs sm:text-sm font-bold text-slate-900 font-mono mt-1">
            +91 98191 43222
          </div>
        </div>

        <div className="p-3.5 bg-white border border-slate-200 rounded-xl shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            Meta WABA Templates
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-xl sm:text-2xl font-bold text-slate-900">{metaTemplates.length}</span>
            <span className="text-[11px] text-indigo-600 font-medium">Registered</span>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-slate-200 gap-2">
        <button
          type="button"
          onClick={() => setActiveTab('schedule')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold border-b-2 transition-all ${
            activeTab === 'schedule'
              ? 'border-emerald-600 text-emerald-950 bg-emerald-50/40'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
          }`}
        >
          <Calendar className="w-4 h-4 text-emerald-600" />
          <span>Departure Schedules & Messages</span>
          <span className="px-1.5 py-0.2 bg-emerald-100 text-emerald-800 text-[10px] rounded-full font-bold">
            {rules.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('meta')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold border-b-2 transition-all ${
            activeTab === 'meta'
              ? 'border-emerald-600 text-emerald-950 bg-emerald-50/40'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
          }`}
        >
          <Sparkles className="w-4 h-4 text-indigo-600" />
          <span>Meta Official Templates (WABA)</span>
          <span className="px-1.5 py-0.2 bg-indigo-100 text-indigo-800 text-[10px] rounded-full font-bold">
            {metaTemplates.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('test')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold border-b-2 transition-all ${
            activeTab === 'test'
              ? 'border-emerald-600 text-emerald-950 bg-emerald-50/40'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
          }`}
        >
          <Send className="w-4 h-4 text-emerald-700" />
          <span>Live Test Dispatcher</span>
        </button>
      </div>

      {/* TAB 1: Departure Schedules & Messages */}
      {activeTab === 'schedule' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left list of departure milestones */}
            <div className="lg:col-span-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Departure Milestones ({rules.length})
                </span>
                <button
                  type="button"
                  onClick={handleAddRule}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2.5 py-1 rounded-lg transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Departure Day</span>
                </button>
              </div>

              {rules.map(rule => {
                const isSelected = rule.id === expandedRuleId;
                const isExpiry = rule.days_before_expiry === 0;

                return (
                  <div
                    key={rule.id}
                    onClick={() => setExpandedRuleId(rule.id)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-50/80 border-emerald-400 ring-2 ring-emerald-500/20 shadow-sm'
                        : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/80'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <input
                          type="checkbox"
                          checked={rule.is_active}
                          onChange={e => {
                            e.stopPropagation();
                            handleUpdateRule(rule.id, { is_active: e.target.checked });
                          }}
                          className="w-4 h-4 text-emerald-600 rounded-sm focus:ring-emerald-500 cursor-pointer"
                          title="Toggle active/inactive in daily cron schedule"
                        />
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-xs font-bold text-slate-900">
                              {rule.label}
                            </span>
                            <span
                              className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                                isExpiry
                                  ? 'bg-rose-100 text-rose-800'
                                  : rule.days_before_expiry <= 7
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-blue-100 text-blue-800'
                              }`}
                            >
                              {isExpiry ? '🚨 Expiry Day (0d)' : `📅 ${rule.days_before_expiry} Days Before`}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5 font-mono">
                            {rule.message_template.slice(0, 70)}...
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <span className={`w-2 h-2 rounded-full ${rule.is_active ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                        {rule.id.startsWith('custom_') && (
                          <button
                            type="button"
                            onClick={e => {
                              e.stopPropagation();
                              handleDeleteRule(rule.id);
                            }}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded-md hover:bg-rose-50 transition-colors"
                            title="Delete custom departure milestone"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-[11px] text-blue-900 leading-relaxed space-y-1">
                <p className="font-semibold flex items-center gap-1">
                  <Info className="w-3.5 h-3.5 text-blue-600" />
                  Departure Automation Logic:
                </p>
                <p>
                  Every day at <strong>09:00 AM IST</strong>, the system evaluates all active departure milestones. For each active token whose expiry matches <code>(End Date - X Days)</code>, the corresponding message template is automatically dispatched!
                </p>
              </div>
            </div>

            {/* Right editor & preview for selected rule */}
            <div className="lg:col-span-7">
              {activeRule ? (
                <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
                  {/* Rule Header Config */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                    <div className="space-y-1 flex-1">
                      <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                        Milestone Title
                      </label>
                      <input
                        type="text"
                        value={activeRule.label}
                        onChange={e => handleUpdateRule(activeRule.id, { label: e.target.value })}
                        className="w-full text-sm font-bold text-slate-900 px-2.5 py-1.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>

                    <div className="w-36 space-y-1">
                      <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                        Days Before Expiry
                      </label>
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          min="0"
                          max="365"
                          value={activeRule.days_before_expiry}
                          onChange={e => handleUpdateRule(activeRule.id, { days_before_expiry: parseInt(e.target.value) || 0 })}
                          className="w-full text-sm font-mono font-bold text-slate-900 px-2.5 py-1.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                        <span className="text-xs font-semibold text-slate-500">Days</span>
                      </div>
                    </div>
                  </div>

                  {/* Placeholder Insert Chips */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider">
                        Insert Dynamic Placeholders:
                      </span>
                      <span className="text-[10px] text-slate-400">Click to insert into template</span>
                    </div>

                    <div className="flex flex-wrap gap-1">
                      {placeholders.map(p => (
                        <button
                          key={p.key}
                          type="button"
                          onClick={() => handleInsertPlaceholder(activeRule.id, p.key)}
                          className="px-2 py-0.5 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-800 hover:border-emerald-300 border border-slate-200 text-slate-700 text-[11px] font-mono rounded-md transition-colors"
                          title={`${p.label} (${p.description}) — Example: ${p.example}`}
                        >
                          + {p.key}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Template Editor */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider">
                        WhatsApp Message Body Text:
                      </label>
                      <span className="text-[10px] text-slate-400">
                        {activeRule.message_template.length} characters • WhatsApp formatting supported
                      </span>
                    </div>

                    <textarea
                      rows={10}
                      value={activeRule.message_template}
                      onChange={e => handleUpdateRule(activeRule.id, { message_template: e.target.value })}
                      className="w-full font-mono text-xs text-slate-800 p-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50/50 leading-relaxed"
                      placeholder="Enter WhatsApp template text..."
                    />

                    <div className="flex items-center gap-3 text-[10px] text-slate-500">
                      <span>Formatting: <code>*bold*</code></span>
                      <span><code>_italic_</code></span>
                      <span><code>~strike~</code></span>
                      <span><code>```monospace```</code></span>
                    </div>
                  </div>

                  {/* Live WhatsApp Chat Preview */}
                  <div className="space-y-2 pt-2 border-t border-slate-100">
                    <span className="text-[11px] font-semibold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                      <Eye className="w-3.5 h-3.5 text-emerald-600" />
                      Live WhatsApp Recipient Preview:
                    </span>

                    {/* Realistic WhatsApp Chat Bubble */}
                    <div className="p-4 bg-[#EFEAE2] rounded-xl border border-slate-300 relative overflow-hidden shadow-inner">
                      <div className="max-w-md bg-white text-slate-900 p-3 rounded-lg rounded-tl-none shadow-sm text-xs leading-relaxed space-y-2 relative border border-slate-200">
                        <div className="whitespace-pre-wrap font-sans text-slate-800">
                          {renderPreview(activeRule.message_template, activeRule.days_before_expiry)}
                        </div>
                        <div className="flex items-center justify-end gap-1 text-[10px] text-slate-400 pt-1">
                          <span>09:00 AM</span>
                          <span className="text-blue-500 font-bold">✓✓</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Bottom Action */}
                  <div className="flex items-center justify-between pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setTestSelectedRuleId(activeRule.id);
                        setActiveTab('test');
                      }}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-700 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-3 py-1.5 rounded-lg transition-colors"
                    >
                      <Send className="w-3 h-3" />
                      <span>Test Send This Message</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleSaveAll}
                      disabled={saving}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-semibold transition-colors disabled:opacity-50"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>{saving ? 'Saving...' : 'Save Changes'}</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-12 text-center text-slate-400 bg-white border border-slate-200 rounded-xl">
                  Select a departure milestone from the left to edit its template.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Meta Official Templates (WABA) */}
      {activeTab === 'meta' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: Register new Meta Template */}
            <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
              <div>
                <span className="font-bold text-slate-900 text-sm block">
                  Register Official Meta Template
                </span>
                <span className="text-xs text-slate-500 block mt-0.5">
                  Directly submits to WhatsApp Business Account WABA via Graph API.
                </span>
              </div>

              <form onSubmit={handleRegisterMetaTemplate} className="space-y-3 text-xs">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 uppercase mb-1">
                    Template Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={newMetaName}
                    onChange={e => setNewMetaName(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_'))}
                    placeholder="e.g. royal_services_notification"
                    className="w-full px-3 py-2 font-mono rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <span className="text-[10px] text-slate-400">Lowercase letters, numbers, and underscores only</span>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 uppercase mb-1">
                    Category <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={newMetaCategory}
                    onChange={e => setNewMetaCategory(e.target.value as 'UTILITY' | 'MARKETING')}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  >
                    <option value="UTILITY">UTILITY (Recommended for Reminders & Alerts)</option>
                    <option value="MARKETING">MARKETING (Offers & Promotions)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 uppercase mb-1">
                    Template Body Content <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={newMetaBody}
                    onChange={e => setNewMetaBody(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50 font-sans"
                  />
                </div>

                <button
                  type="submit"
                  disabled={creatingMetaTemplate}
                  className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold shadow-xs transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  <Sparkles className={`w-3.5 h-3.5 ${creatingMetaTemplate ? 'animate-spin' : ''}`} />
                  <span>{creatingMetaTemplate ? 'Submitting to Meta...' : 'Register Template with Meta WABA'}</span>
                </button>
              </form>
            </div>

            {/* Right: List of registered Meta templates */}
            <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <span className="font-bold text-slate-900 text-sm block">
                    Registered WABA Templates ({metaTemplates.length})
                  </span>
                  <span className="text-xs text-slate-500 block mt-0.5">
                    Templates fetched from Meta WhatsApp Business Account (WABA: 2150898739182078)
                  </span>
                </div>

                <button
                  type="button"
                  onClick={fetchMetaTemplatesList}
                  disabled={fetchingMetaTemplates}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-700 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-2.5 py-1 rounded-lg transition-colors disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${fetchingMetaTemplates ? 'animate-spin' : ''}`} />
                  <span>{fetchingMetaTemplates ? 'Scanning...' : 'Sync from Meta'}</span>
                </button>
              </div>

              {metaTemplates.length === 0 ? (
                <div className="p-8 text-center text-slate-400 space-y-2">
                  <p>No custom templates loaded from Meta WABA yet.</p>
                  <p className="text-xs text-slate-500">
                    Use the form on the left or click &quot;Sync from Meta&quot; to fetch your registered templates.
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5 max-h-[460px] overflow-y-auto pr-1">
                  {metaTemplates.map(t => (
                    <div
                      key={`${t.name}_${t.language}`}
                      className="p-3 bg-slate-50/80 border border-slate-200 rounded-xl flex items-center justify-between gap-3 text-xs"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold font-mono text-slate-900">{t.name}</span>
                          <span className="text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded">
                            {t.language}
                          </span>
                          {t.category && (
                            <span className="text-[10px] bg-indigo-50 text-indigo-700 border border-indigo-200 px-1.5 py-0.5 rounded">
                              {t.category}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            t.status === 'APPROVED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : t.status === 'PENDING'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {t.status === 'APPROVED' ? '✓ APPROVED' : t.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Live Test Dispatcher */}
      {activeTab === 'test' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs max-w-2xl space-y-4">
          <div>
            <span className="font-bold text-slate-900 text-base block">
              Test WhatsApp Departure Notification
            </span>
            <span className="text-xs text-slate-500 block mt-0.5">
              Dispatches a live notification to test your configured templates and verify formatting.
            </span>
          </div>

          <form onSubmit={handleSendTestMessage} className="space-y-4 text-xs">
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 uppercase mb-1">
                Select Departure Template to Preview & Send <span className="text-rose-500">*</span>
              </label>
              <select
                value={testSelectedRuleId}
                onChange={e => setTestSelectedRuleId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white font-medium"
              >
                {rules.map(r => (
                  <option key={r.id} value={r.id}>
                    {r.label} ({r.days_before_expiry === 0 ? 'Expiry Day' : `${r.days_before_expiry}d Before`})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 uppercase mb-1">
                Recipient WhatsApp Number (+91...) <span className="text-rose-500">*</span>
              </label>
              <input
                type="tel"
                required
                value={testRecipient}
                onChange={e => setTestRecipient(e.target.value)}
                placeholder="e.g. 919820123456 or 9820123456"
                className="w-full px-3 py-2 font-mono rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <span className="text-[10px] text-slate-400 block mt-1">
                💡 Tip: Ensure recipient has sent &quot;Hi&quot; to +91 98191 43222 within 24 hours for custom text messages.
              </span>
            </div>

            {/* Test result output */}
            {testResult && (
              <div
                className={`p-3 rounded-xl border text-xs leading-relaxed ${
                  testResult.success
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                    : 'bg-rose-50 border-rose-200 text-rose-900'
                }`}
              >
                <div className="font-semibold">{testResult.message}</div>
                {testResult.details && (
                  <pre className="mt-1 p-2 bg-slate-900 text-slate-100 rounded text-[10px] overflow-x-auto font-mono">
                    {testResult.details}
                  </pre>
                )}
              </div>
            )}

            <button
              type="submit"
              disabled={sendingTest}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-semibold shadow-xs transition-colors disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{sendingTest ? 'Sending to WhatsApp...' : 'Send Live Test Message'}</span>
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
