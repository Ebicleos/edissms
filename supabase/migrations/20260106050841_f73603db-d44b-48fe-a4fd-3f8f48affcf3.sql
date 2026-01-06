-- Fix the security definer view warning by using SECURITY INVOKER
-- This ensures the view uses the permissions of the calling user, not the view creator

DROP VIEW IF EXISTS public.questions_student_view;

CREATE OR REPLACE VIEW public.questions_student_view 
WITH (security_invoker = true) AS
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

-- Grant SELECT on the view to authenticated users
GRANT SELECT ON public.questions_student_view TO authenticated;