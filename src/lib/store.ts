import {
  Agent,
  Property,
  PropertyAddress,
  Token,
  Attachment,
  Reminder,
  ActivityLog,
  PublicTokenView,
  DashboardMetrics,
  TokenStatus,
  ReminderType,
  DeliveryStatus,
  ReminderDepartureRule,
  TemplatePlaceholder,
  TokenRecipient,
} from '@/types';
import {
  INITIAL_AGENTS,
  INITIAL_PROPERTIES,
  INITIAL_TOKENS,
  INITIAL_ATTACHMENTS,
  INITIAL_REMINDERS,
  INITIAL_ACTIVITY_LOGS,
} from './mockData';
import {
  computeTokenStatus,
  getCurrentISTDateString,
  isReminderDueToday,
  isReminderDueTodayForDays,
  formatReadableISTDate,
  getDaysUntilExpiry,
} from './ist';

// Global server-side singleton state for seamless local/preview execution
// preserving changes across Next.js server invocations
// Global server-side singleton state for seamless local/preview execution
// preserving changes across Next.js server invocations
declare global {
  // eslint-disable-next-line no-var
  var __rsStore: {
    agents: Agent[];
    properties: Property[];
    tokens: Token[];
    attachments: Attachment[];
    reminders: Reminder[];
    activityLogs: ActivityLog[];
    departureRules: ReminderDepartureRule[];
  } | undefined;
}

export const AVAILABLE_PLACEHOLDERS: TemplatePlaceholder[] = [
  { key: '{{agent_name}}', label: 'Agent Name', description: 'Assigned agent name', example: 'Ramesh Patel' },
  { key: '{{token_number}}', label: 'Token Number', description: 'Official token identifier', example: 'RS-2026-001' },
  { key: '{{associate_name}}', label: 'Associate / Client', description: 'Client or associate name', example: 'Apex Logistics Ltd' },
  { key: '{{property}}', label: 'Property Name', description: 'Assigned property or site', example: 'Imperial Heights, Mumbai' },
  { key: '{{start_date}}', label: 'Start Date', description: 'Token start date in readable IST format', example: '01 Sep 2026' },
  { key: '{{expiry_date}}', label: 'Expiry Date', description: 'Token expiry date in readable IST format', example: '30 Oct 2026' },
  { key: '{{status}}', label: 'Token Status', description: 'Computed status in uppercase', example: 'ACTIVE' },
  { key: '{{tracking_url}}', label: 'Public Tracking Link', description: 'Direct URL to view/track token', example: 'https://rsagentapp.vercel.app/track/RS-2026-001' },
  { key: '{{days_left}}', label: 'Days Remaining', description: 'Number of calendar days until expiry', example: '30' },
];

export const DEFAULT_DEPARTURE_RULES: ReminderDepartureRule[] = [
  {
    id: '30_day',
    days_before_expiry: 30,
    label: '30-Day Advance Notice',
    is_active: true,
    message_template:
`*Royal Services — 30-Day Advance Notice* 📅

Hello *{{agent_name}}*,

This is a friendly heads-up that your service token is expiring in *30 days*. Now is the perfect time to start your renewal process to avoid any last-minute rush.

*Token Details:*
• Token No: {{token_number}}
• Associate / Client: {{associate_name}}
• Property: {{property}}
• Start Date: {{start_date}}
• Expiry Date: {{expiry_date}}
• Status: {{status}}

📎 View full details & documents:
{{tracking_url}}

Please contact the Royal Services office at your earliest convenience to initiate renewal.

_Royal Services Administration Portal_`,
    meta_template_name: 'royal_services_notification',
    meta_template_language: 'en_US',
  },
  {
    id: '15_day',
    days_before_expiry: 15,
    label: '15-Day Reminder',
    is_active: true,
    message_template:
`*Royal Services — 15-Day Reminder* ⏳

Hello *{{agent_name}}*,

Your service token will expire in *15 days*. Please ensure your renewal paperwork is in progress to avoid any disruption to your services.

*Token Details:*
• Token No: {{token_number}}
• Associate / Client: {{associate_name}}
• Property: {{property}}
• Expiry Date: *{{expiry_date}}*
• Status: {{status}}

📎 Track your token:
{{tracking_url}}

For queries or to submit renewal documents, contact the Royal Services office immediately.

_Royal Services Administration Portal_`,
    meta_template_name: 'royal_services_notification',
    meta_template_language: 'en_US',
  },
  {
    id: '7_day',
    days_before_expiry: 7,
    label: '7-Day Urgent Warning',
    is_active: true,
    message_template:
`*Royal Services — ⚠️ URGENT: 7-Day Expiry Warning*

Hello *{{agent_name}}*,

*ACTION REQUIRED:* Your service token expires in just *7 days*. Failure to renew before the expiry date may result in suspension of associated services.

*Token Details:*
• Token No: {{token_number}}
• Associate / Client: {{associate_name}}
• Property: {{property}}
• Expiry Date: *{{expiry_date}}* ⚠️
• Status: {{status}}

📎 Track your token:
{{tracking_url}}

⚡ Please visit the Royal Services office *today* or contact us urgently to complete your renewal before the deadline.

_Royal Services Administration Portal_`,
    meta_template_name: 'royal_services_notification',
    meta_template_language: 'en_US',
  },
  {
    id: 'expiry',
    days_before_expiry: 0,
    label: 'Expiry Day Final Notice',
    is_active: true,
    message_template:
`*Royal Services — 🚨 FINAL NOTICE: Token Expires TODAY*

Hello *{{agent_name}}*,

Your service token has *expired today* or expires at end of day. Immediate action is required to prevent service interruption.

*Token Details:*
• Token No: {{token_number}}
• Associate / Client: {{associate_name}}
• Property: {{property}}
• Expiry Date: *{{expiry_date}}* 🚨
• Status: {{status}}

📎 Track your token:
{{tracking_url}}

🚨 *Please contact the Royal Services office IMMEDIATELY* to process your renewal and avoid service suspension.

_Royal Services Administration Portal_`,
    meta_template_name: 'royal_services_notification',
    meta_template_language: 'en_US',
  },
];

