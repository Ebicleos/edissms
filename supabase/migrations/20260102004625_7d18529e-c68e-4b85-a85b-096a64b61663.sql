-- Allow users to insert their own role during signup
CREATE POLICY "Users can insert their own role during signup"
ON public.user_roles
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Now insert the missing role for the existing user
INSERT INTO public.user_roles (user_id, role)
VALUES ('a066690b-69a9-4613-8e4e-ca935899e556', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;