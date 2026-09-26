'use client';

import React from 'react';
import Link from 'next/link';
import { Search, ShieldCheck } from 'lucide-react';
import { RoyalLogo } from '@/components/brand/RoyalLogo';

export function PublicHeader() {
  return (
    <header className="bg-white text-slate-800 border-b border-slate-200 shadow-2xs sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
        <Link href="/" className="flex items-center space-x-3 group">
          <RoyalLogo variant="horizontal" theme="light" height={40} width={145} />
        </Link>

        <div className="flex items-center space-x-3 sm:space-x-4">
          <Link
            href="/track"
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-200 px-3.5 py-2 rounded-xl transition-colors"
          >
            <Search className="w-3.5 h-3.5 text-[#2D3774]" />
            <span>Track Token</span>
          </Link>

          <Link
            href="/admin"
            className="flex items-center gap-1.5 text-xs font-semibold text-white bg-[#2D3774] hover:bg-[#222B5C] border border-[#2D3774] px-4 py-2 rounded-xl transition-all shadow-xs"
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
    <footer className="bg-white border-t border-slate-200 text-slate-500 text-xs py-8 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block animate-pulse"></span>
          <span className="text-slate-600 font-medium">Royal Services Real-Time Verification Node (IST)</span>
        </div>
        <p className="text-center sm:text-right text-slate-500">
          © {new Date().getFullYear()} Royal Services. All rights reserved. A Step Ahead.
        </p>
      </div>
    </footer>
  );
}
