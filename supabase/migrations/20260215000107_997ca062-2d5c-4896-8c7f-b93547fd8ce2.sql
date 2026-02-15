
-- ============================================
-- SAVED REPORTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.saved_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  report_name TEXT NOT NULL,
  report_type TEXT NOT NULL DEFAULT 'custom',
  filters JSONB DEFAULT '{}'::jsonb,
  columns JSONB DEFAULT '[]'::jsonb,
  date_range JSONB DEFAULT '{}'::jsonb,
  is_scheduled BOOLEAN DEFAULT false,
  schedule_frequency TEXT,
  schedule_day INTEGER,
  schedule_time TIME DEFAULT '09:00:00',
  last_run_at TIMESTAMP WITH TIME ZONE,
  next_run_at TIMESTAMP WITH TIME ZONE,
  is_shared BOOLEAN DEFAULT false,
  shared_with UUID[] DEFAULT ARRAY[]::UUID[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_saved_reports_user ON public.saved_reports(user_id, created_at DESC);

-- ============================================
-- REPORT EXECUTIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.report_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID REFERENCES public.saved_reports(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  status TEXT DEFAULT 'running',
  result_data JSONB,
  row_count INTEGER,
  file_url TEXT,
  execution_time_ms INTEGER,
  error_message TEXT,
  executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_report_executions_report ON public.report_executions(report_id, executed_at DESC);
CREATE INDEX idx_report_executions_user ON public.report_executions(user_id, executed_at DESC);

-- ============================================
-- RLS POLICIES
-- ============================================
ALTER TABLE public.saved_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own reports"
  ON public.saved_reports FOR ALL
  TO authenticated
  USING (auth.uid() = user_id OR auth.uid() = ANY(shared_with))
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Managers view all reports"
  ON public.saved_reports FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('manager', 'super_admin'))
  );

ALTER TABLE public.report_executions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own executions"
  ON public.report_executions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users create executions"
  ON public.report_executions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- ============================================
-- ANALYTICS HELPER FUNCTIONS
-- ============================================

-- Get Activity Trends
CREATE OR REPLACE FUNCTION public.get_activity_trends(
  p_user_id UUID DEFAULT NULL,
  p_start_date TIMESTAMP DEFAULT NOW() - INTERVAL '30 days',
  p_end_date TIMESTAMP DEFAULT NOW(),
  p_grouping TEXT DEFAULT 'day'
)
RETURNS TABLE(
  period TEXT,
  total_activities BIGINT,
  total_points BIGINT,
  calls_count BIGINT,
  emails_count BIGINT,
  meetings_count BIGINT,
  unique_contacts BIGINT
) AS $$
BEGIN
  IF p_grouping = 'day' THEN
    RETURN QUERY
    SELECT
      TO_CHAR(a.completed_at, 'YYYY-MM-DD'),
      COUNT(*)::BIGINT,
      COALESCE(SUM(a.points), 0)::BIGINT,
      COUNT(*) FILTER (WHERE a.activity_type = 'call')::BIGINT,
      COUNT(*) FILTER (WHERE a.activity_type = 'email')::BIGINT,
      COUNT(*) FILTER (WHERE a.activity_type = 'meeting')::BIGINT,
      COUNT(DISTINCT a.contact_id)::BIGINT
    FROM public.activities a
    WHERE (p_user_id IS NULL OR a.user_id = p_user_id)
      AND a.completed_at BETWEEN p_start_date AND p_end_date
    GROUP BY TO_CHAR(a.completed_at, 'YYYY-MM-DD')
    ORDER BY 1;
  ELSIF p_grouping = 'week' THEN
    RETURN QUERY
    SELECT
      TO_CHAR(a.completed_at, 'IYYY-IW'),
      COUNT(*)::BIGINT,
      COALESCE(SUM(a.points), 0)::BIGINT,
      COUNT(*) FILTER (WHERE a.activity_type = 'call')::BIGINT,
      COUNT(*) FILTER (WHERE a.activity_type = 'email')::BIGINT,
      COUNT(*) FILTER (WHERE a.activity_type = 'meeting')::BIGINT,
      COUNT(DISTINCT a.contact_id)::BIGINT
    FROM public.activities a
    WHERE (p_user_id IS NULL OR a.user_id = p_user_id)
      AND a.completed_at BETWEEN p_start_date AND p_end_date
    GROUP BY TO_CHAR(a.completed_at, 'IYYY-IW')
    ORDER BY 1;
  ELSE
    RETURN QUERY
    SELECT
      TO_CHAR(a.completed_at, 'YYYY-MM'),
      COUNT(*)::BIGINT,
      COALESCE(SUM(a.points), 0)::BIGINT,
      COUNT(*) FILTER (WHERE a.activity_type = 'call')::BIGINT,
      COUNT(*) FILTER (WHERE a.activity_type = 'email')::BIGINT,
      COUNT(*) FILTER (WHERE a.activity_type = 'meeting')::BIGINT,
      COUNT(DISTINCT a.contact_id)::BIGINT
    FROM public.activities a
    WHERE (p_user_id IS NULL OR a.user_id = p_user_id)
      AND a.completed_at BETWEEN p_start_date AND p_end_date
    GROUP BY TO_CHAR(a.completed_at, 'YYYY-MM')
    ORDER BY 1;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Get Compliance Breakdown
