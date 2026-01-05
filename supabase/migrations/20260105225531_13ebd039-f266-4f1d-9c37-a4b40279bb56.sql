-- Fix multi-tenant isolation for classes table

-- 1. Drop existing overly permissive SELECT policy
DROP POLICY IF EXISTS "Classes viewable by authenticated users" ON public.classes;

-- 2. Create new school-isolated SELECT policy
CREATE POLICY "Users can view classes in their school"
ON public.classes FOR SELECT
USING (
  school_id = get_user_school(auth.uid()) OR
  has_role(auth.uid(), 'superadmin'::app_role)
);

-- 3. Update admin management policy to include school_id isolation
DROP POLICY IF EXISTS "Admins and superadmins can manage classes" ON public.classes;

CREATE POLICY "Admins can manage classes in their school"
ON public.classes FOR ALL
USING (
  has_role(auth.uid(), 'superadmin'::app_role) OR
  (has_role(auth.uid(), 'admin'::app_role) 
   AND school_id = get_user_school(auth.uid()))
);