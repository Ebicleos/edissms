ALTER TABLE public.student_grades
ADD CONSTRAINT student_grades_unique_student_subject_term
UNIQUE (student_id, subject_name, class_id, term, academic_year);