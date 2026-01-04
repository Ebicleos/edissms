-- Add is_test column to exam_submissions for admin test mode
ALTER TABLE public.exam_submissions 
ADD COLUMN IF NOT EXISTS is_test boolean DEFAULT false;