import { MainLayout } from '@/components/layout/MainLayout';
import { WelcomeCard } from '@/components/dashboard/WelcomeCard';
import { EmojiStatCard } from '@/components/dashboard/EmojiStatCard';
import { ScheduleCarousel } from '@/components/dashboard/ScheduleCarousel';
import { QuickActions } from '@/components/dashboard/QuickActions';
import { RecentStudents } from '@/components/dashboard/RecentStudents';
import { FeesSummary } from '@/components/dashboard/FeesSummary';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const stats = useDashboardStats();
  const { profile, role } = useAuth();
  const navigate = useNavigate();

  // Transform upcoming events for schedule carousel
  const scheduleItems = stats.upcomingEvents.map(event => ({
    id: event.id,
    title: event.title,
    time: event.event_date,
    location: event.location,
    type: 'event' as const,
  }));

  return (
    <MainLayout>
      <div className="space-y-5 sm:space-y-6 md:space-y-8 animate-fade-in">
        {/* Welcome Card */}
        <WelcomeCard
          name={profile?.full_name || 'Admin'}
          role={role === 'admin' ? 'Administrator' : role || 'User'}
          avatarUrl={profile?.photo_url}
          variant="primary"
        />

        {/* Stats Grid - 2x2 Emoji Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <EmojiStatCard
            emoji="👋"
            value={stats.isLoading ? '...' : stats.totalStudents.toLocaleString()}
            label="Students"
            variant="blue"
            onClick={() => navigate('/students')}
          />
          <EmojiStatCard
            emoji="👨‍🏫"
            value={stats.isLoading ? '...' : stats.totalTeachers.toLocaleString()}
            label="Teachers"
            variant="purple"
            onClick={() => navigate('/teachers')}
          />
          <EmojiStatCard
            emoji="🏫"
            value={stats.isLoading ? '...' : stats.totalClasses.toLocaleString()}
            label="Classes"
            variant="green"
            onClick={() => navigate('/classes')}
          />
          <EmojiStatCard
            emoji="✅"
            value={stats.isLoading ? '...' : `${stats.attendanceRate}%`}
            label="Attendance"
            variant="orange"
            onClick={() => navigate('/attendance')}
          />
        </div>

        {/* Upcoming Schedule */}
        <ScheduleCarousel
          items={scheduleItems}
          title="Upcoming Events"
          onViewAll={() => navigate('/events')}
          emptyMessage="No upcoming events"
        />

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
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
