-- Extend school_settings for report card customization
ALTER TABLE public.school_settings
ADD COLUMN IF NOT EXISTS principal_name text,
ADD COLUMN IF NOT EXISTS next_term_begins date,
ADD COLUMN IF NOT EXISTS closing_date date,
ADD COLUMN IF NOT EXISTS grading_scale jsonb DEFAULT '[
  {"min": 80, "max": 100, "grade": "A", "remarks": "Excellent"},
  {"min": 75, "max": 79, "grade": "B+", "remarks": "Very Good"},
  {"min": 70, "max": 74, "grade": "B", "remarks": "Good"},
  {"min": 60, "max": 69, "grade": "C", "remarks": "Credit"},
  {"min": 50, "max": 59, "grade": "D", "remarks": "Pass"},
  {"min": 0, "max": 49, "grade": "F", "remarks": "Fail"}
]'::jsonb,
ADD COLUMN IF NOT EXISTS report_card_config jsonb DEFAULT '{
  "showAnnualSummary": true,
  "showSubjectPosition": true,
  "showAttendance": true,
  "showAttitudeFields": true
}'::jsonb;

-- Extend report_cards with additional fields
ALTER TABLE public.report_cards
ADD COLUMN IF NOT EXISTS attitude text,
ADD COLUMN IF NOT EXISTS interest text,
ADD COLUMN IF NOT EXISTS conduct text,
ADD COLUMN IF NOT EXISTS promotion_status text,
ADD COLUMN IF NOT EXISTS closing_date date,
ADD COLUMN IF NOT EXISTS attendance_present integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS attendance_total integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS term_summary jsonb;

-- Extend student_grades with subject position
ALTER TABLE public.student_grades
ADD COLUMN IF NOT EXISTS subject_position integer;

-- Create promotion_history table
CREATE TABLE IF NOT EXISTS public.promotion_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL,
  from_class text NOT NULL,
  to_class text NOT NULL,
  academic_year text NOT NULL,
  promoted_by uuid,
  promotion_date timestamp with time zone DEFAULT now(),
  average_score numeric,
  status text NOT NULL DEFAULT 'promoted',
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on promotion_history
ALTER TABLE public.promotion_history ENABLE ROW LEVEL SECURITY;

-- RLS policies for promotion_history
CREATE POLICY "Admins can manage all promotions"
ON public.promotion_history
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Students can view their own promotion history"
ON public.promotion_history
FOR SELECT
USING (student_id = auth.uid());

CREATE POLICY "Teachers can view promotions for their classes"
ON public.promotion_history
FOR SELECT
USING (
  has_role(auth.uid(), 'teacher'::app_role) AND
  EXISTS (
    SELECT 1 FROM teacher_classes tc 
    WHERE tc.teacher_id = auth.uid() 
    AND (tc.class_id = promotion_history.from_class OR tc.class_id = promotion_history.to_class)
  )
);