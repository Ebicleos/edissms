import { z } from 'zod';

// ============= Student Admission Validation =============
export const studentAdmissionSchema = z.object({
  fullName: z.string()
    .trim()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be less than 100 characters'),
  dateOfBirth: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)'),
  gender: z.enum(['male', 'female'], { 
    errorMap: () => ({ message: 'Please select a valid gender' }) 
  }),
  classId: z.string()
    .min(1, 'Please select a class'),
  className: z.string().optional(),
  guardianName: z.string()
    .trim()
    .min(2, 'Guardian name must be at least 2 characters')
    .max(100, 'Guardian name must be less than 100 characters'),
  address: z.string()
    .trim()
    .min(5, 'Address must be at least 5 characters')
    .max(200, 'Address must be less than 200 characters'),
  phoneContact: z.string()
    .regex(/^[0-9+\-\s()]+$/, 'Invalid phone number format')
    .min(7, 'Phone number too short')
    .max(20, 'Phone number too long'),
  email: z.string()
    .trim()
    .email('Invalid email address')
    .max(255, 'Email must be less than 255 characters')
    .optional()
    .or(z.literal('')),
  admissionFee: z.number()
    .min(0, 'Admission fee cannot be negative')
    .max(10000000, 'Admission fee exceeds maximum'),
  amountPaid: z.number()
    .min(0, 'Amount paid cannot be negative')
    .max(100000000, 'Amount paid exceeds maximum')
    .optional()
    .default(0),
  academicYear: z.string()
    .min(1, 'Please select an academic year'),
  term: z.enum(['first', 'second', 'third'], {
    errorMap: () => ({ message: 'Please select a valid term' })
  }),
  photoUrl: z.string().optional().or(z.literal('')),
});

export type StudentAdmissionInput = z.infer<typeof studentAdmissionSchema>;

// ============= Subject Validation =============
export const subjectSchema = z.object({
  name: z.string()
    .trim()
    .min(2, 'Subject name must be at least 2 characters')
    .max(100, 'Subject name must be less than 100 characters'),
  code: z.string()
    .trim()
    .max(10, 'Subject code must be less than 10 characters')
    .optional()
    .or(z.literal('')),
  class_id: z.string().optional().or(z.literal('')),
});

export type SubjectInput = z.infer<typeof subjectSchema>;

// ============= Exam Question Validation =============
export const examQuestionSchema = z.object({
  question_text: z.string()
    .trim()
    .min(5, 'Question must be at least 5 characters')
    .max(1000, 'Question must be less than 1000 characters'),
  option_a: z.string()
    .trim()
    .min(1, 'Option A is required')
    .max(200, 'Option must be less than 200 characters'),
  option_b: z.string()
    .trim()
    .min(1, 'Option B is required')
    .max(200, 'Option must be less than 200 characters'),
  option_c: z.string()
    .trim()
    .max(200, 'Option must be less than 200 characters')
    .optional()
    .or(z.literal('')),
  option_d: z.string()
    .trim()
    .max(200, 'Option must be less than 200 characters')
    .optional()
    .or(z.literal('')),
  correct_option: z.enum(['A', 'B', 'C', 'D'], {
    errorMap: () => ({ message: 'Please select a correct answer' })
  }),
  marks: z.number()
    .int('Marks must be a whole number')
    .min(1, 'Marks must be at least 1')
    .max(10, 'Marks cannot exceed 10'),
});

export type ExamQuestionInput = z.infer<typeof examQuestionSchema>;

export const examDetailsSchema = z.object({
  title: z.string()
    .trim()
    .min(3, 'Title must be at least 3 characters')
    .max(200, 'Title must be less than 200 characters'),
  subject: z.string()
    .trim()
    .min(2, 'Subject must be at least 2 characters')
    .max(100, 'Subject must be less than 100 characters'),
  class_id: z.string()
    .min(1, 'Please select a class'),
  duration_minutes: z.number()
    .int('Duration must be a whole number')
    .min(5, 'Duration must be at least 5 minutes')
    .max(180, 'Duration cannot exceed 180 minutes'),
});

export type ExamDetailsInput = z.infer<typeof examDetailsSchema>;

// ============= Fee Payment Validation =============
export const feePaymentSchema = z.object({
  student_id: z.string()
    .uuid('Invalid student ID'),
  class_id: z.string()
    .min(1, 'Class is required'),
  amount_payable: z.number()
    .min(0, 'Amount cannot be negative')
    .max(100000000, 'Amount exceeds maximum'),
  term: z.string()
    .min(1, 'Term is required'),
  academic_year: z.string()
    .regex(/^\d{4}\/\d{4}$/, 'Invalid academic year format'),
});

export type FeePaymentInput = z.infer<typeof feePaymentSchema>;

export const paymentAmountSchema = z.object({
  amount: z.number()
    .min(1, 'Payment amount must be at least 1')
    .max(100000000, 'Payment amount exceeds maximum'),
});

// ============= Message Validation =============
export const messageSchema = z.object({
  content: z.string()
    .trim()
    .min(1, 'Message content is required')
    .max(1000, 'Message must be less than 1000 characters'),
  subject: z.string()
    .trim()
    .max(200, 'Subject must be less than 200 characters')
    .optional(),
  recipients_type: z.string()
    .min(1, 'Please select recipients'),
  type: z.enum(['sms', 'email', 'both'], {
    errorMap: () => ({ message: 'Please select a message type' })
  }),
  class_id: z.string().optional(),
});

export type MessageInput = z.infer<typeof messageSchema>;

// ============= Grade Entry Validation =============
export const gradeEntrySchema = z.object({
  ca1_score: z.number()
    .min(0, 'Score cannot be negative')
    .max(100, 'Score cannot exceed 100'),
  ca2_score: z.number()
    .min(0, 'Score cannot be negative')
    .max(100, 'Score cannot exceed 100'),
  ca3_score: z.number()
    .min(0, 'Score cannot be negative')
    .max(100, 'Score cannot exceed 100'),
  exam_score: z.number()
    .min(0, 'Score cannot be negative')
    .max(100, 'Score cannot exceed 100'),
});

export type GradeEntryInput = z.infer<typeof gradeEntrySchema>;

// ============= Utility function for validation =============
export function validateInput<T>(schema: z.ZodSchema<T>, data: unknown): { success: true; data: T } | { success: false; error: string } {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  // Return the first error message
  const firstError = result.error.errors[0];
  return { 
    success: false, 
    error: firstError?.message || 'Validation failed' 
  };
}

// Validate an array of items
export function validateArray<T>(schema: z.ZodSchema<T>, items: unknown[]): { success: true; data: T[] } | { success: false; error: string; index: number } {
  for (let i = 0; i < items.length; i++) {
    const result = schema.safeParse(items[i]);
    if (!result.success) {
      const firstError = result.error.errors[0];
      return {
        success: false,
        error: firstError?.message || 'Validation failed',
        index: i,
      };
    }
  }
  return { 
    success: true, 
    data: items as T[] 
  };
}
