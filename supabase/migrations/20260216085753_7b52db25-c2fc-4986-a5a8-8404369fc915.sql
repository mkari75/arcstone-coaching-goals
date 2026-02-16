
-- =====================================================
-- GOALS MODULE: BUSINESS PLANNING & PRODUCTION TRACKING
-- =====================================================

-- ========== ENUMS ==========
DO $$ BEGIN
  CREATE TYPE loan_type_enum AS ENUM ('Conventional', 'FHA', 'VA', 'USDA', 'Jumbo', 'Non-QM', 'Other');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE occupancy_enum AS ENUM ('Primary', 'Second Home', 'Investment');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ========== BUSINESS PLANS TABLE ==========
CREATE TABLE IF NOT EXISTS public.business_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_year INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  is_original BOOLEAN DEFAULT true,
  income_goal NUMERIC NOT NULL,
  purchase_bps NUMERIC NOT NULL,
  refinance_bps NUMERIC NOT NULL,
  purchase_percentage NUMERIC NOT NULL,
  avg_loan_amount NUMERIC NOT NULL,
  pull_through_purchase NUMERIC NOT NULL DEFAULT 0.8,
  pull_through_refinance NUMERIC NOT NULL DEFAULT 0.8,
  conversion_rate_purchase NUMERIC DEFAULT 0.5,
  conversion_rate_refinance NUMERIC DEFAULT 0.5,
  leads_from_partners_percentage NUMERIC DEFAULT 0.2,
  leads_per_partner_per_month NUMERIC DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, plan_year, status)
);

