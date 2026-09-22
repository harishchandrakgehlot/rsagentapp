'use client';

import React, { useState } from 'react';
import { Agent } from '@/types';
import { X, UserPlus, Phone, AlertCircle } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (agent: Agent) => void;
  agentToEdit?: Agent | null;
}

export function AgentModal({ isOpen, onClose, onSuccess, agentToEdit }: Props) {
  const [name, setName] = useState(agentToEdit?.name || '');
  const [mobile, setMobile] = useState(
    agentToEdit?.mobile ? agentToEdit.mobile.replace(/^\+91/, '') : ''
  );
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const trimmedName = name.trim();
    const cleanDigits = mobile.replace(/\D/g, '');

    if (!trimmedName) {
      setError('Please enter the agent full name.');
      return;
    }

    // Validate 10-digit Indian phone number
    if (cleanDigits.length < 10) {
      setError('Please enter a valid 10-digit Indian mobile number.');
      return;
    }

    const fullMobile = `+91${cleanDigits.slice(-10)}`;

    setSubmitting(true);
    try {
      const res = await fetch('/api/agents', {
        method: agentToEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: agentToEdit?.id,
          name: trimmedName,
          mobile: fullMobile,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to save agent');
      }

      onSuccess(data.agent);
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error saving agent';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-6 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700">
              <UserPlus className="w-4 h-4" />
            </div>
            <h3 className="font-semibold text-base text-slate-900">
              {agentToEdit ? 'Edit Agent Master Record' : 'Register New Agent'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Agent Full Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Vikram Sharma"
              className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-slate-900 placeholder:text-slate-400"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              WhatsApp Mobile Number (+91) <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500 font-medium text-xs">
                +91
              </div>
              <input
                type="tel"
                required
                value={mobile}
                onChange={e => setMobile(e.target.value)}
                placeholder="9820123456"
                className="w-full pl-12 pr-10 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-slate-900 placeholder:text-slate-400 font-mono"
              />
              <Phone className="w-4 h-4 text-slate-400 absolute right-3 top-2.5 pointer-events-none" />
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              10-digit Indian mobile number for automated WhatsApp expiry alerts.
            </p>
          </div>

          {agentToEdit && (
            <p className="text-[11px] text-amber-800 bg-amber-50 p-2.5 rounded-lg border border-amber-200">
              ℹ️ Editing this agent updates future tokens. Historical tokens preserve their token-specific overrides.
            </p>
          )}

          <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 rounded-lg hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs disabled:opacity-50"
            >
              {submitting ? 'Saving...' : agentToEdit ? 'Save Changes' : 'Create Agent'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
