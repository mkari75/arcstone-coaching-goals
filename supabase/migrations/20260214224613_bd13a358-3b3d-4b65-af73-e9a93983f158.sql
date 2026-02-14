
-- 1. Create role enum
CREATE TYPE public.app_role AS ENUM ('loan_officer', 'manager', 'super_admin');

-- 2. Create user_roles table FIRST
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 3. has_role function (security definer to avoid RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  )
$$;

-- RLS on user_roles using has_role
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage roles" ON public.user_roles FOR ALL USING (public.has_role(auth.uid(), 'super_admin'));

-- 4. update_updated_at utility function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- 5. Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  full_name VARCHAR(255),
  email VARCHAR(255),
  phone VARCHAR(20),
  nmls_number VARCHAR(20),
  momentum_score INTEGER DEFAULT 0,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_activity_date DATE,
  daily_completion_avg DECIMAL(5,2) DEFAULT 0,
  pip_status VARCHAR(20) DEFAULT 'none',
  pip_start_date DATE,
  pip_reason TEXT,
  favorite_programs TEXT[],
  license_status VARCHAR(20) DEFAULT 'active',
  license_expiry_date DATE,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_profiles_momentum_score ON public.profiles(momentum_score DESC);
CREATE INDEX idx_profiles_pip_status ON public.profiles(pip_status);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Managers can view all profiles" ON public.profiles FOR SELECT USING (public.has_role(auth.uid(), 'manager') OR public.has_role(auth.uid(), 'super_admin'));

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 6. Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, full_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', ''));
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'loan_officer');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 7. Contacts table
CREATE TABLE public.contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(20),
  company VARCHAR(255),
  title VARCHAR(100),
  contact_type VARCHAR(50) NOT NULL,
  health_score INTEGER DEFAULT 50 CHECK (health_score >= 0 AND health_score <= 100),
  health_status VARCHAR(20) DEFAULT 'neutral',
  last_contact_date DATE,
  last_contact_type VARCHAR(50),
  days_since_contact INTEGER DEFAULT 0,
  total_touches INTEGER DEFAULT 0,
  referrals_received INTEGER DEFAULT 0,
  loans_closed INTEGER DEFAULT 0,
  total_volume DECIMAL(15,2) DEFAULT 0,
  notes TEXT,
  tags TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_contacts_user_id ON public.contacts(user_id);
