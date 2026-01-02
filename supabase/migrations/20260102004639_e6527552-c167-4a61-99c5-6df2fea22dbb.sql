-- Allow students to insert their own class assignment during signup
CREATE POLICY "Students can insert their own class during signup"
ON public.student_classes
FOR INSERT
WITH CHECK (auth.uid() = student_id);

-- Allow teachers to insert their own class assignment during signup
CREATE POLICY "Teachers can insert their own class during signup"
ON public.teacher_classes
FOR INSERT
WITH CHECK (auth.uid() = teacher_id);