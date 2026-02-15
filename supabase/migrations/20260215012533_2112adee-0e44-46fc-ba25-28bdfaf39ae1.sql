
-- Create avatars bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Make voice-notes public (so audio can be played back)
UPDATE storage.buckets SET public = true WHERE id = 'voice-notes';

-- Make program-documents public (so docs can be viewed)
UPDATE storage.buckets SET public = true WHERE id = 'program-documents';

-- RLS policies for avatars
CREATE POLICY "Avatar images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE
USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can delete their own avatar"
ON storage.objects FOR DELETE
USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

-- RLS policies for voice-notes
CREATE POLICY "Voice notes are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'voice-notes');

CREATE POLICY "Users can upload voice notes"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'voice-notes' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can delete their voice notes"
ON storage.objects FOR DELETE
USING (bucket_id = 'voice-notes' AND (storage.foldername(name))[1] = auth.uid()::text);

-- RLS policies for program-documents
CREATE POLICY "Program documents are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'program-documents');

CREATE POLICY "Managers can upload program documents"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'program-documents' AND public.has_role(auth.uid(), 'manager'));

CREATE POLICY "Managers can delete program documents"
ON storage.objects FOR DELETE
USING (bucket_id = 'program-documents' AND public.has_role(auth.uid(), 'manager'));
