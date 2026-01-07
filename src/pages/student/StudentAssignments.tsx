import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useStudentRecord } from '@/hooks/useStudentRecord';
import { BookOpen, Download, Clock, Loader2, ExternalLink } from 'lucide-react';
import { format, isPast, isToday } from 'date-fns';
import { toast } from 'sonner';

interface Assignment {
  id: string;
  title: string;
  description: string | null;
  subject: string;
  due_date: string | null;
  file_url: string | null;
  created_at: string;
}

export default function StudentAssignments() {
  const { studentRecord, isLoading: studentLoading } = useStudentRecord();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (studentRecord?.class_id) {
      fetchAssignments();
    } else if (!studentLoading) {
      setIsLoading(false);
    }
  }, [studentRecord, studentLoading]);

  const fetchAssignments = async () => {
    if (!studentRecord?.class_id) {
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('assignments')
        .select('id, title, description, subject, due_date, file_url, created_at')
        .eq('class_id', studentRecord.class_id)
        .eq('is_published', true)
        .order('due_date', { ascending: true });

      if (error) throw error;
      setAssignments(data || []);
    } catch (error) {
      console.error('Error fetching assignments:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getDueBadge = (dueDate: string | null) => {
    if (!dueDate) return null;
    
    const date = new Date(dueDate);
    if (isPast(date) && !isToday(date)) {
      return <Badge variant="destructive">Overdue</Badge>;
    }
    if (isToday(date)) {
      return <Badge className="bg-warning text-warning-foreground">Due Today</Badge>;
    }
    return <Badge variant="secondary">Due {format(date, 'MMM d')}</Badge>;
  };

  const handleDownload = async (fileUrl: string | null, title: string) => {
    if (!fileUrl) {
      toast.error('No file attached to this assignment');
      return;
    }

    try {
      if (fileUrl.startsWith('http')) {
        window.open(fileUrl, '_blank');
      } else {
        const { data, error } = await supabase.storage
          .from('assignments')
          .createSignedUrl(fileUrl, 3600);

        if (error) throw error;
        if (data?.signedUrl) {
          window.open(data.signedUrl, '_blank');
        }
      }
      toast.success(`Downloading: ${title}`);
    } catch (error) {
      console.error('Error downloading file:', error);
      toast.error('Failed to download file');
    }
  };

  return (
    <MainLayout title="Assignments" subtitle="View your class assignments">
      <div className="space-y-6">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : assignments.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No assignments at the moment</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {assignments.map((assignment) => (
              <Card key={assignment.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <Badge variant="outline">{assignment.subject}</Badge>
                    {getDueBadge(assignment.due_date)}
                  </div>
                  <CardTitle className="mt-2">{assignment.title}</CardTitle>
                  <CardDescription>
                    Posted on {format(new Date(assignment.created_at), 'MMM d, yyyy')}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {assignment.description && (
                    <p className="text-sm text-muted-foreground">{assignment.description}</p>
                  )}
                  
                  {assignment.due_date && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      Due: {format(new Date(assignment.due_date), 'MMMM d, yyyy h:mm a')}
                    </div>
                  )}

                  {assignment.file_url && (
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => handleDownload(assignment.file_url, assignment.title)}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Download Attachment
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
}
