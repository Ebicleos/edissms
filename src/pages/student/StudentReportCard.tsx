import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useStudentRecord } from '@/hooks/useStudentRecord';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { FileText, Download, Loader2, Calendar, Award, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';

interface ReportCard {
  id: string;
  term: string;
  academic_year: string;
  average_score: number | null;
  position: number | null;
  total_students: number | null;
  teacher_remarks: string | null;
  principal_remarks: string | null;
  generated_at: string | null;
}

const ACADEMIC_YEARS = ['2024/2025', '2023/2024', '2022/2023'];
const TERMS = [
  { value: 'first', label: 'First Term' },
  { value: 'second', label: 'Second Term' },
  { value: 'third', label: 'Third Term' },
];

export default function StudentReportCard() {
  const { user, userClass } = useAuth();
  const { studentId, isLoading: studentLoading } = useStudentRecord();
  const [isLoading, setIsLoading] = useState(true);
  const [reportCards, setReportCards] = useState<ReportCard[]>([]);
  const [selectedYear, setSelectedYear] = useState<string>(ACADEMIC_YEARS[0]);
  const [selectedTerm, setSelectedTerm] = useState<string | null>(null);

  useEffect(() => {
    if (studentId) {
      fetchReportCards();
    } else if (!studentLoading) {
      setIsLoading(false);
    }
  }, [studentId, studentLoading]);

  const fetchReportCards = async () => {
    if (!studentId) {
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('report_cards')
        .select('*')
        .eq('student_id', studentId)
        .order('academic_year', { ascending: false })
        .order('term', { ascending: false });

      if (error) throw error;
      setReportCards(data || []);
    } catch (error) {
      console.error('Error fetching report cards:', error);
      toast.error('Failed to load report cards');
    } finally {
      setIsLoading(false);
    }
  };

  const getGradeColor = (score: number | null) => {
    if (!score) return 'secondary';
    if (score >= 70) return 'default';
    if (score >= 60) return 'secondary';
    if (score >= 50) return 'outline';
    return 'destructive';
  };

  const filteredReportCards = reportCards.filter(rc => {
    const matchesYear = rc.academic_year === selectedYear;
    const matchesTerm = !selectedTerm || rc.term === selectedTerm;
    return matchesYear && matchesTerm;
  });

  const handleDownload = async (reportCard: ReportCard) => {
    // In a real app, this would generate a PDF
    toast.info('Report card download coming soon!', {
      description: `${reportCard.academic_year} - ${reportCard.term} term`,
    });
  };

  if (isLoading) {
    return (
      <MainLayout title="Report Cards" subtitle="View and download your academic reports">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Report Cards" subtitle="View and download your academic reports">
      <div className="space-y-6">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Select Year" />
            </SelectTrigger>
            <SelectContent>
              {ACADEMIC_YEARS.map(year => (
                <SelectItem key={year} value={year}>{year}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={selectedTerm || ''} onValueChange={(v) => setSelectedTerm(v || null)}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="All Terms" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Terms</SelectItem>
              {TERMS.map(term => (
                <SelectItem key={term.value} value={term.value}>{term.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Report Cards List */}
        {filteredReportCards.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">No report cards found</p>
              <p className="text-muted-foreground">
                Report cards will appear here once they're generated
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredReportCards.map(reportCard => (
              <Card key={reportCard.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <Badge variant="outline">{reportCard.academic_year}</Badge>
                    <Badge>{reportCard.term.charAt(0).toUpperCase() + reportCard.term.slice(1)} Term</Badge>
                  </div>
                  <CardTitle className="text-lg mt-2 flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Term Report
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-lg bg-muted/50">
                      <div className="flex items-center gap-2 text-muted-foreground mb-1">
                        <TrendingUp className="h-4 w-4" />
                        <span className="text-xs">Average</span>
                      </div>
                      <p className="text-xl font-bold">
                        {reportCard.average_score?.toFixed(1) || 'N/A'}%
                      </p>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/50">
                      <div className="flex items-center gap-2 text-muted-foreground mb-1">
                        <Award className="h-4 w-4" />
                        <span className="text-xs">Position</span>
                      </div>
                      <p className="text-xl font-bold">
                        {reportCard.position ? `${reportCard.position}/${reportCard.total_students || '?'}` : 'N/A'}
                      </p>
                    </div>
                  </div>

                  {/* Remarks Preview */}
                  {reportCard.teacher_remarks && (
                    <div className="text-sm">
                      <p className="text-muted-foreground text-xs mb-1">Teacher's Remarks:</p>
                      <p className="line-clamp-2">{reportCard.teacher_remarks}</p>
                    </div>
                  )}

                  {/* Generated Date */}
                  {reportCard.generated_at && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      Generated: {format(new Date(reportCard.generated_at), 'MMM d, yyyy')}
                    </p>
                  )}

                  {/* Download Button */}
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => handleDownload(reportCard)}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download PDF
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
}
