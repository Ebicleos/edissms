
-- Phase 1: Create all new tables for features
-- Skip multi-tenant schools table for now to avoid complexity

-- 1.1 Create classes table (for dynamic class management)
CREATE TABLE public.classes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  level TEXT NOT NULL,
  capacity INTEGER DEFAULT 30,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Classes viewable by authenticated users"
ON public.classes FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage classes"
ON public.classes FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- 1.2 Fee structures table
CREATE TABLE public.fee_structures (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  class_id TEXT NOT NULL,
  term TEXT NOT NULL,
  academic_year TEXT NOT NULL,
  tuition_fee NUMERIC DEFAULT 0,
  development_fee NUMERIC DEFAULT 0,
  uniform_fee NUMERIC DEFAULT 0,
  books_fee NUMERIC DEFAULT 0,
  exam_fee NUMERIC DEFAULT 0,
  other_fees NUMERIC DEFAULT 0,
  total_amount NUMERIC GENERATED ALWAYS AS (tuition_fee + development_fee + uniform_fee + books_fee + exam_fee + other_fees) STORED,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.fee_structures ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Fee structures viewable by authenticated users"
ON public.fee_structures FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage fee structures"
ON public.fee_structures FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- 1.3 Payment transactions table
CREATE TABLE public.payment_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  fee_payment_id UUID REFERENCES public.fee_payments(id) ON DELETE CASCADE NOT NULL,
  amount NUMERIC NOT NULL,
  payment_method TEXT NOT NULL,
  transaction_reference TEXT,
  payment_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
  status TEXT DEFAULT 'completed',
  recorded_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view their transactions"
ON public.payment_transactions FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.fee_payments fp
    WHERE fp.id = payment_transactions.fee_payment_id AND fp.student_id = auth.uid()
  )
);

CREATE POLICY "Admins can manage all transactions"
ON public.payment_transactions FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- 1.4 Attendance table
CREATE TABLE public.attendance (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL,
  class_id TEXT NOT NULL,
  date DATE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('present', 'absent', 'late', 'excused')),
  marked_by UUID,
  remarks TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(student_id, date)
);

ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view their own attendance"
ON public.attendance FOR SELECT
USING (student_id = auth.uid());

CREATE POLICY "Teachers can manage attendance for their classes"
ON public.attendance FOR ALL
USING (
  has_role(auth.uid(), 'teacher') AND
  EXISTS (
    SELECT 1 FROM public.teacher_classes tc
    WHERE tc.teacher_id = auth.uid() AND tc.class_id = attendance.class_id
  )
);

CREATE POLICY "Admins can manage all attendance"
ON public.attendance FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- 1.5 Subjects table
CREATE TABLE public.subjects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT,
  class_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Subjects viewable by authenticated users"
ON public.subjects FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage subjects"
ON public.subjects FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- 1.6 Student grades table
CREATE TABLE public.student_grades (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL,
  subject_id UUID REFERENCES public.subjects(id),
  subject_name TEXT NOT NULL,
  class_id TEXT NOT NULL,
  term TEXT NOT NULL,
  academic_year TEXT NOT NULL,
  ca1_score NUMERIC DEFAULT 0,
  ca2_score NUMERIC DEFAULT 0,
  ca3_score NUMERIC DEFAULT 0,
  exam_score NUMERIC DEFAULT 0,
  total_score NUMERIC GENERATED ALWAYS AS (ca1_score + ca2_score + ca3_score + exam_score) STORED,
  grade TEXT,
  remarks TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.student_grades ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view their own grades"
ON public.student_grades FOR SELECT
USING (student_id = auth.uid());

CREATE POLICY "Teachers can manage grades for their classes"
ON public.student_grades FOR ALL
USING (
  has_role(auth.uid(), 'teacher') AND
  EXISTS (
    SELECT 1 FROM public.teacher_classes tc
    WHERE tc.teacher_id = auth.uid() AND tc.class_id = student_grades.class_id
  )
);

CREATE POLICY "Admins can manage all grades"
ON public.student_grades FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- 1.7 Report cards table
CREATE TABLE public.report_cards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL,
  term TEXT NOT NULL,
  academic_year TEXT NOT NULL,
  class_id TEXT NOT NULL,
  position INTEGER,
  total_students INTEGER,
  average_score NUMERIC,
  total_marks_obtained NUMERIC,
  total_marks_obtainable NUMERIC,
  principal_remarks TEXT,
  teacher_remarks TEXT,
  next_term_begins DATE,
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.report_cards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view their own report cards"
ON public.report_cards FOR SELECT
USING (student_id = auth.uid());

CREATE POLICY "Teachers can view report cards for their classes"
ON public.report_cards FOR SELECT
USING (
  has_role(auth.uid(), 'teacher') AND
  EXISTS (
    SELECT 1 FROM public.teacher_classes tc
    WHERE tc.teacher_id = auth.uid() AND tc.class_id = report_cards.class_id
  )
);

CREATE POLICY "Admins can manage all report cards"
ON public.report_cards FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- 1.8 Exam sessions table for security
CREATE TABLE public.exam_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  exam_id UUID REFERENCES public.exams(id) ON DELETE CASCADE NOT NULL,
  student_id UUID NOT NULL,
  session_token TEXT NOT NULL UNIQUE,
  ip_address TEXT,
  user_agent TEXT,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  last_activity TIMESTAMP WITH TIME ZONE DEFAULT now(),
  is_active BOOLEAN DEFAULT true,
  tab_switches INTEGER DEFAULT 0,
  suspicious_activity JSONB DEFAULT '[]'::jsonb
);

ALTER TABLE public.exam_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can manage their own sessions"
ON public.exam_sessions FOR ALL
USING (student_id = auth.uid());

CREATE POLICY "Admins can view all sessions"
ON public.exam_sessions FOR SELECT
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Teachers can view sessions for their exams"
ON public.exam_sessions FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.exams e
    WHERE e.id = exam_sessions.exam_id AND e.teacher_id = auth.uid()
  )
);

-- 1.9 Audit logs table
CREATE TABLE public.audit_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  old_data JSONB,
  new_data JSONB,
  ip_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view audit logs"
ON public.audit_logs FOR SELECT
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "System can insert audit logs"
ON public.audit_logs FOR INSERT
WITH CHECK (true);

-- 1.10 Create indexes for performance
CREATE INDEX idx_attendance_student_date ON public.attendance(student_id, date);
CREATE INDEX idx_student_grades_student ON public.student_grades(student_id, term, academic_year);
CREATE INDEX idx_audit_logs_created ON public.audit_logs(created_at);
CREATE INDEX idx_exam_sessions_exam ON public.exam_sessions(exam_id, student_id);
