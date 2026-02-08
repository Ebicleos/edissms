import React, { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Plus, Trash2, BookOpen, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { CLASS_LIST_DETAILED } from '@/types';
import { subjectSchema, validateInput } from '@/lib/validations';
import { PageGradientHeader } from '@/components/ui/page-gradient-header';

interface Subject {
  id: string;
  name: string;
  code: string | null;
  class_id: string | null;
  created_at: string;
}

const DEFAULT_SUBJECTS = [
  { name: 'Mathematics', code: 'MTH' },
  { name: 'English Language', code: 'ENG' },
  { name: 'Basic Science', code: 'BSC' },
  { name: 'Social Studies', code: 'SST' },
  { name: 'Civic Education', code: 'CVE' },
  { name: 'Computer Studies', code: 'ICT' },
  { name: 'Agricultural Science', code: 'AGR' },
  { name: 'Physical Health Education', code: 'PHE' },
  { name: 'Christian Religious Studies', code: 'CRS' },
  { name: 'Home Economics', code: 'HEC' },
  { name: 'French', code: 'FRN' },
  { name: 'Creative Arts', code: 'CRA' },
  { name: 'Basic Technology', code: 'BTC' },
  { name: 'Business Studies', code: 'BUS' },
  { name: 'Handwriting', code: 'HWR' },
  { name: 'Verbal Reasoning', code: 'VRN' },
  { name: 'Quantitative Reasoning', code: 'QRN' },
];

export default function Subjects() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [filterClass, setFilterClass] = useState<string>('all');

  const [newSubject, setNewSubject] = useState({
    name: '',
    code: '',
    class_id: '',
  });

  const fetchSubjects = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('subjects')
        .select('*')
        .order('name');

      if (error) throw error;
      setSubjects(data || []);
    } catch (error) {
      console.error('Error fetching subjects:', error);
      toast.error('Failed to load subjects');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSubjects();
  }, []);

  const handleAddSubject = async () => {
    // Validate input using Zod schema
    const validation = validateInput(subjectSchema, newSubject);
    if (!validation.success) {
      toast.error((validation as { success: false; error: string }).error);
      return;
    }

    const validData = (validation as { success: true; data: typeof newSubject }).data;

    setIsSubmitting(true);
    try {
      // Fetch current user's school_id
      const { data: { user } } = await supabase.auth.getUser();
      let schoolId = null;
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('school_id')
          .eq('id', user.id)
          .single();
        schoolId = profile?.school_id;
      }
      
      const { error } = await supabase.from('subjects').insert({
        name: validData.name,
        code: validData.code || null,
        class_id: validData.class_id || null,
        school_id: schoolId,
      });

      if (error) throw error;

      toast.success('Subject added successfully');
      setIsDialogOpen(false);
      setNewSubject({ name: '', code: '', class_id: '' });
      fetchSubjects();
    } catch (error) {
      console.error('Error adding subject:', error);
      toast.error('Failed to add subject');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteSubject = async (id: string) => {
    if (!confirm('Are you sure you want to delete this subject?')) return;

    try {
      const { error } = await supabase.from('subjects').delete().eq('id', id);
      if (error) throw error;

      toast.success('Subject deleted');
      fetchSubjects();
    } catch (error) {
      console.error('Error deleting subject:', error);
      toast.error('Failed to delete subject');
    }
  };

  const handleSeedSubjects = async () => {
    setIsSubmitting(true);
    try {
      // Fetch current user's school_id
      const { data: { user } } = await supabase.auth.getUser();
      let schoolId = null;
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('school_id')
          .eq('id', user.id)
          .single();
        schoolId = profile?.school_id;
      }
      
      const subjectsToInsert = DEFAULT_SUBJECTS.map(s => ({
        name: s.name,
        code: s.code,
        class_id: null, // General subjects for all classes
        school_id: schoolId,
      }));

      const { error } = await supabase.from('subjects').insert(subjectsToInsert);
      if (error) throw error;

      toast.success('Default subjects added successfully');
      fetchSubjects();
    } catch (error) {
      console.error('Error seeding subjects:', error);
      toast.error('Failed to add default subjects');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredSubjects = subjects.filter(subject => {
    if (filterClass === 'all') return true;
    if (filterClass === 'general') return !subject.class_id;
    return subject.class_id === filterClass;
  });

  const getClassName = (classId: string | null) => {
    if (!classId) return 'All Classes';
    const cls = CLASS_LIST_DETAILED.find(c => c.id === classId);
    return cls?.name || classId;
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <PageGradientHeader emoji="📖" title="Subjects" subtitle="Manage subjects for grade entry and report cards" gradient="from-rose-500/10 via-orange-500/5 to-amber-500/5">
          <div className="flex gap-2">
          <div className="flex gap-2">
            {subjects.length === 0 && (
              <Button variant="outline" onClick={handleSeedSubjects} disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Add Default Subjects
              </Button>
            )}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Subject
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Subject</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Subject Name *</Label>
                    <Input
                      value={newSubject.name}
                      onChange={(e) => setNewSubject(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="e.g., Mathematics"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Subject Code</Label>
                    <Input
                      value={newSubject.code}
                      onChange={(e) => setNewSubject(prev => ({ ...prev, code: e.target.value }))}
                      placeholder="e.g., MTH"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Class (Optional)</Label>
                    <Select
                      value={newSubject.class_id || "all-classes"}
                      onValueChange={(value) => setNewSubject(prev => ({ ...prev, class_id: value === "all-classes" ? "" : value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="All Classes (General)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all-classes">All Classes (General)</SelectItem>
                        {CLASS_LIST_DETAILED.map((cls) => (
                          <SelectItem key={cls.id} value={cls.id}>
                            {cls.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleAddSubject} disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                    Add Subject
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
          </div>
        </PageGradientHeader>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  Subject List
                </CardTitle>
                <CardDescription>
                  {subjects.length} subject{subjects.length !== 1 ? 's' : ''} in the system
                </CardDescription>
              </div>
              <Select value={filterClass} onValueChange={setFilterClass}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Filter by class" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Subjects</SelectItem>
                  <SelectItem value="general">General Subjects</SelectItem>
                  {CLASS_LIST_DETAILED.map((cls) => (
                    <SelectItem key={cls.id} value={cls.id}>
                      {cls.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : filteredSubjects.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                No subjects found. Add default subjects or create a new one.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Subject Name</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSubjects.map((subject) => (
                    <TableRow key={subject.id}>
                      <TableCell className="font-medium">{subject.name}</TableCell>
                      <TableCell>
                        {subject.code && (
                          <Badge variant="outline">{subject.code}</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {getClassName(subject.class_id)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteSubject(subject.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
