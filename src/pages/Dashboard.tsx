import { MainLayout } from '@/components/layout/MainLayout';
import { StatCard } from '@/components/dashboard/StatCard';
import { QuickActions } from '@/components/dashboard/QuickActions';
import { RecentStudents } from '@/components/dashboard/RecentStudents';
import { FeesSummary } from '@/components/dashboard/FeesSummary';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import { Users, GraduationCap, BookOpen, UserCheck, Calendar } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';

export default function Dashboard() {
  const stats = useDashboardStats();

  const colorVariants = ['primary', 'secondary', 'accent'] as const;

  return (
    <MainLayout title="Dashboard" subtitle="Welcome back! Here's your school overview.">
      <div className="space-y-5 sm:space-y-6 md:space-y-8 animate-fade-in">
        {/* Stats Grid - 2 columns on mobile, 4 on desktop */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-5">
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

        {/* Quick Actions */}
        <QuickActions />

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-6 md:gap-8">
          {/* Left Column - Full width on mobile, 2/3 on desktop */}
          <div className="lg:col-span-2 space-y-5 sm:space-y-6">
            <RecentStudents />
          </div>

          {/* Right Column - 1/3 width on desktop */}
          <div className="space-y-5 sm:space-y-6">
            <FeesSummary />
            
            {/* Upcoming Events - Real Data */}
            <div className="content-card">
              <h3 className="section-heading mb-4 sm:mb-5 flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-info" />
                <Calendar className="h-4 w-4 text-info" />
                Upcoming Events
              </h3>
              {stats.isLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="list-item animate-pulse">
                      <div className="h-11 w-11 rounded-xl bg-muted flex-shrink-0" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-muted rounded-lg w-3/4" />
                        <div className="h-3 bg-muted rounded-lg w-1/2" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : stats.upcomingEvents.length === 0 ? (
                <div className="empty-state py-8">
                  <div className="h-14 w-14 rounded-2xl bg-muted/50 flex items-center justify-center mb-3">
                    <Calendar className="h-7 w-7 text-muted-foreground/40" />
                  </div>
                  <p className="text-sm font-medium text-muted-foreground">No upcoming events</p>
                  <p className="text-xs text-muted-foreground/70 mt-1">Events will appear here when scheduled</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {stats.upcomingEvents.map((event, index) => {
                    const eventDate = parseISO(event.event_date);
                    const colorVariant = colorVariants[index % colorVariants.length];
                    return (
                      <div key={event.id} className="list-item group cursor-pointer">
                        <div className={cn(
                          "h-11 w-11 rounded-xl flex flex-col items-center justify-center flex-shrink-0 transition-transform duration-200 group-hover:scale-105",
                          colorVariant === 'primary' && "bg-primary/12",
                          colorVariant === 'secondary' && "bg-secondary/12",
                          colorVariant === 'accent' && "bg-accent/12"
                        )}>
                          <span className={cn(
                            "text-sm font-bold leading-none",
                            colorVariant === 'primary' && "text-primary",
                            colorVariant === 'secondary' && "text-secondary",
                            colorVariant === 'accent' && "text-accent"
                          )}>
                            {format(eventDate, 'd')}
                          </span>
                          <span className={cn(
                            "text-[9px] font-semibold uppercase tracking-wider mt-0.5",
                            colorVariant === 'primary' && "text-primary/80",
                            colorVariant === 'secondary' && "text-secondary/80",
                            colorVariant === 'accent' && "text-accent/80"
                          )}>
                            {format(eventDate, 'MMM')}
                          </span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-foreground text-sm sm:text-base truncate">{event.title}</p>
                          <p className="text-xs sm:text-sm text-muted-foreground truncate font-medium">
                            {event.location || 'Location TBD'}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
