-- Create storage bucket for voice notes
INSERT INTO storage.buckets (id, name, public)
VALUES ('voice-notes', 'voice-notes', false);

-- RLS Policy: Users can upload their own voice notes
CREATE POLICY "Users can upload own voice notes"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'voice-notes' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- RLS Policy: Users can read their own voice notes
CREATE POLICY "Users can read own voice notes"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'voice-notes' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- RLS Policy: Managers can read all voice notes
CREATE POLICY "Managers can read all voice notes"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'voice-notes' AND
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('manager', 'super_admin')
  )
);