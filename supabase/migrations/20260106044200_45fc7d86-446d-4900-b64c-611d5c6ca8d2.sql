-- Fix students table RLS policy to add explicit school_id verification
DROP POLICY IF EXISTS "Teachers can view students in their classes" ON public.students;

CREATE POLICY "Teachers can view students in their classes" 
ON public.students FOR SELECT 
USING (
  public.has_role(auth.uid(), 'teacher'::public.app_role) 
  AND students.school_id = public.get_user_school(auth.uid())
  AND (EXISTS (
    SELECT 1 FROM public.teacher_classes tc
    WHERE (tc.teacher_id = auth.uid()) 
    AND (tc.class_id = students.class_id)
  ))
);