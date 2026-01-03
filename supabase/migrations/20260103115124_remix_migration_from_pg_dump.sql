CREATE EXTENSION IF NOT EXISTS "pg_graphql";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "plpgsql";
CREATE EXTENSION IF NOT EXISTS "supabase_vault";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";
BEGIN;

--
-- PostgreSQL database dump
--


-- Dumped from database version 17.6
-- Dumped by pg_dump version 18.1

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--



--
-- Name: app_role; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.app_role AS ENUM (
    'admin',
    'teacher',
    'student'
);


--
-- Name: get_user_by_admission_number(text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_user_by_admission_number(_admission_number text) RETURNS uuid
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT student_id FROM public.student_classes WHERE admission_number = _admission_number LIMIT 1
$$;


--
-- Name: get_user_class(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_user_class(_user_id uuid) RETURNS text
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT class_id FROM public.student_classes WHERE student_id = _user_id LIMIT 1
$$;


--
-- Name: handle_new_user(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.handle_new_user() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', 'New User'),
    NEW.email
  );
  RETURN NEW;
END;
$$;


--
-- Name: has_role(uuid, public.app_role); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.has_role(_user_id uuid, _role public.app_role) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;


SET default_table_access_method = heap;

--
-- Name: attendance; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.attendance (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    student_id uuid NOT NULL,
    class_id text NOT NULL,
    date date NOT NULL,
    status text NOT NULL,
    marked_by uuid,
    remarks text,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT attendance_status_check CHECK ((status = ANY (ARRAY['present'::text, 'absent'::text, 'late'::text, 'excused'::text])))
);


--
-- Name: audit_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.audit_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    action text NOT NULL,
    entity_type text NOT NULL,
    entity_id text,
    old_data jsonb,
    new_data jsonb,
    ip_address text,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: classes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.classes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    level text NOT NULL,
    capacity integer DEFAULT 30,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: exam_sessions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.exam_sessions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    exam_id uuid NOT NULL,
    student_id uuid NOT NULL,
    session_token text NOT NULL,
    ip_address text,
    user_agent text,
    started_at timestamp with time zone DEFAULT now(),
    last_activity timestamp with time zone DEFAULT now(),
    is_active boolean DEFAULT true,
    tab_switches integer DEFAULT 0,
    suspicious_activity jsonb DEFAULT '[]'::jsonb
);


--
-- Name: exam_submissions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.exam_submissions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    exam_id uuid NOT NULL,
    student_id uuid NOT NULL,
    started_at timestamp with time zone DEFAULT now(),
    submitted_at timestamp with time zone,
    score integer,
    total_marks integer,
    is_submitted boolean DEFAULT false
);


--
-- Name: exams; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.exams (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    title text NOT NULL,
    subject text NOT NULL,
    class_id text NOT NULL,
    teacher_id uuid,
    duration_minutes integer DEFAULT 60 NOT NULL,
    start_time timestamp with time zone,
    end_time timestamp with time zone,
    is_published boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    is_exam_active boolean DEFAULT false
);


