-- Drop existing restrictive INSERT policy on schools if it exists
DROP POLICY IF EXISTS "Authenticated users can create schools" ON public.schools;
DROP POLICY IF EXISTS "Users can create schools" ON public.schools;
DROP POLICY IF EXISTS "Allow school creation during registration" ON public.schools;

-- Create a permissive INSERT policy for school registration
-- This allows any authenticated user to create a school where they are the creator
CREATE POLICY "Allow authenticated users to create their school"
ON public.schools
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = created_by
);

-- Ensure SELECT policy allows users to see schools they created or belong to
DROP POLICY IF EXISTS "Users can view their school" ON public.schools;
DROP POLICY IF EXISTS "Admins can view their school" ON public.schools;
DROP POLICY IF EXISTS "Users can view schools" ON public.schools;

CREATE POLICY "Users can view their schools"
ON public.schools
FOR SELECT
TO authenticated
USING (
  created_by = auth.uid() OR
  id IN (SELECT school_id FROM public.user_roles WHERE user_id = auth.uid()) OR
  public.has_role(auth.uid(), 'superadmin')
);

-- Ensure UPDATE policy for school admins
DROP POLICY IF EXISTS "Admins can update their school" ON public.schools;

CREATE POLICY "Admins can update their school"
ON public.schools
FOR UPDATE
TO authenticated
USING (
  id IN (SELECT school_id FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin') OR
  public.has_role(auth.uid(), 'superadmin')
)
WITH CHECK (
  id IN (SELECT school_id FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin') OR
  public.has_role(auth.uid(), 'superadmin')
);