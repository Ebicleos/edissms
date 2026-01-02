import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Plus, ClipboardList, Users, Loader2, Edit, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface Exam {
  id: string;
  title: string;
  subject: string;
  class_id: string;
  duration_minutes: number;
  is_published: boolean;
  created_at: string;
  _count?: {
    questions: number;
    submissions: number;
  };
}

export default function TeacherExams() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [exams, setExams] = useState<Exam[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchExams();
  }, [user]);

  const fetchExams = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('exams')
      .select('*')
      .eq('teacher_id', user.id)
      .order('created_at', { ascending: false });

    if (!error && data) {
      // Fetch counts for each exam
      const examsWithCounts = await Promise.all(
        data.map(async (exam) => {
          const { count: questionCount } = await supabase
            .from('questions')
            .select('*', { count: 'exact', head: true })
            .eq('exam_id', exam.id);

          const { count: submissionCount } = await supabase
            .from('exam_submissions')
            .select('*', { count: 'exact', head: true })
            .eq('exam_id', exam.id)
            .eq('is_submitted', true);

          return {
            ...exam,
            _count: {
              questions: questionCount || 0,
              submissions: submissionCount || 0,
            },
          };
        })
      );

      setExams(examsWithCounts);
    }
    setIsLoading(false);
  };

  const togglePublish = async (examId: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from('exams')
      .update({ is_published: !currentStatus })
      .eq('id', examId);

    if (error) {
      toast.error('Failed to update exam status');
      return;
    }

    setExams(exams.map(e => 
      e.id === examId ? { ...e, is_published: !currentStatus } : e
    ));
    toast.success(currentStatus ? 'Exam unpublished' : 'Exam published');
  };

  const deleteExam = async (examId: string) => {
    if (!confirm('Are you sure you want to delete this exam?')) return;

    const { error } = await supabase
      .from('exams')
      .delete()
      .eq('id', examId);

    if (error) {
      toast.error('Failed to delete exam');
      return;
    }

    setExams(exams.filter(e => e.id !== examId));
    toast.success('Exam deleted');
  };

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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">My Exams</h1>
            <p className="text-muted-foreground">Create and manage exams for your students</p>
          </div>
          <Button onClick={() => navigate('/teacher/exams/create')}>
            <Plus className="h-4 w-4 mr-2" />
            Create Exam
          </Button>
        </div>

        {exams.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <ClipboardList className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">You haven't created any exams yet</p>
              <Button onClick={() => navigate('/teacher/exams/create')}>
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Exam
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {exams.map((exam) => (
              <Card key={exam.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-xl">{exam.title}</CardTitle>
                      <CardDescription className="mt-1">
                        {exam.subject} • {exam.class_id} • {exam.duration_minutes} minutes
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={exam.is_published ? "default" : "secondary"}>
                        {exam.is_published ? 'Published' : 'Draft'}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-6 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <ClipboardList className="h-4 w-4" />
                        {exam._count?.questions || 0} questions
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        {exam._count?.submissions || 0} submissions
                      </span>
                      <span>
                        Created {format(new Date(exam.created_at), 'MMM d, yyyy')}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <span className="text-sm">Publish</span>
                        <Switch
                          checked={exam.is_published}
                          onCheckedChange={() => togglePublish(exam.id, exam.is_published)}
                        />
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/teacher/exams/${exam.id}/edit`)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteExam(exam.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
}
