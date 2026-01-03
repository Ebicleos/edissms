import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
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
import { Clock, ChevronLeft, ChevronRight, Flag, Send, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface Question {
  id: string;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string | null;
  option_d: string | null;
  marks: number;
  order_index: number | null;
}

interface Exam {
  id: string;
  title: string;
  subject: string;
  duration_minutes: number;
}

interface Answer {
  question_id: string;
  selected_option: string | null;
  flagged: boolean;
}

export default function TakeExam() {
  const { examId } = useParams<{ examId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [exam, setExam] = useState<Exam | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Map<string, Answer>>(new Map());
  const [submissionId, setSubmissionId] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);

  // Fetch exam and questions
  useEffect(() => {
    const fetchExamData = async () => {
      if (!examId || !user) return;

      // Fetch exam
      const { data: examData, error: examError } = await supabase
        .from('exams')
        .select('id, title, subject, duration_minutes')
        .eq('id', examId)
        .single();

      if (examError || !examData) {
        toast.error('Exam not found');
        navigate('/cbt');
        return;
      }

      setExam(examData);
      setTimeLeft(examData.duration_minutes * 60);

      // Fetch questions
      const { data: questionsData, error: questionsError } = await supabase
        .from('questions')
        .select('*')
        .eq('exam_id', examId)
        .order('order_index', { ascending: true });

      if (!questionsError && questionsData) {
        setQuestions(questionsData);
        
        // Initialize answers map
        const initialAnswers = new Map<string, Answer>();
        questionsData.forEach(q => {
          initialAnswers.set(q.id, { question_id: q.id, selected_option: null, flagged: false });
        });
        setAnswers(initialAnswers);
      }

      // Check for existing submission or create new one
      const { data: existingSubmission } = await supabase
        .from('exam_submissions')
        .select('id, is_submitted')
        .eq('exam_id', examId)
        .eq('student_id', user.id)
        .maybeSingle();

      if (existingSubmission) {
        if (existingSubmission.is_submitted) {
          navigate(`/cbt/results/${existingSubmission.id}`);
          return;
        }
        setSubmissionId(existingSubmission.id);
        
        // Load existing answers
        const { data: existingAnswers } = await supabase
          .from('student_answers')
          .select('question_id, selected_option')
          .eq('submission_id', existingSubmission.id);

        if (existingAnswers) {
          const loadedAnswers = new Map(answers);
          existingAnswers.forEach(a => {
            if (loadedAnswers.has(a.question_id)) {
              loadedAnswers.set(a.question_id, {
                ...loadedAnswers.get(a.question_id)!,
                selected_option: a.selected_option,
              });
            }
          });
          setAnswers(loadedAnswers);
        }
      } else {
        // Create new submission
        const { data: newSubmission, error: submitError } = await supabase
          .from('exam_submissions')
          .insert({
            exam_id: examId,
            student_id: user.id,
            total_marks: questionsData?.reduce((sum, q) => sum + (q.marks || 1), 0) || 0,
          })
          .select('id')
          .single();

        if (!submitError && newSubmission) {
          setSubmissionId(newSubmission.id);
        }
      }

      setIsLoading(false);
    };

    fetchExamData();
  }, [examId, user, navigate]);

  // Timer countdown
  useEffect(() => {
    if (timeLeft <= 0 || isLoading) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, isLoading]);

  // Auto-save answer
  const saveAnswer = useCallback(async (questionId: string, option: string) => {
    if (!submissionId) return;

    await supabase
      .from('student_answers')
      .upsert({
        submission_id: submissionId,
        question_id: questionId,
        selected_option: option,
      }, { onConflict: 'submission_id,question_id' });
  }, [submissionId]);

  const handleSelectOption = (option: string) => {
    const currentQuestion = questions[currentIndex];
    if (!currentQuestion) return;

    const newAnswers = new Map(answers);
    newAnswers.set(currentQuestion.id, {
      ...newAnswers.get(currentQuestion.id)!,
      selected_option: option,
    });
    setAnswers(newAnswers);

    // Auto-save
    saveAnswer(currentQuestion.id, option);
  };

  const handleFlagQuestion = () => {
    const currentQuestion = questions[currentIndex];
    if (!currentQuestion) return;

    const newAnswers = new Map(answers);
    const current = newAnswers.get(currentQuestion.id)!;
    newAnswers.set(currentQuestion.id, {
      ...current,
      flagged: !current.flagged,
    });
    setAnswers(newAnswers);
  };

  const handleSubmit = async () => {
    if (!submissionId || !user) return;
    
    setIsSubmitting(true);

    try {
      // Call the secure server-side grading function
      const { data, error } = await supabase.functions.invoke('grade-exam', {
        body: { submission_id: submissionId }
      });

      if (error) {
        console.error('Grading error:', error);
        toast.error('Failed to submit exam');
        setIsSubmitting(false);
        return;
      }

      toast.success('Exam submitted successfully!');
      navigate(`/cbt/results/${submissionId}`);
    } catch (err) {
      console.error('Submit error:', err);
      toast.error('Failed to submit exam');
      setIsSubmitting(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading exam...</p>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];
  const currentAnswer = currentQuestion ? answers.get(currentQuestion.id) : null;
  const answeredCount = Array.from(answers.values()).filter(a => a.selected_option).length;
  const progress = (answeredCount / questions.length) * 100;

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Fixed Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background border-b shadow-sm">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-bold text-lg">{exam?.title}</h1>
              <p className="text-sm text-muted-foreground">{exam?.subject}</p>
            </div>
            <div className="flex items-center gap-4">
              <div className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg font-mono text-lg font-bold",
                timeLeft < 300 ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary"
              )}>
                <Clock className="h-5 w-5" />
                {formatTime(timeLeft)}
              </div>
              <Button 
                onClick={() => setShowSubmitDialog(true)}
                disabled={isSubmitting}
              >
                <Send className="h-4 w-4 mr-2" />
                Submit
              </Button>
            </div>
          </div>
          <Progress value={progress} className="mt-3 h-2" />
        </div>
      </header>

      <div className="pt-28 pb-24 container mx-auto px-4">
        <div className="grid lg:grid-cols-4 gap-6">
          {/* Question Navigation Sidebar */}
          <Card className="lg:col-span-1 h-fit sticky top-28">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Questions</CardTitle>
              <p className="text-xs text-muted-foreground">
                {answeredCount}/{questions.length} answered
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-5 gap-2">
                {questions.map((q, idx) => {
                  const answer = answers.get(q.id);
                  return (
                    <button
                      key={q.id}
                      onClick={() => setCurrentIndex(idx)}
                      className={cn(
                        "w-full aspect-square rounded-lg text-sm font-medium transition-all",
                        currentIndex === idx && "ring-2 ring-primary",
                        answer?.selected_option 
                          ? "bg-primary text-primary-foreground" 
                          : "bg-muted hover:bg-muted/80",
                        answer?.flagged && "ring-2 ring-orange-500"
                      )}
                    >
                      {idx + 1}
                    </button>
                  );
                })}
              </div>
              <div className="mt-4 flex flex-wrap gap-2 text-xs">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded bg-primary" />
                  Answered
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded bg-muted" />
                  Not answered
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded ring-2 ring-orange-500" />
                  Flagged
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Question Content */}
          <Card className="lg:col-span-3">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <Badge variant="outline" className="mb-2">
                  Question {currentIndex + 1} of {questions.length}
                </Badge>
                <p className="text-sm text-muted-foreground">
                  {currentQuestion?.marks || 1} mark{(currentQuestion?.marks || 1) > 1 ? 's' : ''}
                </p>
              </div>
              <Button
                variant={currentAnswer?.flagged ? "destructive" : "outline"}
                size="sm"
                onClick={handleFlagQuestion}
              >
                <Flag className="h-4 w-4 mr-2" />
                {currentAnswer?.flagged ? 'Unflag' : 'Flag'}
              </Button>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-lg font-medium">{currentQuestion?.question_text}</p>

              <div className="space-y-3">
                {['A', 'B', 'C', 'D'].map((option) => {
                  const optionKey = `option_${option.toLowerCase()}` as keyof Question;
                  const optionText = currentQuestion?.[optionKey];
                  if (!optionText) return null;

                  const isSelected = currentAnswer?.selected_option === option;

                  return (
                    <button
                      key={option}
                      onClick={() => handleSelectOption(option)}
                      className={cn(
                        "w-full text-left p-4 rounded-lg border-2 transition-all",
                        isSelected
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50"
                      )}
                    >
                      <span className={cn(
                        "inline-flex items-center justify-center w-8 h-8 rounded-full mr-3 font-medium",
                        isSelected
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                      )}>
                        {option}
                      </span>
                      {optionText as string}
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Fixed Navigation Footer */}
      <footer className="fixed bottom-0 left-0 right-0 bg-background border-t p-4">
        <div className="container mx-auto flex justify-between">
          <Button
            variant="outline"
            onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
            disabled={currentIndex === 0}
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Previous
          </Button>
          <Button
            onClick={() => setCurrentIndex(prev => Math.min(questions.length - 1, prev + 1))}
            disabled={currentIndex === questions.length - 1}
          >
            Next
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </footer>

      {/* Submit Confirmation Dialog */}
      <AlertDialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Submit Exam?</AlertDialogTitle>
            <AlertDialogDescription>
              You have answered {answeredCount} out of {questions.length} questions.
              {answeredCount < questions.length && (
                <span className="block mt-2 text-destructive">
                  Warning: {questions.length - answeredCount} questions are unanswered!
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Continue Exam</AlertDialogCancel>
            <AlertDialogAction onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit Exam'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
