-- Fix get_paginated_students function - correct date column types
DROP FUNCTION IF EXISTS get_paginated_students(uuid, integer, integer, text, text);

CREATE OR REPLACE FUNCTION public.get_paginated_students(
  p_school_id UUID,
  p_page_number INTEGER DEFAULT 1,
  p_page_size INTEGER DEFAULT 10,
  p_search_term TEXT DEFAULT NULL,
  p_class_filter TEXT DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  admission_number TEXT,
  full_name TEXT,
  gender TEXT,
  class_id TEXT,
  date_of_birth DATE,
  date_of_admission DATE,
  admission_fee NUMERIC,
  academic_year TEXT,
  term TEXT,
  guardian_name TEXT,
  address TEXT,
  phone_contact TEXT,
  email TEXT,
  photo_url TEXT,
  school_id UUID,
  user_id UUID,
  created_at TIMESTAMPTZ,
  total_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_offset INTEGER;
  v_total BIGINT;
BEGIN
  v_offset := (p_page_number - 1) * p_page_size;
  
  SELECT COUNT(*)::BIGINT INTO v_total
  FROM students s
  WHERE s.school_id = p_school_id
    AND (p_search_term IS NULL OR p_search_term = '' OR 
         s.full_name ILIKE '%' || p_search_term || '%' OR
         s.admission_number ILIKE '%' || p_search_term || '%')
    AND (p_class_filter IS NULL OR p_class_filter = '' OR s.class_id = p_class_filter);
  
  RETURN QUERY
  SELECT 
    s.id,
    s.admission_number,
    s.full_name,
    s.gender,
    s.class_id,
    s.date_of_birth,
    s.date_of_admission,
    s.admission_fee,
    s.academic_year,
    s.term,
    s.guardian_name,
    s.address,
    s.phone_contact,
    s.email,
    s.photo_url,
    s.school_id,
    s.user_id,
    s.created_at,
    v_total as total_count
  FROM students s
  WHERE s.school_id = p_school_id
    AND (p_search_term IS NULL OR p_search_term = '' OR 
         s.full_name ILIKE '%' || p_search_term || '%' OR
         s.admission_number ILIKE '%' || p_search_term || '%')
    AND (p_class_filter IS NULL OR p_class_filter = '' OR s.class_id = p_class_filter)
  ORDER BY s.created_at DESC
  LIMIT p_page_size
  OFFSET v_offset;
END;
$$;

-- Fix fee_payments foreign key to reference students table instead of auth.users
ALTER TABLE fee_payments 
DROP CONSTRAINT IF EXISTS fee_payments_student_id_fkey;

ALTER TABLE fee_payments 
ADD CONSTRAINT fee_payments_student_id_fkey 
FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE;