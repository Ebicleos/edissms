
-- Add signature columns to school_settings
ALTER TABLE school_settings 
  ADD COLUMN IF NOT EXISTS teacher_signature_url text,
  ADD COLUMN IF NOT EXISTS principal_signature_url text;

-- Add image_url to questions table for exam diagrams
ALTER TABLE questions ADD COLUMN IF NOT EXISTS image_url text;

-- Create storage bucket for signatures
INSERT INTO storage.buckets (id, name, public) 
VALUES ('school-signatures', 'school-signatures', true)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for signatures bucket
CREATE POLICY "Anyone can view signatures" ON storage.objects
  FOR SELECT USING (bucket_id = 'school-signatures');

CREATE POLICY "Admins can upload signatures" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'school-signatures' 
    AND (auth.uid() IS NOT NULL)
  );

CREATE POLICY "Admins can update signatures" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'school-signatures' 
    AND (auth.uid() IS NOT NULL)
  );

CREATE POLICY "Admins can delete signatures" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'school-signatures' 
    AND (auth.uid() IS NOT NULL)
  );

-- Storage bucket for exam assets
INSERT INTO storage.buckets (id, name, public) 
VALUES ('exam-assets', 'exam-assets', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Anyone can view exam assets" ON storage.objects
  FOR SELECT USING (bucket_id = 'exam-assets');

CREATE POLICY "Teachers can upload exam assets" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'exam-assets' 
    AND (auth.uid() IS NOT NULL)
  );

CREATE POLICY "Teachers can update exam assets" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'exam-assets' 
    AND (auth.uid() IS NOT NULL)
  );

CREATE POLICY "Teachers can delete exam assets" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'exam-assets' 
    AND (auth.uid() IS NOT NULL)
  );
