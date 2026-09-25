import React from 'react';
import Link from 'next/link';
import { getPublicToken, syncStoreFromCloud } from '@/lib/store';
import { PublicHeader, PublicFooter } from '@/components/layout/PublicHeader';
import { TokenStatusBadge } from '@/components/tokens/TokenStatusBadge';
import { formatReadableISTDate } from '@/lib/ist';
import QRCode from 'qrcode';
import {
  FileText,
  Image as ImageIcon,
  Building2,
  ArrowLeft,

  Search,
  ExternalLink,
  ShieldCheck,
  FileSpreadsheet,
} from 'lucide-react';

interface Props {
  params: Promise<{ token: string }>;
}

export default async function PublicTokenTrackPage({ params }: Props) {
  await syncStoreFromCloud();
  const { token: rawToken } = await params;
  const tokenNumber = decodeURIComponent(rawToken);

  const token = getPublicToken(tokenNumber);

  if (!token) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 font-sans">
        <PublicHeader />
        <main className="flex-1 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center space-y-4 shadow-2xl">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center mx-auto">
              <Search className="w-6 h-6" />
            </div>
            <h1 className="text-xl font-bold font-serif text-white">
              Token Not Found
            </h1>
            <p className="text-xs text-slate-400 leading-relaxed">
              The service token <strong className="font-mono text-slate-300">&quot;{tokenNumber}&quot;</strong> could not be found or is not available for public tracking.
            </p>
            <div className="pt-2">
              <Link
                href="/"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Return to Token Lookup</span>
              </Link>
            </div>
          </div>
        </main>
        <PublicFooter />
      </div>
    );
  }

  // Generate QR Code server-side as data URL
  let qrCodeDataUrl = '';
  try {
    qrCodeDataUrl = await QRCode.toDataURL(token.tracking_url, {
      width: 240,
      margin: 1,
      color: { dark: '#0A192F', light: '#FFFFFF' },
    });
  } catch (e) {
    console.error('Failed to generate QR for public page', e);
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 font-sans selection:bg-amber-500 selection:text-slate-950">
      <PublicHeader />

      <main className="flex-1 py-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Back Navigation Bar */}
          <div className="flex items-center justify-between">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-xs font-medium text-slate-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Lookup</span>
            </Link>

            <span className="text-xs text-slate-400">
              India Standard Time (IST) Synchronized
            </span>
          </div>

          {/* Main Card */}
          <div className="bg-slate-900/90 rounded-3xl border border-slate-800 shadow-2xl overflow-hidden backdrop-blur-md">
            {/* Brand Logo & Top Banner */}
            <div className="bg-gradient-to-r from-[#2D3774]/30 via-[#2D3774]/15 to-transparent p-6 sm:p-8 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
              <div className="flex flex-col sm:flex-row sm:items-center gap-5">
                <div className="bg-white p-3 rounded-2xl shadow-md border border-white/20 shrink-0 self-start sm:self-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/logo.png"
                    alt="Royal Services - A Step Ahead"
                    className="h-14 w-auto object-contain block"
                  />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold uppercase tracking-widest text-blue-300">
                      Official Service Token
                    </span>
                    <TokenStatusBadge status={token.computed_status} size="sm" />
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-mono font-bold text-white tracking-tight">
                    {token.token_number}
                  </h1>
                  <p className="text-xs text-slate-300">
                    Client / Associate: <strong className="text-white">{token.associate_name}</strong>
                  </p>
                </div>
              </div>

              {/* QR Code Container */}
              {qrCodeDataUrl && (
                <div className="sm:self-center shrink-0 bg-white p-2 rounded-2xl border border-slate-700 shadow-md">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={qrCodeDataUrl}
                    alt={`Verification QR code for ${token.token_number}`}
                    className="w-24 h-24 rounded-xl"
                  />
                  <span className="text-[9px] uppercase font-bold text-slate-500 tracking-wider block text-center mt-1">
                    Scan to verify
                  </span>
                </div>
              )}
            </div>

            {/* Content Body */}
            <div className="p-6 sm:p-8 space-y-8">
              {/* Key Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                <div className="space-y-5">
                  <div>
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                      Assigned Property
                    </span>
                    <div className="flex items-start gap-2 mt-1">
                      <Building2 className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      <p className="font-semibold text-white">
                        {token.property_name}
                      </p>
                    </div>
                  </div>

                  <div>
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                      Authorized Agent
                    </span>
                    <p className="font-semibold text-white mt-1">
                      {token.agent_name}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Licensed Representative, Royal Services
                    </p>
                    {/* Notice: Agent mobile number is strictly omitted per PRD privacy specification */}
                  </div>
                </div>

                <div className="space-y-5">
                  <div>
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                      Validity Period (IST)
                    </span>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-700 text-xs">
                        <span className="text-[10px] text-slate-400 block uppercase">Start</span>
                        <span className="font-mono font-semibold text-slate-200">
                          {formatReadableISTDate(token.start_date)}
                        </span>
                      </div>
                      <span className="text-slate-500 font-bold">→</span>
                      <div className="bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-700 text-xs">
                        <span className="text-[10px] text-slate-400 block uppercase">End</span>
                        <span className="font-mono font-semibold text-slate-200">
                          {formatReadableISTDate(token.end_date)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Renewal Link */}
                  {token.renewal_chain?.previous_token && (
                    <div>
                      <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                        Renewal Chain
                      </span>
                      <Link
                        href={`/track/${encodeURIComponent(token.renewal_chain.previous_token.token_number)}`}
                        className="inline-flex items-center gap-1.5 text-xs text-amber-400 hover:text-amber-300 font-mono bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-lg mt-1"
                      >
                        <span>Preceded by {token.renewal_chain.previous_token.token_number}</span>
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    </div>
                  )}

                  {token.renewal_chain?.replacement_token && (
                    <div>
                      <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                        Renewal Chain
                      </span>
                      <Link
                        href={`/track/${encodeURIComponent(token.renewal_chain.replacement_token.token_number)}`}
                        className="inline-flex items-center gap-1.5 text-xs text-emerald-400 hover:text-emerald-300 font-mono bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-lg mt-1"
                      >
                        <span>Succeeded by {token.renewal_chain.replacement_token.token_number}</span>
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    </div>
                  )}
                </div>
              </div>

              {/* Description & Remarks */}
              {(token.token_description || token.notes_and_remarks) && (
                <div className="border-t border-slate-800 pt-6 space-y-4">
                  {token.token_description && (
                    <div>
                      <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                        Token Description
                      </span>
                      <p className="text-xs sm:text-sm text-slate-300 bg-slate-800/50 p-4 rounded-2xl border border-slate-800 leading-relaxed whitespace-pre-line">
                        {token.token_description}
                      </p>
                    </div>
                  )}

                  {token.notes_and_remarks && (
                    <div>
                      <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                        Public Remarks
                      </span>
                      <p className="text-xs sm:text-sm text-slate-300 bg-slate-800/50 p-4 rounded-2xl border border-slate-800 leading-relaxed whitespace-pre-line">
                        {token.notes_and_remarks}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Public Attachments */}
              {token.attachments && token.attachments.length > 0 && (
                <div className="border-t border-slate-800 pt-6">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-3">
                    Verified Documents & Attachments ({token.attachments.length})
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {token.attachments.map(att => (
                      <a
                        key={att.id}
                        href={att.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-800/70 hover:bg-slate-800 border border-slate-700/70 hover:border-amber-500/50 transition-all group"
                      >
                        <div className="flex items-center space-x-3 truncate mr-3">
                          <div className="p-2 rounded-xl bg-slate-900 text-amber-400 shrink-0">
                            {att.file_type.includes('pdf') ? (
                              <FileText className="w-5 h-5" />
                            ) : (
                              <ImageIcon className="w-5 h-5" />
                            )}
                          </div>
                          <div className="truncate">
                            <p className="text-xs font-semibold text-white group-hover:text-amber-400 transition-colors truncate">
                              {att.file_name}
                            </p>
                            <span className="text-[10px] text-slate-400 font-mono">
                              {(att.file_size / 1024).toFixed(0)} KB
                            </span>
                          </div>
                        </div>
                        <ExternalLink className="w-4 h-4 text-slate-500 group-hover:text-white shrink-0" />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Official Seal Footer */}
              <div className="border-t border-slate-800 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Authenticated by Royal Services Administrative Registry</span>
                </div>
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="w-4 h-4 text-amber-500" />
                  <span>Real-Time Public Record</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
