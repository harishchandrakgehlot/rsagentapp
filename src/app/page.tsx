'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PublicHeader, PublicFooter } from '@/components/layout/PublicHeader';
import { Search, ArrowRight, CheckCircle2, FileCheck, QrCode } from 'lucide-react';

export default function PublicLandingPage() {

  const router = useRouter();
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

  return (
    <div className="min-h-screen flex flex-col bg-[#161E42] text-slate-100 font-sans selection:bg-[#2D3774] selection:text-white">
      <PublicHeader />

      {/* Hero Section */}
      <main className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto w-full text-center space-y-8">
          {/* Logo Showcase Card */}
          <div className="inline-block bg-white p-6 sm:p-8 rounded-3xl shadow-2xl border border-slate-100/20 max-w-sm mx-auto">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo.png"
              alt="Royal Services - A Step Ahead"
              className="w-full h-auto object-contain mx-auto"
            />
          </div>

          {/* Title & Description */}
          <div className="space-y-3">
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
              Official Service Token Registry
            </h1>
            <p className="text-sm sm:text-base text-slate-300 max-w-xl mx-auto leading-relaxed">
              Verify authenticated Royal Services property assignments, validity periods, approved public records, and documentation in real time.
            </p>
          </div>

          {/* Search Box Card */}
          <div className="bg-[#1C2552]/90 backdrop-blur-md p-6 sm:p-8 rounded-3xl border border-[#2D3774] shadow-2xl">
            <form onSubmit={handleSearch} className="space-y-4">
              <div className="relative">
                <Search className="w-5 h-5 text-blue-300 absolute left-4 top-3.5 pointer-events-none" />
                <input
                  type="text"
                  value={query}
                  onChange={e => {
                    setQuery(e.target.value);
                    if (error) setError('');
                  }}
                  placeholder="Enter exact token number (e.g. RS-2026-0001)"
                  className="w-full pl-12 pr-4 py-3 text-sm sm:text-base font-mono rounded-2xl bg-[#0F1633] border border-[#2D3774] focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 text-white placeholder:text-slate-400 shadow-inner"
                />
              </div>

              {error && (
                <p className="text-xs text-rose-400 text-left pl-2">{error}</p>
              )}

              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-2xl bg-[#2D3774] hover:bg-[#222B5C] border border-[#4453A8] text-white font-bold text-sm sm:text-base shadow-lg shadow-blue-950/50 hover:shadow-blue-900/60 transition-all cursor-pointer"
              >
                <span>Verify Token Records</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>

          {/* Feature Highlights */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 text-left">
            <div className="p-4 rounded-2xl bg-[#1C2552]/50 border border-[#2D3774]/60 flex items-start gap-3">
              <div className="p-2 rounded-xl bg-[#2D3774]/40 text-blue-300 shrink-0">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xs font-bold text-white uppercase tracking-wider">
                  No Login Required
                </h2>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                  Direct token verification accessible anywhere via link or QR code.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-[#1C2552]/50 border border-[#2D3774]/60 flex items-start gap-3">
              <div className="p-2 rounded-xl bg-[#2D3774]/40 text-blue-300 shrink-0">
                <FileCheck className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xs font-bold text-white uppercase tracking-wider">
                  Approved Public Files
                </h2>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                  Access verified PDFs and property site photos uploaded by administration.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-[#1C2552]/50 border border-[#2D3774]/60 flex items-start gap-3">
              <div className="p-2 rounded-xl bg-[#2D3774]/40 text-blue-300 shrink-0">
                <QrCode className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xs font-bold text-white uppercase tracking-wider">
                  Instant QR Verification
                </h2>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                  Scan token badges or documents directly from any smartphone camera.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
