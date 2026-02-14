
-- Achievements table
CREATE TABLE public.achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(50) NOT NULL,
  icon_name VARCHAR(50),
  color VARCHAR(20),
  criteria JSONB NOT NULL,
  points_bonus INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User achievements (earned)
CREATE TABLE public.user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  achievement_id UUID REFERENCES public.achievements(id) ON DELETE CASCADE NOT NULL,
  earned_at TIMESTAMPTZ DEFAULT NOW(),
  progress_value DECIMAL(10,2),
  celebrated BOOLEAN DEFAULT FALSE,
  celebrated_at TIMESTAMPTZ,
  CONSTRAINT unique_user_achievement UNIQUE(user_id, achievement_id)
);

-- Celebration feed
CREATE TABLE public.celebration_feed (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  celebration_type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  achievement_id UUID REFERENCES public.achievements(id) ON DELETE SET NULL,
  metadata JSONB,
  like_count INTEGER DEFAULT 0,
  comment_count INTEGER DEFAULT 0,
  is_public BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Celebration likes
CREATE TABLE public.celebration_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  celebration_id UUID REFERENCES public.celebration_feed(id) ON DELETE CASCADE NOT NULL,
  user_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_celebration_like UNIQUE(celebration_id, user_id)
);

-- Celebration comments
CREATE TABLE public.celebration_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  celebration_id UUID REFERENCES public.celebration_feed(id) ON DELETE CASCADE NOT NULL,
  user_id UUID NOT NULL,
  comment TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_user_achievements_user_id ON public.user_achievements(user_id);
CREATE INDEX idx_user_achievements_earned_at ON public.user_achievements(earned_at DESC);
CREATE INDEX idx_user_achievements_celebrated ON public.user_achievements(celebrated);
CREATE INDEX idx_celebration_feed_created_at ON public.celebration_feed(created_at DESC);
CREATE INDEX idx_celebration_feed_user_id ON public.celebration_feed(user_id);
CREATE INDEX idx_celebration_likes_celebration_id ON public.celebration_likes(celebration_id);
CREATE INDEX idx_celebration_comments_celebration_id ON public.celebration_comments(celebration_id);

-- Add unique constraint to leaderboard_data for upsert
CREATE UNIQUE INDEX IF NOT EXISTS idx_leaderboard_unique ON public.leaderboard_data(user_id, period_type, period_start);

-- RLS
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.celebration_feed ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.celebration_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.celebration_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "All users can view achievements" ON public.achievements FOR SELECT USING (true);

CREATE POLICY "Users can view own earned achievements" ON public.user_achievements FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "System can insert user achievements" ON public.user_achievements FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own celebration status" ON public.user_achievements FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "All users can view public celebrations" ON public.celebration_feed FOR SELECT USING (is_public = true OR auth.uid() = user_id);
CREATE POLICY "Users can insert own celebrations" ON public.celebration_feed FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "All users can view likes" ON public.celebration_likes FOR SELECT USING (true);
CREATE POLICY "Users can like celebrations" ON public.celebration_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can unlike own likes" ON public.celebration_likes FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "All users can view comments" ON public.celebration_comments FOR SELECT USING (true);
CREATE POLICY "Users can add comments" ON public.celebration_comments FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Triggers for like/comment counts
CREATE OR REPLACE FUNCTION public.update_celebration_like_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.celebration_feed SET like_count = like_count + 1 WHERE id = NEW.celebration_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.celebration_feed SET like_count = like_count - 1 WHERE id = OLD.celebration_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER celebration_like_count_trigger
AFTER INSERT OR DELETE ON public.celebration_likes
FOR EACH ROW EXECUTE FUNCTION public.update_celebration_like_count();

CREATE OR REPLACE FUNCTION public.update_celebration_comment_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.celebration_feed SET comment_count = comment_count + 1 WHERE id = NEW.celebration_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.celebration_feed SET comment_count = comment_count - 1 WHERE id = OLD.celebration_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER celebration_comment_count_trigger
AFTER INSERT OR DELETE ON public.celebration_comments
FOR EACH ROW EXECUTE FUNCTION public.update_celebration_comment_count();

