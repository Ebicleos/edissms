import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { calculateGrade, DEFAULT_GRADING_SCALE, GradeScale } from '@/lib/grading';
import { toast } from 'sonner';

export interface StudentGradeEntry {
  id?: string;
  student_id: string;
  student_name: string;
  admission_number: string;
  ca1_score: number;
  ca2_score: number;
  ca3_score: number;
  theory_score: number;
  exam_score: number;
  total_score: number;
  grade: string;
  remarks: string;
}

export interface Subject {
  id: string;
  name: string;
  code: string | null;
  class_id: string | null;
}

export function useGradeEntry() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [students, setStudents] = useState<StudentGradeEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [gradingScale, setGradingScale] = useState<GradeScale[]>(DEFAULT_GRADING_SCALE);

  // Fetch subjects
  const fetchSubjects = useCallback(async (classId?: string) => {
    try {
      let query = supabase.from('subjects').select('*');
      
      if (classId) {
        query = query.or(`class_id.eq.${classId},class_id.is.null`);
      }
      
      const { data, error } = await query.order('name');
      
      if (error) throw error;
      setSubjects(data || []);
    } catch (error) {
      console.error('Error fetching subjects:', error);
      toast.error('Failed to load subjects');
    }
  }, []);

  // Fetch grading scale from school settings
  const fetchGradingScale = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('school_settings')
        .select('grading_scale')
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      if (data?.grading_scale && Array.isArray(data.grading_scale)) {
        setGradingScale(data.grading_scale as unknown as GradeScale[]);
      }
    } catch (error) {
      console.error('Error fetching grading scale:', error);
    }
  }, []);

  // Fetch students with existing grades
  const fetchStudentsWithGrades = useCallback(async (
    classId: string,
    subjectName: string,
    term: string,
    academicYear: string
  ) => {
    setIsLoading(true);
    try {
      // Fetch students in the class
      const { data: studentsData, error: studentsError } = await supabase
        .from('students')
        .select('id, full_name, admission_number')
        .eq('class_id', classId)
        .order('full_name');

      if (studentsError) throw studentsError;

      // Fetch existing grades for these students
      const studentIds = studentsData?.map(s => s.id) || [];
      
      const { data: gradesData, error: gradesError } = await supabase
        .from('student_grades')
        .select('*')
        .eq('class_id', classId)
        .eq('subject_name', subjectName)
        .eq('term', term)
        .eq('academic_year', academicYear)
        .in('student_id', studentIds);

      if (gradesError) throw gradesError;

      // Map students with their grades
      const gradesMap = new Map(gradesData?.map(g => [g.student_id, g]) || []);
      
      const studentsWithGrades: StudentGradeEntry[] = (studentsData || []).map(student => {
        const existingGrade = gradesMap.get(student.id);
        
        if (existingGrade) {
          return {
            id: existingGrade.id,
            student_id: student.id,
            student_name: student.full_name,
            admission_number: student.admission_number,
            ca1_score: Number(existingGrade.ca1_score) || 0,
            ca2_score: Number(existingGrade.ca2_score) || 0,
            ca3_score: Number(existingGrade.ca3_score) || 0,
            theory_score: Number(existingGrade.theory_score) || 0,
            exam_score: Number(existingGrade.exam_score) || 0,
            total_score: Number(existingGrade.total_score) || 0,
            grade: existingGrade.grade || '',
            remarks: existingGrade.remarks || '',
          };
        }
        
        return {
          student_id: student.id,
          student_name: student.full_name,
          admission_number: student.admission_number,
          ca1_score: 0,
          ca2_score: 0,
          ca3_score: 0,
          theory_score: 0,
          exam_score: 0,
          total_score: 0,
          grade: '',
          remarks: '',
        };
      });

      setStudents(studentsWithGrades);
    } catch (error) {
      console.error('Error fetching students with grades:', error);
      toast.error('Failed to load students');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Calculate total and grade for a student
  const calculateStudentGrade = useCallback((
    ca1: number,
    ca2: number,
    ca3: number,
    theory: number,
    exam: number
  ): { total: number; grade: string; remarks: string } => {
    const total = ca1 + ca2 + ca3 + theory + exam;
    const { grade, remarks } = calculateGrade(total, gradingScale);
    return { total, grade, remarks };
  }, [gradingScale]);

  // Update a student's scores locally
  const updateStudentScore = useCallback((
    studentId: string,
    field: 'ca1_score' | 'ca2_score' | 'ca3_score' | 'theory_score' | 'exam_score',
    value: number
  ) => {
    setStudents(prev => prev.map(student => {
      if (student.student_id !== studentId) return student;
      
      const updated = { ...student, [field]: value };
      const { total, grade, remarks } = calculateStudentGrade(
        updated.ca1_score,
        updated.ca2_score,
        updated.ca3_score,
        updated.theory_score,
        updated.exam_score
      );
      
      return {
        ...updated,
        total_score: total,
        grade,
        remarks,
      };
    }));
  }, [calculateStudentGrade]);

  // Save all grades
  const saveGrades = useCallback(async (
    classId: string,
    subjectName: string,
    term: string,
    academicYear: string
  ) => {
    setIsSaving(true);
    try {
      const gradesToUpsert = students.map(student => ({
        id: student.id || undefined,
        student_id: student.student_id,
        class_id: classId,
        subject_name: subjectName,
        term,
        academic_year: academicYear,
        ca1_score: student.ca1_score,
        ca2_score: student.ca2_score,
        ca3_score: student.ca3_score,
        theory_score: student.theory_score,
        exam_score: student.exam_score,
        total_score: student.total_score,
        grade: student.grade,
        remarks: student.remarks,
      }));

      // Separate updates and inserts
      const toUpdate = gradesToUpsert.filter(g => g.id);
      const toInsert = gradesToUpsert.filter(g => !g.id).map(({ id, ...rest }) => rest);

      // Update existing grades
      for (const grade of toUpdate) {
        const { error } = await supabase
          .from('student_grades')
          .update({
            ca1_score: grade.ca1_score,
            ca2_score: grade.ca2_score,
            ca3_score: grade.ca3_score,
            theory_score: grade.theory_score,
            exam_score: grade.exam_score,
            total_score: grade.total_score,
            grade: grade.grade,
            remarks: grade.remarks,
          })
          .eq('id', grade.id);

        if (error) throw error;
      }

      // Insert new grades
      if (toInsert.length > 0) {
        const { error } = await supabase
          .from('student_grades')
          .insert(toInsert);

        if (error) throw error;
      }

      toast.success('Grades saved successfully');
      
      // Refresh to get IDs for newly inserted grades
      await fetchStudentsWithGrades(classId, subjectName, term, academicYear);
    } catch (error) {
      console.error('Error saving grades:', error);
      toast.error('Failed to save grades');
    } finally {
      setIsSaving(false);
    }
  }, [students, fetchStudentsWithGrades]);

  useEffect(() => {
    fetchGradingScale();
  }, [fetchGradingScale]);

  return {
    subjects,
    students,
    isLoading,
    isSaving,
    gradingScale,
    fetchSubjects,
    fetchStudentsWithGrades,
    updateStudentScore,
    saveGrades,
    calculateStudentGrade,
  };
}