--
-- Name: fee_payments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.fee_payments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    student_id uuid NOT NULL,
    class_id text NOT NULL,
    amount_payable numeric DEFAULT 0 NOT NULL,
    amount_paid numeric DEFAULT 0 NOT NULL,
    balance numeric GENERATED ALWAYS AS ((amount_payable - amount_paid)) STORED,
    installment text DEFAULT '1st Installment'::text,
    status text DEFAULT 'unpaid'::text,
    term text NOT NULL,
    academic_year text NOT NULL,
    last_payment_date timestamp with time zone,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: fee_structures; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.fee_structures (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    class_id text NOT NULL,
    term text NOT NULL,
    academic_year text NOT NULL,
    tuition_fee numeric DEFAULT 0,
    development_fee numeric DEFAULT 0,
    uniform_fee numeric DEFAULT 0,
    books_fee numeric DEFAULT 0,
    exam_fee numeric DEFAULT 0,
    other_fees numeric DEFAULT 0,
    total_amount numeric GENERATED ALWAYS AS ((((((tuition_fee + development_fee) + uniform_fee) + books_fee) + exam_fee) + other_fees)) STORED,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: learning_materials; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.learning_materials (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    title text NOT NULL,
    subject text NOT NULL,
    class_id text NOT NULL,
    file_url text NOT NULL,
    file_type text,
    file_size text,
    uploaded_by uuid,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: messages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.messages (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    type text NOT NULL,
    subject text,
    content text NOT NULL,
    recipients_type text NOT NULL,
    class_id text,
    sent_by uuid,
    status text DEFAULT 'sent'::text,
    sent_at timestamp with time zone DEFAULT now(),
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: online_classes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.online_classes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    title text NOT NULL,
    teacher_id uuid,
    class_id text NOT NULL,
    subject text,
    start_time timestamp with time zone NOT NULL,
    end_time timestamp with time zone,
    meeting_url text,
    status text DEFAULT 'scheduled'::text,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: payment_transactions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.payment_transactions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    fee_payment_id uuid NOT NULL,
    amount numeric NOT NULL,
    payment_method text NOT NULL,
    transaction_reference text,
    payment_date timestamp with time zone DEFAULT now(),
    status text DEFAULT 'completed'::text,
    recorded_by uuid,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.profiles (
    id uuid NOT NULL,
    full_name text NOT NULL,
    email text,
    phone_contact text,
    photo_url text,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: promotion_history; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.promotion_history (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    student_id uuid NOT NULL,
    from_class text NOT NULL,
    to_class text NOT NULL,
    academic_year text NOT NULL,
    promoted_by uuid,
    promotion_date timestamp with time zone DEFAULT now(),
    average_score numeric,
    status text DEFAULT 'promoted'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: questions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.questions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    exam_id uuid NOT NULL,
    question_text text NOT NULL,
    option_a text NOT NULL,
    option_b text NOT NULL,
    option_c text,
    option_d text,
    correct_option text NOT NULL,
    marks integer DEFAULT 1,
    order_index integer
);


--
-- Name: report_cards; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.report_cards (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    student_id uuid NOT NULL,
    term text NOT NULL,
    academic_year text NOT NULL,
    class_id text NOT NULL,
    "position" integer,
    total_students integer,
    average_score numeric,
    total_marks_obtained numeric,
    total_marks_obtainable numeric,
    principal_remarks text,
    teacher_remarks text,
    next_term_begins date,
    generated_at timestamp with time zone DEFAULT now(),
    attitude text,
    interest text,
    conduct text,
    promotion_status text,
    closing_date date,
    attendance_present integer DEFAULT 0,
    attendance_total integer DEFAULT 0,
    term_summary jsonb
);


--
-- Name: school_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.school_settings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    school_name text DEFAULT 'EduManage School'::text,
    motto text,
    email text,
    phone text,
    address text,
    academic_year text DEFAULT '2024/2025'::text,
    term text DEFAULT 'First Term'::text,
    logo_url text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    principal_name text,
    next_term_begins date,
    closing_date date,
    grading_scale jsonb DEFAULT '[{"max": 100, "min": 80, "grade": "A", "remarks": "Excellent"}, {"max": 79, "min": 75, "grade": "B+", "remarks": "Very Good"}, {"max": 74, "min": 70, "grade": "B", "remarks": "Good"}, {"max": 69, "min": 60, "grade": "C", "remarks": "Credit"}, {"max": 59, "min": 50, "grade": "D", "remarks": "Pass"}, {"max": 49, "min": 0, "grade": "F", "remarks": "Fail"}]'::jsonb,
    report_card_config jsonb DEFAULT '{"showAttendance": true, "showAnnualSummary": true, "showAttitudeFields": true, "showSubjectPosition": true}'::jsonb
);


--
-- Name: student_answers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.student_answers (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    submission_id uuid NOT NULL,
    question_id uuid NOT NULL,
    selected_option text,
    is_correct boolean
);


--
-- Name: student_classes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.student_classes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    student_id uuid NOT NULL,
    class_id text NOT NULL,
    admission_number text,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: student_grades; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.student_grades (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    student_id uuid NOT NULL,
    subject_id uuid,
    subject_name text NOT NULL,
    class_id text NOT NULL,
    term text NOT NULL,
    academic_year text NOT NULL,
    ca1_score numeric DEFAULT 0,
    ca2_score numeric DEFAULT 0,
    ca3_score numeric DEFAULT 0,
    exam_score numeric DEFAULT 0,
    total_score numeric GENERATED ALWAYS AS ((((ca1_score + ca2_score) + ca3_score) + exam_score)) STORED,
    grade text,
    remarks text,
    created_at timestamp with time zone DEFAULT now(),
    subject_position integer
);


--
-- Name: students; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.students (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    admission_number text NOT NULL,
    full_name text NOT NULL,
    gender text NOT NULL,
    class_id text NOT NULL,
    date_of_birth date,
    date_of_admission date DEFAULT CURRENT_DATE,
    admission_fee numeric DEFAULT 0,
    academic_year text DEFAULT '2024/2025'::text,
    term text DEFAULT 'first'::text,
    guardian_name text,
    address text,
    phone_contact text,
    email text,
    photo_url text,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT students_gender_check CHECK ((gender = ANY (ARRAY['male'::text, 'female'::text])))
);


--
-- Name: subjects; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.subjects (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    code text,
    class_id text,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: teacher_classes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.teacher_classes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    teacher_id uuid NOT NULL,
    class_id text NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: teachers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.teachers (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    full_name text NOT NULL,
    email text NOT NULL,
    phone text,
    subject text NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: user_roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_roles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    role public.app_role NOT NULL
);


--
-- Name: attendance attendance_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.attendance
    ADD CONSTRAINT attendance_pkey PRIMARY KEY (id);


--
-- Name: attendance attendance_student_id_date_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.attendance
    ADD CONSTRAINT attendance_student_id_date_key UNIQUE (student_id, date);


--
-- Name: audit_logs audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_pkey PRIMARY KEY (id);


--
-- Name: classes classes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.classes
    ADD CONSTRAINT classes_pkey PRIMARY KEY (id);


--
-- Name: exam_sessions exam_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.exam_sessions
    ADD CONSTRAINT exam_sessions_pkey PRIMARY KEY (id);


--
-- Name: exam_sessions exam_sessions_session_token_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.exam_sessions
    ADD CONSTRAINT exam_sessions_session_token_key UNIQUE (session_token);


--
-- Name: exam_submissions exam_submissions_exam_id_student_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.exam_submissions
    ADD CONSTRAINT exam_submissions_exam_id_student_id_key UNIQUE (exam_id, student_id);


--
-- Name: exam_submissions exam_submissions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.exam_submissions
    ADD CONSTRAINT exam_submissions_pkey PRIMARY KEY (id);


--
-- Name: exams exams_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.exams
    ADD CONSTRAINT exams_pkey PRIMARY KEY (id);


--
-- Name: fee_payments fee_payments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fee_payments
    ADD CONSTRAINT fee_payments_pkey PRIMARY KEY (id);


--
-- Name: fee_structures fee_structures_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fee_structures
    ADD CONSTRAINT fee_structures_pkey PRIMARY KEY (id);


--
-- Name: learning_materials learning_materials_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.learning_materials
    ADD CONSTRAINT learning_materials_pkey PRIMARY KEY (id);


--
-- Name: messages messages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_pkey PRIMARY KEY (id);


--
-- Name: online_classes online_classes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.online_classes
    ADD CONSTRAINT online_classes_pkey PRIMARY KEY (id);


--
-- Name: payment_transactions payment_transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payment_transactions
    ADD CONSTRAINT payment_transactions_pkey PRIMARY KEY (id);


--
-- Name: profiles profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);


--
-- Name: promotion_history promotion_history_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.promotion_history
    ADD CONSTRAINT promotion_history_pkey PRIMARY KEY (id);


--
-- Name: questions questions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.questions
    ADD CONSTRAINT questions_pkey PRIMARY KEY (id);


--
-- Name: report_cards report_cards_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.report_cards
    ADD CONSTRAINT report_cards_pkey PRIMARY KEY (id);


--
-- Name: school_settings school_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.school_settings
    ADD CONSTRAINT school_settings_pkey PRIMARY KEY (id);


--
-- Name: student_answers student_answers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.student_answers
    ADD CONSTRAINT student_answers_pkey PRIMARY KEY (id);


--
-- Name: student_answers student_answers_submission_id_question_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.student_answers
    ADD CONSTRAINT student_answers_submission_id_question_id_key UNIQUE (submission_id, question_id);


--
-- Name: student_classes student_classes_admission_number_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.student_classes
    ADD CONSTRAINT student_classes_admission_number_key UNIQUE (admission_number);


--
-- Name: student_classes student_classes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.student_classes
    ADD CONSTRAINT student_classes_pkey PRIMARY KEY (id);


--
-- Name: student_classes student_classes_student_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.student_classes
    ADD CONSTRAINT student_classes_student_id_key UNIQUE (student_id);


--
-- Name: student_grades student_grades_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.student_grades
    ADD CONSTRAINT student_grades_pkey PRIMARY KEY (id);


--
-- Name: students students_admission_number_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.students
    ADD CONSTRAINT students_admission_number_key UNIQUE (admission_number);


--
-- Name: students students_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.students
    ADD CONSTRAINT students_pkey PRIMARY KEY (id);


--
-- Name: subjects subjects_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subjects
    ADD CONSTRAINT subjects_pkey PRIMARY KEY (id);


--
-- Name: teacher_classes teacher_classes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.teacher_classes
    ADD CONSTRAINT teacher_classes_pkey PRIMARY KEY (id);


--
-- Name: teacher_classes teacher_classes_teacher_id_class_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.teacher_classes
    ADD CONSTRAINT teacher_classes_teacher_id_class_id_key UNIQUE (teacher_id, class_id);


--
-- Name: teachers teachers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.teachers
    ADD CONSTRAINT teachers_pkey PRIMARY KEY (id);


--
-- Name: user_roles user_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_pkey PRIMARY KEY (id);


--
-- Name: user_roles user_roles_user_id_role_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_role_key UNIQUE (user_id, role);


--
-- Name: idx_attendance_student_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_attendance_student_date ON public.attendance USING btree (student_id, date);


--
-- Name: idx_audit_logs_created; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_audit_logs_created ON public.audit_logs USING btree (created_at);


--
-- Name: idx_exam_sessions_exam; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_exam_sessions_exam ON public.exam_sessions USING btree (exam_id, student_id);


--
-- Name: idx_student_grades_student; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_student_grades_student ON public.student_grades USING btree (student_id, term, academic_year);


--
-- Name: exam_sessions exam_sessions_exam_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.exam_sessions
    ADD CONSTRAINT exam_sessions_exam_id_fkey FOREIGN KEY (exam_id) REFERENCES public.exams(id) ON DELETE CASCADE;


--
-- Name: exam_submissions exam_submissions_exam_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.exam_submissions
    ADD CONSTRAINT exam_submissions_exam_id_fkey FOREIGN KEY (exam_id) REFERENCES public.exams(id) ON DELETE CASCADE;


--
-- Name: exam_submissions exam_submissions_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.exam_submissions
    ADD CONSTRAINT exam_submissions_student_id_fkey FOREIGN KEY (student_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: exams exams_teacher_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.exams
    ADD CONSTRAINT exams_teacher_id_fkey FOREIGN KEY (teacher_id) REFERENCES auth.users(id);


--
-- Name: fee_payments fee_payments_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fee_payments
    ADD CONSTRAINT fee_payments_student_id_fkey FOREIGN KEY (student_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: learning_materials learning_materials_uploaded_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.learning_materials
    ADD CONSTRAINT learning_materials_uploaded_by_fkey FOREIGN KEY (uploaded_by) REFERENCES auth.users(id) ON DELETE SET NULL;


--
-- Name: messages messages_sent_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_sent_by_fkey FOREIGN KEY (sent_by) REFERENCES auth.users(id) ON DELETE SET NULL;


--
-- Name: online_classes online_classes_teacher_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.online_classes
    ADD CONSTRAINT online_classes_teacher_id_fkey FOREIGN KEY (teacher_id) REFERENCES auth.users(id) ON DELETE SET NULL;


--
-- Name: payment_transactions payment_transactions_fee_payment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payment_transactions
    ADD CONSTRAINT payment_transactions_fee_payment_id_fkey FOREIGN KEY (fee_payment_id) REFERENCES public.fee_payments(id) ON DELETE CASCADE;


--
-- Name: profiles profiles_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: questions questions_exam_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.questions
    ADD CONSTRAINT questions_exam_id_fkey FOREIGN KEY (exam_id) REFERENCES public.exams(id) ON DELETE CASCADE;


--
-- Name: student_answers student_answers_question_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.student_answers
    ADD CONSTRAINT student_answers_question_id_fkey FOREIGN KEY (question_id) REFERENCES public.questions(id) ON DELETE CASCADE;


--
-- Name: student_answers student_answers_submission_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.student_answers
    ADD CONSTRAINT student_answers_submission_id_fkey FOREIGN KEY (submission_id) REFERENCES public.exam_submissions(id) ON DELETE CASCADE;


--
-- Name: student_classes student_classes_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.student_classes
    ADD CONSTRAINT student_classes_student_id_fkey FOREIGN KEY (student_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: student_grades student_grades_subject_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.student_grades
    ADD CONSTRAINT student_grades_subject_id_fkey FOREIGN KEY (subject_id) REFERENCES public.subjects(id);


--
-- Name: teacher_classes teacher_classes_teacher_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.teacher_classes
    ADD CONSTRAINT teacher_classes_teacher_id_fkey FOREIGN KEY (teacher_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: teachers teachers_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.teachers
    ADD CONSTRAINT teachers_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: user_roles user_roles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: attendance Admins can manage all attendance; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage all attendance" ON public.attendance USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: exams Admins can manage all exams; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage all exams" ON public.exams USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: fee_payments Admins can manage all fee payments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage all fee payments" ON public.fee_payments USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: student_grades Admins can manage all grades; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage all grades" ON public.student_grades USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: learning_materials Admins can manage all materials; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage all materials" ON public.learning_materials USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: messages Admins can manage all messages; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage all messages" ON public.messages USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: online_classes Admins can manage all online classes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage all online classes" ON public.online_classes USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: promotion_history Admins can manage all promotions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage all promotions" ON public.promotion_history USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: questions Admins can manage all questions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage all questions" ON public.questions USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: report_cards Admins can manage all report cards; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage all report cards" ON public.report_cards USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: user_roles Admins can manage all roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage all roles" ON public.user_roles USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: students Admins can manage all students; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage all students" ON public.students USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: teachers Admins can manage all teachers; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage all teachers" ON public.teachers USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: payment_transactions Admins can manage all transactions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage all transactions" ON public.payment_transactions USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: classes Admins can manage classes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage classes" ON public.classes USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: fee_structures Admins can manage fee structures; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage fee structures" ON public.fee_structures USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: school_settings Admins can manage school settings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage school settings" ON public.school_settings USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: student_classes Admins can manage student classes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage student classes" ON public.student_classes USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: subjects Admins can manage subjects; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage subjects" ON public.subjects USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: teacher_classes Admins can manage teacher classes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage teacher classes" ON public.teacher_classes USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: student_answers Admins can view all answers; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all answers" ON public.student_answers FOR SELECT USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: profiles Admins can view all profiles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: exam_sessions Admins can view all sessions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all sessions" ON public.exam_sessions FOR SELECT USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: exam_submissions Admins can view all submissions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all submissions" ON public.exam_submissions FOR SELECT USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: audit_logs Admins can view audit logs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view audit logs" ON public.audit_logs FOR SELECT USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: school_settings Anyone can view school settings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view school settings" ON public.school_settings FOR SELECT USING (true);


--
-- Name: classes Classes viewable by authenticated users; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Classes viewable by authenticated users" ON public.classes FOR SELECT USING ((auth.uid() IS NOT NULL));


--
-- Name: fee_structures Fee structures viewable by authenticated users; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Fee structures viewable by authenticated users" ON public.fee_structures FOR SELECT USING ((auth.uid() IS NOT NULL));


--
-- Name: students Public can view students for now; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public can view students for now" ON public.students FOR SELECT USING (true);


--
-- Name: student_classes Students can insert their own class during signup; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Students can insert their own class during signup" ON public.student_classes FOR INSERT WITH CHECK ((auth.uid() = student_id));


--
-- Name: student_answers Students can manage their own answers; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Students can manage their own answers" ON public.student_answers USING ((EXISTS ( SELECT 1
   FROM public.exam_submissions es
  WHERE ((es.id = student_answers.submission_id) AND (es.student_id = auth.uid())))));


--
-- Name: exam_sessions Students can manage their own sessions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Students can manage their own sessions" ON public.exam_sessions USING ((student_id = auth.uid()));


--
-- Name: exam_submissions Students can manage their own submissions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Students can manage their own submissions" ON public.exam_submissions USING ((student_id = auth.uid()));


--
-- Name: online_classes Students can view classes for their class; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Students can view classes for their class" ON public.online_classes FOR SELECT USING ((class_id = public.get_user_class(auth.uid())));


--
-- Name: learning_materials Students can view materials for their class; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Students can view materials for their class" ON public.learning_materials FOR SELECT USING ((class_id = public.get_user_class(auth.uid())));


--
-- Name: exams Students can view published exams for their class; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Students can view published exams for their class" ON public.exams FOR SELECT USING (((is_published = true) AND (class_id = public.get_user_class(auth.uid()))));


--
-- Name: questions Students can view questions for their class exams; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Students can view questions for their class exams" ON public.questions FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.exams e
  WHERE ((e.id = questions.exam_id) AND (e.is_published = true) AND (e.class_id = public.get_user_class(auth.uid()))))));


--
-- Name: attendance Students can view their own attendance; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Students can view their own attendance" ON public.attendance FOR SELECT USING ((student_id = auth.uid()));


--
-- Name: student_classes Students can view their own class; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Students can view their own class" ON public.student_classes FOR SELECT USING ((auth.uid() = student_id));


--
-- Name: fee_payments Students can view their own fee payments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Students can view their own fee payments" ON public.fee_payments FOR SELECT USING ((student_id = auth.uid()));


--
-- Name: student_grades Students can view their own grades; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Students can view their own grades" ON public.student_grades FOR SELECT USING ((student_id = auth.uid()));


--
-- Name: promotion_history Students can view their own promotion history; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Students can view their own promotion history" ON public.promotion_history FOR SELECT USING ((student_id = auth.uid()));


--
-- Name: report_cards Students can view their own report cards; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Students can view their own report cards" ON public.report_cards FOR SELECT USING ((student_id = auth.uid()));


--
-- Name: payment_transactions Students can view their transactions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Students can view their transactions" ON public.payment_transactions FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.fee_payments fp
  WHERE ((fp.id = payment_transactions.fee_payment_id) AND (fp.student_id = auth.uid())))));


