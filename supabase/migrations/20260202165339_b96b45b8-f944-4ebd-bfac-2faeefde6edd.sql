-- Create a SECURITY DEFINER function to safely lookup student for login
-- This allows unauthenticated users to find student records by admission number
-- without exposing the full students table

CREATE OR REPLACE FUNCTION public.lookup_student_for_login(p_admission_number TEXT)
RETURNS TABLE (
  id UUID,
  email TEXT,
  user_id UUID,
  admission_number TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id,
    s.email,
    s.user_id,
    s.admission_number
  FROM public.students s
  WHERE LOWER(TRIM(s.admission_number)) = LOWER(TRIM(p_admission_number))
  LIMIT 1;
END;
$$;