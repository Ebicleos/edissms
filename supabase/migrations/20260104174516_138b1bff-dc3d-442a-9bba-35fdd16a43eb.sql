-- Allow anyone to view students for signup validation (needed for unauthenticated student lookup during signup)
CREATE POLICY "Anyone can view students for signup validation" 
ON public.students
FOR SELECT 
USING (true);