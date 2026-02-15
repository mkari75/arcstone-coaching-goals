
-- =====================================================
-- PERFORMANCE OPTIMIZATION INDEXES
-- =====================================================

-- Composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_activities_user_created
ON public.activities(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_activities_contact_type
ON public.activities(contact_id, activity_type);

CREATE INDEX IF NOT EXISTS idx_contacts_user_health
ON public.contacts(user_id, health_status);

CREATE INDEX IF NOT EXISTS idx_daily_power_moves_user_date
ON public.daily_power_moves(user_id, assigned_date DESC);

CREATE INDEX IF NOT EXISTS idx_leaderboard_period_rank
ON public.leaderboard_data(period_type, rank_by_points);

-- Partial indexes for active records
CREATE INDEX IF NOT EXISTS idx_email_sequences_active
ON public.email_sequences(user_id)
WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_sequence_enrollments_active
ON public.sequence_enrollments(user_id, sequence_id)
WHERE status = 'active';

-- Covering indexes for read-heavy queries
CREATE INDEX IF NOT EXISTS idx_contacts_list_view
ON public.contacts(user_id, health_status, last_contact_date);

-- GIN indexes for full-text search
CREATE INDEX IF NOT EXISTS idx_contacts_search
ON public.contacts USING gin(to_tsvector('english', name || ' ' || COALESCE(email, '') || ' ' || COALESCE(notes, '')));

-- Analyze tables for query planner
ANALYZE public.activities;
ANALYZE public.contacts;
ANALYZE public.daily_power_moves;
ANALYZE public.leaderboard_data;
ANALYZE public.email_sequences;
