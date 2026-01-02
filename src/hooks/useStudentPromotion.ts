import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { getNextClass, canBePromoted } from '@/lib/grading';
import { useAuth } from '@/contexts/AuthContext';

export interface StudentPromotionData {
  studentId: string;
  studentName: string;
  admissionNumber: string;
  currentClass: string;
  nextClass: string | null;
  averageScore: number;
  isEligible: boolean;
  selected: boolean;
}

export function useStudentPromotion() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [students, setStudents] = useState<StudentPromotionData[]>([]);

  const fetchStudentsForPromotion = async (
    classId: string,
    academicYear: string
  ) => {
    setIsLoading(true);
    try {
      // Fetch student class mappings
      const { data: studentClasses, error } = await supabase
        .from('student_classes')
        .select('student_id, admission_number, class_id')
        .eq('class_id', classId);

      if (error) throw error;

      // Fetch profiles for these students
      const studentIds = studentClasses?.map(sc => sc.student_id) || [];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', studentIds);

      // Fetch report cards for averages
      const { data: reportCards } = await supabase
        .from('report_cards')
        .select('student_id, average_score')
        .eq('class_id', classId)
        .eq('academic_year', academicYear)
        .eq('term', 'third');

      const promotionData: StudentPromotionData[] = studentClasses?.map(sc => {
        const profile = profiles?.find(p => p.id === sc.student_id) || { id: sc.student_id, full_name: 'Unknown' };
        const reportCard = reportCards?.find(rc => rc.student_id === sc.student_id);
        const averageScore = reportCard?.average_score || 0;
        const nextClass = getNextClass(classId);
        const isEligible = canBePromoted(Number(averageScore));

        return {
          studentId: sc.student_id,
          studentName: profile.full_name,
          admissionNumber: sc.admission_number || '',
          currentClass: classId,
          nextClass,
          averageScore: Number(averageScore),
          isEligible,
          selected: isEligible,
        };
      }) || [];

      setStudents(promotionData);
      return promotionData;
    } catch (error) {
      console.error('Error fetching students:', error);
      toast.error('Failed to fetch students');
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  const promoteStudents = async (
    studentsToPromote: StudentPromotionData[],
    academicYear: string
  ) => {
    setIsLoading(true);
    try {
      const selected = studentsToPromote.filter(s => s.selected && s.nextClass);
      
      if (selected.length === 0) {
        toast.error('No students selected for promotion');
        return false;
      }

      // Update student_classes
      for (const student of selected) {
        // Update class
        await supabase
          .from('student_classes')
          .update({ class_id: student.nextClass })
          .eq('student_id', student.studentId);

        // Record promotion history
        await supabase.from('promotion_history').insert({
          student_id: student.studentId,
          from_class: student.currentClass,
          to_class: student.nextClass!,
          academic_year: academicYear,
          promoted_by: user?.id,
          average_score: student.averageScore,
          status: 'promoted',
        });

        // Update report card with promotion status
        await supabase
          .from('report_cards')
          .update({
            promotion_status: `PASSED AND PROMOTED TO ${student.nextClass?.toUpperCase()}`,
          })
          .eq('student_id', student.studentId)
          .eq('class_id', student.currentClass)
          .eq('academic_year', academicYear)
          .eq('term', 'third');
      }

      toast.success(`Successfully promoted ${selected.length} student(s)`);
      return true;
    } catch (error) {
      console.error('Error promoting students:', error);
      toast.error('Failed to promote students');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const toggleStudentSelection = (studentId: string) => {
    setStudents(prev =>
      prev.map(s =>
        s.studentId === studentId ? { ...s, selected: !s.selected } : s
      )
    );
  };

  const selectAll = (selected: boolean) => {
    setStudents(prev => prev.map(s => ({ ...s, selected })));
  };

  return {
    isLoading,
    students,
    fetchStudentsForPromotion,
    promoteStudents,
    toggleStudentSelection,
    selectAll,
  };
}
