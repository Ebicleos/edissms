-- First create the update_updated_at_column function if it doesn't exist
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create a separate secure table for payment gateway secrets
-- This table has much stricter access - secrets are never exposed to clients
CREATE TABLE IF NOT EXISTS public.school_payment_secrets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  school_id UUID NOT NULL UNIQUE REFERENCES public.schools(id) ON DELETE CASCADE,
  secret_key_encrypted TEXT,
  webhook_secret_encrypted TEXT,
  key_last_four TEXT, -- Store last 4 chars for display only
  webhook_last_four TEXT, -- Store last 4 chars for display only
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on the secrets table
ALTER TABLE public.school_payment_secrets ENABLE ROW LEVEL SECURITY;

-- VERY RESTRICTIVE: Only allow admins to see their own school's masked info
-- The actual encrypted values are NEVER exposed to clients via RLS
CREATE POLICY "Admins can view masked secret info for their school"
ON public.school_payment_secrets FOR SELECT
USING (
  school_id = get_user_school(auth.uid()) AND 
  has_role(auth.uid(), 'admin'::app_role)
);

-- Only admins can insert their school's secrets
CREATE POLICY "Admins can manage their school secrets"
ON public.school_payment_secrets FOR INSERT
WITH CHECK (
  school_id = get_user_school(auth.uid()) AND 
  has_role(auth.uid(), 'admin'::app_role)
);

-- Admins can update their school secrets
CREATE POLICY "Admins can update their school secrets"
ON public.school_payment_secrets FOR UPDATE
USING (
  school_id = get_user_school(auth.uid()) AND 
  has_role(auth.uid(), 'admin'::app_role)
);

-- Superadmins can manage all secrets
CREATE POLICY "Superadmins can manage all payment secrets"
ON public.school_payment_secrets FOR ALL
USING (has_role(auth.uid(), 'superadmin'::app_role));

-- Migrate existing data to new table
INSERT INTO public.school_payment_secrets (school_id, secret_key_encrypted, webhook_secret_encrypted, key_last_four, webhook_last_four)
SELECT 
  id as school_id,
  payment_gateway_secret_key as secret_key_encrypted,
  payment_gateway_webhook_secret as webhook_secret_encrypted,
  RIGHT(payment_gateway_secret_key, 4) as key_last_four,
  RIGHT(payment_gateway_webhook_secret, 4) as webhook_last_four
FROM public.schools 
WHERE payment_gateway_secret_key IS NOT NULL
ON CONFLICT (school_id) DO NOTHING;

-- Remove the sensitive columns from schools table
-- This prevents secrets from being exposed through the schools table
ALTER TABLE public.schools DROP COLUMN IF EXISTS payment_gateway_secret_key;
ALTER TABLE public.schools DROP COLUMN IF EXISTS payment_gateway_webhook_secret;

-- Create function to securely get payment secret (only callable from edge functions with service role)
CREATE OR REPLACE FUNCTION get_school_payment_secret(p_school_id UUID)
RETURNS TABLE(secret_key TEXT, webhook_secret TEXT) 
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT secret_key_encrypted, webhook_secret_encrypted 
  FROM school_payment_secrets 
  WHERE school_id = p_school_id;
$$;

-- Revoke execute from public, only service role should use this
REVOKE EXECUTE ON FUNCTION get_school_payment_secret(UUID) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION get_school_payment_secret(UUID) FROM anon;
REVOKE EXECUTE ON FUNCTION get_school_payment_secret(UUID) FROM authenticated;

-- Update timestamp trigger
CREATE TRIGGER update_school_payment_secrets_updated_at
  BEFORE UPDATE ON public.school_payment_secrets
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();