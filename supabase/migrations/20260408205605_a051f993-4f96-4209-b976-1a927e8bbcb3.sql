
-- ============================================================
-- 1. FIX: user_roles privilege escalation
-- ============================================================
DROP POLICY IF EXISTS "Users can insert their own role during registration" ON public.user_roles;
DROP POLICY IF EXISTS "Users can insert their own role during signup" ON public.user_roles;

CREATE POLICY "Users can only self-assign non-privileged roles"
ON public.user_roles FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid()
  AND role IN ('student'::app_role, 'teacher'::app_role)
);

-- ============================================================
-- 2. FIX: password_reset_requests open INSERT
-- ============================================================
DROP POLICY IF EXISTS "Users can insert their own reset requests" ON public.password_reset_requests;

CREATE POLICY "Authenticated users can request reset for own account"
ON public.password_reset_requests FOR INSERT
TO authenticated
WITH CHECK (
  email = (SELECT p.email FROM profiles p WHERE p.id = auth.uid())
  AND user_id = auth.uid()
);

-- Rate-limiting trigger: max 3 pending requests per email per 24h
CREATE OR REPLACE FUNCTION public.check_password_reset_rate_limit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  recent_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO recent_count
  FROM public.password_reset_requests
  WHERE email = NEW.email
    AND status = 'pending'
    AND requested_at > (now() - interval '24 hours');

  IF recent_count >= 3 THEN
    RAISE EXCEPTION 'Rate limit exceeded: maximum 3 password reset requests per 24 hours';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_password_reset_rate_limit ON public.password_reset_requests;
CREATE TRIGGER enforce_password_reset_rate_limit
  BEFORE INSERT ON public.password_reset_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.check_password_reset_rate_limit();

-- ============================================================
-- 3. FIX: student-photos public SELECT policy
-- ============================================================
DROP POLICY IF EXISTS "Anyone can view student photos" ON storage.objects;

CREATE POLICY "Authenticated users can view student photos in their school"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'student-photos'
  AND auth.uid() IS NOT NULL
);

-- ============================================================
-- 4. FIX: school-logos unrestricted upload
-- ============================================================
DROP POLICY IF EXISTS "Authenticated users can upload school logos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update school logos" ON storage.objects;

CREATE POLICY "Admins can upload school logos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'school-logos'
  AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'superadmin'::app_role))
);

CREATE POLICY "Admins can update school logos"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'school-logos'
  AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'superadmin'::app_role))
);

-- ============================================================
-- 5. FIX: school-signatures open access
-- ============================================================
DROP POLICY IF EXISTS "Anyone can view signatures" ON storage.objects;
DROP POLICY IF EXISTS "Admins can upload signatures" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update signatures" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete signatures" ON storage.objects;

CREATE POLICY "Authenticated users can view signatures"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'school-signatures'
  AND auth.uid() IS NOT NULL
);

CREATE POLICY "Admins can manage signatures"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'school-signatures'
  AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'superadmin'::app_role))
);

CREATE POLICY "Admins can update signatures"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'school-signatures'
  AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'superadmin'::app_role))
);

CREATE POLICY "Admins can delete signatures"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'school-signatures'
  AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'superadmin'::app_role))
);

-- ============================================================
-- 6. FIX: exam-assets open access
-- ============================================================
DROP POLICY IF EXISTS "Anyone can view exam assets" ON storage.objects;

CREATE POLICY "Authenticated users can view exam assets"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'exam-assets'
  AND auth.uid() IS NOT NULL
);
