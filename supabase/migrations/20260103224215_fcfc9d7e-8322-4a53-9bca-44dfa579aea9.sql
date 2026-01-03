-- Update RLS policies to support superadmin role alongside admin

-- Drop existing admin-only policies and recreate with superadmin support

-- STUDENTS table
DROP POLICY IF EXISTS "Admins can manage all students" ON public.students;
CREATE POLICY "Admins and superadmins can manage all students" ON public.students
FOR ALL USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'superadmin'::app_role));

-- SUBJECTS table
DROP POLICY IF EXISTS "Admins can manage subjects" ON public.subjects;
CREATE POLICY "Admins and superadmins can manage subjects" ON public.subjects
FOR ALL USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'superadmin'::app_role));

-- TEACHERS table
DROP POLICY IF EXISTS "Admins can manage all teachers" ON public.teachers;
CREATE POLICY "Admins and superadmins can manage all teachers" ON public.teachers
FOR ALL USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'superadmin'::app_role));

-- FEE_PAYMENTS table
DROP POLICY IF EXISTS "Admins can manage all fee payments" ON public.fee_payments;
CREATE POLICY "Admins and superadmins can manage all fee payments" ON public.fee_payments
FOR ALL USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'superadmin'::app_role));

-- FEE_STRUCTURES table
DROP POLICY IF EXISTS "Admins can manage fee structures" ON public.fee_structures;
CREATE POLICY "Admins and superadmins can manage fee structures" ON public.fee_structures
FOR ALL USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'superadmin'::app_role));

-- ANNOUNCEMENTS table
DROP POLICY IF EXISTS "Admins can manage all announcements" ON public.announcements;
CREATE POLICY "Admins and superadmins can manage all announcements" ON public.announcements
FOR ALL USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'superadmin'::app_role));

-- EVENTS table
DROP POLICY IF EXISTS "Admins can manage all events" ON public.events;
CREATE POLICY "Admins and superadmins can manage all events" ON public.events
FOR ALL USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'superadmin'::app_role));

-- EXAMS table
DROP POLICY IF EXISTS "Admins can manage all exams" ON public.exams;
CREATE POLICY "Admins and superadmins can manage all exams" ON public.exams
FOR ALL USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'superadmin'::app_role));

-- ASSIGNMENTS table
DROP POLICY IF EXISTS "Admins can manage all assignments" ON public.assignments;
CREATE POLICY "Admins and superadmins can manage all assignments" ON public.assignments
FOR ALL USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'superadmin'::app_role));

-- CLASSES table
DROP POLICY IF EXISTS "Admins can manage classes" ON public.classes;
CREATE POLICY "Admins and superadmins can manage classes" ON public.classes
FOR ALL USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'superadmin'::app_role));

-- MESSAGES table
DROP POLICY IF EXISTS "Admins can manage all messages" ON public.messages;
CREATE POLICY "Admins and superadmins can manage all messages" ON public.messages
FOR ALL USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'superadmin'::app_role));

-- QUESTIONS table
DROP POLICY IF EXISTS "Admins can manage all questions" ON public.questions;
CREATE POLICY "Admins and superadmins can manage all questions" ON public.questions
FOR ALL USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'superadmin'::app_role));

-- REPORT_CARDS table
DROP POLICY IF EXISTS "Admins can manage all report cards" ON public.report_cards;
CREATE POLICY "Admins and superadmins can manage all report cards" ON public.report_cards
FOR ALL USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'superadmin'::app_role));

-- STUDENT_GRADES table
DROP POLICY IF EXISTS "Admins can manage all grades" ON public.student_grades;
CREATE POLICY "Admins and superadmins can manage all grades" ON public.student_grades
FOR ALL USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'superadmin'::app_role));

-- ATTENDANCE table
DROP POLICY IF EXISTS "Admins can manage all attendance" ON public.attendance;
CREATE POLICY "Admins and superadmins can manage all attendance" ON public.attendance
FOR ALL USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'superadmin'::app_role));

-- ONLINE_CLASSES table
DROP POLICY IF EXISTS "Admins can manage all online classes" ON public.online_classes;
CREATE POLICY "Admins and superadmins can manage all online classes" ON public.online_classes
FOR ALL USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'superadmin'::app_role));

-- LEARNING_MATERIALS table
DROP POLICY IF EXISTS "Admins can manage all materials" ON public.learning_materials;
CREATE POLICY "Admins and superadmins can manage all materials" ON public.learning_materials
FOR ALL USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'superadmin'::app_role));

-- PAYMENT_TRANSACTIONS table
DROP POLICY IF EXISTS "Admins can manage all transactions" ON public.payment_transactions;
CREATE POLICY "Admins and superadmins can manage all transactions" ON public.payment_transactions
FOR ALL USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'superadmin'::app_role));

-- PROMOTION_HISTORY table
DROP POLICY IF EXISTS "Admins can manage all promotions" ON public.promotion_history;
CREATE POLICY "Admins and superadmins can manage all promotions" ON public.promotion_history
FOR ALL USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'superadmin'::app_role));

