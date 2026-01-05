-- Create password_reset_requests table for tracking reset attempts
CREATE TABLE IF NOT EXISTS public.password_reset_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  email TEXT NOT NULL,
  role TEXT NOT NULL,
  school_id UUID,
  requested_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'pending',
  admin_notes TEXT,
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolved_by UUID
);

-- Enable RLS on password_reset_requests
ALTER TABLE public.password_reset_requests ENABLE ROW LEVEL SECURITY;

-- RLS policies for password_reset_requests
CREATE POLICY "Admins and superadmins can manage password reset requests"
ON public.password_reset_requests
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'superadmin'::app_role));

CREATE POLICY "Users can insert their own reset requests"
ON public.password_reset_requests
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Users can view their own reset requests"
ON public.password_reset_requests
FOR SELECT
USING (email = (SELECT email FROM profiles WHERE id = auth.uid()));

-- Add school_id column to fee_payments if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'fee_payments' AND column_name = 'school_id'
  ) THEN
    ALTER TABLE public.fee_payments ADD COLUMN school_id UUID REFERENCES public.schools(id);
  END IF;
END $$;

-- Update RLS policy on fee_payments to include school_id filtering for admins
DROP POLICY IF EXISTS "Admins and superadmins can manage all fee payments" ON public.fee_payments;

CREATE POLICY "Admins and superadmins can manage all fee payments"
ON public.fee_payments
FOR ALL
USING (
  has_role(auth.uid(), 'superadmin'::app_role) OR 
  (has_role(auth.uid(), 'admin'::app_role) AND school_id = get_user_school(auth.uid()))
);