'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PublicHeader, PublicFooter } from '@/components/layout/PublicHeader';
import { AgentTokenTracker } from '@/components/tokens/AgentTokenTracker';
import { Search, ArrowRight, Phone } from 'lucide-react';

export default function TrackMainPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'agent' | 'single'>('agent');
  const [tokenQuery, setTokenQuery] = useState('');
  const [tokenError, setTokenError] = useState('');

  const handleSingleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = tokenQuery.trim();
    if (!clean) {
      setTokenError('Please enter a valid token number.');
      return;
    }
    router.push(`/track/${encodeURIComponent(clean)}`);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#161E42] text-slate-100 font-sans selection:bg-[#2D3774] selection:text-white">
      <PublicHeader />

      <main className="flex-1 py-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Top Logo and Mode Switch Tabs */}
          <div className="text-center space-y-4">
            <div className="inline-block bg-white p-4 sm:p-5 rounded-3xl shadow-xl border border-white/20 max-w-xs mx-auto">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/logo.png"
                alt="Royal Services - A Step Ahead"
                className="w-full h-auto object-contain mx-auto max-h-16"
              />
            </div>

            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
              Royal Services Token Tracker
            </h1>
            <p className="text-sm text-slate-300 max-w-xl mx-auto leading-relaxed">
              Verify service token validity, assigned property records, and client information in real-time synchronized with India Standard Time (IST).
            </p>

            {/* Mode Switcher Tabs */}
            <div className="inline-flex p-1.5 rounded-2xl bg-[#0F1633] border border-[#2D3774] shadow-inner max-w-md mx-auto">
              <button
                type="button"
                onClick={() => setActiveTab('agent')}
                className={`flex items-center gap-2 px-4 sm:px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                  activeTab === 'agent'
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-950/50'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <Phone className="w-4 h-4" />
                <span>Track All by WhatsApp OTP</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('single')}
                className={`flex items-center gap-2 px-4 sm:px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                  activeTab === 'single'
                    ? 'bg-[#2D3774] text-white shadow-lg border border-[#4453A8]'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <Search className="w-4 h-4" />
                <span>Single Token #</span>
              </button>
            </div>
          </div>

          {/* Tab 1: Agent Portal via WhatsApp OTP */}
          {activeTab === 'agent' && (
            <div className="pt-2">
              <AgentTokenTracker />
            </div>
          )}

          {/* Tab 2: Single Token Quick Lookup */}
          {activeTab === 'single' && (
            <div className="bg-[#1C2552]/90 backdrop-blur-md p-6 sm:p-8 rounded-3xl border border-[#2D3774] shadow-2xl max-w-xl mx-auto w-full space-y-6">
              <div className="text-center space-y-2">
                <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-300 flex items-center justify-center mx-auto shadow-inner">
                  <Search className="w-6 h-6" />
                </div>
                <h2 className="text-xl font-bold text-white tracking-tight">
                  Single Token Direct Lookup
                </h2>
                <p className="text-xs text-slate-300 max-w-sm mx-auto">
                  Enter an exact service token number (e.g. RS-2026-0001) to view its public certificate, property assignment, and status.
                </p>
              </div>

              <form onSubmit={handleSingleSearch} className="space-y-4">
                <div className="relative">
                  <Search className="w-5 h-5 text-blue-300 absolute left-4 top-3.5 pointer-events-none" />
                  <input
                    type="text"
                    value={tokenQuery}
                    onChange={e => {
                      setTokenQuery(e.target.value);
                      if (tokenError) setTokenError('');
                    }}
                    placeholder="e.g. RS-2026-0001"
                    className="w-full pl-12 pr-4 py-3.5 text-sm sm:text-base font-mono rounded-2xl bg-[#0F1633] border border-[#2D3774] focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 text-white placeholder:text-slate-500 shadow-inner"
                    autoFocus
                  />
                </div>

                {tokenError && (
                  <p className="text-xs text-rose-400 pl-2">{tokenError}</p>
                )}

                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-2xl bg-[#2D3774] hover:bg-[#222B5C] border border-[#4453A8] text-white font-bold text-sm sm:text-base shadow-lg shadow-blue-950/50 hover:shadow-blue-900/60 transition-all cursor-pointer"
                >
                  <span>Verify Token Certificate</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            </div>
          )}
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
