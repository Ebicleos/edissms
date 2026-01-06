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
        // Fetch all counts in parallel
        const [
          studentsResult,
          teachersResult,
          classesResult,
          attendanceResult,
          feesResult,
          eventsResult,
        ] = await Promise.all([
          supabase.from('students').select('id', { count: 'exact', head: true }),
          supabase.from('teachers').select('id', { count: 'exact', head: true }),
          supabase.from('classes').select('id', { count: 'exact', head: true }),
          supabase.from('attendance').select('status'),
          supabase.from('fee_payments').select('amount_payable, amount_paid, balance'),
          supabase
            .from('events')
            .select('id, title, event_date, location')
            .eq('is_published', true)
            .gte('event_date', new Date().toISOString().split('T')[0])
            .order('event_date', { ascending: true })
            .limit(3),
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
