import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Trophy, Eye, Loader2 } from 'lucide-react';
import { format } from 'date-fns';

interface Result {
  id: string;
  score: number | null;
  total_marks: number | null;
  submitted_at: string | null;
  exam: {
    title: string;
    subject: string;
  };
}

export default function StudentResults() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [results, setResults] = useState<Result[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchResults();
  }, [user]);

  const fetchResults = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('exam_submissions')
      .select(`
        id,
        score,
        total_marks,
        submitted_at,
        exam:exams(title, subject)
      `)
      .eq('student_id', user.id)
      .eq('is_submitted', true)
      .order('submitted_at', { ascending: false });

    if (!error && data) {
      // Transform the data properly
      const transformedResults = data.map(item => ({
        ...item,
        exam: Array.isArray(item.exam) ? item.exam[0] : item.exam
      })) as Result[];
      setResults(transformedResults);
    }
    setIsLoading(false);
  };

  const getGrade = (pct: number) => {
    if (pct >= 80) return { grade: 'A', color: 'bg-green-500' };
    if (pct >= 70) return { grade: 'B', color: 'bg-blue-500' };
    if (pct >= 60) return { grade: 'C', color: 'bg-yellow-500' };
    if (pct >= 50) return { grade: 'D', color: 'bg-orange-500' };
    return { grade: 'F', color: 'bg-red-500' };
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  // Calculate overall statistics
  const totalExams = results.length;
  const avgScore = results.length > 0
    ? Math.round(
        results.reduce((sum, r) => {
          const pct = r.total_marks ? ((r.score || 0) / r.total_marks) * 100 : 0;
          return sum + pct;
        }, 0) / results.length
      )
    : 0;

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">My Results</h1>
          <p className="text-muted-foreground">View your exam scores and performance</p>
        </div>

        {/* Stats Overview */}
        <div className="grid md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Exams Taken
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{totalExams}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Average Score
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{avgScore}%</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Overall Grade
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Badge className={getGrade(avgScore).color}>
                {getGrade(avgScore).grade}
              </Badge>
            </CardContent>
          </Card>
        </div>

        {/* Results List */}
        {results.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Trophy className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">No exam results yet</p>
              <Button onClick={() => navigate('/cbt')}>
                Go to CBT Portal
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {results.map((result) => {
              const percentage = result.total_marks
                ? Math.round((result.score || 0) / result.total_marks * 100)
                : 0;
              const gradeInfo = getGrade(percentage);

              return (
                <Card key={result.id}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">{result.exam?.title}</h3>
                        <p className="text-sm text-muted-foreground">
                          {result.exam?.subject} • Submitted {result.submitted_at
                            ? format(new Date(result.submitted_at), 'MMM d, yyyy')
                            : ''}
                        </p>
                        <div className="mt-3 flex items-center gap-4">
                          <Progress value={percentage} className="flex-1 h-2" />
                          <span className="text-sm font-medium">{percentage}%</span>
                        </div>
                      </div>
                      <div className="ml-6 text-right">
                        <p className="text-2xl font-bold">
                          {result.score || 0}/{result.total_marks || 0}
                        </p>
                        <Badge className={gradeInfo.color}>{gradeInfo.grade}</Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="mt-2"
                          onClick={() => navigate(`/cbt/results/${result.id}`)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View Details
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </MainLayout>
  );
}
