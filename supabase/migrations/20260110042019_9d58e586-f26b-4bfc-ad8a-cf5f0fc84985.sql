-- Fix school deletion by adding CASCADE to all foreign key constraints

-- Drop and recreate foreign keys with ON DELETE CASCADE

-- announcements
ALTER TABLE public.announcements DROP CONSTRAINT IF EXISTS announcements_school_id_fkey;
ALTER TABLE public.announcements ADD CONSTRAINT announcements_school_id_fkey 
  FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE;

-- assignments
ALTER TABLE public.assignments DROP CONSTRAINT IF EXISTS assignments_school_id_fkey;
ALTER TABLE public.assignments ADD CONSTRAINT assignments_school_id_fkey 
  FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE;

-- classes
ALTER TABLE public.classes DROP CONSTRAINT IF EXISTS classes_school_id_fkey;
ALTER TABLE public.classes ADD CONSTRAINT classes_school_id_fkey 
  FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE;

-- events
ALTER TABLE public.events DROP CONSTRAINT IF EXISTS events_school_id_fkey;
ALTER TABLE public.events ADD CONSTRAINT events_school_id_fkey 
  FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE;

-- exams
ALTER TABLE public.exams DROP CONSTRAINT IF EXISTS exams_school_id_fkey;
ALTER TABLE public.exams ADD CONSTRAINT exams_school_id_fkey 
  FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE;

-- fee_payments
ALTER TABLE public.fee_payments DROP CONSTRAINT IF EXISTS fee_payments_school_id_fkey;
ALTER TABLE public.fee_payments ADD CONSTRAINT fee_payments_school_id_fkey 
  FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE;

-- fee_structures
ALTER TABLE public.fee_structures DROP CONSTRAINT IF EXISTS fee_structures_school_id_fkey;
ALTER TABLE public.fee_structures ADD CONSTRAINT fee_structures_school_id_fkey 
  FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE;

-- profiles
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_school_id_fkey;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_school_id_fkey 
  FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE SET NULL;

-- school_settings
ALTER TABLE public.school_settings DROP CONSTRAINT IF EXISTS school_settings_school_id_fkey;
ALTER TABLE public.school_settings ADD CONSTRAINT school_settings_school_id_fkey 
  FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE;

-- students
ALTER TABLE public.students DROP CONSTRAINT IF EXISTS students_school_id_fkey;
ALTER TABLE public.students ADD CONSTRAINT students_school_id_fkey 
  FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE;

-- subjects
ALTER TABLE public.subjects DROP CONSTRAINT IF EXISTS subjects_school_id_fkey;
ALTER TABLE public.subjects ADD CONSTRAINT subjects_school_id_fkey 
  FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE;

-- teachers
ALTER TABLE public.teachers DROP CONSTRAINT IF EXISTS teachers_school_id_fkey;
ALTER TABLE public.teachers ADD CONSTRAINT teachers_school_id_fkey 
  FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE;

-- user_roles
ALTER TABLE public.user_roles DROP CONSTRAINT IF EXISTS user_roles_school_id_fkey;
ALTER TABLE public.user_roles ADD CONSTRAINT user_roles_school_id_fkey 
  FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE;