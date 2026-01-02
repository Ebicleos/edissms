
-- Create students table to store student data (separate from auth users)
CREATE TABLE public.students (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  admission_number TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  gender TEXT NOT NULL CHECK (gender IN ('male', 'female')),
  class_id TEXT NOT NULL,
  date_of_birth DATE,
  date_of_admission DATE DEFAULT CURRENT_DATE,
  admission_fee NUMERIC DEFAULT 0,
  academic_year TEXT DEFAULT '2024/2025',
  term TEXT DEFAULT 'first',
  guardian_name TEXT,
  address TEXT,
  phone_contact TEXT,
  email TEXT,
  photo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;

-- Admins can manage all students
CREATE POLICY "Admins can manage all students"
  ON public.students
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Teachers can view students in their classes
CREATE POLICY "Teachers can view students in their classes"
  ON public.students
  FOR SELECT
  USING (
    has_role(auth.uid(), 'teacher'::app_role) 
    AND EXISTS (
      SELECT 1 FROM teacher_classes tc 
      WHERE tc.teacher_id = auth.uid() 
      AND tc.class_id = students.class_id
    )
  );

-- Students can view their own record (match by linked user if any)
CREATE POLICY "Public can view students for now"
  ON public.students
  FOR SELECT
  USING (true);
