import { useAuth } from '@/contexts/AuthContext';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Users, ClipboardList, Calendar, BookOpen, Plus } from 'lucide-react';

export default function TeacherDashboard() {
  const { profile, userClass } = useAuth();
  const navigate = useNavigate();

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
      <div className="space-y-8">
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-blue-600 to-cyan-600 rounded-2xl p-8 text-white">
          <h1 className="text-3xl font-bold mb-2">
            Welcome, {profile?.full_name || 'Teacher'}! 📚
          </h1>
          <p className="text-white/80 text-lg">
            {userClass ? `Assigned Class: ${userClass}` : 'Manage your classes and students'}
          </p>
        </div>

        {/* Quick Actions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Card
                key={action.path}
                className="group cursor-pointer hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
                onClick={() => navigate(action.path)}
              >
                <CardHeader className="pb-3">
                  <div
                    className={`w-12 h-12 rounded-xl bg-gradient-to-br ${action.color} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}
                  >
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <CardTitle className="text-lg">{action.title}</CardTitle>
                  <CardDescription>{action.description}</CardDescription>
                </CardHeader>
              </Card>
            );
          })}
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">My Classes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-primary">1</p>
              <p className="text-muted-foreground">Assigned class</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Students</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-blue-600">0</p>
              <p className="text-muted-foreground">In your classes</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Active Exams</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-green-600">0</p>
              <p className="text-muted-foreground">Published exams</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}
