'use client';

import React, { useState, useEffect } from 'react';
import { Property } from '@/types';
import { AdminHeader } from '@/components/layout/AdminHeader';
import { PropertyModal } from '@/components/properties/PropertyModal';
import { formatReadableISTDateTime } from '@/lib/ist';
import {
  Building2,
  Search,
  CheckCircle2,
  XCircle,
  Edit2,
  Power,
  ShieldCheck,
  Plus,
} from 'lucide-react';

export default function AdminPropertiesPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);

  const loadProperties = async () => {
    try {
      const res = await fetch('/api/properties?includeInactive=true');
      const data = await res.json();
      setProperties(data.properties || []);
    } catch (err) {
      console.error('Error loading properties', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProperties();
  }, []);

  const handleToggleStatus = async (prop: Property) => {
    const actionName = prop.is_active ? 'deactivate' : 'reactivate';
    if (confirm(`Are you sure you want to ${actionName} property "${prop.name}"? Historical tokens will remain attached.`)) {
      try {
        const res = await fetch('/api/properties', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: prop.id, toggle: true }),
        });
        const data = await res.json();
        if (data.success) {
          setProperties(prev => prev.map(p => (p.id === prop.id ? data.property : p)));
        }
      } catch (err) {
        console.error('Failed to toggle status', err);
      }
    }
  };

  const filteredProperties = properties.filter(p => {
    if (!search.trim()) return true;
    return p.name.toLowerCase().includes(search.toLowerCase().trim());
  });

  return (
    <div className="space-y-6">
      <AdminHeader
        title="Property Master List"
        subtitle="Manage registered properties and commercial/residential locations reusable across tokens"
        action={{
          label: 'Register Property',
          onClick: () => {
            setSelectedProperty(null);
            setShowModal(true);
          },
          icon: <Plus className="w-4 h-4" />,
        }}
      />

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search properties by name or address..."
            className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-900 placeholder:text-slate-400"
          />
        </div>

        <span className="text-xs text-slate-500">
          Showing <strong className="text-slate-800">{filteredProperties.length}</strong> properties
        </span>
      </div>

      {/* Properties Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-xs text-slate-400">Loading properties...</div>
        ) : filteredProperties.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">
            No properties found matching your query.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-semibold text-slate-700 uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3.5">Property Name / Location</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5">Registered On</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredProperties.map(pr => (
                  <tr key={pr.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-4 font-semibold text-slate-900 max-w-md">
                      <div className="flex items-start gap-2">
                        <Building2 className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                        <span>{pr.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      {pr.is_active ? (
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
                    <td className="px-5 py-4 text-slate-500 whitespace-nowrap">
                      {formatReadableISTDateTime(pr.created_at)}
                    </td>
                    <td className="px-5 py-4 text-right space-x-2 whitespace-nowrap">
                      <button
                        onClick={() => {
                          setSelectedProperty(pr);
                          setShowModal(true);
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg border border-slate-200"
                      >
                        <Edit2 className="w-3 h-3 text-amber-600" />
                        <span>Edit</span>
                      </button>

                      <button
                        onClick={() => handleToggleStatus(pr)}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg border ${
                          pr.is_active
                            ? 'text-rose-700 bg-rose-50 border-rose-200 hover:bg-rose-100'
                            : 'text-emerald-700 bg-emerald-50 border-emerald-200 hover:bg-emerald-100'
                        }`}
                      >
                        <Power className="w-3 h-3" />
                        <span>{pr.is_active ? 'Deactivate' : 'Reactivate'}</span>
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
          <span>Property Preservation & Association:</span>
        </p>
        <p>• Properties can be created directly here or inline while creating/editing any token record.</p>
        <p>• Historical tokens preserve linked properties even if the property is later deactivated.</p>
      </div>

      {showModal && (
        <PropertyModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          propertyToEdit={selectedProperty}
          onSuccess={saved => {
            if (selectedProperty) {
              setProperties(prev => prev.map(p => (p.id === saved.id ? saved : p)));
            } else {
              setProperties(prev => [...prev, saved]);
            }
          }}
        />
      )}
    </div>
  );
}
