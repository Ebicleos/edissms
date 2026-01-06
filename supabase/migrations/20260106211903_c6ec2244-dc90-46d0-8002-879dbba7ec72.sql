-- Phase 1: Add user_id column to students table to link with auth users
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
CREATE INDEX IF NOT EXISTS idx_students_user_id ON public.students(user_id);

-- Phase 2: Update RLS policies for students table
-- Drop existing policy that uses id = auth.uid() (incorrect)
DROP POLICY IF EXISTS "Students can view own record" ON public.students;

-- Create new policy using user_id
CREATE POLICY "Students can view own record via user_id"
  ON public.students FOR SELECT
  USING (user_id = auth.uid());

-- Allow students to update their own contact info via user_id
CREATE POLICY "Students can update own contact info"
  ON public.students FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Phase 3: Fix schools RLS for registration - ensure authenticated users can create schools
-- Check if policy exists and create if not
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'schools' 
    AND policyname = 'Authenticated users can create schools during registration'
  ) THEN
    CREATE POLICY "Authenticated users can create schools during registration"
      ON public.schools FOR INSERT
      TO authenticated
      WITH CHECK (true);
  END IF;
END $$;

-- Phase 4: Fix subscriptions RLS to allow insert during registration
CREATE POLICY "Authenticated users can create subscriptions during registration"
  ON public.subscriptions FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Phase 5: Ensure profiles can be created during registration
DROP POLICY IF EXISTS "Admins and superadmins can insert profiles" ON public.profiles;
CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Phase 6: Ensure user_roles can be created during registration
CREATE POLICY "Users can insert their own role during registration"
  ON public.user_roles FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Phase 7: Allow admins to update their school
CREATE POLICY "Admins can update their school"
  ON public.schools FOR UPDATE
  USING (id = get_user_school(auth.uid()) AND has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (id = get_user_school(auth.uid()) AND has_role(auth.uid(), 'admin'::app_role));