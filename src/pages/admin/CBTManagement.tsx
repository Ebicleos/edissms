import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  Monitor, 
  Users, 
  AlertTriangle, 
  Power, 
  Eye, 
  RefreshCw,
  ClipboardList,
  Activity,
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
  Play
} from 'lucide-react';
import { format } from 'date-fns';
import { PageGradientHeader } from '@/components/ui/page-gradient-header';

interface Exam {
  id: string;
  title: string;
  subject: string;
  class_id: string;
  duration_minutes: number;
  is_published: boolean;
  is_exam_active: boolean;
}

interface ExamSession {
  id: string;
  exam_id: string;
  student_id: string;
  started_at: string;
  is_active: boolean;
  tab_switches: number;
  last_activity: string;
  exam?: { title: string; subject: string };
  student_name?: string;
}

interface ExamSubmission {
  id: string;
  exam_id: string;
  student_id: string;
  score: number | null;
  total_marks: number | null;
  is_submitted: boolean;
  submitted_at: string | null;
  exam?: { title: string; subject: string; class_id: string };
  student_name?: string;
}

export default function CBTManagement() {
  const navigate = useNavigate();
  const [exams, setExams] = useState<Exam[]>([]);
  const [activeSessions, setActiveSessions] = useState<ExamSession[]>([]);
  const [submissions, setSubmissions] = useState<ExamSubmission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    fetchData();
    // Set up polling for active sessions
    const interval = setInterval(fetchActiveSessions, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    await Promise.all([fetchExams(), fetchActiveSessions(), fetchSubmissions()]);
    setIsLoading(false);
  };

  const fetchExams = async () => {
    const { data, error } = await supabase
      .from('exams')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching exams:', error);
    } else {
      setExams(data || []);
    }
  };

  const fetchActiveSessions = async () => {
    const { data, error } = await supabase
      .from('exam_sessions')
      .select(`
        *,
        exam:exams(title, subject)
      `)
      .eq('is_active', true)
      .order('started_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching sessions:', error);
    } else {
      setActiveSessions(data || []);
    }
  };

  const fetchSubmissions = async () => {
    const { data, error } = await supabase
      .from('exam_submissions')
      .select(`
        *,
        exam:exams(title, subject, class_id)
      `)
      .eq('is_submitted', true)
      .order('submitted_at', { ascending: false })
      .limit(50);
    
    if (error) {
      console.error('Error fetching submissions:', error);
    } else {
      setSubmissions(data || []);
    }
  };

  const handleToggleExam = async (examId: string, active: boolean) => {
    const { error } = await supabase
      .from('exams')
      .update({ is_exam_active: active })
      .eq('id', examId);

    if (error) {
      toast.error('Failed to update exam status');
    } else {
      setExams(exams.map(e => e.id === examId ? { ...e, is_exam_active: active } : e));
      toast.success(active ? 'Exam activated - students can now take this exam' : 'Exam deactivated');
    }
  };

  const handleStopAllExams = async () => {
    const { error } = await supabase
      .from('exams')
      .update({ is_exam_active: false })
      .eq('is_exam_active', true);

    if (error) {
      toast.error('Failed to stop exams');
    } else {
      setExams(exams.map(e => ({ ...e, is_exam_active: false })));
      toast.success('All exams have been stopped');
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchData();
    setIsRefreshing(false);
    toast.success('Data refreshed');
  };

  const activeExamsCount = exams.filter(e => e.is_exam_active).length;
  const publishedExamsCount = exams.filter(e => e.is_published).length;
  const averageScore = submissions.length > 0 
    ? Math.round(submissions.reduce((sum, s) => sum + ((s.score || 0) / (s.total_marks || 1) * 100), 0) / submissions.length)
    : 0;

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6 animate-fade-in">
        <PageGradientHeader emoji="🖥️" title="CBT Management" subtitle="Monitor and control computer-based testing" gradient="from-red-500/10 via-rose-500/5 to-orange-500/5" />
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-primary/10">
                  <ClipboardList className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Exams</p>
                  <p className="text-2xl font-bold">{exams.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-success/10">
                  <Power className="h-6 w-6 text-success" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Active Exams</p>
                  <p className="text-2xl font-bold">{activeExamsCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-blue-500/10">
                  <Users className="h-6 w-6 text-blue-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Live Sessions</p>
                  <p className="text-2xl font-bold">{activeSessions.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-amber-500/10">
                  <Activity className="h-6 w-6 text-amber-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Avg. Score</p>
                  <p className="text-2xl font-bold">{averageScore}%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Control Panel */}
        <Card className="border-2 border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Monitor className="h-5 w-5" />
                Exam Control Panel
              </CardTitle>
              <CardDescription>
                Manage exam activation and monitor student sessions in real-time
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing}>
                <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              {activeExamsCount > 0 && (
                <Button variant="destructive" size="sm" onClick={handleStopAllExams}>
                  <XCircle className="h-4 w-4 mr-2" />
                  Stop All Exams
                </Button>
              )}
            </div>
          </CardHeader>
        </Card>

        <Tabs defaultValue="exams" className="space-y-4">
          <TabsList>
            <TabsTrigger value="exams" className="gap-2">
              <ClipboardList className="h-4 w-4" />
              Exams ({publishedExamsCount} published)
            </TabsTrigger>
            <TabsTrigger value="sessions" className="gap-2">
              <Monitor className="h-4 w-4" />
              Live Sessions ({activeSessions.length})
            </TabsTrigger>
            <TabsTrigger value="results" className="gap-2">
              <CheckCircle className="h-4 w-4" />
              Results ({submissions.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="exams">
            <Card>
              <CardContent className="p-0">
                {exams.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <ClipboardList className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No exams created yet</p>
                    <Button 
                      variant="outline" 
                      className="mt-4"
                      onClick={() => navigate('/teacher/exams/create')}
                    >
                      Create First Exam
                    </Button>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Exam Title</TableHead>
                        <TableHead>Subject</TableHead>
                        <TableHead>Class</TableHead>
                        <TableHead>Duration</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {exams.map((exam) => (
                        <TableRow key={exam.id}>
                          <TableCell className="font-medium">{exam.title}</TableCell>
                          <TableCell>{exam.subject}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{exam.class_id}</Badge>
                          </TableCell>
                          <TableCell>{exam.duration_minutes} min</TableCell>
                          <TableCell>
                            {!exam.is_published ? (
                              <Badge variant="secondary">Draft</Badge>
                            ) : exam.is_exam_active ? (
                              <Badge className="bg-success">Active</Badge>
                            ) : (
                              <Badge variant="outline">Published</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              {exam.is_published && (
                                <>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => navigate(`/cbt/exam/${exam.id}?testMode=true`)}
                                    title="Test this exam"
                                  >
                                    <Play className="h-4 w-4" />
                                  </Button>
                                  <Switch
                                    checked={exam.is_exam_active}
                                    onCheckedChange={(checked) => handleToggleExam(exam.id, checked)}
                                  />
                                </>
                              )}
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => navigate(`/teacher/exams/${exam.id}/edit`)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sessions">
            <Card>
              <CardContent className="p-0">
                {activeSessions.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Monitor className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No active exam sessions</p>
                    <p className="text-sm">Sessions will appear here when students start taking exams</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Exam</TableHead>
                        <TableHead>Started</TableHead>
                        <TableHead>Last Activity</TableHead>
                        <TableHead>Tab Switches</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {activeSessions.map((session) => (
                        <TableRow key={session.id}>
                          <TableCell className="font-medium">
                            {session.exam?.title || 'Unknown'}
                            <p className="text-xs text-muted-foreground">{session.exam?.subject}</p>
                          </TableCell>
                          <TableCell>
                            {format(new Date(session.started_at), 'HH:mm:ss')}
                          </TableCell>
                          <TableCell>
                            {session.last_activity 
                              ? format(new Date(session.last_activity), 'HH:mm:ss')
                              : '-'}
                          </TableCell>
                          <TableCell>
                            {session.tab_switches > 0 ? (
                              <Badge variant="destructive" className="gap-1">
                                <AlertTriangle className="h-3 w-3" />
                                {session.tab_switches}
                              </Badge>
                            ) : (
                              <Badge variant="secondary">0</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge className="bg-success gap-1">
                              <Activity className="h-3 w-3" />
                              Active
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="results">
            <Card>
              <CardContent className="p-0">
                {submissions.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No exam submissions yet</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Exam</TableHead>
                        <TableHead>Class</TableHead>
                        <TableHead>Score</TableHead>
                        <TableHead>Percentage</TableHead>
                        <TableHead>Submitted</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {submissions.map((sub) => {
                        const percentage = sub.total_marks 
                          ? Math.round((sub.score || 0) / sub.total_marks * 100) 
                          : 0;
                        return (
                          <TableRow key={sub.id}>
                            <TableCell className="font-medium">
                              {sub.exam?.title || 'Unknown'}
                              <p className="text-xs text-muted-foreground">{sub.exam?.subject}</p>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">{sub.exam?.class_id}</Badge>
                            </TableCell>
                            <TableCell>
                              {sub.score}/{sub.total_marks}
                            </TableCell>
                            <TableCell>
                              <Badge 
                                variant={percentage >= 50 ? 'default' : 'destructive'}
                                className={percentage >= 50 ? 'bg-success' : ''}
                              >
                                {percentage}%
                              </Badge>
                            </TableCell>
                            <TableCell className="flex items-center gap-1 text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              {sub.submitted_at 
                                ? format(new Date(sub.submitted_at), 'MMM d, HH:mm')
                                : '-'}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}