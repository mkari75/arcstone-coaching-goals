
-- =====================================================
-- STEP 13: AI FEATURES & AUTOMATION DATABASE SCHEMA
-- =====================================================

-- ========== AI COACHING INSIGHTS ==========
CREATE TABLE IF NOT EXISTS public.ai_coaching_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  insight_type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  priority TEXT NOT NULL,
  category TEXT,
  data_points JSONB,
  recommendations TEXT[],
  is_acknowledged BOOLEAN DEFAULT false,
  acknowledged_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI recommendations for actions
CREATE TABLE IF NOT EXISTS public.ai_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES public.contacts(id) ON DELETE CASCADE,
  recommendation_type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  confidence_score DECIMAL(3,2),
  reasoning TEXT,
  suggested_action JSONB,
  is_completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  is_dismissed BOOLEAN DEFAULT false,
  dismissed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI analysis cache
CREATE TABLE IF NOT EXISTS public.ai_analysis_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  analysis_type TEXT NOT NULL,
  cache_key TEXT NOT NULL,
  result JSONB NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, analysis_type, cache_key)
);

-- ========== PREDICTIVE CONTACT HEALTH ==========
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS predicted_close_probability DECIMAL(3,2);
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS churn_risk_score DECIMAL(3,2);
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS recommended_touch_frequency INTEGER;
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS preferred_communication_channel TEXT;
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS next_best_action TEXT;
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS prediction_last_updated TIMESTAMPTZ;

-- ========== EMAIL AUTOMATION SEQUENCES ==========
CREATE TABLE IF NOT EXISTS public.email_sequences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  trigger_type TEXT NOT NULL,
  trigger_conditions JSONB,
  is_active BOOLEAN DEFAULT true,
  total_steps INTEGER DEFAULT 0,
  total_enrolled INTEGER DEFAULT 0,
  total_completed INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Individual steps in a sequence
CREATE TABLE IF NOT EXISTS public.sequence_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sequence_id UUID NOT NULL REFERENCES public.email_sequences(id) ON DELETE CASCADE,
  step_number INTEGER NOT NULL,
  name TEXT NOT NULL,
  delay_days INTEGER NOT NULL DEFAULT 0,
  delay_hours INTEGER DEFAULT 0,
  template_id UUID REFERENCES public.email_templates(id) ON DELETE SET NULL,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  send_time TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(sequence_id, step_number)
);

-- Contacts enrolled in sequences
CREATE TABLE IF NOT EXISTS public.sequence_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sequence_id UUID NOT NULL REFERENCES public.email_sequences(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  current_step INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active',
  enrolled_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  paused_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(sequence_id, contact_id)
);

-- Email sends from sequences
CREATE TABLE IF NOT EXISTS public.sequence_email_sends (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id UUID NOT NULL REFERENCES public.sequence_enrollments(id) ON DELETE CASCADE,
  step_id UUID NOT NULL REFERENCES public.sequence_steps(id) ON DELETE CASCADE,
  email_activity_id UUID REFERENCES public.email_activities(id) ON DELETE SET NULL,
  scheduled_at TIMESTAMPTZ NOT NULL,
  sent_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'scheduled',
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========== SMART REMINDERS ==========
CREATE TABLE IF NOT EXISTS public.smart_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES public.contacts(id) ON DELETE CASCADE,
  reminder_type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  priority TEXT DEFAULT 'medium',
  remind_at TIMESTAMPTZ NOT NULL,
  is_completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  is_snoozed BOOLEAN DEFAULT false,
  snoozed_until TIMESTAMPTZ,
  created_by TEXT DEFAULT 'ai',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========== ACTIVITY SUMMARIES ==========
CREATE TABLE IF NOT EXISTS public.activity_summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  period_type TEXT NOT NULL,
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  summary_text TEXT NOT NULL,
  highlights TEXT[],
  key_metrics JSONB,
  recommendations TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, period_type, period_start)
);

-- ========== INDEXES ==========
CREATE INDEX idx_ai_coaching_insights_user ON public.ai_coaching_insights(user_id);
CREATE INDEX idx_ai_coaching_insights_type ON public.ai_coaching_insights(insight_type);
CREATE INDEX idx_ai_coaching_insights_priority ON public.ai_coaching_insights(priority);
CREATE INDEX idx_ai_coaching_insights_acknowledged ON public.ai_coaching_insights(is_acknowledged);