function getStore() {
  if (!globalThis.__rsStore) {
    globalThis.__rsStore = {
      agents: JSON.parse(JSON.stringify(INITIAL_AGENTS)),
      properties: JSON.parse(JSON.stringify(INITIAL_PROPERTIES)),
      tokens: JSON.parse(JSON.stringify(INITIAL_TOKENS)),
      attachments: JSON.parse(JSON.stringify(INITIAL_ATTACHMENTS)),
      reminders: JSON.parse(JSON.stringify(INITIAL_REMINDERS)),
      activityLogs: JSON.parse(JSON.stringify(INITIAL_ACTIVITY_LOGS)),
      departureRules: JSON.parse(JSON.stringify(DEFAULT_DEPARTURE_RULES)),
    };
  } else if (!globalThis.__rsStore.departureRules) {
    globalThis.__rsStore.departureRules = JSON.parse(JSON.stringify(DEFAULT_DEPARTURE_RULES));
  }
  return globalThis.__rsStore;
}

export function clearStore() {
  globalThis.__rsStore = {
    agents: [],
    properties: [],
    tokens: [],
    attachments: [],
    reminders: [],
    activityLogs: [],
    departureRules: JSON.parse(JSON.stringify(DEFAULT_DEPARTURE_RULES)),
  };
  return globalThis.__rsStore;
}

export interface WhatsAppIntegrationConfig {
  token: string;
  phoneNumberId: string;
  businessAccountId: string;
  businessPhone: string;
}

const storedWhatsAppConfig: Partial<WhatsAppIntegrationConfig> = {
  businessPhone: process.env.META_WHATSAPP_BUSINESS_PHONE || '919819143222',
  phoneNumberId: process.env.META_WHATSAPP_PHONE_NUMBER_ID || '1387005294491815',
  businessAccountId: process.env.META_WHATSAPP_BUSINESS_ACCOUNT_ID || '2150898739182078',
};

export function setWhatsAppConfig(config: Partial<WhatsAppIntegrationConfig>) {
  if (config.token !== undefined) {
    const t = config.token.trim();
    storedWhatsAppConfig.token = (/[^\x20-\x7E]/.test(t) || t.startsWith('❌')) ? '' : t;
  }
  if (config.phoneNumberId !== undefined) storedWhatsAppConfig.phoneNumberId = config.phoneNumberId.trim();
  if (config.businessAccountId !== undefined) storedWhatsAppConfig.businessAccountId = config.businessAccountId.trim();
  if (config.businessPhone !== undefined) storedWhatsAppConfig.businessPhone = config.businessPhone.trim();
}

export function getWhatsAppConfig(): WhatsAppIntegrationConfig {
  const rawToken = storedWhatsAppConfig.token || process.env.META_WHATSAPP_TOKEN || '';
  const cleanToken = (/[^\x20-\x7E]/.test(rawToken) || rawToken.startsWith('❌')) ? '' : rawToken;

  return {
    token: cleanToken,
    phoneNumberId: storedWhatsAppConfig.phoneNumberId || process.env.META_WHATSAPP_PHONE_NUMBER_ID || '1387005294491815',
    businessAccountId: storedWhatsAppConfig.businessAccountId || process.env.META_WHATSAPP_BUSINESS_ACCOUNT_ID || '2150898739182078',
    businessPhone: storedWhatsAppConfig.businessPhone || process.env.META_WHATSAPP_BUSINESS_PHONE || '919819143222',
  };
}

export function setWhatsAppToken(token: string) {
  setWhatsAppConfig({ token });
}

export function getWhatsAppToken(): string {
  return getWhatsAppConfig().token;
}

export function getWhatsAppPhoneNumberId(): string {
  return getWhatsAppConfig().phoneNumberId;
}


// -------------------------------------------------------------
// AGENTS
// -------------------------------------------------------------

