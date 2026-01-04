-- Fix 1: Remove public access policy from students table
DROP POLICY IF EXISTS "Public can view students for now" ON public.students;

-- Fix 2: Remove unrestricted audit log insert and require authentication
DROP POLICY IF EXISTS "System can insert audit logs" ON public.audit_logs;

CREATE POLICY "Authenticated users can insert audit logs" 
ON public.audit_logs FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

-- Fix 3: Remove public access from student-photos storage bucket
DROP POLICY IF EXISTS "Public can view student photos" ON storage.objects;

-- Add authenticated access policy for student photos (role-based)
CREATE POLICY "Authenticated users can view student photos"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'student-photos' AND (
    has_role(auth.uid(), 'admin'::app_role) OR
    has_role(auth.uid(), 'superadmin'::app_role) OR
    has_role(auth.uid(), 'teacher'::app_role) OR
    has_role(auth.uid(), 'student'::app_role)
  )
);

-- Make student-photos bucket private
UPDATE storage.buckets SET public = false WHERE id = 'student-photos';