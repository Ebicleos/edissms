-- Create a trigger function to prevent self-assignment of admin role during signup
CREATE OR REPLACE FUNCTION public.prevent_admin_self_assignment()
RETURNS TRIGGER AS $$
BEGIN
  -- If trying to insert admin role
  IF NEW.role = 'admin' THEN
    -- Check if any admin already exists
    IF EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'admin') THEN
      -- Only allow if the current user is already an admin (assigning to someone else)
      IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin') THEN
        RAISE EXCEPTION 'Cannot self-assign admin role. An admin already exists.';
      END IF;
    END IF;
    -- If no admin exists, this is the first admin - allow it
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger on user_roles table
DROP TRIGGER IF EXISTS enforce_admin_role_insert ON public.user_roles;

CREATE TRIGGER enforce_admin_role_insert
  BEFORE INSERT ON public.user_roles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_admin_self_assignment();