import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
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
import { Clock, ChevronLeft, ChevronRight, Flag, Send, Loader2, ChevronsLeft, ChevronsRight, AlertTriangle, BookOpen, Shield, Eye } from 'lucide-react';
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
  const [searchParams] = useSearchParams();
  const isTestMode = searchParams.get('testMode') === 'true';
  const navigate = useNavigate();
  const { user, role } = useAuth();
  
  const [exam, setExam] = useState<Exam | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Map<string, Answer>>(new Map());
  const [submissionId, setSubmissionId] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [showInstructions, setShowInstructions] = useState(true);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const [showTabWarning, setShowTabWarning] = useState(false);
  
  const warningAudioRef = useRef<HTMLAudioElement | null>(null);

  // Anti-cheating: Disable right-click (not in test mode)
  useEffect(() => {
    if (isTestMode) return; // Disable anti-cheating in test mode
    
    const handleContextMenu = (e: MouseEvent) => {
      if (!showInstructions) {
        e.preventDefault();
        toast.warning('Right-click is disabled during the exam');
      }
    };
    
    document.addEventListener('contextmenu', handleContextMenu);
    return () => document.removeEventListener('contextmenu', handleContextMenu);
  }, [showInstructions, isTestMode]);

  // Anti-cheating: Tab visibility detection (not in test mode)
  // Note: handleSubmit is called via ref to avoid stale closure issues
  const handleSubmitRef = React.useRef<() => void>();
  
  useEffect(() => {
    if (isTestMode) return; // Disable anti-cheating in test mode
    
    const handleVisibilityChange = () => {
      if (document.hidden && !showInstructions && !isSubmitting) {
        setTabSwitchCount(prev => {
          const newCount = prev + 1;
          if (newCount >= 3) {
            toast.error('Too many tab switches! Your exam will be submitted.');
            handleSubmitRef.current?.();
          } else {
            setShowTabWarning(true);
          }
          return newCount;
        });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [showInstructions, isSubmitting, isTestMode]);

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
      // Security: Explicitly select only needed fields, excluding correct_option to prevent cheating
      const { data: questionsData, error: questionsError } = await supabase
        .from('questions')
        .select('id, question_text, option_a, option_b, option_c, option_d, marks, order_index')
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

      // Skip submission check in test mode for admins
      if (!isTestMode) {
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
          setShowInstructions(false); // Resume exam
          
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
        }
      }

      setIsLoading(false);
    };

    fetchExamData();
  }, [examId, user, navigate]);

  // Timer countdown
  useEffect(() => {
    if (timeLeft <= 0 || isLoading || showInstructions) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        // Warning at 10 minutes
        if (prev === 600) {
          toast.warning('10 minutes remaining!', { duration: 5000 });
        }
        // Warning at 5 minutes
        if (prev === 300) {
          toast.error('5 minutes remaining!', { duration: 5000 });
        }
        // Warning at 1 minute
        if (prev === 60) {
          toast.error('1 minute remaining!', { duration: 5000 });
        }
        
        if (prev <= 1) {
          handleSubmitRef.current?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, isLoading, showInstructions]);

  const startExam = async () => {
    if (!examId || !user) return;
    
    // In test mode, don't create a real submission
    if (isTestMode) {
      setSubmissionId('test-mode-submission');
      setShowInstructions(false);
      return;
    }
    
    // Create submission
    const { data: newSubmission, error: submitError } = await supabase
      .from('exam_submissions')
      .insert({
        exam_id: examId,
        student_id: user.id,
        total_marks: questions.reduce((sum, q) => sum + (q.marks || 1), 0),
        is_test: isTestMode,
      })
      .select('id')
      .single();

    if (!submitError && newSubmission) {
      setSubmissionId(newSubmission.id);
    }
    
    setShowInstructions(false);
  };

  // Auto-save answer (skip in test mode)
  const saveAnswer = useCallback(async (questionId: string, option: string) => {
    if (!submissionId || isTestMode) return;

    await supabase
      .from('student_answers')
      .upsert({
        submission_id: submissionId,
        question_id: questionId,
        selected_option: option,
      }, { onConflict: 'submission_id,question_id' });
  }, [submissionId, isTestMode]);

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

  const handleSubmit = useCallback(async () => {
    // In test mode, just show completion message and redirect
    if (isTestMode) {
      toast.success('Test completed! Returning to CBT Management...');
      navigate('/admin/cbt');
      return;
    }
    
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
  }, [isTestMode, submissionId, user, navigate]);

  // Keep the ref updated for use in visibility change handler
  useEffect(() => {
    handleSubmitRef.current = handleSubmit;
  }, [handleSubmit]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getTimerColor = () => {
    if (timeLeft <= 300) return 'bg-destructive/10 text-destructive'; // < 5 min
    if (timeLeft <= 600) return 'bg-yellow-500/10 text-yellow-600'; // < 10 min
    return 'bg-primary/10 text-primary';
  };

  const goToFirstUnanswered = () => {
    const unansweredIndex = questions.findIndex(q => !answers.get(q.id)?.selected_option);
    if (unansweredIndex !== -1) {
      setCurrentIndex(unansweredIndex);
    } else {
      toast.info('All questions are answered!');
    }
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

  // Instructions Screen
  if (showInstructions) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl shadow-xl">
          <CardHeader className="text-center border-b">
            {isTestMode && (
              <Badge className="mb-4 mx-auto bg-amber-500 text-amber-950">
                🧪 TEST MODE
              </Badge>
            )}
            <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <BookOpen className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-2xl">{exam?.title}</CardTitle>
            <p className="text-muted-foreground">{exam?.subject}</p>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            {isTestMode && (
              <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
                <p className="text-sm font-medium text-amber-700">Admin Test Mode</p>
                <p className="text-sm text-amber-600">
                  You're previewing this exam. Anti-cheating measures are disabled and no submissions will be recorded.
                </p>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4 text-center">
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-2xl font-bold text-primary">{questions.length}</p>
                <p className="text-sm text-muted-foreground">Questions</p>
              </div>
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-2xl font-bold text-primary">{exam?.duration_minutes}</p>
                <p className="text-sm text-muted-foreground">Minutes</p>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="font-semibold flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                Exam Rules & Instructions
              </h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  Do not switch tabs or leave this page during the exam
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  Right-click is disabled during the exam
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  Your answers are auto-saved as you progress
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  The exam will auto-submit when time expires
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  Switching tabs 3 times will auto-submit your exam
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  Use the flag button to mark questions for review
                </li>
              </ul>
            </div>

            <div className="flex items-start gap-3 p-4 bg-destructive/10 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-destructive mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-destructive">Warning</p>
                <p className="text-muted-foreground">
                  Any form of malpractice will result in immediate disqualification. 
                  Your session is being monitored.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Checkbox 
                id="terms" 
                checked={agreedToTerms}
                onCheckedChange={(checked) => setAgreedToTerms(checked as boolean)}
              />
              <label htmlFor="terms" className="text-sm cursor-pointer">
                I have read and agree to abide by the exam rules and regulations
              </label>
            </div>

            <Button 
              className="w-full" 
              size="lg"
              disabled={!agreedToTerms}
              onClick={startExam}
            >
              Start Exam
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];
  const currentAnswer = currentQuestion ? answers.get(currentQuestion.id) : null;
  const answeredCount = Array.from(answers.values()).filter(a => a.selected_option).length;
  const flaggedCount = Array.from(answers.values()).filter(a => a.flagged).length;
  const progress = (answeredCount / questions.length) * 100;

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Test Mode Banner */}
      {isTestMode && (
        <div className="fixed top-0 left-0 right-0 z-[60] bg-amber-500 text-amber-950 text-center py-2 font-bold text-sm">
          🧪 TEST MODE - No submissions will be saved. Anti-cheating measures disabled.
        </div>
      )}
      {/* Tab Warning Dialog */}
      <AlertDialog open={showTabWarning} onOpenChange={setShowTabWarning}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <Eye className="h-5 w-5" />
              Tab Switch Detected!
            </AlertDialogTitle>
            <AlertDialogDescription>
              You have switched tabs {tabSwitchCount} time(s). Switching tabs 3 times will 
              automatically submit your exam. Please stay on this page.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction>I Understand</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Fixed Header */}
      <header className={cn(
        "fixed left-0 right-0 z-50 bg-background border-b shadow-sm",
        isTestMode ? "top-8" : "top-0"
      )}>
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-bold text-lg">{exam?.title}</h1>
              <p className="text-sm text-muted-foreground">{exam?.subject}</p>
            </div>
            <div className="flex items-center gap-4">
              <div className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg font-mono text-lg font-bold",
                getTimerColor()
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
          <div className="flex items-center gap-2 mt-3">
            <Progress value={progress} className="flex-1 h-2" />
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              {answeredCount}/{questions.length}
            </span>
          </div>
        </div>
      </header>

      <div className={cn("pb-24 container mx-auto px-4", isTestMode ? "pt-36" : "pt-28")}>
        <div className="grid lg:grid-cols-4 gap-6">
          {/* Question Navigation Sidebar */}
          <Card className={cn("lg:col-span-1 h-fit sticky", isTestMode ? "top-36" : "top-28")}>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Questions</CardTitle>
              <p className="text-xs text-muted-foreground">
                {answeredCount}/{questions.length} answered
                {flaggedCount > 0 && ` • ${flaggedCount} flagged`}
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
              <div className="mt-4 space-y-2">
                <div className="flex flex-wrap gap-2 text-xs">
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded bg-primary" />
                    Answered
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded bg-muted" />
                    Unanswered
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded ring-2 ring-orange-500" />
                    Flagged
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full"
                  onClick={goToFirstUnanswered}
                >
                  Go to Unanswered
                </Button>
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

              {/* Question Diagram/Image */}
              {(currentQuestion as any)?.image_url && (
                <div className="rounded-lg border bg-muted/30 p-2 flex justify-center">
                  <img 
                    src={(currentQuestion as any).image_url} 
                    alt="Question diagram" 
                    className="max-h-64 object-contain rounded"
                  />
                </div>
              )}
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
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentIndex(0)}
              disabled={currentIndex === 0}
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
              disabled={currentIndex === 0}
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Previous
            </Button>
          </div>
          <span className="text-sm text-muted-foreground">
            {currentIndex + 1} / {questions.length}
          </span>
          <div className="flex gap-2">
            <Button
              onClick={() => setCurrentIndex(prev => Math.min(questions.length - 1, prev + 1))}
              disabled={currentIndex === questions.length - 1}
            >
              Next
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentIndex(questions.length - 1)}
              disabled={currentIndex === questions.length - 1}
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </footer>

      {/* Submit Confirmation Dialog */}
      <AlertDialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Submit Exam?</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>You have answered {answeredCount} out of {questions.length} questions.</p>
              {answeredCount < questions.length && (
                <p className="text-destructive font-medium">
                  Warning: {questions.length - answeredCount} questions are unanswered!
                </p>
              )}
              {flaggedCount > 0 && (
                <p className="text-orange-500">
                  You have {flaggedCount} flagged questions for review.
                </p>
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
