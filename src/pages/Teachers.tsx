import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Plus, Search, Mail, Phone, BookOpen, MoreVertical, Loader2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { CLASS_LIST_DETAILED } from '@/types';
import { Checkbox } from '@/components/ui/checkbox';

interface Teacher {
  id: string;
  user_id: string | null;
  full_name: string;
  email: string;
  phone: string | null;
  subject: string;
  classes: string[];
}

export default function Teachers() {
  const [search, setSearch] = useState('');
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [assignClassesOpen, setAssignClassesOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Form state
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formSubject, setFormSubject] = useState('');
  const [selectedClassIds, setSelectedClassIds] = useState<string[]>([]);

  useEffect(() => {
    fetchTeachers();
  }, []);

  const fetchTeachers = async () => {
    // Fetch all teachers first
    const { data: teachersData, error: teachersError } = await supabase
      .from('teachers')
      .select('*')
      .order('full_name');

    if (teachersError || !teachersData) {
      console.error('Error fetching teachers:', teachersError);
      setIsLoading(false);
      return;
    }

    // Fetch all class assignments (both by user_id and teacher_record_id)
    const { data: classesData } = await supabase
      .from('teacher_classes')
      .select('teacher_id, teacher_record_id, class_id');

    // Build maps for both types of assignments
    const classAssignmentsByUserId: Record<string, string[]> = {};
    const classAssignmentsByRecordId: Record<string, string[]> = {};

    if (classesData) {
      classesData.forEach(tc => {
        if (tc.teacher_id) {
          if (!classAssignmentsByUserId[tc.teacher_id]) {
            classAssignmentsByUserId[tc.teacher_id] = [];
          }
          classAssignmentsByUserId[tc.teacher_id].push(tc.class_id);
        }
        if (tc.teacher_record_id) {
          if (!classAssignmentsByRecordId[tc.teacher_record_id]) {
            classAssignmentsByRecordId[tc.teacher_record_id] = [];
          }
          classAssignmentsByRecordId[tc.teacher_record_id].push(tc.class_id);
        }
      });
    }

    const formattedTeachers = teachersData.map(t => ({
      id: t.id,
      user_id: t.user_id,
      full_name: t.full_name,
      email: t.email,
      phone: t.phone,
      subject: t.subject,
      // Use user_id assignments if available, otherwise use record_id assignments
      classes: t.user_id 
        ? (classAssignmentsByUserId[t.user_id] || []) 
        : (classAssignmentsByRecordId[t.id] || []),
    }));

    setTeachers(formattedTeachers);
    setIsLoading(false);
  };

  const filteredTeachers = teachers.filter((teacher) =>
    teacher.full_name.toLowerCase().includes(search.toLowerCase()) ||
    teacher.subject.toLowerCase().includes(search.toLowerCase())
  );

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const handleViewProfile = (teacher: Teacher) => {
    setSelectedTeacher(teacher);
    setViewDialogOpen(true);
  };

  const handleEditDetails = (teacher: Teacher) => {
    setSelectedTeacher(teacher);
    setFormName(teacher.full_name);
    setFormEmail(teacher.email);
    setFormPhone(teacher.phone || '');
    setFormSubject(teacher.subject);
    setEditDialogOpen(true);
  };

  const handleAssignClasses = (teacher: Teacher) => {
    setSelectedTeacher(teacher);
    setSelectedClassIds(teacher.classes);
    setAssignClassesOpen(true);
  };

  const toggleClassSelection = (classId: string) => {
    setSelectedClassIds(prev => 
      prev.includes(classId) 
        ? prev.filter(id => id !== classId)
        : [...prev, classId]
    );
  };

  const getClassNameById = (classId: string) => {
    const cls = CLASS_LIST_DETAILED.find(c => c.id === classId);
    return cls?.name || classId;
  };

  const handleDeleteClick = (teacher: Teacher) => {
    setSelectedTeacher(teacher);
    setDeleteDialogOpen(true);
  };

  const handleAddTeacher = () => {
    setFormName('');
    setFormEmail('');
    setFormPhone('');
    setFormSubject('');
    setAddDialogOpen(true);
  };

  const handleSaveNewTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName || !formEmail || !formSubject) {
      toast.error('Please fill all required fields');
      return;
    }

    setIsSaving(true);
    
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
    
    const { error } = await supabase.from('teachers').insert({
      full_name: formName,
      email: formEmail,
      phone: formPhone || null,
      subject: formSubject,
      school_id: schoolId,
    });

    setIsSaving(false);

    if (error) {
      toast.error('Failed to add teacher');
      console.error('Error adding teacher:', error);
      return;
    }

    toast.success('Teacher added successfully!');
    setAddDialogOpen(false);
    fetchTeachers();
  };

  const handleUpdateTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTeacher) return;

    setIsSaving(true);
    const { error } = await supabase
      .from('teachers')
      .update({
        full_name: formName,
        email: formEmail,
        phone: formPhone || null,
        subject: formSubject,
      })
      .eq('id', selectedTeacher.id);

    setIsSaving(false);

    if (error) {
      toast.error('Failed to update teacher');
      return;
    }

    toast.success('Teacher updated successfully!');
    setEditDialogOpen(false);
    fetchTeachers();
  };

  const handleSaveClasses = async () => {
    if (!selectedTeacher) return;

    setIsSaving(true);

    // Determine which field to use based on whether teacher has a user_id
    const hasUserId = !!selectedTeacher.user_id;

    // Delete existing class assignments using the appropriate field
    if (hasUserId) {
      await supabase
        .from('teacher_classes')
        .delete()
        .eq('teacher_id', selectedTeacher.user_id);
    } else {
      await supabase
        .from('teacher_classes')
        .delete()
        .eq('teacher_record_id', selectedTeacher.id);
    }

    // Add new class assignments
    if (selectedClassIds.length > 0) {
      const classInserts = selectedClassIds.map(classId => 
        hasUserId 
          ? { teacher_id: selectedTeacher.user_id, class_id: classId }
          : { teacher_record_id: selectedTeacher.id, class_id: classId }
      );

      const { error } = await supabase.from('teacher_classes').insert(classInserts);
      if (error) {
        console.error('Error assigning classes:', error);
        toast.error('Failed to assign classes');
        setIsSaving(false);
        return;
      }
    }

    setIsSaving(false);
    toast.success('Classes assigned successfully!');
    setAssignClassesOpen(false);
    fetchTeachers();
  };

  const handleConfirmDelete = async () => {
    if (!selectedTeacher) return;

    setIsSaving(true);
    const { error } = await supabase
      .from('teachers')
      .delete()
      .eq('id', selectedTeacher.id);

    setIsSaving(false);

    if (error) {
      toast.error('Failed to remove teacher');
      return;
    }

    toast.success('Teacher removed successfully!');
    setDeleteDialogOpen(false);
    fetchTeachers();
  };

  if (isLoading) {
    return (
      <MainLayout title="Teachers" subtitle="Loading...">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Teachers" subtitle={`${teachers.length} teaching staff`}>
      <div className="space-y-6 animate-fade-in">
        {/* Header Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or subject..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button className="bg-gradient-primary hover:opacity-90" onClick={handleAddTeacher}>
            <Plus className="mr-2 h-4 w-4" />
            Add Teacher
          </Button>
        </div>

        {/* Teachers Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTeachers.length === 0 ? (
            <div className="col-span-full text-center py-12 text-muted-foreground">
              No teachers found
            </div>
          ) : (
            filteredTeachers.map((teacher) => (
              <Card key={teacher.id} className="card-hover">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="h-14 w-14 rounded-full bg-gradient-primary flex items-center justify-center">
                        <span className="text-lg font-bold text-primary-foreground">
                          {getInitials(teacher.full_name)}
                        </span>
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground">{teacher.full_name}</h3>
                        <Badge variant="secondary" className="mt-1">
                          <BookOpen className="h-3 w-3 mr-1" />
                          {teacher.subject}
                        </Badge>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleViewProfile(teacher)}>
                          View Profile
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleEditDetails(teacher)}>
                          Edit Details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleAssignClasses(teacher)}>
                          Assign Classes
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="text-destructive"
                          onClick={() => handleDeleteClick(teacher)}
                        >
                          Remove
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Mail className="h-4 w-4" />
                      <span>{teacher.email}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Phone className="h-4 w-4" />
                      <span>{teacher.phone || 'No phone'}</span>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-border">
                    <p className="text-sm text-muted-foreground mb-2">Assigned Classes</p>
                    <div className="flex flex-wrap gap-2">
                      {teacher.classes.length > 0 ? (
                        teacher.classes.map((cls) => (
                          <Badge key={cls} variant="outline" className="text-xs">
                            {getClassNameById(cls)}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-xs text-muted-foreground">No classes assigned</span>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>

      {/* View Profile Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Teacher Profile</DialogTitle>
            <DialogDescription>Detailed information about the teacher</DialogDescription>
          </DialogHeader>
          {selectedTeacher && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-full bg-gradient-primary flex items-center justify-center">
                  <span className="text-xl font-bold text-primary-foreground">
                    {getInitials(selectedTeacher.full_name)}
                  </span>
                </div>
                <div>
                  <h3 className="font-semibold text-lg">{selectedTeacher.full_name}</h3>
                  <p className="text-muted-foreground">{selectedTeacher.subject} Teacher</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Email</p>
                  <p className="font-medium">{selectedTeacher.email}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Phone</p>
                  <p className="font-medium">{selectedTeacher.phone || 'N/A'}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-muted-foreground">Classes</p>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {selectedTeacher.classes.length > 0 ? (
                      selectedTeacher.classes.map((cls) => (
                        <Badge key={cls} variant="secondary">{getClassNameById(cls)}</Badge>
                      ))
                    ) : (
                      <span className="text-muted-foreground">No classes assigned</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Add Teacher Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Teacher</DialogTitle>
            <DialogDescription>Enter the teacher's information</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSaveNewTeacher} className="space-y-4">
            <div>
              <Label htmlFor="name">Full Name *</Label>
              <Input
                id="name"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formEmail}
                onChange={(e) => setFormEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={formPhone}
                onChange={(e) => setFormPhone(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="subject">Subject *</Label>
              <Input
                id="subject"
                value={formSubject}
                onChange={(e) => setFormSubject(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full bg-gradient-primary hover:opacity-90" disabled={isSaving}>
              {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Add Teacher
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Teacher Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Teacher</DialogTitle>
            <DialogDescription>Update teacher information</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdateTeacher} className="space-y-4">
            <div>
              <Label htmlFor="editName">Full Name</Label>
              <Input
                id="editName"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="editEmail">Email</Label>
              <Input
                id="editEmail"
                type="email"
                value={formEmail}
                onChange={(e) => setFormEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="editPhone">Phone</Label>
              <Input
                id="editPhone"
                value={formPhone}
                onChange={(e) => setFormPhone(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="editSubject">Subject</Label>
              <Input
                id="editSubject"
                value={formSubject}
                onChange={(e) => setFormSubject(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full bg-gradient-primary hover:opacity-90" disabled={isSaving}>
              {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Save Changes
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Assign Classes Dialog */}
      <Dialog open={assignClassesOpen} onOpenChange={setAssignClassesOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Classes</DialogTitle>
            <DialogDescription>
              Select the classes this teacher will be assigned to
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 max-h-64 overflow-y-auto">
              {CLASS_LIST_DETAILED.map((cls) => (
                <div 
                  key={cls.id}
                  className="flex items-center space-x-2 p-2 rounded-lg hover:bg-muted/50 cursor-pointer"
                  onClick={() => toggleClassSelection(cls.id)}
                >
                  <Checkbox 
                    id={cls.id}
                    checked={selectedClassIds.includes(cls.id)}
                    onCheckedChange={() => toggleClassSelection(cls.id)}
                  />
                  <label htmlFor={cls.id} className="text-sm cursor-pointer flex-1">
                    {cls.name}
                  </label>
                </div>
              ))}
            </div>
            <div className="text-sm text-muted-foreground">
              {selectedClassIds.length} class(es) selected
            </div>
            <Button 
              className="w-full bg-gradient-primary hover:opacity-90" 
              onClick={handleSaveClasses}
              disabled={isSaving}
            >
              {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Save Classes
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Teacher</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove {selectedTeacher?.full_name}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MainLayout>
  );
}