--
-- Name: subjects Subjects viewable by authenticated users; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Subjects viewable by authenticated users" ON public.subjects FOR SELECT USING ((auth.uid() IS NOT NULL));


--
-- Name: audit_logs System can insert audit logs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "System can insert audit logs" ON public.audit_logs FOR INSERT WITH CHECK (true);


--
-- Name: teacher_classes Teachers can insert their own class during signup; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Teachers can insert their own class during signup" ON public.teacher_classes FOR INSERT WITH CHECK ((auth.uid() = teacher_id));


--
-- Name: attendance Teachers can manage attendance for their classes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Teachers can manage attendance for their classes" ON public.attendance USING ((public.has_role(auth.uid(), 'teacher'::public.app_role) AND (EXISTS ( SELECT 1
   FROM public.teacher_classes tc
  WHERE ((tc.teacher_id = auth.uid()) AND (tc.class_id = attendance.class_id))))));


--
-- Name: student_grades Teachers can manage grades for their classes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Teachers can manage grades for their classes" ON public.student_grades USING ((public.has_role(auth.uid(), 'teacher'::public.app_role) AND (EXISTS ( SELECT 1
   FROM public.teacher_classes tc
  WHERE ((tc.teacher_id = auth.uid()) AND (tc.class_id = student_grades.class_id))))));


