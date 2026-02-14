
-- Indexes for compliance reporting
CREATE INDEX IF NOT EXISTS idx_program_acks_pending
ON program_acknowledgments(user_id, acknowledged_at)
WHERE acknowledged_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_policy_acks_pending
ON policy_acknowledgments(user_id, acknowledged_at)
WHERE acknowledged_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_programs_active
ON programs(status)
WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_policies_active
ON policies(status)
WHERE status = 'active';

-- Storage bucket for program documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('program-documents', 'program-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Admins can manage program documents
CREATE POLICY "Admins manage program documents"
ON storage.objects FOR ALL
TO authenticated
USING (
  bucket_id = 'program-documents'
  AND public.has_role(auth.uid(), 'super_admin')
);

-- All authenticated users can view program documents
CREATE POLICY "Users view program documents"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'program-documents');

-- Function to get pending acknowledgments for a user
CREATE OR REPLACE FUNCTION public.get_pending_acknowledgments(p_user_id UUID)
RETURNS TABLE(
  item_type TEXT,
  item_id UUID,
  item_title TEXT,
  item_category TEXT,
  effective_date TIMESTAMPTZ,
  days_overdue INTEGER,
  requires_quiz BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  -- Pending programs
  SELECT
    'program'::TEXT,
    p.id,
    p.program_name,
    p.program_type,
    p.published_at,
    GREATEST(0, EXTRACT(DAY FROM NOW() - p.published_at)::INTEGER),
    COALESCE(p.has_quiz, false)
  FROM programs p
  LEFT JOIN program_acknowledgments pa
    ON p.id = pa.program_id AND pa.user_id = p_user_id
  WHERE p.status = 'active'
    AND p.published_at IS NOT NULL
    AND pa.acknowledged_at IS NULL

  UNION ALL

  -- Pending policies
  SELECT
    'policy'::TEXT,
    pol.id,
    pol.policy_name,
    pol.policy_type,
    pol.effective_date::TIMESTAMPTZ,
    GREATEST(0, EXTRACT(DAY FROM NOW() - pol.effective_date)::INTEGER),
    COALESCE(pol.has_quiz, false)
  FROM policies pol
  LEFT JOIN policy_acknowledgments pola
    ON pol.id = pola.policy_id AND pola.user_id = p_user_id
  WHERE pol.status = 'active'
    AND pol.effective_date IS NOT NULL
    AND pola.acknowledged_at IS NULL

  ORDER BY effective_date ASC;
END;
$$;
