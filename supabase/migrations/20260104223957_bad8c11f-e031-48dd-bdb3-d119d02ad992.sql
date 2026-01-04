-- Fix: Grant execute permission on security functions to authenticated users
-- These functions are SECURITY DEFINER and only return boolean/ID values
-- They are essential for RLS policies to evaluate correctly

GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_class(uuid) TO authenticated;