--
-- Name: questions Teachers can manage questions for their exams; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Teachers can manage questions for their exams" ON public.questions USING ((EXISTS ( SELECT 1
   FROM public.exams e
  WHERE ((e.id = questions.exam_id) AND (e.teacher_id = auth.uid())))));


--
-- Name: online_classes Teachers can manage their own classes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Teachers can manage their own classes" ON public.online_classes USING ((teacher_id = auth.uid()));


--
-- Name: exams Teachers can manage their own exams; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Teachers can manage their own exams" ON public.exams USING ((teacher_id = auth.uid()));


--
-- Name: learning_materials Teachers can manage their own materials; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Teachers can manage their own materials" ON public.learning_materials USING ((uploaded_by = auth.uid()));


--
-- Name: messages Teachers can manage their own messages; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Teachers can manage their own messages" ON public.messages USING ((sent_by = auth.uid()));


--
-- Name: student_answers Teachers can view answers for their exams; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Teachers can view answers for their exams" ON public.student_answers FOR SELECT USING ((EXISTS ( SELECT 1
   FROM (public.exam_submissions es
     JOIN public.exams e ON ((e.id = es.exam_id)))
  WHERE ((es.id = student_answers.submission_id) AND (e.teacher_id = auth.uid())))));


--
-- Name: promotion_history Teachers can view promotions for their classes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Teachers can view promotions for their classes" ON public.promotion_history FOR SELECT USING ((public.has_role(auth.uid(), 'teacher'::public.app_role) AND (EXISTS ( SELECT 1
   FROM public.teacher_classes tc
  WHERE ((tc.teacher_id = auth.uid()) AND ((tc.class_id = promotion_history.from_class) OR (tc.class_id = promotion_history.to_class)))))));


