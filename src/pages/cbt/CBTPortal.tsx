import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ClipboardList, Clock, Play, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { format } from 'date-fns';

interface Exam {
  id: string;
  title: string;
  subject: string;
  class_id: string;
  duration_minutes: number;
  start_time: string | null;
  end_time: string | null;
  is_published: boolean;
  created_at: string;
}

interface Submission {
  id: string;
  exam_id: string;
  is_submitted: boolean;
  score: number | null;
  total_marks: number | null;
  submitted_at: string | null;
}

export default function CBTPortal() {
  const navigate = useNavigate();
  const { userClass, user } = useAuth();
  const [exams, setExams] = useState<Exam[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchExams();
    fetchSubmissions();
  }, [userClass, user]);

  const fetchExams = async () => {
    if (!userClass) return;
    
    const { data, error } = await supabase
      .from('exams')
      .select('*')
      .eq('class_id', userClass)
      .eq('is_published', true)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setExams(data);
    }
    setIsLoading(false);
  };

  const fetchSubmissions = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('exam_submissions')
      .select('*')
      .eq('student_id', user.id);

    if (!error && data) {
      setSubmissions(data);
    }
  };

  const getExamStatus = (exam: Exam) => {
    const now = new Date();
    const submission = submissions.find(s => s.exam_id === exam.id);
    
    if (submission?.is_submitted) return 'completed';
    if (submission && !submission.is_submitted) return 'in-progress';
    
    if (exam.start_time && new Date(exam.start_time) > now) return 'upcoming';
    if (exam.end_time && new Date(exam.end_time) < now) return 'expired';
    
    return 'available';
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-500">Completed</Badge>;
      case 'in-progress':
        return <Badge className="bg-yellow-500">In Progress</Badge>;
      case 'upcoming':
        return <Badge className="bg-blue-500">Upcoming</Badge>;
      case 'expired':
        return <Badge variant="destructive">Expired</Badge>;
      default:
        return <Badge className="bg-primary">Available</Badge>;
    }
  };

  const handleStartExam = (examId: string) => {
    navigate(`/cbt/exam/${examId}`);
  };

  const handleViewResults = (examId: string) => {
    const submission = submissions.find(s => s.exam_id === examId);
    if (submission) {
      navigate(`/cbt/results/${submission.id}`);
    }
  };

  const availableExams = exams.filter(e => ['available', 'in-progress'].includes(getExamStatus(e)));
  const completedExams = exams.filter(e => getExamStatus(e) === 'completed');
  const upcomingExams = exams.filter(e => getExamStatus(e) === 'upcoming');

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
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">CBT Portal</h1>
            <p className="text-muted-foreground">
              Computer-Based Testing - Take exams and view your results
            </p>
          </div>
          {userClass && (
            <Badge variant="outline" className="text-lg px-4 py-2">
              Class: {userClass}
            </Badge>
          )}
        </div>

        <Tabs defaultValue="available" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="available" className="flex items-center gap-2">
              <Play className="h-4 w-4" />
              Available ({availableExams.length})
            </TabsTrigger>
            <TabsTrigger value="upcoming" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Upcoming ({upcomingExams.length})
            </TabsTrigger>
            <TabsTrigger value="completed" className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              Completed ({completedExams.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="available" className="mt-6">
            {availableExams.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <ClipboardList className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No available exams at the moment</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {availableExams.map((exam) => {
                  const status = getExamStatus(exam);
                  const submission = submissions.find(s => s.exam_id === exam.id);
                  
                  return (
                    <Card key={exam.id} className="hover:shadow-md transition-shadow">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="text-xl">{exam.title}</CardTitle>
                            <CardDescription className="mt-1">
                              {exam.subject} • {exam.duration_minutes} minutes
                            </CardDescription>
                          </div>
                          {getStatusBadge(status)}
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              {exam.duration_minutes} min
                            </span>
                            {exam.end_time && (
                              <span>
                                Due: {format(new Date(exam.end_time), 'MMM d, yyyy h:mm a')}
                              </span>
                            )}
                          </div>
                          <Button onClick={() => handleStartExam(exam.id)}>
                            {submission ? 'Continue Exam' : 'Start Exam'}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="upcoming" className="mt-6">
            {upcomingExams.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Clock className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No upcoming exams scheduled</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {upcomingExams.map((exam) => (
                  <Card key={exam.id}>
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-xl">{exam.title}</CardTitle>
                          <CardDescription className="mt-1">
                            {exam.subject} • {exam.duration_minutes} minutes
                          </CardDescription>
                        </div>
                        {getStatusBadge('upcoming')}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <AlertCircle className="h-4 w-4" />
                        Starts: {exam.start_time ? format(new Date(exam.start_time), 'MMM d, yyyy h:mm a') : 'TBA'}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="completed" className="mt-6">
            {completedExams.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <CheckCircle2 className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No completed exams yet</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {completedExams.map((exam) => {
                  const submission = submissions.find(s => s.exam_id === exam.id);
                  const percentage = submission?.total_marks 
                    ? Math.round((submission.score || 0) / submission.total_marks * 100)
                    : 0;
                  
                  return (
                    <Card key={exam.id}>
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="text-xl">{exam.title}</CardTitle>
                            <CardDescription className="mt-1">
                              {exam.subject} • Submitted {submission?.submitted_at 
                                ? format(new Date(submission.submitted_at), 'MMM d, yyyy')
                                : ''}
                            </CardDescription>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-bold text-primary">
                              {submission?.score || 0}/{submission?.total_marks || 0}
                            </p>
                            <p className="text-sm text-muted-foreground">{percentage}%</p>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <Button 
                          variant="outline" 
                          onClick={() => handleViewResults(exam.id)}
                        >
                          View Results
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