CREATE OR REPLACE FUNCTION public.get_compliance_breakdown(
  p_user_id UUID DEFAULT NULL
)
RETURNS TABLE(
  category TEXT,
  total INTEGER,
  completed INTEGER,
  pending INTEGER,
  completion_rate NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  -- Programs compliance
  SELECT
    'Programs'::TEXT,
    COUNT(DISTINCT p.id)::INTEGER,
    COUNT(DISTINCT pa.program_id) FILTER (WHERE pa.acknowledged_at IS NOT NULL)::INTEGER,
    (COUNT(DISTINCT p.id) - COUNT(DISTINCT pa.program_id) FILTER (WHERE pa.acknowledged_at IS NOT NULL))::INTEGER,
    ROUND(
      COUNT(DISTINCT pa.program_id) FILTER (WHERE pa.acknowledged_at IS NOT NULL)::NUMERIC /
      NULLIF(COUNT(DISTINCT p.id), 0) * 100, 2
    )
  FROM public.programs p
  LEFT JOIN public.program_acknowledgments pa ON p.id = pa.program_id
    AND (p_user_id IS NULL OR pa.user_id = p_user_id)
  WHERE p.status = 'published'

  UNION ALL

  -- Policies compliance
  SELECT
    'Policies'::TEXT,
    COUNT(DISTINCT pol.id)::INTEGER,
    COUNT(DISTINCT pola.policy_id) FILTER (WHERE pola.acknowledged_at IS NOT NULL)::INTEGER,
    (COUNT(DISTINCT pol.id) - COUNT(DISTINCT pola.policy_id) FILTER (WHERE pola.acknowledged_at IS NOT NULL))::INTEGER,
    ROUND(
      COUNT(DISTINCT pola.policy_id) FILTER (WHERE pola.acknowledged_at IS NOT NULL)::NUMERIC /
      NULLIF(COUNT(DISTINCT pol.id), 0) * 100, 2
    )
  FROM public.policies pol
  LEFT JOIN public.policy_acknowledgments pola ON pol.id = pola.policy_id
    AND (p_user_id IS NULL OR pola.user_id = p_user_id)
  WHERE pol.status = 'published'

  UNION ALL

  -- Training compliance
  SELECT
    'Training'::TEXT,
    COUNT(DISTINCT cem.id)::INTEGER,
    COUNT(DISTINCT cemc.module_id) FILTER (WHERE cemc.completed_at IS NOT NULL)::INTEGER,
    (COUNT(DISTINCT cem.id) - COUNT(DISTINCT cemc.module_id) FILTER (WHERE cemc.completed_at IS NOT NULL))::INTEGER,
    ROUND(
      COUNT(DISTINCT cemc.module_id) FILTER (WHERE cemc.completed_at IS NOT NULL)::NUMERIC /
      NULLIF(COUNT(DISTINCT cem.id), 0) * 100, 2
    )
  FROM public.continuing_education_modules cem
  LEFT JOIN public.ce_module_completions cemc ON cem.id = cemc.module_id
    AND (p_user_id IS NULL OR cemc.user_id = p_user_id)
  WHERE cem.status = 'published';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Get Team Performance Comparison
CREATE OR REPLACE FUNCTION public.get_team_performance_comparison(
  p_start_date TIMESTAMP DEFAULT NOW() - INTERVAL '30 days',
  p_end_date TIMESTAMP DEFAULT NOW()
)
RETURNS TABLE(
  user_id UUID,
  full_name TEXT,
  total_activities BIGINT,
  total_points BIGINT,
  momentum_score INTEGER,
  current_streak INTEGER,
  rank BIGINT
) AS $$
BEGIN
  RETURN QUERY
  WITH activity_stats AS (
    SELECT
      a.user_id AS uid,
      COUNT(*) as activities,
      COALESCE(SUM(a.points), 0) as points
    FROM public.activities a
    WHERE a.completed_at BETWEEN p_start_date AND p_end_date
    GROUP BY a.user_id
  )
  SELECT
    p.user_id,
    p.full_name,
    COALESCE(ast.activities, 0)::BIGINT,
    COALESCE(ast.points, 0)::BIGINT,
    COALESCE(p.momentum_score, 0)::INTEGER,
    COALESCE(p.current_streak, 0)::INTEGER,
    RANK() OVER (ORDER BY COALESCE(ast.points, 0) DESC)::BIGINT
  FROM public.profiles p
  INNER JOIN public.user_roles ur ON p.user_id = ur.user_id AND ur.role = 'loan_officer'
  LEFT JOIN activity_stats ast ON p.user_id = ast.uid
  ORDER BY 7;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
