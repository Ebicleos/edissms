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
      <div className="space-y-4 sm:space-y-5 md:space-y-6 animate-fade-in">
        {/* Stats Grid - 2 columns on mobile, 4 on desktop */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 md:gap-4">
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5 md:gap-6">
          {/* Left Column - Full width on mobile, 2/3 on desktop */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-5 md:space-y-6">
            <RecentStudents />
          </div>

          {/* Right Column - 1/3 width on desktop */}
          <div className="space-y-4 sm:space-y-5 md:space-y-6">
            <FeesSummary />
            
            {/* Upcoming Events - Real Data */}
            <div className="bg-card rounded-xl border border-border/50 p-4 sm:p-6 shadow-sm">
              <h3 className="font-semibold text-foreground mb-3 sm:mb-4 flex items-center gap-2 text-sm sm:text-base">
                <Calendar className="h-4 w-4" />
                Upcoming Events
              </h3>
              {stats.isLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-start gap-3 animate-pulse">
                      <div className="h-10 w-10 rounded-lg bg-muted flex-shrink-0" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-muted rounded w-3/4" />
                        <div className="h-3 bg-muted rounded w-1/2" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : stats.upcomingEvents.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground">
                  <Calendar className="h-8 w-8 sm:h-10 sm:w-10 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No upcoming events</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {stats.upcomingEvents.map((event, index) => {
                    const eventDate = parseISO(event.event_date);
                    const colorVariant = colorVariants[index % colorVariants.length];
                    return (
                      <div key={event.id} className="flex items-start gap-3">
                        <div className={cn(
                          "h-10 w-10 rounded-lg flex flex-col items-center justify-center flex-shrink-0",
                          colorVariant === 'primary' && "bg-primary/10",
                          colorVariant === 'secondary' && "bg-secondary/10",
                          colorVariant === 'accent' && "bg-accent/10"
                        )}>
                          <span className={cn(
                            "text-xs font-bold",
                            colorVariant === 'primary' && "text-primary",
                            colorVariant === 'secondary' && "text-secondary",
                            colorVariant === 'accent' && "text-accent"
                          )}>
                            {format(eventDate, 'd')}
                          </span>
                          <span className={cn(
                            "text-[10px]",
                            colorVariant === 'primary' && "text-primary",
                            colorVariant === 'secondary' && "text-secondary",
                            colorVariant === 'accent' && "text-accent"
                          )}>
                            {format(eventDate, 'MMM').toUpperCase()}
                          </span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-foreground text-sm sm:text-base truncate">{event.title}</p>
                          <p className="text-xs sm:text-sm text-muted-foreground truncate">
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
