-- Fix RLS policies by adding missing WITH CHECK clauses

-- fee_payments
DROP POLICY IF EXISTS "Admins and superadmins can manage all fee payments" ON public.fee_payments;
CREATE POLICY "Admins and superadmins can manage all fee payments"
ON public.fee_payments FOR ALL TO authenticated
USING (
  has_role(auth.uid(), 'superadmin'::app_role) OR 
  (has_role(auth.uid(), 'admin'::app_role) AND school_id = get_user_school(auth.uid()))
)
WITH CHECK (
  has_role(auth.uid(), 'superadmin'::app_role) OR 
  (has_role(auth.uid(), 'admin'::app_role) AND school_id = get_user_school(auth.uid()))
);

-- student_classes
DROP POLICY IF EXISTS "Admins and superadmins can manage student classes" ON public.student_classes;
CREATE POLICY "Admins and superadmins can manage student classes"
ON public.student_classes FOR ALL TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'superadmin'::app_role)
)
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'superadmin'::app_role)
);

-- payment_transactions
DROP POLICY IF EXISTS "Admins and superadmins can manage all transactions" ON public.payment_transactions;
CREATE POLICY "Admins and superadmins can manage all transactions"
ON public.payment_transactions FOR ALL TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'superadmin'::app_role)
)
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'superadmin'::app_role)
);

-- classes
DROP POLICY IF EXISTS "Admins can manage classes in their school" ON public.classes;
CREATE POLICY "Admins can manage classes in their school"
ON public.classes FOR ALL TO authenticated
USING (
  has_role(auth.uid(), 'superadmin'::app_role) OR 
  (has_role(auth.uid(), 'admin'::app_role) AND school_id = get_user_school(auth.uid()))
)
WITH CHECK (
  has_role(auth.uid(), 'superadmin'::app_role) OR 
  (has_role(auth.uid(), 'admin'::app_role) AND school_id = get_user_school(auth.uid()))
);

-- assignments
DROP POLICY IF EXISTS "Teachers can manage assignments for their classes" ON public.assignments;
CREATE POLICY "Teachers can manage assignments for their classes"
ON public.assignments FOR ALL TO authenticated
USING (
  has_role(auth.uid(), 'superadmin'::app_role) OR 
  has_role(auth.uid(), 'admin'::app_role) OR
  (has_role(auth.uid(), 'teacher'::app_role) AND school_id = get_user_school(auth.uid()))
)
WITH CHECK (
  has_role(auth.uid(), 'superadmin'::app_role) OR 
  has_role(auth.uid(), 'admin'::app_role) OR
  (has_role(auth.uid(), 'teacher'::app_role) AND school_id = get_user_school(auth.uid()))
);

-- attendance
DROP POLICY IF EXISTS "Teachers can manage attendance for their classes" ON public.attendance;
CREATE POLICY "Teachers can manage attendance for their classes"
ON public.attendance FOR ALL TO authenticated
USING (
  has_role(auth.uid(), 'superadmin'::app_role) OR 
  has_role(auth.uid(), 'admin'::app_role) OR
  has_role(auth.uid(), 'teacher'::app_role)
)
WITH CHECK (
  has_role(auth.uid(), 'superadmin'::app_role) OR 
  has_role(auth.uid(), 'admin'::app_role) OR
  has_role(auth.uid(), 'teacher'::app_role)
);

-- events
DROP POLICY IF EXISTS "Teachers can manage events" ON public.events;
CREATE POLICY "Teachers can manage events"
ON public.events FOR ALL TO authenticated
USING (
  has_role(auth.uid(), 'superadmin'::app_role) OR 
  has_role(auth.uid(), 'admin'::app_role) OR
  (has_role(auth.uid(), 'teacher'::app_role) AND school_id = get_user_school(auth.uid()))
)
WITH CHECK (
  has_role(auth.uid(), 'superadmin'::app_role) OR 
  has_role(auth.uid(), 'admin'::app_role) OR
  (has_role(auth.uid(), 'teacher'::app_role) AND school_id = get_user_school(auth.uid()))
);

-- exam_sessions
DROP POLICY IF EXISTS "Teachers can manage exam sessions" ON public.exam_sessions;
CREATE POLICY "Teachers can manage exam sessions"
ON public.exam_sessions FOR ALL TO authenticated
USING (
  has_role(auth.uid(), 'superadmin'::app_role) OR 
  has_role(auth.uid(), 'admin'::app_role) OR
  has_role(auth.uid(), 'teacher'::app_role)
)
WITH CHECK (
  has_role(auth.uid(), 'superadmin'::app_role) OR 
  has_role(auth.uid(), 'admin'::app_role) OR
  has_role(auth.uid(), 'teacher'::app_role)
);

