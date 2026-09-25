'use client';

import React, { useState, useEffect } from 'react';
import { Agent } from '@/types';
import { AdminHeader } from '@/components/layout/AdminHeader';
import { AgentModal } from '@/components/agents/AgentModal';
import { AgentBulkImportModal } from '@/components/agents/AgentBulkImportModal';
import { formatReadableISTDateTime } from '@/lib/ist';
import {
  UserPlus,
  Search,
  Download,
  Upload,
  Phone,
  CheckCircle2,
  XCircle,
  Edit2,
  Power,
  ShieldCheck,
} from 'lucide-react';

export default function AdminAgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);

  const loadAgents = async () => {
    try {
      const res = await fetch('/api/agents?includeInactive=true');
      const data = await res.json();
      setAgents(data.agents || []);
    } catch (err) {
      console.error('Error loading agents', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        const res = await fetch('/api/agents?includeInactive=true');
        const data = await res.json();
        if (!ignore) {
          setAgents(data.agents || []);
        }
      } catch (err) {
        console.error('Error loading agents', err);
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    })();
    return () => {
      ignore = true;
    };
  }, []);


  const handleToggleStatus = async (agent: Agent) => {
    const actionName = agent.is_active ? 'deactivate' : 'reactivate';
    if (confirm(`Are you sure you want to ${actionName} agent "${agent.name}"? Historical tokens will remain attached.`)) {
      try {
        const res = await fetch('/api/agents', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: agent.id, toggle: true }),
        });
        const data = await res.json();
        if (data.success) {
          setAgents(prev => prev.map(a => (a.id === agent.id ? data.agent : a)));
        }
      } catch (err) {
        console.error('Failed to toggle status', err);
      }
    }
  };

  const filteredAgents = agents.filter(a => {
    if (!search.trim()) return true;
    const q = search.toLowerCase().trim();
    return a.name.toLowerCase().includes(q) || a.mobile.includes(q);
  });

  const handleExportCSV = () => {
    window.open('/api/export/agents?includeInactive=true', '_blank');
  };

  return (
    <div className="space-y-6">
      <AdminHeader
        title="Agent Directory"
        subtitle="Manage registered Royal Services agents, contact numbers (+91), active status, and CSV exports"
        action={{
          label: 'Register Agent',
          onClick: () => {
            setSelectedAgent(null);
            setShowModal(true);
          },
          icon: <UserPlus className="w-4 h-4" />,
        }}
      />

      {/* Search & Export Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search agents by name or phone..."
            className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-900 placeholder:text-slate-400"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowImportModal(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-[#161E42] hover:bg-[#0A192F] rounded-xl transition-colors border border-slate-700 shadow-xs shrink-0"
          >
            <Upload className="w-3.5 h-3.5 text-amber-400" />
            <span>Import Agents CSV</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors border border-slate-200 shrink-0"
          >
            <Download className="w-3.5 h-3.5 text-amber-600" />
            <span>Export Agents CSV</span>
          </button>
        </div>
      </div>

      {/* Agents Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-xs text-slate-400">Loading agents...</div>
        ) : filteredAgents.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">
            No agents found matching your query.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-semibold text-slate-700 uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3.5">Agent Name</th>
                  <th className="px-5 py-3.5">WhatsApp Mobile (+91)</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5">Registered On</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredAgents.map(ag => (
                  <tr key={ag.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-4 font-semibold text-slate-900">
                      {ag.name}
                    </td>
                    <td className="px-5 py-4 font-mono text-slate-700">
                      <div className="flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        <span>{ag.mobile}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      {ag.is_active ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3" />
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-500 border border-slate-300">
                          <XCircle className="w-3 h-3" />
                          Inactive
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-slate-500">
                      {formatReadableISTDateTime(ag.created_at)}
                    </td>
                    <td className="px-5 py-4 text-right space-x-2">
                      <button
                        onClick={() => {
                          setSelectedAgent(ag);
                          setShowModal(true);
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg border border-slate-200"
                      >
                        <Edit2 className="w-3 h-3 text-amber-600" />
                        <span>Edit</span>
                      </button>

                      <button
                        onClick={() => handleToggleStatus(ag)}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg border ${
                          ag.is_active
                            ? 'text-rose-700 bg-rose-50 border-rose-200 hover:bg-rose-100'
                            : 'text-emerald-700 bg-emerald-50 border-emerald-200 hover:bg-emerald-100'
                        }`}
                      >
                        <Power className="w-3 h-3" />
                        <span>{ag.is_active ? 'Deactivate' : 'Reactivate'}</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="p-4 rounded-2xl bg-slate-100 border border-slate-200 text-xs text-slate-600 space-y-1">
        <p className="font-semibold text-slate-800 flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-amber-600" />
          <span>Agent Relationship & Privacy Policy:</span>
        </p>
        <p>• Linked agents cannot be destructively deleted if tokens exist for them; mark inactive instead.</p>
        <p>• Inactive agents are excluded from new token selection but remain associated with past tokens.</p>
        <p>• Editing an agent master record never changes historical token-specific mobile number overrides.</p>
      </div>

      {showModal && (
        <AgentModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          agentToEdit={selectedAgent}
          onSuccess={saved => {
            if (selectedAgent) {
              setAgents(prev => prev.map(a => (a.id === saved.id ? saved : a)));
            } else {
              setAgents(prev => [...prev, saved]);
            }
          }}
        />
      )}

      {showImportModal && (
        <AgentBulkImportModal
          isOpen={showImportModal}
          onClose={() => setShowImportModal(false)}
          existingAgents={agents}
          onSuccess={() => {
            loadAgents();
          }}
        />
      )}
    </div>
  );
}
