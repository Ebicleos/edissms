-- Create platform_settings table for global settings (maintenance mode, system announcements, etc.)
CREATE TABLE IF NOT EXISTS public.platform_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  value JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

-- Allow everyone to read platform settings (needed for maintenance mode check)
CREATE POLICY "Everyone can read platform settings"
ON public.platform_settings
FOR SELECT
USING (true);

-- Only superadmins can modify platform settings
CREATE POLICY "Only superadmins can manage platform settings"
ON public.platform_settings
FOR ALL
USING (has_role(auth.uid(), 'superadmin'))
WITH CHECK (has_role(auth.uid(), 'superadmin'));

-- Insert default settings
INSERT INTO public.platform_settings (key, value) VALUES
  ('maintenance_mode', '{"enabled": false, "message": ""}'::jsonb),
  ('system_announcement', '{"message": "", "type": "info"}'::jsonb),
  ('platform_config', '{"name": "EduManage", "support_email": "support@edumanage.com", "allow_registrations": true}'::jsonb),
  ('pricing', '{"termly": 50000, "yearly": 120000, "trial_days": 30}'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- Create trigger for updated_at
CREATE TRIGGER update_platform_settings_updated_at
BEFORE UPDATE ON public.platform_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();