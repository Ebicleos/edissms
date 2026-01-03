import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Upload, FileSpreadsheet, AlertTriangle, Check, X, Download } from 'lucide-react';

interface QuestionUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  examId?: string;
  exams: { id: string; title: string; subject: string }[];
  onSuccess: () => void;
}

interface ParsedQuestion {
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_option: string;
  marks: number;
  isValid: boolean;
  errors: string[];
}

export function QuestionUploadDialog({ open, onOpenChange, examId, exams, onSuccess }: QuestionUploadDialogProps) {
  const [selectedExamId, setSelectedExamId] = useState(examId || '');
  const [parsedQuestions, setParsedQuestions] = useState<ParsedQuestion[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [fileName, setFileName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const downloadTemplate = () => {
    const csvContent = `question_text,option_a,option_b,option_c,option_d,correct_option,marks
"What is 2 + 2?","2","3","4","5","C",1
"Which planet is closest to the Sun?","Earth","Mercury","Venus","Mars","B",2
"What is the chemical symbol for water?","H2O","CO2","O2","N2","A",1`;
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'questions_template.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  const parseCSV = (content: string): ParsedQuestion[] => {
    const lines = content.split('\n').filter(line => line.trim());
    if (lines.length < 2) return [];

    // Parse header to find column indices
    const header = lines[0].toLowerCase();
    const headerCols = parseCSVLine(header);
    
    const indices = {
      question_text: headerCols.findIndex(h => h.includes('question')),
      option_a: headerCols.findIndex(h => h.includes('option_a') || h === 'a'),
      option_b: headerCols.findIndex(h => h.includes('option_b') || h === 'b'),
      option_c: headerCols.findIndex(h => h.includes('option_c') || h === 'c'),
      option_d: headerCols.findIndex(h => h.includes('option_d') || h === 'd'),
      correct_option: headerCols.findIndex(h => h.includes('correct') || h.includes('answer')),
      marks: headerCols.findIndex(h => h.includes('mark') || h.includes('point')),
    };

    const questions: ParsedQuestion[] = [];

    for (let i = 1; i < lines.length; i++) {
      const cols = parseCSVLine(lines[i]);
      const errors: string[] = [];

      const question_text = cols[indices.question_text]?.trim() || '';
      const option_a = cols[indices.option_a]?.trim() || '';
      const option_b = cols[indices.option_b]?.trim() || '';
      const option_c = cols[indices.option_c]?.trim() || '';
      const option_d = cols[indices.option_d]?.trim() || '';
      const correct_option = (cols[indices.correct_option]?.trim() || '').toUpperCase();
      const marks = parseInt(cols[indices.marks]?.trim() || '1') || 1;

      if (!question_text) errors.push('Question text is required');
      if (!option_a) errors.push('Option A is required');
      if (!option_b) errors.push('Option B is required');
      if (!['A', 'B', 'C', 'D'].includes(correct_option)) errors.push('Correct option must be A, B, C, or D');
      if (correct_option === 'C' && !option_c) errors.push('Option C is required for this answer');
      if (correct_option === 'D' && !option_d) errors.push('Option D is required for this answer');

      questions.push({
        question_text,
        option_a,
        option_b,
        option_c,
        option_d,
        correct_option,
        marks,
        isValid: errors.length === 0,
        errors,
      });
    }

    return questions;
  };

  const parseCSVLine = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const questions = parseCSV(content);
      setParsedQuestions(questions);
    };
    reader.readAsText(file);
  };

  const handleUpload = async () => {
    if (!selectedExamId) {
      toast.error('Please select an exam');
      return;
    }

    const validQuestions = parsedQuestions.filter(q => q.isValid);
    if (validQuestions.length === 0) {
      toast.error('No valid questions to upload');
      return;
    }

    setIsUploading(true);

    try {
      // Get the highest order_index for this exam
      const { data: existingQuestions } = await supabase
        .from('questions')
        .select('order_index')
        .eq('exam_id', selectedExamId)
        .order('order_index', { ascending: false })
        .limit(1);

      let startIndex = (existingQuestions?.[0]?.order_index || 0) + 1;

      const questionsToInsert = validQuestions.map((q, idx) => ({
        exam_id: selectedExamId,
        question_text: q.question_text,
        option_a: q.option_a,
        option_b: q.option_b,
        option_c: q.option_c || null,
        option_d: q.option_d || null,
        correct_option: q.correct_option,
        marks: q.marks,
        order_index: startIndex + idx,
      }));

      const { error } = await supabase
        .from('questions')
        .insert(questionsToInsert);

      if (error) throw error;

      toast.success(`${validQuestions.length} questions uploaded successfully`);
      setParsedQuestions([]);
      setFileName('');
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast.error('Failed to upload questions', { description: error.message });
    } finally {
      setIsUploading(false);
    }
  };

  const validCount = parsedQuestions.filter(q => q.isValid).length;
  const invalidCount = parsedQuestions.filter(q => !q.isValid).length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Upload Questions from CSV
          </DialogTitle>
          <DialogDescription>
            Upload a CSV file with questions in the specified format
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Exam Selection */}
          <div className="space-y-2">
            <Label>Select Exam</Label>
            <Select value={selectedExamId} onValueChange={setSelectedExamId}>
              <SelectTrigger>
                <SelectValue placeholder="Choose an exam" />
              </SelectTrigger>
              <SelectContent>
                {exams.map(exam => (
                  <SelectItem key={exam.id} value={exam.id}>
                    {exam.title} - {exam.subject}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Template Download */}
          <Alert>
            <FileSpreadsheet className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <span>Download the CSV template to see the required format</span>
              <Button variant="outline" size="sm" onClick={downloadTemplate}>
                <Download className="mr-2 h-4 w-4" />
                Download Template
              </Button>
            </AlertDescription>
          </Alert>

          {/* File Upload */}
          <div className="space-y-2">
            <Label>Upload CSV File</Label>
            <div 
              className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <Input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                className="hidden"
                onChange={handleFileChange}
              />
              <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
              {fileName ? (
                <p className="text-sm font-medium">{fileName}</p>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Click to upload or drag and drop a CSV file
                </p>
              )}
            </div>
          </div>

          {/* Preview */}
          {parsedQuestions.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Preview ({parsedQuestions.length} questions)</Label>
                <div className="flex gap-2">
                  <Badge variant="secondary" className="bg-success/10 text-success">
                    <Check className="mr-1 h-3 w-3" />
                    {validCount} valid
                  </Badge>
                  {invalidCount > 0 && (
                    <Badge variant="secondary" className="bg-destructive/10 text-destructive">
                      <X className="mr-1 h-3 w-3" />
                      {invalidCount} invalid
                    </Badge>
                  )}
                </div>
              </div>

              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">#</TableHead>
                      <TableHead>Question</TableHead>
                      <TableHead className="w-24">Answer</TableHead>
                      <TableHead className="w-20">Marks</TableHead>
                      <TableHead className="w-24">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {parsedQuestions.slice(0, 10).map((q, idx) => (
                      <TableRow key={idx} className={!q.isValid ? 'bg-destructive/5' : ''}>
                        <TableCell>{idx + 1}</TableCell>
                        <TableCell className="max-w-xs truncate">{q.question_text}</TableCell>
                        <TableCell>{q.correct_option}</TableCell>
                        <TableCell>{q.marks}</TableCell>
                        <TableCell>
                          {q.isValid ? (
                            <Badge variant="secondary" className="bg-success/10 text-success">
                              <Check className="h-3 w-3" />
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="bg-destructive/10 text-destructive" title={q.errors.join(', ')}>
                              <AlertTriangle className="h-3 w-3" />
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {parsedQuestions.length > 10 && (
                  <div className="p-2 text-center text-sm text-muted-foreground bg-muted/50">
                    And {parsedQuestions.length - 10} more questions...
                  </div>
                )}
              </div>

              {invalidCount > 0 && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    {invalidCount} question(s) have errors and will be skipped during upload.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleUpload} 
            disabled={isUploading || validCount === 0 || !selectedExamId}
            className="bg-gradient-primary"
          >
            {isUploading ? 'Uploading...' : `Upload ${validCount} Questions`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
