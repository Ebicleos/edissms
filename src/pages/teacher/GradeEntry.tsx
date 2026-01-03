import React, { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Save, Loader2, BookOpen, Users, Calculator } from 'lucide-react';
import { useGradeEntry } from '@/hooks/useGradeEntry';
import { CLASS_LIST_DETAILED, ACADEMIC_YEARS } from '@/types';

const TERMS = ['First Term', 'Second Term', 'Third Term'];

export default function GradeEntry() {
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedTerm, setSelectedTerm] = useState('First Term');
  const [selectedYear, setSelectedYear] = useState(ACADEMIC_YEARS[1]);

  const {
    subjects,
    students,
    isLoading,
    isSaving,
    fetchSubjects,
    fetchStudentsWithGrades,
    updateStudentScore,
    saveGrades,
  } = useGradeEntry();

  useEffect(() => {
    if (selectedClass) {
      fetchSubjects(selectedClass);
    }
  }, [selectedClass, fetchSubjects]);

  useEffect(() => {
    if (selectedClass && selectedSubject && selectedTerm && selectedYear) {
      fetchStudentsWithGrades(selectedClass, selectedSubject, selectedTerm, selectedYear);
    }
  }, [selectedClass, selectedSubject, selectedTerm, selectedYear, fetchStudentsWithGrades]);

  const handleScoreChange = (
    studentId: string,
    field: 'ca1_score' | 'ca2_score' | 'ca3_score' | 'exam_score',
    value: string
  ) => {
    const numValue = Math.max(0, Math.min(field === 'exam_score' ? 70 : 10, Number(value) || 0));
    updateStudentScore(studentId, field, numValue);
  };

  const handleSave = async () => {
    if (selectedClass && selectedSubject && selectedTerm && selectedYear) {
      await saveGrades(selectedClass, selectedSubject, selectedTerm, selectedYear);
    }
  };

  const getGradeBadgeVariant = (grade: string) => {
    if (['A', 'B+', 'B'].includes(grade)) return 'default';
    if (['C'].includes(grade)) return 'secondary';
    if (['D'].includes(grade)) return 'outline';
    return 'destructive';
  };

  const canLoadStudents = selectedClass && selectedSubject && selectedTerm && selectedYear;
  const canSave = canLoadStudents && students.length > 0;

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Grade Entry</h1>
            <p className="text-muted-foreground">
              Enter CA scores and exam marks for students
            </p>
          </div>
          <Button onClick={handleSave} disabled={!canSave || isSaving}>
            {isSaving ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Save All Grades
          </Button>
        </div>

        {/* Filter Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Select Class & Subject
            </CardTitle>
            <CardDescription>
              Choose the class, subject, term, and academic year to enter grades
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label>Class</Label>
                <Select value={selectedClass} onValueChange={setSelectedClass}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select class" />
                  </SelectTrigger>
                  <SelectContent>
                    {CLASS_LIST_DETAILED.map((cls) => (
                      <SelectItem key={cls.id} value={cls.id}>
                        {cls.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Subject</Label>
                <Select 
                  value={selectedSubject} 
                  onValueChange={setSelectedSubject}
                  disabled={!selectedClass}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select subject" />
                  </SelectTrigger>
                  <SelectContent>
                    {subjects.map((subject) => (
                      <SelectItem key={subject.id} value={subject.name}>
                        {subject.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Term</Label>
                <Select value={selectedTerm} onValueChange={setSelectedTerm}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select term" />
                  </SelectTrigger>
                  <SelectContent>
                    {TERMS.map((term) => (
                      <SelectItem key={term} value={term}>
                        {term}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
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
            </div>
          </CardContent>
        </Card>

        {/* Grade Entry Table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="h-5 w-5" />
              Student Grades
              {students.length > 0 && (
                <Badge variant="secondary">{students.length} students</Badge>
              )}
            </CardTitle>
            <CardDescription>
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1">
                  <Calculator className="h-4 w-4" />
                  CA1, CA2, CA3: Max 10 each | Exam: Max 70
                </span>
              </div>
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!canLoadStudents ? (
              <div className="text-center py-12 text-muted-foreground">
                Please select a class, subject, term, and academic year to load students
              </div>
            ) : isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : students.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                No students found in this class
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[50px]">S/N</TableHead>
                      <TableHead>Student Name</TableHead>
                      <TableHead>Adm. No.</TableHead>
                      <TableHead className="text-center w-[80px]">CA1 (10)</TableHead>
                      <TableHead className="text-center w-[80px]">CA2 (10)</TableHead>
                      <TableHead className="text-center w-[80px]">CA3 (10)</TableHead>
                      <TableHead className="text-center w-[80px]">Exam (70)</TableHead>
                      <TableHead className="text-center w-[80px]">Total</TableHead>
                      <TableHead className="text-center w-[80px]">Grade</TableHead>
                      <TableHead>Remarks</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {students.map((student, index) => (
                      <TableRow key={student.student_id}>
                        <TableCell className="font-medium">{index + 1}</TableCell>
                        <TableCell className="font-medium">{student.student_name}</TableCell>
                        <TableCell className="text-muted-foreground">{student.admission_number}</TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min={0}
                            max={10}
                            value={student.ca1_score || ''}
                            onChange={(e) => handleScoreChange(student.student_id, 'ca1_score', e.target.value)}
                            className="w-16 text-center"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min={0}
                            max={10}
                            value={student.ca2_score || ''}
                            onChange={(e) => handleScoreChange(student.student_id, 'ca2_score', e.target.value)}
                            className="w-16 text-center"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min={0}
                            max={10}
                            value={student.ca3_score || ''}
                            onChange={(e) => handleScoreChange(student.student_id, 'ca3_score', e.target.value)}
                            className="w-16 text-center"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min={0}
                            max={70}
                            value={student.exam_score || ''}
                            onChange={(e) => handleScoreChange(student.student_id, 'exam_score', e.target.value)}
                            className="w-16 text-center"
                          />
                        </TableCell>
                        <TableCell className="text-center font-bold">
                          {student.total_score}
                        </TableCell>
                        <TableCell className="text-center">
                          {student.grade && (
                            <Badge variant={getGradeBadgeVariant(student.grade)}>
                              {student.grade}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {student.remarks}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
