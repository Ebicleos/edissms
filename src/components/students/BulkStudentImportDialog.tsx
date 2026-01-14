import { useState, useCallback, useEffect } from 'react';
import Papa from 'papaparse';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Upload, Download, FileSpreadsheet, CheckCircle2, XCircle, AlertCircle, Loader2, AlertTriangle } from 'lucide-react';
import { AdmissionFormData } from '@/hooks/useStudents';
import { CLASS_LIST_DETAILED, Gender, Term, ACADEMIC_YEARS } from '@/types';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface BulkStudentImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (students: Array<AdmissionFormData & { photoUrl?: string }>) => Promise<{ successCount: number; errors: Array<{ index: number; error: string }> }>;
  academicYear: string;
  term: Term;
}

interface ParsedStudent {
  fullName: string;
  dateOfBirth: string;
  gender: Gender;
  classId: string;
  className: string;
  guardianName: string;
  address: string;
  phoneContact: string;
  email?: string;
  admissionFee: number;
  amountPaid: number;
  isValid: boolean;
  errors: string[];
  isDuplicate?: boolean;
  duplicateType?: 'internal' | 'database' | 'both';
}

const CSV_HEADERS = [
  'fullName',
  'dateOfBirth',
  'gender',
  'classId',
  'guardianName',
  'address',
  'phoneContact',
  'email',
  'admissionFee',
  'amountPaid',
];

const SAMPLE_DATA = [
  ['John Doe', '2015-03-15', 'male', 'primary-1', 'Jane Doe', '123 Main Street', '08012345678', 'john@example.com', '50000', '25000'],
  ['Mary Smith', '2014-07-22', 'female', 'primary-2', 'Peter Smith', '456 Oak Avenue', '08087654321', '', '55000', '0'],
];

