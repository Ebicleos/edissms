import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { Users, ClipboardList, Calendar, Plus } from 'lucide-react';
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
    {
      title: 'My Students',
      description: 'View students in your classes',
      icon: Users,
      path: '/teacher/students',
      color: 'from-blue-500 to-cyan-500',
    },
    {
      title: 'Create Exam',
      description: 'Create new exams or assignments',
      icon: Plus,
      path: '/teacher/exams/create',
      color: 'from-green-500 to-emerald-500',
    },
    {
      title: 'Manage Exams',
      description: 'View and edit your exams',
      icon: ClipboardList,
      path: '/teacher/exams',
      color: 'from-purple-500 to-pink-500',
    },
    {
      title: 'Attendance',
      description: 'Mark student attendance',
      icon: Calendar,
      path: '/attendance',
      color: 'from-orange-500 to-red-500',
    },
  ];

  return (
    <MainLayout>
      <div className="space-y-4 md:space-y-8">
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-blue-600 to-cyan-600 rounded-xl md:rounded-2xl p-4 md:p-8 text-white">
          <h1 className="text-xl md:text-3xl font-bold mb-1 md:mb-2">
            Welcome, {profile?.full_name?.split(' ')[0] || 'Teacher'}! 📚
          </h1>
          <p className="text-white/80 text-sm md:text-lg">
            {userClass ? `Assigned Class: ${userClass}` : 'Manage your classes and students'}
          </p>
        </div>

        {/* Quick Actions Grid */}
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Card
                key={action.path}
                className="group cursor-pointer hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
                onClick={() => navigate(action.path)}
              >
                <CardHeader className="p-3 md:pb-3">
                  <div
                    className={`w-10 h-10 md:w-12 md:h-12 rounded-xl bg-gradient-to-br ${action.color} flex items-center justify-center mb-2 md:mb-3 group-hover:scale-110 transition-transform`}
                  >
                    <Icon className="h-5 w-5 md:h-6 md:w-6 text-white" />
                  </div>
                  <CardTitle className="text-sm md:text-lg">{action.title}</CardTitle>
                  <CardDescription className="text-xs md:text-sm hidden md:block">{action.description}</CardDescription>
                </CardHeader>
              </Card>
            );
          })}
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-3 gap-3 md:gap-6">
          <Card>
            <CardHeader className="p-3 md:p-6 pb-2 md:pb-3">
              <CardTitle className="text-sm md:text-lg">My Classes</CardTitle>
            </CardHeader>
            <CardContent className="p-3 md:p-6 pt-0">
              <p className="text-2xl md:text-3xl font-bold text-primary">
                {stats.isLoading ? '...' : stats.classCount}
              </p>
              <p className="text-xs md:text-sm text-muted-foreground">Assigned</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="p-3 md:p-6 pb-2 md:pb-3">
              <CardTitle className="text-sm md:text-lg">Students</CardTitle>
            </CardHeader>
            <CardContent className="p-3 md:p-6 pt-0">
              <p className="text-2xl md:text-3xl font-bold text-blue-600">
                {stats.isLoading ? '...' : stats.studentCount}
              </p>
              <p className="text-xs md:text-sm text-muted-foreground">In classes</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="p-3 md:p-6 pb-2 md:pb-3">
              <CardTitle className="text-sm md:text-lg">Exams</CardTitle>
            </CardHeader>
            <CardContent className="p-3 md:p-6 pt-0">
              <p className="text-2xl md:text-3xl font-bold text-green-600">
                {stats.isLoading ? '...' : stats.examCount}
              </p>
              <p className="text-xs md:text-sm text-muted-foreground">Published</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}
