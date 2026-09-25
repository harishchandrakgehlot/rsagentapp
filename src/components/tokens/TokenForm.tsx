'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Agent, Property, Token, StatusOverride } from '@/types';
import { AgentModal } from '@/components/agents/AgentModal';
import { PropertyModal } from '@/components/properties/PropertyModal';
import {
  Save,
  UserPlus,
  Building2,
  AlertTriangle,
  Upload,
  X,
  FileText,
  Image as ImageIcon,
  Calendar,
  AlertCircle,
  HelpCircle,
  Plus,
  Trash2,
  Star,
  Users,
  Loader2,
} from 'lucide-react';
import { getCurrentISTDateString } from '@/lib/ist';


interface Props {
  initialToken?: Token | null;
  renewalDraft?: {
    associate_name: string;
    agent_id: string;
    agent_mobile_number: string;
    property_id: string;
    token_description: string;
    notes_and_remarks: string;
    renewal_reference_id: string;
    prior_token_number: string;
    attachments: {
      file_name: string;
      file_type: string;
      file_size: number;
      storage_path: string;
    }[];
  } | null;
  isEdit?: boolean;
}

export function TokenForm({ initialToken, renewalDraft, isEdit }: Props) {
  const router = useRouter();

  // Master lists
  const [agents, setAgents] = useState<Agent[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loadingMasters, setLoadingMasters] = useState(true);

  // Modals for inline creation
  const [isAgentModalOpen, setIsAgentModalOpen] = useState(false);
  const [isPropertyModalOpen, setIsPropertyModalOpen] = useState(false);

  // Form Fields
  const [tokenNumber, setTokenNumber] = useState(
    initialToken?.token_number || ''
  );
  const [associateName, setAssociateName] = useState(
    initialToken?.associate_name || renewalDraft?.associate_name || ''
  );
  const [agentId, setAgentId] = useState(
    initialToken?.agent_id || renewalDraft?.agent_id || ''
  );


  // Multi-recipient state: Supports assigning multiple agents & WhatsApp phone recipients
  const [recipients, setRecipients] = useState<
    Array<{
      id: string;
      agent_id?: string;
      name: string;
      mobile: string;
      is_primary: boolean;
    }>
  >(() => {
    if (initialToken?.assigned_recipients && initialToken.assigned_recipients.length > 0) {
      return initialToken.assigned_recipients.map((r, i) => ({
        id: r.id || `rec-${Date.now()}-${i}`,
        agent_id: r.agent_id,
        name: r.name,
        mobile: r.mobile,
        is_primary: Boolean(r.is_primary ?? i === 0),
      }));
    }
    const initAgentId = initialToken?.agent_id || renewalDraft?.agent_id || '';
    const initMobile = initialToken?.agent_mobile_number || renewalDraft?.agent_mobile_number || '';
    return [
      {
        id: `rec-${Date.now()}-0`,
        agent_id: initAgentId,
        name: initialToken?.agent?.name || '',
        mobile: initMobile,
        is_primary: true,
      },
    ];
  });

  const [propertyId, setPropertyId] = useState(
    initialToken?.property_id || renewalDraft?.property_id || ''
  );

  // Property Structured Address Fields (always blank by default on Create New Token)
  const [plotHouseNo, setPlotHouseNo] = useState(
    initialToken?.property?.plot_house_no || ''
  );
  const [addressLine1, setAddressLine1] = useState(
    initialToken?.property?.address_line_1 || initialToken?.property?.name || ''
  );
  const [addressLine2, setAddressLine2] = useState(
    initialToken?.property?.address_line_2 || ''
  );
  const [landmark, setLandmark] = useState(
    initialToken?.property?.landmark || ''
  );
  const [city, setCity] = useState(
    initialToken?.property?.city || ''
  );
  const [state, setState] = useState(
    initialToken?.property?.state || ''
  );
  const [postalCode, setPostalCode] = useState(
    initialToken?.property?.postal_code || ''
  );
  const [country, setCountry] = useState(
    initialToken?.property?.country || 'India'
  );
  const [startDate, setStartDate] = useState(
    initialToken?.start_date || getCurrentISTDateString()
  );
  const [endDate, setEndDate] = useState(
    initialToken?.end_date || ''
  );
  const [tokenDescription, setTokenDescription] = useState(
    initialToken?.token_description || renewalDraft?.token_description || ''
  );
  const [notesAndRemarks, setNotesAndRemarks] = useState(
    initialToken?.notes_and_remarks || renewalDraft?.notes_and_remarks || ''
  );
  const [statusOverride, setStatusOverride] = useState<StatusOverride>(
    initialToken?.status_override || null
  );

  // Attachments
  const [attachments, setAttachments] = useState<
    { file_name: string; file_type: string; file_size: number; storage_path: string }[]
  >(
    (initialToken?.attachments || renewalDraft?.attachments || []).map(a => ({
      file_name: a.file_name,
      file_type: a.file_type,
      file_size: a.file_size,
      storage_path: a.storage_path,
    }))
  );

  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Load Agents & Properties
  useEffect(() => {
    async function loadData() {
      try {
        const [agRes, prRes] = await Promise.all([
          fetch('/api/agents?includeInactive=true'),
          fetch('/api/properties?includeInactive=true'),
        ]);
        const agData = await agRes.json();
        const prData = await prRes.json();
        const loadedProps: Property[] = prData.properties || [];
        setAgents(agData.agents || []);
        setProperties(loadedProps);

        // If editing or renewing, autofill address fields from the property
        const targetPropId = initialToken?.property_id || renewalDraft?.property_id;
        if (targetPropId) {
          const matched = loadedProps.find(p => p.id === targetPropId);
          if (matched) {
            setPlotHouseNo(matched.plot_house_no || '');
            setAddressLine1(matched.address_line_1 || matched.name || '');
            setAddressLine2(matched.address_line_2 || '');
            setLandmark(matched.landmark || '');
            setCity(matched.city || '');
            setState(matched.state || '');
            setPostalCode(matched.postal_code || '');
            setCountry(matched.country || 'India');
          }
        }
      } catch (err) {
        console.error('Failed to load agents/properties', err);
      } finally {
        setLoadingMasters(false);
      }
    }
    loadData();
  }, [initialToken, renewalDraft]);

  // Multi-recipient action handlers
  const handleAddRecipient = () => {
    setRecipients(prev => [
      ...prev,
      {
        id: `rec-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        agent_id: '',
        name: '',
        mobile: '',
        is_primary: false,
      },
    ]);
  };

  const handleRemoveRecipient = (idToRemove: string) => {
    if (recipients.length <= 1) return;
    setRecipients(prev => {
      const filtered = prev.filter(r => r.id !== idToRemove);
      if (!filtered.some(r => r.is_primary) && filtered.length > 0) {
        filtered[0].is_primary = true;
        setAgentId(filtered[0].agent_id || '');
      }
      return filtered;
    });
  };

  const handleUpdateRecipient = (
    id: string,
    updates: Partial<{ name: string; mobile: string; is_primary: boolean }>
  ) => {
    setRecipients(prev =>
      prev.map(r => {
        if (r.id === id) {
          const updated = { ...r, ...updates };
          if (updates.is_primary) {
            setAgentId(updated.agent_id || '');
          }
          return updated;
        }
        if (updates.is_primary) {
          return { ...r, is_primary: false };
        }
        return r;
      })
    );
  };

  const handleSelectRecipientAgent = (id: string, selectedAgentId: string) => {
    const ag = agents.find(a => a.id === selectedAgentId);
    setRecipients(prev =>
      prev.map(r => {
        if (r.id === id) {
          const updated = {
            ...r,
            agent_id: selectedAgentId,
            name: ag ? ag.name : r.name,
            mobile: ag ? ag.mobile : r.mobile,
          };
          if (r.is_primary) {
            setAgentId(selectedAgentId);
          }
          return updated;
        }
        return r;
      })
    );
  };


  // When existing property is chosen from dropdown, autofill the fields
  const handleSelectExistingProperty = (selectedId: string) => {
    setPropertyId(selectedId);
    if (!selectedId) {
      setPlotHouseNo('');
      setAddressLine1('');
      setAddressLine2('');
      setLandmark('');
      setCity('');
      setState('');
      setPostalCode('');
      setCountry('India');
      return;
    }
    const prop = properties.find(p => p.id === selectedId);
    if (prop) {
      setPlotHouseNo(prop.plot_house_no || '');
      setAddressLine1(prop.address_line_1 || prop.name || '');
      setAddressLine2(prop.address_line_2 || '');
      setLandmark(prop.landmark || '');
      setCity(prop.city || '');
      setState(prop.state || '');
      setPostalCode(prop.postal_code || '');
      setCountry(prop.country || 'India');
    }
  };

  // Inline Agent Creation Callback
  const handleAgentCreated = (newAgent: Agent) => {
    setAgents(prev => [...prev, newAgent]);
    setRecipients(prev => {
      // If the only recipient is blank, replace it
      if (prev.length === 1 && !prev[0].mobile.trim()) {
        return [
          {
            id: prev[0].id,
            agent_id: newAgent.id,
            name: newAgent.name,
            mobile: newAgent.mobile,
            is_primary: true,
          },
        ];
      }
      return [
        ...prev,
        {
          id: `rec-${Date.now()}`,
          agent_id: newAgent.id,
          name: newAgent.name,
          mobile: newAgent.mobile,
          is_primary: false,
        },
      ];
    });
    setAgentId(newAgent.id);
  };


  // Inline Property Creation Callback
  const handlePropertyCreated = (newProp: Property) => {
    setProperties(prev => [...prev, newProp]);
    setPropertyId(newProp.id);
    setPlotHouseNo(newProp.plot_house_no || '');
    setAddressLine1(newProp.address_line_1 || newProp.name || '');
    setAddressLine2(newProp.address_line_2 || '');
    setLandmark(newProp.landmark || '');
    setCity(newProp.city || '');
    setState(newProp.state || '');
    setPostalCode(newProp.postal_code || '');
    setCountry(newProp.country || 'India');
  };

  // Live computed formatted address
  const computedAddressPreview = [
    plotHouseNo.trim(),
    addressLine1.trim(),
    addressLine2.trim(),
    landmark.trim() ? `Near ${landmark.trim()}` : '',
    city.trim(),
    state.trim(),
    postalCode.trim(),
    country.trim() || 'India',
  ].filter(Boolean).join(', ');

  // File Upload Handler (PDF, JPG, PNG up to 10MB)
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setError('');
    setUploading(true);

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      if (!['application/pdf', 'image/jpeg', 'image/png'].includes(file.type)) {
        setError(`File "${file.name}" is not supported. Only PDF, JPG, and PNG are allowed.`);
        setUploading(false);
        return;
      }

      if (file.size > 10 * 1024 * 1024) {
        setError(`File "${file.name}" exceeds the 10 MB maximum size limit.`);
        setUploading(false);
        return;
      }

      const formData = new FormData();
      formData.append('file', file);

      try {
        const res = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Upload failed');
        }

        setAttachments(prev => [
          ...prev,
          {
            file_name: data.file_name,
            file_type: data.file_type,
            file_size: data.file_size,
            storage_path: data.storage_path,
          },
        ]);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Error uploading file';
        setError(msg);
      }
    }

    setUploading(false);
    // Reset file input
    e.target.value = '';
  };

  const handleRemoveAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  // Form Submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const normNumber = tokenNumber.trim();
    if (!normNumber) {
      setError('Token Number is required.');
      return;
    }

    if (!associateName.trim()) {
      setError('Associate / Client name is required.');
      return;
    }

    // Validate multi-recipients
    const validRecipients = recipients.filter(r => r.mobile && r.mobile.trim());
    if (validRecipients.length === 0) {
      setError('Please add at least one Assigned Agent / WhatsApp Recipient with a valid mobile number.');
      return;
    }

    const primaryRec = validRecipients.find(r => r.is_primary) || validRecipients[0];
    const resolvedAgentId = primaryRec.agent_id || agentId || agents[0]?.id || 'ag-default';
    const resolvedMobile = primaryRec.mobile.trim();

    const hasAddress = (plotHouseNo.trim() || addressLine1.trim()) && city.trim();
    if (!propertyId && !hasAddress) {
      setError('Please provide the Assigned Property address (Plot/House No. or Address Line 1, and City / Town / Village are required).');
      return;
    }

    if (!startDate) {
      setError('Start Date is required.');
      return;
    }

    if (!endDate) {
      setError('End Date is required.');
      return;
    }

    // PRD Rule: End Date cannot be earlier than Start Date
    if (endDate < startDate) {
      setError('End Date cannot be earlier than Start Date.');
      return;
    }

    setSubmitting(true);

    try {
      const propertyAddressPayload = hasAddress
        ? {
            plot_house_no: plotHouseNo.trim(),
            address_line_1: addressLine1.trim(),
            address_line_2: addressLine2.trim(),
            landmark: landmark.trim(),
            city: city.trim(),
            state: state.trim(),
            postal_code: postalCode.trim(),
            country: country.trim() || 'India',
          }
        : undefined;

      const payload = {
        token_number: normNumber,
        associate_name: associateName.trim(),
        agent_id: resolvedAgentId,
        agent_mobile_number: resolvedMobile,
        assigned_recipients: validRecipients.map(r => ({
          agent_id: r.agent_id || undefined,
          name: r.name.trim() || 'Agent',
          mobile: r.mobile.trim(),
          is_primary: r.id === primaryRec.id,
        })),
        property_id: propertyId || undefined,
        property_address: propertyAddressPayload,
        start_date: startDate,
        end_date: endDate,
        token_description: tokenDescription.trim() || null,
        notes_and_remarks: notesAndRemarks.trim() || null,
        status_override: statusOverride,
        renewal_reference_id: renewalDraft?.renewal_reference_id || initialToken?.renewal_reference_id || null,
        attachments,
      };

      const url = isEdit && initialToken ? `/api/tokens/${initialToken.id}` : '/api/tokens';
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to save token');
      }

      router.push(`/admin/tokens/${data.token.id}`);
      router.refresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error submitting form';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl mx-auto">
        {/* Error Alert */}
        {error && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-start gap-3 shadow-xs">
            <AlertCircle className="w-5 h-5 shrink-0 text-rose-600 mt-0.5" />
            <div>
              <p className="font-semibold">Validation Error</p>
              <p className="text-xs text-rose-700 mt-0.5">{error}</p>
            </div>
          </div>
        )}

        {/* Renewal Banner if this is a renewal */}
        {renewalDraft && (
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-sm flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center text-amber-800 shrink-0 font-bold text-xs">
              RE
            </div>
            <div>
              <p className="font-semibold">
                Creating Renewal Token for Prior Token{' '}
                <span className="font-mono underline">{renewalDraft.prior_token_number}</span>
              </p>
              <p className="text-xs text-amber-700 mt-0.5">
                Prior associate, agent, mobile, property, description, notes, and documents have been cloned into this draft. Please assign a new unique Token Number and new valid dates.
              </p>
            </div>
          </div>
        )}

        {/* Card 1: Core Identification & Associate */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-3 flex items-center gap-2">
            <FileText className="w-4 h-4 text-amber-600" />
            <span>Token Identification & Associate</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Token Number <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={tokenNumber}
                onChange={e => setTokenNumber(e.target.value)}
                placeholder="e.g. RS-2026-9001"
                className="w-full px-3.5 py-2 text-sm font-mono rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#2D3774] text-slate-900 placeholder:text-slate-400"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Unique identifier manually assigned. Duplicates rejected across active & archived records.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Associate / Client Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={associateName}
                onChange={e => setAssociateName(e.target.value)}
                placeholder="e.g. Aditya Birla Capital"
                className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#2D3774] text-slate-900 placeholder:text-slate-400"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Free-text entry for associated client or company.
              </p>
            </div>
          </div>
        </div>

        {/* Card 2: Assigned Agents & WhatsApp Recipients (Multi-Recipient Support) */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-3 gap-2">
            <div>
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Users className="w-4 h-4 text-amber-600" />
                <span>Assigned Agents & WhatsApp Recipients ({recipients.length})</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Add one or multiple agents/recipients. <strong>All assigned recipients</strong> will receive automated WhatsApp messages on departure & expiry days!
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsAgentModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-amber-800 bg-amber-50 hover:bg-amber-100 rounded-lg border border-amber-200 transition-colors"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>New Agent Master</span>
              </button>
              <button
                type="button"
                onClick={handleAddRecipient}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-lg border border-emerald-200 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Another Recipient</span>
              </button>
            </div>
          </div>

          <div className="space-y-3">
            {recipients.map((rec, index) => (
              <div
                key={rec.id}
                className={`p-3.5 rounded-xl border transition-all ${
                  rec.is_primary
                    ? 'bg-amber-50/40 border-amber-300 ring-1 ring-amber-400/40'
                    : 'bg-slate-50/70 border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2 pb-2 border-b border-slate-200/60">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-800">
                      Recipient #{index + 1}
                    </span>
                    {rec.is_primary ? (
                      <span className="text-[10px] bg-amber-200/80 text-amber-900 font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Star className="w-2.5 h-2.5 fill-amber-700 text-amber-700" />
                        <span>Primary Agent</span>
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleUpdateRecipient(rec.id, { is_primary: true })}
                        className="text-[10px] text-slate-500 hover:text-amber-800 hover:underline font-semibold"
                      >
                        Make Primary
                      </button>
                    )}
                  </div>

                  {recipients.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveRecipient(rec.id)}
                      className="inline-flex items-center gap-1 text-[11px] text-rose-600 hover:text-rose-800 hover:underline font-semibold"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Remove</span>
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1">
                      Pick from Agent Master
                    </label>
                    <select
                      value={rec.agent_id || ''}
                      onChange={e => handleSelectRecipientAgent(rec.id, e.target.value)}
                      className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#2D3774] text-slate-900 bg-white"
                    >
                      <option value="">-- Choose or Enter Custom Below --</option>
                      {agents.map(ag => (
                        <option key={ag.id} value={ag.id}>
                          {ag.name} {!ag.is_active ? '(Inactive)' : ''} ({ag.mobile})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1">
                      Recipient Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={rec.name}
                      onChange={e => handleUpdateRecipient(rec.id, { name: e.target.value })}
                      placeholder="e.g. Ramesh Patel"
                      className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#2D3774] text-slate-900 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1">
                      WhatsApp Mobile (+91) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="tel"
                      required
                      value={rec.mobile}
                      onChange={e => handleUpdateRecipient(rec.id, { mobile: e.target.value })}
                      placeholder="+919820123456"
                      className="w-full px-3 py-1.5 text-xs font-mono rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#2D3774] text-slate-900 bg-white"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between pt-1 gap-2">
            <button
              type="button"
              onClick={handleAddRecipient}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-lg border border-emerald-200 transition-colors self-start"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Another Agent / WhatsApp Recipient</span>
            </button>

            <span className="text-[11px] text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded border border-emerald-100 flex items-center gap-1">
              🔒 Numbers are private. All recipients listed above receive WhatsApp reminder messages for this token.
            </span>
          </div>
        </div>

        {/* Card 3: Assigned Property */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
            <div>
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Building2 className="w-4 h-4 text-amber-600" />
                <span>Assigned Property Location</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Fill up the property address format below. Once entered, it will automatically save into the Properties database.
              </p>
            </div>

            {/* Loading indicator or Quick Autofill from existing properties */}
            {loadingMasters ? (
              <div className="flex items-center gap-1.5 text-xs text-slate-500 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-[#2D3774]" />
                <span>Loading properties...</span>
              </div>
            ) : properties.length > 0 && (
              <div className="flex items-center gap-2">
                <select
                  value={propertyId}
                  onChange={e => handleSelectExistingProperty(e.target.value)}
                  className="px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#2D3774] text-slate-800 bg-slate-50 font-medium"
                >
                  <option value="">-- Or Autofill From Saved Property --</option>

                  {properties.map(pr => (
                    <option key={pr.id} value={pr.id}>
                      {pr.name}
                    </option>
                  ))}
                </select>
                {propertyId && (
                  <button
                    type="button"
                    onClick={() => handleSelectExistingProperty('')}
                    className="text-xs text-slate-600 hover:text-rose-600 px-2.5 py-1 rounded bg-slate-100 hover:bg-rose-50 border border-slate-200 transition-colors"
                  >
                    Clear Form
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Blank Fill-Up Form Fields */}
          <div className="space-y-4">
            {/* Row 1: Plot / House No. & Address Line 1 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Plot / House No. <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={plotHouseNo}
                  onChange={e => {
                    setPlotHouseNo(e.target.value);
                    setPropertyId('');
                  }}
                  placeholder="e.g. Plot No. 42 / Flat 1402, Tower A"
                  className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#2D3774] text-slate-900 placeholder:text-slate-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Address Line 1 <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={addressLine1}
                  onChange={e => {
                    setAddressLine1(e.target.value);
                    setPropertyId('');
                  }}
                  placeholder="e.g. Royal Palms Residency, Palm Beach Road"
                  className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#2D3774] text-slate-900 placeholder:text-slate-400"
                />
              </div>
            </div>

            {/* Row 2: Address Line 2 & Landmark */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Address Line 2
                </label>
                <input
                  type="text"
                  value={addressLine2}
                  onChange={e => {
                    setAddressLine2(e.target.value);
                    setPropertyId('');
                  }}
                  placeholder="e.g. Sector 15, Near Central Park"
                  className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#2D3774] text-slate-900 placeholder:text-slate-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Landmark
                </label>
                <input
                  type="text"
                  value={landmark}
                  onChange={e => {
                    setLandmark(e.target.value);
                    setPropertyId('');
                  }}
                  placeholder="e.g. Opposite Inorbit Mall / Metro Station"
                  className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#2D3774] text-slate-900 placeholder:text-slate-400"
                />
              </div>
            </div>

            {/* Row 3: City / Town / Village, State / Union Territory, Postal / ZIP Code */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  City / Town / Village <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={city}
                  onChange={e => {
                    setCity(e.target.value);
                    setPropertyId('');
                  }}
                  placeholder="e.g. Mumbai / Navi Mumbai"
                  className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#2D3774] text-slate-900 placeholder:text-slate-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  State / Union Territory <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={state}
                  onChange={e => {
                    setState(e.target.value);
                    setPropertyId('');
                  }}
                  placeholder="e.g. Maharashtra"
                  className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#2D3774] text-slate-900 placeholder:text-slate-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Postal / ZIP Code <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={postalCode}
                  onChange={e => {
                    setPostalCode(e.target.value);
                    setPropertyId('');
                  }}
                  placeholder="e.g. 400703"
                  className="w-full px-3.5 py-2 text-sm font-mono rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#2D3774] text-slate-900 placeholder:text-slate-400"
                />
              </div>
            </div>

            {/* Row 4: Country */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Country <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={country}
                  onChange={e => {
                    setCountry(e.target.value);
                    setPropertyId('');
                  }}
                  placeholder="e.g. India"
                  className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#2D3774] text-slate-900 placeholder:text-slate-400"
                />
              </div>
            </div>

            {/* Live Address Preview & Save Confirmation Indicator */}
            {computedAddressPreview && (
              <div className="p-3.5 bg-blue-50/70 border border-blue-200/80 rounded-xl text-xs text-blue-950 flex items-start gap-2.5 shadow-2xs">
                <Building2 className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <span className="font-semibold text-blue-900 block">
                    Property Address Format:
                  </span>
                  <p className="mt-0.5 font-medium text-slate-800">{computedAddressPreview}</p>
                  <p className="text-[11px] text-blue-700 mt-1 font-medium">
                    💾 Once saved, this property will automatically be stored in your Property master directory.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Card 4: Dates & IST Status Rules */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-3 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-amber-600" />
            <span>Validity Window & Status Rules (IST)</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Start Date (IST) <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                required
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#2D3774] text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                End Date (IST) <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                required
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#2D3774] text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Manual Status Override
              </label>
              <select
                value={statusOverride || ''}
                onChange={e =>
                  setStatusOverride((e.target.value as StatusOverride) || null)
                }
                className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#2D3774] text-slate-900 bg-white"
              >
                <option value="">Automatic (Calculated in IST)</option>
                <option value="suspended">Suspended (Manual)</option>
                <option value="cancelled">Cancelled (Manual)</option>
              </select>
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-600 space-y-1">
            <p className="font-semibold text-slate-800 flex items-center gap-1.5">
              <HelpCircle className="w-3.5 h-3.5 text-amber-600" />
              <span>Automatic IST Status Criteria:</span>
            </p>
            <p>• <strong>Upcoming:</strong> Current IST date is earlier than Start Date</p>
            <p>• <strong>Active:</strong> Current IST date is on or between Start Date and End Date</p>
            <p>• <strong>Expired:</strong> Current IST date is after End Date (Cannot be extended; requires renewal)</p>
          </div>
        </div>

        {/* Card 5: Public Content & Attachments with Required Warning Banner */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-3 flex items-center gap-2">
            <Upload className="w-4 h-4 text-amber-600" />
            <span>Public Information & Attachments</span>
          </h2>

          {/* PRD Mandatory Public Warning Alert (Section 11.2 & Section 16) */}
          <div className="p-4 rounded-xl bg-amber-50/90 border-2 border-amber-300 text-amber-950 text-xs flex items-start gap-3 shadow-xs">
            <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <strong className="font-bold text-amber-900 block text-sm mb-0.5">
                Notice: Public Visibility Policy
              </strong>
              Because attachments, descriptions, and remarks are public by requirement, upload only content intended for public access. Agent mobile numbers and administrative logs remain private.
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Token Description (Public)
            </label>
            <textarea
              rows={3}
              value={tokenDescription}
              onChange={e => setTokenDescription(e.target.value)}
              placeholder="Brief summary of the token purpose, scope or service authorization..."
              className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#2D3774] text-slate-900 placeholder:text-slate-400"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Notes & Remarks (Public)
            </label>
            <textarea
              rows={2}
              value={notesAndRemarks}
              onChange={e => setNotesAndRemarks(e.target.value)}
              placeholder="Special instructions, reference notes, or public remarks..."
              className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#2D3774] text-slate-900 placeholder:text-slate-400"
            />
          </div>

          {/* Attachments Section */}
          <div className="pt-2">
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              Attach Documents (PDF, JPG, PNG up to 10 MB each)
            </label>

            <div className="flex items-center gap-3">
              <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-lg border border-slate-300 transition-colors shadow-2xs">
                <Upload className="w-4 h-4 text-amber-600" />
                <span>{uploading ? 'Uploading...' : 'Choose Files to Attach'}</span>
                <input
                  type="file"
                  multiple
                  accept=".pdf,image/jpeg,image/png"
                  onChange={handleFileUpload}
                  disabled={uploading}
                  className="hidden"
                />
              </label>
              <span className="text-[11px] text-slate-500">
                Multiple attachments supported.
              </span>
            </div>

            {/* Attachment Chips */}
            {attachments.length > 0 && (
              <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                {attachments.map((att, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg border border-slate-200 text-xs"
                  >
                    <div className="flex items-center space-x-2 truncate mr-2">
                      {att.file_type.includes('pdf') ? (
                        <FileText className="w-4 h-4 text-rose-600 shrink-0" />
                      ) : (
                        <ImageIcon className="w-4 h-4 text-blue-600 shrink-0" />
                      )}
                      <span className="font-medium text-slate-800 truncate">
                        {att.file_name}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono shrink-0">
                        ({(att.file_size / 1024).toFixed(0)} KB)
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveAttachment(idx)}
                      className="p-1 text-slate-400 hover:text-rose-600 rounded"
                      aria-label="Remove attachment"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Submit Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-5 py-2.5 text-xs font-medium text-slate-700 hover:text-slate-900 rounded-xl hover:bg-slate-100 transition-colors"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={submitting || uploading}
            className="inline-flex items-center gap-2 px-6 py-2.5 text-xs font-semibold text-white bg-[#2D3774] hover:bg-[#222B5C] rounded-xl shadow-md transition-all disabled:opacity-50 cursor-pointer"
          >
            <Save className="w-4 h-4 text-blue-200" />
            <span>
              {submitting
                ? 'Saving Record...'
                : isEdit
                ? 'Save Changes'
                : renewalDraft
                ? 'Issue Renewal Token'
                : 'Save Token Record'}
            </span>
          </button>
        </div>
      </form>

      {/* Inline Agent Creation Modal */}
      <AgentModal
        isOpen={isAgentModalOpen}
        onClose={() => setIsAgentModalOpen(false)}
        onSuccess={handleAgentCreated}
      />

      {/* Inline Property Creation Modal */}
      <PropertyModal
        isOpen={isPropertyModalOpen}
        onClose={() => setIsPropertyModalOpen(false)}
        onSuccess={handlePropertyCreated}
      />
    </>
  );
}