-- exam_submissions
DROP POLICY IF EXISTS "Teachers can manage exam submissions" ON public.exam_submissions;
CREATE POLICY "Teachers can manage exam submissions"
ON public.exam_submissions FOR ALL TO authenticated
USING (
  has_role(auth.uid(), 'superadmin'::app_role) OR 
  has_role(auth.uid(), 'admin'::app_role) OR
  has_role(auth.uid(), 'teacher'::app_role) OR
  student_id = auth.uid()
)
WITH CHECK (
  has_role(auth.uid(), 'superadmin'::app_role) OR 
  has_role(auth.uid(), 'admin'::app_role) OR
  has_role(auth.uid(), 'teacher'::app_role) OR
  student_id = auth.uid()
);

-- exams
DROP POLICY IF EXISTS "Teachers can manage exams for their classes" ON public.exams;
CREATE POLICY "Teachers can manage exams for their classes"
ON public.exams FOR ALL TO authenticated
USING (
  has_role(auth.uid(), 'superadmin'::app_role) OR 
  has_role(auth.uid(), 'admin'::app_role) OR
  (has_role(auth.uid(), 'teacher'::app_role) AND school_id = get_user_school(auth.uid()))
)
WITH CHECK (
  has_role(auth.uid(), 'superadmin'::app_role) OR 
  has_role(auth.uid(), 'admin'::app_role) OR
  (has_role(auth.uid(), 'teacher'::app_role) AND school_id = get_user_school(auth.uid()))
);

-- learning_materials
DROP POLICY IF EXISTS "Teachers can manage learning materials" ON public.learning_materials;
CREATE POLICY "Teachers can manage learning materials"
ON public.learning_materials FOR ALL TO authenticated
USING (
  has_role(auth.uid(), 'superadmin'::app_role) OR 
  has_role(auth.uid(), 'admin'::app_role) OR
  has_role(auth.uid(), 'teacher'::app_role)
)
WITH CHECK (
  has_role(auth.uid(), 'superadmin'::app_role) OR 
  has_role(auth.uid(), 'admin'::app_role) OR
  has_role(auth.uid(), 'teacher'::app_role)
);

-- messages
DROP POLICY IF EXISTS "Teachers can manage messages" ON public.messages;
CREATE POLICY "Teachers can manage messages"
ON public.messages FOR ALL TO authenticated
USING (
  has_role(auth.uid(), 'superadmin'::app_role) OR 
  has_role(auth.uid(), 'admin'::app_role) OR
  has_role(auth.uid(), 'teacher'::app_role)
)
WITH CHECK (
  has_role(auth.uid(), 'superadmin'::app_role) OR 
  has_role(auth.uid(), 'admin'::app_role) OR
  has_role(auth.uid(), 'teacher'::app_role)
);

-- online_classes
DROP POLICY IF EXISTS "Teachers can manage online classes" ON public.online_classes;
CREATE POLICY "Teachers can manage online classes"
ON public.online_classes FOR ALL TO authenticated
USING (
  has_role(auth.uid(), 'superadmin'::app_role) OR 
  has_role(auth.uid(), 'admin'::app_role) OR
  has_role(auth.uid(), 'teacher'::app_role)
)
WITH CHECK (
  has_role(auth.uid(), 'superadmin'::app_role) OR 
  has_role(auth.uid(), 'admin'::app_role) OR
  has_role(auth.uid(), 'teacher'::app_role)
);

-- password_reset_requests
DROP POLICY IF EXISTS "Admins can manage password reset requests" ON public.password_reset_requests;
CREATE POLICY "Admins can manage password reset requests"
ON public.password_reset_requests FOR ALL TO authenticated
USING (
  has_role(auth.uid(), 'superadmin'::app_role) OR 
  has_role(auth.uid(), 'admin'::app_role)
)
WITH CHECK (
  has_role(auth.uid(), 'superadmin'::app_role) OR 
  has_role(auth.uid(), 'admin'::app_role)
);

-- questions
DROP POLICY IF EXISTS "Teachers can manage questions" ON public.questions;
CREATE POLICY "Teachers can manage questions"
ON public.questions FOR ALL TO authenticated
USING (
  has_role(auth.uid(), 'superadmin'::app_role) OR 
  has_role(auth.uid(), 'admin'::app_role) OR
  has_role(auth.uid(), 'teacher'::app_role)
)
WITH CHECK (
  has_role(auth.uid(), 'superadmin'::app_role) OR 
  has_role(auth.uid(), 'admin'::app_role) OR
  has_role(auth.uid(), 'teacher'::app_role)
);

