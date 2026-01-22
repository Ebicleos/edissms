import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { MainLayout } from '@/components/layout/MainLayout';
import { WelcomeCard } from '@/components/dashboard/WelcomeCard';
import { EmojiStatCard } from '@/components/dashboard/EmojiStatCard';
import { ActionCard } from '@/components/dashboard/ActionCard';
import { useNavigate } from 'react-router-dom';
import { Users, ClipboardList, Calendar, Plus, BookOpen, BarChart3 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

export default function TeacherDashboard() {
  const { profile, userClass, user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    classCount: 0,
    studentCount: 0,
    examCount: 0,
    isLoading: true,
  });

  useEffect(() => {
    async function fetchTeacherStats() {
      if (!user) return;

      try {
        // Fetch teacher's classes
        const { data: classesData } = await supabase
          .from('teacher_classes')
          .select('class_id')
          .eq('teacher_id', user.id);

        const classIds = classesData?.map((c) => c.class_id) || [];

        // Fetch students count in those classes
        let studentCount = 0;
        if (classIds.length > 0) {
          const { count } = await supabase
            .from('students')
            .select('id', { count: 'exact', head: true })
            .in('class_id', classIds);
          studentCount = count || 0;
        }

        // Fetch exams created by this teacher
        const { count: examCount } = await supabase
          .from('exams')
          .select('id', { count: 'exact', head: true })
          .eq('teacher_id', user.id)
          .eq('is_published', true);

        setStats({
          classCount: classIds.length,
          studentCount,
          examCount: examCount || 0,
          isLoading: false,
        });
      } catch (error) {
        console.error('Error fetching teacher stats:', error);
        setStats((prev) => ({ ...prev, isLoading: false }));
      }
    }

    fetchTeacherStats();
  }, [user]);

  const quickActions = [
    { title: 'My Students', description: 'View students in your classes', icon: Users, path: '/teacher/students', variant: 'blue' as const },
    { title: 'Create Exam', description: 'Create new exams or assignments', icon: Plus, path: '/teacher/exams/create', variant: 'green' as const },
    { title: 'Manage Exams', description: 'View and edit your exams', icon: ClipboardList, path: '/teacher/exams', variant: 'purple' as const },
    { title: 'Attendance', description: 'Mark student attendance', icon: Calendar, path: '/attendance', variant: 'orange' as const },
    { title: 'Grade Entry', description: 'Enter student grades', icon: BookOpen, path: '/teacher/grade-entry', variant: 'pink' as const },
    { title: 'Results', description: 'View exam results', icon: BarChart3, path: '/teacher/exams', variant: 'cyan' as const },
  ];

  return (
    <MainLayout>
      <div className="space-y-4 md:space-y-6">
        {/* Welcome Card */}
        <WelcomeCard
          name={profile?.full_name || 'Teacher'}
          role="Teacher"
          subtitle={userClass ? `Assigned Class: ${userClass}` : 'Manage your classes'}
          avatarUrl={profile?.photo_url}
          variant="green"
          emoji="📚"
        />

        {/* Stats Grid - Emoji Cards */}
        <div className="grid grid-cols-3 gap-3 md:gap-4">
          <EmojiStatCard
            emoji="🏫"
            value={stats.isLoading ? '...' : stats.classCount}
            label="My Classes"
            variant="blue"
            onClick={() => navigate('/teacher/students')}
          />
          <EmojiStatCard
            emoji="👨‍🎓"
            value={stats.isLoading ? '...' : stats.studentCount}
            label="Students"
            variant="purple"
          />
          <EmojiStatCard
            emoji="📝"
            value={stats.isLoading ? '...' : stats.examCount}
            label="Exams"
            variant="green"
            onClick={() => navigate('/teacher/exams')}
          />
        </div>

        {/* Quick Actions Grid */}
        <div className="content-card">
          <h3 className="section-heading mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {quickActions.map((action) => (
              <ActionCard
                key={action.path}
                title={action.title}
                description={action.description}
                icon={action.icon}
                path={action.path}
                variant={action.variant}
                compact
              />
            ))}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
