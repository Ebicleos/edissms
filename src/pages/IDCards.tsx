import { useState, useMemo, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CLASS_LIST_DETAILED } from '@/types';
import { Search, Printer, Download, User, QrCode, School } from 'lucide-react';
import { useStudents } from '@/hooks/useStudents';
import { useSchoolSettings } from '@/hooks/useSchoolSettings';
import { useSignedPhotoUrl } from '@/hooks/useSignedPhotoUrl';

export default function IDCards() {
  const { students, isLoading } = useStudents();
  const { settings: schoolSettings } = useSchoolSettings();
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [classFilter, setClassFilter] = useState('all');
  const [imageLoaded, setImageLoaded] = useState(false);

  const filteredStudents = useMemo(() => {
    return students.filter((student) => {
      const matchesSearch = student.fullName.toLowerCase().includes(search.toLowerCase()) ||
        student.admissionNumber.toLowerCase().includes(search.toLowerCase());
      const matchesClass = classFilter === 'all' || student.classId === classFilter;
      return matchesSearch && matchesClass;
    });
  }, [students, search, classFilter]);

  const selectedStudent = useMemo(() => {
    return students.find((s) => s.id === selectedStudentId) || null;
  }, [students, selectedStudentId]);

  const { signedUrl: studentPhotoUrl, isLoading: photoLoading } = useSignedPhotoUrl(selectedStudent?.photoUrl || null);

  // Reset image loaded state when student changes
  useEffect(() => {
    setImageLoaded(false);
  }, [selectedStudentId]);

  // Preload image when URL is available
  useEffect(() => {
    if (studentPhotoUrl) {
      const img = new Image();
      img.src = studentPhotoUrl;
      img.onload = () => setImageLoaded(true);
      img.onerror = () => setImageLoaded(true);
    }
  }, [studentPhotoUrl]);

  return (
    <MainLayout title="Student ID Cards" subtitle="Generate and manage student identification cards">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-fade-in">
        {/* Left Column - Student Selection */}
        <div className="space-y-4">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search student..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={classFilter} onValueChange={setClassFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All Classes" />
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

          <div className="bg-card rounded-xl border border-border/50 shadow-sm divide-y divide-border max-h-[600px] overflow-y-auto">
            {isLoading ? (
              <div className="p-4 text-muted-foreground">Loading students...</div>
            ) : filteredStudents.length === 0 ? (
              <div className="p-4 text-muted-foreground">No students found</div>
            ) : (
              filteredStudents.slice(0, 50).map((student) => (
                <button
                  key={student.id}
                  onClick={() => setSelectedStudentId(student.id)}
                  className={`w-full flex items-center gap-4 p-4 text-left hover:bg-muted/30 transition-colors ${
                    selectedStudentId === student.id ? 'bg-primary/5' : ''
                  }`}
                >
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-foreground">{student.fullName}</p>
                    <p className="text-sm text-muted-foreground">{student.admissionNumber}</p>
                  </div>
                  <Badge variant="secondary">{student.className}</Badge>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Right Column - ID Card Preview */}
        <div className="space-y-4">
          <h3 className="font-semibold text-foreground">ID Card Preview</h3>
          
          {selectedStudent ? (
            <>
              {/* ID Card */}
              <div className="bg-card rounded-2xl border-2 border-primary/20 shadow-lg overflow-hidden max-w-sm mx-auto">
                {/* Header */}
                <div className="bg-gradient-primary p-4 text-center text-primary-foreground">
                  <div className="flex items-center justify-center gap-2 mb-1">
                    {schoolSettings.logo_url ? (
                      <img src={schoolSettings.logo_url} alt="School Logo" className="h-8 w-8 object-contain rounded" />
                    ) : (
                      <School className="h-6 w-6" />
                    )}
                    <span className="font-bold text-lg">{schoolSettings.school_name}</span>
                  </div>
                  <p className="text-xs opacity-90">{schoolSettings.motto}</p>
                </div>

                {/* Body */}
                <div className="p-6 text-center">
                {/* Photo */}
                <div className="h-28 w-28 mx-auto rounded-full bg-muted border-4 border-primary/20 flex items-center justify-center mb-4 overflow-hidden">
                  {photoLoading || (studentPhotoUrl && !imageLoaded) ? (
                    <Skeleton className="h-full w-full rounded-full" />
                  ) : studentPhotoUrl && imageLoaded ? (
                    <img
                      src={studentPhotoUrl}
                      alt={selectedStudent.fullName}
                      className="h-full w-full rounded-full object-cover"
                    />
                  ) : (
                    <User className="h-14 w-14 text-muted-foreground" />
                  )}
                </div>

                  {/* Details */}
                  <h4 className="font-bold text-xl text-foreground mb-1">{selectedStudent.fullName}</h4>
                  <p className="text-sm text-muted-foreground mb-3">{selectedStudent.className}</p>
                  
                  <div className="bg-muted/50 rounded-lg p-3 mb-4">
                    <p className="text-xs text-muted-foreground mb-1">Admission Number</p>
                    <p className="font-mono font-bold text-primary">{selectedStudent.admissionNumber}</p>
                  </div>

                  {/* QR Code placeholder */}
                  <div className="inline-flex items-center justify-center h-20 w-20 bg-foreground rounded-lg">
                    <QrCode className="h-16 w-16 text-background" />
                  </div>
                </div>

                {/* Footer */}
                <div className="bg-muted/50 p-3 text-center text-xs text-muted-foreground">
                  <p>Valid for Academic Year {schoolSettings.academic_year}</p>
                  <p>If found, please return to school</p>
                  {schoolSettings.phone && <p>Tel: {schoolSettings.phone}</p>}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 justify-center">
                <Button variant="outline">
                  <Printer className="mr-2 h-4 w-4" />
                  Print ID Card
                </Button>
                <Button className="bg-gradient-primary hover:opacity-90">
                  <Download className="mr-2 h-4 w-4" />
                  Download PDF
                </Button>
              </div>
            </>
          ) : (
            <div className="bg-card rounded-xl border border-border/50 p-12 shadow-sm text-center">
              <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">Select a Student</h3>
              <p className="text-muted-foreground">
                Choose a student from the list to preview and generate their ID card
              </p>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
