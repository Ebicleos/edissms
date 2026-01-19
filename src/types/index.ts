export type Gender = 'male' | 'female';

export type Term = 'first' | 'second' | 'third';

export type UserRole = 'admin' | 'teacher' | 'student' | 'superadmin';

export type PaymentStatus = 'paid' | 'partial' | 'unpaid';

export type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused';

export interface Class {
  id: string;
  name: string;
  level: string;
  teacherId?: string;
  studentCount: number;
}

export interface Student {
  id: string;
  admissionNumber: string;
  fullName: string;
  dateOfAdmission: string;
  admissionFee: number;
  academicYear: string;
  term: Term;
  gender: Gender;
  classId: string;
  className: string;
  dateOfBirth: string;
  age: number;
  guardianName: string;
  address: string;
  phoneContact: string;
  email?: string;
  photoUrl?: string;
}

export interface Teacher {
  id: string;
  fullName: string;
  email: string;
  phoneContact: string;
  subject: string;
  classIds: string[];
  dateOfEmployment: string;
  address: string;
  photoUrl?: string;
}

export interface FeePayment {
  id: string;
  studentId: string;
  studentName: string;
  classId: string;
  className: string;
  amountPayable: number;
  amountPaid: number;
  balance: number;
  installment: 1 | 2 | 3;
  status: PaymentStatus;
  term: Term;
  academicYear: string;
  paymentDate?: string;
}

export interface Attendance {
  id: string;
  studentId: string;
  classId: string;
  date: string;
  status: AttendanceStatus;
  remarks?: string;
}

export interface DashboardStats {
  totalStudents: number;
  totalTeachers: number;
  totalClasses: number;
  feesCollected: number;
  pendingFees: number;
  attendanceRate: number;
}

export const CLASS_LIST: string[] = [
  'Crèche',
  'Pre-Nursery',
  'Nursery 1',
  'Nursery 2',
  'Nursery 3',
  'Primary 1',
  'Primary 2',
  'Primary 3',
  'Primary 4',
  'Primary 5',
  'Primary 6',
  'JSS 1',
  'JSS 2',
  'JSS 3',
  'SSS 1',
  'SSS 2',
  'SSS 3',
];

export const CLASS_LIST_DETAILED: { id: string; name: string; level: string }[] = [
  { id: 'creche', name: 'Crèche', level: 'Early Years' },
  { id: 'prenursery', name: 'Pre-Nursery', level: 'Early Years' },
  { id: 'nursery1', name: 'Nursery 1', level: 'Nursery' },
  { id: 'nursery2', name: 'Nursery 2', level: 'Nursery' },
  { id: 'nursery3', name: 'Nursery 3', level: 'Nursery' },
  { id: 'primary1', name: 'Primary 1', level: 'Primary' },
  { id: 'primary2', name: 'Primary 2', level: 'Primary' },
  { id: 'primary3', name: 'Primary 3', level: 'Primary' },
  { id: 'primary4', name: 'Primary 4', level: 'Primary' },
  { id: 'primary5', name: 'Primary 5', level: 'Primary' },
  { id: 'primary6', name: 'Primary 6', level: 'Primary' },
  { id: 'jss1', name: 'JSS 1', level: 'Junior Secondary' },
  { id: 'jss2', name: 'JSS 2', level: 'Junior Secondary' },
  { id: 'jss3', name: 'JSS 3', level: 'Junior Secondary' },
  { id: 'sss1', name: 'SSS 1', level: 'Senior Secondary' },
  { id: 'sss2', name: 'SSS 2', level: 'Senior Secondary' },
  { id: 'sss3', name: 'SSS 3', level: 'Senior Secondary' },
];

// Generate academic years dynamically based on current date
const generateAcademicYears = (): string[] => {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth(); // 0-11
  // If we're in September or later, we're in the new academic year
  const startYear = currentMonth >= 8 ? currentYear : currentYear - 1;
  return [
    `${startYear - 1}/${startYear}`,
    `${startYear}/${startYear + 1}`,
    `${startYear + 1}/${startYear + 2}`,
  ];
};

export const ACADEMIC_YEARS = generateAcademicYears();

// Get current academic year
export const getCurrentAcademicYear = (): string => {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();
  const startYear = currentMonth >= 8 ? currentYear : currentYear - 1;
  return `${startYear}/${startYear + 1}`;
};
