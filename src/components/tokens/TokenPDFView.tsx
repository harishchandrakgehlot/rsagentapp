'use client';

import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { Token, PublicTokenView } from '@/types';
import { formatReadableISTDate } from '@/lib/ist';
import { Printer, X } from 'lucide-react';
import { TokenStatusBadge } from './TokenStatusBadge';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  token: Token | PublicTokenView;
}

export function TokenPDFView({ isOpen, onClose, token }: Props) {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://rsagentapp.vercel.app';
  const trackingUrl = `${appUrl}/track/${encodeURIComponent(token.token_number)}`;

  useEffect(() => {
    if (isOpen && token.token_number) {
      QRCode.toDataURL(trackingUrl, {
        width: 180,
        margin: 1,
        color: { dark: '#0A192F', light: '#FFFFFF' },
      }).then(url => setQrDataUrl(url));
    }
  }, [isOpen, token.token_number, trackingUrl]);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const agentName =
    'agent_name' in token
      ? token.agent_name
      : (token as Token).agent?.name || 'Assigned Agent';
  const propertyName =
    'property_name' in token
      ? token.property_name
      : (token as Token).property?.name || 'Property';
  const status = token.computed_status || 'active';
  const attachments = token.attachments || [];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 print:p-0 print:bg-white print:static">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full border border-slate-200 overflow-hidden print:border-none print:shadow-none print:max-w-full">
        {/* Modal Controls - Hidden during print */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50 print:hidden">
          <div className="flex items-center space-x-2">
            <span className="font-semibold text-slate-800">Printable Token Document</span>
            <span className="text-xs bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full font-mono">
              {token.token_number}
            </span>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-2 bg-[#2D3774] hover:bg-[#222B5C] text-white text-xs font-medium rounded-lg shadow-xs transition-colors"
            >
              <Printer className="w-4 h-4" />
              Print / Save PDF
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Document Body */}
        <div id="printable-token-sheet" className="p-8 sm:p-10 text-slate-800 font-sans">
          {/* Header */}
          <div className="flex items-start justify-between border-b-2 border-[#2D3774]/30 pb-6 mb-6">
            <div>
              <div className="mb-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/logo.png"
                  alt="Royal Services - A Step Ahead"
                  className="h-16 w-auto object-contain"
                />
              </div>
              <p className="text-xs font-semibold text-[#2D3774] uppercase tracking-widest">
                Official Service Token Verification
              </p>
              <p className="text-xs text-slate-500 mt-2">
                Verification portal: <span className="font-mono text-slate-700">{appUrl}</span>
              </p>
            </div>

            <div className="text-right">
              <div className="inline-block text-left bg-slate-50 border border-slate-200 rounded-xl p-3">
                <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  Token Number
                </p>
                <p className="text-xl font-bold font-mono text-slate-900 mt-0.5">
                  {token.token_number}
                </p>
                <div className="mt-1.5">
                  <TokenStatusBadge status={status} size="sm" />
                </div>
              </div>
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-6 mb-8 text-sm">
            <div className="space-y-4">
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Associate / Client Name
                </p>
                <p className="text-base font-semibold text-slate-900 mt-0.5">
                  {token.associate_name}
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Assigned Property
                </p>
                <p className="text-base font-medium text-slate-900 mt-0.5">
                  {propertyName}
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Assigned Agent
                </p>
                <p className="text-base font-medium text-slate-900 mt-0.5">
                  {agentName}
                </p>
                {/* Notice: Agent mobile number is intentionally omitted per PRD privacy rules */}
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Token Validity Window (IST)
                </p>
                <div className="flex items-center gap-3 mt-1">
                  <div className="bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
                    <p className="text-[10px] uppercase text-slate-500 font-semibold">Start Date</p>
                    <p className="font-semibold text-slate-900 text-xs">
                      {formatReadableISTDate(token.start_date)}
                    </p>
                  </div>
                  <span className="text-slate-400 text-xs font-bold">→</span>
                  <div className="bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
                    <p className="text-[10px] uppercase text-slate-500 font-semibold">End Date</p>
                    <p className="font-semibold text-slate-900 text-xs">
                      {formatReadableISTDate(token.end_date)}
                    </p>
                  </div>
                </div>
              </div>

              {'renewal_previous_token' in token && token.renewal_previous_token && (
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Prior Token Renewal Link
                  </p>
                  <p className="text-xs font-mono font-medium text-amber-800 bg-amber-50 inline-block px-2 py-1 rounded-md mt-1 border border-amber-200">
                    Preceded by {token.renewal_previous_token.token_number}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Description & Remarks */}
          {(token.token_description || token.notes_and_remarks) && (
            <div className="border-t border-slate-200 pt-5 mb-8 space-y-4">
              {token.token_description && (
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    Token Description
                  </p>
                  <p className="text-sm text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-100 whitespace-pre-line leading-relaxed">
                    {token.token_description}
                  </p>
                </div>
              )}

              {token.notes_and_remarks && (
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    Notes & Remarks
                  </p>
                  <p className="text-sm text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-100 whitespace-pre-line leading-relaxed">
                    {token.notes_and_remarks}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Attachments Summary */}
          {attachments.length > 0 && (
            <div className="border-t border-slate-200 pt-5 mb-8">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Registered Public Attachments ({attachments.length})
              </p>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {attachments.map(att => (
                  <li
                    key={att.id}
                    className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200"
                  >
                    <span className="font-medium text-slate-800 truncate mr-2">
                      📄 {att.file_name}
                    </span>
                    <span className="text-[11px] text-slate-500 uppercase font-mono shrink-0">
                      {(att.file_size / 1024).toFixed(0)} KB
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* QR Code and Official Verification Section */}
          <div className="border-t-2 border-slate-200 pt-6 mt-8 flex items-center justify-between gap-6">
            <div className="flex-1 space-y-2 text-xs text-slate-500">
              <p className="font-semibold text-slate-800">
                Official Digital Verification & Tracking
              </p>
              <p className="leading-relaxed">
                This document certifies the issuance and parameters of the designated service token under Royal Services administration. Authenticity can be independently verified in real time by scanning the secure QR code or visiting the tracking URL.
              </p>
              <p className="font-mono text-[11px] text-slate-600 truncate">
                {trackingUrl}
              </p>
            </div>

            {qrDataUrl && (
              <div className="text-center shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={qrDataUrl}
                  alt={`QR Verification for ${token.token_number}`}
                  className="w-28 h-28 mx-auto border border-slate-200 rounded-lg p-1"
                />
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mt-1 block">
                  Scan to Verify
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
