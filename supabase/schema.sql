-- =========================================================
-- Royal Services Agent Updates App
-- PostgreSQL / Supabase Schema Definition (PRD v1.0)
-- =========================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. AGENTS TABLE
CREATE TABLE IF NOT EXISTS agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  mobile TEXT NOT NULL, -- Stored in international E.164 / +91 format
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_agents_active ON agents(is_active);
CREATE INDEX IF NOT EXISTS idx_agents_name ON agents(name);

-- 2. PROPERTIES TABLE
CREATE TABLE IF NOT EXISTS properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_properties_active ON properties(is_active);
CREATE INDEX IF NOT EXISTS idx_properties_name ON properties(name);

-- 3. TOKENS TABLE
CREATE TABLE IF NOT EXISTS tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token_number TEXT NOT NULL,
  associate_name TEXT NOT NULL,
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE RESTRICT,
  agent_mobile_number TEXT NOT NULL, -- Private token-specific override
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE RESTRICT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  token_description TEXT,
  notes_and_remarks TEXT,
  status_override TEXT CHECK (status_override IN ('suspended', 'cancelled') OR status_override IS NULL),
  is_archived BOOLEAN NOT NULL DEFAULT false,
  archived_at TIMESTAMPTZ,
  renewal_reference_id UUID REFERENCES tokens(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT chk_dates CHECK (end_date >= start_date)
);

-- Case-insensitive uniqueness constraint across active and archived records
CREATE UNIQUE INDEX IF NOT EXISTS idx_tokens_normalized_number 
  ON tokens (LOWER(TRIM(token_number)));

CREATE INDEX IF NOT EXISTS idx_tokens_status_dates ON tokens(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_tokens_agent_id ON tokens(agent_id);
CREATE INDEX IF NOT EXISTS idx_tokens_property_id ON tokens(property_id);
CREATE INDEX IF NOT EXISTS idx_tokens_archived ON tokens(is_archived);
CREATE INDEX IF NOT EXISTS idx_tokens_renewal ON tokens(renewal_reference_id);

-- 4. ATTACHMENTS TABLE
CREATE TABLE IF NOT EXISTS attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token_id UUID NOT NULL REFERENCES tokens(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL CHECK (file_type IN ('application/pdf', 'image/jpeg', 'image/png')),
  file_size INTEGER NOT NULL CHECK (file_size <= 10485760), -- 10MB limit
  storage_path TEXT NOT NULL,
  is_public BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_attachments_token_id ON attachments(token_id);

-- 5. REMINDERS TABLE
CREATE TABLE IF NOT EXISTS reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token_id UUID NOT NULL REFERENCES tokens(id) ON DELETE CASCADE,
  reminder_type TEXT NOT NULL CHECK (reminder_type IN ('30_day', '15_day', '7_day', 'expiry')),
  scheduled_date DATE NOT NULL,
  attempt_time TIMESTAMPTZ,
  provider_message_id TEXT,
  delivery_status TEXT NOT NULL CHECK (delivery_status IN ('scheduled', 'sent', 'delivered', 'read', 'failed')),
  failure_reason TEXT,
  is_manual_resend BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_reminders_token_id ON reminders(token_id);
CREATE INDEX IF NOT EXISTS idx_reminders_status ON reminders(delivery_status);
CREATE INDEX IF NOT EXISTS idx_reminders_scheduled ON reminders(scheduled_date, reminder_type);

-- Unique index to prevent duplicate automated reminders
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_token_auto_reminder 
  ON reminders (token_id, reminder_type) 
  WHERE is_manual_resend = false;

-- 6. ACTIVITY LOGS TABLE
CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action TEXT NOT NULL,
  target_type TEXT NOT NULL CHECK (target_type IN ('token', 'agent', 'property', 'reminder', 'auth')),
  target_id TEXT NOT NULL,
  summary TEXT NOT NULL,
  details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_activity_logs_created ON activity_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_target ON activity_logs(target_type, target_id);

-- =========================================================
-- Security & Row Level Security (RLS)
-- =========================================================

ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- Note: The Next.js backend uses server-side service role execution
-- or dedicated authenticated session matching harishchandrakgehlot@gmail.com.
-- Public tracking is served strictly via server-side projection excluding agent_mobile_number.
