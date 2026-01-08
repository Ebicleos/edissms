-- =============================================
-- COMPREHENSIVE MULTI-TENANT DATA ISOLATION FIX
-- =============================================

-- 1. STUDENTS TABLE - School-scoped admin access
DROP POLICY IF EXISTS "Admins and superadmins can manage all students" ON public.students;
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

-- 2. TEACHERS TABLE - School-scoped admin access
DROP POLICY IF EXISTS "Admins and superadmins can manage all teachers" ON public.teachers;
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

-- 3. SCHOOL_SETTINGS TABLE - School-scoped access
DROP POLICY IF EXISTS "Authenticated users can view school settings" ON public.school_settings;
DROP POLICY IF EXISTS "Admins and superadmins can manage school settings" ON public.school_settings;

CREATE POLICY "Users can view their school settings"
ON public.school_settings FOR SELECT TO authenticated
USING (
  school_id = get_user_school(auth.uid()) OR
  has_role(auth.uid(), 'superadmin'::app_role)
);

CREATE POLICY "Admins can manage their school settings"
ON public.school_settings FOR ALL TO authenticated
USING (
  has_role(auth.uid(), 'superadmin'::app_role) OR
  (has_role(auth.uid(), 'admin'::app_role) AND school_id = get_user_school(auth.uid()))
)
WITH CHECK (
  has_role(auth.uid(), 'superadmin'::app_role) OR
  (has_role(auth.uid(), 'admin'::app_role) AND school_id = get_user_school(auth.uid()))
);

-- 4. ANNOUNCEMENTS TABLE - School-scoped admin access
DROP POLICY IF EXISTS "Admins and superadmins can manage all announcements" ON public.announcements;
CREATE POLICY "Admins can manage announcements in their school"
ON public.announcements FOR ALL TO authenticated
USING (
  has_role(auth.uid(), 'superadmin'::app_role) OR
  (has_role(auth.uid(), 'admin'::app_role) AND school_id = get_user_school(auth.uid()))
)
WITH CHECK (
  has_role(auth.uid(), 'superadmin'::app_role) OR
  (has_role(auth.uid(), 'admin'::app_role) AND school_id = get_user_school(auth.uid()))
);

-- 5. ASSIGNMENTS TABLE - School-scoped admin access
DROP POLICY IF EXISTS "Admins and superadmins can manage all assignments" ON public.assignments;
CREATE POLICY "Admins can manage assignments in their school"
ON public.assignments FOR ALL TO authenticated
USING (
  has_role(auth.uid(), 'superadmin'::app_role) OR
  (has_role(auth.uid(), 'admin'::app_role) AND school_id = get_user_school(auth.uid()))
)
WITH CHECK (
  has_role(auth.uid(), 'superadmin'::app_role) OR
  (has_role(auth.uid(), 'admin'::app_role) AND school_id = get_user_school(auth.uid()))
);

-- 6. ATTENDANCE TABLE - School-scoped admin access
DROP POLICY IF EXISTS "Admins and superadmins can manage all attendance" ON public.attendance;
CREATE POLICY "Admins can manage attendance in their school"
ON public.attendance FOR ALL TO authenticated
USING (
  has_role(auth.uid(), 'superadmin'::app_role) OR
  (has_role(auth.uid(), 'admin'::app_role) AND EXISTS (
    SELECT 1 FROM public.students s 
    WHERE s.id = attendance.student_id AND s.school_id = get_user_school(auth.uid())
  ))
)
WITH CHECK (
  has_role(auth.uid(), 'superadmin'::app_role) OR
  (has_role(auth.uid(), 'admin'::app_role) AND EXISTS (
    SELECT 1 FROM public.students s 
    WHERE s.id = attendance.student_id AND s.school_id = get_user_school(auth.uid())
  ))
);

