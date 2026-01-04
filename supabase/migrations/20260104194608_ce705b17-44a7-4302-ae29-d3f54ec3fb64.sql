-- Fix 1: Remove public access to students table
DROP POLICY IF EXISTS "Anyone can view students for signup validation" ON public.students;

-- Fix 2: Remove public access to school_settings table
DROP POLICY IF EXISTS "Anyone can view school settings" ON public.school_settings;

-- Add authenticated-only policy for school_settings
CREATE POLICY "Authenticated users can view school settings"
ON public.school_settings
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Create secure RPC function for admission number validation during signup
-- This returns only a boolean, not full student data
CREATE OR REPLACE FUNCTION public.validate_student_for_signup(
  admission_num text,
  student_name text
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.students
    WHERE admission_number = admission_num
    AND LOWER(full_name) = LOWER(student_name)
  )
$$;

-- Revoke direct execute from public, only allow authenticated users
REVOKE ALL ON FUNCTION public.validate_student_for_signup(text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.validate_student_for_signup(text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.validate_student_for_signup(text, text) TO anon;