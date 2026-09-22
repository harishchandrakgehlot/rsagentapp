'use client';

import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { X, Download, Copy, Check, ExternalLink, QrCode } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  tokenNumber: string;
  trackingUrl: string;
}

export function TokenQRModal({ isOpen, onClose, tokenNumber, trackingUrl }: Props) {
  const [dataUrl, setDataUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen && trackingUrl) {
      QRCode.toDataURL(trackingUrl, {
        width: 320,
        margin: 2,
        color: {
          dark: '#0A192F',
          light: '#FFFFFF',
        },
      })
        .then(url => setDataUrl(url))
        .catch(err => console.error('Error generating QR', err));
    }
  }, [isOpen, trackingUrl]);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(trackingUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!dataUrl) return;
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `QRCode_${tokenNumber}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-sm w-full p-6 text-center animate-in fade-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-qr-title"
      >
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center space-x-2 text-slate-800">
            <QrCode className="w-5 h-5 text-amber-600" />
            <h3 id="modal-qr-title" className="font-semibold text-lg text-slate-900">
              Tracking QR Code
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="py-4">
          <p className="text-xs text-slate-500 mb-3">
            Token <strong className="text-slate-800 font-semibold">{tokenNumber}</strong>
          </p>

          <div className="p-3 bg-slate-50 rounded-xl inline-block border border-slate-100 shadow-inner">
            {dataUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={dataUrl}
                alt={`QR code for token ${tokenNumber}`}
                className="w-56 h-56 mx-auto rounded-lg"
              />
            ) : (
              <div className="w-56 h-56 flex items-center justify-center text-slate-400">
                Generating QR...
              </div>
            )}
          </div>

          <p className="text-xs text-slate-500 mt-3 px-2">
            Scan with any camera or mobile device to open the official public verification page.
          </p>
        </div>

        <div className="pt-2 space-y-2">
          <div className="flex items-center justify-between bg-slate-100 px-3 py-2 rounded-lg text-xs text-slate-600 font-mono truncate">
            <span className="truncate mr-2">{trackingUrl}</span>
            <button
              onClick={handleCopy}
              className="text-amber-700 hover:text-amber-800 font-medium shrink-0 flex items-center gap-1"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2">
            <button
              type="button"
              onClick={handleDownload}
              className="flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-medium rounded-lg transition-colors"
            >
              <Download className="w-4 h-4" />
              Download PNG
            </button>
            <a
              href={trackingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-1.5 px-3 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-medium rounded-lg transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              Open Page
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
