'use client';

import React from 'react';

interface Props {
  variant?: 'full' | 'horizontal' | 'icon';
  theme?: 'light' | 'dark';
  className?: string;
  height?: number;
}

export function RoyalLogo({ theme = 'light', className = '', height = 44 }: Props) {
  // Always use the exact logo file (/logo.png)
  if (theme === 'dark') {
    return (
      <div
        className={`inline-flex items-center bg-white rounded-xl px-2.5 py-1 shadow-sm border border-slate-100/20 hover:shadow-md transition-all ${className}`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logo.png"
          alt="Royal Services - A Step Ahead"
          className="h-auto w-auto object-contain block"
          style={{ maxHeight: height }}
        />
      </div>
    );
  }

  return (
    <div className={`inline-flex items-center ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/logo.png"
        alt="Royal Services - A Step Ahead"
        className="h-auto w-auto object-contain block"
        style={{ maxHeight: height }}
      />
    </div>
  );
}