--
-- Name: report_cards Teachers can view report cards for their classes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Teachers can view report cards for their classes" ON public.report_cards FOR SELECT USING ((public.has_role(auth.uid(), 'teacher'::public.app_role) AND (EXISTS ( SELECT 1
   FROM public.teacher_classes tc
  WHERE ((tc.teacher_id = auth.uid()) AND (tc.class_id = report_cards.class_id))))));


--
-- Name: exam_sessions Teachers can view sessions for their exams; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Teachers can view sessions for their exams" ON public.exam_sessions FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.exams e
  WHERE ((e.id = exam_sessions.exam_id) AND (e.teacher_id = auth.uid())))));


--
-- Name: profiles Teachers can view student profiles in their classes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Teachers can view student profiles in their classes" ON public.profiles FOR SELECT USING ((public.has_role(auth.uid(), 'teacher'::public.app_role) AND (EXISTS ( SELECT 1
   FROM (public.student_classes sc
     JOIN public.teacher_classes tc ON ((sc.class_id = tc.class_id)))
  WHERE ((sc.student_id = profiles.id) AND (tc.teacher_id = auth.uid()))))));


--
-- Name: student_classes Teachers can view students in their classes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Teachers can view students in their classes" ON public.student_classes FOR SELECT USING ((public.has_role(auth.uid(), 'teacher'::public.app_role) AND (EXISTS ( SELECT 1
   FROM public.teacher_classes tc
  WHERE ((tc.teacher_id = auth.uid()) AND (tc.class_id = student_classes.class_id))))));


