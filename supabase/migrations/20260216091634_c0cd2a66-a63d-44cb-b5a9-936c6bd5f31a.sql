
-- Drop existing function with different signature
DROP FUNCTION IF EXISTS calculate_performance_metrics(UUID, INTEGER);

-- Recreate with correct return type
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
  units_goal INTEGER,
  income_goal NUMERIC,
  volume_achievement NUMERIC,
  units_achievement NUMERIC,
  profit_achievement NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_plan RECORD;
  v_weighted_commission NUMERIC;
  v_annual_volume NUMERIC;
  v_annual_units INTEGER;
  v_refinance_pct NUMERIC;
BEGIN
  SELECT * INTO v_plan
  FROM business_plans
  WHERE user_id = p_user_id
    AND plan_year = p_year
    AND status = 'active'
  LIMIT 1;

  IF v_plan IS NULL THEN
    RETURN QUERY SELECT
      0::NUMERIC, 0::INTEGER, 0::NUMERIC, 0::NUMERIC,
      0::NUMERIC, 0::INTEGER, 0::NUMERIC,
      0::NUMERIC, 0::NUMERIC, 0::NUMERIC;
    RETURN;
  END IF;

  v_refinance_pct := 1 - v_plan.purchase_percentage;
  v_weighted_commission := (v_plan.purchase_percentage * (v_plan.purchase_bps / 10000.0))
                         + (v_refinance_pct * (v_plan.refinance_bps / 10000.0));
  
  IF v_weighted_commission > 0 THEN
    v_annual_volume := v_plan.income_goal / v_weighted_commission;
  ELSE
    v_annual_volume := 0;
  END IF;
  
  IF v_plan.avg_loan_amount > 0 THEN
    v_annual_units := ROUND(v_annual_volume / v_plan.avg_loan_amount)::INTEGER;
  ELSE
    v_annual_units := 0;
  END IF;

  RETURN QUERY
  SELECT
    COALESCE(SUM(ap.loan_amount), 0)::NUMERIC AS ytd_volume,
    COUNT(ap.id)::INTEGER AS ytd_units,
    COALESCE(SUM(ap.lo_compensation), 0)::NUMERIC AS ytd_profit,
    CASE 
      WHEN COUNT(ap.id) > 0 THEN
        (COUNT(CASE WHEN ap.transaction_type = 'Purchase' THEN 1 END)::NUMERIC / COUNT(ap.id)::NUMERIC)
      ELSE 0::NUMERIC
    END AS purchase_mix,
    v_annual_volume::NUMERIC AS volume_goal,
    v_annual_units::INTEGER AS units_goal,
    v_plan.income_goal::NUMERIC AS income_goal,
    CASE WHEN v_annual_volume > 0 THEN (COALESCE(SUM(ap.loan_amount), 0) / v_annual_volume * 100)::NUMERIC ELSE 0::NUMERIC END AS volume_achievement,
    CASE WHEN v_annual_units > 0 THEN (COUNT(ap.id)::NUMERIC / v_annual_units * 100)::NUMERIC ELSE 0::NUMERIC END AS units_achievement,
    CASE WHEN v_plan.income_goal > 0 THEN (COALESCE(SUM(ap.lo_compensation), 0) / v_plan.income_goal * 100)::NUMERIC ELSE 0::NUMERIC END AS profit_achievement
  FROM actual_production ap
  WHERE ap.user_id = p_user_id
    AND ap.year = p_year;
END;
$$;

GRANT EXECUTE ON FUNCTION calculate_performance_metrics TO authenticated;

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_actual_production_user_year ON actual_production(user_id, year);
CREATE INDEX IF NOT EXISTS idx_actual_production_quarter ON actual_production(quarter);
CREATE INDEX IF NOT EXISTS idx_actual_production_transaction_type ON actual_production(transaction_type);
CREATE INDEX IF NOT EXISTS idx_plan_revisions_status ON plan_revisions(status);
CREATE INDEX IF NOT EXISTS idx_plan_revisions_original_plan ON plan_revisions(original_plan_id);
CREATE INDEX IF NOT EXISTS idx_business_plans_user_year ON business_plans(user_id, plan_year);
CREATE INDEX IF NOT EXISTS idx_business_plans_status ON business_plans(status);
