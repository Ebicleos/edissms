-- Drop the incorrect existing policy
DROP POLICY IF EXISTS "Students can view their own fee payments" ON public.fee_payments;

-- Create corrected policy that uses the student record ID, not auth.uid() directly
CREATE POLICY "Students can view their own fee payments"
ON public.fee_payments FOR SELECT
USING (
  student_id IN (
    SELECT id FROM public.students WHERE user_id = auth.uid()
  )
);