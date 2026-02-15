
-- =====================================================
-- STEP 12: ADVANCED INTEGRATIONS DATABASE SCHEMA
-- =====================================================

-- ========== EMAIL INTEGRATION TABLES ==========
CREATE TABLE IF NOT EXISTS public.email_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL DEFAULT 'outlook',
  email_address TEXT NOT NULL,
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  auto_sync_enabled BOOLEAN DEFAULT true,
  sync_frequency_minutes INTEGER DEFAULT 15,
  last_sync_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, email_address)
);

CREATE TABLE IF NOT EXISTS public.email_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  integration_id UUID REFERENCES public.email_integrations(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES public.contacts(id) ON DELETE SET NULL,
  email_id TEXT NOT NULL,
  conversation_id TEXT,
  subject TEXT,
  from_email TEXT NOT NULL,
  from_name TEXT,
  to_emails TEXT[],
  cc_emails TEXT[],
  bcc_emails TEXT[],
  body_content TEXT,
  body_preview TEXT,
  sent_at TIMESTAMPTZ NOT NULL,
  received_at TIMESTAMPTZ,
  is_read BOOLEAN DEFAULT false,
  has_attachments BOOLEAN DEFAULT false,
  importance TEXT,
  direction TEXT NOT NULL,
  categories TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, email_id)
);

CREATE TABLE IF NOT EXISTS public.email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  category TEXT,
  is_shared BOOLEAN DEFAULT false,
  use_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.email_drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES public.contacts(id) ON DELETE SET NULL,
  subject TEXT,
  body TEXT,
  to_emails TEXT[],
  cc_emails TEXT[],
  bcc_emails TEXT[],
  template_id UUID REFERENCES public.email_templates(id) ON DELETE SET NULL,
  outlook_draft_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.email_sync_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_id UUID NOT NULL REFERENCES public.email_integrations(id) ON DELETE CASCADE,
  sync_started_at TIMESTAMPTZ DEFAULT NOW(),
  sync_completed_at TIMESTAMPTZ,
  messages_fetched INTEGER DEFAULT 0,
  messages_processed INTEGER DEFAULT 0,
  status TEXT NOT NULL,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========== CALENDAR INTEGRATION TABLES ==========
CREATE TABLE IF NOT EXISTS public.calendar_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL DEFAULT 'outlook',
  email_address TEXT NOT NULL,
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  auto_sync_enabled BOOLEAN DEFAULT true,
  sync_frequency_minutes INTEGER DEFAULT 30,
  last_sync_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, email_address)
);

CREATE TABLE IF NOT EXISTS public.calendar_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  integration_id UUID REFERENCES public.calendar_integrations(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES public.contacts(id) ON DELETE SET NULL,
  event_id TEXT NOT NULL,
  subject TEXT NOT NULL,
  description TEXT,
  location TEXT,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  is_all_day BOOLEAN DEFAULT false,
  attendees JSONB,
  organizer_email TEXT,
  meeting_url TEXT,
  is_recurring BOOLEAN DEFAULT false,
  recurrence_pattern JSONB,
  status TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, event_id)
);

CREATE TABLE IF NOT EXISTS public.calendar_sync_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_id UUID NOT NULL REFERENCES public.calendar_integrations(id) ON DELETE CASCADE,
  sync_started_at TIMESTAMPTZ DEFAULT NOW(),
  sync_completed_at TIMESTAMPTZ,
  events_fetched INTEGER DEFAULT 0,
  events_processed INTEGER DEFAULT 0,
  status TEXT NOT NULL,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========== API & WEBHOOKS TABLES ==========
