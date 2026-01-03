-- Allow admins to insert profiles (needed for registration flow)
CREATE POLICY "Admins can insert profiles"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR auth.uid() = id);

-- Allow service role and superadmins to insert profiles
CREATE POLICY "Service role can insert profiles"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'superadmin'::app_role));

-- Allow admins to update subscriptions for their school
CREATE POLICY "Admins can update their subscription"
ON public.subscriptions
FOR UPDATE
TO authenticated
USING (school_id = get_user_school(auth.uid()))
WITH CHECK (school_id = get_user_school(auth.uid()));