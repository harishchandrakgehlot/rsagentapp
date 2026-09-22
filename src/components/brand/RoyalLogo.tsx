'use client';

import React from 'react';
import Image from 'next/image';

interface Props {
  variant?: 'full' | 'horizontal' | 'icon';
  theme?: 'light' | 'dark';
  className?: string;
  height?: number;
}

export function RoyalLogo({ variant = 'full', theme = 'light', className = '', height = 48 }: Props) {
  if (variant === 'icon') {
    // Vector reproduction of the Royal Services brand icon
    return (
      <div
        className={`inline-flex items-center justify-center rounded-xl overflow-hidden shadow-xs transition-transform ${className}`}
        style={{ width: height, height }}
      >
        <svg
          viewBox="0 0 100 100"
          className="w-full h-full"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Main Brand Blue Square */}
          <rect width="100" height="100" rx="4" fill="#2D3774" />
          
          {/* Internal Geometric Arrow Cutout */}
          <path
            d="M32 28 H72 V68 H54 V46 H32 Z"
            fill="#FFFFFF"
          />
          
          {/* Bottom Left Diagonal Slice */}
          <path
            d="M20 78 L56 42 L64 50 L28 86 Z"
            fill="#FFFFFF"
          />
        </svg>
      </div>
    );
  }

  // Full / Horizontal Logo
  return (
    <div className={`inline-flex items-center gap-3 ${className}`}>
      {theme === 'dark' ? (
        // For dark backgrounds, wrap in clean white pill badge or show vector mark + text
        <div className="flex items-center space-x-3">
          <div
            className="rounded-xl overflow-hidden bg-white p-1 shadow-sm flex items-center justify-center shrink-0"
            style={{ width: height, height }}
          >
            <svg
              viewBox="0 0 100 100"
              className="w-full h-full"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <rect width="100" height="100" rx="4" fill="#2D3774" />
              <path d="M32 28 H72 V68 H54 V46 H32 Z" fill="#FFFFFF" />
              <path d="M20 78 L56 42 L64 50 L28 86 Z" fill="#FFFFFF" />
            </svg>
          </div>
          <div>
            <div className="font-sans font-black tracking-widest text-white text-base leading-tight">
              ROYAL SERVICES
            </div>
            <div className="text-[9px] uppercase font-bold text-slate-300 tracking-[0.25em]">
              A STEP AHEAD
            </div>
          </div>
        </div>
      ) : (
        // For light backgrounds, display the official logo image
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src="/logo.png"
          alt="Royal Services - A Step Ahead"
          className="h-auto object-contain"
          style={{ maxHeight: height }}
        />
      )}
    </div>
  );
}
