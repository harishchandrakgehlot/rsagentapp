'use client';

import React from 'react';

interface Props {
  variant?: 'full' | 'horizontal' | 'icon';
  theme?: 'light' | 'dark';
  className?: string;
  imgClassName?: string;
  height?: number;
  width?: number | string;
  fullWidth?: boolean;
}

export function RoyalLogo({
  theme = 'light',
  className = '',
  imgClassName = '',
  height,
  width,
  fullWidth = false,
}: Props) {
  // Always use the exact logo file (/logo.png)
  if (fullWidth) {
    return (
      <div
        className={`w-full flex items-center justify-center bg-white rounded-xl py-2.5 px-4 shadow-xs border border-slate-100/20 hover:shadow-md transition-all ${className}`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logo.png"
          alt="Royal Services - A Step Ahead"
          className={`w-full max-w-[175px] h-auto object-contain block mx-auto ${imgClassName}`}
          style={{
            maxHeight: height || 62,
            maxWidth: width || 175,
          }}
        />
      </div>
    );
  }

  if (theme === 'dark') {
    return (
      <div
        className={`inline-flex items-center justify-center bg-white rounded-xl px-3 py-1.5 shadow-xs border border-slate-100/20 hover:shadow-md transition-all ${className}`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logo.png"
          alt="Royal Services - A Step Ahead"
          className={`h-auto w-auto object-contain block ${imgClassName}`}
          style={{
            maxHeight: height || 44,
            maxWidth: width,
          }}
        />
      </div>
    );
  }

  return (
    <div className={`inline-flex items-center justify-center ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/logo.png"
        alt="Royal Services - A Step Ahead"
        className={`h-auto w-auto object-contain block ${imgClassName}`}
        style={{
          maxHeight: height || 44,
          maxWidth: width,
        }}
      />
    </div>
  );
}