-- 7. EVENTS TABLE - School-scoped admin access
DROP POLICY IF EXISTS "Admins and superadmins can manage all events" ON public.events;
CREATE POLICY "Admins can manage events in their school"
ON public.events FOR ALL TO authenticated
USING (
  has_role(auth.uid(), 'superadmin'::app_role) OR
  (has_role(auth.uid(), 'admin'::app_role) AND school_id = get_user_school(auth.uid()))
)
WITH CHECK (
  has_role(auth.uid(), 'superadmin'::app_role) OR
  (has_role(auth.uid(), 'admin'::app_role) AND school_id = get_user_school(auth.uid()))
);

-- 8. EXAMS TABLE - School-scoped admin access
DROP POLICY IF EXISTS "Admins and superadmins can manage all exams" ON public.exams;
CREATE POLICY "Admins can manage exams in their school"
ON public.exams FOR ALL TO authenticated
USING (
  has_role(auth.uid(), 'superadmin'::app_role) OR
  (has_role(auth.uid(), 'admin'::app_role) AND school_id = get_user_school(auth.uid()))
)
WITH CHECK (
  has_role(auth.uid(), 'superadmin'::app_role) OR
  (has_role(auth.uid(), 'admin'::app_role) AND school_id = get_user_school(auth.uid()))
);

-- 9. EXAM_SESSIONS TABLE - School-scoped admin access via exam
DROP POLICY IF EXISTS "Admins and superadmins can view all sessions" ON public.exam_sessions;
CREATE POLICY "Admins can view sessions in their school"
ON public.exam_sessions FOR SELECT TO authenticated
USING (
  has_role(auth.uid(), 'superadmin'::app_role) OR
  (has_role(auth.uid(), 'admin'::app_role) AND EXISTS (
    SELECT 1 FROM public.exams e 
    WHERE e.id = exam_sessions.exam_id AND e.school_id = get_user_school(auth.uid())
  ))
);

-- 10. EXAM_SUBMISSIONS TABLE - School-scoped admin access via exam
DROP POLICY IF EXISTS "Admins and superadmins can view all submissions" ON public.exam_submissions;
CREATE POLICY "Admins can view submissions in their school"
ON public.exam_submissions FOR SELECT TO authenticated
USING (
  has_role(auth.uid(), 'superadmin'::app_role) OR
  (has_role(auth.uid(), 'admin'::app_role) AND EXISTS (
    SELECT 1 FROM public.exams e 
    WHERE e.id = exam_submissions.exam_id AND e.school_id = get_user_school(auth.uid())
  ))
);

-- 11. QUESTIONS TABLE - School-scoped admin access
DROP POLICY IF EXISTS "Admins and superadmins can manage all questions" ON public.questions;
DROP POLICY IF EXISTS "Admins can view all exam questions" ON public.questions;

CREATE POLICY "Admins can manage questions in their school"
ON public.questions FOR ALL TO authenticated
USING (
  has_role(auth.uid(), 'superadmin'::app_role) OR
  (has_role(auth.uid(), 'admin'::app_role) AND EXISTS (
    SELECT 1 FROM public.exams e 
    WHERE e.id = questions.exam_id AND e.school_id = get_user_school(auth.uid())
  ))
)
WITH CHECK (
  has_role(auth.uid(), 'superadmin'::app_role) OR
  (has_role(auth.uid(), 'admin'::app_role) AND EXISTS (
    SELECT 1 FROM public.exams e 
    WHERE e.id = questions.exam_id AND e.school_id = get_user_school(auth.uid())
  ))
);

