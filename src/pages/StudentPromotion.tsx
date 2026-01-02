import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ArrowUpRight, Users, CheckCircle2, XCircle, Loader2, AlertTriangle } from 'lucide-react';
import { CLASS_LIST, ACADEMIC_YEARS } from '@/types';
import { useStudentPromotion } from '@/hooks/useStudentPromotion';
import { toast } from 'sonner';

export default function StudentPromotion() {
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  const {
    isLoading,
    students,
    fetchStudentsForPromotion,
    promoteStudents,
    toggleStudentSelection,
    selectAll,
  } = useStudentPromotion();

  const handleFetchStudents = async () => {
    if (!selectedClass || !selectedYear) {
      toast.error('Please select class and academic year');
      return;
    }
    await fetchStudentsForPromotion(selectedClass, selectedYear);
  };

  const handlePromote = async () => {
    const success = await promoteStudents(students, selectedYear);
    if (success) {
      setShowConfirmDialog(false);
      setSelectedClass('');
    }
  };

  const eligibleCount = students.filter(s => s.isEligible).length;
  const selectedCount = students.filter(s => s.selected).length;

  return (
    <MainLayout
      title="Student Promotion"
      subtitle="Promote students to the next class"
    >
      <div className="space-y-6 animate-fade-in">
        {/* Selection Controls */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ArrowUpRight className="h-5 w-5" />
              Promotion Settings
            </CardTitle>
            <CardDescription>
              Select a class to view eligible students for promotion
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label>Current Class</Label>
                <Select value={selectedClass} onValueChange={setSelectedClass}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select class" />
                  </SelectTrigger>
                  <SelectContent>
                    {CLASS_LIST.filter(c => c !== 'SSS 3').map((cls) => (
                      <SelectItem key={cls} value={cls}>
                        {cls}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Academic Year</Label>
                <Select value={selectedYear} onValueChange={setSelectedYear}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select year" />
                  </SelectTrigger>
                  <SelectContent>
                    {ACADEMIC_YEARS.map((year) => (
                      <SelectItem key={year} value={year}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Button
                  onClick={handleFetchStudents}
                  disabled={isLoading}
                  className="w-full"
                >
                  {isLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Users className="mr-2 h-4 w-4" />
                  )}
                  Load Students
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Students List */}
        {students.length > 0 && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Students in {selectedClass}</CardTitle>
                  <CardDescription>
                    {eligibleCount} of {students.length} students eligible for promotion
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => selectAll(true)}
                  >
                    Select All
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => selectAll(false)}
                  >
                    Deselect All
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={students.every(s => s.selected)}
                        onCheckedChange={(checked) => selectAll(!!checked)}
                      />
                    </TableHead>
                    <TableHead>Student Name</TableHead>
                    <TableHead>Admission No.</TableHead>
                    <TableHead>Current Class</TableHead>
                    <TableHead>Next Class</TableHead>
                    <TableHead>Average Score</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {students.map((student) => (
                    <TableRow key={student.studentId}>
                      <TableCell>
                        <Checkbox
                          checked={student.selected}
                          onCheckedChange={() => toggleStudentSelection(student.studentId)}
                        />
                      </TableCell>
                      <TableCell className="font-medium">{student.studentName}</TableCell>
                      <TableCell>{student.admissionNumber}</TableCell>
                      <TableCell>{student.currentClass}</TableCell>
                      <TableCell>
                        {student.nextClass || (
                          <span className="text-muted-foreground">Graduate</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className={student.averageScore >= 50 ? 'text-success' : 'text-destructive'}>
                          {student.averageScore.toFixed(1)}%
                        </span>
                      </TableCell>
                      <TableCell>
                        {student.isEligible ? (
                          <Badge variant="default" className="bg-success">
                            <CheckCircle2 className="mr-1 h-3 w-3" />
                            Eligible
                          </Badge>
                        ) : (
                          <Badge variant="destructive">
                            <XCircle className="mr-1 h-3 w-3" />
                            Not Eligible
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <div className="flex justify-end mt-4">
                <Button
                  onClick={() => setShowConfirmDialog(true)}
                  disabled={selectedCount === 0}
                  className="bg-gradient-primary"
                >
                  <ArrowUpRight className="mr-2 h-4 w-4" />
                  Promote {selectedCount} Student(s)
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Confirmation Dialog */}
        <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-warning" />
                Confirm Promotion
              </DialogTitle>
              <DialogDescription>
                You are about to promote {selectedCount} student(s) from {selectedClass} to the next class.
                This action cannot be undone.
              </DialogDescription>
            </DialogHeader>

            <div className="py-4">
              <h4 className="font-medium mb-2">Students to be promoted:</h4>
              <ul className="text-sm text-muted-foreground space-y-1 max-h-40 overflow-y-auto">
                {students.filter(s => s.selected).map(s => (
                  <li key={s.studentId}>
                    • {s.studentName} → {s.nextClass}
                  </li>
                ))}
              </ul>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handlePromote} disabled={isLoading}>
                {isLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                )}
                Confirm Promotion
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}
