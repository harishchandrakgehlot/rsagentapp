'use client';

import React from 'react';
import Link from 'next/link';
import { Search, ShieldCheck } from 'lucide-react';
import { RoyalLogo } from '@/components/brand/RoyalLogo';

export function PublicHeader() {
  return (
    <header className="bg-[#161E42] text-white border-b border-slate-800 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
        <Link href="/" className="flex items-center space-x-3 group">
          <RoyalLogo variant="horizontal" theme="dark" height={36} />
        </Link>

        <div className="flex items-center space-x-3 sm:space-x-4">
          <Link
            href="/"
            className="flex items-center gap-1.5 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800/80 px-3 py-2 rounded-lg transition-colors"
          >
            <Search className="w-4 h-4 text-blue-400" />
            <span>Track Token</span>
          </Link>

          <Link
            href="/admin"
            className="flex items-center gap-1.5 text-xs font-semibold text-white bg-[#2D3774] hover:bg-[#222B5C] border border-[#3E4D99] px-4 py-2 rounded-xl transition-all shadow-sm"
          >
            <ShieldCheck className="w-4 h-4 text-blue-200" />
            <span>Admin Portal</span>
          </Link>
        </div>
      </div>
    </header>
  );
}

export function PublicFooter() {
  return (
    <footer className="bg-[#0F1530] border-t border-slate-800/80 text-slate-400 text-xs py-8 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block animate-pulse"></span>
          <span>Royal Services Real-Time Verification Node (IST)</span>
        </div>
        <p className="text-center sm:text-right text-slate-400">
          © {new Date().getFullYear()} Royal Services. All rights reserved. A Step Ahead.
        </p>
      </div>
    </footer>
  );
}