export function getAgents(includeInactive = false): Agent[] {
  const store = getStore();
  return store.agents
    .filter(a => includeInactive || a.is_active)
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function getAgentById(id: string): Agent | undefined {
  const store = getStore();
  return store.agents.find(a => a.id === id);
}

export function normalizeAgentMobile(mobile: string): string {
  const digits = mobile.trim().replace(/\D/g, '');
  if (digits.length < 10) {
    throw new Error('Valid 10-digit mobile number is required');
  }
  return `+91${digits.slice(-10)}`;
}

export function createAgent(data: { name: string; mobile: string }): Agent {
  const store = getStore();
  const trimmedName = data.name.trim();
  if (!trimmedName) {
    throw new Error('Agent name is required');
  }

  const cleanMobile = normalizeAgentMobile(data.mobile);

  const existing = store.agents.find(a => a.mobile === cleanMobile);
  if (existing) {
    throw new Error('number already entered');
  }

  const newAgent: Agent = {
    id: `ag-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    name: trimmedName,
    mobile: cleanMobile,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  store.agents.push(newAgent);
  recordActivityLog({
    action: 'agent_created',
    target_type: 'agent',
    target_id: newAgent.id,
    summary: `Created agent ${newAgent.name} (${newAgent.mobile}).`,
  });

  return newAgent;
}

export function updateAgent(id: string, updates: Partial<Pick<Agent, 'name' | 'mobile' | 'is_active'>>): Agent {
  const store = getStore();
  const index = store.agents.findIndex(a => a.id === id);
  if (index === -1) throw new Error('Agent not found');

  const prev = store.agents[index];
  const cleanedUpdates = { ...updates };

  if (cleanedUpdates.mobile) {
    const cleanMobile = normalizeAgentMobile(cleanedUpdates.mobile);
    const duplicate = store.agents.find(a => a.id !== id && a.mobile === cleanMobile);
    if (duplicate) {
      throw new Error('number already entered');
    }
    cleanedUpdates.mobile = cleanMobile;
  }

  if (cleanedUpdates.name) {
    cleanedUpdates.name = cleanedUpdates.name.trim();
    if (!cleanedUpdates.name) {
      throw new Error('Agent name cannot be empty');
    }
  }

  const updated: Agent = {
    ...prev,
    ...cleanedUpdates,
    updated_at: new Date().toISOString(),
  };

  store.agents[index] = updated;
  recordActivityLog({
    action: 'agent_updated',
    target_type: 'agent',
    target_id: updated.id,
    summary: `Updated agent ${updated.name}. Active: ${updated.is_active}. Note: Historical token mobile numbers are preserved.`,
  });

  return updated;
}

export interface BulkImportAgentInput {
  name: string;
  mobile: string;
}

export interface BulkImportResult {
  success: boolean;
  totalRows: number;
  importedCount: number;
  skippedCount: number;
  imported: Agent[];
  errors: Array<{
    row: number;
    name: string;
    mobile: string;
    error: string;
  }>;
}

export function bulkImportAgents(items: BulkImportAgentInput[]): BulkImportResult {
  const store = getStore();
  const imported: Agent[] = [];
  const errors: BulkImportResult['errors'] = [];
  const processedNumbersInBatch = new Set<string>();

  items.forEach((item, idx) => {
    const rowNum = idx + 1;
    const trimmedName = item.name ? item.name.trim() : '';

    if (!trimmedName) {
      errors.push({
        row: rowNum,
        name: trimmedName || 'N/A',
        mobile: item.mobile || 'N/A',
        error: 'Agent name is required',
      });
      return;
    }

    let cleanMobile = '';
    try {
      cleanMobile = normalizeAgentMobile(item.mobile || '');
    } catch {
      errors.push({
        row: rowNum,
        name: trimmedName,
        mobile: item.mobile || 'N/A',
        error: 'Invalid 10-digit mobile number',
      });
      return;
    }

    // Check duplicate within the current batch
    if (processedNumbersInBatch.has(cleanMobile)) {
      errors.push({
        row: rowNum,
        name: trimmedName,
        mobile: cleanMobile,
        error: 'number already entered',
      });
      return;
    }

    // Check duplicate in existing database / store
    const existing = store.agents.find(a => a.mobile === cleanMobile);
    if (existing) {
      errors.push({
        row: rowNum,
        name: trimmedName,
        mobile: cleanMobile,
        error: 'number already entered',
      });
      return;
    }

    // Valid: create agent
    const newAgent: Agent = {
      id: `ag-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      name: trimmedName,
      mobile: cleanMobile,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    store.agents.push(newAgent);
    imported.push(newAgent);
    processedNumbersInBatch.add(cleanMobile);
  });

  if (imported.length > 0) {
    recordActivityLog({
      action: 'agent_created',
      target_type: 'agent',
      target_id: imported[0].id,
      summary: `Bulk imported ${imported.length} agent(s) via CSV (${errors.length} skipped/failed).`,
    });
  }

  return {
    success: true,
    totalRows: items.length,
    importedCount: imported.length,
    skippedCount: errors.length,
    imported,
    errors,
  };
}

export function toggleAgentStatus(id: string): Agent {
  const agent = getAgentById(id);
  if (!agent) throw new Error('Agent not found');
  return updateAgent(id, { is_active: !agent.is_active });
}

// -------------------------------------------------------------
// PROPERTIES
// -------------------------------------------------------------