--
-- Name: students Teachers can view students in their classes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Teachers can view students in their classes" ON public.students FOR SELECT USING ((public.has_role(auth.uid(), 'teacher'::public.app_role) AND (EXISTS ( SELECT 1
   FROM public.teacher_classes tc
  WHERE ((tc.teacher_id = auth.uid()) AND (tc.class_id = students.class_id))))));


--
-- Name: exam_submissions Teachers can view submissions for their exams; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Teachers can view submissions for their exams" ON public.exam_submissions FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.exams e
  WHERE ((e.id = exam_submissions.exam_id) AND (e.teacher_id = auth.uid())))));


--
-- Name: teacher_classes Teachers can view their own classes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Teachers can view their own classes" ON public.teacher_classes FOR SELECT USING ((auth.uid() = teacher_id));


--
-- Name: teachers Teachers can view their own record; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Teachers can view their own record" ON public.teachers FOR SELECT USING ((user_id = auth.uid()));


--
-- Name: user_roles Users can insert their own role during signup; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own role during signup" ON public.user_roles FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: profiles Users can update their own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING ((auth.uid() = id));


--
-- Name: profiles Users can view their own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING ((auth.uid() = id));


--
-- Name: user_roles Users can view their own roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own roles" ON public.user_roles FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: attendance; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;

