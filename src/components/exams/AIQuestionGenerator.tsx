import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Loader2, Sparkles, Plus, RefreshCw, CheckCircle2, BookOpen, GraduationCap, X } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface GeneratedQuestion {
  id: string;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_option: string;
  marks: number;
  selected: boolean;
}

interface AIQuestionGeneratorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subject: string;
  classLevel: string;
  onAddQuestions: (questions: Omit<GeneratedQuestion, 'id' | 'selected'>[]) => void;
}

export function AIQuestionGenerator({ 
  open, 
  onOpenChange, 
  subject, 
  classLevel,
  onAddQuestions 
}: AIQuestionGeneratorProps) {
  const [topic, setTopic] = useState('');
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [count, setCount] = useState(5);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedQuestions, setGeneratedQuestions] = useState<GeneratedQuestion[]>([]);
  const [totalAdded, setTotalAdded] = useState(0);

  const missingContext = !subject.trim() || !classLevel.trim();

  const handleGenerate = async () => {
    if (!topic.trim()) {
      toast.error('Please enter a topic');
      return;
    }

    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-questions', {
        body: {
          subject: subject || 'General',
          topic,
          classLevel: classLevel || 'Primary',
          difficulty,
          count,
        },
      });

      if (error) {
        console.error('Function error:', error);
        throw new Error(error.message || 'Failed to generate questions');
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      if (!data?.questions || !Array.isArray(data.questions)) {
        throw new Error('Invalid response format');
      }

      const questionsWithIds: GeneratedQuestion[] = data.questions.map((q: any) => ({
        ...q,
        id: crypto.randomUUID(),
        selected: true,
      }));

      setGeneratedQuestions(questionsWithIds);
      toast.success(`Generated ${questionsWithIds.length} questions!`);
    } catch (error) {
      console.error('Error generating questions:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to generate questions');
    } finally {
      setIsGenerating(false);
    }
  };

  const toggleQuestionSelection = (id: string) => {
    setGeneratedQuestions(prev =>
      prev.map(q => (q.id === id ? { ...q, selected: !q.selected } : q))
    );
  };

  const toggleAllQuestions = (selected: boolean) => {
    setGeneratedQuestions(prev => prev.map(q => ({ ...q, selected })));
  };

  const handleAddSelected = () => {
    const selectedQuestions = generatedQuestions
      .filter(q => q.selected)
      .map(({ id, selected, ...rest }) => rest);

    if (selectedQuestions.length === 0) {
      toast.error('Please select at least one question');
      return;
    }

    onAddQuestions(selectedQuestions);
    setTotalAdded(prev => prev + selectedQuestions.length);
    toast.success(`Added ${selectedQuestions.length} questions to exam`);
    setGeneratedQuestions([]);
    setTopic('');
    // Dialog stays open for multi-batch generation
  };

  const handleClose = () => {
    setTotalAdded(0);
    setGeneratedQuestions([]);
    setTopic('');
    onOpenChange(false);
  };

  const selectedCount = generatedQuestions.filter(q => q.selected).length;

  const difficultyColors: Record<string, string> = {
    easy: 'bg-[hsl(155,75%,45%/0.15)] text-[hsl(155,75%,35%)] border-[hsl(155,75%,45%/0.3)]',
    medium: 'bg-[hsl(35,95%,55%/0.15)] text-[hsl(35,90%,35%)] border-[hsl(35,95%,55%/0.3)]',
    hard: 'bg-[hsl(0,80%,55%/0.15)] text-[hsl(0,80%,40%)] border-[hsl(0,80%,55%/0.3)]',
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col p-0">
        {/* Gradient Header */}
        <div className="relative overflow-hidden bg-gradient-to-br from-[hsl(270,85%,55%)] via-[hsl(260,85%,50%)] to-[hsl(230,85%,55%)] p-5 md:p-6 text-white">
          <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-20 translate-x-20 blur-2xl" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-black/10 rounded-full translate-y-12 -translate-x-12 blur-xl" />
          
          <div className="relative">
            <DialogHeader className="text-left space-y-1">
              <DialogTitle className="flex items-center gap-2 text-white text-lg md:text-xl font-display">
                <div className="p-2 rounded-xl bg-white/20 backdrop-blur-sm">
                  <Sparkles className="h-5 w-5" />
                </div>
                AI Question Generator
              </DialogTitle>
              <DialogDescription className="text-white/80 text-sm">
                Generate questions by topic. Add multiple batches before closing.
              </DialogDescription>
            </DialogHeader>

            {/* Context Badges */}
            <div className="flex flex-wrap items-center gap-2 mt-3">
              {subject ? (
                <Badge className="bg-white/20 text-white border-white/30 text-xs gap-1 backdrop-blur-sm">
                  <BookOpen className="h-3 w-3" /> {subject}
                </Badge>
              ) : (
                <Badge variant="destructive" className="text-xs gap-1">
                  <BookOpen className="h-3 w-3" /> No subject selected
                </Badge>
              )}
              {classLevel ? (
                <Badge className="bg-white/20 text-white border-white/30 text-xs gap-1 backdrop-blur-sm">
                  <GraduationCap className="h-3 w-3" /> {classLevel}
                </Badge>
              ) : (
                <Badge variant="destructive" className="text-xs gap-1">
                  <GraduationCap className="h-3 w-3" /> No class selected
                </Badge>
              )}
              {totalAdded > 0 && (
                <Badge className="bg-[hsl(155,75%,45%)] text-white border-none text-xs gap-1">
                  <CheckCircle2 className="h-3 w-3" /> {totalAdded} added
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
          {missingContext && (
            <div className="rounded-xl border-2 border-dashed border-destructive/30 bg-destructive/5 p-4 text-center">
              <p className="text-sm font-medium text-destructive">
                ⚠️ Please select a <strong>Subject</strong> and <strong>Class</strong> on the exam form first
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                This ensures AI generates accurate, curriculum-aligned questions.
              </p>
            </div>
          )}

          {/* Generation Form */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="col-span-1 sm:col-span-2 space-y-1.5">
              <Label htmlFor="topic" className="text-sm font-semibold">Topic *</Label>
              <Input
                id="topic"
                placeholder="e.g., Photosynthesis, Quadratic Equations"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                disabled={isGenerating || missingContext}
                className="h-10"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-semibold">Difficulty</Label>
              <Select value={difficulty} onValueChange={(v: 'easy' | 'medium' | 'hard') => setDifficulty(v)} disabled={isGenerating || missingContext}>
                <SelectTrigger className="h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="easy">🟢 Easy</SelectItem>
                  <SelectItem value="medium">🟡 Medium</SelectItem>
                  <SelectItem value="hard">🔴 Hard</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="count" className="text-sm font-semibold">Number of Questions</Label>
              <Input
                id="count"
                type="number"
                min={1}
                max={20}
                value={count}
                onChange={(e) => setCount(Math.min(20, Math.max(1, parseInt(e.target.value) || 1)))}
                disabled={isGenerating || missingContext}
                className="h-10"
              />
            </div>
          </div>

          <Button 
            onClick={handleGenerate} 
            disabled={isGenerating || !topic.trim() || missingContext}
            className="w-full h-11 bg-gradient-to-r from-[hsl(270,85%,55%)] to-[hsl(230,85%,55%)] hover:from-[hsl(270,85%,50%)] hover:to-[hsl(230,85%,50%)] text-white shadow-lg"
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generating Questions...
              </>
            ) : generatedQuestions.length > 0 ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                Regenerate Questions
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Generate Questions
              </>
            )}
          </Button>

          {/* Generated Questions Preview */}
          {generatedQuestions.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold">
                    {selectedCount}/{generatedQuestions.length} selected
                  </span>
                  <Badge variant="outline" className={difficultyColors[difficulty]}>
                    {difficulty}
                  </Badge>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => toggleAllQuestions(true)}>
                    All
                  </Button>
                  <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => toggleAllQuestions(false)}>
                    None
                  </Button>
                </div>
              </div>

              <ScrollArea className="h-[250px] sm:h-[300px] border rounded-xl p-2">
                <div className="space-y-3 pr-2">
                  {generatedQuestions.map((q, idx) => (
                    <div 
                      key={q.id} 
                      className={`p-3 rounded-xl border-2 transition-all duration-200 ${
                        q.selected 
                          ? 'bg-[hsl(270,85%,60%/0.05)] border-[hsl(270,85%,60%/0.3)] shadow-sm' 
                          : 'bg-muted/20 border-border/30'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <Checkbox
                          checked={q.selected}
                          onCheckedChange={() => toggleQuestionSelection(q.id)}
                          className="mt-0.5"
                        />
                        <div className="flex-1 space-y-2 min-w-0">
                          <p className="font-medium text-sm leading-snug">
                            {idx + 1}. {q.question_text}
                          </p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-xs">
                            {['A', 'B', 'C', 'D'].map(opt => (
                              <div 
                                key={opt}
                                className={`rounded-md px-2 py-1 ${
                                  q.correct_option === opt 
                                    ? 'bg-[hsl(155,75%,45%/0.15)] text-[hsl(155,75%,30%)] font-semibold' 
                                    : 'text-muted-foreground'
                                }`}
                              >
                                {opt}. {q[`option_${opt.toLowerCase()}` as keyof GeneratedQuestion] as string}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>

              <Button 
                onClick={handleAddSelected}
                disabled={selectedCount === 0}
                className="w-full h-11 bg-gradient-to-r from-[hsl(155,75%,40%)] to-[hsl(170,75%,40%)] hover:from-[hsl(155,75%,35%)] hover:to-[hsl(170,75%,35%)] text-white shadow-lg"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add {selectedCount} Question{selectedCount !== 1 ? 's' : ''} to Exam
              </Button>
            </div>
          )}
        </div>

        {/* Footer */}
        <DialogFooter className="border-t border-border/50 px-4 md:px-6 py-3 bg-muted/30">
          <div className="flex items-center justify-between w-full">
            <span className="text-xs text-muted-foreground">
              {totalAdded > 0 
                ? `✅ ${totalAdded} question${totalAdded !== 1 ? 's' : ''} added this session` 
                : 'Generate questions by topic, add multiple batches'}
            </span>
            <Button variant="outline" size="sm" onClick={handleClose}>
              {totalAdded > 0 ? 'Done' : 'Close'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
