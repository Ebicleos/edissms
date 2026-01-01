import { MainLayout } from '@/components/layout/MainLayout';
import { StatCard } from '@/components/dashboard/StatCard';
import { QuickActions } from '@/components/dashboard/QuickActions';
import { RecentStudents } from '@/components/dashboard/RecentStudents';
import { FeesSummary } from '@/components/dashboard/FeesSummary';
import { Users, GraduationCap, BookOpen, Wallet, UserCheck, TrendingUp } from 'lucide-react';

export default function Dashboard() {
  return (
    <MainLayout title="Dashboard" subtitle="Welcome back! Here's your school overview.">
      <div className="space-y-6 animate-fade-in">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Students"
            value="1,247"
            subtitle="Active enrollments"
            icon={Users}
            variant="primary"
            trend={{ value: 12, isPositive: true }}
          />
          <StatCard
            title="Total Teachers"
            value="48"
            subtitle="Full-time staff"
            icon={GraduationCap}
            variant="secondary"
          />
          <StatCard
            title="Total Classes"
            value="17"
            subtitle="Across all levels"
            icon={BookOpen}
            variant="accent"
          />
          <StatCard
            title="Attendance Rate"
            value="94.2%"
            subtitle="This month"
            icon={UserCheck}
            trend={{ value: 2.5, isPositive: true }}
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