-- STUDENT_CLASSES table
DROP POLICY IF EXISTS "Admins can manage student classes" ON public.student_classes;
CREATE POLICY "Admins and superadmins can manage student classes" ON public.student_classes
FOR ALL USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'superadmin'::app_role));

-- TEACHER_CLASSES table
DROP POLICY IF EXISTS "Admins can manage teacher classes" ON public.teacher_classes;
CREATE POLICY "Admins and superadmins can manage teacher classes" ON public.teacher_classes
FOR ALL USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'superadmin'::app_role));

-- USER_ROLES table
DROP POLICY IF EXISTS "Admins can manage all roles" ON public.user_roles;
CREATE POLICY "Admins and superadmins can manage all roles" ON public.user_roles
FOR ALL USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'superadmin'::app_role));

-- USER_PASSWORD_RESETS table
DROP POLICY IF EXISTS "Admins can manage password resets" ON public.user_password_resets;
CREATE POLICY "Admins and superadmins can manage password resets" ON public.user_password_resets
FOR ALL USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'superadmin'::app_role));

-- SCHOOL_SETTINGS table
DROP POLICY IF EXISTS "Admins can manage school settings" ON public.school_settings;
CREATE POLICY "Admins and superadmins can manage school settings" ON public.school_settings
FOR ALL USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'superadmin'::app_role));

-- EXAM_SUBMISSIONS table
DROP POLICY IF EXISTS "Admins can view all submissions" ON public.exam_submissions;
CREATE POLICY "Admins and superadmins can view all submissions" ON public.exam_submissions
FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'superadmin'::app_role));

-- EXAM_SESSIONS table
DROP POLICY IF EXISTS "Admins can view all sessions" ON public.exam_sessions;
CREATE POLICY "Admins and superadmins can view all sessions" ON public.exam_sessions
FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'superadmin'::app_role));

-- STUDENT_ANSWERS table
DROP POLICY IF EXISTS "Admins can view all answers" ON public.student_answers;
CREATE POLICY "Admins and superadmins can view all answers" ON public.student_answers
FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'superadmin'::app_role));

-- AUDIT_LOGS table
DROP POLICY IF EXISTS "Admins can view audit logs" ON public.audit_logs;
CREATE POLICY "Admins and superadmins can view audit logs" ON public.audit_logs
FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'superadmin'::app_role));

-- PROFILES table - update admin insert policy
DROP POLICY IF EXISTS "Admins can insert profiles" ON public.profiles;
CREATE POLICY "Admins and superadmins can insert profiles" ON public.profiles
FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'superadmin'::app_role) OR auth.uid() = id);

DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins and superadmins can view all profiles" ON public.profiles
FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'superadmin'::app_role));

-- STORAGE POLICIES for student-photos bucket
DROP POLICY IF EXISTS "Admins can upload student photos" ON storage.objects;
DROP POLICY IF EXISTS "Admins and superadmins can upload student photos" ON storage.objects;
CREATE POLICY "Admins and superadmins can upload student photos" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'student-photos' AND 
  (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'superadmin'::app_role))
);

DROP POLICY IF EXISTS "Admins can update student photos" ON storage.objects;
DROP POLICY IF EXISTS "Admins and superadmins can update student photos" ON storage.objects;
CREATE POLICY "Admins and superadmins can update student photos" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'student-photos' AND 
  (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'superadmin'::app_role))
);

DROP POLICY IF EXISTS "Admins can delete student photos" ON storage.objects;
DROP POLICY IF EXISTS "Admins and superadmins can delete student photos" ON storage.objects;
CREATE POLICY "Admins and superadmins can delete student photos" ON storage.objects
FOR DELETE USING (
  bucket_id = 'student-photos' AND 
  (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'superadmin'::app_role))
);

-- Public read access for student photos (already exists but ensure it's there)
DROP POLICY IF EXISTS "Public can view student photos" ON storage.objects;
CREATE POLICY "Public can view student photos" ON storage.objects
FOR SELECT USING (bucket_id = 'student-photos');

-- STORAGE POLICIES for school-logos bucket
DROP POLICY IF EXISTS "Admins can upload school logos" ON storage.objects;
DROP POLICY IF EXISTS "Admins and superadmins can upload school logos" ON storage.objects;
CREATE POLICY "Admins and superadmins can upload school logos" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'school-logos' AND 
  (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'superadmin'::app_role))
);

DROP POLICY IF EXISTS "Admins can update school logos" ON storage.objects;
DROP POLICY IF EXISTS "Admins and superadmins can update school logos" ON storage.objects;
CREATE POLICY "Admins and superadmins can update school logos" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'school-logos' AND 
  (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'superadmin'::app_role))
);

DROP POLICY IF EXISTS "Public can view school logos" ON storage.objects;
CREATE POLICY "Public can view school logos" ON storage.objects
FOR SELECT USING (bucket_id = 'school-logos');