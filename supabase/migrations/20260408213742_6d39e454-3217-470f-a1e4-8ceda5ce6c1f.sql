UPDATE storage.buckets
SET public = false
WHERE id IN ('school-signatures', 'exam-assets', 'learning-materials');

DROP POLICY IF EXISTS "Authenticated users can view signatures" ON storage.objects;
DROP POLICY IF EXISTS "Admins can manage signatures" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update signatures" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete signatures" ON storage.objects;

CREATE POLICY "Staff can view signatures in their school"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'school-signatures'
  AND (
    public.has_role(auth.uid(), 'superadmin'::public.app_role)
    OR EXISTS (
      SELECT 1
      FROM public.school_settings ss
      WHERE ss.school_id = public.get_user_school(auth.uid())
        AND (ss.teacher_signature_url = name OR ss.principal_signature_url = name)
    )
  )
);

CREATE POLICY "Admins can upload signatures"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'school-signatures'
  AND (
    public.has_role(auth.uid(), 'admin'::public.app_role)
    OR public.has_role(auth.uid(), 'superadmin'::public.app_role)
  )
);

CREATE POLICY "Admins can update signatures"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'school-signatures'
  AND (
    public.has_role(auth.uid(), 'admin'::public.app_role)
    OR public.has_role(auth.uid(), 'superadmin'::public.app_role)
  )
);

CREATE POLICY "Admins can delete signatures"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'school-signatures'
  AND (
    public.has_role(auth.uid(), 'admin'::public.app_role)
    OR public.has_role(auth.uid(), 'superadmin'::public.app_role)
  )
);

DROP POLICY IF EXISTS "Authenticated users can view exam assets" ON storage.objects;
DROP POLICY IF EXISTS "Teachers can upload exam assets" ON storage.objects;
DROP POLICY IF EXISTS "Teachers can update exam assets" ON storage.objects;
DROP POLICY IF EXISTS "Teachers can delete exam assets" ON storage.objects;

CREATE POLICY "Authenticated users can view exam assets"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'exam-assets'
  AND auth.uid() IS NOT NULL
);

CREATE POLICY "Staff can upload exam assets"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'exam-assets'
  AND (
    public.has_role(auth.uid(), 'teacher'::public.app_role)
    OR public.has_role(auth.uid(), 'admin'::public.app_role)
    OR public.has_role(auth.uid(), 'superadmin'::public.app_role)
  )
);

CREATE POLICY "Staff can update exam assets"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'exam-assets'
  AND (
    public.has_role(auth.uid(), 'teacher'::public.app_role)
    OR public.has_role(auth.uid(), 'admin'::public.app_role)
    OR public.has_role(auth.uid(), 'superadmin'::public.app_role)
  )
);

CREATE POLICY "Staff can delete exam assets"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'exam-assets'
  AND (
    public.has_role(auth.uid(), 'teacher'::public.app_role)
    OR public.has_role(auth.uid(), 'admin'::public.app_role)
    OR public.has_role(auth.uid(), 'superadmin'::public.app_role)
  )
);

DROP POLICY IF EXISTS "Public can read learning materials" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload learning materials" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own learning materials" ON storage.objects;

CREATE POLICY "Authenticated users can view learning materials"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'learning-materials'
  AND auth.uid() IS NOT NULL
);

CREATE POLICY "Staff can upload learning materials"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'learning-materials'
  AND (
    public.has_role(auth.uid(), 'teacher'::public.app_role)
    OR public.has_role(auth.uid(), 'admin'::public.app_role)
    OR public.has_role(auth.uid(), 'superadmin'::public.app_role)
  )
);

CREATE POLICY "Staff can update learning materials"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'learning-materials'
  AND (
    public.has_role(auth.uid(), 'teacher'::public.app_role)
    OR public.has_role(auth.uid(), 'admin'::public.app_role)
    OR public.has_role(auth.uid(), 'superadmin'::public.app_role)
  )
);

CREATE POLICY "Staff can delete learning materials"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'learning-materials'
  AND (
    public.has_role(auth.uid(), 'teacher'::public.app_role)
    OR public.has_role(auth.uid(), 'admin'::public.app_role)
    OR public.has_role(auth.uid(), 'superadmin'::public.app_role)
  )
);

DROP POLICY IF EXISTS "Authenticated users can view student photos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can view student photos in their school" ON storage.objects;

CREATE POLICY "Authorized users can view student photos"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'student-photos'
  AND (
    public.has_role(auth.uid(), 'superadmin'::public.app_role)
    OR EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.photo_url = name
    )
    OR EXISTS (
      SELECT 1
      FROM public.students s
      WHERE s.user_id = auth.uid()
        AND s.photo_url = name
    )
    OR EXISTS (
      SELECT 1
      FROM public.students s
      WHERE s.photo_url = name
        AND s.school_id = public.get_user_school(auth.uid())
        AND (
          public.has_role(auth.uid(), 'admin'::public.app_role)
          OR public.has_role(auth.uid(), 'teacher'::public.app_role)
        )
    )
  )
);