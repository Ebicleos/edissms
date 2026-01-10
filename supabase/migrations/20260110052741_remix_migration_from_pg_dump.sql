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
    'student',
    'superadmin'
);


--
-- Name: get_school_payment_secret(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_school_payment_secret(p_school_id uuid) RETURNS TABLE(secret_key text, webhook_secret text)
    LANGUAGE sql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT secret_key_encrypted, webhook_secret_encrypted 
  FROM school_payment_secrets 
  WHERE school_id = p_school_id;
$$;


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
-- Name: get_user_school(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_user_school(_user_id uuid) RETURNS uuid
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT school_id FROM public.profiles WHERE id = _user_id LIMIT 1
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


--
-- Name: prevent_admin_self_assignment(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.prevent_admin_self_assignment() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  -- If trying to insert admin role
  IF NEW.role = 'admin' THEN
    -- Check if any admin already exists
    IF EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'admin') THEN
      -- Allow if the current user is a superadmin
      IF EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'superadmin') THEN
        RETURN NEW;
      END IF;
      -- Allow if the current user is already an admin (assigning to someone else)
      IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin') THEN
        RAISE EXCEPTION 'Cannot self-assign admin role. An admin already exists.';
      END IF;
    END IF;
    -- If no admin exists, this is the first admin - allow it
  END IF;
  
  RETURN NEW;
END;
$$;


--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


--
-- Name: validate_student_for_signup(text, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.validate_student_for_signup(admission_num text, student_name text) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.students
    WHERE admission_number = admission_num
    AND LOWER(full_name) = LOWER(student_name)
  )
$$;


SET default_table_access_method = heap;

--
-- Name: announcements; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.announcements (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    title text NOT NULL,
    content text NOT NULL,
    type text DEFAULT 'general'::text,
    target_audience text DEFAULT 'all'::text,
    is_published boolean DEFAULT false,
    publish_date timestamp with time zone,
    expiry_date timestamp with time zone,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now(),
    school_id uuid,
    CONSTRAINT announcements_target_audience_check CHECK ((target_audience = ANY (ARRAY['all'::text, 'teachers'::text, 'students'::text, 'parents'::text]))),
    CONSTRAINT announcements_type_check CHECK ((type = ANY (ARRAY['general'::text, 'urgent'::text, 'event'::text])))
);


--
-- Name: assignments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.assignments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    title text NOT NULL,
    subject text NOT NULL,
    class_id text NOT NULL,
    description text,
    due_date timestamp with time zone,
    file_url text,
    created_by uuid,
    is_published boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    school_id uuid
);


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
    created_at timestamp with time zone DEFAULT now(),
    school_id uuid
);


--
-- Name: events; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.events (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    title text NOT NULL,
    description text,
    event_date date NOT NULL,
    start_time time without time zone,
    end_time time without time zone,
    location text,
    is_all_day boolean DEFAULT false,
    event_type text DEFAULT 'general'::text,
    is_published boolean DEFAULT true,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now(),
    school_id uuid,
    CONSTRAINT events_event_type_check CHECK ((event_type = ANY (ARRAY['general'::text, 'academic'::text, 'holiday'::text, 'sports'::text, 'cultural'::text])))
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
    is_submitted boolean DEFAULT false,
    is_test boolean DEFAULT false
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
    is_exam_active boolean DEFAULT false,
    school_id uuid
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
    created_at timestamp with time zone DEFAULT now(),
    school_id uuid
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
    created_at timestamp with time zone DEFAULT now(),
    school_id uuid
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
-- Name: notification_preferences; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.notification_preferences (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    school_id uuid,
    email_notifications boolean DEFAULT true,
    sms_alerts boolean DEFAULT false,
    fee_reminders boolean DEFAULT true,
    attendance_reports boolean DEFAULT true,
    exam_results boolean DEFAULT true,
    announcements boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
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
-- Name: password_reset_requests; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.password_reset_requests (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    email text NOT NULL,
    role text NOT NULL,
    school_id uuid,
    requested_at timestamp with time zone DEFAULT now() NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    admin_notes text,
    resolved_at timestamp with time zone,
    resolved_by uuid
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
    created_at timestamp with time zone DEFAULT now(),
    school_id uuid
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
-- Name: questions_student_view; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.questions_student_view WITH (security_invoker='true') AS
 SELECT id,
    exam_id,
    question_text,
    option_a,
    option_b,
    option_c,
    option_d,
    marks,
    order_index
   FROM public.questions;


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
-- Name: school_payment_secrets; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.school_payment_secrets (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    school_id uuid NOT NULL,
    secret_key_encrypted text,
    webhook_secret_encrypted text,
    key_last_four text,
    webhook_last_four text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
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
    report_card_config jsonb DEFAULT '{"showAttendance": true, "showAnnualSummary": true, "showAttitudeFields": true, "showSubjectPosition": true}'::jsonb,
    school_initials text,
    school_id uuid
);


--
-- Name: schools; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.schools (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    code text NOT NULL,
    email text,
    phone text,
    address text,
    logo_url text,
    initials text,
    is_active boolean DEFAULT true,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now(),
    payment_gateway_provider text DEFAULT 'paystack'::text,
    payment_gateway_public_key text,
    payment_gateway_enabled boolean DEFAULT false
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
    subject_position integer,
    theory_score numeric DEFAULT 0
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
    school_id uuid,
    user_id uuid,
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
    created_at timestamp with time zone DEFAULT now(),
    school_id uuid NOT NULL
);


--
-- Name: subscriptions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.subscriptions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    school_id uuid NOT NULL,
    plan_type text NOT NULL,
    status text DEFAULT 'trial'::text,
    start_date date DEFAULT CURRENT_DATE NOT NULL,
    end_date date NOT NULL,
    amount numeric DEFAULT 0 NOT NULL,
    payment_reference text,
    max_students integer DEFAULT 500,
    max_teachers integer DEFAULT 50,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT subscriptions_plan_type_check CHECK ((plan_type = ANY (ARRAY['termly'::text, 'yearly'::text]))),
    CONSTRAINT subscriptions_status_check CHECK ((status = ANY (ARRAY['active'::text, 'expired'::text, 'cancelled'::text, 'trial'::text])))
);


--
-- Name: teacher_classes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.teacher_classes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    teacher_id uuid,
    class_id text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    teacher_record_id uuid,
    CONSTRAINT teacher_reference_check CHECK (((teacher_id IS NOT NULL) OR (teacher_record_id IS NOT NULL)))
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
    created_at timestamp with time zone DEFAULT now(),
    school_id uuid
);


--
-- Name: user_password_resets; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_password_resets (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    requested_by uuid NOT NULL,
    reset_token text,
    is_used boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    expires_at timestamp with time zone DEFAULT (now() + '24:00:00'::interval)
);


--
-- Name: user_roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_roles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    role public.app_role NOT NULL,
    school_id uuid
);


