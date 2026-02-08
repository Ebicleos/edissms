import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from '@/components/ui/pagination';
import { useStudents } from '@/hooks/useStudents';
import { useSchoolSettings } from '@/hooks/useSchoolSettings';
import { CLASS_LIST_DETAILED, Student, Term, getCurrentAcademicYear } from '@/types';
import { EditStudentDialog } from '@/components/students/EditStudentDialog';
import { BulkStudentImportDialog } from '@/components/students/BulkStudentImportDialog';
import { printReceipt } from '@/utils/printReceipt';
import { Plus, Search, Filter, MoreVertical, Eye, Edit, Trash2, Printer, IdCard, Camera, Upload, Download, Loader2 } from 'lucide-react';
import { PageGradientHeader } from '@/components/ui/page-gradient-header';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

export default function Students() {
  const { 
    students, 
    deleteStudent, 
    updateStudent, 
    bulkAddStudents,
    totalStudents,
    isLoading,
    pagination,
    setPage,
    setPageSize,
    updateFilters,
  } = useStudents();
  const { settings: schoolSettings } = useSchoolSettings();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [classFilter, setClassFilter] = useState('all');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [bulkImportOpen, setBulkImportOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Debounce search to avoid too many API calls
  useEffect(() => {
    const timer = setTimeout(() => {
      updateFilters(search, classFilter);
    }, 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, classFilter]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const handleViewDetails = (student: Student) => {
    setSelectedStudent(student);
    setViewDialogOpen(true);
  };

  const handleEditStudent = (student: Student) => {
    setSelectedStudent(student);
    setEditDialogOpen(true);
  };

  const handleSaveStudent = (updatedStudent: Student) => {
    if (updateStudent) {
      updateStudent(updatedStudent.id, updatedStudent);
    }
    setEditDialogOpen(false);
    setSelectedStudent(null);
  };

  const handlePrintReceipt = async (student: Student) => {
    const { data: feeData } = await supabase
      .from('fee_payments')
      .select('*')
      .eq('student_id', student.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!feeData) {
      toast.error('No fee record found for this student');
      return;
    }

    printReceipt({
      studentName: student.fullName,
      admissionNumber: student.admissionNumber,
      className: student.className,
      guardianName: student.guardianName,
      phoneContact: student.phoneContact,
      amountPaid: Number(feeData.amount_paid),
      totalFee: Number(feeData.amount_payable),
      balance: Number(feeData.balance),
      term: feeData.term,
      academicYear: feeData.academic_year,
      paymentDate: feeData.last_payment_date || undefined,
    }, schoolSettings);
    
    toast.success(`Printing receipt for ${student.fullName}`);
  };

  const handleGenerateIDCard = (student: Student) => {
    navigate(`/id-cards?student=${student.id}`);
    toast.success(`Generating ID Card for ${student.fullName}`);
  };

  const handleUploadPhoto = (student: Student) => {
    toast.info(`Photo upload for ${student.fullName}`, {
      description: 'Use the Edit Student option to upload a photo.',
    });
    handleEditStudent(student);
  };

  const handleDeleteClick = (student: Student) => {
    setSelectedStudent(student);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (selectedStudent) {
      deleteStudent(selectedStudent.id);
      toast.success(`${selectedStudent.fullName} has been deleted`);
      setDeleteDialogOpen(false);
      setSelectedStudent(null);
    }
  };

  const handleExportStudents = async () => {
    setIsExporting(true);
    try {
      // Fetch ALL students (not just current page)
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Please log in to export students');
        return;
      }
      
      const { data: profile } = await supabase
        .from('profiles')
        .select('school_id')
        .eq('id', user.id)
        .single();
      
      if (!profile?.school_id) {
        toast.error('No school found');
        return;
      }

      const { data: allStudents, error } = await supabase
        .from('students')
        .select('*')
        .eq('school_id', profile.school_id)
        .order('full_name');

      if (error) {
        console.error('Error exporting students:', error);
        toast.error('Failed to export students');
        return;
      }

      if (!allStudents || allStudents.length === 0) {
        toast.error('No students to export');
        return;
      }

      // Convert to CSV format
      const headers = [
        'Admission Number',
        'Full Name',
        'Date of Birth',
        'Gender',
        'Class ID',
        'Guardian Name',
        'Address',
        'Phone Contact',
        'Email',
        'Admission Fee',
        'Academic Year',
        'Term',
        'Date of Admission'
      ];

      const rows = allStudents.map(s => [
        s.admission_number || '',
        s.full_name || '',
        s.date_of_birth || '',
        s.gender || '',
        s.class_id || '',
        s.guardian_name || '',
        s.address || '',
        s.phone_contact || '',
        s.email || '',
        s.admission_fee || '',
        s.academic_year || '',
        s.term || '',
        s.date_of_admission || ''
      ]);

      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => 
          `"${String(cell).replace(/"/g, '""')}"`
        ).join(','))
      ].join('\n');

      // Download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `students_export_${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
      URL.revokeObjectURL(url);

      toast.success(`Exported ${allStudents.length} students`);
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export students');
    } finally {
      setIsExporting(false);
    }
  };

  // Generate page numbers for pagination
  const getPageNumbers = () => {
    const pages: (number | 'ellipsis')[] = [];
    const { currentPage, totalPages } = pagination;
    
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    
    pages.push(1);
    
    if (currentPage > 3) {
      pages.push('ellipsis');
    }
    
    const start = Math.max(2, currentPage - 1);
    const end = Math.min(totalPages - 1, currentPage + 1);
    
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    
    if (currentPage < totalPages - 2) {
      pages.push('ellipsis');
    }
    
    if (totalPages > 1) {
      pages.push(totalPages);
    }
    
    return pages;
  };

  return (
    <MainLayout>
      <div className="space-y-4 md:space-y-6 animate-fade-in">
        <PageGradientHeader emoji="🎓" title="Students Database" subtitle={`${totalStudents} registered students`} gradient="from-accent/10 via-emerald-500/5 to-cyan-500/5" />
        {/* Header Actions */}
        <div className="flex flex-col gap-3 md:gap-4">
          <div className="flex gap-2 md:gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search students..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={classFilter} onValueChange={setClassFilter}>
              <SelectTrigger className="w-28 md:w-40">
                <Filter className="h-4 w-4 mr-1 md:mr-2" />
                <SelectValue placeholder="Class" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Classes</SelectItem>
                {CLASS_LIST_DETAILED.map((cls) => (
                  <SelectItem key={cls.id} value={cls.id}>
                    {cls.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2 md:self-end">
            <Button variant="outline" onClick={handleExportStudents} disabled={isExporting}>
              {isExporting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Download className="mr-2 h-4 w-4" />
              )}
              Export CSV
            </Button>
            <Button variant="outline" onClick={() => setBulkImportOpen(true)}>
              <Upload className="mr-2 h-4 w-4" />
              Bulk Import
            </Button>
            <Button asChild className="bg-gradient-primary hover:opacity-90">
              <Link to="/admission">
                <Plus className="mr-2 h-4 w-4" />
                New Admission
              </Link>
            </Button>
          </div>
        </div>

        {/* Page Size Selector */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Show</span>
          <Select value={String(pagination.pageSize)} onValueChange={(v) => setPageSize(Number(v))}>
            <SelectTrigger className="w-20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="25">25</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
            </SelectContent>
          </Select>
          <span className="text-sm text-muted-foreground">per page</span>
        </div>

        {/* Mobile Card View */}
        <div className="md:hidden space-y-3">
          {isLoading ? (
            <div className="text-center py-10 text-muted-foreground">Loading...</div>
          ) : students.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">No students found</div>
          ) : (
            students.map((student) => (
              <div key={student.id} className="bg-card rounded-xl border border-border/50 p-4 shadow-sm">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                      {student.photoUrl ? (
                        <img src={student.photoUrl} alt={student.fullName} className="h-full w-full object-cover" />
                      ) : (
                        <span className="text-sm font-semibold text-primary">
                          {student.fullName.split(' ').map((n) => n[0]).join('')}
                        </span>
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{student.fullName}</p>
                      <Badge variant="outline" className="font-mono text-xs mt-1">
                        {student.admissionNumber}
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
                      <DropdownMenuItem onClick={() => handleViewDetails(student)}>
                        <Eye className="mr-2 h-4 w-4" />
                        View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleEditStudent(student)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handlePrintReceipt(student)}>
                        <Printer className="mr-2 h-4 w-4" />
                        Print Receipt
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleGenerateIDCard(student)}>
                        <IdCard className="mr-2 h-4 w-4" />
                        ID Card
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive" onClick={() => handleDeleteClick(student)}>
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Class:</span> {student.className}
                  </div>
                  <div>
                    <Badge variant={student.gender === 'male' ? 'secondary' : 'default'} className="text-xs">
                      {student.gender === 'male' ? 'Male' : 'Female'}
                    </Badge>
                  </div>
                  <div className="col-span-2">
                    <span className="text-muted-foreground">Guardian:</span> {student.guardianName}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Desktop Table View */}
        <div className="hidden md:block bg-card rounded-xl border border-border/50 shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Student</TableHead>
                <TableHead>Admission No.</TableHead>
                <TableHead>Class</TableHead>
                <TableHead>Gender</TableHead>
                <TableHead>Guardian</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Admission Fee</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-10">
                    <p className="text-muted-foreground">Loading...</p>
                  </TableCell>
                </TableRow>
              ) : students.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-10">
                    <p className="text-muted-foreground">No students found</p>
                  </TableCell>
                </TableRow>
              ) : (
                students.map((student) => (
                  <TableRow key={student.id} className="hover:bg-muted/30">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                          {student.photoUrl ? (
                            <img src={student.photoUrl} alt={student.fullName} className="h-full w-full object-cover" />
                          ) : (
                            <span className="text-sm font-semibold text-primary">
                              {student.fullName.split(' ').map((n) => n[0]).join('')}
                            </span>
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{student.fullName}</p>
                          <p className="text-sm text-muted-foreground">Age: {student.age}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-mono">
                        {student.admissionNumber}
                      </Badge>
                    </TableCell>
                    <TableCell>{student.className}</TableCell>
                    <TableCell>
                      <Badge variant={student.gender === 'male' ? 'secondary' : 'default'}>
                        {student.gender === 'male' ? 'M' : 'F'}
                      </Badge>
                    </TableCell>
                    <TableCell>{student.guardianName}</TableCell>
                    <TableCell className="text-muted-foreground">{student.phoneContact}</TableCell>
                    <TableCell className="font-medium">{formatCurrency(student.admissionFee)}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleViewDetails(student)}>
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEditStudent(student)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit Student
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleUploadPhoto(student)}>
                            <Camera className="mr-2 h-4 w-4" />
                            Upload Photo
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handlePrintReceipt(student)}>
                            <Printer className="mr-2 h-4 w-4" />
                            Print Receipt
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleGenerateIDCard(student)}>
                            <IdCard className="mr-2 h-4 w-4" />
                            Generate ID Card
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive" onClick={() => handleDeleteClick(student)}>
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <p>
            Showing {((pagination.currentPage - 1) * pagination.pageSize) + 1} to{' '}
            {Math.min(pagination.currentPage * pagination.pageSize, totalStudents)} of {totalStudents} students
          </p>
          
          {pagination.totalPages > 1 && (
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious 
                    onClick={() => setPage(pagination.currentPage - 1)}
                    className={pagination.currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                  />
                </PaginationItem>
                
                {getPageNumbers().map((page, index) => (
                  <PaginationItem key={index}>
                    {page === 'ellipsis' ? (
                      <PaginationEllipsis />
                    ) : (
                      <PaginationLink
                        onClick={() => setPage(page)}
                        isActive={page === pagination.currentPage}
                        className="cursor-pointer"
                      >
                        {page}
                      </PaginationLink>
                    )}
                  </PaginationItem>
                ))}
                
                <PaginationItem>
                  <PaginationNext 
                    onClick={() => setPage(pagination.currentPage + 1)}
                    className={pagination.currentPage === pagination.totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}
        </div>
      </div>

      {/* View Details Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Student Details</DialogTitle>
            <DialogDescription>
              Complete information about the student
            </DialogDescription>
          </DialogHeader>
          {selectedStudent && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                  {selectedStudent.photoUrl ? (
                    <img src={selectedStudent.photoUrl} alt={selectedStudent.fullName} className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-xl font-semibold text-primary">
                      {selectedStudent.fullName.split(' ').map((n) => n[0]).join('')}
                    </span>
                  )}
                </div>
                <div>
                  <p className="font-semibold text-lg">{selectedStudent.fullName}</p>
                  <Badge variant="outline">{selectedStudent.admissionNumber}</Badge>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Class</p>
                  <p className="font-medium">{selectedStudent.className}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Age</p>
                  <p className="font-medium">{selectedStudent.age} years</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Gender</p>
                  <p className="font-medium capitalize">{selectedStudent.gender}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Date of Birth</p>
                  <p className="font-medium">{selectedStudent.dateOfBirth}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Guardian</p>
                  <p className="font-medium">{selectedStudent.guardianName}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Phone</p>
                  <p className="font-medium">{selectedStudent.phoneContact}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-muted-foreground">Address</p>
                  <p className="font-medium">{selectedStudent.address}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Admission Fee</p>
                  <p className="font-medium">{formatCurrency(selectedStudent.admissionFee)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Admission Date</p>
                  <p className="font-medium">{selectedStudent.dateOfAdmission}</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Student Dialog */}
      <EditStudentDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        student={selectedStudent}
        onSave={handleSaveStudent}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete {selectedStudent?.fullName}'s record. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Import Dialog */}
      <BulkStudentImportDialog
        open={bulkImportOpen}
        onOpenChange={setBulkImportOpen}
        onImport={bulkAddStudents}
        academicYear={schoolSettings?.academic_year || getCurrentAcademicYear()}
        term={(schoolSettings?.term?.toLowerCase().includes('first') ? 'first' : 
               schoolSettings?.term?.toLowerCase().includes('second') ? 'second' : 'third') as Term}
      />
    </MainLayout>
  );
}
