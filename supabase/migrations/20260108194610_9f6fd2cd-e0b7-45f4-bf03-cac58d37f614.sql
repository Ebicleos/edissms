-- Fix multi-tenant data isolation for profiles table
-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Admins and superadmins can view all profiles" ON public.profiles;

-- Create school-scoped policy for admins
CREATE POLICY "Admins can view profiles in their school"
ON public.profiles FOR SELECT TO authenticated
USING (
  auth.uid() = id OR
  school_id = get_user_school(auth.uid()) OR
  public.has_role(auth.uid(), 'superadmin')
);

-- Fix multi-tenant data isolation for user_roles table
-- Drop any existing overly permissive policies
DROP POLICY IF EXISTS "Admins and superadmins can manage all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view their own role" ON public.user_roles;

-- Allow users to view their own role
CREATE POLICY "Users can view their own role"
ON public.user_roles FOR SELECT TO authenticated
USING (user_id = auth.uid());

-- Admins can view roles in their school only
CREATE POLICY "Admins can view roles in their school"
ON public.user_roles FOR SELECT TO authenticated
USING (
  school_id = get_user_school(auth.uid()) OR
  public.has_role(auth.uid(), 'superadmin')
);

-- Admins can manage roles in their school only
CREATE POLICY "Admins can manage roles in their school"
ON public.user_roles FOR ALL TO authenticated
USING (
  (public.has_role(auth.uid(), 'admin') AND school_id = get_user_school(auth.uid())) OR
  public.has_role(auth.uid(), 'superadmin')
)
WITH CHECK (
  (public.has_role(auth.uid(), 'admin') AND school_id = get_user_school(auth.uid())) OR
  public.has_role(auth.uid(), 'superadmin')
);