CREATE INDEX idx_contacts_health_status ON public.contacts(health_status);
CREATE INDEX idx_contacts_contact_type ON public.contacts(contact_type);
CREATE INDEX idx_contacts_last_contact_date ON public.contacts(last_contact_date DESC);

ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own contacts" ON public.contacts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Managers can view team contacts" ON public.contacts FOR SELECT USING (public.has_role(auth.uid(), 'manager') OR public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Users can insert own contacts" ON public.contacts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own contacts" ON public.contacts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own contacts" ON public.contacts FOR DELETE USING (auth.uid() = user_id);
CREATE TRIGGER update_contacts_updated_at BEFORE UPDATE ON public.contacts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 8. Activities table
CREATE TABLE public.activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  contact_id UUID REFERENCES public.contacts(id) ON DELETE SET NULL,
  activity_type VARCHAR(50) NOT NULL,
  activity_category VARCHAR(50) NOT NULL,
  description TEXT,
  voice_note_url TEXT,
  transcription TEXT,
  points INTEGER DEFAULT 0,
  impact_level VARCHAR(20),
  status VARCHAR(20) DEFAULT 'completed',
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  scheduled_for TIMESTAMPTZ,
  device_info JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_activities_user_id ON public.activities(user_id);
CREATE INDEX idx_activities_contact_id ON public.activities(contact_id);
CREATE INDEX idx_activities_completed_at ON public.activities(completed_at DESC);
CREATE INDEX idx_activities_activity_type ON public.activities(activity_type);
CREATE INDEX idx_activities_status ON public.activities(status);

ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own activities" ON public.activities FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Managers can view team activities" ON public.activities FOR SELECT USING (public.has_role(auth.uid(), 'manager') OR public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Users can insert own activities" ON public.activities FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own activities" ON public.activities FOR UPDATE USING (auth.uid() = user_id);

-- 9. Daily Power Moves
CREATE TABLE public.daily_power_moves (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  assigned_date DATE NOT NULL,
  move_1_description TEXT NOT NULL,
  move_1_contact_id UUID REFERENCES public.contacts(id) ON DELETE SET NULL,
  move_1_completed BOOLEAN DEFAULT FALSE,
  move_1_completed_at TIMESTAMPTZ,
  move_1_activity_id UUID REFERENCES public.activities(id) ON DELETE SET NULL,
  move_1_points INTEGER DEFAULT 0,
  move_2_description TEXT NOT NULL,
  move_2_contact_id UUID REFERENCES public.contacts(id) ON DELETE SET NULL,
  move_2_completed BOOLEAN DEFAULT FALSE,
  move_2_completed_at TIMESTAMPTZ,
  move_2_activity_id UUID REFERENCES public.activities(id) ON DELETE SET NULL,
  move_2_points INTEGER DEFAULT 0,
  move_3_description TEXT NOT NULL,
  move_3_contact_id UUID REFERENCES public.contacts(id) ON DELETE SET NULL,
  move_3_completed BOOLEAN DEFAULT FALSE,
  move_3_completed_at TIMESTAMPTZ,
  move_3_activity_id UUID REFERENCES public.activities(id) ON DELETE SET NULL,
  move_3_points INTEGER DEFAULT 0,
  total_points INTEGER DEFAULT 0,
  completion_percentage INTEGER DEFAULT 0,
  daily_grade VARCHAR(10),
  capacity_level VARCHAR(20) DEFAULT 'normal',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_user_date UNIQUE(user_id, assigned_date)
);

CREATE INDEX idx_daily_power_moves_user_date ON public.daily_power_moves(user_id, assigned_date DESC);
CREATE INDEX idx_daily_power_moves_completion ON public.daily_power_moves(completion_percentage);

ALTER TABLE public.daily_power_moves ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own power moves" ON public.daily_power_moves FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Managers can view team power moves" ON public.daily_power_moves FOR SELECT USING (public.has_role(auth.uid(), 'manager') OR public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Users can insert own power moves" ON public.daily_power_moves FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own power moves" ON public.daily_power_moves FOR UPDATE USING (auth.uid() = user_id);
CREATE TRIGGER update_daily_power_moves_updated_at BEFORE UPDATE ON public.daily_power_moves FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 10. Programs
CREATE TABLE public.programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_name VARCHAR(255) NOT NULL,
  investor_name VARCHAR(255) NOT NULL,
  program_type VARCHAR(50) NOT NULL,
  delegation_type VARCHAR(50),
  internal_margin_bps INTEGER,
  can_broker BOOLEAN DEFAULT FALSE,
  broker_comp_plan TEXT,
  program_summary TEXT NOT NULL,
  guidelines_url TEXT,
  target_borrower TEXT,
  sales_strategies TEXT,
  has_quiz BOOLEAN DEFAULT FALSE,
  quiz_questions JSONB,
  pass_threshold INTEGER DEFAULT 80,
  status VARCHAR(20) DEFAULT 'draft',
  created_by UUID REFERENCES auth.users(id) NOT NULL,
  approved_by UUID REFERENCES auth.users(id),
  approval_date TIMESTAMPTZ,
  rejection_reason TEXT,
  published_at TIMESTAMPTZ,
  archive_date TIMESTAMPTZ,
  is_featured BOOLEAN DEFAULT TRUE,
  version INTEGER DEFAULT 1,
  parent_program_id UUID REFERENCES public.programs(id),
  view_count INTEGER DEFAULT 0,
  acknowledgment_count INTEGER DEFAULT 0,
  avg_quiz_score DECIMAL(5,2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_programs_status ON public.programs(status);
CREATE INDEX idx_programs_published_at ON public.programs(published_at DESC);
CREATE INDEX idx_programs_is_featured ON public.programs(is_featured);
CREATE INDEX idx_programs_investor_name ON public.programs(investor_name);

ALTER TABLE public.programs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "All users can view approved programs" ON public.programs FOR SELECT USING (status = 'approved');
CREATE POLICY "Creators can view own drafts" ON public.programs FOR SELECT USING (auth.uid() = created_by);
CREATE POLICY "Admins can view all programs" ON public.programs FOR SELECT USING (public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Admins can insert programs" ON public.programs FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Admins can update programs" ON public.programs FOR UPDATE USING (public.has_role(auth.uid(), 'super_admin'));

CREATE OR REPLACE FUNCTION public.set_program_archive_date()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.published_at IS NOT NULL AND (OLD IS NULL OR OLD.published_at IS NULL) THEN
    NEW.archive_date = NEW.published_at + INTERVAL '60 days';
    NEW.is_featured = TRUE;
  END IF;
  IF NEW.archive_date IS NOT NULL AND NOW() > NEW.archive_date THEN
    NEW.is_featured = FALSE;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER program_archive_trigger BEFORE INSERT OR UPDATE ON public.programs FOR EACH ROW EXECUTE FUNCTION public.set_program_archive_date();
CREATE TRIGGER update_programs_updated_at BEFORE UPDATE ON public.programs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 11. Program Acknowledgments
CREATE TABLE public.program_acknowledgments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id UUID REFERENCES public.programs(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  acknowledged_at TIMESTAMPTZ DEFAULT NOW(),
  time_to_acknowledge INTEGER,
  quiz_taken BOOLEAN DEFAULT FALSE,
  quiz_score INTEGER,
  quiz_passed BOOLEAN,
  quiz_answers JSONB,
  quiz_attempts INTEGER DEFAULT 0,
  read_duration INTEGER,
  device_info JSONB,
  ip_address INET,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_user_program UNIQUE(user_id, program_id)
);

CREATE INDEX idx_program_ack_program ON public.program_acknowledgments(program_id);
CREATE INDEX idx_program_ack_user ON public.program_acknowledgments(user_id);

ALTER TABLE public.program_acknowledgments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own acknowledgments" ON public.program_acknowledgments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all acknowledgments" ON public.program_acknowledgments FOR SELECT USING (public.has_role(auth.uid(), 'manager') OR public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Users can insert own acknowledgments" ON public.program_acknowledgments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own acknowledgments" ON public.program_acknowledgments FOR UPDATE USING (auth.uid() = user_id);

-- 12. Policies table
CREATE TABLE public.policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  policy_name VARCHAR(255) NOT NULL,
  policy_type VARCHAR(50) NOT NULL,
  policy_content TEXT NOT NULL,
  supporting_documents TEXT[],
  affects_sales BOOLEAN DEFAULT FALSE,
  affects_setup BOOLEAN DEFAULT FALSE,
  affects_opening BOOLEAN DEFAULT FALSE,
  affects_processing BOOLEAN DEFAULT FALSE,
  affects_underwriting BOOLEAN DEFAULT FALSE,
  affects_closing BOOLEAN DEFAULT FALSE,
  affects_funding BOOLEAN DEFAULT FALSE,
  affects_disclosures BOOLEAN DEFAULT FALSE,
  affects_compliance BOOLEAN DEFAULT FALSE,
  affects_qc BOOLEAN DEFAULT FALSE,
  affects_marketing BOOLEAN DEFAULT FALSE,
  affects_capital_markets BOOLEAN DEFAULT FALSE,
  affects_lock_desk BOOLEAN DEFAULT FALSE,
  affects_technology BOOLEAN DEFAULT FALSE,
  compliance_source VARCHAR(100),
  effective_date DATE,
  review_frequency VARCHAR(50),
  has_quiz BOOLEAN DEFAULT FALSE,
  quiz_questions JSONB,
  pass_threshold INTEGER DEFAULT 80,
  status VARCHAR(20) DEFAULT 'draft',
  created_by UUID REFERENCES auth.users(id) NOT NULL,
  approved_by UUID REFERENCES auth.users(id),
  approval_date TIMESTAMPTZ,
  rejection_reason TEXT,
  published_at TIMESTAMPTZ,
  urgency_level VARCHAR(20) DEFAULT 'normal',
  version INTEGER DEFAULT 1,
  parent_policy_id UUID REFERENCES public.policies(id),
  view_count INTEGER DEFAULT 0,
  acknowledgment_count INTEGER DEFAULT 0,
  avg_quiz_score DECIMAL(5,2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_policies_status ON public.policies(status);
CREATE INDEX idx_policies_published_at ON public.policies(published_at DESC);
CREATE INDEX idx_policies_urgency_level ON public.policies(urgency_level);
CREATE INDEX idx_policies_policy_type ON public.policies(policy_type);

ALTER TABLE public.policies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "All users can view approved policies" ON public.policies FOR SELECT USING (status = 'approved');
CREATE POLICY "Creators can view own policy drafts" ON public.policies FOR SELECT USING (auth.uid() = created_by);
CREATE POLICY "Admins can view all policies" ON public.policies FOR SELECT USING (public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Admins can insert policies" ON public.policies FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Admins can update policies" ON public.policies FOR UPDATE USING (public.has_role(auth.uid(), 'super_admin'));
CREATE TRIGGER update_policies_updated_at BEFORE UPDATE ON public.policies FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 13. Policy Acknowledgments
CREATE TABLE public.policy_acknowledgments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  policy_id UUID REFERENCES public.policies(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  acknowledged_at TIMESTAMPTZ DEFAULT NOW(),
  time_to_acknowledge INTEGER,
  quiz_taken BOOLEAN DEFAULT FALSE,
  quiz_score INTEGER,
  quiz_passed BOOLEAN,
  quiz_answers JSONB,
  quiz_attempts INTEGER DEFAULT 0,
  flagged_not_understood BOOLEAN DEFAULT FALSE,
  clarification_requested TEXT,
  read_duration INTEGER,
  device_info JSONB,
  ip_address INET,
  digital_signature TEXT,
  acknowledged_ip INET,
  acknowledged_device VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_user_policy UNIQUE(user_id, policy_id)
);

CREATE INDEX idx_policy_ack_policy ON public.policy_acknowledgments(policy_id);
CREATE INDEX idx_policy_ack_user ON public.policy_acknowledgments(user_id);
CREATE INDEX idx_policy_ack_flagged ON public.policy_acknowledgments(flagged_not_understood);

ALTER TABLE public.policy_acknowledgments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own policy ack" ON public.policy_acknowledgments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all policy ack" ON public.policy_acknowledgments FOR SELECT USING (public.has_role(auth.uid(), 'manager') OR public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Users can insert own policy ack" ON public.policy_acknowledgments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own policy ack" ON public.policy_acknowledgments FOR UPDATE USING (auth.uid() = user_id);

-- 14. Continuing Education Modules
CREATE TABLE public.continuing_education_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_name VARCHAR(255) NOT NULL,
  module_type VARCHAR(50) NOT NULL,
  category VARCHAR(50) NOT NULL,
  description TEXT,
  content_type VARCHAR(50) NOT NULL,
  content_url TEXT,
  video_duration INTEGER,
  has_quiz BOOLEAN DEFAULT FALSE,
  quiz_questions JSONB,
  pass_threshold INTEGER DEFAULT 85,
  recurrence VARCHAR(50),
  due_date DATE,
  reminder_days INTEGER[],
  is_nmls_required BOOLEAN DEFAULT FALSE,
  nmls_course_id VARCHAR(50),
  status VARCHAR(20) DEFAULT 'draft',
  created_by UUID REFERENCES auth.users(id) NOT NULL,
  published_at TIMESTAMPTZ,
  completion_count INTEGER DEFAULT 0,
  avg_score DECIMAL(5,2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ce_modules_status ON public.continuing_education_modules(status);
CREATE INDEX idx_ce_modules_type ON public.continuing_education_modules(module_type);
CREATE INDEX idx_ce_modules_category ON public.continuing_education_modules(category);
CREATE INDEX idx_ce_modules_due_date ON public.continuing_education_modules(due_date);

ALTER TABLE public.continuing_education_modules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "All users can view published modules" ON public.continuing_education_modules FOR SELECT USING (status = 'published');
CREATE POLICY "Admins can view all modules" ON public.continuing_education_modules FOR SELECT USING (public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Admins can manage modules" ON public.continuing_education_modules FOR ALL USING (public.has_role(auth.uid(), 'super_admin'));
CREATE TRIGGER update_ce_modules_updated_at BEFORE UPDATE ON public.continuing_education_modules FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 15. CE Module Completions
CREATE TABLE public.ce_module_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id UUID REFERENCES public.continuing_education_modules(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  time_spent INTEGER,
  quiz_score INTEGER,
  quiz_passed BOOLEAN,
  quiz_answers JSONB,
  attempts INTEGER DEFAULT 0,
  certificate_url TEXT,
  certificate_number VARCHAR(50),
  ip_address INET,
  device_info JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_user_module_completion UNIQUE(user_id, module_id)
);

CREATE INDEX idx_ce_completions_module ON public.ce_module_completions(module_id);
CREATE INDEX idx_ce_completions_user ON public.ce_module_completions(user_id);

ALTER TABLE public.ce_module_completions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own completions" ON public.ce_module_completions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all completions" ON public.ce_module_completions FOR SELECT USING (public.has_role(auth.uid(), 'manager') OR public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Users can insert own completions" ON public.ce_module_completions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own completions" ON public.ce_module_completions FOR UPDATE USING (auth.uid() = user_id);

-- 16. Licenses
CREATE TABLE public.licenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  nmls_number VARCHAR(20) NOT NULL,
  state VARCHAR(2) NOT NULL,
  license_type VARCHAR(50) DEFAULT 'MLO',
  status VARCHAR(20) DEFAULT 'active',
  issue_date DATE,
  expiry_date DATE NOT NULL,
  license_document_url TEXT,
  reminder_90_sent BOOLEAN DEFAULT FALSE,
  reminder_60_sent BOOLEAN DEFAULT FALSE,
  reminder_30_sent BOOLEAN DEFAULT FALSE,
  renewal_in_progress BOOLEAN DEFAULT FALSE,
  renewal_submitted_date DATE,
  renewal_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_user_state_license UNIQUE(user_id, state)
);

CREATE INDEX idx_licenses_user_id ON public.licenses(user_id);
CREATE INDEX idx_licenses_status ON public.licenses(status);
CREATE INDEX idx_licenses_expiry_date ON public.licenses(expiry_date);

ALTER TABLE public.licenses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own licenses" ON public.licenses FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all licenses" ON public.licenses FOR SELECT USING (public.has_role(auth.uid(), 'manager') OR public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Users can insert own licenses" ON public.licenses FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own licenses" ON public.licenses FOR UPDATE USING (auth.uid() = user_id);
CREATE TRIGGER update_licenses_updated_at BEFORE UPDATE ON public.licenses FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.check_license_expiry()
RETURNS void AS $$
BEGIN
  UPDATE public.licenses SET status = 'expired' WHERE expiry_date < CURRENT_DATE AND status = 'active';
  UPDATE public.licenses SET reminder_90_sent = TRUE WHERE expiry_date <= CURRENT_DATE + INTERVAL '90 days' AND reminder_90_sent = FALSE AND status = 'active';
  UPDATE public.licenses SET reminder_60_sent = TRUE WHERE expiry_date <= CURRENT_DATE + INTERVAL '60 days' AND reminder_60_sent = FALSE AND status = 'active';
  UPDATE public.licenses SET reminder_30_sent = TRUE WHERE expiry_date <= CURRENT_DATE + INTERVAL '30 days' AND reminder_30_sent = FALSE AND status = 'active';
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- 17. PIP Records
CREATE TABLE public.pip_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  pip_stage VARCHAR(20) NOT NULL,
  trigger_reason TEXT NOT NULL,
  started_at TIMESTAMPTZ NOT NULL,
  expected_end_date TIMESTAMPTZ,
  actual_end_date TIMESTAMPTZ,
  action_plan TEXT,
  success_criteria JSONB,
  current_status VARCHAR(20) DEFAULT 'active',
  progress_notes TEXT,
  admin_override BOOLEAN DEFAULT FALSE,
  override_reason TEXT,
  override_by UUID REFERENCES auth.users(id),
  override_at TIMESTAMPTZ,
  outcome VARCHAR(50),
  outcome_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_pip_records_user_id ON public.pip_records(user_id);
CREATE INDEX idx_pip_records_pip_stage ON public.pip_records(pip_stage);
CREATE INDEX idx_pip_records_current_status ON public.pip_records(current_status);

ALTER TABLE public.pip_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own PIP records" ON public.pip_records FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Managers can view all PIP records" ON public.pip_records FOR SELECT USING (public.has_role(auth.uid(), 'manager') OR public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Managers can manage PIP records" ON public.pip_records FOR ALL USING (public.has_role(auth.uid(), 'manager') OR public.has_role(auth.uid(), 'super_admin'));
CREATE TRIGGER update_pip_records_updated_at BEFORE UPDATE ON public.pip_records FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 18. CEO Messages
CREATE TABLE public.ceo_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  message_type VARCHAR(50) NOT NULL,
  video_url TEXT,
  video_duration INTEGER,
  thumbnail_url TEXT,
  content TEXT,
  target_roles VARCHAR(50)[] DEFAULT ARRAY['loan_officer'],
  view_points INTEGER DEFAULT 5,
  watch_80_percent_points INTEGER DEFAULT 15,
  comment_points INTEGER DEFAULT 5,
  react_points INTEGER DEFAULT 2,
  published_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  is_pinned BOOLEAN DEFAULT FALSE,
  view_count INTEGER DEFAULT 0,
  avg_watch_percentage DECIMAL(5,2),
  comment_count INTEGER DEFAULT 0,
  reaction_count INTEGER DEFAULT 0,
  created_by UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ceo_messages_published_at ON public.ceo_messages(published_at DESC);
CREATE INDEX idx_ceo_messages_is_pinned ON public.ceo_messages(is_pinned);

ALTER TABLE public.ceo_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "All users can view published messages" ON public.ceo_messages FOR SELECT USING (published_at IS NOT NULL);
CREATE POLICY "Admins can manage messages" ON public.ceo_messages FOR ALL USING (public.has_role(auth.uid(), 'super_admin'));

-- 19. Message Views
CREATE TABLE public.message_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID REFERENCES public.ceo_messages(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  viewed_at TIMESTAMPTZ DEFAULT NOW(),
  watch_duration INTEGER,
  watch_percentage DECIMAL(5,2),
  completed_80_percent BOOLEAN DEFAULT FALSE,
  reacted BOOLEAN DEFAULT FALSE,
  reaction_type VARCHAR(20),
  commented BOOLEAN DEFAULT FALSE,
  comment_text TEXT,
  points_earned INTEGER DEFAULT 0,
  device_info JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_user_message_view UNIQUE(user_id, message_id)
);

CREATE INDEX idx_message_views_message_id ON public.message_views(message_id);
CREATE INDEX idx_message_views_user_id ON public.message_views(user_id);

ALTER TABLE public.message_views ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own message views" ON public.message_views FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all message views" ON public.message_views FOR SELECT USING (public.has_role(auth.uid(), 'manager') OR public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Users can insert own message views" ON public.message_views FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own message views" ON public.message_views FOR UPDATE USING (auth.uid() = user_id);

-- 20. Leaderboard Data
CREATE TABLE public.leaderboard_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  period_type VARCHAR(20) NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  total_points INTEGER DEFAULT 0,
  completion_percentage DECIMAL(5,2),
  activities_logged INTEGER DEFAULT 0,
  loans_closed INTEGER DEFAULT 0,
  volume_closed DECIMAL(15,2) DEFAULT 0,
  rank_by_points INTEGER,
  rank_by_volume INTEGER,
  rank_by_loans INTEGER,
  tier VARCHAR(20),
  calculated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_user_period UNIQUE(user_id, period_type, period_start)
);

CREATE INDEX idx_leaderboard_period ON public.leaderboard_data(period_type, period_start, period_end);
CREATE INDEX idx_leaderboard_rank_points ON public.leaderboard_data(rank_by_points);
CREATE INDEX idx_leaderboard_user_id ON public.leaderboard_data(user_id);

ALTER TABLE public.leaderboard_data ENABLE ROW LEVEL SECURITY;
CREATE POLICY "All users can view leaderboard" ON public.leaderboard_data FOR SELECT USING (true);
CREATE POLICY "Admins can insert leaderboard" ON public.leaderboard_data FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Admins can update leaderboard" ON public.leaderboard_data FOR UPDATE USING (public.has_role(auth.uid(), 'super_admin'));

-- 21. Utility functions
CREATE OR REPLACE FUNCTION public.calculate_momentum_score(p_user_id UUID, p_days INTEGER DEFAULT 30)
RETURNS INTEGER AS $$
DECLARE
  v_score INTEGER;
  v_completion_avg DECIMAL;
  v_current_streak INTEGER;
  v_activities_count INTEGER;
BEGIN
  SELECT COALESCE(AVG(completion_percentage), 0), COUNT(*)
  INTO v_completion_avg, v_activities_count
  FROM public.daily_power_moves
  WHERE user_id = p_user_id AND assigned_date >= CURRENT_DATE - p_days AND assigned_date <= CURRENT_DATE;

  SELECT COALESCE(current_streak, 0) INTO v_current_streak FROM public.profiles WHERE user_id = p_user_id;

  v_score := ROUND((v_completion_avg * 0.5) + (v_current_streak * 2) + (v_activities_count * 0.5));
  RETURN GREATEST(0, LEAST(1000, v_score));
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE OR REPLACE FUNCTION public.update_contact_health(p_contact_id UUID)
RETURNS void AS $$
DECLARE
  v_days_since_contact INTEGER;
  v_total_touches INTEGER;
  v_loans_closed INTEGER;
  v_health_score INTEGER;
  v_health_status VARCHAR(20);
BEGIN
  SELECT
    COALESCE(CURRENT_DATE - MAX(completed_at)::DATE, 999),
    COUNT(*),
    SUM(CASE WHEN activity_type = 'closed_loan' THEN 1 ELSE 0 END)
  INTO v_days_since_contact, v_total_touches, v_loans_closed
  FROM public.activities WHERE contact_id = p_contact_id;

  v_health_score := GREATEST(0, LEAST(100, 100 - (v_days_since_contact * 2) + (v_total_touches * 3) + (v_loans_closed * 10)));
  v_health_status := CASE
    WHEN v_health_score >= 80 THEN 'excellent'
    WHEN v_health_score >= 60 THEN 'good'
    WHEN v_health_score >= 40 THEN 'neutral'
    WHEN v_health_score >= 20 THEN 'at_risk'
    ELSE 'critical'
  END;

  UPDATE public.contacts SET health_score = v_health_score, health_status = v_health_status, days_since_contact = v_days_since_contact WHERE id = p_contact_id;
END;
$$ LANGUAGE plpgsql SET search_path = public;
