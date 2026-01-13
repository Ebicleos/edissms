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
  amountPaid: number;
  academicYear: string;
  term: Term;
}

export interface PaginationState {
  currentPage: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
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

// Generate next admission number with format: XXXX20262001
// Format: SchoolInitials + Year + Term + SequenceNumber
export const generateAdmissionNumber = async (): Promise<string> => {
  // Fetch school settings for initials
  const { data: schoolData } = await supabase
    .from('school_settings')
    .select('school_name, term, academic_year')
    .limit(1)
    .maybeSingle();
  
  // Get school initials (first letters of each word, max 4)
  let initials = 'EDMS'; // Default initials
  if (schoolData?.school_name) {
    const words = schoolData.school_name.split(' ').filter((w: string) => w.length > 0);
    if (words.length === 1) {
      initials = words[0].substring(0, 4).toUpperCase();
    } else {
      initials = words.map((w: string) => w[0]).join('').toUpperCase().substring(0, 4);
    }
  }
  
  // Get current year from academic year (e.g., "2024/2025" -> "2024")
  let year = new Date().getFullYear().toString();
  if (schoolData?.academic_year) {
    year = schoolData.academic_year.split('/')[0] || year;
  }
  
  // Get term number (1, 2, or 3)
  let termNum = '1';
  if (schoolData?.term) {
    const term = schoolData.term.toLowerCase();
    if (term.includes('first') || term.includes('1')) termNum = '1';
    else if (term.includes('second') || term.includes('2')) termNum = '2';
    else if (term.includes('third') || term.includes('3')) termNum = '3';
  }
  
  // Get the last admission number to determine sequence
  const prefix = `${initials}${year}${termNum}`;
  const { data: existingStudents } = await supabase
    .from('students')
    .select('admission_number')
    .ilike('admission_number', `${prefix}%`)
    .order('admission_number', { ascending: false })
    .limit(1);
  
  let sequence = 1;
  if (existingStudents && existingStudents.length > 0) {
    const lastNum = existingStudents[0].admission_number;
    // Extract sequence number (last 3 digits)
    const lastSequence = parseInt(lastNum.slice(-3), 10);
    if (!isNaN(lastSequence)) {
      sequence = lastSequence + 1;
    }
  }
  
  // Format: ESFS20262001 (initials + year + term + 3-digit sequence)
  return `${prefix}${String(sequence).padStart(3, '0')}`;
};

export function useStudents() {
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [schoolId, setSchoolId] = useState<string | null>(null);
  
  // Pagination state
  const [pagination, setPagination] = useState<PaginationState>({
    currentPage: 1,
    pageSize: 10,
    totalCount: 0,
    totalPages: 0,
  });
  
  // Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [classFilter, setClassFilter] = useState('');

  // Get current user's school_id
  useEffect(() => {
    const getSchoolId = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('school_id')
          .eq('id', user.id)
          .single();
        setSchoolId(profile?.school_id || null);
      }
    };
    getSchoolId();
  }, []);

  const fetchStudents = useCallback(async (
    page: number = pagination.currentPage,
    pageSize: number = pagination.pageSize,
    search: string = searchTerm,
    classId: string = classFilter
  ) => {
    if (!schoolId) return;
    
    setIsLoading(true);
    
    // Use the RPC function for paginated results
    const { data, error } = await supabase
      .rpc('get_paginated_students', {
        p_school_id: schoolId,
        p_page_number: page,
        p_page_size: pageSize,
        p_search_term: search || null,
        p_class_filter: classId === 'all' ? null : (classId || null),
      });

    if (error) {
      console.error('Error fetching students:', error);
      setStudents([]);
      setPagination(prev => ({ ...prev, totalCount: 0, totalPages: 0 }));
    } else {
      const totalCount = data?.[0]?.total_count || 0;
      const totalPages = Math.ceil(Number(totalCount) / pageSize);
      
      const mapped: Student[] = (data || []).map((s: any) => ({
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
      setPagination(prev => ({
        ...prev,
        currentPage: page,
        pageSize,
        totalCount: Number(totalCount),
        totalPages,
      }));
    }
    setIsLoading(false);
  }, [schoolId, pagination.currentPage, pagination.pageSize, searchTerm, classFilter]);

  useEffect(() => {
    if (schoolId !== null) {
      fetchStudents();
    }
  }, [schoolId]); // Only trigger on schoolId change, not on every fetchStudents change

  // Page change handlers
  const setPage = useCallback((page: number) => {
    if (page >= 1 && page <= pagination.totalPages) {
      fetchStudents(page, pagination.pageSize, searchTerm, classFilter);
    }
  }, [fetchStudents, pagination.totalPages, pagination.pageSize, searchTerm, classFilter]);

  const setPageSize = useCallback((size: number) => {
    fetchStudents(1, size, searchTerm, classFilter);
  }, [fetchStudents, searchTerm, classFilter]);

  const updateFilters = useCallback((search: string, classId: string) => {
    setSearchTerm(search);
    setClassFilter(classId);
    fetchStudents(1, pagination.pageSize, search, classId);
  }, [fetchStudents, pagination.pageSize]);

  const addStudent = useCallback(async (data: AdmissionFormData & { photoUrl?: string }): Promise<{ student: Student | null; error?: string }> => {
    if (!schoolId) {
      const errorMsg = 'No school_id found. Please complete school setup first.';
      console.error(errorMsg);
      return { student: null, error: errorMsg };
    }
    
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
        photo_url: data.photoUrl || null,
        school_id: schoolId,
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding student:', error);
      return { student: null, error: error.message };
    }
    
    // Also create student_classes entry for class-based queries
    await supabase
      .from('student_classes')
      .insert({
        student_id: inserted.id,
        class_id: data.classId,
        admission_number: admissionNumber,
      });

    // Auto-create fee payment record
    const amountPaid = data.amountPaid || 0;
    
    // Get fee structure for this class/term/year if it exists
    const { data: feeStructure } = await supabase
      .from('fee_structures')
      .select('total_amount')
      .eq('class_id', data.classId)
      .eq('term', data.term === 'first' ? 'First Term' : data.term === 'second' ? 'Second Term' : 'Third Term')
      .eq('academic_year', data.academicYear)
      .maybeSingle();

    const amountPayable = feeStructure?.total_amount || data.admissionFee;
    const balance = Number(amountPayable) - amountPaid;
    const status = balance <= 0 ? 'paid' : amountPaid > 0 ? 'partial' : 'unpaid';

    // Create fee payment record
    const { data: feePayment } = await supabase
      .from('fee_payments')
      .insert({
        student_id: inserted.id,
        class_id: data.classId,
        term: data.term === 'first' ? 'First Term' : data.term === 'second' ? 'Second Term' : 'Third Term',
        academic_year: data.academicYear,
        amount_payable: amountPayable,
        amount_paid: amountPaid,
        balance: balance,
        status: status,
        last_payment_date: amountPaid > 0 ? new Date().toISOString() : null,
        installment: '1st Installment',
        school_id: schoolId,
      })
      .select('id')
      .single();

    // If amount was paid, create a transaction record
    if (amountPaid > 0 && feePayment) {
      await supabase
        .from('payment_transactions')
        .insert({
          fee_payment_id: feePayment.id,
          amount: amountPaid,
          payment_method: 'cash',
          status: 'completed',
        });
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
      photoUrl: inserted.photo_url || undefined,
    };

    // Refresh the list to get updated pagination
    fetchStudents(pagination.currentPage, pagination.pageSize, searchTerm, classFilter);
    return { student: newStudent };
  }, [schoolId, fetchStudents, pagination.currentPage, pagination.pageSize, searchTerm, classFilter]);

  // Bulk add students
  const bulkAddStudents = useCallback(async (
    studentsData: Array<AdmissionFormData & { photoUrl?: string }>
  ): Promise<{ successCount: number; errors: Array<{ index: number; error: string }> }> => {
    if (!schoolId) {
      return { successCount: 0, errors: [{ index: 0, error: 'No school_id found' }] };
    }

    const errors: Array<{ index: number; error: string }> = [];
    let successCount = 0;

    for (let i = 0; i < studentsData.length; i++) {
      const data = studentsData[i];
      const result = await addStudent(data);
      if (result.error) {
        errors.push({ index: i, error: result.error });
      } else {
        successCount++;
      }
    }

    // Refresh the list after bulk import
    if (successCount > 0) {
      fetchStudents(1, pagination.pageSize, searchTerm, classFilter);
    }

    return { successCount, errors };
  }, [schoolId, addStudent, fetchStudents, pagination.pageSize, searchTerm, classFilter]);

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

    // Refresh to update pagination counts
    fetchStudents(pagination.currentPage, pagination.pageSize, searchTerm, classFilter);
  }, [fetchStudents, pagination.currentPage, pagination.pageSize, searchTerm, classFilter]);

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
    schoolId,
    addStudent,
    bulkAddStudents,
    updateStudent,
    deleteStudent,
    getStudentById,
    getStudentsByClass,
    totalStudents: pagination.totalCount,
    refetch: () => fetchStudents(pagination.currentPage, pagination.pageSize, searchTerm, classFilter),
    // Pagination
    pagination,
    setPage,
    setPageSize,
    updateFilters,
  };
}