--
-- Name: announcements announcements_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.announcements
    ADD CONSTRAINT announcements_pkey PRIMARY KEY (id);


--
-- Name: assignments assignments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.assignments
    ADD CONSTRAINT assignments_pkey PRIMARY KEY (id);


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
-- Name: events events_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.events
    ADD CONSTRAINT events_pkey PRIMARY KEY (id);


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
-- Name: notification_preferences notification_preferences_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notification_preferences
    ADD CONSTRAINT notification_preferences_pkey PRIMARY KEY (id);


--
-- Name: notification_preferences notification_preferences_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notification_preferences
    ADD CONSTRAINT notification_preferences_user_id_key UNIQUE (user_id);


--
-- Name: online_classes online_classes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.online_classes
    ADD CONSTRAINT online_classes_pkey PRIMARY KEY (id);


--
-- Name: password_reset_requests password_reset_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.password_reset_requests
    ADD CONSTRAINT password_reset_requests_pkey PRIMARY KEY (id);


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
-- Name: school_payment_secrets school_payment_secrets_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.school_payment_secrets
    ADD CONSTRAINT school_payment_secrets_pkey PRIMARY KEY (id);


--
-- Name: school_payment_secrets school_payment_secrets_school_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.school_payment_secrets
    ADD CONSTRAINT school_payment_secrets_school_id_key UNIQUE (school_id);


--
-- Name: school_settings school_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.school_settings
    ADD CONSTRAINT school_settings_pkey PRIMARY KEY (id);


--
-- Name: schools schools_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.schools
    ADD CONSTRAINT schools_code_key UNIQUE (code);


--
-- Name: schools schools_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.schools
    ADD CONSTRAINT schools_pkey PRIMARY KEY (id);


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
-- Name: subscriptions subscriptions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subscriptions
    ADD CONSTRAINT subscriptions_pkey PRIMARY KEY (id);


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
-- Name: user_password_resets user_password_resets_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_password_resets
    ADD CONSTRAINT user_password_resets_pkey PRIMARY KEY (id);


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
-- Name: idx_students_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_students_user_id ON public.students USING btree (user_id);


--
-- Name: user_roles prevent_admin_self_assignment; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER prevent_admin_self_assignment BEFORE INSERT ON public.user_roles FOR EACH ROW EXECUTE FUNCTION public.prevent_admin_self_assignment();


--
-- Name: notification_preferences update_notification_preferences_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_notification_preferences_updated_at BEFORE UPDATE ON public.notification_preferences FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: school_payment_secrets update_school_payment_secrets_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_school_payment_secrets_updated_at BEFORE UPDATE ON public.school_payment_secrets FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: announcements announcements_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.announcements
    ADD CONSTRAINT announcements_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);


--
-- Name: announcements announcements_school_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.announcements
    ADD CONSTRAINT announcements_school_id_fkey FOREIGN KEY (school_id) REFERENCES public.schools(id) ON DELETE CASCADE;


--
-- Name: assignments assignments_school_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.assignments
    ADD CONSTRAINT assignments_school_id_fkey FOREIGN KEY (school_id) REFERENCES public.schools(id) ON DELETE CASCADE;


--
-- Name: classes classes_school_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.classes
    ADD CONSTRAINT classes_school_id_fkey FOREIGN KEY (school_id) REFERENCES public.schools(id) ON DELETE CASCADE;


--
-- Name: events events_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.events
    ADD CONSTRAINT events_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);


--
-- Name: events events_school_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.events
    ADD CONSTRAINT events_school_id_fkey FOREIGN KEY (school_id) REFERENCES public.schools(id) ON DELETE CASCADE;


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
-- Name: exams exams_school_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.exams
    ADD CONSTRAINT exams_school_id_fkey FOREIGN KEY (school_id) REFERENCES public.schools(id) ON DELETE CASCADE;


--
-- Name: exams exams_teacher_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.exams
    ADD CONSTRAINT exams_teacher_id_fkey FOREIGN KEY (teacher_id) REFERENCES auth.users(id);


--
-- Name: fee_payments fee_payments_school_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fee_payments
    ADD CONSTRAINT fee_payments_school_id_fkey FOREIGN KEY (school_id) REFERENCES public.schools(id) ON DELETE CASCADE;


--
-- Name: fee_payments fee_payments_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fee_payments
    ADD CONSTRAINT fee_payments_student_id_fkey FOREIGN KEY (student_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: fee_structures fee_structures_school_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fee_structures
    ADD CONSTRAINT fee_structures_school_id_fkey FOREIGN KEY (school_id) REFERENCES public.schools(id) ON DELETE CASCADE;


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
-- Name: notification_preferences notification_preferences_school_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notification_preferences
    ADD CONSTRAINT notification_preferences_school_id_fkey FOREIGN KEY (school_id) REFERENCES public.schools(id) ON DELETE CASCADE;


--
-- Name: notification_preferences notification_preferences_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notification_preferences
    ADD CONSTRAINT notification_preferences_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


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
-- Name: profiles profiles_school_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_school_id_fkey FOREIGN KEY (school_id) REFERENCES public.schools(id) ON DELETE SET NULL;


--
-- Name: questions questions_exam_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.questions
    ADD CONSTRAINT questions_exam_id_fkey FOREIGN KEY (exam_id) REFERENCES public.exams(id) ON DELETE CASCADE;


--
-- Name: school_payment_secrets school_payment_secrets_school_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.school_payment_secrets
    ADD CONSTRAINT school_payment_secrets_school_id_fkey FOREIGN KEY (school_id) REFERENCES public.schools(id) ON DELETE CASCADE;


--
-- Name: school_settings school_settings_school_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.school_settings
    ADD CONSTRAINT school_settings_school_id_fkey FOREIGN KEY (school_id) REFERENCES public.schools(id) ON DELETE CASCADE;


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
-- Name: students students_school_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.students
    ADD CONSTRAINT students_school_id_fkey FOREIGN KEY (school_id) REFERENCES public.schools(id) ON DELETE CASCADE;


--
-- Name: students students_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.students
    ADD CONSTRAINT students_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id);


--
-- Name: subjects subjects_school_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subjects
    ADD CONSTRAINT subjects_school_id_fkey FOREIGN KEY (school_id) REFERENCES public.schools(id) ON DELETE CASCADE;


--
-- Name: subscriptions subscriptions_school_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subscriptions
    ADD CONSTRAINT subscriptions_school_id_fkey FOREIGN KEY (school_id) REFERENCES public.schools(id) ON DELETE CASCADE;


