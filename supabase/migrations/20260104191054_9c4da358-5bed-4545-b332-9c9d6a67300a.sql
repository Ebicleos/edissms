-- Revoke public execute on information-gathering functions to prevent enumeration
-- These functions are primarily used within RLS policies and don't need direct RPC access

REVOKE EXECUTE ON FUNCTION public.get_user_class(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_user_class(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_user_class(uuid) FROM authenticated;

REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM anon;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM authenticated;

-- Note: get_user_by_admission_number is kept accessible for student signup validation
-- but we add a rate limit comment and consider replacing with edge function in future

-- Grant execute only to postgres (service role) for RLS policy evaluation
GRANT EXECUTE ON FUNCTION public.get_user_class(uuid) TO postgres;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO postgres;