
-- Add is_exam_active column to exams table for CBT approval system
ALTER TABLE public.exams ADD COLUMN IF NOT EXISTS is_exam_active boolean DEFAULT false;

-- Create online_classes table
CREATE TABLE IF NOT EXISTS public.online_classes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  teacher_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  class_id text NOT NULL,
  subject text,
  start_time timestamp with time zone NOT NULL,
  end_time timestamp with time zone,
  meeting_url text,
  status text DEFAULT 'scheduled',
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.online_classes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage all online classes" ON public.online_classes
FOR ALL USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Teachers can manage their own classes" ON public.online_classes
FOR ALL USING (teacher_id = auth.uid());

CREATE POLICY "Students can view classes for their class" ON public.online_classes
FOR SELECT USING (class_id = get_user_class(auth.uid()));

-- Create learning_materials table
CREATE TABLE IF NOT EXISTS public.learning_materials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  subject text NOT NULL,
  class_id text NOT NULL,
  file_url text NOT NULL,
  file_type text,
  file_size text,
  uploaded_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.learning_materials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage all materials" ON public.learning_materials
FOR ALL USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Teachers can manage their own materials" ON public.learning_materials
FOR ALL USING (uploaded_by = auth.uid());

CREATE POLICY "Students can view materials for their class" ON public.learning_materials
FOR SELECT USING (class_id = get_user_class(auth.uid()));

-- Create fee_payments table
CREATE TABLE IF NOT EXISTS public.fee_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  class_id text NOT NULL,
  amount_payable numeric NOT NULL DEFAULT 0,
  amount_paid numeric NOT NULL DEFAULT 0,
  balance numeric GENERATED ALWAYS AS (amount_payable - amount_paid) STORED,
  installment text DEFAULT '1st Installment',
  status text DEFAULT 'unpaid',
  term text NOT NULL,
  academic_year text NOT NULL,
  last_payment_date timestamp with time zone,
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.fee_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage all fee payments" ON public.fee_payments
FOR ALL USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Students can view their own fee payments" ON public.fee_payments
FOR SELECT USING (student_id = auth.uid());

-- Create messages table
CREATE TABLE IF NOT EXISTS public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL,
  subject text,
  content text NOT NULL,
  recipients_type text NOT NULL,
  class_id text,
  sent_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  status text DEFAULT 'sent',
  sent_at timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage all messages" ON public.messages
FOR ALL USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Teachers can manage their own messages" ON public.messages
FOR ALL USING (sent_by = auth.uid());

-- Create school_settings table
CREATE TABLE IF NOT EXISTS public.school_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_name text DEFAULT 'EduManage School',
  motto text,
  email text,
  phone text,
  address text,
  academic_year text DEFAULT '2024/2025',
  term text DEFAULT 'First Term',
  logo_url text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.school_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view school settings" ON public.school_settings
FOR SELECT USING (true);

CREATE POLICY "Admins can manage school settings" ON public.school_settings
FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Insert default school settings
INSERT INTO public.school_settings (school_name, motto, email, phone, address, academic_year, term)
VALUES ('EduManage School', 'Excellence in Education', 'admin@school.edu', '+234 800 000 0000', '123 School Street, Lagos, Nigeria', '2024/2025', 'First Term')
ON CONFLICT DO NOTHING;

-- Create teachers table for managing teacher records
CREATE TABLE IF NOT EXISTS public.teachers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  email text NOT NULL,
  phone text,
  subject text NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.teachers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage all teachers" ON public.teachers
FOR ALL USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Teachers can view their own record" ON public.teachers
FOR SELECT USING (user_id = auth.uid());

-- Create storage bucket for student photos
INSERT INTO storage.buckets (id, name, public) 
VALUES ('student-photos', 'student-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for student photos
CREATE POLICY "Anyone can view student photos" ON storage.objects
FOR SELECT USING (bucket_id = 'student-photos');

CREATE POLICY "Admins can upload student photos" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'student-photos' AND has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update student photos" ON storage.objects
FOR UPDATE USING (bucket_id = 'student-photos' AND has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete student photos" ON storage.objects
FOR DELETE USING (bucket_id = 'student-photos' AND has_role(auth.uid(), 'admin'));

-- Create function to get user by admission number
CREATE OR REPLACE FUNCTION public.get_user_by_admission_number(_admission_number text)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT student_id FROM public.student_classes WHERE admission_number = _admission_number LIMIT 1
$$;