--
-- Name: teacher_classes teacher_classes_teacher_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.teacher_classes
    ADD CONSTRAINT teacher_classes_teacher_id_fkey FOREIGN KEY (teacher_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: teacher_classes teacher_classes_teacher_record_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.teacher_classes
    ADD CONSTRAINT teacher_classes_teacher_record_id_fkey FOREIGN KEY (teacher_record_id) REFERENCES public.teachers(id) ON DELETE CASCADE;


--
-- Name: teachers teachers_school_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.teachers
    ADD CONSTRAINT teachers_school_id_fkey FOREIGN KEY (school_id) REFERENCES public.schools(id) ON DELETE CASCADE;


--
-- Name: teachers teachers_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.teachers
    ADD CONSTRAINT teachers_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: user_password_resets user_password_resets_requested_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_password_resets
    ADD CONSTRAINT user_password_resets_requested_by_fkey FOREIGN KEY (requested_by) REFERENCES auth.users(id);


--
-- Name: user_password_resets user_password_resets_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_password_resets
    ADD CONSTRAINT user_password_resets_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: user_roles user_roles_school_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_school_id_fkey FOREIGN KEY (school_id) REFERENCES public.schools(id) ON DELETE CASCADE;


--
-- Name: user_roles user_roles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: fee_payments Admins and superadmins can manage all fee payments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins and superadmins can manage all fee payments" ON public.fee_payments TO authenticated USING ((public.has_role(auth.uid(), 'superadmin'::public.app_role) OR (public.has_role(auth.uid(), 'admin'::public.app_role) AND (school_id = public.get_user_school(auth.uid()))))) WITH CHECK ((public.has_role(auth.uid(), 'superadmin'::public.app_role) OR (public.has_role(auth.uid(), 'admin'::public.app_role) AND (school_id = public.get_user_school(auth.uid())))));


--
-- Name: payment_transactions Admins and superadmins can manage all transactions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins and superadmins can manage all transactions" ON public.payment_transactions TO authenticated USING ((public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'superadmin'::public.app_role))) WITH CHECK ((public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'superadmin'::public.app_role)));


--
-- Name: password_reset_requests Admins and superadmins can manage password reset requests; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins and superadmins can manage password reset requests" ON public.password_reset_requests USING ((public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'superadmin'::public.app_role)));


--
-- Name: user_password_resets Admins and superadmins can manage password resets; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins and superadmins can manage password resets" ON public.user_password_resets USING ((public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'superadmin'::public.app_role)));


--
-- Name: student_classes Admins and superadmins can manage student classes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins and superadmins can manage student classes" ON public.student_classes TO authenticated USING ((public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'superadmin'::public.app_role))) WITH CHECK ((public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'superadmin'::public.app_role)));


--
-- Name: teacher_classes Admins and superadmins can manage teacher classes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins and superadmins can manage teacher classes" ON public.teacher_classes USING ((public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'superadmin'::public.app_role)));


--
-- Name: audit_logs Admins and superadmins can view audit logs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins and superadmins can view audit logs" ON public.audit_logs FOR SELECT USING ((public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'superadmin'::public.app_role)));


--
-- Name: announcements Admins can manage announcements; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage announcements" ON public.announcements TO authenticated USING ((public.has_role(auth.uid(), 'superadmin'::public.app_role) OR (public.has_role(auth.uid(), 'admin'::public.app_role) AND (school_id = public.get_user_school(auth.uid()))))) WITH CHECK ((public.has_role(auth.uid(), 'superadmin'::public.app_role) OR (public.has_role(auth.uid(), 'admin'::public.app_role) AND (school_id = public.get_user_school(auth.uid())))));


--
-- Name: announcements Admins can manage announcements in their school; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage announcements in their school" ON public.announcements TO authenticated USING ((public.has_role(auth.uid(), 'superadmin'::public.app_role) OR (public.has_role(auth.uid(), 'admin'::public.app_role) AND (school_id = public.get_user_school(auth.uid()))))) WITH CHECK ((public.has_role(auth.uid(), 'superadmin'::public.app_role) OR (public.has_role(auth.uid(), 'admin'::public.app_role) AND (school_id = public.get_user_school(auth.uid())))));


--
-- Name: assignments Admins can manage assignments in their school; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage assignments in their school" ON public.assignments TO authenticated USING ((public.has_role(auth.uid(), 'superadmin'::public.app_role) OR (public.has_role(auth.uid(), 'admin'::public.app_role) AND (school_id = public.get_user_school(auth.uid()))))) WITH CHECK ((public.has_role(auth.uid(), 'superadmin'::public.app_role) OR (public.has_role(auth.uid(), 'admin'::public.app_role) AND (school_id = public.get_user_school(auth.uid())))));


--
-- Name: attendance Admins can manage attendance in their school; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage attendance in their school" ON public.attendance TO authenticated USING ((public.has_role(auth.uid(), 'superadmin'::public.app_role) OR (public.has_role(auth.uid(), 'admin'::public.app_role) AND (EXISTS ( SELECT 1
   FROM public.students s
  WHERE ((s.id = attendance.student_id) AND (s.school_id = public.get_user_school(auth.uid())))))))) WITH CHECK ((public.has_role(auth.uid(), 'superadmin'::public.app_role) OR (public.has_role(auth.uid(), 'admin'::public.app_role) AND (EXISTS ( SELECT 1
   FROM public.students s
  WHERE ((s.id = attendance.student_id) AND (s.school_id = public.get_user_school(auth.uid()))))))));


--
-- Name: classes Admins can manage classes in their school; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage classes in their school" ON public.classes TO authenticated USING ((public.has_role(auth.uid(), 'superadmin'::public.app_role) OR (public.has_role(auth.uid(), 'admin'::public.app_role) AND (school_id = public.get_user_school(auth.uid()))))) WITH CHECK ((public.has_role(auth.uid(), 'superadmin'::public.app_role) OR (public.has_role(auth.uid(), 'admin'::public.app_role) AND (school_id = public.get_user_school(auth.uid())))));


--
-- Name: events Admins can manage events in their school; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage events in their school" ON public.events TO authenticated USING ((public.has_role(auth.uid(), 'superadmin'::public.app_role) OR (public.has_role(auth.uid(), 'admin'::public.app_role) AND (school_id = public.get_user_school(auth.uid()))))) WITH CHECK ((public.has_role(auth.uid(), 'superadmin'::public.app_role) OR (public.has_role(auth.uid(), 'admin'::public.app_role) AND (school_id = public.get_user_school(auth.uid())))));


--
-- Name: exams Admins can manage exams in their school; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage exams in their school" ON public.exams TO authenticated USING ((public.has_role(auth.uid(), 'superadmin'::public.app_role) OR (public.has_role(auth.uid(), 'admin'::public.app_role) AND (school_id = public.get_user_school(auth.uid()))))) WITH CHECK ((public.has_role(auth.uid(), 'superadmin'::public.app_role) OR (public.has_role(auth.uid(), 'admin'::public.app_role) AND (school_id = public.get_user_school(auth.uid())))));


