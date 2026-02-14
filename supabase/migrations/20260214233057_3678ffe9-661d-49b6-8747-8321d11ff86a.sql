
-- Coaching notes table
CREATE TABLE public.coaching_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id UUID NOT NULL,
  loan_officer_id UUID NOT NULL,
  note_type VARCHAR(50) NOT NULL,
  subject VARCHAR(255),
  content TEXT NOT NULL,
  action_items JSONB,
  requires_follow_up BOOLEAN DEFAULT FALSE,
  follow_up_date DATE,
  follow_up_completed BOOLEAN DEFAULT FALSE,
  is_private BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Team alerts table
CREATE TABLE public.team_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  loan_officer_id UUID NOT NULL,
  alert_type VARCHAR(50) NOT NULL,
  severity VARCHAR(20) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  resolved BOOLEAN DEFAULT FALSE,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID,
  resolution_note TEXT,
  triggered_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB
);

-- Indexes
CREATE INDEX idx_coaching_notes_coach_id ON public.coaching_notes(coach_id);
CREATE INDEX idx_coaching_notes_lo_id ON public.coaching_notes(loan_officer_id);
CREATE INDEX idx_coaching_notes_created_at ON public.coaching_notes(created_at DESC);
CREATE INDEX idx_coaching_notes_follow_up ON public.coaching_notes(requires_follow_up, follow_up_date);
CREATE INDEX idx_team_alerts_lo_id ON public.team_alerts(loan_officer_id);
CREATE INDEX idx_team_alerts_resolved ON public.team_alerts(resolved, triggered_at DESC);
CREATE INDEX idx_team_alerts_severity ON public.team_alerts(severity);

-- RLS for coaching_notes
ALTER TABLE public.coaching_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Coaches can view own notes" ON public.coaching_notes
  FOR SELECT USING (auth.uid() = coach_id);

CREATE POLICY "LOs can view non-private notes about them" ON public.coaching_notes
  FOR SELECT USING (auth.uid() = loan_officer_id AND is_private = false);

CREATE POLICY "Admins can view all notes" ON public.coaching_notes
  FOR SELECT USING (has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Coaches can insert notes" ON public.coaching_notes
  FOR INSERT WITH CHECK (
    auth.uid() = coach_id AND
    (has_role(auth.uid(), 'manager') OR has_role(auth.uid(), 'super_admin'))
  );

CREATE POLICY "Coaches can update own notes" ON public.coaching_notes
  FOR UPDATE USING (auth.uid() = coach_id);

CREATE POLICY "Coaches can delete own notes" ON public.coaching_notes
  FOR DELETE USING (auth.uid() = coach_id);

-- Trigger for updated_at
CREATE TRIGGER update_coaching_notes_updated_at
  BEFORE UPDATE ON public.coaching_notes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- RLS for team_alerts
ALTER TABLE public.team_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Managers can view all alerts" ON public.team_alerts
  FOR SELECT USING (has_role(auth.uid(), 'manager') OR has_role(auth.uid(), 'super_admin'));

CREATE POLICY "LOs can view own alerts" ON public.team_alerts
  FOR SELECT USING (auth.uid() = loan_officer_id);

CREATE POLICY "Managers can update alerts" ON public.team_alerts
  FOR UPDATE USING (has_role(auth.uid(), 'manager') OR has_role(auth.uid(), 'super_admin'));

-- Generate team alerts function (adapted for profiles/user_roles instead of users table)
CREATE OR REPLACE FUNCTION public.generate_team_alerts()
RETURNS void AS $$
DECLARE
  v_lo RECORD;
  v_last_activity_date DATE;
  v_daily_completion DECIMAL;
  v_license_expiry DATE;
BEGIN
  FOR v_lo IN
    SELECT ur.user_id AS id FROM public.user_roles ur WHERE ur.role = 'loan_officer'
  LOOP
    -- Check for no recent activity (7 days)
    SELECT MAX(completed_at::DATE) INTO v_last_activity_date
    FROM public.activities WHERE user_id = v_lo.id;

    IF v_last_activity_date IS NULL OR v_last_activity_date < CURRENT_DATE - 7 THEN
      INSERT INTO public.team_alerts (loan_officer_id, alert_type, severity, title, description, metadata)
      VALUES (v_lo.id, 'no_activity', 'warning', 'No Recent Activity', 'No activities logged in the past 7 days',
        jsonb_build_object('last_activity', v_last_activity_date))
      ON CONFLICT DO NOTHING;
    END IF;

    -- Check for low completion rate (60 days)
    SELECT AVG(completion_percentage) INTO v_daily_completion
    FROM public.daily_power_moves
    WHERE user_id = v_lo.id AND assigned_date >= CURRENT_DATE - 60;

    IF v_daily_completion IS NOT NULL AND v_daily_completion < 50 THEN
      INSERT INTO public.team_alerts (loan_officer_id, alert_type, severity, title, description, metadata)
      VALUES (v_lo.id, 'low_completion', 'warning', 'Low Daily Completion Rate',
        format('Completion rate is %.0f%% (last 60 days)', v_daily_completion),
        jsonb_build_object('completion_rate', v_daily_completion))
      ON CONFLICT DO NOTHING;
    END IF;

    -- Check for expiring license (within 30 days)
    SELECT MIN(expiry_date) INTO v_license_expiry
    FROM public.licenses WHERE user_id = v_lo.id AND status = 'active';

    IF v_license_expiry IS NOT NULL AND v_license_expiry <= CURRENT_DATE + 30 THEN
      INSERT INTO public.team_alerts (loan_officer_id, alert_type, severity, title, description, metadata)
      VALUES (v_lo.id, 'license_expiring',
        CASE WHEN v_license_expiry <= CURRENT_DATE + 7 THEN 'critical'
             WHEN v_license_expiry <= CURRENT_DATE + 14 THEN 'warning'
             ELSE 'info' END,
        'License Expiring Soon', format('License expires on %s', v_license_expiry),
        jsonb_build_object('expiry_date', v_license_expiry))
      ON CONFLICT DO NOTHING;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
