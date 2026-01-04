
-- Fix RLS for schools table to allow INSERT for new users during registration
DROP POLICY IF EXISTS "Admins can insert schools" ON public.schools;
DROP POLICY IF EXISTS "Anyone can create schools during registration" ON public.schools;

CREATE POLICY "Authenticated users can create schools during registration"
ON public.schools
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Fix storage policies for school-logos bucket to allow uploads during registration
DROP POLICY IF EXISTS "School logos are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Admins can upload school logos" ON storage.objects;
DROP POLICY IF EXISTS "SuperAdmins can upload school logos" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can upload school logos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload school logos" ON storage.objects;

-- Allow public read access to school logos
CREATE POLICY "School logos are publicly accessible"
ON storage.objects
FOR SELECT
USING (bucket_id = 'school-logos');

-- Allow authenticated users to upload school logos (needed during registration)
CREATE POLICY "Authenticated users can upload school logos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'school-logos');

-- Allow authenticated users to update their school logos
CREATE POLICY "Authenticated users can update school logos"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'school-logos');

-- Allow authenticated users to delete school logos
CREATE POLICY "Authenticated users can delete school logos"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'school-logos');
