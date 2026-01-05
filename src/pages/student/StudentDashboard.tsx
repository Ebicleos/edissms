import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { BookOpen, ClipboardList, Calendar, IdCard, GraduationCap, CreditCard, Megaphone, CalendarDays, Bell, Loader2 } from 'lucide-react';
import { format } from 'date-fns';

interface Exam {
  id: string;
  title: string;
  subject: string;
  start_time: string | null;
  duration_minutes: number;
}

interface Announcement {
  id: string;
  title: string;
  content: string;
  created_at: string;
  type: string;
}

interface Event {
  id: string;
  title: string;
  event_date: string;
  start_time: string | null;
  location: string | null;
}

interface Assignment {
  id: string;
  title: string;
  subject: string;
  due_date: string | null;
}

export default function StudentDashboard() {
  const { profile, userClass } = useAuth();
  const navigate = useNavigate();
  const [upcomingExams, setUpcomingExams] = useState<Exam[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, [userClass]);

  const fetchDashboardData = async () => {
    if (!userClass) {
      setIsLoading(false);
      return;
    }

    try {
      // Fetch upcoming exams for student's class
      const { data: examsData } = await supabase
        .from('exams')
        .select('id, title, subject, start_time, duration_minutes')
        .eq('class_id', userClass)
        .eq('is_published', true)
        .gte('start_time', new Date().toISOString())
        .order('start_time', { ascending: true })
        .limit(5);

      // Fetch announcements for students
      const { data: announcementsData } = await supabase
        .from('announcements')
        .select('id, title, content, created_at, type')
        .eq('is_published', true)
        .or('target_audience.eq.all,target_audience.eq.students')
        .order('created_at', { ascending: false })
        .limit(3);

      // Fetch upcoming events
      const { data: eventsData } = await supabase
        .from('events')
        .select('id, title, event_date, start_time, location')
        .eq('is_published', true)
        .gte('event_date', new Date().toISOString().split('T')[0])
        .order('event_date', { ascending: true })
        .limit(3);

      // Fetch assignments for student's class
      const { data: assignmentsData } = await supabase
        .from('assignments')
        .select('id, title, subject, due_date')
        .eq('class_id', userClass)
        .eq('is_published', true)
        .gte('due_date', new Date().toISOString())
        .order('due_date', { ascending: true })
        .limit(3);

      setUpcomingExams(examsData || []);
      setAnnouncements(announcementsData || []);
      setEvents(eventsData || []);
      setAssignments(assignmentsData || []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

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
      title: 'School Fees',
      description: 'Check fees & pay online',
      icon: CreditCard,
      path: '/student/fees',
      color: 'from-yellow-500 to-orange-500',
    },
    {
      title: 'ID Card',
      description: 'View and print your ID',
      icon: IdCard,
      path: '/student/id-card',
      color: 'from-red-500 to-pink-500',
    },
    {
      title: 'Announcements',
      description: 'School news & updates',
      icon: Megaphone,
      path: '/student/announcements',
      color: 'from-indigo-500 to-purple-500',
    },
    {
      title: 'Events',
      description: 'Upcoming school events',
      icon: CalendarDays,
      path: '/student/events',
      color: 'from-teal-500 to-cyan-500',
    },
    {
      title: 'Attendance',
      description: 'View your attendance',
      icon: Calendar,
      path: '/student/attendance',
      color: 'from-amber-500 to-yellow-500',
    },
  ];

  return (
    <MainLayout>
      <div className="space-y-4 md:space-y-8">
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-primary to-primary/80 rounded-xl md:rounded-2xl p-4 md:p-8 text-primary-foreground">
          <h1 className="text-xl md:text-3xl font-bold mb-1 md:mb-2">
            Welcome back, {profile?.full_name?.split(' ')[0] || 'Student'}! 👋
          </h1>
          <p className="text-primary-foreground/80 text-sm md:text-lg">
            {userClass ? `Class: ${userClass}` : 'Ready to learn something new today?'}
          </p>
        </div>

        {/* Quick Actions Grid */}
        <div className="grid grid-cols-4 md:grid-cols-4 lg:grid-cols-8 gap-2 md:gap-4">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Card
                key={action.path}
                className="group cursor-pointer hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
                onClick={() => navigate(action.path)}
              >
                <CardHeader className="p-2 md:pb-2 md:pt-4 md:px-3">
                  <div
                    className={`w-8 h-8 md:w-10 md:h-10 rounded-lg bg-gradient-to-br ${action.color} flex items-center justify-center mb-1 md:mb-2 group-hover:scale-110 transition-transform mx-auto md:mx-0`}
                  >
                    <Icon className="h-4 w-4 md:h-5 md:w-5 text-white" />
                  </div>
                  <CardTitle className="text-[10px] md:text-sm text-center md:text-left">{action.title}</CardTitle>
                </CardHeader>
              </Card>
            );
          })}
        </div>

        {isLoading ? (
          <div className="flex justify-center py-8 md:py-12">
            <Loader2 className="h-6 w-6 md:h-8 md:w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
            {/* Upcoming Exams */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ClipboardList className="h-5 w-5" />
                  Upcoming Exams
                </CardTitle>
                <CardDescription>Your scheduled exams and assessments</CardDescription>
              </CardHeader>
              <CardContent>
                {upcomingExams.length === 0 ? (
                  <div className="text-center py-6 text-muted-foreground">
                    <ClipboardList className="h-10 w-10 mx-auto mb-3 opacity-50" />
                    <p>No upcoming exams scheduled</p>
                    <Button variant="outline" className="mt-3" onClick={() => navigate('/cbt')}>
                      Go to CBT Portal
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {upcomingExams.map((exam) => (
                      <div key={exam.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                        <div>
                          <p className="font-medium">{exam.title}</p>
                          <p className="text-sm text-muted-foreground">{exam.subject}</p>
                        </div>
                        <div className="text-right">
                          {exam.start_time && (
                            <p className="text-sm font-medium">
                              {format(new Date(exam.start_time), 'MMM d, h:mm a')}
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground">{exam.duration_minutes} mins</p>
                        </div>
                      </div>
                    ))}
                    <Button variant="outline" className="w-full" onClick={() => navigate('/cbt')}>
                      View All Exams
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Announcements */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Megaphone className="h-5 w-5" />
                  Latest Announcements
                </CardTitle>
                <CardDescription>Important school updates</CardDescription>
              </CardHeader>
              <CardContent>
                {announcements.length === 0 ? (
                  <div className="text-center py-6 text-muted-foreground">
                    <Megaphone className="h-10 w-10 mx-auto mb-3 opacity-50" />
                    <p>No announcements at the moment</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {announcements.map((announcement) => (
                      <div key={announcement.id} className="p-3 rounded-lg bg-muted/50">
                        <div className="flex items-center justify-between mb-1">
                          <p className="font-medium">{announcement.title}</p>
                          <Badge variant="outline" className="text-xs">{announcement.type}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2">{announcement.content}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {format(new Date(announcement.created_at), 'MMM d, yyyy')}
                        </p>
                      </div>
                    ))}
                    <Button variant="outline" className="w-full" onClick={() => navigate('/student/announcements')}>
                      View All Announcements
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Upcoming Events */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CalendarDays className="h-5 w-5" />
                  Upcoming Events
                </CardTitle>
                <CardDescription>School activities and events</CardDescription>
              </CardHeader>
              <CardContent>
                {events.length === 0 ? (
                  <div className="text-center py-6 text-muted-foreground">
                    <CalendarDays className="h-10 w-10 mx-auto mb-3 opacity-50" />
                    <p>No upcoming events</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {events.map((event) => (
                      <div key={event.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                        <div>
                          <p className="font-medium">{event.title}</p>
                          {event.location && (
                            <p className="text-sm text-muted-foreground">{event.location}</p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">
                            {format(new Date(event.event_date), 'MMM d, yyyy')}
                          </p>
                          {event.start_time && (
                            <p className="text-xs text-muted-foreground">{event.start_time}</p>
                          )}
                        </div>
                      </div>
                    ))}
                    <Button variant="outline" className="w-full" onClick={() => navigate('/student/events')}>
                      View All Events
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Pending Assignments */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  Pending Assignments
                </CardTitle>
                <CardDescription>Assignments due soon</CardDescription>
              </CardHeader>
              <CardContent>
                {assignments.length === 0 ? (
                  <div className="text-center py-6 text-muted-foreground">
                    <BookOpen className="h-10 w-10 mx-auto mb-3 opacity-50" />
                    <p>No pending assignments</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {assignments.map((assignment) => (
                      <div key={assignment.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                        <div>
                          <p className="font-medium">{assignment.title}</p>
                          <p className="text-sm text-muted-foreground">{assignment.subject}</p>
                        </div>
                        {assignment.due_date && (
                          <Badge variant="secondary">
                            Due {format(new Date(assignment.due_date), 'MMM d')}
                          </Badge>
                        )}
                      </div>
                    ))}
                    <Button variant="outline" className="w-full" onClick={() => navigate('/student/assignments')}>
                      View All Assignments
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
