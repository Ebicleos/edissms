import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface StudentRecord {
  id: string;
  full_name: string;
  admission_number: string;
  email: string | null;
  phone_contact: string | null;
  address: string | null;
  date_of_birth: string | null;
  gender: string;
  guardian_name: string | null;
  class_id: string;
  photo_url: string | null;
  school_id: string | null;
  user_id: string | null;
}

export function useStudentRecord() {
  const { user } = useAuth();
  const [studentRecord, setStudentRecord] = useState<StudentRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchStudentRecord();
    } else {
      setIsLoading(false);
    }
  }, [user]);

  const fetchStudentRecord = async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    try {
      // Get student record using user_id (linked during signup)
      const { data, error: fetchError } = await supabase
        .from('students')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (fetchError) {
        console.error('Error fetching student record:', fetchError);
        setError(fetchError.message);
        
        // Fallback: Try via student_classes admission_number
        const { data: studentClass } = await supabase
          .from('student_classes')
          .select('admission_number')
          .eq('student_id', user.id)
          .maybeSingle();

        if (studentClass?.admission_number) {
          const { data: studentByAdmission } = await supabase
            .from('students')
            .select('*')
            .eq('admission_number', studentClass.admission_number)
            .maybeSingle();
          
          if (studentByAdmission) {
            setStudentRecord(studentByAdmission as StudentRecord);
            setError(null);
          }
        }
      } else if (data) {
        setStudentRecord(data as StudentRecord);
      } else {
        // Fallback: Try via student_classes
        const { data: studentClass } = await supabase
          .from('student_classes')
          .select('admission_number')
          .eq('student_id', user.id)
          .maybeSingle();

        if (studentClass?.admission_number) {
          const { data: studentByAdmission } = await supabase
            .from('students')
            .select('*')
            .eq('admission_number', studentClass.admission_number)
            .maybeSingle();
          
          if (studentByAdmission) {
            setStudentRecord(studentByAdmission as StudentRecord);
          }
        }
      }
    } catch (err) {
      console.error('Error in useStudentRecord:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  };

  const refetch = () => {
    setIsLoading(true);
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
