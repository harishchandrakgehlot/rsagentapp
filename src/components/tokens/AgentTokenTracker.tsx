'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import QRCode from 'qrcode';
import { Token } from '@/types';
import { TokenStatusBadge } from '@/components/tokens/TokenStatusBadge';
import { formatReadableISTDate, getDaysUntilExpiry } from '@/lib/ist';
import {
  Phone,
  KeyRound,
  ShieldCheck,
  Search,
  Building2,
  ArrowUpDown,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
  ExternalLink,
  Share2,
  FileText,
  Image as ImageIcon,
  RefreshCw,
  LogOut,
  AlertCircle,
  CheckCircle2,
  User,
  QrCode,
  MapPin,
  Calendar,
  X,
} from 'lucide-react';

const STORAGE_KEY = 'rs_agent_auth_session';

type SortOption =
  | 'expiry_asc'
  | 'expiry_desc'
  | 'client_asc'
  | 'client_desc'
  | 'token_desc'
  | 'token_asc';

type FilterOption = 'all' | 'active' | 'expiring_soon' | 'expired';

interface Props {
  onStepChange?: (step: 'mobile' | 'otp' | 'dashboard') => void;
}

export function AgentTokenTracker({ onStepChange }: Props) {
  // Authentication states
  const [step, setStep] = useState<'mobile' | 'otp' | 'dashboard'>('mobile');
  const [mobileInput, setMobileInput] = useState('');
  const [otpInput, setOtpInput] = useState('');
  const [sessionToken, setSessionToken] = useState('');
  const [authToken, setAuthToken] = useState('');
  const [maskedPhone, setMaskedPhone] = useState('');
  const [agentName, setAgentName] = useState('Agent');
  const [devCode, setDevCode] = useState<string | null>(null);

  // Loading & error states
  const [loading, setLoading] = useState(false);
  const [initialChecking, setInitialChecking] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Data states
  const [tokens, setTokens] = useState<Token[]>([]);
  const [expandedTokenIds, setExpandedTokenIds] = useState<Set<string>>(new Set());
  const [qrCodeUrls, setQrCodeUrls] = useState<Record<string, string>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Filter & Sort states
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState<SortOption>('expiry_asc');
  const [filterOption, setFilterOption] = useState<FilterOption>('all');

  // Notify parent on step change
  const updateStep = (newStep: 'mobile' | 'otp' | 'dashboard') => {
    setStep(newStep);
    onStepChange?.(newStep);
  };

  // Fetch tokens using verified auth token
  const fetchTokensWithAuth = async (tokenStr: string, isMounted: () => boolean = () => true) => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const res = await fetch('/api/public/track/tokens', {
        headers: { Authorization: `Bearer ${tokenStr}` },
      });
      const data = await res.json();
      if (!isMounted()) return;

      if (res.ok && data.success) {
        setTokens(data.tokens || []);
        if (data.agentName) setAgentName(data.agentName);
        if (data.phone) {
          const ph = data.phone;
          setMaskedPhone(`+91 ${ph.slice(-10, -4).replace(/\d/g, '•')} ${ph.slice(-4)}`);
        }
        updateStep('dashboard');

        // Automatically expand the first token if there's only 1 or 2
        if (data.tokens?.length > 0 && data.tokens.length <= 2) {
          setExpandedTokenIds(new Set([data.tokens[0].id]));
        }
      } else {
        // Token expired or invalid
        localStorage.removeItem(STORAGE_KEY);
        setAuthToken('');
        updateStep('mobile');
      }
    } catch {
      if (!isMounted()) return;
      setErrorMessage('Unable to connect to the registry. Please check your internet connection.');
      updateStep('mobile');
    } finally {
      if (isMounted()) {
        setLoading(false);
        setInitialChecking(false);
      }
    }
  };

  // Check saved session on mount
  useEffect(() => {
    let mounted = true;
    (async () => {
      const savedToken = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
      if (savedToken) {
        setAuthToken(savedToken);
        await fetchTokensWithAuth(savedToken, () => mounted);
      } else {
        setInitialChecking(false);
      }
    })();

    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Cooldown timer for OTP resend
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown(prev => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // Step 1: Send OTP to WhatsApp
  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const clean = mobileInput.replace(/\D/g, '');
    if (clean.length < 10) {
      setErrorMessage('Please enter a valid 10-digit mobile number.');
      return;
    }

    setLoading(true);
    setErrorMessage(null);
    try {
      const res = await fetch('/api/public/track/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobile: clean }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSessionToken(data.sessionToken);
        setMaskedPhone(data.maskedPhone || `+91 ${clean}`);
        if (data.agentName) setAgentName(data.agentName);
        if (data.devPreviewOtp) setDevCode(data.devPreviewOtp);
        setResendCooldown(60);
        updateStep('otp');
      } else {
        setErrorMessage(data.error || 'Failed to dispatch verification code. Please check your number.');
      }
    } catch {
      setErrorMessage('Network error communicating with WhatsApp registry server.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanOtp = otpInput.trim();
    if (cleanOtp.length !== 6) {
      setErrorMessage('Please enter the 6-digit code received on WhatsApp.');
      return;
    }

    setLoading(true);
    setErrorMessage(null);
    try {
      const res = await fetch('/api/public/track/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionToken, otp: cleanOtp }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setAuthToken(data.authToken);
        setTokens(data.tokens || []);
        if (data.agentName) setAgentName(data.agentName);
        localStorage.setItem(STORAGE_KEY, data.authToken);
        updateStep('dashboard');

        if (data.tokens?.length > 0 && data.tokens.length <= 2) {
          setExpandedTokenIds(new Set([data.tokens[0].id]));
        }
      } else {
        setErrorMessage(data.error || 'Invalid OTP code. Please verify the code received on WhatsApp.');
      }
    } catch {
      setErrorMessage('Network error validating verification code.');
    } finally {
      setLoading(false);
    }
  };

  // Logout / Switch Phone
  const handleLogout = () => {
    localStorage.removeItem(STORAGE_KEY);
    setAuthToken('');
    setSessionToken('');
    setTokens([]);
    setOtpInput('');
    setDevCode(null);
    setExpandedTokenIds(new Set());
    updateStep('mobile');
  };

  // Toggle Accordion Item
  const toggleTokenExpand = async (token: Token) => {
    const id = token.id;
    setExpandedTokenIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
        // Generate QR code on demand
        if (!qrCodeUrls[id]) {
          const publicUrl = `${window.location.origin}/track/${encodeURIComponent(token.token_number)}`;
          QRCode.toDataURL(publicUrl, { width: 180, margin: 1, color: { dark: '#0b1426', light: '#ffffff' } })
            .then(url => setQrCodeUrls(old => ({ ...old, [id]: url })))
            .catch(() => {});
        }
      }
      return next;
    });
  };

  // Copy tracking link helper
  const handleCopyLink = (tokenNumber: string, id: string) => {
    const url = `${window.location.origin}/track/${encodeURIComponent(tokenNumber)}`;
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Token Metrics
  const metrics = useMemo(() => {
    const total = tokens.length;
    let active = 0;
    let expiringSoon = 0;
    let expired = 0;

    for (const t of tokens) {
      const st = t.computed_status || 'active';
      const days = getDaysUntilExpiry(t.end_date);
      if (st === 'expired' || days < 0) {
        expired++;
      } else if (st === 'active') {
        active++;
        if (days >= 0 && days <= 30) {
          expiringSoon++;
        }
      }
    }
    return { total, active, expiringSoon, expired };
  }, [tokens]);

  // Filtered & Sorted Tokens
  const filteredAndSortedTokens = useMemo(() => {
    let result = [...tokens];

    // Status filter
    if (filterOption === 'active') {
      result = result.filter(t => (t.computed_status || 'active') === 'active');
    } else if (filterOption === 'expiring_soon') {
      result = result.filter(t => {
        const days = getDaysUntilExpiry(t.end_date);
        return days >= 0 && days <= 30 && (t.computed_status || 'active') === 'active';
      });
    } else if (filterOption === 'expired') {
      result = result.filter(t => (t.computed_status || 'active') === 'expired');
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        t =>
          t.token_number.toLowerCase().includes(q) ||
          t.associate_name.toLowerCase().includes(q) ||
          (t.property?.name || '').toLowerCase().includes(q) ||
          (t.property?.city || '').toLowerCase().includes(q)
      );
    }

    // Sort option
    result.sort((a, b) => {
      switch (sortOption) {
        case 'expiry_asc':
          return new Date(a.end_date).getTime() - new Date(b.end_date).getTime();
        case 'expiry_desc':
          return new Date(b.end_date).getTime() - new Date(a.end_date).getTime();
        case 'client_asc':
          return a.associate_name.localeCompare(b.associate_name);
        case 'client_desc':
          return b.associate_name.localeCompare(a.associate_name);
        case 'token_desc':
          return b.token_number.localeCompare(a.token_number);
        case 'token_asc':
          return a.token_number.localeCompare(b.token_number);
        default:
          return 0;
      }
    });

    return result;
  }, [tokens, filterOption, searchQuery, sortOption]);

  // Initial checking spinner
  if (initialChecking) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-3">
        <RefreshCw className="w-8 h-8 text-blue-400 animate-spin" />
        <p className="text-xs text-slate-400 tracking-wide font-medium">Verifying agent session...</p>
      </div>
    );
  }

  // -------------------------------------------------------------
  // STEP 1: MOBILE NUMBER INPUT
  // -------------------------------------------------------------
  if (step === 'mobile') {
    return (
      <div className="bg-slate-900/90 backdrop-blur-xl p-6 sm:p-8 rounded-3xl border border-slate-800 shadow-2xl max-w-lg mx-auto w-full transition-all">
        <div className="text-center space-y-2 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto shadow-inner">
            <Phone className="w-6 h-6" />
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Agent WhatsApp Login
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 max-w-sm mx-auto leading-relaxed">
            Enter your mobile number to receive a secure 6-digit OTP directly on WhatsApp to track all your assigned tokens.
          </p>
        </div>

        <form onSubmit={handleSendOtp} className="space-y-4">
          <div>
            <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-2">
              Registered WhatsApp Mobile
            </label>
            <div className="relative flex items-center">
              <span className="absolute left-4 text-xs font-bold text-slate-400 select-none">
                🇮🇳 +91
              </span>
              <input
                type="tel"
                value={mobileInput}
                onChange={e => {
                  setMobileInput(e.target.value);
                  if (errorMessage) setErrorMessage(null);
                }}
                maxLength={13}
                placeholder="98191 43222"
                className="w-full pl-16 pr-4 py-3.5 text-sm sm:text-base font-mono rounded-2xl bg-slate-950/80 border border-slate-700/80 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 text-white placeholder:text-slate-500 shadow-inner"
                autoFocus
              />
            </div>
          </div>

          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !mobileInput.trim()}
            className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm sm:text-base shadow-lg shadow-emerald-950/50 hover:shadow-emerald-900/60 transition-all disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Sending WhatsApp OTP...</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-5 h-5" />
                <span>Send WhatsApp OTP</span>
              </>
            )}
          </button>
        </form>

        <div className="mt-6 pt-5 border-t border-slate-800 text-center">
          <p className="text-[11px] text-slate-500 flex items-center justify-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Encrypted WhatsApp verification • Only authorized numbers can view records</span>
          </p>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // STEP 2: OTP VERIFICATION
  // -------------------------------------------------------------
  if (step === 'otp') {
    return (
      <div className="bg-slate-900/90 backdrop-blur-xl p-6 sm:p-8 rounded-3xl border border-slate-800 shadow-2xl max-w-lg mx-auto w-full transition-all">
        <div className="text-center space-y-2 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto shadow-inner">
            <KeyRound className="w-6 h-6" />
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Enter WhatsApp Verification Code
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 max-w-sm mx-auto leading-relaxed">
            We sent a 6-digit code to your WhatsApp at{' '}
            <strong className="text-white font-mono">{maskedPhone}</strong>.
          </p>
        </div>

        {devCode && (
          <div className="mb-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-center justify-between">
            <span>Dev Preview Code: <strong className="font-mono text-sm tracking-wider text-white">{devCode}</strong></span>
            <button
              type="button"
              onClick={() => setOtpInput(devCode)}
              className="text-[11px] bg-amber-500/20 px-2 py-0.5 rounded text-amber-200 hover:text-white"
            >
              Fill Code
            </button>
          </div>
        )}

        <form onSubmit={handleVerifyOtp} className="space-y-4">
          <div>
            <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-2 text-center">
              6-Digit OTP
            </label>
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={otpInput}
              onChange={e => {
                setOtpInput(e.target.value.replace(/\D/g, ''));
                if (errorMessage) setErrorMessage(null);
              }}
              placeholder="• • • • • •"
              className="w-full text-center py-3.5 text-2xl sm:text-3xl font-mono tracking-[0.4em] rounded-2xl bg-slate-950/80 border border-slate-700/80 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 text-white placeholder:text-slate-600 shadow-inner"
              autoFocus
            />
          </div>

          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || otpInput.trim().length !== 6}
            className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm sm:text-base shadow-lg shadow-emerald-950/50 hover:shadow-emerald-900/60 transition-all disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Verifying...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-5 h-5" />
                <span>Verify & View My Tokens</span>
              </>
            )}
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between text-xs">
          <button
            type="button"
            onClick={handleLogout}
            className="text-slate-400 hover:text-white transition-colors"
          >
            ← Change Number
          </button>

          {resendCooldown > 0 ? (
            <span className="text-slate-400">
              Resend in <strong className="font-mono text-slate-300">{resendCooldown}s</strong>
            </span>
          ) : (
            <button
              type="button"
              onClick={() => handleSendOtp()}
              className="text-emerald-400 hover:text-emerald-300 font-semibold transition-colors"
            >
              Resend OTP on WhatsApp
            </button>
          )}
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // STEP 3: AUTHENTICATED AGENT MULTI-TOKEN DASHBOARD
  // -------------------------------------------------------------
  return (
    <div className="space-y-6 w-full max-w-5xl mx-auto">
      {/* Sleek Agent Executive Header */}
      <div className="bg-slate-900/90 backdrop-blur-xl rounded-3xl border border-slate-800 shadow-2xl p-6 sm:p-7">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5 pb-6 border-b border-slate-800/80">
          <div className="flex items-center gap-4">
            <div className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-emerald-600 via-teal-600 to-cyan-500 text-white font-bold text-xl flex items-center justify-center shadow-lg shadow-emerald-900/30 shrink-0">
              {agentName.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                  {agentName}
                </h1>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>WhatsApp Verified</span>
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1 flex items-center gap-2 font-mono">
                <span>{maskedPhone}</span>
                <span>•</span>
                <span className="text-slate-400">IST Node Synchronized</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 self-start md:self-auto">
            <button
              type="button"
              onClick={() => fetchTokensWithAuth(authToken)}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition-all cursor-pointer"
              title="Refresh Token List"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>

            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800/80 hover:bg-rose-950/40 text-slate-300 hover:text-rose-300 border border-slate-700 hover:border-rose-800/50 text-xs font-semibold transition-all cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Switch Phone</span>
            </button>
          </div>
        </div>

        {/* Integrated KPI Summary Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-6">
          <div className="bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800/80">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
              Total Tokens
            </span>
            <span className="text-2xl font-black font-mono text-white mt-1 block">
              {metrics.total}
            </span>
          </div>

          <div className="bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800/80">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 block">
              Active Tokens
            </span>
            <span className="text-2xl font-black font-mono text-emerald-400 mt-1 block">
              {metrics.active}
            </span>
          </div>

          <div className="bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800/80">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400 block">
              Expiring &lt; 30 Days
            </span>
            <span className="text-2xl font-black font-mono text-amber-400 mt-1 block">
              {metrics.expiringSoon}
            </span>
          </div>

          <div className="bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800/80">
            <span className="text-[11px] font-bold uppercase tracking-wider text-rose-400 block">
              Expired
            </span>
            <span className="text-2xl font-black font-mono text-rose-400 mt-1 block">
              {metrics.expired}
            </span>
          </div>
        </div>
      </div>

      {/* Streamlined Filter & Sort Toolbar */}
      <div className="bg-slate-900/90 backdrop-blur-xl p-4 sm:p-5 rounded-2xl border border-slate-800 shadow-xl space-y-3.5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          {/* Status Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {(
              [
                { key: 'all', label: `All (${metrics.total})` },
                { key: 'active', label: `Active (${metrics.active})` },
                { key: 'expiring_soon', label: `Expiring Soon (${metrics.expiringSoon})` },
                { key: 'expired', label: `Expired (${metrics.expired})` },
              ] as const
            ).map(tab => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setFilterOption(tab.key)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  filterOption === tab.key
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-900/40 border border-blue-500'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-2 self-start md:self-auto">
            <ArrowUpDown className="w-3.5 h-3.5 text-blue-400 shrink-0" />
            <span className="text-xs text-slate-400 whitespace-nowrap font-medium">
              Sort by:
            </span>
            <select
              value={sortOption}
              onChange={e => setSortOption(e.target.value as SortOption)}
              className="bg-slate-950 text-slate-200 border border-slate-700 text-xs font-semibold rounded-xl px-3 py-1.5 focus:outline-none focus:border-blue-400 cursor-pointer shadow-inner"
            >
              <option value="expiry_asc">⏳ Expiry Date (Soonest first)</option>
              <option value="expiry_desc">⏳ Expiry Date (Furthest first)</option>
              <option value="client_asc">👤 Client Name (A → Z)</option>
              <option value="client_desc">👤 Client Name (Z → A)</option>
              <option value="token_desc">🏷️ Token # (Newest first)</option>
              <option value="token_asc">🏷️ Token # (Oldest first)</option>
            </select>
          </div>
        </div>

        {/* Real-time search bar */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search by Token Number, Client Name, Property or City..."
            className="w-full pl-10 pr-9 py-2 text-xs sm:text-sm rounded-xl bg-slate-950 border border-slate-800 focus:border-blue-500 focus:outline-none text-white placeholder:text-slate-500 shadow-inner"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-300"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Accordion Token List */}
      {filteredAndSortedTokens.length === 0 ? (
        <div className="bg-slate-900/60 rounded-3xl border border-slate-800 p-12 text-center space-y-3">
          <Building2 className="w-9 h-9 text-slate-600 mx-auto" />
          <h3 className="text-base font-bold text-white">No Tokens Match Your Filter</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            {searchQuery
              ? `No tokens found matching "${searchQuery}". Try a different keyword.`
              : 'You have no tokens under this status filter.'}
          </p>
          {(searchQuery || filterOption !== 'all') && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setFilterOption('all');
              }}
              className="text-xs text-blue-400 hover:text-blue-300 font-semibold underline pt-1 cursor-pointer"
            >
              Reset Search &amp; Filters
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredAndSortedTokens.map(token => {
            const isExpanded = expandedTokenIds.has(token.id);
            const daysLeft = getDaysUntilExpiry(token.end_date);
            const qrUrl = qrCodeUrls[token.id];

            return (
              <div
                key={token.id}
                className="bg-slate-900/90 backdrop-blur-xl rounded-2xl border border-slate-800 shadow-lg overflow-hidden transition-all duration-200 hover:border-slate-700"
              >
                {/* Accordion Anchor Header */}
                <button
                  type="button"
                  onClick={() => toggleTokenExpand(token)}
                  className="w-full p-4 sm:p-5 flex items-center justify-between text-left cursor-pointer transition-colors hover:bg-slate-800/40"
                  aria-expanded={isExpanded}
                >
                  <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0 pr-4">
                    {/* Token Number Badge */}
                    <span className="font-mono font-bold text-sm sm:text-base text-cyan-300 bg-slate-950 px-3 py-1.5 rounded-xl border border-cyan-900/50 shadow-inner shrink-0">
                      {token.token_number}
                    </span>

                    {/* Client Name & Property Snippet */}
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="font-bold text-white text-sm sm:text-base truncate">
                          {token.associate_name}
                        </h4>
                        <TokenStatusBadge status={token.computed_status} size="sm" />
                      </div>
                      <p className="text-xs text-slate-400 truncate mt-0.5 flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{token.property?.name || 'Property record'}</span>
                        {token.property?.city && (
                          <span className="text-slate-400">• {token.property.city}</span>
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Right Side: Expiry Summary & Expand Anchor Chevron */}
                  <div className="flex items-center gap-3 sm:gap-5 shrink-0">
                    <div className="text-right hidden sm:block">
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold">
                        Expires
                      </span>
                      <span
                        className={`text-xs font-mono font-bold ${
                          daysLeft < 0
                            ? 'text-rose-400'
                            : daysLeft <= 15
                            ? 'text-amber-400'
                            : 'text-slate-300'
                        }`}
                      >
                        {formatReadableISTDate(token.end_date)}
                      </span>
                      <span className="text-[10px] text-slate-400 block font-medium">
                        {daysLeft < 0
                          ? `Expired ${Math.abs(daysLeft)}d ago`
                          : daysLeft === 0
                          ? 'Expires Today'
                          : `In ${daysLeft} days`}
                      </span>
                    </div>

                    <div className="p-2 rounded-xl bg-slate-800 text-slate-300 border border-slate-700 group-hover:border-slate-600 transition-colors">
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-cyan-400" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </div>
                  </div>
                </button>

                {/* Expanded Full Details */}
                {isExpanded && (
                  <div className="border-t border-slate-800/80 p-5 sm:p-6 bg-slate-950/70 space-y-6 text-xs sm:text-sm">
                    {/* Grid of full details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      {/* Left Column: Property & Address */}
                      <div className="space-y-4">
                        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2">
                          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-amber-400" />
                            <span>Assigned Property &amp; Address</span>
                          </span>
                          <div className="text-white font-bold text-sm">
                            {token.property?.name || 'Property'}
                          </div>
                          {(token.property?.plot_house_no ||
                            token.property?.address_line_1 ||
                            token.property?.landmark ||
                            token.property?.city) && (
                            <p className="text-xs text-slate-300 leading-relaxed">
                              {[
                                token.property.plot_house_no,
                                token.property.address_line_1,
                                token.property.address_line_2,
                                token.property.landmark,
                                token.property.city,
                                token.property.state,
                                token.property.postal_code,
                              ]
                                .filter(Boolean)
                                .join(', ')}
                            </p>
                          )}
                        </div>

                        {/* Validity Dates in IST */}
                        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2.5">
                          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-blue-400" />
                            <span>Validity Period (IST)</span>
                          </span>
                          <div className="flex items-center gap-2.5">
                            <div className="bg-slate-950 px-3 py-2 rounded-xl border border-slate-800 flex-1">
                              <span className="text-[10px] text-slate-400 block uppercase font-bold">Start Date</span>
                              <span className="font-mono font-bold text-slate-200 text-xs">
                                {formatReadableISTDate(token.start_date)}
                              </span>
                            </div>
                            <span className="text-slate-600 font-bold">→</span>
                            <div className="bg-slate-950 px-3 py-2 rounded-xl border border-slate-800 flex-1">
                              <span className="text-[10px] text-slate-400 block uppercase font-bold">End Date</span>
                              <span className="font-mono font-bold text-slate-200 text-xs">
                                {formatReadableISTDate(token.end_date)}
                              </span>
                            </div>
                          </div>
                          <p className="text-[11px] text-slate-400">
                            {daysLeft < 0
                              ? `Token expired ${Math.abs(daysLeft)} calendar day(s) ago.`
                              : daysLeft === 0
                              ? 'Token is expiring today at midnight IST.'
                              : `${daysLeft} calendar day(s) remaining until expiry.`}
                          </p>
                        </div>
                      </div>

                      {/* Right Column: Agent & QR Code */}
                      <div className="space-y-4">
                        {/* Authorized Representative & Recipients */}
                        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2">
                          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                            <User className="w-3.5 h-3.5 text-cyan-400" />
                            <span>Authorized Agent &amp; Notifications</span>
                          </span>
                          <div className="flex items-center gap-2 text-white font-semibold">
                            <span>{token.agent?.name || 'Primary Agent'}</span>
                            {token.agent_mobile_number && (
                              <span className="text-xs font-mono text-slate-400">
                                ({token.agent_mobile_number})
                              </span>
                            )}
                          </div>

                          {/* Multiple Assigned Recipients */}
                          {Array.isArray(token.assigned_recipients) &&
                            token.assigned_recipients.length > 0 && (
                              <div className="mt-2 pt-2 border-t border-slate-800 space-y-1">
                                <span className="text-[10px] uppercase font-bold text-slate-400">
                                  WhatsApp Recipients:
                                </span>
                                <div className="flex flex-wrap gap-1.5 pt-0.5">
                                  {token.assigned_recipients.map((rec, idx) => (
                                    <span
                                      key={idx}
                                      className="inline-flex items-center gap-1 text-[11px] font-mono bg-slate-950 px-2 py-1 rounded-md border border-slate-800 text-slate-300"
                                    >
                                      <span>{rec.name}:</span>
                                      <span className="text-emerald-400">{rec.mobile}</span>
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                        </div>

                        {/* QR Code and Quick Tracking Link */}
                        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 flex items-center gap-4">
                          {qrUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={qrUrl}
                              alt={`QR code for ${token.token_number}`}
                              className="w-20 h-20 bg-white p-1 rounded-xl shrink-0"
                            />
                          ) : (
                            <div className="w-20 h-20 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center shrink-0">
                              <QrCode className="w-8 h-8 text-slate-600 animate-pulse" />
                            </div>
                          )}

                          <div className="space-y-1.5 flex-1 min-w-0">
                            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                              Public Certificate Link
                            </span>
                            <p className="text-xs font-mono text-cyan-300 truncate">
                              /track/{token.token_number}
                            </p>
                            <div className="flex flex-wrap items-center gap-2 pt-1">
                              <button
                                type="button"
                                onClick={() => handleCopyLink(token.token_number, token.id)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors cursor-pointer"
                              >
                                {copiedId === token.id ? (
                                  <>
                                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                                    <span className="text-emerald-400">Copied!</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy className="w-3.5 h-3.5" />
                                    <span>Copy Link</span>
                                  </>
                                )}
                              </button>

                              <Link
                                href={`/track/${encodeURIComponent(token.token_number)}`}
                                target="_blank"
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-600/30 hover:bg-blue-600/50 text-blue-300 hover:text-white text-xs font-semibold transition-colors"
                              >
                                <span>Certificate</span>
                                <ExternalLink className="w-3 h-3" />
                              </Link>

                              <a
                                href={`https://api.whatsapp.com/send?text=${encodeURIComponent(
                                  `Royal Services Token: ${token.token_number}\nClient: ${token.associate_name}\nTrack: ${typeof window !== 'undefined' ? window.location.origin : ''}/track/${encodeURIComponent(token.token_number)}`
                                )}`}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300 hover:text-white text-xs font-semibold transition-colors"
                              >
                                <Share2 className="w-3 h-3" />
                                <span>WhatsApp</span>
                              </a>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Attached Documents / Photos (if any) */}
                    {Array.isArray(token.attachments) && token.attachments.length > 0 && (
                      <div className="pt-3 border-t border-slate-800 space-y-2">
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                          Verified Attachments &amp; Documentation ({token.attachments.length})
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {token.attachments.map(att => (
                            <a
                              key={att.id}
                              href={att.storage_path}
                              target="_blank"
                              rel="noreferrer"
                              className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 flex items-center justify-between transition-colors group"
                            >
                              <div className="flex items-center gap-2 truncate">
                                {att.file_type?.startsWith('image') ? (
                                  <ImageIcon className="w-4 h-4 text-emerald-400 shrink-0" />
                                ) : (
                                  <FileText className="w-4 h-4 text-blue-400 shrink-0" />
                                )}
                                <span className="text-xs truncate font-medium group-hover:text-white">
                                  {att.file_name}
                                </span>
                              </div>
                              <ExternalLink className="w-3.5 h-3.5 text-slate-500 group-hover:text-slate-300 shrink-0 ml-2" />
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
