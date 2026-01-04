-- Add payment gateway configuration columns to schools table
ALTER TABLE public.schools ADD COLUMN IF NOT EXISTS payment_gateway_provider TEXT DEFAULT 'paystack';
ALTER TABLE public.schools ADD COLUMN IF NOT EXISTS payment_gateway_public_key TEXT;
ALTER TABLE public.schools ADD COLUMN IF NOT EXISTS payment_gateway_secret_key TEXT;
ALTER TABLE public.schools ADD COLUMN IF NOT EXISTS payment_gateway_webhook_secret TEXT;
ALTER TABLE public.schools ADD COLUMN IF NOT EXISTS payment_gateway_enabled BOOLEAN DEFAULT false;