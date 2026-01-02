-- Create app_role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'teacher', 'student');

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT,
  phone_contact TEXT,
  photo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create teacher_classes table
CREATE TABLE public.teacher_classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  class_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (teacher_id, class_id)
);

-- Enable RLS on teacher_classes
ALTER TABLE public.teacher_classes ENABLE ROW LEVEL SECURITY;

-- Create student_classes table
CREATE TABLE public.student_classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  class_id TEXT NOT NULL,
  admission_number TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (student_id)
);

-- Enable RLS on student_classes
ALTER TABLE public.student_classes ENABLE ROW LEVEL SECURITY;

-- Create exams table
CREATE TABLE public.exams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  subject TEXT NOT NULL,
  class_id TEXT NOT NULL,
  teacher_id UUID REFERENCES auth.users(id),
  duration_minutes INTEGER NOT NULL DEFAULT 60,
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ,
  is_published BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on exams
ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;

-- Create questions table
CREATE TABLE public.questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id UUID REFERENCES public.exams(id) ON DELETE CASCADE NOT NULL,
  question_text TEXT NOT NULL,
  option_a TEXT NOT NULL,
  option_b TEXT NOT NULL,
  option_c TEXT,
  option_d TEXT,
  correct_option TEXT NOT NULL,
  marks INTEGER DEFAULT 1,
  order_index INTEGER
);

-- Enable RLS on questions
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;

-- Create exam_submissions table
CREATE TABLE public.exam_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id UUID REFERENCES public.exams(id) ON DELETE CASCADE NOT NULL,
  student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  submitted_at TIMESTAMPTZ,
  score INTEGER,
  total_marks INTEGER,
  is_submitted BOOLEAN DEFAULT FALSE,
  UNIQUE (exam_id, student_id)
);

-- Enable RLS on exam_submissions
ALTER TABLE public.exam_submissions ENABLE ROW LEVEL SECURITY;

-- Create student_answers table
CREATE TABLE public.student_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID REFERENCES public.exam_submissions(id) ON DELETE CASCADE NOT NULL,
  question_id UUID REFERENCES public.questions(id) ON DELETE CASCADE NOT NULL,
  selected_option TEXT,
  is_correct BOOLEAN,
  UNIQUE (submission_id, question_id)
);

-- Enable RLS on student_answers
ALTER TABLE public.student_answers ENABLE ROW LEVEL SECURITY;

-- Create security definer function for role checking
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Create function to get user's class
CREATE OR REPLACE FUNCTION public.get_user_class(_user_id UUID)
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT class_id FROM public.student_classes WHERE student_id = _user_id LIMIT 1
$$;

-- Create function to handle new user profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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

-- Create trigger for new user profile creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- RLS Policies for user_roles
CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all roles"
  ON public.user_roles FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Teachers can view student profiles in their classes"
  ON public.profiles FOR SELECT
  USING (
    public.has_role(auth.uid(), 'teacher') AND
    EXISTS (
      SELECT 1 FROM public.student_classes sc
      JOIN public.teacher_classes tc ON sc.class_id = tc.class_id
      WHERE sc.student_id = profiles.id AND tc.teacher_id = auth.uid()
    )
  );

-- RLS Policies for teacher_classes
CREATE POLICY "Teachers can view their own classes"
  ON public.teacher_classes FOR SELECT
  USING (auth.uid() = teacher_id);

CREATE POLICY "Admins can manage teacher classes"
  ON public.teacher_classes FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for student_classes
CREATE POLICY "Students can view their own class"
  ON public.student_classes FOR SELECT
  USING (auth.uid() = student_id);

CREATE POLICY "Admins can manage student classes"
  ON public.student_classes FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Teachers can view students in their classes"
  ON public.student_classes FOR SELECT
  USING (
    public.has_role(auth.uid(), 'teacher') AND
    EXISTS (
      SELECT 1 FROM public.teacher_classes tc
      WHERE tc.teacher_id = auth.uid() AND tc.class_id = student_classes.class_id
    )
  );

-- RLS Policies for exams
CREATE POLICY "Admins can manage all exams"
  ON public.exams FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Teachers can manage their own exams"
  ON public.exams FOR ALL
  USING (teacher_id = auth.uid());

CREATE POLICY "Students can view published exams for their class"
  ON public.exams FOR SELECT
  USING (
    is_published = TRUE AND
    class_id = public.get_user_class(auth.uid())
  );

-- RLS Policies for questions
CREATE POLICY "Admins can manage all questions"
  ON public.questions FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Teachers can manage questions for their exams"
  ON public.questions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.exams e
      WHERE e.id = questions.exam_id AND e.teacher_id = auth.uid()
    )
  );

CREATE POLICY "Students can view questions for their class exams"
  ON public.questions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.exams e
      WHERE e.id = questions.exam_id
      AND e.is_published = TRUE
      AND e.class_id = public.get_user_class(auth.uid())
    )
  );

-- RLS Policies for exam_submissions
CREATE POLICY "Students can manage their own submissions"
  ON public.exam_submissions FOR ALL
  USING (student_id = auth.uid());

CREATE POLICY "Teachers can view submissions for their exams"
  ON public.exam_submissions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.exams e
      WHERE e.id = exam_submissions.exam_id AND e.teacher_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all submissions"
  ON public.exam_submissions FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for student_answers
CREATE POLICY "Students can manage their own answers"
  ON public.student_answers FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.exam_submissions es
      WHERE es.id = student_answers.submission_id AND es.student_id = auth.uid()
    )
  );

CREATE POLICY "Teachers can view answers for their exams"
  ON public.student_answers FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.exam_submissions es
      JOIN public.exams e ON e.id = es.exam_id
      WHERE es.id = student_answers.submission_id AND e.teacher_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all answers"
  ON public.student_answers FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));