--
-- Name: fee_structures Admins can manage fee structures; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage fee structures" ON public.fee_structures TO authenticated USING ((public.has_role(auth.uid(), 'superadmin'::public.app_role) OR (public.has_role(auth.uid(), 'admin'::public.app_role) AND (school_id = public.get_user_school(auth.uid()))))) WITH CHECK ((public.has_role(auth.uid(), 'superadmin'::public.app_role) OR (public.has_role(auth.uid(), 'admin'::public.app_role) AND (school_id = public.get_user_school(auth.uid())))));


--
-- Name: fee_structures Admins can manage fee structures in their school; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage fee structures in their school" ON public.fee_structures TO authenticated USING ((public.has_role(auth.uid(), 'superadmin'::public.app_role) OR (public.has_role(auth.uid(), 'admin'::public.app_role) AND (school_id = public.get_user_school(auth.uid()))))) WITH CHECK ((public.has_role(auth.uid(), 'superadmin'::public.app_role) OR (public.has_role(auth.uid(), 'admin'::public.app_role) AND (school_id = public.get_user_school(auth.uid())))));


--
-- Name: student_grades Admins can manage grades in their school; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage grades in their school" ON public.student_grades TO authenticated USING ((public.has_role(auth.uid(), 'superadmin'::public.app_role) OR (public.has_role(auth.uid(), 'admin'::public.app_role) AND (EXISTS ( SELECT 1
   FROM public.students s
  WHERE ((s.id = student_grades.student_id) AND (s.school_id = public.get_user_school(auth.uid())))))))) WITH CHECK ((public.has_role(auth.uid(), 'superadmin'::public.app_role) OR (public.has_role(auth.uid(), 'admin'::public.app_role) AND (EXISTS ( SELECT 1
   FROM public.students s
  WHERE ((s.id = student_grades.student_id) AND (s.school_id = public.get_user_school(auth.uid()))))))));


--
-- Name: learning_materials Admins can manage materials in their school; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage materials in their school" ON public.learning_materials TO authenticated USING ((public.has_role(auth.uid(), 'superadmin'::public.app_role) OR (public.has_role(auth.uid(), 'admin'::public.app_role) AND (EXISTS ( SELECT 1
   FROM public.classes c
  WHERE ((c.name = learning_materials.class_id) AND (c.school_id = public.get_user_school(auth.uid())))))))) WITH CHECK ((public.has_role(auth.uid(), 'superadmin'::public.app_role) OR (public.has_role(auth.uid(), 'admin'::public.app_role) AND (EXISTS ( SELECT 1
   FROM public.classes c
  WHERE ((c.name = learning_materials.class_id) AND (c.school_id = public.get_user_school(auth.uid()))))))));


--
-- Name: messages Admins can manage messages in their school; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage messages in their school" ON public.messages TO authenticated USING ((public.has_role(auth.uid(), 'superadmin'::public.app_role) OR (public.has_role(auth.uid(), 'admin'::public.app_role) AND (EXISTS ( SELECT 1
   FROM public.profiles p
  WHERE ((p.id = messages.sent_by) AND (p.school_id = public.get_user_school(auth.uid())))))))) WITH CHECK ((public.has_role(auth.uid(), 'superadmin'::public.app_role) OR (public.has_role(auth.uid(), 'admin'::public.app_role) AND (EXISTS ( SELECT 1
   FROM public.profiles p
  WHERE ((p.id = messages.sent_by) AND (p.school_id = public.get_user_school(auth.uid()))))))));


--
-- Name: online_classes Admins can manage online classes in their school; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage online classes in their school" ON public.online_classes TO authenticated USING ((public.has_role(auth.uid(), 'superadmin'::public.app_role) OR (public.has_role(auth.uid(), 'admin'::public.app_role) AND (EXISTS ( SELECT 1
   FROM public.classes c
  WHERE ((c.name = online_classes.class_id) AND (c.school_id = public.get_user_school(auth.uid())))))))) WITH CHECK ((public.has_role(auth.uid(), 'superadmin'::public.app_role) OR (public.has_role(auth.uid(), 'admin'::public.app_role) AND (EXISTS ( SELECT 1
   FROM public.classes c
  WHERE ((c.name = online_classes.class_id) AND (c.school_id = public.get_user_school(auth.uid()))))))));


--
-- Name: password_reset_requests Admins can manage password reset requests; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage password reset requests" ON public.password_reset_requests TO authenticated USING ((public.has_role(auth.uid(), 'superadmin'::public.app_role) OR public.has_role(auth.uid(), 'admin'::public.app_role))) WITH CHECK ((public.has_role(auth.uid(), 'superadmin'::public.app_role) OR public.has_role(auth.uid(), 'admin'::public.app_role)));


--
-- Name: promotion_history Admins can manage promotion history; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage promotion history" ON public.promotion_history TO authenticated USING ((public.has_role(auth.uid(), 'superadmin'::public.app_role) OR public.has_role(auth.uid(), 'admin'::public.app_role))) WITH CHECK ((public.has_role(auth.uid(), 'superadmin'::public.app_role) OR public.has_role(auth.uid(), 'admin'::public.app_role)));


--
-- Name: promotion_history Admins can manage promotions in their school; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage promotions in their school" ON public.promotion_history TO authenticated USING ((public.has_role(auth.uid(), 'superadmin'::public.app_role) OR (public.has_role(auth.uid(), 'admin'::public.app_role) AND (EXISTS ( SELECT 1
   FROM public.students s
  WHERE ((s.id = promotion_history.student_id) AND (s.school_id = public.get_user_school(auth.uid())))))))) WITH CHECK ((public.has_role(auth.uid(), 'superadmin'::public.app_role) OR (public.has_role(auth.uid(), 'admin'::public.app_role) AND (EXISTS ( SELECT 1
   FROM public.students s
  WHERE ((s.id = promotion_history.student_id) AND (s.school_id = public.get_user_school(auth.uid()))))))));


--
-- Name: questions Admins can manage questions in their school; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage questions in their school" ON public.questions TO authenticated USING ((public.has_role(auth.uid(), 'superadmin'::public.app_role) OR (public.has_role(auth.uid(), 'admin'::public.app_role) AND (EXISTS ( SELECT 1
   FROM public.exams e
  WHERE ((e.id = questions.exam_id) AND (e.school_id = public.get_user_school(auth.uid())))))))) WITH CHECK ((public.has_role(auth.uid(), 'superadmin'::public.app_role) OR (public.has_role(auth.uid(), 'admin'::public.app_role) AND (EXISTS ( SELECT 1
   FROM public.exams e
  WHERE ((e.id = questions.exam_id) AND (e.school_id = public.get_user_school(auth.uid()))))))));


