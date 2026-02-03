-- Allow students to view their school's settings via their student record
CREATE POLICY "Students can view their school settings via student record"
ON public.school_settings
FOR SELECT
TO authenticated
USING (
  school_id IN (
    SELECT s.school_id 
    FROM public.students s 
    WHERE s.user_id = auth.uid()
  )
);