-- Leaderboard calculation functions
CREATE OR REPLACE FUNCTION public.get_period_dates(p_period_type VARCHAR(20))
RETURNS TABLE(start_date DATE, end_date DATE) AS $$
BEGIN
  IF p_period_type = 'daily' THEN
    RETURN QUERY SELECT CURRENT_DATE, CURRENT_DATE;
  ELSIF p_period_type = 'weekly' THEN
    RETURN QUERY SELECT DATE_TRUNC('week', CURRENT_DATE)::DATE, (DATE_TRUNC('week', CURRENT_DATE) + INTERVAL '6 days')::DATE;
  ELSIF p_period_type = 'monthly' THEN
    RETURN QUERY SELECT DATE_TRUNC('month', CURRENT_DATE)::DATE, (DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month - 1 day')::DATE;
  ELSIF p_period_type = 'quarterly' THEN
    RETURN QUERY SELECT DATE_TRUNC('quarter', CURRENT_DATE)::DATE, (DATE_TRUNC('quarter', CURRENT_DATE) + INTERVAL '3 months - 1 day')::DATE;
  ELSIF p_period_type = 'annual' THEN
    RETURN QUERY SELECT DATE_TRUNC('year', CURRENT_DATE)::DATE, (DATE_TRUNC('year', CURRENT_DATE) + INTERVAL '1 year - 1 day')::DATE;
  END IF;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE OR REPLACE FUNCTION public.calculate_leaderboard(
  p_period_type VARCHAR(20),
  p_period_start DATE,
  p_period_end DATE
)
RETURNS void AS $$
DECLARE
  v_user RECORD;
  v_total_points INTEGER;
  v_completion_pct DECIMAL(5,2);
  v_activities_count INTEGER;
  v_loans_closed INTEGER;
  v_volume_closed DECIMAL(15,2);
BEGIN
  FOR v_user IN
    SELECT user_id AS id FROM public.profiles
  LOOP
    SELECT COALESCE(SUM(points), 0) INTO v_total_points
    FROM public.activities
    WHERE user_id = v_user.id AND completed_at::DATE >= p_period_start AND completed_at::DATE <= p_period_end AND status = 'completed';

    SELECT COALESCE(AVG(completion_percentage), 0) INTO v_completion_pct
    FROM public.daily_power_moves
    WHERE user_id = v_user.id AND assigned_date >= p_period_start AND assigned_date <= p_period_end;

    SELECT COUNT(*) INTO v_activities_count
    FROM public.activities
    WHERE user_id = v_user.id AND completed_at::DATE >= p_period_start AND completed_at::DATE <= p_period_end AND status = 'completed';

    -- Loans from contacts
    SELECT COALESCE(SUM(loans_closed), 0), COALESCE(SUM(total_volume), 0)
    INTO v_loans_closed, v_volume_closed
    FROM public.contacts
    WHERE user_id = v_user.id;

    INSERT INTO public.leaderboard_data (user_id, period_type, period_start, period_end, total_points, completion_percentage, activities_logged, loans_closed, volume_closed, calculated_at)
    VALUES (v_user.id, p_period_type, p_period_start, p_period_end, v_total_points, v_completion_pct, v_activities_count, v_loans_closed, v_volume_closed, NOW())
    ON CONFLICT (user_id, period_type, period_start)
    DO UPDATE SET total_points = EXCLUDED.total_points, completion_percentage = EXCLUDED.completion_percentage, activities_logged = EXCLUDED.activities_logged, loans_closed = EXCLUDED.loans_closed, volume_closed = EXCLUDED.volume_closed, calculated_at = NOW();
  END LOOP;

  -- Update rankings
  WITH ranked AS (
    SELECT user_id, period_type, period_start,
      ROW_NUMBER() OVER (PARTITION BY period_type, period_start ORDER BY total_points DESC) AS rp,
      ROW_NUMBER() OVER (PARTITION BY period_type, period_start ORDER BY volume_closed DESC) AS rv,
      ROW_NUMBER() OVER (PARTITION BY period_type, period_start ORDER BY loans_closed DESC) AS rl
    FROM public.leaderboard_data
    WHERE period_type = p_period_type AND period_start = p_period_start
  )
  UPDATE public.leaderboard_data ld
  SET rank_by_points = r.rp, rank_by_volume = r.rv, rank_by_loans = r.rl
  FROM ranked r
  WHERE ld.user_id = r.user_id AND ld.period_type = r.period_type AND ld.period_start = r.period_start;

  -- Assign tiers
  UPDATE public.leaderboard_data
  SET tier = CASE
    WHEN total_points >= 800 THEN 'Diamond'
    WHEN total_points >= 600 THEN 'Platinum'
    WHEN total_points >= 400 THEN 'Gold'
    WHEN total_points >= 200 THEN 'Silver'
    ELSE 'Bronze'
  END
  WHERE period_type = p_period_type AND period_start = p_period_start;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.refresh_all_leaderboards()
RETURNS void AS $$
DECLARE
  v_period RECORD;
BEGIN
  FOR v_period IN SELECT * FROM public.get_period_dates('daily') LOOP
    PERFORM public.calculate_leaderboard('daily', v_period.start_date, v_period.end_date);
  END LOOP;
  FOR v_period IN SELECT * FROM public.get_period_dates('weekly') LOOP
    PERFORM public.calculate_leaderboard('weekly', v_period.start_date, v_period.end_date);
  END LOOP;
  FOR v_period IN SELECT * FROM public.get_period_dates('monthly') LOOP
    PERFORM public.calculate_leaderboard('monthly', v_period.start_date, v_period.end_date);
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Seed achievements
INSERT INTO public.achievements (name, description, category, icon_name, color, criteria, points_bonus) VALUES
  ('First Steps', 'Complete your first daily power move', 'milestone', 'Footprints', '#16A34A', '{"type": "power_moves_completed", "value": 1}', 10),
  ('Week Warrior', '7-day activity streak', 'streak', 'Flame', '#F59E0B', '{"type": "streak", "value": 7}', 25),
  ('Month Master', '30-day activity streak', 'streak', 'Award', '#EF4444', '{"type": "streak", "value": 30}', 100),
  ('Volume Victor', 'Close $1M in a month', 'volume', 'TrendingUp', '#3B82F6', '{"type": "monthly_volume", "value": 1000000}', 50),
  ('Century Club', 'Log 100 activities', 'activity', 'Activity', '#8B5CF6', '{"type": "total_activities", "value": 100}', 50),
  ('Social Butterfly', 'Contact 50 unique people', 'activity', 'Users', '#EC4899', '{"type": "unique_contacts", "value": 50}', 50),
  ('Diamond Achiever', 'Reach Diamond tier', 'milestone', 'Diamond', '#06B6D4', '{"type": "tier", "value": "Diamond"}', 100);
