'use client';

import React from 'react';
import { TokenStatus } from '@/types';
import { CheckCircle2, Clock, AlertTriangle, PauseCircle, XCircle, Archive } from 'lucide-react';

interface Props {
  status?: TokenStatus | string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function TokenStatusBadge({ status = 'active', className = '', size = 'md' }: Props) {
  const norm = (status || 'active').toLowerCase() as TokenStatus;

  let bg = 'bg-emerald-50 text-emerald-800 border-emerald-200';
  let icon = <CheckCircle2 className="w-3.5 h-3.5 mr-1" />;
  let label = 'Active';

  switch (norm) {
    case 'upcoming':
      bg = 'bg-blue-50 text-blue-800 border-blue-200';
      icon = <Clock className="w-3.5 h-3.5 mr-1" />;
      label = 'Upcoming';
      break;
    case 'active':
      bg = 'bg-emerald-50 text-emerald-800 border-emerald-200';
      icon = <CheckCircle2 className="w-3.5 h-3.5 mr-1" />;
      label = 'Active';
      break;
    case 'expired':
      bg = 'bg-amber-50 text-amber-800 border-amber-300';
      icon = <AlertTriangle className="w-3.5 h-3.5 mr-1" />;
      label = 'Expired';
      break;
    case 'suspended':
      bg = 'bg-orange-50 text-orange-800 border-orange-200';
      icon = <PauseCircle className="w-3.5 h-3.5 mr-1" />;
      label = 'Suspended';
      break;
    case 'cancelled':
      bg = 'bg-rose-50 text-rose-800 border-rose-200';
      icon = <XCircle className="w-3.5 h-3.5 mr-1" />;
      label = 'Cancelled';
      break;
    case 'archived':
      bg = 'bg-slate-100 text-slate-700 border-slate-300';
      icon = <Archive className="w-3.5 h-3.5 mr-1" />;
      label = 'Archived';
      break;
  }

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-xs px-2.5 py-1',
    lg: 'text-sm px-3.5 py-1.5',
  };

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full border shadow-xs select-none ${bg} ${sizeClasses[size]} ${className}`}
      aria-label={`Status: ${label}`}
    >
      {icon}
      <span>{label}</span>
    </span>
  );
}