export function getProperties(includeInactive = false): Property[] {
  const store = getStore();
  return store.properties
    .filter(p => includeInactive || p.is_active)
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function getPropertyById(id: string): Property | undefined {
  const store = getStore();
  return store.properties.find(p => p.id === id);
}

export function findOrCreateProperty(name: string): Property {
  const store = getStore();
  const trimmed = name.trim();
  const existing = store.properties.find(
    p => p.name.toLowerCase() === trimmed.toLowerCase()
  );

  if (existing) {
    if (!existing.is_active) {
      existing.is_active = true;
      existing.updated_at = new Date().toISOString();
    }
    return existing;
  }

  const newProperty: Property = {
    id: `pr-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    name: trimmed,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  store.properties.push(newProperty);
  recordActivityLog({
    action: 'property_created',
    target_type: 'property',
    target_id: newProperty.id,
    summary: `Created property master record: "${newProperty.name}".`,
  });

  return newProperty;
}

export function formatPropertyAddress(addr: PropertyAddress): string {
  const parts = [
    addr.plot_house_no?.trim(),
    addr.address_line_1?.trim(),
    addr.address_line_2?.trim(),
    addr.landmark?.trim() ? `Near ${addr.landmark.trim()}` : undefined,
    addr.city?.trim(),
    addr.state?.trim(),
    addr.postal_code?.trim(),
    addr.country?.trim() || 'India',
  ].filter((p): p is string => Boolean(p && p.length > 0));
  return parts.join(', ');
}

export function createPropertyWithAddress(addr: PropertyAddress & { name?: string }): Property {
  const store = getStore();
  const formattedName = addr.name?.trim() || formatPropertyAddress(addr);
  if (!formattedName) {
    throw new Error('Property address cannot be empty');
  }

  const existing = store.properties.find(
    p => p.name.toLowerCase() === formattedName.toLowerCase()
  );
  if (existing) {
    if (!existing.is_active) {
      existing.is_active = true;
      existing.updated_at = new Date().toISOString();
    }
    existing.plot_house_no = addr.plot_house_no?.trim() || existing.plot_house_no;
    existing.address_line_1 = addr.address_line_1?.trim() || existing.address_line_1;
    existing.address_line_2 = addr.address_line_2?.trim() || existing.address_line_2;
    existing.landmark = addr.landmark?.trim() || existing.landmark;
    existing.city = addr.city?.trim() || existing.city;
    existing.state = addr.state?.trim() || existing.state;
    existing.postal_code = addr.postal_code?.trim() || existing.postal_code;
    existing.country = addr.country?.trim() || existing.country || 'India';
    return existing;
  }

  const newProperty: Property = {
    id: `pr-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    name: formattedName,
    plot_house_no: addr.plot_house_no?.trim(),
    address_line_1: addr.address_line_1?.trim(),
    address_line_2: addr.address_line_2?.trim(),
    landmark: addr.landmark?.trim(),
    city: addr.city?.trim(),
    state: addr.state?.trim(),
    postal_code: addr.postal_code?.trim(),
    country: addr.country?.trim() || 'India',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  store.properties.push(newProperty);
  recordActivityLog({
    action: 'property_created',
    target_type: 'property',
    target_id: newProperty.id,
    summary: `Created property master record: "${newProperty.name}".`,
  });

  return newProperty;
}

export function updateProperty(id: string, updates: Partial<Property>): Property {
  const store = getStore();
  const index = store.properties.findIndex(p => p.id === id);
  if (index === -1) throw new Error('Property not found');

  const prev = store.properties[index];
  const updated: Property = {
    ...prev,
    ...updates,
    updated_at: new Date().toISOString(),
  };

  store.properties[index] = updated;
  recordActivityLog({
    action: 'property_updated',
    target_type: 'property',
    target_id: updated.id,
    summary: `Updated property "${updated.name}". Active: ${updated.is_active}.`,
  });

  return updated;
}

export function togglePropertyStatus(id: string): Property {
  const prop = getPropertyById(id);
  if (!prop) throw new Error('Property not found');
  return updateProperty(id, { is_active: !prop.is_active });
}

// -------------------------------------------------------------
// TOKENS
// -------------------------------------------------------------

export function getTokens(options?: {
  includeArchived?: boolean;
  status?: TokenStatus | 'all';
  search?: string;
  startDate?: string;
  endDate?: string;
  agentId?: string;
  propertyId?: string;
}): Token[] {
  const store = getStore();
  let tokens = store.tokens.map(populateTokenRelations);

  if (!options?.includeArchived) {
    tokens = tokens.filter(t => !t.is_archived);
  }

  if (options?.status && options.status !== 'all') {
    tokens = tokens.filter(t => t.computed_status === options.status);
  }

  if (options?.search) {
    const q = options.search.toLowerCase().trim();
    tokens = tokens.filter(
      t =>
        t.token_number.toLowerCase().includes(q) ||
        t.associate_name.toLowerCase().includes(q) ||
        t.agent?.name.toLowerCase().includes(q) ||
        t.agent_mobile_number.includes(q) ||
        t.property?.name.toLowerCase().includes(q) ||
        (t.token_description && t.token_description.toLowerCase().includes(q))
    );
  }

  if (options?.startDate) {
    tokens = tokens.filter(t => t.start_date >= options.startDate!);
  }

  if (options?.endDate) {
    tokens = tokens.filter(t => t.end_date <= options.endDate!);
  }

  if (options?.agentId) {
    tokens = tokens.filter(t => t.agent_id === options.agentId);
  }

  if (options?.propertyId) {
    tokens = tokens.filter(t => t.property_id === options.propertyId);
  }

  // Sort descending by created_at or start_date
  return tokens.sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
}

export function getArchivedTokens(): Token[] {
  const store = getStore();
  return store.tokens
    .filter(t => t.is_archived)
    .map(populateTokenRelations)
    .sort(
      (a, b) =>
        new Date(b.archived_at || b.updated_at).getTime() -
        new Date(a.archived_at || a.updated_at).getTime()
    );
}

export function getTokenById(id: string): Token | undefined {
  const store = getStore();
  const token = store.tokens.find(t => t.id === id);
  if (!token) return undefined;
  return populateTokenRelations(token);
}

export function getTokenByNumber(tokenNumber: string): Token | undefined {
  const store = getStore();
  const normalized = tokenNumber.trim().toLowerCase();
  const token = store.tokens.find(
    t => t.token_number.trim().toLowerCase() === normalized
  );
  if (!token) return undefined;
  return populateTokenRelations(token);
}

/**
 * Public lookup: strictly sanitizes the token and excludes private fields
 * Archived tokens return null!
 */
export function getPublicToken(tokenNumber: string): PublicTokenView | null {
  const token = getTokenByNumber(tokenNumber);
  if (!token || token.is_archived) {
    return null;
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://rsagentapp.vercel.app';

  return {
    id: token.id,
    token_number: token.token_number,
    associate_name: token.associate_name,
    agent_name: token.agent?.name || 'Assigned Agent',
    property_name: token.property?.name || 'Property',
    start_date: token.start_date,
    end_date: token.end_date,
    computed_status: token.computed_status || 'active',
    token_description: token.token_description,
    notes_and_remarks: token.notes_and_remarks,
    attachments: (token.attachments || [])
      .filter(a => a.is_public)
      .map(a => ({
        id: a.id,
        file_name: a.file_name,
        file_type: a.file_type,
        file_size: a.file_size,
        url: a.storage_path,
      })),
    renewal_chain: {
      previous_token: token.renewal_previous_token
        ? { token_number: token.renewal_previous_token.token_number }
        : null,
      replacement_token: token.renewal_next_token
        ? { token_number: token.renewal_next_token.token_number }
        : null,
    },
    tracking_url: `${appUrl}/track/${encodeURIComponent(token.token_number)}`,
  };
}

export interface CreateTokenInput {
  token_number: string;
  associate_name: string;
  agent_id: string;
  agent_mobile_number?: string;
  assigned_recipients?: TokenRecipient[];
  property_id?: string;
  property_name?: string;
  property_address?: PropertyAddress;
  start_date: string;
  end_date: string;
  token_description?: string;
  notes_and_remarks?: string;
  status_override?: 'suspended' | 'cancelled' | null;
  renewal_reference_id?: string | null;
  attachments?: {
    file_name: string;
    file_type: string;
    file_size: number;
    storage_path: string;
  }[];
}

export function createToken(input: CreateTokenInput): Token {
  const store = getStore();

  const normalizedNumber = input.token_number.trim();
  if (!normalizedNumber) {
    throw new Error('Token number is required');
  }

  // PRD Rule: Duplicate token numbers are rejected across active AND archived records
  const duplicate = store.tokens.find(
    t => t.token_number.trim().toLowerCase() === normalizedNumber.toLowerCase()
  );
  if (duplicate) {
    throw new Error(`Token number "${normalizedNumber}" already exists.`);
  }

  // PRD Rule: End Date cannot be earlier than Start Date
  if (input.end_date < input.start_date) {
    throw new Error('End Date cannot be earlier than Start Date');
  }

  // Resolve Primary Agent
  const agent = store.agents.find(a => a.id === input.agent_id);
  if (!agent) {
    throw new Error('Selected agent does not exist');
  }

  const mobileToUse = input.agent_mobile_number?.trim() || agent.mobile;

  // Resolve multiple assigned recipients
  let recipients: TokenRecipient[] = [];
  if (Array.isArray(input.assigned_recipients) && input.assigned_recipients.length > 0) {
    recipients = input.assigned_recipients
      .filter(r => r && r.mobile && r.mobile.trim())
      .map((r, i) => ({
        id: r.id || `rec-${Date.now()}-${i}`,
        agent_id: r.agent_id || (i === 0 ? agent.id : undefined),
        name: r.name?.trim() || (i === 0 ? agent.name : 'Recipient'),
        mobile: r.mobile.trim(),
        is_primary: Boolean(r.is_primary ?? i === 0),
      }));
  }

  // Default to primary agent if no recipient list provided
  if (recipients.length === 0) {
    recipients = [
      {
        id: `rec-${Date.now()}-0`,
        agent_id: agent.id,
        name: agent.name,
        mobile: mobileToUse,
        is_primary: true,
      },
    ];
  }

  // Resolve Property (Structured Address or property_name or property_id)
  let propertyId = input.property_id;
  if (!propertyId && input.property_address) {
    const prop = createPropertyWithAddress(input.property_address);
    propertyId = prop.id;
  } else if (!propertyId && input.property_name) {
    const prop = findOrCreateProperty(input.property_name);
    propertyId = prop.id;
  }
  if (!propertyId) {
    throw new Error('A valid property is required');
  }


  const newToken: Token = {
    id: `tok-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    token_number: normalizedNumber,
    associate_name: input.associate_name.trim(),
    agent_id: agent.id,
    agent_mobile_number: mobileToUse,
    assigned_recipients: recipients,
    property_id: propertyId,
    start_date: input.start_date,
    end_date: input.end_date,
    token_description: input.token_description?.trim() || null,
    notes_and_remarks: input.notes_and_remarks?.trim() || null,
    status_override: input.status_override || null,
    is_archived: false,
    archived_at: null,
    renewal_reference_id: input.renewal_reference_id || null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  store.tokens.push(newToken);

  // Add attachments if supplied
  if (input.attachments && input.attachments.length > 0) {
    for (const att of input.attachments) {
      store.attachments.push({
        id: `att-${Date.now().toString().slice(-6)}-${Math.random().toString(36).slice(2, 5)}`,
        token_id: newToken.id,
        file_name: att.file_name,
        file_type: att.file_type,
        file_size: att.file_size,
        storage_path: att.storage_path,
        is_public: true,
        created_at: new Date().toISOString(),
      });
    }
  }

  recordActivityLog({
    action: 'token_created',
    target_type: 'token',
    target_id: newToken.token_number,
    summary: `Created token ${newToken.token_number} for "${newToken.associate_name}".`,
    details: {
      agent: agent.name,
      property_id: propertyId,
      start_date: newToken.start_date,
      end_date: newToken.end_date,
      renewal_of: input.renewal_reference_id || null,
    },
  });

  return populateTokenRelations(newToken);
}

export function updateToken(
  id: string,
  updates: Partial<Omit<Token, 'id' | 'created_at' | 'renewal_reference_id'>>
): Token {
  const store = getStore();
  const index = store.tokens.findIndex(t => t.id === id);
  if (index === -1) throw new Error('Token not found');

  const current = store.tokens[index];

  // PRD Rule: An expired token cannot be reactivated by extending its End Date. Renewal requires a new unique token.
  const currentStatus = computeTokenStatus(
    current.start_date,
    current.end_date,
    current.status_override,
    current.is_archived
  );

  if (currentStatus === 'expired' && updates.end_date && updates.end_date > current.end_date) {
    throw new Error(
      'An expired token cannot be reactivated by extending its End Date. Please use "Create Renewal" to issue a new replacement token.'
    );
  }

  // PRD Rule: End Date cannot be earlier than Start Date
  const newStartDate = updates.start_date || current.start_date;
  const newEndDate = updates.end_date || current.end_date;
  if (newEndDate < newStartDate) {
    throw new Error('End Date cannot be earlier than Start Date');
  }

  // If token number is changed, check uniqueness across active and archived
  if (
    updates.token_number &&
    updates.token_number.trim().toLowerCase() !== current.token_number.trim().toLowerCase()
  ) {
    const dup = store.tokens.find(
      t =>
        t.id !== id &&
        t.token_number.trim().toLowerCase() === updates.token_number!.trim().toLowerCase()
    );
    if (dup) {
      throw new Error(`Token number "${updates.token_number}" already exists.`);
    }
  }

  if (updates.assigned_recipients && updates.assigned_recipients.length > 0) {
    const primary = updates.assigned_recipients.find(r => r.is_primary) || updates.assigned_recipients[0];
    if (primary) {
      if (primary.agent_id) updates.agent_id = primary.agent_id;
      if (primary.mobile) updates.agent_mobile_number = primary.mobile;
    }
  }

  const updatedToken: Token = {
    ...current,
    ...updates,
    updated_at: new Date().toISOString(),
  };

  store.tokens[index] = updatedToken;

  recordActivityLog({
    action: 'token_updated',
    target_type: 'token',
    target_id: updatedToken.token_number,
    summary: `Updated token ${updatedToken.token_number}.`,
    details: updates as Record<string, unknown>,
  });

  return populateTokenRelations(updatedToken);
}

export function archiveToken(id: string): Token {
  const store = getStore();
  const token = store.tokens.find(t => t.id === id);
  if (!token) throw new Error('Token not found');

  token.is_archived = true;
  token.archived_at = new Date().toISOString();
  token.updated_at = new Date().toISOString();

  recordActivityLog({
    action: 'token_archived',
    target_type: 'token',
    target_id: token.token_number,
    summary: `Archived token ${token.token_number}. Removed from operational lists and public search.`,
  });

  return populateTokenRelations(token);
}

export function restoreToken(id: string): Token {
  const store = getStore();
  const token = store.tokens.find(t => t.id === id);
  if (!token) throw new Error('Token not found');

  token.is_archived = false;
  token.archived_at = null;
  token.updated_at = new Date().toISOString();

  recordActivityLog({
    action: 'token_restored',
    target_type: 'token',
    target_id: token.token_number,
    summary: `Restored token ${token.token_number} from archive. Recalculated date status and future reminders.`,
  });

  return populateTokenRelations(token);
}

/**
 * Creates a renewal draft from an existing expired or active token
 * Copies associate, agent, token-specific mobile, property, description, notes, and attachments
 */
export function getRenewalDraftData(id: string) {
  const token = getTokenById(id);
  if (!token) throw new Error('Token not found');

  return {
    associate_name: token.associate_name,
    agent_id: token.agent_id,
    agent_mobile_number: token.agent_mobile_number,
    property_id: token.property_id,
    token_description: token.token_description || '',
    notes_and_remarks: token.notes_and_remarks || '',
    renewal_reference_id: token.id,
    prior_token_number: token.token_number,
    attachments: (token.attachments || []).map(a => ({
      file_name: a.file_name,
      file_type: a.file_type,
      file_size: a.file_size,
      storage_path: a.storage_path,
    })),
  };
}

// -------------------------------------------------------------
// ATTACHMENTS
// -------------------------------------------------------------

export function addAttachment(
  tokenId: string,
  attachment: {
    file_name: string;
    file_type: string;
    file_size: number;
    storage_path: string;
  }
): Attachment {
  const store = getStore();
  const token = store.tokens.find(t => t.id === tokenId);
  if (!token) throw new Error('Token not found');

  if (attachment.file_size > 10 * 1024 * 1024) {
    throw new Error('File size exceeds 10 MB limit');
  }

  const newAtt: Attachment = {
    id: `att-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    token_id: tokenId,
    file_name: attachment.file_name,
    file_type: attachment.file_type,
    file_size: attachment.file_size,
    storage_path: attachment.storage_path,
    is_public: true,
    created_at: new Date().toISOString(),
  };

  store.attachments.push(newAtt);
  recordActivityLog({
    action: 'attachment_uploaded',
    target_type: 'token',
    target_id: token.token_number,
    summary: `Uploaded public attachment: ${newAtt.file_name} (${(newAtt.file_size / 1024).toFixed(0)} KB).`,
  });

  return newAtt;
}

export function deleteAttachment(id: string): void {
  const store = getStore();
  const index = store.attachments.findIndex(a => a.id === id);
  if (index !== -1) {
    const att = store.attachments[index];
    store.attachments.splice(index, 1);
    recordActivityLog({
      action: 'attachment_deleted',
      target_type: 'token',
      target_id: att.token_id,
      summary: `Removed attachment: ${att.file_name}.`,
    });
  }
}

// -------------------------------------------------------------
// REMINDERS & WHATSAPP
// -------------------------------------------------------------

export function getRemindersByToken(tokenId: string): Reminder[] {
  const store = getStore();
  return store.reminders
    .filter(r => r.token_id === tokenId)
    .sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
}

export function recordReminderAttempt(data: {
  token_id: string;
  reminder_type: ReminderType;
  delivery_status: DeliveryStatus;
  provider_message_id?: string | null;
  failure_reason?: string | null;
  is_manual_resend?: boolean;
}): Reminder {
  const store = getStore();
  const todayIST = getCurrentISTDateString();

  const reminder: Reminder = {
    id: `rem-${Date.now().toString().slice(-6)}-${Math.random().toString(36).slice(2, 5)}`,
    token_id: data.token_id,
    reminder_type: data.reminder_type,
    scheduled_date: todayIST,
    attempt_time: new Date().toISOString(),
    provider_message_id: data.provider_message_id || null,
    delivery_status: data.delivery_status,
    failure_reason: data.failure_reason || null,
    is_manual_resend: data.is_manual_resend || false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  store.reminders.push(reminder);

  const token = store.tokens.find(t => t.id === data.token_id);
  recordActivityLog({
    action: data.is_manual_resend ? 'whatsapp_manual_resend' : 'whatsapp_attempt',
    target_type: 'reminder',
    target_id: token ? token.token_number : data.token_id,
    summary: `${data.is_manual_resend ? 'Manual resend' : 'Scheduled send'} for ${data.reminder_type} reminder. Result: ${data.delivery_status}.`,
    details: {
      reminder_id: reminder.id,
      provider_message_id: data.provider_message_id,
      error: data.failure_reason,
    },
  });

  return reminder;
}

export function updateReminderDeliveryStatus(
  providerMessageId: string,
  deliveryStatus: DeliveryStatus,
  failureReason?: string
): Reminder | null {
  const store = getStore();
  const reminder = store.reminders.find(
    r => r.provider_message_id === providerMessageId
  );
  if (!reminder) return null;

  reminder.delivery_status = deliveryStatus;
  if (failureReason) reminder.failure_reason = failureReason;
  reminder.updated_at = new Date().toISOString();

  const token = store.tokens.find(t => t.id === reminder.token_id);
  recordActivityLog({
    action: 'whatsapp_status_update',
    target_type: 'reminder',
    target_id: token ? token.token_number : reminder.token_id,
    summary: `WhatsApp status updated to ${deliveryStatus} (Msg ID: ${providerMessageId}).`,
  });

  return reminder;
}

/**
 * Renders custom message template by substituting dynamic placeholders with token data
 */
export function renderTemplateText(templateText: string, token: Partial<Token>, daysLeft?: number): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://rsagentapp.vercel.app';
  const trackingUrl = `${appUrl}/track/${encodeURIComponent(token.token_number || '')}`;
  const agentName = token.agent?.name || 'Agent';
  const tokenNo = token.token_number || 'RS-XXXX';
  const associateName = token.associate_name || 'Client';
  const propertyName = token.property?.name || 'Assigned Property';
  const startDate = token.start_date ? formatReadableISTDate(token.start_date) : '—';
  const endDate = token.end_date ? formatReadableISTDate(token.end_date) : '—';
  const status = token.computed_status?.toUpperCase() || 'ACTIVE';
  const days = daysLeft !== undefined ? String(daysLeft) : (token.end_date ? String(getDaysUntilExpiry(token.end_date)) : '0');

  return templateText
    .replace(/\{\{agent_name\}\}/g, agentName)
    .replace(/\{\{token_number\}\}/g, tokenNo)
    .replace(/\{\{associate_name\}\}/g, associateName)
    .replace(/\{\{property\}\}/g, propertyName)
    .replace(/\{\{start_date\}\}/g, startDate)
    .replace(/\{\{expiry_date\}\}/g, endDate)
    .replace(/\{\{status\}\}/g, status)
    .replace(/\{\{tracking_url\}\}/g, trackingUrl)
    .replace(/\{\{days_left\}\}/g, days);
}

/**
 * Returns all configured departure rules (from store or defaults)
 */
export function getReminderDepartureRules(): ReminderDepartureRule[] {
  const store = getStore();
  if (!store.departureRules || store.departureRules.length === 0) {
    store.departureRules = JSON.parse(JSON.stringify(DEFAULT_DEPARTURE_RULES));
  }
  return store.departureRules;
}

/**
 * Retrieves a single departure rule by ID (e.g. '30_day', '15_day', '7_day', 'expiry', or custom)
 */
export function getDepartureRuleById(id: string): ReminderDepartureRule | undefined {
  const rules = getReminderDepartureRules();
  return rules.find(r => r.id === id);
}

/**
 * Saves and updates the reminder departure rules schedule and templates
 */
export function saveReminderDepartureRules(rules: ReminderDepartureRule[]): ReminderDepartureRule[] {
  const store = getStore();
  store.departureRules = rules.map(r => ({
    ...r,
    updated_at: new Date().toISOString(),
  }));
  recordActivityLog({
    action: 'update_departure_rules',
    target_type: 'reminder',
    target_id: 'system',
    summary: `Updated WhatsApp reminder departure schedule with ${rules.length} milestone(s).`,
  });
  return store.departureRules;
}

/**
 * Resets departure rules and templates to initial system defaults
 */
export function resetReminderDepartureRules(): ReminderDepartureRule[] {
  const store = getStore();
  store.departureRules = JSON.parse(JSON.stringify(DEFAULT_DEPARTURE_RULES));
  recordActivityLog({
    action: 'reset_departure_rules',
    target_type: 'reminder',
    target_id: 'system',
    summary: 'Reset WhatsApp reminder departure rules and templates to default.',
  });
  return store.departureRules;
}

/**
 * Runs the daily IST expiry reminder evaluation
 * Evaluates active departure rules dynamically (e.g. 30, 15, 7, 0 days, or custom)
 * Idempotent: Does not resend already sent reminders for the current schedule
 */
export async function runDailyReminderEvaluation(senderFn: (token: Token, reminderType: ReminderType) => Promise<{ success: boolean; providerId?: string; error?: string }>) {
  const store = getStore();
  const eligibleTokens = store.tokens
    .filter(t => !t.is_archived && !t.status_override)
    .map(populateTokenRelations);

  const results = [];
  const rules = getReminderDepartureRules().filter(r => r.is_active);

  for (const token of eligibleTokens) {
    for (const rule of rules) {
      if (isReminderDueTodayForDays(token.end_date, rule.days_before_expiry)) {
        // Idempotency check: has this non-manual reminder already been recorded for today/type?
        const alreadySent = store.reminders.some(
          r => r.token_id === token.id && r.reminder_type === rule.id && !r.is_manual_resend
        );

        if (!alreadySent) {
          const sendResult = await senderFn(token, rule.id as ReminderType);
          const rec = recordReminderAttempt({
            token_id: token.id,
            reminder_type: rule.id as ReminderType,
            delivery_status: sendResult.success ? 'sent' : 'failed',
            provider_message_id: sendResult.providerId,
            failure_reason: sendResult.error,
            is_manual_resend: false,
          });
          results.push({ token: token.token_number, reminderType: rule.id, result: rec });
        }
      }
    }
  }

  return results;
}

// -------------------------------------------------------------
// ACTIVITY LOGS
// -------------------------------------------------------------

export function recordActivityLog(data: {
  action: string;
  target_type: 'token' | 'agent' | 'property' | 'reminder' | 'auth';
  target_id: string;
  summary: string;
  details?: Record<string, unknown> | null;
}): ActivityLog {
  const store = getStore();
  const log: ActivityLog = {
    id: `act-${Date.now().toString().slice(-6)}-${Math.random().toString(36).slice(2, 5)}`,
    action: data.action,
    target_type: data.target_type,
    target_id: data.target_id,
    summary: data.summary,
    details: data.details,
    created_at: new Date().toISOString(),
  };

  store.activityLogs.unshift(log);
  return log;
}

export function getActivityLogs(options?: {
  targetType?: string;
  action?: string;
  search?: string;
  limit?: number;
}): ActivityLog[] {
  const store = getStore();
  let logs = [...store.activityLogs];

  if (options?.targetType && options.targetType !== 'all') {
    logs = logs.filter(l => l.target_type === options.targetType);
  }

  if (options?.action && options.action !== 'all') {
    logs = logs.filter(l => l.action.includes(options.action!));
  }

  if (options?.search) {
    const q = options.search.toLowerCase();
    logs = logs.filter(
      l =>
        l.summary.toLowerCase().includes(q) ||
        l.target_id.toLowerCase().includes(q) ||
        l.action.toLowerCase().includes(q)
    );
  }

  if (options?.limit) {
    logs = logs.slice(0, options.limit);
  }

  return logs;
}

// -------------------------------------------------------------
// DASHBOARD METRICS
// -------------------------------------------------------------

export function getDashboardMetrics(): DashboardMetrics {
  const store = getStore();
  const today = getCurrentISTDateString();
  const activeTokens = store.tokens.filter(t => !t.is_archived);

  let activeCount = 0;
  let upcomingCount = 0;
  let expiredCount = 0;
  let suspendedCount = 0;
  let cancelledCount = 0;

  for (const t of activeTokens) {
    const st = computeTokenStatus(t.start_date, t.end_date, t.status_override, false);
    if (st === 'active') activeCount++;
    else if (st === 'upcoming') upcomingCount++;
    else if (st === 'expired') expiredCount++;
    else if (st === 'suspended') suspendedCount++;
    else if (st === 'cancelled') cancelledCount++;
  }

  // Reminders due soon: tokens ending within 30 days that are not expired/suspended/cancelled
  const remindersDueSoon = activeTokens.filter(t => {
    const st = computeTokenStatus(t.start_date, t.end_date, t.status_override, false);
    return (st === 'active' || st === 'upcoming') && t.end_date >= today && t.end_date <= addDays(today, 30);
  }).length;

  const recentFailures = store.reminders.filter(
    r => r.delivery_status === 'failed'
  ).length;

  const recentDeliveries = store.reminders.filter(
    r => r.delivery_status === 'delivered' || r.delivery_status === 'read'
  ).length;

  return {
    total_tokens: activeTokens.length,
    active_tokens: activeCount,
    upcoming_tokens: upcomingCount,
    expired_tokens: expiredCount,
    suspended_tokens: suspendedCount,
    cancelled_tokens: cancelledCount,
    archived_tokens: store.tokens.filter(t => t.is_archived).length,
    total_agents: store.agents.length,
    active_agents: store.agents.filter(a => a.is_active).length,
    reminders_due_soon: remindersDueSoon,
    recent_failures: recentFailures,
    recent_deliveries: recentDeliveries,
  };
}

// -------------------------------------------------------------
// HELPER RELATIONS POPULATION
// -------------------------------------------------------------

function populateTokenRelations(token: Token): Token {
  const store = getStore();
  const agent = store.agents.find(a => a.id === token.agent_id);
  const property = store.properties.find(p => p.id === token.property_id);
  const attachments = store.attachments.filter(a => a.token_id === token.id);

  // Renewal links
  let renewalPrevious = null;
  if (token.renewal_reference_id) {
    const prev = store.tokens.find(t => t.id === token.renewal_reference_id);
    if (prev) {
      renewalPrevious = {
        id: prev.id,
        token_number: prev.token_number,
        end_date: prev.end_date,
      };
    }
  }

  // If another token renews this one
  const nextToken = store.tokens.find(t => t.renewal_reference_id === token.id);
  let renewalNext = null;
  if (nextToken) {
    renewalNext = {
      id: nextToken.id,
      token_number: nextToken.token_number,
      start_date: nextToken.start_date,
    };
  }

  const computed_status = computeTokenStatus(
    token.start_date,
    token.end_date,
    token.status_override,
    token.is_archived
  );

  let recipients = token.assigned_recipients;
  if (!Array.isArray(recipients) || recipients.length === 0) {
    recipients = [
      {
        id: `rec-prim-${token.id}`,
        agent_id: token.agent_id,
        name: agent?.name || 'Assigned Agent',
        mobile: token.agent_mobile_number,
        is_primary: true,
      },
    ];
  }

  return {
    ...token,
    agent,
    assigned_recipients: recipients,
    property,
    attachments,
    renewal_previous_token: renewalPrevious,
    renewal_next_token: renewalNext,
    computed_status,
  };
}

function addDays(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() + days);
  const ny = date.getFullYear();
  const nm = String(date.getMonth() + 1).padStart(2, '0');
  const nd = String(date.getDate()).padStart(2, '0');
  return `${ny}-${nm}-${nd}`;
}
