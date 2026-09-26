'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PublicHeader, PublicFooter } from '@/components/layout/PublicHeader';
import { AgentTokenTracker } from '@/components/tokens/AgentTokenTracker';
import { Search, ArrowRight, Phone, ShieldCheck } from 'lucide-react';

export default function TrackMainPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'agent' | 'single'>('agent');
  const [agentStep, setAgentStep] = useState<'mobile' | 'otp' | 'dashboard'>('mobile');
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

  const isDashboard = agentStep === 'dashboard' && activeTab === 'agent';

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800 font-sans selection:bg-[#2D3774] selection:text-white">
      <PublicHeader />

      <main className={`flex-1 flex flex-col ${isDashboard ? 'py-8 sm:py-10' : 'justify-center py-12'} px-4 sm:px-6 lg:px-8`}>
        {isDashboard ? (
          <div className="max-w-5xl mx-auto w-full">
            <AgentTokenTracker onStepChange={setAgentStep} />
          </div>
        ) : (
          <div className="max-w-4xl mx-auto w-full text-center space-y-8">
            <div className="space-y-3 pt-2">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#F4F6FC] border border-[#D1D7EE] text-[#2D3774] text-xs font-semibold">
                <ShieldCheck className="w-3.5 h-3.5 text-[#2D3774]" />
                <span>Royal Services Token Portal</span>
              </div>

              <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-[#161E42]">
                Service Token Registry
              </h1>
              <p className="text-sm sm:text-base text-slate-600 max-w-xl mx-auto leading-relaxed">
                Log in via WhatsApp OTP to track all your assigned tokens or perform a direct single token lookup.
              </p>

              {/* Mode Switcher Tabs */}
              <div className="inline-flex p-1.5 rounded-2xl bg-white border border-slate-200 shadow-sm max-w-md mx-auto mt-4">
                <button
                  type="button"
                  onClick={() => setActiveTab('agent')}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                    activeTab === 'agent'
                      ? 'bg-[#2D3774] text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
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
                      ? 'bg-[#2D3774] text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
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
              <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm max-w-lg mx-auto w-full text-left space-y-4">
                <div className="text-center space-y-1.5 pb-2">
                  <div className="w-11 h-11 rounded-2xl bg-[#F4F6FC] border border-[#D1D7EE] text-[#2D3774] flex items-center justify-center mx-auto shadow-2xs">
                    <Search className="w-5 h-5" />
                  </div>
                  <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                    Direct Token Lookup
                  </h2>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    Enter an exact token number to view its public certificate and property details.
                  </p>
                </div>

                <form onSubmit={handleSingleSearch} className="space-y-4">
                  <div className="relative">
                    <Search className="w-5 h-5 text-slate-400 absolute left-4 top-3.5 pointer-events-none" />
                    <input
                      type="text"
                      value={tokenQuery}
                      onChange={e => {
                        setTokenQuery(e.target.value);
                        if (tokenError) setTokenError('');
                      }}
                      placeholder="e.g. RS-2026-0001 or Test-1"
                      className="w-full pl-12 pr-4 py-3.5 text-sm sm:text-base font-mono rounded-xl bg-slate-50 border border-slate-300 focus:bg-white focus:border-[#2D3774] focus:outline-none focus:ring-2 focus:ring-[#2D3774]/20 text-slate-900 placeholder:text-slate-400 shadow-2xs transition-all"
                      autoFocus
                    />
                  </div>

                  {tokenError && (
                    <p className="text-xs text-rose-600 pl-2 font-medium">{tokenError}</p>
                  )}

                  <button
                    type="submit"
                    className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl bg-[#2D3774] hover:bg-[#222B5C] text-white font-bold text-sm sm:text-base shadow-xs hover:shadow transition-all cursor-pointer"
                  >
                    <span>Verify Token Certificate</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
              </div>
            )}
          </div>
        )}
      </main>

      <PublicFooter />
    </div>
  );
}
