'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Token, TokenStatus } from '@/types';
import { TokenStatusBadge } from './TokenStatusBadge';
import { TokenQRModal } from './TokenQRModal';
import { TokenPDFView } from './TokenPDFView';
import { formatReadableISTDate } from '@/lib/ist';
import {
  Search,
  Filter,
  Download,
  QrCode,
  FileText,
  ChevronRight,
  RefreshCw,
  Phone,
  Building2,
  Calendar,
  ExternalLink,
  ShieldAlert,
} from 'lucide-react';

interface Props {
  initialTokens: Token[];
  isArchivedView?: boolean;
}

export function TokenListTable({ initialTokens, isArchivedView = false }: Props) {
  const [tokens, setTokens] = useState<Token[]>(initialTokens);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<TokenStatus | 'all'>('all');
  const [startDateFilter, setStartDateFilter] = useState('');
  const [endDateFilter, setEndDateFilter] = useState('');

  // Modals state
  const [activeQRToken, setActiveQRToken] = useState<Token | null>(null);
  const [activePDFToken, setActivePDFToken] = useState<Token | null>(null);

  // Filter logic
  const filteredTokens = tokens.filter(t => {
    // Search
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      const matchesSearch =
        t.token_number.toLowerCase().includes(q) ||
        t.associate_name.toLowerCase().includes(q) ||
        (t.agent?.name && t.agent.name.toLowerCase().includes(q)) ||
        t.agent_mobile_number.includes(q) ||
        (t.property?.name && t.property.name.toLowerCase().includes(q)) ||
        (t.token_description && t.token_description.toLowerCase().includes(q));

      if (!matchesSearch) return false;
    }

    // Status
    if (statusFilter !== 'all' && t.computed_status !== statusFilter) {
      return false;
    }

    // Dates
    if (startDateFilter && t.start_date < startDateFilter) {
      return false;
    }
    if (endDateFilter && t.end_date > endDateFilter) {
      return false;
    }

    return true;
  });

  const handleExport = (scope: 'all' | 'filtered') => {
    let url = `/api/export/tokens?scope=${scope}&archived=${isArchivedView ? 'true' : 'false'}`;
    if (scope === 'filtered') {
      url += `&status=${statusFilter}&search=${encodeURIComponent(search)}&startDate=${startDateFilter}&endDate=${endDateFilter}`;
    }
    window.open(url, '_blank');
  };

  const handleRestore = async (id: string) => {
    if (confirm('Are you sure you want to restore this token from the archive? It will return to active operational lists.')) {
      try {
        const res = await fetch(`/api/tokens/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'restore' }),
        });
        const data = await res.json();
        if (data.success) {
          setTokens(prev => prev.filter(t => t.id !== id));
        }
      } catch (err) {
        console.error('Error restoring token', err);
      }
    }
  };

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://rsagentapp.vercel.app';

  return (
    <div className="space-y-4">
      {/* Search and Filters Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by token, associate, agent, phone, or property..."
              className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#2D3774] text-slate-900 placeholder:text-slate-400"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 text-xs"
              >
                Clear
              </button>
            )}
          </div>

          {/* Status Filter Dropdown */}
          {!isArchivedView && (
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-400 shrink-0" />
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value as TokenStatus | 'all')}
                className="px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#2D3774]"
              >
                <option value="all">All Statuses</option>
                <option value="active">Active</option>
                <option value="upcoming">Upcoming</option>
                <option value="expired">Expired</option>
                <option value="suspended">Suspended</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          )}

          {/* Date Range Filters */}
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={startDateFilter}
              onChange={e => setStartDateFilter(e.target.value)}
              title="Filter by Start Date from"
              className="px-2.5 py-1.5 text-xs rounded-xl border border-slate-300 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#2D3774]"
            />
            <span className="text-slate-400 text-xs">to</span>
            <input
              type="date"
              value={endDateFilter}
              onChange={e => setEndDateFilter(e.target.value)}
              title="Filter by End Date to"
              className="px-2.5 py-1.5 text-xs rounded-xl border border-slate-300 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#2D3774]"
            />
          </div>

          {/* Export Dropdown Buttons */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => handleExport('filtered')}
              className="inline-flex items-center gap-1 px-3 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors border border-slate-200"
              title="Export currently filtered list to CSV"
            >
              <Download className="w-3.5 h-3.5 text-amber-600" />
              <span>Export CSV</span>
            </button>
            <button
              onClick={() => handleExport('all')}
              className="hidden lg:inline-flex items-center gap-1 px-3 py-2 text-xs font-medium text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
              title="Export all records to CSV"
            >
              Export All
            </button>
          </div>
        </div>

        {/* Results summary bar */}
        <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-100">
          <span>
            Showing <strong className="text-slate-800">{filteredTokens.length}</strong> of{' '}
            <strong className="text-slate-800">{tokens.length}</strong> {isArchivedView ? 'archived' : ''} tokens
          </span>
          {(search || statusFilter !== 'all' || startDateFilter || endDateFilter) && (
            <button
              onClick={() => {
                setSearch('');
                setStatusFilter('all');
                setStartDateFilter('');
                setEndDateFilter('');
              }}
              className="text-amber-700 hover:text-amber-800 font-medium"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Desktop & Tablet Table View (hidden on very narrow mobile screens) */}
      <div className="hidden md:block bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-semibold text-slate-700 uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3.5">Token / Associate</th>
                <th className="px-5 py-3.5">Assigned Agent</th>
                <th className="px-5 py-3.5">Property</th>
                <th className="px-5 py-3.5">Validity (IST)</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTokens.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                    No tokens found matching the current filters.
                  </td>
                </tr>
              ) : (
                filteredTokens.map(token => {
                  const trackingUrl = `${appUrl}/track/${encodeURIComponent(token.token_number)}`;
                  return (
                    <tr
                      key={token.id}
                      className="hover:bg-amber-50/20 transition-colors group"
                    >
                      {/* Token Number & Associate */}
                      <td className="px-5 py-4">
                        <Link
                          href={`/admin/tokens/${token.id}`}
                          className="font-mono font-bold text-slate-900 group-hover:text-[#2D3774] text-sm hover:underline block"
                        >
                          {token.token_number}
                        </Link>
                        <p className="font-medium text-slate-800 mt-0.5 truncate max-w-xs">
                          {token.associate_name}
                        </p>
                        {token.renewal_reference_id && (
                          <span className="inline-block text-[10px] text-amber-800 bg-amber-50 border border-amber-200 px-1.5 py-0.2 rounded mt-0.5">
                            Renewed
                          </span>
                        )}
                      </td>

                      {/* Agent & Mobile */}
                      <td className="px-5 py-4">
                        <div className="font-medium text-slate-900">
                          {token.agent?.name || 'Unassigned'}
                        </div>
                        <div className="flex items-center text-[11px] text-slate-500 font-mono mt-0.5">
                          <Phone className="w-3 h-3 text-slate-400 mr-1" />
                          <span>{token.agent_mobile_number}</span>
                        </div>
                      </td>

                      {/* Property */}
                      <td className="px-5 py-4 max-w-xs truncate">
                        <div className="flex items-start text-slate-800 font-medium">
                          <Building2 className="w-3.5 h-3.5 text-slate-400 mr-1.5 shrink-0 mt-0.5" />
                          <span className="truncate">{token.property?.name}</span>
                        </div>
                      </td>

                      {/* Validity Dates */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="flex items-center text-slate-700 font-medium">
                          <Calendar className="w-3 h-3 text-slate-400 mr-1.5" />
                          <span>{formatReadableISTDate(token.start_date)}</span>
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          to {formatReadableISTDate(token.end_date)}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <TokenStatusBadge status={token.computed_status} />
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4 whitespace-nowrap text-right space-x-1">
                        {!token.is_archived && (
                          <>
                            <button
                              onClick={() => setActiveQRToken(token)}
                              className="p-1.5 text-slate-400 hover:text-amber-700 rounded-lg hover:bg-slate-100 transition-colors"
                              title="Show QR Code"
                              aria-label="Show QR Code"
                            >
                              <QrCode className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setActivePDFToken(token)}
                              className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
                              title="Print / Save PDF"
                              aria-label="Print or Save PDF"
                            >
                              <FileText className="w-4 h-4" />
                            </button>
                            <a
                              href={trackingUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-slate-100 transition-colors inline-block"
                              title="Open Public Tracking Page"
                              aria-label="Open Public Tracking Page"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          </>
                        )}

                        {token.is_archived ? (
                          <button
                            onClick={() => handleRestore(token.id)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-medium transition-colors"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                            Restore
                          </button>
                        ) : (
                          <Link
                            href={`/admin/tokens/${token.id}`}
                            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-950 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors ml-1"
                          >
                            <span>Manage</span>
                            <ChevronRight className="w-3 h-3" />
                          </Link>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Responsive Stacked Cards (Section 4.1) */}
      <div className="md:hidden space-y-3">
        {filteredTokens.length === 0 ? (
          <div className="bg-white p-8 text-center rounded-2xl border border-slate-200 text-slate-400 text-xs">
            No tokens found matching the current filters.
          </div>
        ) : (
          filteredTokens.map(token => {
            const trackingUrl = `${appUrl}/track/${encodeURIComponent(token.token_number)}`;
            return (
              <div
                key={token.id}
                className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <Link
                      href={`/admin/tokens/${token.id}`}
                      className="font-mono font-bold text-slate-900 text-base"
                    >
                      {token.token_number}
                    </Link>
                    <p className="font-medium text-slate-800 text-xs mt-0.5">
                      {token.associate_name}
                    </p>
                  </div>
                  <TokenStatusBadge status={token.computed_status} size="sm" />
                </div>

                <div className="text-xs text-slate-600 space-y-1.5 pt-1 border-t border-slate-100">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Agent:</span>
                    <span className="font-medium text-slate-800">
                      {token.agent?.name} ({token.agent_mobile_number})
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Property:</span>
                    <span className="font-medium text-slate-800 truncate max-w-[200px]">
                      {token.property?.name}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Validity:</span>
                    <span className="font-medium text-slate-800">
                      {formatReadableISTDate(token.start_date)} – {formatReadableISTDate(token.end_date)}
                    </span>
                  </div>
                </div>

                {/* Mobile Actions */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                  <div className="flex items-center gap-1">
                    {!token.is_archived && (
                      <>
                        <button
                          onClick={() => setActiveQRToken(token)}
                          className="p-2 text-slate-500 hover:text-amber-700 bg-slate-100 rounded-lg"
                          aria-label="QR Code"
                        >
                          <QrCode className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setActivePDFToken(token)}
                          className="p-2 text-slate-500 hover:text-slate-800 bg-slate-100 rounded-lg"
                          aria-label="Print PDF"
                        >
                          <FileText className="w-4 h-4" />
                        </button>
                        <a
                          href={trackingUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 text-slate-500 hover:text-blue-600 bg-slate-100 rounded-lg"
                          aria-label="Open Public Tracking"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </>
                    )}
                  </div>

                  {token.is_archived ? (
                    <button
                      onClick={() => handleRestore(token.id)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-medium"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      Restore
                    </button>
                  ) : (
                    <Link
                      href={`/admin/tokens/${token.id}`}
                      className="inline-flex items-center gap-1 px-4 py-1.5 text-xs font-semibold text-white bg-slate-900 rounded-lg shadow-xs"
                    >
                      <span>Manage</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* QR Code Modal */}
      {activeQRToken && (
        <TokenQRModal
          isOpen={Boolean(activeQRToken)}
          onClose={() => setActiveQRToken(null)}
          tokenNumber={activeQRToken.token_number}
          trackingUrl={`${appUrl}/track/${encodeURIComponent(activeQRToken.token_number)}`}
        />
      )}

      {/* Printable PDF Modal */}
      {activePDFToken && (
        <TokenPDFView
          isOpen={Boolean(activePDFToken)}
          onClose={() => setActivePDFToken(null)}
          token={activePDFToken}
        />
      )}
    </div>
  );
}