export function BulkStudentImportDialog({
  open,
  onOpenChange,
  onImport,
  academicYear,
  term,
}: BulkStudentImportDialogProps) {
  const [step, setStep] = useState<'upload' | 'preview' | 'importing' | 'complete'>('upload');
  const [parsedStudents, setParsedStudents] = useState<ParsedStudent[]>([]);
  const [importProgress, setImportProgress] = useState(0);
  const [importResult, setImportResult] = useState<{ success: number; failed: number } | null>(null);
  const [isCheckingDuplicates, setIsCheckingDuplicates] = useState(false);
  const [existingStudents, setExistingStudents] = useState<Array<{ full_name: string; phone_contact: string | null }>>([]);
  const [skipDuplicates, setSkipDuplicates] = useState(true);

  // Fetch existing students for duplicate checking
  useEffect(() => {
    const fetchExistingStudents = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      const { data: profile } = await supabase
        .from('profiles')
        .select('school_id')
        .eq('id', user.id)
        .single();
      
      if (!profile?.school_id) return;

      const { data } = await supabase
        .from('students')
        .select('full_name, phone_contact')
        .eq('school_id', profile.school_id);
      
      setExistingStudents(data || []);
    };

    if (open) {
      fetchExistingStudents();
    }
  }, [open]);

  const normalizeString = (str: string): string => {
    return str.toLowerCase().trim().replace(/\s+/g, ' ');
  };

  const normalizePhone = (phone: string): string => {
    return phone.replace(/[\s\-\(\)]/g, '');
  };

  const checkForDuplicates = useCallback((students: ParsedStudent[]): ParsedStudent[] => {
    const seenNames = new Map<string, number>(); // name -> first occurrence index
    const seenPhones = new Map<string, number>(); // phone -> first occurrence index

    return students.map((student, index) => {
      const errors = [...student.errors];
      let isDuplicate = false;
      let duplicateType: 'internal' | 'database' | 'both' | undefined;

      const normalizedName = normalizeString(student.fullName);
      const normalizedPhone = student.phoneContact ? normalizePhone(student.phoneContact) : '';

      // Check internal duplicates (within CSV)
      if (seenNames.has(normalizedName)) {
        errors.push(`Duplicate name in CSV (row ${seenNames.get(normalizedName)! + 1})`);
        isDuplicate = true;
        duplicateType = 'internal';
      }
      
      if (normalizedPhone && seenPhones.has(normalizedPhone)) {
        errors.push(`Duplicate phone in CSV (row ${seenPhones.get(normalizedPhone)! + 1})`);
        isDuplicate = true;
        duplicateType = 'internal';
      }

      // Check against existing database records
      const dbNameMatch = existingStudents.some(e => 
        normalizeString(e.full_name) === normalizedName
      );
      
      const dbPhoneMatch = normalizedPhone && existingStudents.some(e => 
        e.phone_contact && normalizePhone(e.phone_contact) === normalizedPhone
      );

      if (dbNameMatch) {
        errors.push('Student with this name already exists in database');
        isDuplicate = true;
        duplicateType = duplicateType ? 'both' : 'database';
      }

      if (dbPhoneMatch) {
        errors.push('Phone contact already registered to another student');
        isDuplicate = true;
        duplicateType = duplicateType ? 'both' : 'database';
      }

      // Add to seen maps for future comparison
      if (!seenNames.has(normalizedName)) {
        seenNames.set(normalizedName, index);
      }
      if (normalizedPhone && !seenPhones.has(normalizedPhone)) {
        seenPhones.set(normalizedPhone, index);
      }

      return {
        ...student,
        errors,
        isValid: errors.length === 0,
        isDuplicate,
        duplicateType,
      };
    });
  }, [existingStudents]);

  const validateStudent = (row: Record<string, string>): ParsedStudent => {
    const errors: string[] = [];
    
    // Required field validation
    if (!row.fullName?.trim()) errors.push('Full name is required');
    if (!row.dateOfBirth?.trim()) errors.push('Date of birth is required');
    if (!row.gender?.trim()) errors.push('Gender is required');
    if (!row.classId?.trim()) errors.push('Class ID is required');
    if (!row.guardianName?.trim()) errors.push('Guardian name is required');
    if (!row.address?.trim()) errors.push('Address is required');
    if (!row.phoneContact?.trim()) errors.push('Phone contact is required');
    if (!row.admissionFee?.trim()) errors.push('Admission fee is required');

    // Format validation
    const gender = row.gender?.toLowerCase().trim();
    if (gender && gender !== 'male' && gender !== 'female') {
      errors.push('Gender must be "male" or "female"');
    }

    const classId = row.classId?.trim();
    const foundClass = CLASS_LIST_DETAILED.find(c => c.id === classId || c.name.toLowerCase() === classId.toLowerCase());
    if (classId && !foundClass) {
      errors.push(`Invalid class ID: ${classId}`);
    }

    const admissionFee = parseFloat(row.admissionFee || '0');
    if (isNaN(admissionFee) || admissionFee < 0) {
      errors.push('Admission fee must be a positive number');
    }

    const amountPaid = parseFloat(row.amountPaid || '0');
    if (isNaN(amountPaid) || amountPaid < 0) {
      errors.push('Amount paid must be a positive number');
    }

    // Date validation
    const dateOfBirth = row.dateOfBirth?.trim();
    if (dateOfBirth && !/^\d{4}-\d{2}-\d{2}$/.test(dateOfBirth)) {
      errors.push('Date of birth must be in YYYY-MM-DD format');
    }

    return {
      fullName: row.fullName?.trim() || '',
      dateOfBirth: row.dateOfBirth?.trim() || '',
      gender: (gender === 'female' ? 'female' : 'male') as Gender,
      classId: foundClass?.id || classId || '',
      className: foundClass?.name || classId || '',
      guardianName: row.guardianName?.trim() || '',
      address: row.address?.trim() || '',
      phoneContact: row.phoneContact?.trim() || '',
      email: row.email?.trim() || undefined,
      admissionFee: isNaN(admissionFee) ? 0 : admissionFee,
      amountPaid: isNaN(amountPaid) ? 0 : amountPaid,
      isValid: errors.length === 0,
      errors,
    };
  };

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      toast.error('Please upload a CSV file');
      return;
    }

    setIsCheckingDuplicates(true);
    
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const students = (results.data as Record<string, string>[]).map(validateStudent);
        // Check for duplicates
        const studentsWithDuplicateCheck = checkForDuplicates(students);
        setParsedStudents(studentsWithDuplicateCheck);
        setStep('preview');
        setIsCheckingDuplicates(false);
      },
      error: (error) => {
        console.error('CSV parsing error:', error);
        toast.error('Failed to parse CSV file');
        setIsCheckingDuplicates(false);
      },
    });
  }, [checkForDuplicates]);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.name.endsWith('.csv')) {
      const input = document.createElement('input');
      input.type = 'file';
      input.files = e.dataTransfer.files;
      const event = { target: input } as unknown as React.ChangeEvent<HTMLInputElement>;
      handleFileUpload(event);
    } else {
      toast.error('Please upload a CSV file');
    }
  }, [handleFileUpload]);

  const downloadTemplate = () => {
    const csvContent = [
      CSV_HEADERS.join(','),
      ...SAMPLE_DATA.map(row => row.join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'student_import_template.csv';
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Template downloaded');
  };

  const downloadClassReference = () => {
    const classContent = [
      'Class ID,Class Name,Level',
      ...CLASS_LIST_DETAILED.map(c => `${c.id},${c.name},${c.level}`),
    ].join('\n');

    const blob = new Blob([classContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'class_reference.csv';
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Class reference downloaded');
  };

  const handleImport = async () => {
    // Filter based on skipDuplicates setting
    const studentsToProcess = skipDuplicates 
      ? parsedStudents.filter(s => s.isValid && !s.isDuplicate)
      : parsedStudents.filter(s => s.errors.filter(e => !e.includes('Duplicate') && !e.includes('already exists') && !e.includes('already registered')).length === 0);
    
    if (studentsToProcess.length === 0) {
      toast.error('No valid students to import');
      return;
    }

    setStep('importing');
    setImportProgress(0);

    const studentsToImport: Array<AdmissionFormData & { photoUrl?: string }> = studentsToProcess.map(s => ({
      fullName: s.fullName,
      dateOfBirth: s.dateOfBirth,
      gender: s.gender,
      classId: s.classId,
      className: s.className,
      guardianName: s.guardianName,
      address: s.address,
      phoneContact: s.phoneContact,
      email: s.email,
      admissionFee: s.admissionFee,
      amountPaid: s.amountPaid,
      academicYear,
      term,
    }));

    // Simulate progress for UX
    const progressInterval = setInterval(() => {
      setImportProgress(prev => Math.min(prev + 10, 90));
    }, 200);

    try {
      const result = await onImport(studentsToImport);
      clearInterval(progressInterval);
      setImportProgress(100);
      setImportResult({ success: result.successCount, failed: result.errors.length });
      setStep('complete');
    } catch (error) {
      clearInterval(progressInterval);
      console.error('Import error:', error);
      toast.error('Failed to import students');
      setStep('preview');
    }
  };

  const removeStudent = (index: number) => {
    setParsedStudents(prev => prev.filter((_, i) => i !== index));
  };

  const resetDialog = () => {
    setStep('upload');
    setParsedStudents([]);
    setImportProgress(0);
    setImportResult(null);
  };

  const handleClose = (open: boolean) => {
    if (!open) {
      resetDialog();
    }
    onOpenChange(open);
  };

  const validCount = parsedStudents.filter(s => s.isValid && !s.isDuplicate).length;
  const invalidCount = parsedStudents.filter(s => !s.isValid && !s.isDuplicate).length;
  const duplicateCount = parsedStudents.filter(s => s.isDuplicate).length;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Bulk Student Import
          </DialogTitle>
          <DialogDescription>
            Import multiple students from a CSV file. Download the template to see the required format.
          </DialogDescription>
        </DialogHeader>

        {step === 'upload' && (
          <div className="space-y-4">
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={downloadTemplate}>
                <Download className="h-4 w-4 mr-2" />
                Download Template
              </Button>
              <Button variant="outline" size="sm" onClick={downloadClassReference}>
                <Download className="h-4 w-4 mr-2" />
                Class Reference
              </Button>
            </div>

            <div
              className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              onClick={() => document.getElementById('csv-upload')?.click()}
            >
              <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-lg font-medium mb-1">Drop your CSV file here</p>
              <p className="text-sm text-muted-foreground mb-4">or click to browse</p>
              <Input
                id="csv-upload"
                type="file"
                accept=".csv"
                className="hidden"
                onChange={handleFileUpload}
              />
              <Button variant="secondary">
                <Upload className="h-4 w-4 mr-2" />
                Select File
              </Button>
            </div>

            <div className="bg-muted/50 rounded-lg p-4">
              <h4 className="font-medium mb-2">Required CSV Columns:</h4>
              <div className="flex flex-wrap gap-2">
                {CSV_HEADERS.map(header => (
                  <Badge key={header} variant="outline" className="font-mono text-xs">
                    {header}
                  </Badge>
                ))}
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                • Date format: YYYY-MM-DD (e.g., 2015-03-15)<br />
                • Gender: "male" or "female"<br />
                • Class IDs can be found in the class reference file
              </p>
            </div>
          </div>
        )}

        {step === 'preview' && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2 sm:gap-4">
              <Badge variant="secondary" className="gap-1">
                <CheckCircle2 className="h-3 w-3" />
                {validCount} Valid
              </Badge>
              {invalidCount > 0 && (
                <Badge variant="destructive" className="gap-1">
                  <XCircle className="h-3 w-3" />
                  {invalidCount} Invalid
                </Badge>
              )}
              {duplicateCount > 0 && (
                <Badge variant="outline" className="gap-1 border-amber-500 text-amber-600">
                  <AlertTriangle className="h-3 w-3" />
                  {duplicateCount} Duplicates
                </Badge>
              )}
              <span className="text-sm text-muted-foreground">
                Academic Year: {academicYear} | Term: {term}
              </span>
            </div>

            {duplicateCount > 0 && (
              <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                      {duplicateCount} duplicate record{duplicateCount > 1 ? 's' : ''} found
                    </p>
                    <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                      Duplicates are detected by matching student names or phone contacts.
                    </p>
                    <label className="flex items-center gap-2 mt-2 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={skipDuplicates} 
                        onChange={(e) => setSkipDuplicates(e.target.checked)}
                        className="rounded border-amber-300"
                      />
                      <span className="text-xs text-amber-700 dark:text-amber-300">
                        Skip duplicates during import (recommended)
                      </span>
                    </label>
                  </div>
                </div>
              </div>
            )}

            <ScrollArea className="h-[400px] border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10">Status</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead>Gender</TableHead>
                    <TableHead>Guardian</TableHead>
                    <TableHead>Fee</TableHead>
                    <TableHead className="w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {parsedStudents.map((student, index) => (
                    <TableRow 
                      key={index} 
                      className={
                        student.isDuplicate 
                          ? 'bg-amber-50 dark:bg-amber-950/20' 
                          : !student.isValid 
                            ? 'bg-destructive/5' 
                            : ''
                      }
                    >
                      <TableCell>
                        {student.isDuplicate ? (
                          <AlertTriangle className="h-4 w-4 text-amber-500" />
                        ) : student.isValid ? (
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                        ) : (
                          <AlertCircle className="h-4 w-4 text-destructive" />
                        )}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{student.fullName || '-'}</p>
                          {student.errors.length > 0 && (
                            <p className={`text-xs ${student.isDuplicate ? 'text-amber-600' : 'text-destructive'}`}>
                              {student.errors.join(', ')}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{student.className || '-'}</TableCell>
                      <TableCell className="capitalize">{student.gender}</TableCell>
                      <TableCell>{student.guardianName || '-'}</TableCell>
                      <TableCell>₦{student.admissionFee.toLocaleString()}</TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeStudent(index)}
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        >
                          <XCircle className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>

            <DialogFooter>
              <Button variant="outline" onClick={resetDialog}>
                Upload Different File
              </Button>
              <Button onClick={handleImport} disabled={skipDuplicates ? validCount === 0 : parsedStudents.length === 0}>
                Import {skipDuplicates ? validCount : parsedStudents.filter(s => s.errors.filter(e => !e.includes('Duplicate') && !e.includes('already exists') && !e.includes('already registered')).length === 0).length} Student{(skipDuplicates ? validCount : parsedStudents.length) !== 1 ? 's' : ''}
              </Button>
            </DialogFooter>
          </div>
        )}

        {step === 'importing' && (
          <div className="py-8 text-center space-y-4">
            <Loader2 className="h-12 w-12 mx-auto animate-spin text-primary" />
            <div>
              <p className="font-medium">Importing students...</p>
              <p className="text-sm text-muted-foreground">Please wait while we process your file</p>
            </div>
            <Progress value={importProgress} className="max-w-md mx-auto" />
          </div>
        )}

        {step === 'complete' && importResult && (
          <div className="py-8 text-center space-y-4">
            <CheckCircle2 className="h-12 w-12 mx-auto text-green-500" />
            <div>
              <p className="text-lg font-medium">Import Complete!</p>
              <div className="flex justify-center gap-4 mt-2">
                <Badge variant="secondary" className="gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  {importResult.success} Imported
                </Badge>
                {importResult.failed > 0 && (
                  <Badge variant="destructive" className="gap-1">
                    <XCircle className="h-3 w-3" />
                    {importResult.failed} Failed
                  </Badge>
                )}
              </div>
            </div>
            <DialogFooter className="justify-center">
              <Button onClick={() => handleClose(false)}>
                Close
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
