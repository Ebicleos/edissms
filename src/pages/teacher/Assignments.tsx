import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Plus, FileText, Calendar, Loader2, Trash2, Upload } from 'lucide-react';
import { CLASS_LIST_DETAILED } from '@/types';

interface Assignment {
  id: string;
  title: string;
  subject: string;
  class_id: string;
  description: string | null;
  due_date: string | null;
  file_url: string | null;
  is_published: boolean;
  created_at: string;
}

interface TeacherClass {
  class_id: string;
}

export default function Assignments() {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [teacherClasses, setTeacherClasses] = useState<TeacherClass[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Form state
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [classId, setClassId] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [isPublished, setIsPublished] = useState(false);

  useEffect(() => {
    fetchAssignments();
    fetchTeacherClasses();
  }, [user]);

  const fetchTeacherClasses = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('teacher_classes')
      .select('class_id')
      .eq('teacher_id', user.id);
    
    if (!error && data) {
      setTeacherClasses(data);
    }
  };

  const fetchAssignments = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('assignments')
        .select('*')
        .eq('created_by', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAssignments(data || []);
    } catch (error: any) {
      toast.error('Failed to load assignments', { description: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title || !subject || !classId) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsSaving(true);

    try {
      const { error } = await supabase
        .from('assignments')
        .insert({
          title,
          subject,
          class_id: classId,
          description: description || null,
          due_date: dueDate || null,
          is_published: isPublished,
          created_by: user?.id,
        });

      if (error) throw error;

      toast.success('Assignment created successfully');
      setIsDialogOpen(false);
      resetForm();
      fetchAssignments();
    } catch (error: any) {
      toast.error('Failed to create assignment', { description: error.message });
    } finally {
      setIsSaving(false);
    }
  };

  const handleTogglePublish = async (assignment: Assignment) => {
    try {
      const { error } = await supabase
        .from('assignments')
        .update({ is_published: !assignment.is_published })
        .eq('id', assignment.id);

      if (error) throw error;

      setAssignments(prev => 
        prev.map(a => a.id === assignment.id ? { ...a, is_published: !a.is_published } : a)
      );
      toast.success(assignment.is_published ? 'Assignment unpublished' : 'Assignment published');
    } catch (error: any) {
      toast.error('Failed to update assignment', { description: error.message });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this assignment?')) return;

    try {
      const { error } = await supabase
        .from('assignments')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setAssignments(prev => prev.filter(a => a.id !== id));
      toast.success('Assignment deleted');
    } catch (error: any) {
      toast.error('Failed to delete assignment', { description: error.message });
    }
  };

  const resetForm = () => {
    setTitle('');
    setSubject('');
    setClassId('');
    setDescription('');
    setDueDate('');
    setIsPublished(false);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'No due date';
    return new Date(dateString).toLocaleDateString('en-NG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
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
    <MainLayout title="Assignments" subtitle="Create and manage class assignments">
      <div className="space-y-6">
        <div className="flex justify-end">
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-primary">
                <Plus className="h-4 w-4 mr-2" />
                Create Assignment
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Create New Assignment</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateAssignment} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Assignment title"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="subject">Subject *</Label>
                    <Input
                      id="subject"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      placeholder="e.g., Mathematics"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="class">Class *</Label>
                    <Select value={classId} onValueChange={setClassId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select class" />
                      </SelectTrigger>
                      <SelectContent>
                        {(teacherClasses.length > 0
                          ? CLASS_LIST_DETAILED.filter(cls => 
                              teacherClasses.some(tc => tc.class_id === cls.id)
                            )
                          : CLASS_LIST_DETAILED
                        ).map((cls) => (
                          <SelectItem key={cls.id} value={cls.id}>
                            {cls.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Assignment instructions..."
                    rows={4}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="due-date">Due Date</Label>
                  <Input
                    id="due-date"
                    type="datetime-local"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                  />
                </div>

                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div>
                    <p className="font-medium text-sm">Publish immediately</p>
                    <p className="text-xs text-muted-foreground">Students will see this assignment</p>
                  </div>
                  <Switch checked={isPublished} onCheckedChange={setIsPublished} />
                </div>

                <div className="flex justify-end gap-3">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSaving}>
                    {isSaving ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      'Create Assignment'
                    )}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {assignments.length === 0 ? (
          <Card className="p-12 text-center">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Assignments Yet</h3>
            <p className="text-muted-foreground mb-4">Create your first assignment to get started</p>
            <Button onClick={() => setIsDialogOpen(true)} className="bg-gradient-primary">
              <Plus className="h-4 w-4 mr-2" />
              Create Assignment
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {assignments.map((assignment) => (
              <Card key={assignment.id} className="card-hover">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex gap-2">
                      <Badge variant={assignment.is_published ? "default" : "secondary"}>
                        {assignment.is_published ? 'Published' : 'Draft'}
                      </Badge>
                      <Badge variant="outline">{assignment.class_id}</Badge>
                    </div>
                  </div>
                  <CardTitle className="mt-2 line-clamp-1">{assignment.title}</CardTitle>
                  <CardDescription>{assignment.subject}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {assignment.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {assignment.description}
                    </p>
                  )}
                  
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    Due: {formatDate(assignment.due_date)}
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Published</span>
                      <Switch
                        checked={assignment.is_published}
                        onCheckedChange={() => handleTogglePublish(assignment)}
                      />
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(assignment.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
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