--
-- Name: report_cards Admins can manage report cards; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage report cards" ON public.report_cards TO authenticated USING ((public.has_role(auth.uid(), 'superadmin'::public.app_role) OR public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'teacher'::public.app_role))) WITH CHECK ((public.has_role(auth.uid(), 'superadmin'::public.app_role) OR public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'teacher'::public.app_role)));


--
-- Name: report_cards Admins can manage report cards in their school; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage report cards in their school" ON public.report_cards TO authenticated USING ((public.has_role(auth.uid(), 'superadmin'::public.app_role) OR (public.has_role(auth.uid(), 'admin'::public.app_role) AND (EXISTS ( SELECT 1
   FROM public.students s
  WHERE ((s.id = report_cards.student_id) AND (s.school_id = public.get_user_school(auth.uid())))))))) WITH CHECK ((public.has_role(auth.uid(), 'superadmin'::public.app_role) OR (public.has_role(auth.uid(), 'admin'::public.app_role) AND (EXISTS ( SELECT 1
   FROM public.students s
  WHERE ((s.id = report_cards.student_id) AND (s.school_id = public.get_user_school(auth.uid()))))))));


--
-- Name: user_roles Admins can manage roles in their school; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage roles in their school" ON public.user_roles TO authenticated USING (((public.has_role(auth.uid(), 'admin'::public.app_role) AND (school_id = public.get_user_school(auth.uid()))) OR public.has_role(auth.uid(), 'superadmin'::public.app_role))) WITH CHECK (((public.has_role(auth.uid(), 'admin'::public.app_role) AND (school_id = public.get_user_school(auth.uid()))) OR public.has_role(auth.uid(), 'superadmin'::public.app_role)));


--
-- Name: school_payment_secrets Admins can manage school payment secrets; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage school payment secrets" ON public.school_payment_secrets TO authenticated USING ((public.has_role(auth.uid(), 'superadmin'::public.app_role) OR (public.has_role(auth.uid(), 'admin'::public.app_role) AND (school_id = public.get_user_school(auth.uid()))))) WITH CHECK ((public.has_role(auth.uid(), 'superadmin'::public.app_role) OR (public.has_role(auth.uid(), 'admin'::public.app_role) AND (school_id = public.get_user_school(auth.uid())))));


--
-- Name: school_settings Admins can manage school settings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage school settings" ON public.school_settings TO authenticated USING ((public.has_role(auth.uid(), 'superadmin'::public.app_role) OR (public.has_role(auth.uid(), 'admin'::public.app_role) AND (school_id = public.get_user_school(auth.uid()))))) WITH CHECK ((public.has_role(auth.uid(), 'superadmin'::public.app_role) OR (public.has_role(auth.uid(), 'admin'::public.app_role) AND (school_id = public.get_user_school(auth.uid())))));


--
-- Name: students Admins can manage students in their school; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage students in their school" ON public.students TO authenticated USING ((public.has_role(auth.uid(), 'superadmin'::public.app_role) OR (public.has_role(auth.uid(), 'admin'::public.app_role) AND (school_id = public.get_user_school(auth.uid()))))) WITH CHECK ((public.has_role(auth.uid(), 'superadmin'::public.app_role) OR (public.has_role(auth.uid(), 'admin'::public.app_role) AND (school_id = public.get_user_school(auth.uid())))));


--
-- Name: subjects Admins can manage subjects in their school; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage subjects in their school" ON public.subjects TO authenticated USING ((public.has_role(auth.uid(), 'superadmin'::public.app_role) OR (public.has_role(auth.uid(), 'admin'::public.app_role) AND (school_id = public.get_user_school(auth.uid()))))) WITH CHECK ((public.has_role(auth.uid(), 'superadmin'::public.app_role) OR (public.has_role(auth.uid(), 'admin'::public.app_role) AND (school_id = public.get_user_school(auth.uid())))));


--
-- Name: subscriptions Admins can manage subscriptions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage subscriptions" ON public.subscriptions TO authenticated USING ((public.has_role(auth.uid(), 'superadmin'::public.app_role) OR (public.has_role(auth.uid(), 'admin'::public.app_role) AND (school_id = public.get_user_school(auth.uid()))))) WITH CHECK ((public.has_role(auth.uid(), 'superadmin'::public.app_role) OR (public.has_role(auth.uid(), 'admin'::public.app_role) AND (school_id = public.get_user_school(auth.uid())))));


--
-- Name: teacher_classes Admins can manage teacher class assignments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage teacher class assignments" ON public.teacher_classes TO authenticated USING ((public.has_role(auth.uid(), 'superadmin'::public.app_role) OR public.has_role(auth.uid(), 'admin'::public.app_role))) WITH CHECK ((public.has_role(auth.uid(), 'superadmin'::public.app_role) OR public.has_role(auth.uid(), 'admin'::public.app_role)));


--
-- Name: teachers Admins can manage teachers in their school; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage teachers in their school" ON public.teachers TO authenticated USING ((public.has_role(auth.uid(), 'superadmin'::public.app_role) OR (public.has_role(auth.uid(), 'admin'::public.app_role) AND (school_id = public.get_user_school(auth.uid()))))) WITH CHECK ((public.has_role(auth.uid(), 'superadmin'::public.app_role) OR (public.has_role(auth.uid(), 'admin'::public.app_role) AND (school_id = public.get_user_school(auth.uid())))));


--
-- Name: school_payment_secrets Admins can manage their school secrets; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage their school secrets" ON public.school_payment_secrets FOR INSERT WITH CHECK (((school_id = public.get_user_school(auth.uid())) AND public.has_role(auth.uid(), 'admin'::public.app_role)));


--
-- Name: school_settings Admins can manage their school settings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage their school settings" ON public.school_settings TO authenticated USING ((public.has_role(auth.uid(), 'superadmin'::public.app_role) OR (public.has_role(auth.uid(), 'admin'::public.app_role) AND (school_id = public.get_user_school(auth.uid()))))) WITH CHECK ((public.has_role(auth.uid(), 'superadmin'::public.app_role) OR (public.has_role(auth.uid(), 'admin'::public.app_role) AND (school_id = public.get_user_school(auth.uid())))));


--
-- Name: user_roles Admins can manage user roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage user roles" ON public.user_roles TO authenticated USING ((public.has_role(auth.uid(), 'superadmin'::public.app_role) OR (public.has_role(auth.uid(), 'admin'::public.app_role) AND (school_id = public.get_user_school(auth.uid()))))) WITH CHECK ((public.has_role(auth.uid(), 'superadmin'::public.app_role) OR (public.has_role(auth.uid(), 'admin'::public.app_role) AND (school_id = public.get_user_school(auth.uid())))));


