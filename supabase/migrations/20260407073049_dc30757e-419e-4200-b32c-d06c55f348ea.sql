
-- Fix class_id comparison in student RLS policies to be case/space insensitive

-- 1. EXAMS
DROP POLICY IF EXISTS "Students can view published exams for their class" ON exams;
CREATE POLICY "Students can view published exams for their class"
ON exams FOR SELECT TO public
USING (
  is_published = true 
  AND LOWER(REPLACE(class_id, ' ', '')) = LOWER(REPLACE(get_user_class(auth.uid()), ' ', ''))
);

-- 2. QUESTIONS (student view policy)
DROP POLICY IF EXISTS "Students can view questions via secure view" ON questions;
CREATE POLICY "Students can view questions via secure view"
ON questions FOR SELECT TO public
USING (
  has_role(auth.uid(), 'student'::app_role) 
  AND EXISTS (
    SELECT 1 FROM exams e
    WHERE e.id = questions.exam_id
      AND e.is_published = true
      AND LOWER(REPLACE(e.class_id, ' ', '')) = LOWER(REPLACE(get_user_class(auth.uid()), ' ', ''))
  )
);

-- 3. ASSIGNMENTS
DROP POLICY IF EXISTS "Students can view published assignments for their class" ON assignments;
CREATE POLICY "Students can view published assignments for their class"
ON assignments FOR SELECT TO public
USING (
  is_published = true 
  AND LOWER(REPLACE(class_id, ' ', '')) = LOWER(REPLACE(get_user_class(auth.uid()), ' ', ''))
);

-- 4. LEARNING MATERIALS
DROP POLICY IF EXISTS "Students can view materials for their class" ON learning_materials;
CREATE POLICY "Students can view materials for their class"
ON learning_materials FOR SELECT TO public
USING (
  LOWER(REPLACE(class_id, ' ', '')) = LOWER(REPLACE(get_user_class(auth.uid()), ' ', ''))
);

-- 5. ONLINE CLASSES
DROP POLICY IF EXISTS "Students can view classes for their class" ON online_classes;
CREATE POLICY "Students can view classes for their class"
ON online_classes FOR SELECT TO public
USING (
  LOWER(REPLACE(class_id, ' ', '')) = LOWER(REPLACE(get_user_class(auth.uid()), ' ', ''))
);