CREATE INDEX idx_ai_recommendations_user ON public.ai_recommendations(user_id);
CREATE INDEX idx_ai_recommendations_contact ON public.ai_recommendations(contact_id);
CREATE INDEX idx_ai_recommendations_completed ON public.ai_recommendations(is_completed);
CREATE INDEX idx_ai_recommendations_dismissed ON public.ai_recommendations(is_dismissed);

CREATE INDEX idx_ai_analysis_cache_user ON public.ai_analysis_cache(user_id);
CREATE INDEX idx_ai_analysis_cache_key ON public.ai_analysis_cache(user_id, analysis_type, cache_key);
CREATE INDEX idx_ai_analysis_cache_expires ON public.ai_analysis_cache(expires_at);

CREATE INDEX idx_contacts_predicted_probability ON public.contacts(predicted_close_probability);
CREATE INDEX idx_contacts_churn_risk ON public.contacts(churn_risk_score);
CREATE INDEX idx_contacts_prediction_updated ON public.contacts(prediction_last_updated);

CREATE INDEX idx_email_sequences_user ON public.email_sequences(user_id);
CREATE INDEX idx_email_sequences_active ON public.email_sequences(is_active);

CREATE INDEX idx_sequence_steps_sequence ON public.sequence_steps(sequence_id);
CREATE INDEX idx_sequence_steps_number ON public.sequence_steps(sequence_id, step_number);

CREATE INDEX idx_sequence_enrollments_sequence ON public.sequence_enrollments(sequence_id);
CREATE INDEX idx_sequence_enrollments_contact ON public.sequence_enrollments(contact_id);
CREATE INDEX idx_sequence_enrollments_status ON public.sequence_enrollments(status);

CREATE INDEX idx_sequence_email_sends_enrollment ON public.sequence_email_sends(enrollment_id);
CREATE INDEX idx_sequence_email_sends_scheduled ON public.sequence_email_sends(scheduled_at);
CREATE INDEX idx_sequence_email_sends_status ON public.sequence_email_sends(status);

CREATE INDEX idx_smart_reminders_user ON public.smart_reminders(user_id);
CREATE INDEX idx_smart_reminders_contact ON public.smart_reminders(contact_id);
CREATE INDEX idx_smart_reminders_remind_at ON public.smart_reminders(remind_at);
CREATE INDEX idx_smart_reminders_completed ON public.smart_reminders(is_completed);

CREATE INDEX idx_activity_summaries_user ON public.activity_summaries(user_id);
CREATE INDEX idx_activity_summaries_period ON public.activity_summaries(period_type, period_start);

-- ========== RLS POLICIES ==========
ALTER TABLE public.ai_coaching_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_analysis_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_sequences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sequence_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sequence_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sequence_email_sends ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.smart_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_summaries ENABLE ROW LEVEL SECURITY;

CREATE POLICY ai_coaching_insights_own ON public.ai_coaching_insights FOR ALL USING (auth.uid() = user_id);
CREATE POLICY ai_recommendations_own ON public.ai_recommendations FOR ALL USING (auth.uid() = user_id);
CREATE POLICY ai_analysis_cache_own ON public.ai_analysis_cache FOR ALL USING (auth.uid() = user_id);
CREATE POLICY email_sequences_own ON public.email_sequences FOR ALL USING (auth.uid() = user_id);
CREATE POLICY sequence_steps_own ON public.sequence_steps FOR ALL USING (auth.uid() IN (SELECT user_id FROM public.email_sequences WHERE id = sequence_id));
CREATE POLICY sequence_enrollments_own ON public.sequence_enrollments FOR ALL USING (auth.uid() = user_id);
CREATE POLICY sequence_email_sends_own ON public.sequence_email_sends FOR ALL USING (
  auth.uid() IN (SELECT se.user_id FROM public.sequence_enrollments se WHERE se.id = enrollment_id)
);
CREATE POLICY smart_reminders_own ON public.smart_reminders FOR ALL USING (auth.uid() = user_id);
CREATE POLICY activity_summaries_own ON public.activity_summaries FOR ALL USING (auth.uid() = user_id);

