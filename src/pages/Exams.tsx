import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { CBTControlPanel } from '@/components/exams/CBTControlPanel';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Plus, Upload, FileText, ClipboardList, Download, Eye, Clock, Users, Power } from 'lucide-react';

interface Exam {
  id: string;
  title: string;
  subject: string;
  class_id: string;
  start_time: string | null;
  duration_minutes: number;
  is_published: boolean;
  is_exam_active: boolean;
  teacher_id: string | null;
}

export default function Exams() {
  const navigate = useNavigate();
  const { role } = useAuth();
  const [exams, setExams] = useState<Exam[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [globalExamActive, setGlobalExamActive] = useState(false);

  useEffect(() => {
    fetchExams();
  }, []);

  const fetchExams = async () => {
    try {
      const { data, error } = await supabase
        .from('exams')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setExams(data || []);
      
      // Check if any exams are active
      const hasActiveExams = data?.some(e => e.is_exam_active) || false;
      setGlobalExamActive(hasActiveExams);
    } catch (error: any) {
      toast.error('Failed to load exams', { description: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleExam = async (examId: string, active: boolean) => {
    try {
      const { error } = await supabase
        .from('exams')
        .update({ is_exam_active: active })
        .eq('id', examId);

      if (error) throw error;

      setExams(exams.map(e => e.id === examId ? { ...e, is_exam_active: active } : e));
      toast.success(active ? 'Exam activated' : 'Exam deactivated');
    } catch (error: any) {
      toast.error('Failed to update exam', { description: error.message });
    }
  };

  const publishedExams = exams.filter(e => e.is_published);
  const draftExams = exams.filter(e => !e.is_published);

  const getStatusBadge = (exam: Exam) => {
    if (!exam.is_published) return <Badge variant="secondary">Draft</Badge>;
    if (exam.is_exam_active) return <Badge className="bg-success">Active</Badge>;
    return <Badge variant="outline">Published</Badge>;
  };

  return (
    <MainLayout title="Exams & Assignments" subtitle="Manage exams, assignments, and results">
      <div className="space-y-6 animate-fade-in">
        {/* Admin CBT Control Panel */}
        {role === 'admin' && (
          <CBTControlPanel
            isExamActive={globalExamActive}
            onToggle={setGlobalExamActive}
            examCount={publishedExams.length}
          />
        )}

        <Tabs defaultValue="exams" className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between gap-4">
            <TabsList>
              <TabsTrigger value="exams" className="gap-2">
                <ClipboardList className="h-4 w-4" />
                Exams ({exams.length})
              </TabsTrigger>
              <TabsTrigger value="assignments" className="gap-2">
                <FileText className="h-4 w-4" />
                Assignments
              </TabsTrigger>
              <TabsTrigger value="results" className="gap-2">
                <Download className="h-4 w-4" />
                Results
              </TabsTrigger>
            </TabsList>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => toast.info('Upload feature coming soon')}>
                <Upload className="mr-2 h-4 w-4" />
                Upload Questions
              </Button>
              <Button 
                className="bg-gradient-primary hover:opacity-90"
                onClick={() => navigate('/teacher/create-exam')}
              >
                <Plus className="mr-2 h-4 w-4" />
                Create Exam
              </Button>
            </div>
          </div>

          <TabsContent value="exams" className="space-y-4">
            {isLoading ? (
              <div className="flex justify-center p-12">
                <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
              </div>
            ) : exams.length === 0 ? (
              <Card className="p-12 text-center">
                <ClipboardList className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Exams Yet</h3>
                <p className="text-muted-foreground mb-4">Create your first exam to get started</p>
                <Button onClick={() => navigate('/teacher/create-exam')} className="bg-gradient-primary">
                  <Plus className="mr-2 h-4 w-4" />
                  Create Exam
                </Button>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {exams.map((exam) => (
                  <Card key={exam.id} className="card-hover">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        {getStatusBadge(exam)}
                        <Badge variant="outline">{exam.class_id}</Badge>
                      </div>
                      <CardTitle className="mt-2">{exam.title}</CardTitle>
                      <CardDescription>{exam.subject}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Clock className="h-4 w-4" />
                          {exam.duration_minutes} min
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <FileText className="h-4 w-4" />
                          CBT Exam
                        </div>
                      </div>

                      {/* Admin/Teacher controls */}
                      {(role === 'admin' || role === 'teacher') && exam.is_published && (
                        <div className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                          <div className="flex items-center gap-2">
                            <Power className={`h-4 w-4 ${exam.is_exam_active ? 'text-success' : 'text-muted-foreground'}`} />
                            <span className="text-sm">{exam.is_exam_active ? 'Active' : 'Inactive'}</span>
                          </div>
                          <Switch
                            checked={exam.is_exam_active}
                            onCheckedChange={(checked) => handleToggleExam(exam.id, checked)}
                          />
                        </div>
                      )}

                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="flex-1"
                          onClick={() => navigate(`/teacher/exams?id=${exam.id}`)}
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          View
                        </Button>
                        <Button 
                          size="sm" 
                          className="flex-1 bg-gradient-primary"
                          onClick={() => navigate(`/teacher/exams?id=${exam.id}&manage=true`)}
                        >
                          Manage
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="assignments" className="space-y-4">
            <Card className="p-12 text-center">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Assignments Coming Soon</h3>
              <p className="text-muted-foreground">
                Assignment management will be available in a future update
              </p>
            </Card>
          </TabsContent>

          <TabsContent value="results">
            <div className="bg-card rounded-xl border border-border/50 p-12 shadow-sm text-center">
              <Download className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">Generate Report Cards</h3>
              <p className="text-muted-foreground mb-6">
                Select a class and term to generate and download student report cards
              </p>
              <Button 
                className="bg-gradient-primary hover:opacity-90"
                onClick={() => navigate('/report-cards')}
              >
                Generate Reports
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
