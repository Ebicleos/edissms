
-- 1. Create learning-materials storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('learning-materials', 'learning-materials', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Storage RLS: authenticated users can upload to learning-materials
CREATE POLICY "Authenticated users can upload learning materials"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'learning-materials');

-- 3. Storage RLS: public can read learning-materials
CREATE POLICY "Public can read learning materials"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'learning-materials');

-- 4. Storage RLS: owners can delete their learning materials
CREATE POLICY "Users can delete their own learning materials"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'learning-materials' AND (auth.uid()::text = (storage.foldername(name))[1]));

-- 5. Fix get_user_class function to fallback to students table
CREATE OR REPLACE FUNCTION public.get_user_class(_user_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT class_id FROM public.student_classes WHERE student_id = _user_id LIMIT 1),
    (SELECT class_id FROM public.students WHERE user_id = _user_id LIMIT 1)
  )
$$;

-- 6. Fix report_cards student RLS policy
DROP POLICY IF EXISTS "Students can view their own report cards" ON public.report_cards;
CREATE POLICY "Students can view their own report cards"
ON public.report_cards FOR SELECT TO public
USING (student_id IN (SELECT id FROM public.students WHERE user_id = auth.uid()));

-- 7. Fix attendance student RLS policy
DROP POLICY IF EXISTS "Students can view their own attendance" ON public.attendance;
CREATE POLICY "Students can view their own attendance"
ON public.attendance FOR SELECT TO public
USING (student_id IN (SELECT id FROM public.students WHERE user_id = auth.uid()));

-- 8. Fix student_grades student RLS policy (same pattern)
DROP POLICY IF EXISTS "Students can view their own grades" ON public.student_grades;
CREATE POLICY "Students can view their own grades"
ON public.student_grades FOR SELECT TO public
USING (student_id IN (SELECT id FROM public.students WHERE user_id = auth.uid()));
