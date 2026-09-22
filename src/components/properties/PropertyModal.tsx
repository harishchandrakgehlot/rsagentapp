'use client';

import React, { useState } from 'react';
import { Property } from '@/types';
import { X, Building2, AlertCircle } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (property: Property) => void;
  propertyToEdit?: Property | null;
}

export function PropertyModal({ isOpen, onClose, onSuccess, propertyToEdit }: Props) {
  const [name, setName] = useState(propertyToEdit?.name || '');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const trimmedName = name.trim();
    if (!trimmedName) {
      setError('Please enter the property name / location.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/properties', {
        method: propertyToEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: propertyToEdit?.id,
          name: trimmedName,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to save property');
      }

      onSuccess(data.property);
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error saving property';
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
              <Building2 className="w-4 h-4" />
            </div>
            <h3 className="font-semibold text-base text-slate-900">
              {propertyToEdit ? 'Edit Property Record' : 'Register New Property'}
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
              Property Name & Location <span className="text-rose-500">*</span>
            </label>
            <textarea
              required
              rows={3}
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Royal Palms Tower A, Flat 1402, Mumbai"
              className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-slate-900 placeholder:text-slate-400"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Properties saved here are stored in the master list and reusable across future tokens.
            </p>
          </div>

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
              {submitting ? 'Saving...' : propertyToEdit ? 'Save Changes' : 'Create Property'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
