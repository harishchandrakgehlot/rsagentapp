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
  const [plotHouseNo, setPlotHouseNo] = useState(propertyToEdit?.plot_house_no || '');
  const [addressLine1, setAddressLine1] = useState(propertyToEdit?.address_line_1 || propertyToEdit?.name || '');
  const [addressLine2, setAddressLine2] = useState(propertyToEdit?.address_line_2 || '');
  const [landmark, setLandmark] = useState(propertyToEdit?.landmark || '');
  const [city, setCity] = useState(propertyToEdit?.city || '');
  const [state, setState] = useState(propertyToEdit?.state || '');
  const [postalCode, setPostalCode] = useState(propertyToEdit?.postal_code || '');
  const [country, setCountry] = useState(propertyToEdit?.country || 'India');

  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!plotHouseNo.trim() && !addressLine1.trim()) {
      setError('Please enter Plot / House No. or Address Line 1.');
      return;
    }
    if (!city.trim()) {
      setError('Please enter City / Town / Village.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/properties', {
        method: propertyToEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: propertyToEdit?.id,
          plot_house_no: plotHouseNo.trim(),
          address_line_1: addressLine1.trim(),
          address_line_2: addressLine2.trim(),
          landmark: landmark.trim(),
          city: city.trim(),
          state: state.trim(),
          postal_code: postalCode.trim(),
          country: country.trim() || 'India',
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 animate-in fade-in zoom-in-95 duration-150 my-8">
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

        <form onSubmit={handleSubmit} className="mt-4 space-y-3.5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Plot / House No. <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={plotHouseNo}
                onChange={e => setPlotHouseNo(e.target.value)}
                placeholder="e.g. Plot No. 42"
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#2D3774] text-slate-900 placeholder:text-slate-400"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Address Line 1 <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={addressLine1}
                onChange={e => setAddressLine1(e.target.value)}
                placeholder="e.g. Palm Beach Road"
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#2D3774] text-slate-900 placeholder:text-slate-400"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Address Line 2
              </label>
              <input
                type="text"
                value={addressLine2}
                onChange={e => setAddressLine2(e.target.value)}
                placeholder="e.g. Sector 15"
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#2D3774] text-slate-900 placeholder:text-slate-400"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Landmark
              </label>
              <input
                type="text"
                value={landmark}
                onChange={e => setLandmark(e.target.value)}
                placeholder="e.g. Near Metro Station"
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#2D3774] text-slate-900 placeholder:text-slate-400"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                City / Town / Village <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={city}
                onChange={e => setCity(e.target.value)}
                placeholder="e.g. Mumbai"
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#2D3774] text-slate-900 placeholder:text-slate-400"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                State / UT <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={state}
                onChange={e => setState(e.target.value)}
                placeholder="e.g. Maharashtra"
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#2D3774] text-slate-900 placeholder:text-slate-400"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Postal / ZIP <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={postalCode}
                onChange={e => setPostalCode(e.target.value)}
                placeholder="e.g. 400703"
                className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#2D3774] text-slate-900 placeholder:text-slate-400"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Country <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={country}
              onChange={e => setCountry(e.target.value)}
              placeholder="e.g. India"
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#2D3774] text-slate-900 placeholder:text-slate-400"
            />
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
              className="px-4 py-2 text-xs font-semibold text-white bg-[#2D3774] hover:bg-[#222B5C] rounded-lg shadow-xs disabled:opacity-50"
            >
              {submitting ? 'Saving...' : propertyToEdit ? 'Save Changes' : 'Create Property'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
