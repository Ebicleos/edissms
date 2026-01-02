import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, XCircle, ArrowLeft, Trophy, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface Submission {
  id: string;
  score: number | null;
  total_marks: number | null;
  submitted_at: string | null;
  exam: {
    title: string;
    subject: string;
  };
}

interface AnswerDetail {
  id: string;
  selected_option: string | null;
  is_correct: boolean | null;
  question: {
    question_text: string;
    option_a: string;
    option_b: string;
    option_c: string | null;
    option_d: string | null;
    correct_option: string;
    marks: number;
  };
}

export default function ExamResults() {
  const { submissionId } = useParams<{ submissionId: string }>();
  const navigate = useNavigate();
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [answers, setAnswers] = useState<AnswerDetail[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchResults = async () => {
      if (!submissionId) return;

      // Fetch submission with exam details
      const { data: submissionData, error: subError } = await supabase
        .from('exam_submissions')
        .select(`
          id,
          score,
          total_marks,
          submitted_at,
          exam:exams(title, subject)
        `)
        .eq('id', submissionId)
        .single();

      if (subError || !submissionData) {
        navigate('/cbt');
        return;
      }

      // Transform the data to match our interface
      setSubmission({
        ...submissionData,
        exam: Array.isArray(submissionData.exam) ? submissionData.exam[0] : submissionData.exam
      } as Submission);

      // Fetch answers with questions
      const { data: answersData } = await supabase
        .from('student_answers')
        .select(`
          id,
          selected_option,
          is_correct,
          question:questions(
            question_text,
            option_a,
            option_b,
            option_c,
            option_d,
            correct_option,
            marks
          )
        `)
        .eq('submission_id', submissionId);

      if (answersData) {
        // Transform and type the data properly
        const transformedAnswers = answersData.map(answer => ({
          ...answer,
          question: Array.isArray(answer.question) ? answer.question[0] : answer.question
        })) as AnswerDetail[];
        setAnswers(transformedAnswers);
      }

      setIsLoading(false);
    };

    fetchResults();
  }, [submissionId, navigate]);

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  if (!submission) {
    return null;
  }

  const percentage = submission.total_marks 
    ? Math.round((submission.score || 0) / submission.total_marks * 100)
    : 0;

  const getGrade = (pct: number) => {
    if (pct >= 80) return { grade: 'A', color: 'text-green-600', bg: 'bg-green-100' };
    if (pct >= 70) return { grade: 'B', color: 'text-blue-600', bg: 'bg-blue-100' };
    if (pct >= 60) return { grade: 'C', color: 'text-yellow-600', bg: 'bg-yellow-100' };
    if (pct >= 50) return { grade: 'D', color: 'text-orange-600', bg: 'bg-orange-100' };
    return { grade: 'F', color: 'text-red-600', bg: 'bg-red-100' };
  };

  const gradeInfo = getGrade(percentage);
  const correctCount = answers.filter(a => a.is_correct).length;

  return (
    <MainLayout>
      <div className="space-y-6 max-w-4xl mx-auto">
        {/* Back Button */}
        <Button variant="ghost" onClick={() => navigate('/cbt')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to CBT Portal
        </Button>

        {/* Results Summary Card */}
        <Card className="overflow-hidden">
          <div className="bg-gradient-to-r from-primary to-primary/80 p-8 text-primary-foreground">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold mb-1">{submission.exam?.title}</h1>
                <p className="text-primary-foreground/80">{submission.exam?.subject}</p>
                {submission.submitted_at && (
                  <p className="text-sm mt-2 text-primary-foreground/60">
                    Submitted on {format(new Date(submission.submitted_at), 'MMMM d, yyyy h:mm a')}
                  </p>
                )}
              </div>
              <div className={cn(
                "w-24 h-24 rounded-full flex items-center justify-center",
                gradeInfo.bg
              )}>
                <span className={cn("text-4xl font-bold", gradeInfo.color)}>
                  {gradeInfo.grade}
                </span>
              </div>
            </div>
          </div>

          <CardContent className="p-8">
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              <div className="text-center p-4 bg-muted rounded-lg">
                <Trophy className="h-8 w-8 mx-auto mb-2 text-primary" />
                <p className="text-3xl font-bold">{submission.score || 0}/{submission.total_marks || 0}</p>
                <p className="text-sm text-muted-foreground">Total Score</p>
              </div>
              <div className="text-center p-4 bg-muted rounded-lg">
                <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-green-600" />
                <p className="text-3xl font-bold">{correctCount}</p>
                <p className="text-sm text-muted-foreground">Correct Answers</p>
              </div>
              <div className="text-center p-4 bg-muted rounded-lg">
                <XCircle className="h-8 w-8 mx-auto mb-2 text-red-600" />
                <p className="text-3xl font-bold">{answers.length - correctCount}</p>
                <p className="text-sm text-muted-foreground">Incorrect Answers</p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Score Progress</span>
                <span className="font-medium">{percentage}%</span>
              </div>
              <Progress value={percentage} className="h-3" />
            </div>
          </CardContent>
        </Card>

        {/* Question Review */}
        <Card>
          <CardHeader>
            <CardTitle>Question Review</CardTitle>
            <CardDescription>See how you answered each question</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {answers.map((answer, idx) => (
              <div 
                key={answer.id}
                className={cn(
                  "p-4 rounded-lg border-2",
                  answer.is_correct ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"
                )}
              >
                <div className="flex items-start justify-between mb-3">
                  <Badge variant="outline" className="mb-2">
                    Question {idx + 1}
                  </Badge>
                  {answer.is_correct ? (
                    <Badge className="bg-green-500">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Correct
                    </Badge>
                  ) : (
                    <Badge variant="destructive">
                      <XCircle className="h-3 w-3 mr-1" />
                      Incorrect
                    </Badge>
                  )}
                </div>

                <p className="font-medium mb-4">{answer.question?.question_text}</p>

                <div className="grid gap-2">
                  {['A', 'B', 'C', 'D'].map((opt) => {
                    const optKey = `option_${opt.toLowerCase()}` as keyof typeof answer.question;
                    const optText = answer.question?.[optKey];
                    if (!optText) return null;

                    const isCorrect = answer.question?.correct_option === opt;
                    const isSelected = answer.selected_option === opt;

                    return (
                      <div
                        key={opt}
                        className={cn(
                          "p-3 rounded border flex items-center gap-2",
                          isCorrect && "bg-green-100 border-green-300",
                          isSelected && !isCorrect && "bg-red-100 border-red-300",
                          !isCorrect && !isSelected && "bg-white border-gray-200"
                        )}
                      >
                        <span className={cn(
                          "w-6 h-6 rounded-full text-xs flex items-center justify-center font-medium",
                          isCorrect && "bg-green-500 text-white",
                          isSelected && !isCorrect && "bg-red-500 text-white",
                          !isCorrect && !isSelected && "bg-gray-200"
                        )}>
                          {opt}
                        </span>
                        <span className="text-sm">{optText as string}</span>
                        {isCorrect && (
                          <CheckCircle2 className="h-4 w-4 ml-auto text-green-600" />
                        )}
                        {isSelected && !isCorrect && (
                          <XCircle className="h-4 w-4 ml-auto text-red-600" />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
