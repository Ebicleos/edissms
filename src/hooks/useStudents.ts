import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Student, Term, Gender, CLASS_LIST_DETAILED } from '@/types';

export interface AdmissionFormData {
  fullName: string;
  dateOfBirth: string;
  gender: Gender;
  classId: string;
  className: string;
  guardianName: string;
  address: string;
  phoneContact: string;
  email?: string;
  admissionFee: number;
  academicYear: string;
  term: Term;
}

// Helper to get class name from id
const getClassName = (classId: string): string => {
  const cls = CLASS_LIST_DETAILED.find(c => c.id === classId);
  return cls?.name || classId;
};

// Calculate age from date of birth
const calculateAge = (dateOfBirth: string | null): number => {
  if (!dateOfBirth) return 0;
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
};

// Generate next admission number
const generateAdmissionNumber = async (): Promise<string> => {
  const { data } = await supabase
    .from('students')
    .select('admission_number')
    .order('admission_number', { ascending: false })
    .limit(1);
  
  if (data && data.length > 0) {
    const lastNum = parseInt(data[0].admission_number.replace(/\D/g, ''), 10);
    return String(lastNum + 1).padStart(4, '0');
  }
  return '0001';
};

export function useStudents() {
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchStudents = useCallback(async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching students:', error);
      setStudents([]);
    } else {
      const mapped: Student[] = (data || []).map((s) => ({
        id: s.id,
        admissionNumber: s.admission_number,
        fullName: s.full_name,
        dateOfAdmission: s.date_of_admission || '',
        admissionFee: Number(s.admission_fee) || 0,
        academicYear: s.academic_year || '2024/2025',
        term: (s.term as Term) || 'first',
        gender: s.gender as Gender,
        classId: s.class_id,
        className: getClassName(s.class_id),
        dateOfBirth: s.date_of_birth || '',
        age: calculateAge(s.date_of_birth),
        guardianName: s.guardian_name || '',
        address: s.address || '',
        phoneContact: s.phone_contact || '',
        email: s.email || undefined,
        photoUrl: s.photo_url || undefined,
      }));
      setStudents(mapped);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  const addStudent = useCallback(async (data: AdmissionFormData): Promise<Student | null> => {
    const admissionNumber = await generateAdmissionNumber();
    
    const { data: inserted, error } = await supabase
      .from('students')
      .insert({
        admission_number: admissionNumber,
        full_name: data.fullName,
        gender: data.gender,
        class_id: data.classId,
        date_of_birth: data.dateOfBirth || null,
        admission_fee: data.admissionFee,
        academic_year: data.academicYear,
        term: data.term,
        guardian_name: data.guardianName,
        address: data.address,
        phone_contact: data.phoneContact,
        email: data.email || null,
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding student:', error);
      return null;
    }

    const newStudent: Student = {
      id: inserted.id,
      admissionNumber: inserted.admission_number,
      fullName: inserted.full_name,
      dateOfAdmission: inserted.date_of_admission || '',
      admissionFee: Number(inserted.admission_fee) || 0,
      academicYear: inserted.academic_year || '2024/2025',
      term: (inserted.term as Term) || 'first',
      gender: inserted.gender as Gender,
      classId: inserted.class_id,
      className: data.className,
      dateOfBirth: inserted.date_of_birth || '',
      age: calculateAge(inserted.date_of_birth),
      guardianName: inserted.guardian_name || '',
      address: inserted.address || '',
      phoneContact: inserted.phone_contact || '',
      email: inserted.email || undefined,
    };

    setStudents((prev) => [newStudent, ...prev]);
    return newStudent;
  }, []);

  const updateStudent = useCallback(async (id: string, data: Partial<Student>) => {
    const updateData: Record<string, unknown> = {};
    if (data.fullName !== undefined) updateData.full_name = data.fullName;
    if (data.gender !== undefined) updateData.gender = data.gender;
    if (data.classId !== undefined) updateData.class_id = data.classId;
    if (data.dateOfBirth !== undefined) updateData.date_of_birth = data.dateOfBirth || null;
    if (data.guardianName !== undefined) updateData.guardian_name = data.guardianName;
    if (data.address !== undefined) updateData.address = data.address;
    if (data.phoneContact !== undefined) updateData.phone_contact = data.phoneContact;
    if (data.email !== undefined) updateData.email = data.email || null;
    if (data.photoUrl !== undefined) updateData.photo_url = data.photoUrl || null;

    const { error } = await supabase
      .from('students')
      .update(updateData)
      .eq('id', id);

    if (error) {
      console.error('Error updating student:', error);
      return;
    }

    setStudents((prev) =>
      prev.map((student) =>
        student.id === id ? { ...student, ...data, className: data.classId ? getClassName(data.classId) : student.className } : student
      )
    );
  }, []);

  const deleteStudent = useCallback(async (id: string) => {
    const { error } = await supabase
      .from('students')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting student:', error);
      return;
    }

    setStudents((prev) => prev.filter((student) => student.id !== id));
  }, []);

  const getStudentById = useCallback(
    (id: string) => students.find((s) => s.id === id),
    [students]
  );

  const getStudentsByClass = useCallback(
    (classId: string) => students.filter((s) => s.classId === classId),
    [students]
  );

  return {
    students,
    isLoading,
    addStudent,
    updateStudent,
    deleteStudent,
    getStudentById,
    getStudentsByClass,
    totalStudents: students.length,
    refetch: fetchStudents,
  };
}
