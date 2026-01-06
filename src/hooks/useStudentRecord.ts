import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface StudentRecord {
  id: string;
  full_name: string;
  admission_number: string;
  class_id: string;
  date_of_birth: string | null;
  gender: string;
  guardian_name: string | null;
  phone_contact: string | null;
  email: string | null;
  address: string | null;
  photo_url: string | null;
  school_id: string | null;
  user_id: string | null;
}

export function useStudentRecord() {
  const { user } = useAuth();
  const [studentRecord, setStudentRecord] = useState<StudentRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStudentRecord = useCallback(async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Primary method: Query students table using user_id column
      const { data: studentData, error: studentError } = await supabase
        .from('students')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (studentData) {
        setStudentRecord({
          id: studentData.id,
          full_name: studentData.full_name,
          admission_number: studentData.admission_number,
          class_id: studentData.class_id,
          date_of_birth: studentData.date_of_birth,
          gender: studentData.gender,
          guardian_name: studentData.guardian_name,
          phone_contact: studentData.phone_contact,
          email: studentData.email,
          address: studentData.address,
          photo_url: studentData.photo_url,
          school_id: studentData.school_id,
          user_id: studentData.user_id,
        });
        setIsLoading(false);
        return;
      }

      // Fallback: Check student_classes table for admission_number link
      const { data: classLink } = await supabase
        .from('student_classes')
        .select('admission_number, class_id')
        .eq('student_id', user.id)
        .maybeSingle();

      if (classLink?.admission_number) {
        // Fetch student by admission number
        const { data: linkedStudent } = await supabase
          .from('students')
          .select('*')
          .eq('admission_number', classLink.admission_number)
          .maybeSingle();

        if (linkedStudent) {
          // Update the student record with user_id for future queries
          await supabase
            .from('students')
            .update({ user_id: user.id })
            .eq('id', linkedStudent.id);

          setStudentRecord({
            id: linkedStudent.id,
            full_name: linkedStudent.full_name,
            admission_number: linkedStudent.admission_number,
            class_id: linkedStudent.class_id,
            date_of_birth: linkedStudent.date_of_birth,
            gender: linkedStudent.gender,
            guardian_name: linkedStudent.guardian_name,
            phone_contact: linkedStudent.phone_contact,
            email: linkedStudent.email,
            address: linkedStudent.address,
            photo_url: linkedStudent.photo_url,
            school_id: linkedStudent.school_id,
            user_id: user.id,
          });
          setIsLoading(false);
          return;
        }
      }

      // If no student record found
      setError('No student record found for your account');
    } catch (err: any) {
      console.error('Error fetching student record:', err);
      setError(err.message || 'Failed to load student record');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchStudentRecord();
  }, [fetchStudentRecord]);

  const refetch = () => {
    fetchStudentRecord();
  };

  return {
    studentRecord,
    studentId: studentRecord?.id || null,
    isLoading,
    error,
    refetch,
  };
}
