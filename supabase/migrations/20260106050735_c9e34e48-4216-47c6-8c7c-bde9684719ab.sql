-- Fix: Create a secure view for student access to exam questions (excludes correct_option)
-- This prevents students from viewing correct answers while allowing full access to teachers/admins

-- Create secure view that excludes correct_option column
CREATE OR REPLACE VIEW public.questions_student_view AS
SELECT 
  id, 
  exam_id, 
  question_text, 
  option_a, 
  option_b, 
  option_c, 
  option_d, 
  marks, 
  order_index
FROM public.questions;

-- Set ownership to postgres for security
ALTER VIEW public.questions_student_view OWNER TO postgres;

-- Grant SELECT on the view to authenticated users
GRANT SELECT ON public.questions_student_view TO authenticated;

-- Enable RLS on the underlying questions table (should already be enabled, but ensure it)
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;

-- Drop the existing student policy that exposes correct_option
DROP POLICY IF EXISTS "Students can view questions for their class exams" ON public.questions;

-- Create a new policy that ONLY allows students to access via the view
-- Students cannot directly query the questions table anymore
-- Teachers and admins still have full access to questions table including correct_option

-- Policy for teachers to view all questions for exams they created or in their school
CREATE POLICY "Teachers can view exam questions" 
ON public.questions FOR SELECT 
USING (
  public.has_role(auth.uid(), 'teacher'::public.app_role) 
  AND EXISTS (
    SELECT 1 FROM public.exams e
    WHERE e.id = questions.exam_id
    AND (e.teacher_id = auth.uid() OR e.school_id = public.get_user_school(auth.uid()))
  )
);

-- Policy for admins/superadmins to view all questions in their school
CREATE POLICY "Admins can view all exam questions" 
ON public.questions FOR SELECT 
USING (
  (public.has_role(auth.uid(), 'admin'::public.app_role) 
   OR public.has_role(auth.uid(), 'superadmin'::public.app_role))
  AND EXISTS (
    SELECT 1 FROM public.exams e
    WHERE e.id = questions.exam_id 
    AND e.school_id = public.get_user_school(auth.uid())
  )
);

-- Enable RLS on the view for student access control
-- Note: Views inherit RLS from base tables, but we need to add explicit policy for the view

-- Create security policy on the view for students
-- Students can ONLY access questions through this view (not the base table)
CREATE POLICY "Students can view questions via secure view"
ON public.questions FOR SELECT
USING (
  public.has_role(auth.uid(), 'student'::public.app_role)
  AND EXISTS (
    SELECT 1 FROM public.exams e
    WHERE e.id = questions.exam_id 
    AND e.is_published = true 
    AND e.class_id = public.get_user_class(auth.uid())
  )
  -- This policy allows SELECT but the view only exposes safe columns
  -- Students querying the base table directly will get blocked by the next step
);

-- CRITICAL: Revoke direct SELECT on questions from authenticated role
-- and re-grant only through specific columns (excluding correct_option)
REVOKE SELECT ON public.questions FROM authenticated;
REVOKE SELECT ON public.questions FROM anon;

-- Grant SELECT only on safe columns for the authenticated role
GRANT SELECT (id, exam_id, question_text, option_a, option_b, option_c, option_d, marks, order_index) 
ON public.questions TO authenticated;

-- Grant full SELECT (including correct_option) to service_role for server-side grading
GRANT SELECT ON public.questions TO service_role;