-- ========== TRIGGERS ==========
CREATE TRIGGER update_ai_coaching_insights_updated_at BEFORE UPDATE ON public.ai_coaching_insights
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ai_recommendations_updated_at BEFORE UPDATE ON public.ai_recommendations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_email_sequences_updated_at BEFORE UPDATE ON public.email_sequences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sequence_steps_updated_at BEFORE UPDATE ON public.sequence_steps
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sequence_enrollments_updated_at BEFORE UPDATE ON public.sequence_enrollments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_smart_reminders_updated_at BEFORE UPDATE ON public.smart_reminders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ========== HELPER FUNCTIONS ==========

-- Function to enroll contact in sequence
CREATE OR REPLACE FUNCTION enroll_in_sequence(
  p_sequence_id UUID,
  p_contact_id UUID,
  p_user_id UUID
)
RETURNS UUID AS $$
DECLARE
  v_enrollment_id UUID;
  v_first_step RECORD;
  v_send_time TIMESTAMPTZ;
BEGIN
  INSERT INTO public.sequence_enrollments (
    sequence_id, contact_id, user_id, status
  ) VALUES (
    p_sequence_id, p_contact_id, p_user_id, 'active'
  )
  ON CONFLICT (sequence_id, contact_id) DO UPDATE
  SET status = 'active',
      current_step = 0,
      enrolled_at = NOW(),
      updated_at = NOW()
  RETURNING id INTO v_enrollment_id;

  SELECT * INTO v_first_step
  FROM public.sequence_steps
  WHERE sequence_id = p_sequence_id
  AND step_number = 1;

  IF v_first_step.id IS NOT NULL THEN
    v_send_time := NOW() + (v_first_step.delay_days || ' days')::INTERVAL +
                   (v_first_step.delay_hours || ' hours')::INTERVAL;

    INSERT INTO public.sequence_email_sends (
      enrollment_id, step_id, scheduled_at, status
    ) VALUES (
      v_enrollment_id, v_first_step.id, v_send_time, 'scheduled'
    );
  END IF;

  UPDATE public.email_sequences
  SET total_enrolled = total_enrolled + 1
  WHERE id = p_sequence_id;

  RETURN v_enrollment_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function to process sequence queue
CREATE OR REPLACE FUNCTION process_sequence_queue()
RETURNS TABLE(
  send_id UUID,
  enrollment_id UUID,
  contact_email TEXT,
  subject TEXT,
  body TEXT,
  user_id UUID
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ses.id as send_id,
    ses.enrollment_id,
    c.email as contact_email,
    ss.subject,
    ss.body,
    se.user_id
  FROM public.sequence_email_sends ses
  JOIN public.sequence_enrollments se ON se.id = ses.enrollment_id
  JOIN public.sequence_steps ss ON ss.id = ses.step_id
  JOIN public.contacts c ON c.id = se.contact_id
  WHERE ses.status = 'scheduled'
  AND ses.scheduled_at <= NOW()
  AND se.status = 'active'
  LIMIT 100;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function to calculate contact engagement score
CREATE OR REPLACE FUNCTION calculate_engagement_score(p_contact_id UUID)
RETURNS DECIMAL AS $$
DECLARE
  v_score DECIMAL := 0;
  v_activities_30d INTEGER;
  v_calls_30d INTEGER;
  v_emails_30d INTEGER;
  v_days_since_contact INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_activities_30d
  FROM public.activities
  WHERE contact_id = p_contact_id
  AND created_at > NOW() - INTERVAL '30 days';

  SELECT COUNT(*) INTO v_calls_30d
  FROM public.activities
  WHERE contact_id = p_contact_id
  AND activity_type = 'call'
  AND created_at > NOW() - INTERVAL '30 days';

  SELECT COUNT(*) INTO v_emails_30d
  FROM public.activities
  WHERE contact_id = p_contact_id
  AND activity_type = 'email'
  AND created_at > NOW() - INTERVAL '30 days';

  SELECT COALESCE(
    EXTRACT(EPOCH FROM (NOW() - last_contact_date)) / 86400,
    999
  )::INTEGER INTO v_days_since_contact
  FROM public.contacts
  WHERE id = p_contact_id;

  v_score := v_score + (v_activities_30d * 5);
  v_score := v_score + (v_calls_30d * 10);
  v_score := v_score + (v_emails_30d * 3);

  IF v_days_since_contact > 30 THEN
    v_score := v_score * 0.5;
  ELSIF v_days_since_contact > 14 THEN
    v_score := v_score * 0.75;
  END IF;

  IF v_score > 100 THEN
    v_score := 100;
  END IF;

  RETURN v_score / 100.0;
END;
$$ LANGUAGE plpgsql SET search_path = public;
