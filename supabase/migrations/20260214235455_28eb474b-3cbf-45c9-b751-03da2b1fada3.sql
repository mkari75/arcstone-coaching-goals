
-- ============================================
-- NOTIFICATIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  type TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'normal',
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  action_url TEXT,
  action_label TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  read_at TIMESTAMPTZ,
  dismissed_at TIMESTAMPTZ,
  delivered_in_app BOOLEAN DEFAULT true,
  delivered_email BOOLEAN DEFAULT false,
  delivered_push BOOLEAN DEFAULT false,
  email_sent_at TIMESTAMPTZ,
  email_delivered_at TIMESTAMPTZ,
  email_opened_at TIMESTAMPTZ,
  email_error TEXT,
  related_type TEXT,
  related_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_unread
  ON public.notifications(user_id, read_at)
  WHERE read_at IS NULL AND dismissed_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_notifications_user_created
  ON public.notifications(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notifications_priority
  ON public.notifications(priority, sent_at DESC)
  WHERE read_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_notifications_related
  ON public.notifications(related_type, related_id);

-- ============================================
-- NOTIFICATION PREFERENCES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  email_enabled BOOLEAN DEFAULT true,
  push_enabled BOOLEAN DEFAULT true,
  in_app_enabled BOOLEAN DEFAULT true,
  acknowledgment_reminders BOOLEAN DEFAULT true,
  program_updates BOOLEAN DEFAULT true,
  policy_updates BOOLEAN DEFAULT true,
  training_reminders BOOLEAN DEFAULT true,
  achievement_notifications BOOLEAN DEFAULT true,
  pip_alerts BOOLEAN DEFAULT true,
  manager_escalations BOOLEAN DEFAULT true,
  reminder_frequency TEXT DEFAULT 'daily',
  digest_enabled BOOLEAN DEFAULT false,
  digest_time TIME DEFAULT '09:00:00',
  quiet_hours_enabled BOOLEAN DEFAULT false,
  quiet_hours_start TIME DEFAULT '22:00:00',
  quiet_hours_end TIME DEFAULT '08:00:00',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- REMINDER SCHEDULES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.reminder_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  related_type TEXT NOT NULL,
  related_id UUID NOT NULL,
  reminder_type TEXT NOT NULL,
  scheduled_for TIMESTAMPTZ NOT NULL,
  sent_at TIMESTAMPTZ,
  status TEXT DEFAULT 'pending',
  notification_id UUID REFERENCES public.notifications(id),
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reminder_schedules_pending
  ON public.reminder_schedules(scheduled_for, status)
  WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_reminder_schedules_user
  ON public.reminder_schedules(user_id, related_type, related_id);

-- ============================================
-- MANAGER ESCALATIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.manager_escalations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  loan_officer_id UUID NOT NULL,
  manager_id UUID NOT NULL,
  escalation_type TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'medium',
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  related_type TEXT,
  related_id UUID,
  escalated_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  resolved_by UUID,
  resolution_notes TEXT,
  notification_id UUID REFERENCES public.notifications(id),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_escalations_manager_unresolved
  ON public.manager_escalations(manager_id, resolved_at)
  WHERE resolved_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_escalations_loan_officer
  ON public.manager_escalations(loan_officer_id, escalated_at DESC);

CREATE INDEX IF NOT EXISTS idx_escalations_severity
  ON public.manager_escalations(severity, escalated_at DESC)
  WHERE resolved_at IS NULL;

-- ============================================
-- RLS POLICIES
-- ============================================

-- Notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own notifications"
  ON public.notifications FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users update own notifications"
  ON public.notifications FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert notifications"
  ON public.notifications FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Managers view team notifications"
  ON public.notifications FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'manager') OR public.has_role(auth.uid(), 'super_admin'));

-- Notification Preferences
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own preferences"
  ON public.notification_preferences FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Reminder Schedules
ALTER TABLE public.reminder_schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own reminders"
  ON public.reminder_schedules FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "System manages reminders"
  ON public.reminder_schedules FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'));

-- Manager Escalations
ALTER TABLE public.manager_escalations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View escalations"
  ON public.manager_escalations FOR SELECT TO authenticated
  USING (
    auth.uid() = manager_id OR
    auth.uid() = loan_officer_id OR
    public.has_role(auth.uid(), 'super_admin')
  );

CREATE POLICY "Managers resolve escalations"
  ON public.manager_escalations FOR UPDATE TO authenticated
  USING (
    auth.uid() = manager_id OR
    public.has_role(auth.uid(), 'super_admin')
  );

CREATE POLICY "System creates escalations"
  ON public.manager_escalations FOR INSERT TO authenticated
  WITH CHECK (true);

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Create Notification
CREATE OR REPLACE FUNCTION public.create_notification(
  p_user_id UUID,
  p_type TEXT,
  p_title TEXT,
  p_message TEXT,
  p_priority TEXT DEFAULT 'normal',
  p_action_url TEXT DEFAULT NULL,
  p_action_label TEXT DEFAULT NULL,
  p_related_type TEXT DEFAULT NULL,
  p_related_id UUID DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_notification_id UUID;
  v_in_app BOOLEAN := true;
  v_email BOOLEAN := false;
  v_push BOOLEAN := false;
BEGIN
  -- Get user preferences if they exist
  SELECT in_app_enabled, email_enabled, push_enabled
  INTO v_in_app, v_email, v_push
  FROM public.notification_preferences
  WHERE user_id = p_user_id;

  INSERT INTO public.notifications (
    user_id, type, priority, title, message,
    action_url, action_label, related_type, related_id, metadata,
    delivered_in_app, delivered_email, delivered_push
  ) VALUES (
    p_user_id, p_type, p_priority, p_title, p_message,
    p_action_url, p_action_label, p_related_type, p_related_id, p_metadata,
    COALESCE(v_in_app, true), COALESCE(v_email, false), COALESCE(v_push, false)
  )
  RETURNING id INTO v_notification_id;

  RETURN v_notification_id;
END;
$$;

-- Mark Notification as Read
CREATE OR REPLACE FUNCTION public.mark_notification_read(p_notification_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.notifications
  SET read_at = NOW()
  WHERE id = p_notification_id
  AND read_at IS NULL;
END;
$$;

-- Get Unread Count
CREATE OR REPLACE FUNCTION public.get_unread_count(p_user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*)::INTEGER INTO v_count
  FROM public.notifications
  WHERE user_id = p_user_id
  AND read_at IS NULL
  AND dismissed_at IS NULL;
  RETURN v_count;
END;
$$;

-- ============================================
-- TRIGGERS
-- ============================================
CREATE TRIGGER update_notifications_updated_at
  BEFORE UPDATE ON public.notifications
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_notification_preferences_updated_at
  BEFORE UPDATE ON public.notification_preferences
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_reminder_schedules_updated_at
  BEFORE UPDATE ON public.reminder_schedules
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_manager_escalations_updated_at
  BEFORE UPDATE ON public.manager_escalations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
