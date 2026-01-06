import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface UpcomingEvent {
  id: string;
  title: string;
  event_date: string;
  location: string | null;
}

interface DashboardStats {
  totalStudents: number;
  totalTeachers: number;
  totalClasses: number;
  attendanceRate: number;
  totalFeesExpected: number;
  totalFeesCollected: number;
  totalFeesPending: number;
  upcomingEvents: UpcomingEvent[];
  isLoading: boolean;
}

export function useDashboardStats() {
  const [stats, setStats] = useState<DashboardStats>({
    totalStudents: 0,
    totalTeachers: 0,
    totalClasses: 0,
    attendanceRate: 0,
    totalFeesExpected: 0,
    totalFeesCollected: 0,
    totalFeesPending: 0,
    upcomingEvents: [],
    isLoading: true,
  });

  useEffect(() => {
    async function fetchStats() {
      try {
        // Get current user's school_id first
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setStats(prev => ({ ...prev, isLoading: false }));
          return;
        }

        const { data: profile } = await supabase
          .from('profiles')
          .select('school_id')
          .eq('id', user.id)
          .single();

        const schoolId = profile?.school_id;

        // Build queries with school_id filter if available
        let studentsQuery = supabase.from('students').select('id', { count: 'exact', head: true });
        let teachersQuery = supabase.from('teachers').select('id', { count: 'exact', head: true });
        let classesQuery = supabase.from('classes').select('id', { count: 'exact', head: true });
        let attendanceQuery = supabase.from('attendance').select('status');
        let feesQuery = supabase.from('fee_payments').select('amount_payable, amount_paid, balance');
        let eventsQuery = supabase
          .from('events')
          .select('id, title, event_date, location')
          .eq('is_published', true)
          .gte('event_date', new Date().toISOString().split('T')[0])
          .order('event_date', { ascending: true })
          .limit(3);

        if (schoolId) {
          studentsQuery = studentsQuery.eq('school_id', schoolId);
          teachersQuery = teachersQuery.eq('school_id', schoolId);
          classesQuery = classesQuery.eq('school_id', schoolId);
          feesQuery = feesQuery.eq('school_id', schoolId);
          eventsQuery = eventsQuery.eq('school_id', schoolId);
        }

        // Fetch all counts in parallel
        const [
          studentsResult,
          teachersResult,
          classesResult,
          attendanceResult,
          feesResult,
          eventsResult,
        ] = await Promise.all([
          studentsQuery,
          teachersQuery,
          classesQuery,
          attendanceQuery,
          feesQuery,
          eventsQuery,
        ]);

        // Calculate attendance rate
        let attendanceRate = 0;
        if (attendanceResult.data && attendanceResult.data.length > 0) {
          const presentCount = attendanceResult.data.filter(
            (a) => a.status === 'present'
          ).length;
          attendanceRate = (presentCount / attendanceResult.data.length) * 100;
        }

        // Calculate fees
        let totalFeesExpected = 0;
        let totalFeesCollected = 0;
        if (feesResult.data) {
          feesResult.data.forEach((fee) => {
            totalFeesExpected += Number(fee.amount_payable) || 0;
            totalFeesCollected += Number(fee.amount_paid) || 0;
          });
        }

        setStats({
          totalStudents: studentsResult.count || 0,
          totalTeachers: teachersResult.count || 0,
          totalClasses: classesResult.count || 0,
          attendanceRate: Math.round(attendanceRate * 10) / 10,
          totalFeesExpected,
          totalFeesCollected,
          totalFeesPending: totalFeesExpected - totalFeesCollected,
          upcomingEvents: eventsResult.data || [],
          isLoading: false,
        });
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        setStats((prev) => ({ ...prev, isLoading: false }));
      }
    }

    fetchStats();
  }, []);

  return stats;
}
