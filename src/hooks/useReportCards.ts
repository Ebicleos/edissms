import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { calculateGrade, calculateClassPosition, calculateSubjectPosition, GradeScale, DEFAULT_GRADING_SCALE } from '@/lib/grading';

export interface ReportCardData {
  studentId: string;
  studentName: string;
  admissionNumber: string;
  classId: string;
  className: string;
  gender: string;
  term: string;
  academicYear: string;
  grades: SubjectGrade[];
  totalMarks: number;
  averageScore: number;
  classPosition: number;
  totalStudents: number;
  attendancePresent: number;
  attendanceTotal: number;
  attitude?: string;
  interest?: string;
  conduct?: string;
  teacherRemarks?: string;
  principalRemarks?: string;
  promotionStatus?: string;
  closingDate?: string;
  nextTermBegins?: string;
  termSummary?: TermSummary[];
}

export interface SubjectGrade {
  subjectName: string;
  caScore: number;
  examScore: number;
  totalScore: number;
  grade: string;
  subjectPosition: number;
  remarks: string;
}

export interface TermSummary {
  term: string;
  totalScore: number;
  average: number;
  position: number;
}

export function useReportCards() {
  const [isLoading, setIsLoading] = useState(false);
  const [reportCards, setReportCards] = useState<ReportCardData[]>([]);

  const fetchSchoolSettings = async () => {
    const { data } = await supabase
      .from('school_settings')
      .select('*')
      .limit(1)
      .maybeSingle();
    return data;
  };

  const generateReportCards = async (
    classId: string,
    term: string,
    academicYear: string
  ) => {
    setIsLoading(true);
    try {
      const schoolSettings = await fetchSchoolSettings();
      const gradingScale: GradeScale[] = Array.isArray(schoolSettings?.grading_scale) 
        ? (schoolSettings.grading_scale as unknown as GradeScale[]) 
        : DEFAULT_GRADING_SCALE;

      // Fetch students in the class - try student_classes first, then fallback to students table
      let { data: studentClasses, error: studentsError } = await supabase
        .from('student_classes')
        .select('student_id, admission_number, class_id')
        .eq('class_id', classId);

      // If no students found in student_classes, try the students table directly
      if (!studentClasses?.length) {
        const { data: studentsData, error: studentsDirectError } = await supabase
          .from('students')
          .select('id, admission_number, class_id')
          .eq('class_id', classId);

        if (studentsDirectError) throw studentsDirectError;
        
        // Map to same structure as student_classes
        studentClasses = studentsData?.map(s => ({
          student_id: s.id,
          admission_number: s.admission_number,
          class_id: s.class_id
        })) || [];
      }

      if (studentsError) throw studentsError;
      if (!studentClasses?.length) {
        toast.error('No students found in this class');
        return [];
      }

      // Fetch student details from students table
      const studentIds = studentClasses.map(sc => sc.student_id);
      const { data: studentDetails } = await supabase
        .from('students')
        .select('id, full_name, gender, photo_url')
        .in('id', studentIds);

      // Also try profiles for fallback names
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, photo_url')
        .in('id', studentIds);

      // Combine the data - prefer students table data
      const students = studentClasses.map(sc => {
        const studentData = studentDetails?.find(s => s.id === sc.student_id);
        const profile = profiles?.find(p => p.id === sc.student_id);
        return {
          ...sc,
          full_name: studentData?.full_name || profile?.full_name || 'Unknown',
          gender: studentData?.gender || 'N/A',
          photo_url: studentData?.photo_url || profile?.photo_url || null,
        };
      });

      // Fetch grades for all students in this class
      const { data: allGrades, error: gradesError } = await supabase
        .from('student_grades')
        .select('*')
        .eq('class_id', classId)
        .eq('term', term)
        .eq('academic_year', academicYear);

      if (gradesError) throw gradesError;

      // Fetch attendance data
      const { data: attendanceData } = await supabase
        .from('attendance')
        .select('student_id, status')
        .eq('class_id', classId);

      // Fetch existing report cards for remarks
      const { data: existingReportCards } = await supabase
        .from('report_cards')
        .select('*')
        .eq('class_id', classId)
        .eq('term', term)
        .eq('academic_year', academicYear);

      // Calculate averages for all students
      const studentAverages: { studentId: string; average: number }[] = [];
      
      students.forEach(student => {
        const studentGrades = allGrades?.filter(g => g.student_id === student.student_id) || [];
        if (studentGrades.length > 0) {
          const totalScore = studentGrades.reduce((sum, g) => sum + (Number(g.total_score) || 0), 0);
          const average = totalScore / studentGrades.length;
          studentAverages.push({ studentId: student.student_id, average });
        } else {
          studentAverages.push({ studentId: student.student_id, average: 0 });
        }
      });

      // Calculate subject scores for positions
      const subjectScores: Record<string, { studentId: string; score: number }[]> = {};
      allGrades?.forEach(grade => {
        if (!subjectScores[grade.subject_name]) {
          subjectScores[grade.subject_name] = [];
        }
        subjectScores[grade.subject_name].push({
          studentId: grade.student_id,
          score: Number(grade.total_score) || 0,
        });
      });

      // Generate report cards
      const generatedCards: ReportCardData[] = students.map(student => {
        const studentGrades = allGrades?.filter(g => g.student_id === student.student_id) || [];
        const existingCard = existingReportCards?.find(rc => rc.student_id === student.student_id);
        
        // Calculate totals
        const totalCa = studentGrades.reduce((sum, g) => 
          sum + (Number(g.ca1_score) || 0) + (Number(g.ca2_score) || 0) + (Number(g.ca3_score) || 0), 0);
        const totalExam = studentGrades.reduce((sum, g) => sum + (Number(g.exam_score) || 0), 0);
        const totalMarks = totalCa + totalExam;
        const averageScore = studentGrades.length > 0 ? totalMarks / studentGrades.length : 0;

        // Calculate class position
        const allAvgs = studentAverages.map(s => s.average);
        const classPosition = calculateClassPosition(
          studentAverages.find(s => s.studentId === student.student_id)?.average || 0,
          allAvgs
        );

        // Map grades with subject positions
        const grades: SubjectGrade[] = studentGrades.map(grade => {
          const caScore = (Number(grade.ca1_score) || 0) + (Number(grade.ca2_score) || 0) + (Number(grade.ca3_score) || 0);
          const examScore = Number(grade.exam_score) || 0;
          const totalScore = Number(grade.total_score) || caScore + examScore;
          const { grade: letterGrade, remarks } = calculateGrade(totalScore, gradingScale);
          
          const subjectAllScores = subjectScores[grade.subject_name]?.map(s => s.score) || [];
          const subjectPosition = calculateSubjectPosition(totalScore, subjectAllScores);

          return {
            subjectName: grade.subject_name,
            caScore,
            examScore,
            totalScore,
            grade: letterGrade,
            subjectPosition,
            remarks,
          };
        });

        // Calculate attendance
        const studentAttendance = attendanceData?.filter(a => a.student_id === student.student_id) || [];
        const attendancePresent = studentAttendance.filter(a => a.status === 'present' || a.status === 'late').length;
        const attendanceTotal = studentAttendance.length;

        return {
          studentId: student.student_id,
          studentName: student.full_name,
          admissionNumber: student.admission_number || '',
          classId: student.class_id,
          className: student.class_id,
          gender: student.gender || 'N/A',
          term,
          academicYear,
          grades,
          totalMarks,
          averageScore: Math.round(averageScore * 100) / 100,
          classPosition,
          totalStudents: students.length,
          attendancePresent,
          attendanceTotal,
          attitude: existingCard?.attitude || '',
          interest: existingCard?.interest || '',
          conduct: existingCard?.conduct || '',
          teacherRemarks: existingCard?.teacher_remarks || '',
          principalRemarks: existingCard?.principal_remarks || '',
          promotionStatus: existingCard?.promotion_status || '',
          closingDate: schoolSettings?.closing_date || '',
          nextTermBegins: schoolSettings?.next_term_begins || '',
        };
      });

      setReportCards(generatedCards);
      return generatedCards;
    } catch (error) {
      console.error('Error generating report cards:', error);
      toast.error('Failed to generate report cards');
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  const saveReportCard = async (data: ReportCardData) => {
    try {
      const { data: existing } = await supabase
        .from('report_cards')
        .select('id')
        .eq('student_id', data.studentId)
        .eq('class_id', data.classId)
        .eq('term', data.term)
        .eq('academic_year', data.academicYear)
        .maybeSingle();

      const reportCardData = {
        student_id: data.studentId,
        class_id: data.classId,
        term: data.term,
        academic_year: data.academicYear,
        average_score: data.averageScore,
        position: data.classPosition,
        total_students: data.totalStudents,
        total_marks_obtained: data.totalMarks,
        total_marks_obtainable: data.grades.length * 100,
        attitude: data.attitude,
        interest: data.interest,
        conduct: data.conduct,
        teacher_remarks: data.teacherRemarks,
        principal_remarks: data.principalRemarks,
        promotion_status: data.promotionStatus,
        attendance_present: data.attendancePresent,
        attendance_total: data.attendanceTotal,
      };

      if (existing) {
        await supabase
          .from('report_cards')
          .update(reportCardData)
          .eq('id', existing.id);
      } else {
        await supabase.from('report_cards').insert(reportCardData);
      }

      toast.success('Report card saved successfully');
    } catch (error) {
      console.error('Error saving report card:', error);
      toast.error('Failed to save report card');
    }
  };

  return {
    isLoading,
    reportCards,
    generateReportCards,
    saveReportCard,
  };
}
