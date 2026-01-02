import { useAuth } from '@/contexts/AuthContext';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { BookOpen, ClipboardList, Calendar, IdCard, GraduationCap } from 'lucide-react';

export default function StudentDashboard() {
  const { profile, userClass } = useAuth();
  const navigate = useNavigate();

  const quickActions = [
    {
      title: 'CBT Portal',
      description: 'Take exams and assignments',
      icon: ClipboardList,
      path: '/cbt',
      color: 'from-blue-500 to-cyan-500',
    },
    {
      title: 'My Results',
      description: 'View your exam results',
      icon: GraduationCap,
      path: '/student/results',
      color: 'from-green-500 to-emerald-500',
    },
    {
      title: 'Online Classes',
      description: 'Join live lessons',
      icon: BookOpen,
      path: '/online-classes',
      color: 'from-purple-500 to-pink-500',
    },
    {
      title: 'ID Card',
      description: 'View and print your ID',
      icon: IdCard,
      path: '/student/id-card',
      color: 'from-orange-500 to-red-500',
    },
  ];

  return (
    <MainLayout>
      <div className="space-y-8">
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-primary to-primary/80 rounded-2xl p-8 text-primary-foreground">
          <h1 className="text-3xl font-bold mb-2">
            Welcome back, {profile?.full_name || 'Student'}! 👋
          </h1>
          <p className="text-primary-foreground/80 text-lg">
            {userClass ? `Class: ${userClass}` : 'Ready to learn something new today?'}
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

        {/* Upcoming Exams Preview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Upcoming Exams
            </CardTitle>
            <CardDescription>Your scheduled exams and assignments</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-muted-foreground">
              <ClipboardList className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No upcoming exams scheduled</p>
              <Button variant="outline" className="mt-4" onClick={() => navigate('/cbt')}>
                Go to CBT Portal
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