-- school_payment_secrets
DROP POLICY IF EXISTS "Admins can manage school payment secrets" ON public.school_payment_secrets;
CREATE POLICY "Admins can manage school payment secrets"
ON public.school_payment_secrets FOR ALL TO authenticated
USING (
  has_role(auth.uid(), 'superadmin'::app_role) OR 
  (has_role(auth.uid(), 'admin'::app_role) AND school_id = get_user_school(auth.uid()))
)
WITH CHECK (
  has_role(auth.uid(), 'superadmin'::app_role) OR 
  (has_role(auth.uid(), 'admin'::app_role) AND school_id = get_user_school(auth.uid()))
);

-- student_answers
DROP POLICY IF EXISTS "Students can manage their own answers" ON public.student_answers;
CREATE POLICY "Students can manage their own answers"
ON public.student_answers FOR ALL TO authenticated
USING (
  has_role(auth.uid(), 'superadmin'::app_role) OR 
  has_role(auth.uid(), 'admin'::app_role) OR
  has_role(auth.uid(), 'teacher'::app_role) OR
  EXISTS (
    SELECT 1 FROM exam_submissions es 
    WHERE es.id = student_answers.submission_id 
    AND es.student_id = auth.uid()
  )
)
WITH CHECK (
  has_role(auth.uid(), 'superadmin'::app_role) OR 
  has_role(auth.uid(), 'admin'::app_role) OR
  has_role(auth.uid(), 'teacher'::app_role) OR
  EXISTS (
    SELECT 1 FROM exam_submissions es 
    WHERE es.id = student_answers.submission_id 
    AND es.student_id = auth.uid()
  )
);

-- students
DROP POLICY IF EXISTS "Admins can manage students in their school" ON public.students;
CREATE POLICY "Admins can manage students in their school"
ON public.students FOR ALL TO authenticated
USING (
  has_role(auth.uid(), 'superadmin'::app_role) OR 
  (has_role(auth.uid(), 'admin'::app_role) AND school_id = get_user_school(auth.uid()))
)
WITH CHECK (
  has_role(auth.uid(), 'superadmin'::app_role) OR 
  (has_role(auth.uid(), 'admin'::app_role) AND school_id = get_user_school(auth.uid()))
);

-- teachers
DROP POLICY IF EXISTS "Admins can manage teachers in their school" ON public.teachers;
CREATE POLICY "Admins can manage teachers in their school"
ON public.teachers FOR ALL TO authenticated
USING (
  has_role(auth.uid(), 'superadmin'::app_role) OR 
  (has_role(auth.uid(), 'admin'::app_role) AND school_id = get_user_school(auth.uid()))
)
WITH CHECK (
  has_role(auth.uid(), 'superadmin'::app_role) OR 
  (has_role(auth.uid(), 'admin'::app_role) AND school_id = get_user_school(auth.uid()))
);

-- teacher_classes
DROP POLICY IF EXISTS "Admins can manage teacher class assignments" ON public.teacher_classes;
CREATE POLICY "Admins can manage teacher class assignments"
ON public.teacher_classes FOR ALL TO authenticated
USING (
  has_role(auth.uid(), 'superadmin'::app_role) OR 
  has_role(auth.uid(), 'admin'::app_role)
)
WITH CHECK (
  has_role(auth.uid(), 'superadmin'::app_role) OR 
  has_role(auth.uid(), 'admin'::app_role)
);

-- subjects
DROP POLICY IF EXISTS "Admins can manage subjects in their school" ON public.subjects;
CREATE POLICY "Admins can manage subjects in their school"
ON public.subjects FOR ALL TO authenticated
USING (
  has_role(auth.uid(), 'superadmin'::app_role) OR 
  (has_role(auth.uid(), 'admin'::app_role) AND school_id = get_user_school(auth.uid()))
)
WITH CHECK (
  has_role(auth.uid(), 'superadmin'::app_role) OR 
  (has_role(auth.uid(), 'admin'::app_role) AND school_id = get_user_school(auth.uid()))
);

-- student_grades
DROP POLICY IF EXISTS "Teachers can manage student grades" ON public.student_grades;
CREATE POLICY "Teachers can manage student grades"
ON public.student_grades FOR ALL TO authenticated
USING (
  has_role(auth.uid(), 'superadmin'::app_role) OR 
  has_role(auth.uid(), 'admin'::app_role) OR
  has_role(auth.uid(), 'teacher'::app_role)
)
WITH CHECK (
  has_role(auth.uid(), 'superadmin'::app_role) OR 
  has_role(auth.uid(), 'admin'::app_role) OR
  has_role(auth.uid(), 'teacher'::app_role)
);

