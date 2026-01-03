-- Add school_initials column to school_settings for admission number generation
ALTER TABLE public.school_settings 
ADD COLUMN IF NOT EXISTS school_initials TEXT;

-- Create announcements table
CREATE TABLE IF NOT EXISTS public.announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  type TEXT DEFAULT 'general' CHECK (type IN ('general', 'urgent', 'event')),
  target_audience TEXT DEFAULT 'all' CHECK (target_audience IN ('all', 'teachers', 'students', 'parents')),
  is_published BOOLEAN DEFAULT false,
  publish_date TIMESTAMPTZ,
  expiry_date TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on announcements
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

-- RLS policies for announcements
CREATE POLICY "Admins can manage all announcements"
ON public.announcements
FOR ALL
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Teachers can view published announcements"
ON public.announcements
FOR SELECT
USING (has_role(auth.uid(), 'teacher') AND is_published = true);

CREATE POLICY "Students can view published announcements for their audience"
ON public.announcements
FOR SELECT
USING (
  has_role(auth.uid(), 'student') AND 
  is_published = true AND 
  (target_audience = 'all' OR target_audience = 'students')
);

-- Create events table
CREATE TABLE IF NOT EXISTS public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  event_date DATE NOT NULL,
  start_time TIME,
  end_time TIME,
  location TEXT,
  is_all_day BOOLEAN DEFAULT false,
  event_type TEXT DEFAULT 'general' CHECK (event_type IN ('general', 'academic', 'holiday', 'sports', 'cultural')),
  is_published BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on events
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- RLS policies for events
CREATE POLICY "Admins can manage all events"
ON public.events
FOR ALL
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Teachers can manage their own events"
ON public.events
FOR ALL
USING (has_role(auth.uid(), 'teacher') AND created_by = auth.uid());

CREATE POLICY "Authenticated users can view published events"
ON public.events
FOR SELECT
USING (auth.uid() IS NOT NULL AND is_published = true);

-- Create user_password_resets table for admin-controlled password resets
CREATE TABLE IF NOT EXISTS public.user_password_resets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  requested_by UUID NOT NULL REFERENCES auth.users(id),
  reset_token TEXT,
  is_used BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ DEFAULT (now() + interval '24 hours')
);

-- Enable RLS on user_password_resets
ALTER TABLE public.user_password_resets ENABLE ROW LEVEL SECURITY;

-- Only admins can manage password resets
CREATE POLICY "Admins can manage password resets"
ON public.user_password_resets
FOR ALL
USING (has_role(auth.uid(), 'admin'));