--
-- Name: schools Admins can update their school; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can update their school" ON public.schools FOR UPDATE TO authenticated USING (((id IN ( SELECT user_roles.school_id
   FROM public.user_roles
  WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.role = 'admin'::public.app_role)))) OR public.has_role(auth.uid(), 'superadmin'::public.app_role))) WITH CHECK (((id IN ( SELECT user_roles.school_id
   FROM public.user_roles
  WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.role = 'admin'::public.app_role)))) OR public.has_role(auth.uid(), 'superadmin'::public.app_role)));


--
-- Name: school_payment_secrets Admins can update their school secrets; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can update their school secrets" ON public.school_payment_secrets FOR UPDATE USING (((school_id = public.get_user_school(auth.uid())) AND public.has_role(auth.uid(), 'admin'::public.app_role)));


--
-- Name: subscriptions Admins can update their subscription; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can update their subscription" ON public.subscriptions FOR UPDATE TO authenticated USING ((school_id = public.get_user_school(auth.uid()))) WITH CHECK ((school_id = public.get_user_school(auth.uid())));


--
-- Name: student_answers Admins can view answers in their school; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view answers in their school" ON public.student_answers FOR SELECT TO authenticated USING ((public.has_role(auth.uid(), 'superadmin'::public.app_role) OR (public.has_role(auth.uid(), 'admin'::public.app_role) AND (EXISTS ( SELECT 1
   FROM (public.exam_submissions es
     JOIN public.exams e ON ((e.id = es.exam_id)))
  WHERE ((es.id = student_answers.submission_id) AND (e.school_id = public.get_user_school(auth.uid()))))))));


--
-- Name: school_payment_secrets Admins can view masked secret info for their school; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view masked secret info for their school" ON public.school_payment_secrets FOR SELECT USING (((school_id = public.get_user_school(auth.uid())) AND public.has_role(auth.uid(), 'admin'::public.app_role)));


--
-- Name: profiles Admins can view profiles in their school; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view profiles in their school" ON public.profiles FOR SELECT TO authenticated USING (((auth.uid() = id) OR (school_id = public.get_user_school(auth.uid())) OR public.has_role(auth.uid(), 'superadmin'::public.app_role)));


--
-- Name: user_roles Admins can view roles in their school; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view roles in their school" ON public.user_roles FOR SELECT TO authenticated USING (((school_id = public.get_user_school(auth.uid())) OR public.has_role(auth.uid(), 'superadmin'::public.app_role)));


--
-- Name: exam_sessions Admins can view sessions in their school; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view sessions in their school" ON public.exam_sessions FOR SELECT TO authenticated USING ((public.has_role(auth.uid(), 'superadmin'::public.app_role) OR (public.has_role(auth.uid(), 'admin'::public.app_role) AND (EXISTS ( SELECT 1
   FROM public.exams e
  WHERE ((e.id = exam_sessions.exam_id) AND (e.school_id = public.get_user_school(auth.uid()))))))));


--
-- Name: exam_submissions Admins can view submissions in their school; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view submissions in their school" ON public.exam_submissions FOR SELECT TO authenticated USING ((public.has_role(auth.uid(), 'superadmin'::public.app_role) OR (public.has_role(auth.uid(), 'admin'::public.app_role) AND (EXISTS ( SELECT 1
   FROM public.exams e
  WHERE ((e.id = exam_submissions.exam_id) AND (e.school_id = public.get_user_school(auth.uid()))))))));


--
-- Name: subscriptions Admins can view their subscription; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view their subscription" ON public.subscriptions FOR SELECT USING ((school_id = public.get_user_school(auth.uid())));


--
-- Name: schools Allow authenticated users to create their school; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow authenticated users to create their school" ON public.schools FOR INSERT TO authenticated WITH CHECK ((auth.uid() = created_by));


--
-- Name: schools Authenticated users can create schools during registration; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can create schools during registration" ON public.schools FOR INSERT TO authenticated WITH CHECK (true);


--
-- Name: subscriptions Authenticated users can create subscriptions during registratio; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can create subscriptions during registratio" ON public.subscriptions FOR INSERT TO authenticated WITH CHECK (true);


--
-- Name: audit_logs Authenticated users can insert audit logs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can insert audit logs" ON public.audit_logs FOR INSERT TO authenticated WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: events Authenticated users can view published events; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can view published events" ON public.events FOR SELECT USING (((auth.uid() IS NOT NULL) AND (is_published = true)));


--
-- Name: profiles Service role can insert profiles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Service role can insert profiles" ON public.profiles FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'superadmin'::public.app_role));


--
-- Name: student_classes Students can insert their own class during signup; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Students can insert their own class during signup" ON public.student_classes FOR INSERT WITH CHECK ((auth.uid() = student_id));


--
-- Name: student_answers Students can manage their own answers; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Students can manage their own answers" ON public.student_answers TO authenticated USING ((public.has_role(auth.uid(), 'superadmin'::public.app_role) OR public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'teacher'::public.app_role) OR (EXISTS ( SELECT 1
   FROM public.exam_submissions es
  WHERE ((es.id = student_answers.submission_id) AND (es.student_id = auth.uid())))))) WITH CHECK ((public.has_role(auth.uid(), 'superadmin'::public.app_role) OR public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'teacher'::public.app_role) OR (EXISTS ( SELECT 1
   FROM public.exam_submissions es
  WHERE ((es.id = student_answers.submission_id) AND (es.student_id = auth.uid()))))));


--
-- Name: exam_sessions Students can manage their own sessions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Students can manage their own sessions" ON public.exam_sessions USING ((student_id = auth.uid()));


--
-- Name: exam_submissions Students can manage their own submissions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Students can manage their own submissions" ON public.exam_submissions USING ((student_id = auth.uid()));


--
-- Name: students Students can update own contact info; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Students can update own contact info" ON public.students FOR UPDATE USING ((user_id = auth.uid())) WITH CHECK ((user_id = auth.uid()));


--
-- Name: online_classes Students can view classes for their class; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Students can view classes for their class" ON public.online_classes FOR SELECT USING ((class_id = public.get_user_class(auth.uid())));


--
-- Name: learning_materials Students can view materials for their class; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Students can view materials for their class" ON public.learning_materials FOR SELECT USING ((class_id = public.get_user_class(auth.uid())));


--
-- Name: students Students can view own record via user_id; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Students can view own record via user_id" ON public.students FOR SELECT USING ((user_id = auth.uid()));


--
-- Name: announcements Students can view published announcements for their audience; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Students can view published announcements for their audience" ON public.announcements FOR SELECT USING ((public.has_role(auth.uid(), 'student'::public.app_role) AND (is_published = true) AND ((target_audience = 'all'::text) OR (target_audience = 'students'::text))));


--
-- Name: assignments Students can view published assignments for their class; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Students can view published assignments for their class" ON public.assignments FOR SELECT USING (((is_published = true) AND (class_id = public.get_user_class(auth.uid()))));


