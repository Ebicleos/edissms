-- Improve get_school_payment_secret function with internal authorization check
-- This adds defense-in-depth by verifying the caller has admin/superadmin role

CREATE OR REPLACE FUNCTION public.get_school_payment_secret(p_school_id uuid)
RETURNS TABLE(secret_key text, webhook_secret text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verify caller has admin or superadmin role with appropriate school access
  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'superadmin')
    AND (role = 'superadmin' OR school_id = p_school_id)
  ) THEN
    RAISE EXCEPTION 'Unauthorized access to payment secrets';
  END IF;

  -- Return the secrets
  RETURN QUERY
  SELECT secret_key_encrypted, webhook_secret_encrypted 
  FROM school_payment_secrets 
  WHERE school_payment_secrets.school_id = p_school_id;
END;
$$;