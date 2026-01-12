-- Create RPC function for secure student linking (bypasses RLS)
CREATE OR REPLACE FUNCTION link_student_to_user(
  p_admission_number TEXT,
  p_user_id UUID,
  p_email TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE students 
  SET user_id = p_user_id, email = p_email
  WHERE admission_number = p_admission_number
    AND user_id IS NULL;
  
  RETURN FOUND;
END;
$$;

-- Fix existing unlinked student accounts by linking via student_classes
UPDATE students s
SET user_id = sc.student_id
FROM student_classes sc
WHERE s.admission_number = sc.admission_number
  AND s.user_id IS NULL
  AND sc.student_id IS NOT NULL;