-- 12. REPORT_CARDS TABLE - School-scoped admin access
DROP POLICY IF EXISTS "Admins and superadmins can manage all report cards" ON public.report_cards;
CREATE POLICY "Admins can manage report cards in their school"
ON public.report_cards FOR ALL TO authenticated
USING (
  has_role(auth.uid(), 'superadmin'::app_role) OR
  (has_role(auth.uid(), 'admin'::app_role) AND EXISTS (
    SELECT 1 FROM public.students s 
    WHERE s.id = report_cards.student_id AND s.school_id = get_user_school(auth.uid())
  ))
)
WITH CHECK (
  has_role(auth.uid(), 'superadmin'::app_role) OR
  (has_role(auth.uid(), 'admin'::app_role) AND EXISTS (
    SELECT 1 FROM public.students s 
    WHERE s.id = report_cards.student_id AND s.school_id = get_user_school(auth.uid())
  ))
);

-- 13. STUDENT_GRADES TABLE - School-scoped admin access
DROP POLICY IF EXISTS "Admins and superadmins can manage all grades" ON public.student_grades;
CREATE POLICY "Admins can manage grades in their school"
ON public.student_grades FOR ALL TO authenticated
USING (
  has_role(auth.uid(), 'superadmin'::app_role) OR
  (has_role(auth.uid(), 'admin'::app_role) AND EXISTS (
    SELECT 1 FROM public.students s 
    WHERE s.id = student_grades.student_id AND s.school_id = get_user_school(auth.uid())
  ))
)
WITH CHECK (
  has_role(auth.uid(), 'superadmin'::app_role) OR
  (has_role(auth.uid(), 'admin'::app_role) AND EXISTS (
    SELECT 1 FROM public.students s 
    WHERE s.id = student_grades.student_id AND s.school_id = get_user_school(auth.uid())
  ))
);

-- 14. SUBJECTS TABLE - School-scoped access
DROP POLICY IF EXISTS "Admins and superadmins can manage subjects" ON public.subjects;
DROP POLICY IF EXISTS "Subjects viewable by authenticated users" ON public.subjects;

CREATE POLICY "Users can view subjects in their school"
ON public.subjects FOR SELECT TO authenticated
USING (
  school_id = get_user_school(auth.uid()) OR
  school_id IS NULL OR
  has_role(auth.uid(), 'superadmin'::app_role)
);

CREATE POLICY "Admins can manage subjects in their school"
ON public.subjects FOR ALL TO authenticated
USING (
  has_role(auth.uid(), 'superadmin'::app_role) OR
  (has_role(auth.uid(), 'admin'::app_role) AND (school_id = get_user_school(auth.uid()) OR school_id IS NULL))
)
WITH CHECK (
  has_role(auth.uid(), 'superadmin'::app_role) OR
  (has_role(auth.uid(), 'admin'::app_role) AND (school_id = get_user_school(auth.uid()) OR school_id IS NULL))
);

-- 15. FEE_STRUCTURES TABLE - School-scoped access
DROP POLICY IF EXISTS "Admins and superadmins can manage fee structures" ON public.fee_structures;
DROP POLICY IF EXISTS "Fee structures viewable by authenticated users" ON public.fee_structures;

CREATE POLICY "Users can view fee structures in their school"
ON public.fee_structures FOR SELECT TO authenticated
USING (
  school_id = get_user_school(auth.uid()) OR
  has_role(auth.uid(), 'superadmin'::app_role)
);

CREATE POLICY "Admins can manage fee structures in their school"
ON public.fee_structures FOR ALL TO authenticated
USING (
  has_role(auth.uid(), 'superadmin'::app_role) OR
  (has_role(auth.uid(), 'admin'::app_role) AND school_id = get_user_school(auth.uid()))
)
WITH CHECK (
  has_role(auth.uid(), 'superadmin'::app_role) OR
  (has_role(auth.uid(), 'admin'::app_role) AND school_id = get_user_school(auth.uid()))
);

