-- Create RPC function for paginated students with search and filter
CREATE OR REPLACE FUNCTION public.get_paginated_students(
  p_school_id uuid,
  p_page_number integer DEFAULT 1,
  p_page_size integer DEFAULT 10,
  p_search_term text DEFAULT NULL,
  p_class_filter text DEFAULT NULL
)
RETURNS TABLE(
  id uuid,
  admission_number text,
  full_name text,
  gender text,
  class_id text,
  date_of_birth text,
  guardian_name text,
  phone_contact text,
  email text,
  address text,
  photo_url text,
  date_of_admission text,
  academic_year text,
  term text,
  admission_fee numeric,
  school_id uuid,
  user_id uuid,
  created_at timestamptz,
  total_count bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_offset integer;
  v_total bigint;
BEGIN
  -- Calculate offset
  v_offset := (p_page_number - 1) * p_page_size;
  
  -- Get total count first
  SELECT COUNT(*)::bigint INTO v_total
  FROM students s
  WHERE s.school_id = p_school_id
    AND (p_search_term IS NULL OR p_search_term = '' OR 
         s.full_name ILIKE '%' || p_search_term || '%' OR
         s.admission_number ILIKE '%' || p_search_term || '%')
    AND (p_class_filter IS NULL OR p_class_filter = '' OR s.class_id = p_class_filter);
  
  -- Return paginated results with total count
  RETURN QUERY
  SELECT 
    s.id,
    s.admission_number,
    s.full_name,
    s.gender,
    s.class_id,
    s.date_of_birth,
    s.guardian_name,
    s.phone_contact,
    s.email,
    s.address,
    s.photo_url,
    s.date_of_admission,
    s.academic_year,
    s.term,
    s.admission_fee,
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