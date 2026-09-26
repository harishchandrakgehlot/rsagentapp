'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PublicHeader, PublicFooter } from '@/components/layout/PublicHeader';
import { AgentTokenTracker } from '@/components/tokens/AgentTokenTracker';
import { Search, ArrowRight, CheckCircle2, FileCheck, QrCode, Phone, ShieldCheck } from 'lucide-react';

export default function PublicLandingPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'agent' | 'single'>('agent');
  const [agentStep, setAgentStep] = useState<'mobile' | 'otp' | 'dashboard'>('mobile');
  const [query, setQuery] = useState('');
  const [error, setError] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = query.trim();
    if (!clean) {
      setError('Please enter a valid token number.');
      return;
    }
    router.push(`/track/${encodeURIComponent(clean)}`);
  };

  const isDashboard = agentStep === 'dashboard' && activeTab === 'agent';

  return (
    <div className="min-h-screen flex flex-col bg-[#0b1426] text-slate-100 font-sans selection:bg-blue-600 selection:text-white">
      <PublicHeader />

      <main className={`flex-1 flex flex-col ${isDashboard ? 'py-8 sm:py-10' : 'justify-center py-12'} px-4 sm:px-6 lg:px-8`}>
        {/* If agent is logged in, show the clean full-width dashboard without marketing hero */}
        {isDashboard ? (
          <div className="max-w-5xl mx-auto w-full">
            <AgentTokenTracker onStepChange={setAgentStep} />
          </div>
        ) : (
          /* Logged-out landing / search hero */
          <div className="max-w-4xl mx-auto w-full text-center space-y-8">
            {/* Elegant Header Title */}
            <div className="space-y-3 pt-2">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Official Registry Node • India Standard Time (IST)</span>
              </div>

              <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white">
                Service Token Registry
              </h1>
              <p className="text-sm sm:text-base text-slate-400 max-w-xl mx-auto leading-relaxed">
                Track authenticated property assignments, client certificates, validity periods, and approved documentation in real time.
              </p>

              {/* Mode Switcher Tabs */}
              <div className="inline-flex p-1.5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl max-w-md mx-auto mt-4">
                <button
                  type="button"
                  onClick={() => setActiveTab('agent')}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                    activeTab === 'agent'
                      ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-950/60'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Phone className="w-4 h-4" />
                  <span>Track All by WhatsApp OTP</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('single')}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                    activeTab === 'single'
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-950/60'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Search className="w-4 h-4" />
                  <span>Single Token #</span>
                </button>
              </div>
            </div>

            {/* Tab 1: Agent WhatsApp OTP Portal */}
            {activeTab === 'agent' && (
              <div className="text-left pt-2">
                <AgentTokenTracker onStepChange={setAgentStep} />
              </div>
            )}

            {/* Tab 2: Single Token Direct Lookup */}
            {activeTab === 'single' && (
              <div className="bg-slate-900/90 backdrop-blur-xl p-6 sm:p-8 rounded-3xl border border-slate-800 shadow-2xl max-w-lg mx-auto w-full text-left space-y-4">
                <div className="text-center space-y-1.5 pb-2">
                  <div className="w-11 h-11 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center mx-auto shadow-inner">
                    <Search className="w-5 h-5" />
                  </div>
                  <h2 className="text-lg font-bold text-white tracking-tight">
                    Direct Token Lookup
                  </h2>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    Enter an exact token number to view its public certificate and property details.
                  </p>
                </div>

                <form onSubmit={handleSearch} className="space-y-4">
                  <div className="relative">
                    <Search className="w-5 h-5 text-slate-500 absolute left-4 top-3.5 pointer-events-none" />
                    <input
                      type="text"
                      value={query}
                      onChange={e => {
                        setQuery(e.target.value);
                        if (error) setError('');
                      }}
                      placeholder="e.g. RS-2026-0001 or Test-1"
                      className="w-full pl-12 pr-4 py-3.5 text-sm sm:text-base font-mono rounded-2xl bg-slate-950 border border-slate-800 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 text-white placeholder:text-slate-500 shadow-inner"
                      autoFocus
                    />
                  </div>

                  {error && (
                    <p className="text-xs text-rose-400 pl-2">{error}</p>
                  )}

                  <button
                    type="submit"
                    className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm sm:text-base shadow-lg shadow-blue-950/60 hover:shadow-blue-900/70 transition-all cursor-pointer"
                  >
                    <span>Verify Token Records</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
              </div>
            )}

            {/* Feature Highlights (Only on landing / logged-out) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 text-left">
              <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 flex items-start gap-3">
                <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 shrink-0">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                    Instant WhatsApp OTP
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    Log in once to view all your property tokens in an organized accordion view.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 flex items-start gap-3">
                <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 shrink-0">
                  <FileCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                    Approved Public Records
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    View verified inspection files, PDF agreements, and site photos.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 flex items-start gap-3">
                <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 shrink-0">
                  <QrCode className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                    QR Scan &amp; Share
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    Instant QR codes and 1-click WhatsApp sharing for every assigned token.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <PublicFooter />
    </div>
  );
}
