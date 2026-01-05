import { MainLayout } from '@/components/layout/MainLayout';
import { StatCard } from '@/components/dashboard/StatCard';
import { QuickActions } from '@/components/dashboard/QuickActions';
import { RecentStudents } from '@/components/dashboard/RecentStudents';
import { FeesSummary } from '@/components/dashboard/FeesSummary';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import { Users, GraduationCap, BookOpen, UserCheck, Loader2 } from 'lucide-react';

export default function Dashboard() {
  const stats = useDashboardStats();

  return (
    <MainLayout title="Dashboard" subtitle="Welcome back! Here's your school overview.">
      <div className="space-y-4 md:space-y-6 animate-fade-in">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          <StatCard
            title="Total Students"
            value={stats.isLoading ? '...' : stats.totalStudents.toLocaleString()}
            subtitle="Active enrollments"
            icon={Users}
            variant="primary"
          />
          <StatCard
            title="Total Teachers"
            value={stats.isLoading ? '...' : stats.totalTeachers.toLocaleString()}
            subtitle="Full-time staff"
            icon={GraduationCap}
            variant="secondary"
          />
          <StatCard
            title="Total Classes"
            value={stats.isLoading ? '...' : stats.totalClasses.toLocaleString()}
            subtitle="Across all levels"
            icon={BookOpen}
            variant="accent"
          />
          <StatCard
            title="Attendance Rate"
            value={stats.isLoading ? '...' : `${stats.attendanceRate}%`}
            subtitle="This month"
            icon={UserCheck}
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - 2/3 width */}
          <div className="lg:col-span-2 space-y-6">
            <QuickActions />
            <RecentStudents />
          </div>

          {/* Right Column - 1/3 width */}
          <div className="space-y-6">
            <FeesSummary />
            
            {/* Upcoming Events */}
            <div className="bg-card rounded-xl border border-border/50 p-6 shadow-sm">
              <h3 className="font-semibold text-foreground mb-4">Upcoming Events</h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex flex-col items-center justify-center">
                    <span className="text-xs font-bold text-primary">15</span>
                    <span className="text-[10px] text-primary">JAN</span>
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Mid-Term Exams</p>
                    <p className="text-sm text-muted-foreground">All classes</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-lg bg-secondary/10 flex flex-col items-center justify-center">
                    <span className="text-xs font-bold text-secondary">22</span>
                    <span className="text-[10px] text-secondary">JAN</span>
                  </div>
                  <div>
                    <p className="font-medium text-foreground">PTA Meeting</p>
                    <p className="text-sm text-muted-foreground">School Hall</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-lg bg-accent/10 flex flex-col items-center justify-center">
                    <span className="text-xs font-bold text-accent">28</span>
                    <span className="text-[10px] text-accent">JAN</span>
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Sports Day</p>
                    <p className="text-sm text-muted-foreground">School Field</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
