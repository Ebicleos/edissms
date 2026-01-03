-- Fix PUBLIC_DATA_EXPOSURE: Remove public access to students table
-- and add a policy for students to view their own record

-- Drop the overly permissive public policy
DROP POLICY IF EXISTS "Public can view students for now" ON public.students;

-- Add policy for students to view their own record
CREATE POLICY "Students can view own record" 
ON public.students 
FOR SELECT 
USING (id = auth.uid());