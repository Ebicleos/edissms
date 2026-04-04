import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { MainLayout } from '@/components/layout/MainLayout';
import { WelcomeCard } from '@/components/dashboard/WelcomeCard';
import { ActionCard } from '@/components/dashboard/ActionCard';
import { ScheduleCarousel } from '@/components/dashboard/ScheduleCarousel';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { BookOpen, ClipboardList, Calendar, IdCard, GraduationCap, CreditCard, Megaphone, CalendarDays, Loader2, User, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { useStudentRecord } from '@/hooks/useStudentRecord';
import { CLASS_LIST_DETAILED } from '@/types';
import { formatClassName } from '@/lib/formatClassName';

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

// Helper function to get class display name
const getClassDisplayName = (classId: string | null): string => {
  if (!classId) return 'Not Assigned';
  
  // First check CLASS_LIST_DETAILED
  const cls = CLASS_LIST_DETAILED.find(c => c.id === classId);
  if (cls?.name) return cls.name;
  
  // Fallback: use shared utility to format class_id
  return formatClassName(classId);
};

export default function StudentDashboard() {
  const { profile, userClass } = useAuth();
  const { studentRecord, isLoading: studentLoading } = useStudentRecord();
  const navigate = useNavigate();
  const [upcomingExams, setUpcomingExams] = useState<Exam[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [className, setClassName] = useState<string>('');

  // Get the effective class ID from student record or userClass
  const effectiveClassId = studentRecord?.class_id || userClass;

  useEffect(() => {
    // Fetch class name from database or use CLASS_LIST_DETAILED
    const fetchClassName = async () => {
      if (effectiveClassId) {
        // Try to get from database first
        const { data: classData } = await supabase
          .from('classes')
          .select('name')
          .eq('id', effectiveClassId)
          .single();
        
        if (classData?.name) {
          setClassName(classData.name);
        } else {
          // Fallback to CLASS_LIST_DETAILED
          setClassName(getClassDisplayName(effectiveClassId));
        }
      }
    };
    fetchClassName();
  }, [effectiveClassId]);

  useEffect(() => {
    fetchDashboardData();
  }, [effectiveClassId]);

  const fetchDashboardData = async () => {
    if (!effectiveClassId) {
      setIsLoading(false);
      return;
    }

    // Normalize class_id for comparison
    const normalizedClassId = effectiveClassId.toLowerCase().replace(/\s+/g, '');

    try {
      // Fetch upcoming exams - all published, then filter by normalized class
      const { data: examsData } = await supabase
        .from('exams')
        .select('id, title, subject, start_time, duration_minutes, class_id')
        .eq('is_published', true)
        .gte('start_time', new Date().toISOString())
        .order('start_time', { ascending: true })
        .limit(20);

      // Filter exams by normalized class_id
      const filteredExams = examsData?.filter(exam => 
        exam.class_id?.toLowerCase().replace(/\s+/g, '') === normalizedClassId
      )?.slice(0, 5) || [];

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

      // Fetch assignments - all published, then filter by normalized class
      const { data: assignmentsData } = await supabase
        .from('assignments')
        .select('id, title, subject, due_date, class_id')
        .eq('is_published', true)
        .gte('due_date', new Date().toISOString())
        .order('due_date', { ascending: true })
        .limit(20);

      // Filter assignments by normalized class_id
      const filteredAssignments = assignmentsData?.filter(a => 
        a.class_id?.toLowerCase().replace(/\s+/g, '') === normalizedClassId
      )?.slice(0, 3) || [];

      setUpcomingExams(filteredExams.map(e => ({
        id: e.id,
        title: e.title,
        subject: e.subject,
        start_time: e.start_time,
        duration_minutes: e.duration_minutes,
      })));
      setAnnouncements(announcementsData || []);
      setEvents(eventsData || []);
      setAssignments(filteredAssignments.map(a => ({
        id: a.id,
        title: a.title,
        subject: a.subject,
        due_date: a.due_date,
      })));
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const quickActions = [
    { title: 'CBT Portal', description: 'Take exams', icon: ClipboardList, path: '/cbt', variant: 'blue' as const },
    { title: 'My Results', description: 'View results', icon: GraduationCap, path: '/student/results', variant: 'green' as const },
    { title: 'Report Cards', description: 'Download reports', icon: FileText, path: '/student/report-cards', variant: 'purple' as const },
    { title: 'School Fees', description: 'Pay online', icon: CreditCard, path: '/student/fees', variant: 'orange' as const },
    { title: 'ID Card', description: 'View ID', icon: IdCard, path: '/student/id-card', variant: 'pink' as const },
    { title: 'Materials', description: 'Study resources', icon: BookOpen, path: '/student/materials', variant: 'cyan' as const },
    { title: 'Attendance', description: 'View records', icon: Calendar, path: '/student/attendance', variant: 'orange' as const },
    { title: 'My Profile', description: 'Edit profile', icon: User, path: '/student/profile', variant: 'blue' as const },
  ];

  // Transform exams for schedule carousel
  const scheduleItems = upcomingExams.map(exam => ({
    id: exam.id,
    title: exam.title,
    subject: exam.subject,
    time: exam.start_time,
    duration: `${exam.duration_minutes} mins`,
    type: 'exam' as const,
  }));

  return (
    <MainLayout>
      <div className="space-y-4 md:space-y-6">
        {/* Welcome Card */}
        <WelcomeCard
          name={studentRecord?.full_name || profile?.full_name || 'Student'}
          role="Student"
          subtitle={className || effectiveClassId || undefined}
          avatarUrl={studentRecord?.photo_url || profile?.photo_url}
          variant="purple"
          emoji="📚"
        />

        {/* Quick Actions Grid */}
        <div className="grid grid-cols-4 md:grid-cols-4 lg:grid-cols-8 gap-2 md:gap-3">
          {quickActions.map((action) => (
            <ActionCard
              key={action.path}
              title={action.title}
              icon={action.icon}
              path={action.path}
              variant={action.variant}
              compact
            />
          ))}
        </div>

        {/* Upcoming Exams Carousel */}
        {scheduleItems.length > 0 && (
          <ScheduleCarousel
            items={scheduleItems}
            title="Upcoming Exams"
            onViewAll={() => navigate('/cbt')}
            emptyMessage="No upcoming exams"
          />
        )}

        {isLoading ? (
          <div className="flex justify-center py-8 md:py-12">
            <Loader2 className="h-6 w-6 md:h-8 md:w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
            {/* Announcements */}
            <Card className="border-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                  <div className="p-2 rounded-lg bg-pink/10">
                    <Megaphone className="h-4 w-4 text-pink" />
                  </div>
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
                      <div key={announcement.id} className="p-3 rounded-xl bg-muted/40 hover:bg-muted/60 transition-colors">
                        <div className="flex items-center justify-between mb-1">
                          <p className="font-medium text-sm">{announcement.title}</p>
                          <Badge variant="outline" className="text-xs">{announcement.type}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2">{announcement.content}</p>
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
            <Card className="border-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                  <div className="p-2 rounded-lg bg-info/10">
                    <CalendarDays className="h-4 w-4 text-info" />
                  </div>
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
                      <div key={event.id} className="flex items-center justify-between p-3 rounded-xl bg-muted/40 hover:bg-muted/60 transition-colors">
                        <div>
                          <p className="font-medium text-sm">{event.title}</p>
                          {event.location && (
                            <p className="text-xs text-muted-foreground">{event.location}</p>
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
            <Card className="border-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                  <div className="p-2 rounded-lg bg-warning/10">
                    <BookOpen className="h-4 w-4 text-warning" />
                  </div>
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
                      <div key={assignment.id} className="flex items-center justify-between p-3 rounded-xl bg-muted/40 hover:bg-muted/60 transition-colors">
                        <div>
                          <p className="font-medium text-sm">{assignment.title}</p>
                          <p className="text-xs text-muted-foreground">{assignment.subject}</p>
                        </div>
                        {assignment.due_date && (
                          <Badge variant="secondary" className="bg-warning/10 text-warning border-warning/20">
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

            {/* CBT Exams */}
            <Card className="border-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                  <div className="p-2 rounded-lg bg-success/10">
                    <ClipboardList className="h-4 w-4 text-success" />
                  </div>
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
                      <div key={exam.id} className="flex items-center justify-between p-3 rounded-xl bg-muted/40 hover:bg-muted/60 transition-colors">
                        <div>
                          <p className="font-medium text-sm">{exam.title}</p>
                          <p className="text-xs text-muted-foreground">{exam.subject}</p>
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
          </div>
        )}
      </div>
    </MainLayout>
  );
}