-- ========== ACTUAL PRODUCTION TABLE ==========
CREATE TABLE IF NOT EXISTS public.actual_production (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  borrower_full_name TEXT NOT NULL,
  loan_number TEXT NOT NULL,
  loan_amount NUMERIC NOT NULL,
  lo_bps NUMERIC NOT NULL,
  lo_compensation NUMERIC NOT NULL,
  transaction_type TEXT NOT NULL,
  loan_type loan_type_enum DEFAULT 'Conventional',
  occupancy occupancy_enum DEFAULT 'Primary',
  loan_status TEXT DEFAULT 'originated',
  lien_position TEXT,
  close_date DATE NOT NULL,
  year INTEGER NOT NULL,
  quarter INTEGER GENERATED ALWAYS AS (EXTRACT(QUARTER FROM close_date)::INTEGER) STORED,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========== PLAN REVISIONS TABLE ==========
CREATE TABLE IF NOT EXISTS public.plan_revisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  original_plan_id UUID NOT NULL REFERENCES public.business_plans(id) ON DELETE CASCADE,
  requested_by UUID NOT NULL REFERENCES auth.users(id),
  requested_by_name TEXT NOT NULL,
  requested_at TIMESTAMPTZ DEFAULT NOW(),
  lo_justification TEXT NOT NULL,
  effective_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  field_to_change TEXT NOT NULL,
  current_value NUMERIC NOT NULL,
  requested_value NUMERIC NOT NULL,
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  manager_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========== AUDIT ENTRIES TABLE ==========
CREATE TABLE IF NOT EXISTS public.audit_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  loan_officer TEXT NOT NULL,
  action TEXT NOT NULL,
  details TEXT NOT NULL,
  approved_by TEXT,
  lo_justification TEXT,
  manager_notes TEXT,
  field_changes JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========== CHART CONFIGS TABLE ==========
CREATE TABLE IF NOT EXISTS public.chart_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  db_column TEXT NOT NULL,
  categories JSONB NOT NULL,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========== DB COLUMN OPTIONS TABLE ==========
CREATE TABLE IF NOT EXISTS public.db_column_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  column_name TEXT NOT NULL UNIQUE,
  display_label TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========== INDEXES ==========
CREATE INDEX idx_business_plans_user ON public.business_plans(user_id);
CREATE INDEX idx_business_plans_year_status ON public.business_plans(plan_year, status);
CREATE INDEX idx_actual_production_user ON public.actual_production(user_id);
CREATE INDEX idx_actual_production_date ON public.actual_production(close_date);
CREATE INDEX idx_actual_production_year_quarter ON public.actual_production(year, quarter);
CREATE INDEX idx_plan_revisions_plan ON public.plan_revisions(original_plan_id);
CREATE INDEX idx_plan_revisions_status ON public.plan_revisions(status);
CREATE INDEX idx_plan_revisions_requested_by ON public.plan_revisions(requested_by);
CREATE INDEX idx_audit_entries_date ON public.audit_entries(date DESC);
CREATE INDEX idx_audit_entries_lo ON public.audit_entries(loan_officer);
CREATE INDEX idx_chart_configs_active ON public.chart_configs(is_active);

-- ========== RLS ==========
ALTER TABLE public.business_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.actual_production ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plan_revisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chart_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.db_column_options ENABLE ROW LEVEL SECURITY;

-- Business Plans: own access + admin
CREATE POLICY "Users can view own business plans" ON public.business_plans
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own business plans" ON public.business_plans
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own business plans" ON public.business_plans
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins full access business plans" ON public.business_plans
  FOR ALL USING (has_role(auth.uid(), 'super_admin'));

-- Actual Production: own view + admin full
CREATE POLICY "Users can view own production" ON public.actual_production
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins full access production" ON public.actual_production
  FOR ALL USING (has_role(auth.uid(), 'super_admin'));

-- Plan Revisions: own insert/view + admin
CREATE POLICY "Users can insert own revisions" ON public.plan_revisions
  FOR INSERT WITH CHECK (auth.uid() = requested_by);
CREATE POLICY "Users can view own revisions" ON public.plan_revisions
  FOR SELECT USING (auth.uid() = requested_by);
CREATE POLICY "Admins full access revisions" ON public.plan_revisions
  FOR ALL USING (has_role(auth.uid(), 'super_admin'));

-- Audit Entries: managers/admins only
CREATE POLICY "Managers and admins can view audit" ON public.audit_entries
  FOR SELECT USING (has_role(auth.uid(), 'manager') OR has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Managers and admins can insert audit" ON public.audit_entries
  FOR INSERT WITH CHECK (has_role(auth.uid(), 'manager') OR has_role(auth.uid(), 'super_admin'));

-- Chart Configs: everyone reads active, admin modifies
CREATE POLICY "Everyone can read active charts" ON public.chart_configs
  FOR SELECT USING (is_active = true);
CREATE POLICY "Admins full access chart configs" ON public.chart_configs
  FOR ALL USING (has_role(auth.uid(), 'super_admin'));

-- DB Column Options: everyone reads, admin modifies
CREATE POLICY "Everyone can read column options" ON public.db_column_options
  FOR SELECT USING (true);
CREATE POLICY "Admins full access column options" ON public.db_column_options
  FOR ALL USING (has_role(auth.uid(), 'super_admin'));

-- ========== TRIGGERS ==========
CREATE TRIGGER update_business_plans_updated_at
  BEFORE UPDATE ON public.business_plans
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_plan_revisions_updated_at
  BEFORE UPDATE ON public.plan_revisions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_chart_configs_updated_at
  BEFORE UPDATE ON public.chart_configs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ========== HELPER FUNCTION ==========
CREATE OR REPLACE FUNCTION calculate_performance_metrics(
  p_user_id UUID,
  p_year INTEGER DEFAULT EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER
)
RETURNS TABLE(
  ytd_volume NUMERIC,
  ytd_units INTEGER,
  ytd_profit NUMERIC,
  purchase_mix NUMERIC,
  volume_goal NUMERIC,
  units_goal NUMERIC,
  income_goal NUMERIC,
  volume_achievement NUMERIC,
  units_achievement NUMERIC,
  profit_achievement NUMERIC
) AS $$
DECLARE
  v_plan RECORD;
  v_weighted_commission NUMERIC;
BEGIN
  SELECT * INTO v_plan
  FROM public.business_plans
  WHERE user_id = p_user_id AND plan_year = p_year AND status = 'active'
  LIMIT 1;

  IF v_plan IS NULL THEN RETURN; END IF;

  v_weighted_commission := (v_plan.purchase_percentage * v_plan.purchase_bps / 10000) +
    ((1 - v_plan.purchase_percentage) * v_plan.refinance_bps / 10000);

  volume_goal := v_plan.income_goal / v_weighted_commission;
  units_goal := (volume_goal / v_plan.avg_loan_amount)::INTEGER;
  income_goal := v_plan.income_goal;

  SELECT COALESCE(SUM(ap.loan_amount), 0), COUNT(*)::INTEGER,
    COALESCE(SUM(ap.lo_compensation), 0),
    CASE WHEN COUNT(*) > 0 THEN COUNT(*) FILTER (WHERE ap.transaction_type = 'Purchase')::NUMERIC / COUNT(*) ELSE 0 END
  INTO ytd_volume, ytd_units, ytd_profit, purchase_mix
  FROM public.actual_production ap
  WHERE ap.user_id = p_user_id AND ap.year = p_year;

  volume_achievement := CASE WHEN volume_goal > 0 THEN (ytd_volume / volume_goal) * 100 ELSE 0 END;
  units_achievement := CASE WHEN units_goal > 0 THEN (ytd_units::NUMERIC / units_goal) * 100 ELSE 0 END;
  profit_achievement := CASE WHEN income_goal > 0 THEN (ytd_profit / income_goal) * 100 ELSE 0 END;

  RETURN NEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========== SEED DEFAULT DATA ==========
INSERT INTO public.db_column_options (column_name, display_label, sort_order) VALUES
  ('transaction_type', 'Purpose', 1),
  ('loan_type', 'Loan Type', 2),
  ('occupancy', 'Occupancy', 3),
  ('lien_position', 'Lien Position', 4)
ON CONFLICT (column_name) DO NOTHING;

INSERT INTO public.chart_configs (title, db_column, categories, sort_order, is_active) VALUES
  ('Purpose', 'transaction_type', '[{"value": "Purchase", "label": "Purchase"}, {"value": "Refinance", "label": "Refinance"}]'::jsonb, 1, true),
  ('Loan Type', 'loan_type', '[{"value": "Conventional", "label": "Conventional"}, {"value": "FHA", "label": "FHA"}, {"value": "VA", "label": "VA"}, {"value": "USDA", "label": "USDA"}, {"value": "Jumbo", "label": "Jumbo"}, {"value": "Non-QM", "label": "Non-QM"}, {"value": "Other", "label": "Other"}]'::jsonb, 2, true),
  ('Occupancy', 'occupancy', '[{"value": "Primary", "label": "Primary"}, {"value": "Second Home", "label": "Second Home"}, {"value": "Investment", "label": "Investment"}]'::jsonb, 3, true)
ON CONFLICT DO NOTHING;
