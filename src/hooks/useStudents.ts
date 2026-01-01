import { useState, useCallback } from 'react';
import { Student, Term, Gender } from '@/types';

// Generate a unique admission number
const generateAdmissionNumber = (count: number): string => {
  const year = new Date().getFullYear();
  const number = (count + 1).toString().padStart(4, '0');
  return `ADM-${year}-${number}`;
};

// Calculate age from date of birth
const calculateAge = (dateOfBirth: string): number => {
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
};

// Mock initial data
const initialStudents: Student[] = [
  {
    id: '1',
    admissionNumber: 'ADM-2025-0001',
    fullName: 'Chioma Adeyemi',
    dateOfAdmission: '2025-01-15',
    admissionFee: 25000,
    academicYear: '2024/2025',
    term: 'second',
    gender: 'female',
    classId: 'primary5',
    className: 'Primary 5',
    dateOfBirth: '2014-03-20',
    age: 10,
    guardianName: 'Mrs. Adeyemi',
    address: '15 Victoria Island, Lagos',
    phoneContact: '+234 801 234 5678',
  },
  {
    id: '2',
    admissionNumber: 'ADM-2025-0002',
    fullName: 'Emeka Okonkwo',
    dateOfAdmission: '2025-01-14',
    admissionFee: 30000,
    academicYear: '2024/2025',
    term: 'second',
    gender: 'male',
    classId: 'jss2',
    className: 'JSS 2',
    dateOfBirth: '2011-07-12',
    age: 13,
    guardianName: 'Mr. Okonkwo',
    address: '42 Ikeja GRA, Lagos',
    phoneContact: '+234 802 345 6789',
  },
  {
    id: '3',
    admissionNumber: 'ADM-2025-0003',
    fullName: 'Fatima Ibrahim',
    dateOfAdmission: '2025-01-13',
    admissionFee: 15000,
    academicYear: '2024/2025',
    term: 'second',
    gender: 'female',
    classId: 'nursery2',
    className: 'Nursery 2',
    dateOfBirth: '2020-11-05',
    age: 4,
    guardianName: 'Mr. Ibrahim',
    address: '8 Wuse Zone 5, Abuja',
    phoneContact: '+234 803 456 7890',
  },
  {
    id: '4',
    admissionNumber: 'ADM-2025-0004',
    fullName: 'David Okafor',
    dateOfAdmission: '2025-01-12',
    admissionFee: 35000,
    academicYear: '2024/2025',
    term: 'second',
    gender: 'male',
    classId: 'sss1',
    className: 'SSS 1',
    dateOfBirth: '2008-09-18',
    age: 16,
    guardianName: 'Mrs. Okafor',
    address: '23 GRA Phase 2, Port Harcourt',
    phoneContact: '+234 804 567 8901',
  },
  {
    id: '5',
    admissionNumber: 'ADM-2025-0005',
    fullName: 'Grace Mensah',
    dateOfAdmission: '2025-01-11',
    admissionFee: 20000,
    academicYear: '2024/2025',
    term: 'second',
    gender: 'female',
    classId: 'primary3',
    className: 'Primary 3',
    dateOfBirth: '2016-02-28',
    age: 8,
    guardianName: 'Mr. Mensah',
    address: '55 Lekki Phase 1, Lagos',
    phoneContact: '+234 805 678 9012',
  },
];

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

export function useStudents() {
  const [students, setStudents] = useState<Student[]>(initialStudents);
  const [isLoading, setIsLoading] = useState(false);

  const addStudent = useCallback((data: AdmissionFormData): Student => {
    const admissionNumber = generateAdmissionNumber(students.length);
    const age = calculateAge(data.dateOfBirth);
    
    const newStudent: Student = {
      id: crypto.randomUUID(),
      admissionNumber,
      fullName: data.fullName,
      dateOfAdmission: new Date().toISOString().split('T')[0],
      admissionFee: data.admissionFee,
      academicYear: data.academicYear,
      term: data.term,
      gender: data.gender,
      classId: data.classId,
      className: data.className,
      dateOfBirth: data.dateOfBirth,
      age,
      guardianName: data.guardianName,
      address: data.address,
      phoneContact: data.phoneContact,
      email: data.email,
    };

    setStudents((prev) => [newStudent, ...prev]);
    return newStudent;
  }, [students.length]);

  const updateStudent = useCallback((id: string, data: Partial<Student>) => {
    setStudents((prev) =>
      prev.map((student) =>
        student.id === id ? { ...student, ...data } : student
      )
    );
  }, []);

  const deleteStudent = useCallback((id: string) => {
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
  };
}