CREATE TABLE IF NOT EXISTS public.api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  key_hash TEXT NOT NULL UNIQUE,
  key_prefix TEXT NOT NULL,
  scopes TEXT[] NOT NULL,
  is_active BOOLEAN DEFAULT true,
  last_used_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  events TEXT[] NOT NULL,
  is_active BOOLEAN DEFAULT true,
  secret TEXT NOT NULL,
  last_triggered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.webhook_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_id UUID NOT NULL REFERENCES public.webhooks(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  response_status INTEGER,
  response_body TEXT,
  delivered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.sync_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  job_type TEXT NOT NULL,
  job_data JSONB,
  status TEXT NOT NULL DEFAULT 'pending',
  attempts INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 3,
  error_message TEXT,
  scheduled_at TIMESTAMPTZ DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========== INDEXES ==========
CREATE INDEX idx_email_integrations_user ON public.email_integrations(user_id);
CREATE INDEX idx_email_activities_user ON public.email_activities(user_id);
CREATE INDEX idx_email_activities_contact ON public.email_activities(contact_id);
CREATE INDEX idx_email_activities_sent_at ON public.email_activities(sent_at DESC);
CREATE INDEX idx_email_templates_user ON public.email_templates(user_id);
CREATE INDEX idx_email_drafts_user ON public.email_drafts(user_id);
CREATE INDEX idx_calendar_integrations_user ON public.calendar_integrations(user_id);
CREATE INDEX idx_calendar_events_user ON public.calendar_events(user_id);
CREATE INDEX idx_calendar_events_contact ON public.calendar_events(contact_id);
CREATE INDEX idx_calendar_events_start_time ON public.calendar_events(start_time);
CREATE INDEX idx_api_keys_user ON public.api_keys(user_id);
CREATE INDEX idx_api_keys_hash ON public.api_keys(key_hash);
CREATE INDEX idx_webhooks_user ON public.webhooks(user_id);
CREATE INDEX idx_webhook_deliveries_webhook ON public.webhook_deliveries(webhook_id);
CREATE INDEX idx_sync_queue_user ON public.sync_queue(user_id);
CREATE INDEX idx_sync_queue_status ON public.sync_queue(status);

-- ========== RLS ==========
ALTER TABLE public.email_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_sync_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calendar_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calendar_sync_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sync_queue ENABLE ROW LEVEL SECURITY;

-- Email policies
CREATE POLICY email_integrations_own ON public.email_integrations FOR ALL USING (auth.uid() = user_id);
CREATE POLICY email_activities_own ON public.email_activities FOR ALL USING (auth.uid() = user_id);
CREATE POLICY email_templates_own ON public.email_templates FOR ALL USING (auth.uid() = user_id);
CREATE POLICY email_templates_shared_read ON public.email_templates FOR SELECT USING (is_shared = true);
CREATE POLICY email_drafts_own ON public.email_drafts FOR ALL USING (auth.uid() = user_id);
CREATE POLICY email_sync_log_own ON public.email_sync_log FOR SELECT USING (
  auth.uid() IN (SELECT user_id FROM public.email_integrations WHERE id = integration_id)
);

-- Calendar policies
CREATE POLICY calendar_integrations_own ON public.calendar_integrations FOR ALL USING (auth.uid() = user_id);
CREATE POLICY calendar_events_own ON public.calendar_events FOR ALL USING (auth.uid() = user_id);
CREATE POLICY calendar_sync_log_own ON public.calendar_sync_log FOR SELECT USING (
  auth.uid() IN (SELECT user_id FROM public.calendar_integrations WHERE id = integration_id)
);

-- API & Webhooks policies
CREATE POLICY api_keys_own ON public.api_keys FOR ALL USING (auth.uid() = user_id);
CREATE POLICY webhooks_own ON public.webhooks FOR ALL USING (auth.uid() = user_id);
CREATE POLICY webhook_deliveries_own ON public.webhook_deliveries FOR SELECT USING (
  auth.uid() IN (SELECT user_id FROM public.webhooks WHERE id = webhook_id)
);
CREATE POLICY sync_queue_own ON public.sync_queue FOR ALL USING (auth.uid() = user_id);

-- ========== TRIGGERS ==========
CREATE TRIGGER update_email_integrations_updated_at BEFORE UPDATE ON public.email_integrations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_email_activities_updated_at BEFORE UPDATE ON public.email_activities
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_email_templates_updated_at BEFORE UPDATE ON public.email_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_email_drafts_updated_at BEFORE UPDATE ON public.email_drafts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_calendar_integrations_updated_at BEFORE UPDATE ON public.calendar_integrations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_calendar_events_updated_at BEFORE UPDATE ON public.calendar_events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_api_keys_updated_at BEFORE UPDATE ON public.api_keys
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_webhooks_updated_at BEFORE UPDATE ON public.webhooks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ========== HELPER FUNCTIONS ==========
CREATE OR REPLACE FUNCTION increment_template_use_count(template_uuid UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.email_templates
  SET use_count = use_count + 1
  WHERE id = template_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
