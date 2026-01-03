-- Drop the existing trigger function
DROP FUNCTION IF EXISTS public.prevent_admin_self_assignment() CASCADE;

-- Create new trigger function that allows superadmins to add admin roles
CREATE OR REPLACE FUNCTION public.prevent_admin_self_assignment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- If trying to insert admin role
  IF NEW.role = 'admin' THEN
    -- Check if any admin already exists
    IF EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'admin') THEN
      -- Allow if the current user is a superadmin
      IF EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'superadmin') THEN
        RETURN NEW;
      END IF;
      -- Allow if the current user is already an admin (assigning to someone else)
      IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin') THEN
        RAISE EXCEPTION 'Cannot self-assign admin role. An admin already exists.';
      END IF;
    END IF;
    -- If no admin exists, this is the first admin - allow it
  END IF;
  
  RETURN NEW;
END;
$$;

-- Recreate the trigger
CREATE TRIGGER prevent_admin_self_assignment
BEFORE INSERT ON public.user_roles
FOR EACH ROW
EXECUTE FUNCTION public.prevent_admin_self_assignment();