-- report_cards
DROP POLICY IF EXISTS "Admins can manage report cards" ON public.report_cards;
CREATE POLICY "Admins can manage report cards"
ON public.report_cards FOR ALL TO authenticated
USING (
  has_role(auth.uid(), 'superadmin'::app_role) OR 
  has_role(auth.uid(), 'admin'::app_role) OR
  has_role(auth.uid(), 'teacher'::app_role)
)
WITH CHECK (
  has_role(auth.uid(), 'superadmin'::app_role) OR 
  has_role(auth.uid(), 'admin'::app_role) OR
  has_role(auth.uid(), 'teacher'::app_role)
);

-- announcements
DROP POLICY IF EXISTS "Admins can manage announcements" ON public.announcements;
CREATE POLICY "Admins can manage announcements"
ON public.announcements FOR ALL TO authenticated
USING (
  has_role(auth.uid(), 'superadmin'::app_role) OR 
  (has_role(auth.uid(), 'admin'::app_role) AND school_id = get_user_school(auth.uid()))
)
WITH CHECK (
  has_role(auth.uid(), 'superadmin'::app_role) OR 
  (has_role(auth.uid(), 'admin'::app_role) AND school_id = get_user_school(auth.uid()))
);

-- notification_preferences
DROP POLICY IF EXISTS "Users can manage their notification preferences" ON public.notification_preferences;
CREATE POLICY "Users can manage their notification preferences"
ON public.notification_preferences FOR ALL TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- school_settings
DROP POLICY IF EXISTS "Admins can manage school settings" ON public.school_settings;
CREATE POLICY "Admins can manage school settings"
ON public.school_settings FOR ALL TO authenticated
USING (
  has_role(auth.uid(), 'superadmin'::app_role) OR 
  (has_role(auth.uid(), 'admin'::app_role) AND school_id = get_user_school(auth.uid()))
)
WITH CHECK (
  has_role(auth.uid(), 'superadmin'::app_role) OR 
  (has_role(auth.uid(), 'admin'::app_role) AND school_id = get_user_school(auth.uid()))
);

-- fee_structures
DROP POLICY IF EXISTS "Admins can manage fee structures" ON public.fee_structures;
CREATE POLICY "Admins can manage fee structures"
ON public.fee_structures FOR ALL TO authenticated
USING (
  has_role(auth.uid(), 'superadmin'::app_role) OR 
  (has_role(auth.uid(), 'admin'::app_role) AND school_id = get_user_school(auth.uid()))
)
WITH CHECK (
  has_role(auth.uid(), 'superadmin'::app_role) OR 
  (has_role(auth.uid(), 'admin'::app_role) AND school_id = get_user_school(auth.uid()))
);

-- promotion_history
DROP POLICY IF EXISTS "Admins can manage promotion history" ON public.promotion_history;
CREATE POLICY "Admins can manage promotion history"
ON public.promotion_history FOR ALL TO authenticated
USING (
  has_role(auth.uid(), 'superadmin'::app_role) OR 
  has_role(auth.uid(), 'admin'::app_role)
)
WITH CHECK (
  has_role(auth.uid(), 'superadmin'::app_role) OR 
  has_role(auth.uid(), 'admin'::app_role)
);

-- subscriptions
DROP POLICY IF EXISTS "Admins can manage subscriptions" ON public.subscriptions;
CREATE POLICY "Admins can manage subscriptions"
ON public.subscriptions FOR ALL TO authenticated
USING (
  has_role(auth.uid(), 'superadmin'::app_role) OR 
  (has_role(auth.uid(), 'admin'::app_role) AND school_id = get_user_school(auth.uid()))
)
WITH CHECK (
  has_role(auth.uid(), 'superadmin'::app_role) OR 
  (has_role(auth.uid(), 'admin'::app_role) AND school_id = get_user_school(auth.uid()))
);

-- user_roles
DROP POLICY IF EXISTS "Admins can manage user roles" ON public.user_roles;
CREATE POLICY "Admins can manage user roles"
ON public.user_roles FOR ALL TO authenticated
USING (
  has_role(auth.uid(), 'superadmin'::app_role) OR 
  (has_role(auth.uid(), 'admin'::app_role) AND school_id = get_user_school(auth.uid()))
)
WITH CHECK (
  has_role(auth.uid(), 'superadmin'::app_role) OR 
  (has_role(auth.uid(), 'admin'::app_role) AND school_id = get_user_school(auth.uid()))
);

-- profiles
DROP POLICY IF EXISTS "Users can manage their own profile" ON public.profiles;
CREATE POLICY "Users can manage their own profile"
ON public.profiles FOR ALL TO authenticated
USING (id = auth.uid() OR has_role(auth.uid(), 'superadmin'::app_role) OR has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (id = auth.uid() OR has_role(auth.uid(), 'superadmin'::app_role) OR has_role(auth.uid(), 'admin'::app_role));