--
-- Name: exams Students can view published exams for their class; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Students can view published exams for their class" ON public.exams FOR SELECT USING (((is_published = true) AND (class_id = public.get_user_class(auth.uid()))));


--
-- Name: questions Students can view questions via secure view; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Students can view questions via secure view" ON public.questions FOR SELECT USING ((public.has_role(auth.uid(), 'student'::public.app_role) AND (EXISTS ( SELECT 1
   FROM public.exams e
  WHERE ((e.id = questions.exam_id) AND (e.is_published = true) AND (e.class_id = public.get_user_class(auth.uid())))))));


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
-- Name: school_payment_secrets Superadmins can manage all payment secrets; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Superadmins can manage all payment secrets" ON public.school_payment_secrets USING (public.has_role(auth.uid(), 'superadmin'::public.app_role));


--
-- Name: schools Superadmins can manage all schools; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Superadmins can manage all schools" ON public.schools USING (public.has_role(auth.uid(), 'superadmin'::public.app_role));


--
-- Name: subscriptions Superadmins can manage all subscriptions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Superadmins can manage all subscriptions" ON public.subscriptions USING (public.has_role(auth.uid(), 'superadmin'::public.app_role));


--
-- Name: teacher_classes Teachers can insert their own class during signup; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Teachers can insert their own class during signup" ON public.teacher_classes FOR INSERT WITH CHECK ((auth.uid() = teacher_id));


--
-- Name: assignments Teachers can manage assignments for their classes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Teachers can manage assignments for their classes" ON public.assignments TO authenticated USING ((public.has_role(auth.uid(), 'superadmin'::public.app_role) OR public.has_role(auth.uid(), 'admin'::public.app_role) OR (public.has_role(auth.uid(), 'teacher'::public.app_role) AND (school_id = public.get_user_school(auth.uid()))))) WITH CHECK ((public.has_role(auth.uid(), 'superadmin'::public.app_role) OR public.has_role(auth.uid(), 'admin'::public.app_role) OR (public.has_role(auth.uid(), 'teacher'::public.app_role) AND (school_id = public.get_user_school(auth.uid())))));


--
-- Name: attendance Teachers can manage attendance for their classes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Teachers can manage attendance for their classes" ON public.attendance TO authenticated USING ((public.has_role(auth.uid(), 'superadmin'::public.app_role) OR public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'teacher'::public.app_role))) WITH CHECK ((public.has_role(auth.uid(), 'superadmin'::public.app_role) OR public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'teacher'::public.app_role)));


--
-- Name: events Teachers can manage events; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Teachers can manage events" ON public.events TO authenticated USING ((public.has_role(auth.uid(), 'superadmin'::public.app_role) OR public.has_role(auth.uid(), 'admin'::public.app_role) OR (public.has_role(auth.uid(), 'teacher'::public.app_role) AND (school_id = public.get_user_school(auth.uid()))))) WITH CHECK ((public.has_role(auth.uid(), 'superadmin'::public.app_role) OR public.has_role(auth.uid(), 'admin'::public.app_role) OR (public.has_role(auth.uid(), 'teacher'::public.app_role) AND (school_id = public.get_user_school(auth.uid())))));


--
-- Name: exam_sessions Teachers can manage exam sessions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Teachers can manage exam sessions" ON public.exam_sessions TO authenticated USING ((public.has_role(auth.uid(), 'superadmin'::public.app_role) OR public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'teacher'::public.app_role))) WITH CHECK ((public.has_role(auth.uid(), 'superadmin'::public.app_role) OR public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'teacher'::public.app_role)));


--
-- Name: exam_submissions Teachers can manage exam submissions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Teachers can manage exam submissions" ON public.exam_submissions TO authenticated USING ((public.has_role(auth.uid(), 'superadmin'::public.app_role) OR public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'teacher'::public.app_role) OR (student_id = auth.uid()))) WITH CHECK ((public.has_role(auth.uid(), 'superadmin'::public.app_role) OR public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'teacher'::public.app_role) OR (student_id = auth.uid())));


--
-- Name: exams Teachers can manage exams for their classes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Teachers can manage exams for their classes" ON public.exams TO authenticated USING ((public.has_role(auth.uid(), 'superadmin'::public.app_role) OR public.has_role(auth.uid(), 'admin'::public.app_role) OR (public.has_role(auth.uid(), 'teacher'::public.app_role) AND (school_id = public.get_user_school(auth.uid()))))) WITH CHECK ((public.has_role(auth.uid(), 'superadmin'::public.app_role) OR public.has_role(auth.uid(), 'admin'::public.app_role) OR (public.has_role(auth.uid(), 'teacher'::public.app_role) AND (school_id = public.get_user_school(auth.uid())))));


--
-- Name: student_grades Teachers can manage grades for their classes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Teachers can manage grades for their classes" ON public.student_grades USING ((public.has_role(auth.uid(), 'teacher'::public.app_role) AND (EXISTS ( SELECT 1
   FROM public.teacher_classes tc
  WHERE ((tc.teacher_id = auth.uid()) AND (tc.class_id = student_grades.class_id))))));


--
-- Name: learning_materials Teachers can manage learning materials; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Teachers can manage learning materials" ON public.learning_materials TO authenticated USING ((public.has_role(auth.uid(), 'superadmin'::public.app_role) OR public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'teacher'::public.app_role))) WITH CHECK ((public.has_role(auth.uid(), 'superadmin'::public.app_role) OR public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'teacher'::public.app_role)));


--
-- Name: messages Teachers can manage messages; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Teachers can manage messages" ON public.messages TO authenticated USING ((public.has_role(auth.uid(), 'superadmin'::public.app_role) OR public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'teacher'::public.app_role))) WITH CHECK ((public.has_role(auth.uid(), 'superadmin'::public.app_role) OR public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'teacher'::public.app_role)));


--
-- Name: online_classes Teachers can manage online classes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Teachers can manage online classes" ON public.online_classes TO authenticated USING ((public.has_role(auth.uid(), 'superadmin'::public.app_role) OR public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'teacher'::public.app_role))) WITH CHECK ((public.has_role(auth.uid(), 'superadmin'::public.app_role) OR public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'teacher'::public.app_role)));


--
-- Name: questions Teachers can manage questions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Teachers can manage questions" ON public.questions TO authenticated USING ((public.has_role(auth.uid(), 'superadmin'::public.app_role) OR public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'teacher'::public.app_role))) WITH CHECK ((public.has_role(auth.uid(), 'superadmin'::public.app_role) OR public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'teacher'::public.app_role)));


--
-- Name: questions Teachers can manage questions for their exams; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Teachers can manage questions for their exams" ON public.questions USING ((EXISTS ( SELECT 1
   FROM public.exams e
  WHERE ((e.id = questions.exam_id) AND (e.teacher_id = auth.uid())))));