-- 16. LEARNING_MATERIALS TABLE - School-scoped admin access
DROP POLICY IF EXISTS "Admins and superadmins can manage all materials" ON public.learning_materials;
CREATE POLICY "Admins can manage materials in their school"
ON public.learning_materials FOR ALL TO authenticated
USING (
  has_role(auth.uid(), 'superadmin'::app_role) OR
  (has_role(auth.uid(), 'admin'::app_role) AND EXISTS (
    SELECT 1 FROM public.classes c 
    WHERE c.name = learning_materials.class_id AND c.school_id = get_user_school(auth.uid())
  ))
)
WITH CHECK (
  has_role(auth.uid(), 'superadmin'::app_role) OR
  (has_role(auth.uid(), 'admin'::app_role) AND EXISTS (
    SELECT 1 FROM public.classes c 
    WHERE c.name = learning_materials.class_id AND c.school_id = get_user_school(auth.uid())
  ))
);

-- 17. ONLINE_CLASSES TABLE - School-scoped admin access
DROP POLICY IF EXISTS "Admins and superadmins can manage all online classes" ON public.online_classes;
CREATE POLICY "Admins can manage online classes in their school"
ON public.online_classes FOR ALL TO authenticated
USING (
  has_role(auth.uid(), 'superadmin'::app_role) OR
  (has_role(auth.uid(), 'admin'::app_role) AND EXISTS (
    SELECT 1 FROM public.classes c 
    WHERE c.name = online_classes.class_id AND c.school_id = get_user_school(auth.uid())
  ))
)
WITH CHECK (
  has_role(auth.uid(), 'superadmin'::app_role) OR
  (has_role(auth.uid(), 'admin'::app_role) AND EXISTS (
    SELECT 1 FROM public.classes c 
    WHERE c.name = online_classes.class_id AND c.school_id = get_user_school(auth.uid())
  ))
);

-- 18. MESSAGES TABLE - School-scoped admin access
DROP POLICY IF EXISTS "Admins and superadmins can manage all messages" ON public.messages;
CREATE POLICY "Admins can manage messages in their school"
ON public.messages FOR ALL TO authenticated
USING (
  has_role(auth.uid(), 'superadmin'::app_role) OR
  (has_role(auth.uid(), 'admin'::app_role) AND EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.id = messages.sent_by AND p.school_id = get_user_school(auth.uid())
  ))
)
WITH CHECK (
  has_role(auth.uid(), 'superadmin'::app_role) OR
  (has_role(auth.uid(), 'admin'::app_role) AND EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.id = messages.sent_by AND p.school_id = get_user_school(auth.uid())
  ))
);

-- 19. STUDENT_ANSWERS TABLE - School-scoped admin access
DROP POLICY IF EXISTS "Admins and superadmins can view all answers" ON public.student_answers;
CREATE POLICY "Admins can view answers in their school"
ON public.student_answers FOR SELECT TO authenticated
USING (
  has_role(auth.uid(), 'superadmin'::app_role) OR
  (has_role(auth.uid(), 'admin'::app_role) AND EXISTS (
    SELECT 1 FROM exam_submissions es
    JOIN exams e ON e.id = es.exam_id
    WHERE es.id = student_answers.submission_id AND e.school_id = get_user_school(auth.uid())
  ))
);

-- 20. PROMOTION_HISTORY TABLE - School-scoped admin access
DROP POLICY IF EXISTS "Admins and superadmins can manage all promotions" ON public.promotion_history;
CREATE POLICY "Admins can manage promotions in their school"
ON public.promotion_history FOR ALL TO authenticated
USING (
  has_role(auth.uid(), 'superadmin'::app_role) OR
  (has_role(auth.uid(), 'admin'::app_role) AND EXISTS (
    SELECT 1 FROM public.students s 
    WHERE s.id = promotion_history.student_id AND s.school_id = get_user_school(auth.uid())
  ))
)
WITH CHECK (
  has_role(auth.uid(), 'superadmin'::app_role) OR
  (has_role(auth.uid(), 'admin'::app_role) AND EXISTS (
    SELECT 1 FROM public.students s 
    WHERE s.id = promotion_history.student_id AND s.school_id = get_user_school(auth.uid())
  ))
);