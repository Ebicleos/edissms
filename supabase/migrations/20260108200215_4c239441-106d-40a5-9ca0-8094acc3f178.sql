-- Fix Subjects table multi-tenant isolation

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view subjects in their school" ON public.subjects;
DROP POLICY IF EXISTS "Admins can manage subjects in their school" ON public.subjects;

-- Delete orphaned subjects with NULL school_id
DELETE FROM public.subjects WHERE school_id IS NULL;

-- Add NOT NULL constraint to prevent future orphaned subjects
ALTER TABLE public.subjects ALTER COLUMN school_id SET NOT NULL;

-- Create strict school-scoped SELECT policy (no NULL loophole)
CREATE POLICY "Users can view subjects in their school"
ON public.subjects FOR SELECT TO authenticated
USING (
  school_id = get_user_school(auth.uid()) OR
  has_role(auth.uid(), 'superadmin'::app_role)
);

-- Create strict school-scoped management policy
CREATE POLICY "Admins can manage subjects in their school"
ON public.subjects FOR ALL TO authenticated
USING (
  has_role(auth.uid(), 'superadmin'::app_role) OR
  (has_role(auth.uid(), 'admin'::app_role) AND school_id = get_user_school(auth.uid()))
)
WITH CHECK (
  has_role(auth.uid(), 'superadmin'::app_role) OR
  (has_role(auth.uid(), 'admin'::app_role) AND school_id = get_user_school(auth.uid()))
);