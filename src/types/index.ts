export type TokenStatus = 'upcoming' | 'active' | 'expired' | 'suspended' | 'cancelled' | 'archived';

export type StatusOverride = 'suspended' | 'cancelled' | null;

export type ReminderType = '30_day' | '15_day' | '7_day' | 'expiry';

export type DeliveryStatus = 'scheduled' | 'sent' | 'delivered' | 'read' | 'failed';

export interface Agent {
  id: string;
  name: string;
  mobile: string; // E.164 / +91 format
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PropertyAddress {
  plot_house_no?: string;
  address_line_1?: string;
  address_line_2?: string;
  landmark?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
}

export interface Property extends PropertyAddress {
  id: string;
  name: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Attachment {
  id: string;
  token_id: string;
  file_name: string;
  file_type: 'application/pdf' | 'image/jpeg' | 'image/png' | string;
  file_size: number; // in bytes (<= 10MB)
  storage_path: string; // URL or storage path
  is_public: boolean;
  created_at: string;
}

export interface Token {
  id: string;
  token_number: string; // Normalized unique number
  associate_name: string;
  agent_id: string;
  agent_mobile_number: string; // Token-specific override, defaults from agent master (private)
  property_id: string;
  start_date: string; // YYYY-MM-DD
  end_date: string; // YYYY-MM-DD
  token_description?: string | null;
  notes_and_remarks?: string | null;
  status_override?: StatusOverride;
  is_archived: boolean;
  archived_at?: string | null;
  renewal_reference_id?: string | null; // ID of the expired token this renews
  created_at: string;
  updated_at: string;

  // Joined / Virtual fields
  agent?: Agent;
  property?: Property;
  attachments?: Attachment[];
  renewal_previous_token?: {
    id: string;
    token_number: string;
    end_date: string;
  } | null;
  renewal_next_token?: {
    id: string;
    token_number: string;
    start_date: string;
  } | null;
  computed_status?: TokenStatus;
}

// Publicly Visible Token Projection (Strictly NO agent mobile number or internal admin data)
export interface PublicTokenView {
  id: string;
  token_number: string;
  associate_name: string;
  agent_name: string;
  property_name: string;
  start_date: string;
  end_date: string;
  computed_status: TokenStatus;
  token_description?: string | null;
  notes_and_remarks?: string | null;
  attachments: {
    id: string;
    file_name: string;
    file_type: string;
    file_size: number;
    url: string;
  }[];
  renewal_chain?: {
    previous_token?: {
      token_number: string;
    } | null;
    replacement_token?: {
      token_number: string;
    } | null;
  };
  tracking_url: string;
}

export interface Reminder {
  id: string;
  token_id: string;
  reminder_type: ReminderType;
  scheduled_date: string; // YYYY-MM-DD in IST
  attempt_time?: string | null;
  provider_message_id?: string | null;
  delivery_status: DeliveryStatus;
  failure_reason?: string | null;
  is_manual_resend: boolean;
  created_at: string;
  updated_at: string;
  // Join
  token?: Token;
}

export interface ActivityLog {
  id: string;
  action: string;
  target_type: 'token' | 'agent' | 'property' | 'reminder' | 'auth';
  target_id: string;
  summary: string;
  details?: Record<string, unknown> | null;
  created_at: string;
}

export interface DashboardMetrics {
  total_tokens: number;
  active_tokens: number;
  upcoming_tokens: number;
  expired_tokens: number;
  suspended_tokens: number;
  cancelled_tokens: number;
  archived_tokens: number;
  total_agents: number;
  active_agents: number;
  reminders_due_soon: number;
  recent_failures: number;
  recent_deliveries: number;
}

export interface ReminderDepartureRule {
  id: string; // e.g. '30_day', '15_day', '7_day', 'expiry', or 'custom_X'
  days_before_expiry: number; // e.g. 30, 15, 7, 0
  label: string; // e.g. '30-Day Advance Notice'
  is_active: boolean;
  message_template: string;
  meta_template_name?: string;
  meta_template_language?: string;
  updated_at?: string;
}

export interface TemplatePlaceholder {
  key: string;
  label: string;
  description: string;
  example: string;
}