--
-- Name: student_grades Teachers can manage student grades; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Teachers can manage student grades" ON public.student_grades TO authenticated USING ((public.has_role(auth.uid(), 'superadmin'::public.app_role) OR public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'teacher'::public.app_role))) WITH CHECK ((public.has_role(auth.uid(), 'superadmin'::public.app_role) OR public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'teacher'::public.app_role)));


--
-- Name: assignments Teachers can manage their assignments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Teachers can manage their assignments" ON public.assignments USING ((created_by = auth.uid()));


--
-- Name: online_classes Teachers can manage their own classes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Teachers can manage their own classes" ON public.online_classes USING ((teacher_id = auth.uid()));


--
-- Name: events Teachers can manage their own events; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Teachers can manage their own events" ON public.events USING ((public.has_role(auth.uid(), 'teacher'::public.app_role) AND (created_by = auth.uid())));


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
-- Name: questions Teachers can view exam questions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Teachers can view exam questions" ON public.questions FOR SELECT USING ((public.has_role(auth.uid(), 'teacher'::public.app_role) AND (EXISTS ( SELECT 1
   FROM public.exams e
  WHERE ((e.id = questions.exam_id) AND ((e.teacher_id = auth.uid()) OR (e.school_id = public.get_user_school(auth.uid()))))))));


--
-- Name: promotion_history Teachers can view promotions for their classes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Teachers can view promotions for their classes" ON public.promotion_history FOR SELECT USING ((public.has_role(auth.uid(), 'teacher'::public.app_role) AND (EXISTS ( SELECT 1
   FROM public.teacher_classes tc
  WHERE ((tc.teacher_id = auth.uid()) AND ((tc.class_id = promotion_history.from_class) OR (tc.class_id = promotion_history.to_class)))))));


--
-- Name: announcements Teachers can view published announcements; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Teachers can view published announcements" ON public.announcements FOR SELECT USING ((public.has_role(auth.uid(), 'teacher'::public.app_role) AND (is_published = true)));


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

CREATE POLICY "Teachers can view students in their classes" ON public.students FOR SELECT USING ((public.has_role(auth.uid(), 'teacher'::public.app_role) AND (school_id = public.get_user_school(auth.uid())) AND (EXISTS ( SELECT 1
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
-- Name: notification_preferences Users can create their own notification preferences; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create their own notification preferences" ON public.notification_preferences FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: profiles Users can insert their own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK ((auth.uid() = id));


--
-- Name: password_reset_requests Users can insert their own reset requests; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own reset requests" ON public.password_reset_requests FOR INSERT WITH CHECK (true);


--
-- Name: user_roles Users can insert their own role during registration; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own role during registration" ON public.user_roles FOR INSERT TO authenticated WITH CHECK ((user_id = auth.uid()));


--
-- Name: user_roles Users can insert their own role during signup; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own role during signup" ON public.user_roles FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: notification_preferences Users can manage their notification preferences; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can manage their notification preferences" ON public.notification_preferences TO authenticated USING ((user_id = auth.uid())) WITH CHECK ((user_id = auth.uid()));


--
-- Name: profiles Users can manage their own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can manage their own profile" ON public.profiles TO authenticated USING (((id = auth.uid()) OR public.has_role(auth.uid(), 'superadmin'::public.app_role) OR public.has_role(auth.uid(), 'admin'::public.app_role))) WITH CHECK (((id = auth.uid()) OR public.has_role(auth.uid(), 'superadmin'::public.app_role) OR public.has_role(auth.uid(), 'admin'::public.app_role)));


--
-- Name: notification_preferences Users can update their own notification preferences; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own notification preferences" ON public.notification_preferences FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: profiles Users can update their own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING ((auth.uid() = id));


--
-- Name: classes Users can view classes in their school; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view classes in their school" ON public.classes FOR SELECT USING (((school_id = public.get_user_school(auth.uid())) OR public.has_role(auth.uid(), 'superadmin'::public.app_role)));


--
-- Name: fee_structures Users can view fee structures in their school; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view fee structures in their school" ON public.fee_structures FOR SELECT TO authenticated USING (((school_id = public.get_user_school(auth.uid())) OR public.has_role(auth.uid(), 'superadmin'::public.app_role)));


--
-- Name: subjects Users can view subjects in their school; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view subjects in their school" ON public.subjects FOR SELECT TO authenticated USING (((school_id = public.get_user_school(auth.uid())) OR public.has_role(auth.uid(), 'superadmin'::public.app_role)));


--
-- Name: notification_preferences Users can view their own notification preferences; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own notification preferences" ON public.notification_preferences FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: profiles Users can view their own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING ((auth.uid() = id));


--
-- Name: password_reset_requests Users can view their own reset requests; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own reset requests" ON public.password_reset_requests FOR SELECT USING ((email = ( SELECT profiles.email
   FROM public.profiles
  WHERE (profiles.id = auth.uid()))));


--
-- Name: user_roles Users can view their own role; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own role" ON public.user_roles FOR SELECT TO authenticated USING ((user_id = auth.uid()));


--
-- Name: user_roles Users can view their own roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own roles" ON public.user_roles FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: school_settings Users can view their school settings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their school settings" ON public.school_settings FOR SELECT TO authenticated USING (((school_id = public.get_user_school(auth.uid())) OR public.has_role(auth.uid(), 'superadmin'::public.app_role)));


--
-- Name: schools Users can view their schools; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their schools" ON public.schools FOR SELECT TO authenticated USING (((created_by = auth.uid()) OR (id IN ( SELECT user_roles.school_id
   FROM public.user_roles
  WHERE (user_roles.user_id = auth.uid()))) OR public.has_role(auth.uid(), 'superadmin'::public.app_role)));


--
-- Name: announcements; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

--
-- Name: assignments; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;

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
-- Name: events; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

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
-- Name: notification_preferences; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

--
-- Name: online_classes; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.online_classes ENABLE ROW LEVEL SECURITY;

--
-- Name: password_reset_requests; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.password_reset_requests ENABLE ROW LEVEL SECURITY;

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
-- Name: school_payment_secrets; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.school_payment_secrets ENABLE ROW LEVEL SECURITY;

--
-- Name: school_settings; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.school_settings ENABLE ROW LEVEL SECURITY;

--
-- Name: schools; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.schools ENABLE ROW LEVEL SECURITY;

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
-- Name: subscriptions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

--
-- Name: teacher_classes; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.teacher_classes ENABLE ROW LEVEL SECURITY;

--
-- Name: teachers; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.teachers ENABLE ROW LEVEL SECURITY;

--
-- Name: user_password_resets; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_password_resets ENABLE ROW LEVEL SECURITY;

--
-- Name: user_roles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

--
-- PostgreSQL database dump complete
--




COMMIT;