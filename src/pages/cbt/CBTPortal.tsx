import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useStudentRecord } from '@/hooks/useStudentRecord';
import { supabase } from '@/integrations/supabase/client';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ClipboardList, Clock, Play, CheckCircle2, AlertCircle, Loader2, Lock } from 'lucide-react';
import { format } from 'date-fns';
import { formatClassName } from '@/lib/formatClassName';
import { PageGradientHeader } from '@/components/ui/page-gradient-header';

interface Exam {
  id: string;
  title: string;
  subject: string;
  class_id: string;
  duration_minutes: number;
  start_time: string | null;
  end_time: string | null;
  is_published: boolean;
  is_exam_active: boolean;
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
  const { user } = useAuth();
  const { studentRecord, isLoading: studentLoading } = useStudentRecord();
  const [exams, setExams] = useState<Exam[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [examSystemActive, setExamSystemActive] = useState(false);

  useEffect(() => {
    if (studentRecord?.class_id) {
      fetchExams();
    } else if (!studentLoading) {
      setIsLoading(false);
    }
  }, [studentRecord, studentLoading]);

  useEffect(() => {
    if (user) {
      fetchSubmissions();
    }
  }, [user]);

  const fetchExams = async () => {
    if (!studentRecord?.class_id) return;
    const normalizedStudentClass = studentRecord.class_id.toLowerCase().replace(/\s+/g, '');
    const { data, error } = await supabase
      .from('exams')
      .select('*')
      .eq('is_published', true)
      .order('created_at', { ascending: false });

    if (!error && data) {
      const filteredExams = data.filter((exam: Exam) => {
        const normalizedExamClass = exam.class_id.toLowerCase().replace(/\s+/g, '');
        return normalizedExamClass === normalizedStudentClass;
      });
      setExams(filteredExams);
      const hasActiveExam = filteredExams.some((exam: Exam) => exam.is_exam_active);
      setExamSystemActive(hasActiveExam);
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
        return <Badge className="bg-green-500 text-xs">Completed</Badge>;
      case 'in-progress':
        return <Badge className="bg-yellow-500 text-xs">In Progress</Badge>;
      case 'upcoming':
        return <Badge className="bg-blue-500 text-xs">Upcoming</Badge>;
      case 'expired':
        return <Badge variant="destructive" className="text-xs">Expired</Badge>;
      default:
        return <Badge className="bg-primary text-xs">Available</Badge>;
    }
  };

  const handleStartExam = (exam: Exam) => {
    if (!exam.is_exam_active) return;
    navigate(`/cbt/exam/${exam.id}`);
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
      <div className="space-y-4 sm:space-y-6">
        <PageGradientHeader emoji="💻" title="CBT Portal" subtitle="Take exams and view your results" gradient="from-primary/10 via-purple-500/5 to-blue-500/5">
          {studentRecord?.class_id && (
            <Badge variant="outline" className="text-sm sm:text-lg px-3 py-1.5 sm:px-4 sm:py-2">
              Class: {formatClassName(studentRecord.class_id)}
            </Badge>
          )}
        </PageGradientHeader>

        {!examSystemActive && exams.length > 0 && (
          <Card className="border-warning bg-warning/10">
            <CardContent className="flex items-center gap-3 py-3 sm:py-4 px-4">
              <Lock className="h-6 w-6 sm:h-8 sm:w-8 text-warning shrink-0" />
              <div className="min-w-0">
                <h3 className="font-semibold text-warning text-sm sm:text-base">Exams Not Active</h3>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  CBT exams are currently not available. Please wait for the admin to activate the exam session.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue="available" className="w-full">
          <TabsList className="grid w-full grid-cols-3 h-auto">
            <TabsTrigger value="available" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm py-2.5 px-1 sm:px-3">
              <Play className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
              <span className="truncate">Available ({availableExams.length})</span>
            </TabsTrigger>
            <TabsTrigger value="upcoming" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm py-2.5 px-1 sm:px-3">
              <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
              <span className="truncate">Upcoming ({upcomingExams.length})</span>
            </TabsTrigger>
            <TabsTrigger value="completed" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm py-2.5 px-1 sm:px-3">
              <CheckCircle2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
              <span className="truncate">Done ({completedExams.length})</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="available" className="mt-4 sm:mt-6">
            {availableExams.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-10 sm:py-12">
                  <ClipboardList className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground mb-3 sm:mb-4" />
                  <p className="text-sm sm:text-base text-muted-foreground">No available exams at the moment</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-3 sm:gap-4">
                {availableExams.map((exam) => {
                  const status = getExamStatus(exam);
                  const submission = submissions.find(s => s.exam_id === exam.id);
                  const canTakeExam = exam.is_exam_active;
                  
                  return (
                    <Card key={exam.id} className="hover:shadow-md transition-shadow">
                      <CardHeader className="pb-2 sm:pb-3 px-4 sm:px-6 pt-4 sm:pt-6">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <CardTitle className="text-base sm:text-xl leading-tight truncate">{exam.title}</CardTitle>
                            <CardDescription className="mt-1 text-xs sm:text-sm">
                              {exam.subject} • {exam.duration_minutes} min
                            </CardDescription>
                          </div>
                          <div className="flex flex-col sm:flex-row gap-1 sm:gap-2 shrink-0">
                            {!canTakeExam && (
                              <Badge variant="outline" className="border-warning text-warning text-xs">
                                <Lock className="h-3 w-3 mr-1" />
                                Locked
                              </Badge>
                            )}
                            {getStatusBadge(status)}
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="flex items-center gap-3 sm:gap-4 text-xs sm:text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                              {exam.duration_minutes} min
                            </span>
                            {exam.end_time && (
                              <span className="truncate">
                                Due: {format(new Date(exam.end_time), 'MMM d, h:mm a')}
                              </span>
                            )}
                          </div>
                          <Button 
                            onClick={() => handleStartExam(exam)}
                            disabled={!canTakeExam}
                            className="w-full sm:w-auto"
                            size="sm"
                          >
                            {!canTakeExam ? (
                              <>
                                <Lock className="mr-2 h-4 w-4" />
                                Locked
                              </>
                            ) : submission ? (
                              'Continue Exam'
                            ) : (
                              'Start Exam'
                            )}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="upcoming" className="mt-4 sm:mt-6">
            {upcomingExams.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-10 sm:py-12">
                  <Clock className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground mb-3 sm:mb-4" />
                  <p className="text-sm sm:text-base text-muted-foreground">No upcoming exams scheduled</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-3 sm:gap-4">
                {upcomingExams.map((exam) => (
                  <Card key={exam.id}>
                    <CardHeader className="pb-2 sm:pb-3 px-4 sm:px-6 pt-4 sm:pt-6">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <CardTitle className="text-base sm:text-xl leading-tight">{exam.title}</CardTitle>
                          <CardDescription className="mt-1 text-xs sm:text-sm">
                            {exam.subject} • {exam.duration_minutes} min
                          </CardDescription>
                        </div>
                        {getStatusBadge('upcoming')}
                      </div>
                    </CardHeader>
                    <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
                      <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                        <AlertCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
                        <span>Starts: {exam.start_time ? format(new Date(exam.start_time), 'MMM d, yyyy h:mm a') : 'TBA'}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="completed" className="mt-4 sm:mt-6">
            {completedExams.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-10 sm:py-12">
                  <CheckCircle2 className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground mb-3 sm:mb-4" />
                  <p className="text-sm sm:text-base text-muted-foreground">No completed exams yet</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-3 sm:gap-4">
                {completedExams.map((exam) => {
                  const submission = submissions.find(s => s.exam_id === exam.id);
                  const percentage = submission?.total_marks 
                    ? Math.round((submission.score || 0) / submission.total_marks * 100)
                    : 0;
                  
                  return (
                    <Card key={exam.id}>
                      <CardHeader className="pb-2 sm:pb-3 px-4 sm:px-6 pt-4 sm:pt-6">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <CardTitle className="text-base sm:text-xl leading-tight">{exam.title}</CardTitle>
                            <CardDescription className="mt-1 text-xs sm:text-sm">
                              {exam.subject} • {submission?.submitted_at 
                                ? format(new Date(submission.submitted_at), 'MMM d, yyyy')
                                : ''}
                            </CardDescription>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-xl sm:text-2xl font-bold text-primary">
                              {submission?.score || 0}/{submission?.total_marks || 0}
                            </p>
                            <p className="text-xs sm:text-sm text-muted-foreground">{percentage}%</p>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
                        <Button 
                          variant="outline" 
                          onClick={() => handleViewResults(exam.id)}
                          size="sm"
                          className="w-full sm:w-auto"
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