--
-- Name: audit_logs; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

--
-- Name: classes; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;

--
-- Name: exam_sessions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.exam_sessions ENABLE ROW LEVEL SECURITY;

--
-- Name: exam_submissions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.exam_submissions ENABLE ROW LEVEL SECURITY;

--
-- Name: exams; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;

--
-- Name: fee_payments; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.fee_payments ENABLE ROW LEVEL SECURITY;

--
-- Name: fee_structures; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.fee_structures ENABLE ROW LEVEL SECURITY;

--
-- Name: learning_materials; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.learning_materials ENABLE ROW LEVEL SECURITY;

--
-- Name: messages; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

--
-- Name: online_classes; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.online_classes ENABLE ROW LEVEL SECURITY;

--
-- Name: payment_transactions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;

--
-- Name: profiles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

--
-- Name: promotion_history; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.promotion_history ENABLE ROW LEVEL SECURITY;

--
-- Name: questions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;

--
-- Name: report_cards; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.report_cards ENABLE ROW LEVEL SECURITY;

--
-- Name: school_settings; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.school_settings ENABLE ROW LEVEL SECURITY;

--
-- Name: student_answers; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.student_answers ENABLE ROW LEVEL SECURITY;

--
-- Name: student_classes; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.student_classes ENABLE ROW LEVEL SECURITY;

--
-- Name: student_grades; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.student_grades ENABLE ROW LEVEL SECURITY;

--
-- Name: students; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;

--
-- Name: subjects; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;

--
-- Name: teacher_classes; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.teacher_classes ENABLE ROW LEVEL SECURITY;

--
-- Name: teachers; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.teachers ENABLE ROW LEVEL SECURITY;

--
-- Name: user_roles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

--
-- PostgreSQL database dump complete
--




COMMIT;