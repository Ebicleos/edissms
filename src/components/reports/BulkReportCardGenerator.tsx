import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { FileText, Printer, Download, Eye, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { CLASS_LIST_DETAILED, ACADEMIC_YEARS } from '@/types';
import { useReportCards, ReportCardData } from '@/hooks/useReportCards';
import { ReportCardTemplate } from './ReportCardTemplate';
import { ReportCardEditor } from './ReportCardEditor';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const TERMS = ['first', 'second', 'third'];

interface SchoolSettings {
  schoolName: string;
  motto: string;
  address: string;
  phone: string;
  email: string;
  logoUrl?: string;
  principalName?: string;
  closingDate?: string;
  nextTermBegins?: string;
}

export function BulkReportCardGenerator() {
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedTerm, setSelectedTerm] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [showPreview, setShowPreview] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  const [schoolSettings, setSchoolSettings] = useState<SchoolSettings | null>(null);
  const printRef = useRef<HTMLDivElement>(null);

  const { isLoading, reportCards, generateReportCards, saveReportCard } = useReportCards();

  const fetchSchoolSettings = async () => {
    const { data } = await supabase
      .from('school_settings')
      .select('*')
      .limit(1)
      .maybeSingle();

    if (data) {
      setSchoolSettings({
        schoolName: data.school_name || 'School Name',
        motto: data.motto || 'School Motto',
        address: data.address || '',
        phone: data.phone || '',
        email: data.email || '',
        logoUrl: data.logo_url || undefined,
        principalName: data.principal_name || undefined,
        closingDate: data.closing_date || undefined,
        nextTermBegins: data.next_term_begins || undefined,
      });
    }
  };

  const handleGenerate = async () => {
    if (!selectedClass || !selectedTerm || !selectedYear) {
      toast.error('Please select class, term, and academic year');
      return;
    }

    await fetchSchoolSettings();
    const cards = await generateReportCards(selectedClass, selectedTerm, selectedYear);
    if (cards.length > 0) {
      setShowPreview(true);
      setCurrentCardIndex(0);
      toast.success(`Generated ${cards.length} report card(s)`);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handlePrintAll = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow || !schoolSettings) return;

    const styles = `
      <style>
        @media print {
          body { margin: 0; padding: 0; }
          .report-card { page-break-after: always; }
          .report-card:last-child { page-break-after: avoid; }
        }
        body { font-family: Arial, sans-serif; }
        table { border-collapse: collapse; width: 100%; }
        th, td { border: 1px solid black; padding: 4px; text-align: left; }
        .text-center { text-align: center; }
        .font-bold { font-weight: bold; }
        .uppercase { text-transform: uppercase; }
        .bg-gray-200 { background-color: #e5e7eb; }
        .bg-gray-300 { background-color: #d1d5db; }
        .border { border: 1px solid black; }
        .p-2 { padding: 8px; }
        .p-3 { padding: 12px; }
        .mb-4 { margin-bottom: 16px; }
        .grid { display: grid; }
        .grid-cols-2 { grid-template-columns: repeat(2, 1fr); }
        .grid-cols-3 { grid-template-columns: repeat(3, 1fr); }
        .gap-4 { gap: 16px; }
      </style>
    `;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Report Cards - ${selectedClass}</title>
          ${styles}
        </head>
        <body>
    `);

    reportCards.forEach((card, index) => {
      printWindow.document.write(`
        <div class="report-card" style="padding: 20px; max-width: 800px; margin: 0 auto;">
          ${generateReportCardHTML(card, schoolSettings)}
        </div>
      `);
    });

    printWindow.document.write('</body></html>');
    printWindow.document.close();
    printWindow.print();
  };

  // Security: HTML escape function to prevent XSS attacks
  const escapeHtml = (unsafe: string | null | undefined): string => {
    if (unsafe == null) return '';
    return String(unsafe)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  };

  const generateReportCardHTML = (data: ReportCardData, settings: SchoolSettings) => {
    const totalCa = data.grades.reduce((sum, g) => sum + g.caScore, 0);
    const totalExam = data.grades.reduce((sum, g) => sum + g.examScore, 0);
    const totalScore = data.grades.reduce((sum, g) => sum + g.totalScore, 0);

    const gradesRows = data.grades.map((grade, i) => `
      <tr style="background-color: ${i % 2 === 0 ? 'white' : '#f9fafb'}">
        <td class="border p-2">${escapeHtml(grade.subjectName)}</td>
        <td class="border p-2 text-center">${escapeHtml(String(grade.caScore))}</td>
        <td class="border p-2 text-center">${escapeHtml(String(grade.examScore))}</td>
        <td class="border p-2 text-center font-bold">${escapeHtml(String(grade.totalScore))}</td>
        <td class="border p-2 text-center font-bold">${escapeHtml(grade.grade)}</td>
        <td class="border p-2 text-center">${escapeHtml(String(grade.subjectPosition))}</td>
        <td class="border p-2">${escapeHtml(grade.remarks)}</td>
      </tr>
    `).join('');

    return `
      <div style="text-align: center; border-bottom: 2px solid black; padding-bottom: 16px; margin-bottom: 16px;">
        <h1 style="font-size: 24px; font-weight: bold; text-transform: uppercase;">${escapeHtml(settings.schoolName)}</h1>
        <p style="font-style: italic;">${escapeHtml(settings.motto)}</p>
        <p>${escapeHtml(settings.address)}</p>
        <p>Contact: ${escapeHtml(settings.phone)}; ${escapeHtml(settings.email)}</p>
      </div>
      <h2 style="text-align: center; text-decoration: underline; margin-bottom: 16px;">STUDENT TERMLY REPORT CARD</h2>
      <div class="grid grid-cols-2 border p-3 mb-4">
        <div><strong>Student Name:</strong> ${escapeHtml(data.studentName.toUpperCase())}</div>
        <div><strong>Next term begins:</strong> ${escapeHtml(settings.nextTermBegins) || 'TBA'}</div>
        <div><strong>Admission No.:</strong> ${escapeHtml(data.admissionNumber)}</div>
        <div><strong>Attendance:</strong> ${escapeHtml(String(data.attendancePresent))} out of ${escapeHtml(String(data.attendanceTotal))}</div>
        <div><strong>Class/Form:</strong> ${escapeHtml(data.className.toUpperCase())}</div>
        <div><strong>Number in Class:</strong> ${escapeHtml(String(data.totalStudents))}</div>
        <div><strong>Gender:</strong> ${escapeHtml(data.gender.toUpperCase())}</div>
        <div><strong>Position in Class:</strong> ${escapeHtml(String(data.classPosition))}</div>
        <div><strong>Term:</strong> ${escapeHtml(data.term.toUpperCase())} TERM</div>
        <div><strong>Average Score:</strong> ${escapeHtml(data.averageScore.toFixed(2))}</div>
        <div><strong>Closing Date:</strong> ${escapeHtml(settings.closingDate) || ''}</div>
        <div><strong>Academic Year:</strong> ${escapeHtml(data.academicYear)}</div>
      </div>
      <table class="mb-4">
        <thead>
          <tr class="bg-gray-200">
            <th class="border p-2">Subjects</th>
            <th class="border p-2 text-center">C/A</th>
            <th class="border p-2 text-center">Exam</th>
            <th class="border p-2 text-center">Total</th>
            <th class="border p-2 text-center">Grade</th>
            <th class="border p-2 text-center">Subject Position</th>
            <th class="border p-2">Remarks</th>
          </tr>
        </thead>
        <tbody>
          ${gradesRows}
          <tr class="bg-gray-300 font-bold">
            <td class="border p-2">Total</td>
            <td class="border p-2 text-center">${escapeHtml(String(totalCa))}</td>
            <td class="border p-2 text-center">${escapeHtml(String(totalExam))}</td>
            <td class="border p-2 text-center">${escapeHtml(String(totalScore))}</td>
            <td class="border p-2 text-center">-</td>
            <td class="border p-2 text-center">-</td>
            <td class="border p-2">-</td>
          </tr>
        </tbody>
      </table>
      <div class="grid grid-cols-3 gap-4 mb-4">
        <div><strong>Attitude:</strong> ${escapeHtml(data.attitude) || '-'}</div>
        <div><strong>Interest:</strong> ${escapeHtml(data.interest) || '-'}</div>
        <div><strong>Conduct:</strong> ${escapeHtml(data.conduct) || '-'}</div>
      </div>
      <div class="border p-2 mb-4">
        <strong>Class Teacher's Remarks:</strong> ${escapeHtml(data.teacherRemarks) || '-'}
      </div>
      <div class="border p-2 mb-4">
        <strong>Head Teacher's Remarks:</strong> ${escapeHtml(data.principalRemarks) || '-'}
      </div>
      ${data.promotionStatus ? `
        <div style="text-align: center; font-weight: bold; font-size: 18px; padding: 8px; background-color: #d1fae5; border: 2px solid #10b981; border-radius: 4px; margin-bottom: 16px;">
          STATUS: ${escapeHtml(data.promotionStatus)}
        </div>
      ` : ''}
      <div class="grid grid-cols-2 gap-4" style="margin-top: 32px;">
        <div style="text-align: center; border-top: 1px solid black; padding-top: 4px; margin: 0 32px;">
          Class Teacher's Signature
        </div>
        <div style="text-align: center; border-top: 1px solid black; padding-top: 4px; margin: 0 32px;">
          ${escapeHtml(settings.principalName) ? `${escapeHtml(settings.principalName)}'s Signature` : "Proprietor's Signature"}
        </div>
      </div>
    `;
  };

  const currentCard = reportCards[currentCardIndex];

  const handleSaveRemarks = async (updatedCard: ReportCardData) => {
    await saveReportCard(updatedCard);
    // Update local state
    const updatedCards = [...reportCards];
    updatedCards[currentCardIndex] = updatedCard;
    setShowEditor(false);
  };

  return (
    <div className="space-y-6">
      {/* Generator Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Bulk Report Card Generator
          </CardTitle>
          <CardDescription>
            Generate printable report cards for all students in a class
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div>
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
            <div>
              <Label>Term</Label>
              <Select value={selectedTerm} onValueChange={setSelectedTerm}>
                <SelectTrigger>
                  <SelectValue placeholder="Select term" />
                </SelectTrigger>
                <SelectContent>
                  {TERMS.map((term) => (
                    <SelectItem key={term} value={term}>
                      {term.charAt(0).toUpperCase() + term.slice(1)} Term
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
                onClick={handleGenerate} 
                disabled={isLoading}
                className="w-full bg-gradient-primary"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <FileText className="mr-2 h-4 w-4" />
                    Generate Report Cards
                  </>
                )}
              </Button>
            </div>
          </div>

          {isLoading && (
            <div className="space-y-2">
              <Progress value={50} className="h-2" />
              <p className="text-sm text-muted-foreground text-center">
                Generating report cards...
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Preview Section */}
      {showPreview && reportCards.length > 0 && schoolSettings && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>
                Report Card Preview ({currentCardIndex + 1} of {reportCards.length})
              </CardTitle>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setCurrentCardIndex(Math.max(0, currentCardIndex - 1))}
                  disabled={currentCardIndex === 0}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm text-muted-foreground">
                  {currentCard?.studentName}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setCurrentCardIndex(Math.min(reportCards.length - 1, currentCardIndex + 1))}
                  disabled={currentCardIndex === reportCards.length - 1}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <Button variant="outline" onClick={() => setShowEditor(true)}>
                <Eye className="mr-2 h-4 w-4" />
                Edit Remarks
              </Button>
              <Button variant="outline" onClick={handlePrint}>
                <Printer className="mr-2 h-4 w-4" />
                Print Current
              </Button>
              <Button onClick={handlePrintAll}>
                <Download className="mr-2 h-4 w-4" />
                Print All ({reportCards.length})
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div ref={printRef} className="border rounded-lg overflow-hidden">
              <ReportCardTemplate
                data={currentCard}
                schoolSettings={schoolSettings}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Editor Dialog */}
      {showEditor && currentCard && (
        <ReportCardEditor
          data={currentCard}
          onSave={handleSaveRemarks}
          onClose={() => setShowEditor(false)}
        />
      )}

      {/* Print Styles */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .report-card-print, .report-card-print * {
            visibility: visible;
          }
          .report-card-print {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}
