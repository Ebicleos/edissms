-- Schools table for multi-tenancy
CREATE TABLE public.schools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  email TEXT,
  phone TEXT,
  address TEXT,
  logo_url TEXT,
  initials TEXT,
  is_active BOOLEAN DEFAULT true,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Subscriptions table
CREATE TABLE public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE NOT NULL,
  plan_type TEXT NOT NULL CHECK (plan_type IN ('termly', 'yearly')),
  status TEXT DEFAULT 'trial' CHECK (status IN ('active', 'expired', 'cancelled', 'trial')),
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE NOT NULL,
  amount NUMERIC NOT NULL DEFAULT 0,
  payment_reference TEXT,
  max_students INTEGER DEFAULT 500,
  max_teachers INTEGER DEFAULT 50,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Add school_id to key tables for multi-tenancy
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS school_id UUID REFERENCES public.schools(id);
ALTER TABLE public.teachers ADD COLUMN IF NOT EXISTS school_id UUID REFERENCES public.schools(id);
ALTER TABLE public.classes ADD COLUMN IF NOT EXISTS school_id UUID REFERENCES public.schools(id);
ALTER TABLE public.exams ADD COLUMN IF NOT EXISTS school_id UUID REFERENCES public.schools(id);
ALTER TABLE public.subjects ADD COLUMN IF NOT EXISTS school_id UUID REFERENCES public.schools(id);
ALTER TABLE public.fee_structures ADD COLUMN IF NOT EXISTS school_id UUID REFERENCES public.schools(id);
ALTER TABLE public.school_settings ADD COLUMN IF NOT EXISTS school_id UUID REFERENCES public.schools(id);
ALTER TABLE public.user_roles ADD COLUMN IF NOT EXISTS school_id UUID REFERENCES public.schools(id);
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS school_id UUID REFERENCES public.schools(id);
ALTER TABLE public.assignments ADD COLUMN IF NOT EXISTS school_id UUID REFERENCES public.schools(id);
ALTER TABLE public.announcements ADD COLUMN IF NOT EXISTS school_id UUID REFERENCES public.schools(id);
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS school_id UUID REFERENCES public.schools(id);

-- Create helper function for multi-tenancy
CREATE OR REPLACE FUNCTION public.get_user_school(_user_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT school_id FROM public.profiles WHERE id = _user_id LIMIT 1
$$;

-- Enable RLS on schools table
ALTER TABLE public.schools ENABLE ROW LEVEL SECURITY;

-- RLS policies for schools table
CREATE POLICY "Superadmins can manage all schools"
  ON public.schools FOR ALL
  USING (has_role(auth.uid(), 'superadmin'::app_role));

CREATE POLICY "Admins can view their school"
  ON public.schools FOR SELECT
  USING (id = get_user_school(auth.uid()));

-- Enable RLS on subscriptions table
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS policies for subscriptions
CREATE POLICY "Superadmins can manage all subscriptions"
  ON public.subscriptions FOR ALL
  USING (has_role(auth.uid(), 'superadmin'::app_role));

CREATE POLICY "Admins can view their subscription"
  ON public.subscriptions FOR SELECT
  USING (school_id = get_user_school(auth.uid()));