import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Sparkles, Plus, RefreshCw, BookOpen, GraduationCap, AlertTriangle, Check } from 'lucide-react';
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
  const [addedCount, setAddedCount] = useState(0);

  const missingContext = !subject.trim() || !classLevel.trim();

  const handleDialogChange = (isOpen: boolean) => {
    if (!isOpen) {
      setAddedCount(0);
      setGeneratedQuestions([]);
      setTopic('');
    }
    onOpenChange(isOpen);
  };

  const handleGenerate = async () => {
    if (missingContext) {
      toast.error('Please select a subject and class on the exam form first');
      return;
    }
    if (!topic.trim()) {
      toast.error('Please enter a topic');
      return;
    }

    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-questions', {
        body: { subject, topic, classLevel, difficulty, count },
      });

      if (error) throw new Error(error.message || 'Failed to generate questions');
      if (data?.error) throw new Error(data.error);
      if (!data?.questions || !Array.isArray(data.questions)) throw new Error('Invalid response format');

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
    setAddedCount(prev => prev + selectedQuestions.length);
    toast.success(`Added ${selectedQuestions.length} questions to exam`);
    setGeneratedQuestions([]);
    setTopic('');
    // Dialog stays open for "Generate More"
  };

  const selectedCount = generatedQuestions.filter(q => q.selected).length;

  return (
    <Dialog open={open} onOpenChange={handleDialogChange}>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            AI Question Generator
          </DialogTitle>
          <DialogDescription>
            Generate multiple-choice questions using AI. Review and select questions before adding them.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Context Banner */}
          {missingContext ? (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-sm text-destructive">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>Please select a <strong>subject</strong> and <strong>class</strong> on the exam form before generating questions.</span>
            </div>
          ) : (
            <div className="flex items-center gap-4 p-3 rounded-lg bg-primary/5 border border-primary/20 text-sm">
              <span className="flex items-center gap-1.5 font-medium">
                <BookOpen className="h-4 w-4 text-primary" />
                {subject}
              </span>
              <span className="flex items-center gap-1.5 font-medium">
                <GraduationCap className="h-4 w-4 text-primary" />
                {classLevel}
              </span>
            </div>
          )}

          {/* Generation Form */}
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 space-y-2">
              <Label htmlFor="topic">Topic *</Label>
              <Input
                id="topic"
                placeholder="e.g., Photosynthesis, Quadratic Equations, World War II"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                disabled={isGenerating}
              />
            </div>
            <div className="space-y-2">
              <Label>Difficulty</Label>
              <Select value={difficulty} onValueChange={(v: 'easy' | 'medium' | 'hard') => setDifficulty(v)} disabled={isGenerating}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="easy">Easy</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="hard">Hard</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="count">Number of Questions</Label>
              <Input
                id="count"
                type="number"
                min={1}
                max={20}
                value={count}
                onChange={(e) => setCount(Math.min(20, Math.max(1, parseInt(e.target.value) || 1)))}
                disabled={isGenerating}
              />
            </div>
          </div>

          <Button 
            onClick={handleGenerate} 
            disabled={isGenerating || !topic.trim() || missingContext}
            className="w-full"
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
                <span className="text-sm font-medium">
                  {selectedCount} of {generatedQuestions.length} selected
                </span>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={() => toggleAllQuestions(true)}>
                    Select All
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => toggleAllQuestions(false)}>
                    Deselect All
                  </Button>
                </div>
              </div>

              <ScrollArea className="h-[300px] border rounded-lg p-3">
                <div className="space-y-4">
                  {generatedQuestions.map((q, idx) => (
                    <div 
                      key={q.id} 
                      className={`p-3 border rounded-lg transition-colors ${q.selected ? 'bg-primary/5 border-primary/30' : 'bg-muted/30'}`}
                    >
                      <div className="flex items-start gap-3">
                        <Checkbox
                          checked={q.selected}
                          onCheckedChange={() => toggleQuestionSelection(q.id)}
                          className="mt-1"
                        />
                        <div className="flex-1 space-y-2">
                          <p className="font-medium text-sm">
                            {idx + 1}. {q.question_text}
                          </p>
                          <div className="grid grid-cols-2 gap-1 text-xs">
                            {(['A', 'B', 'C', 'D'] as const).map(opt => (
                              <div key={opt} className={q.correct_option === opt ? 'text-green-600 font-medium' : 'text-muted-foreground'}>
                                {opt}. {q[`option_${opt.toLowerCase()}` as keyof typeof q] as string}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>

              <div className="flex items-center gap-2">
                <Button 
                  onClick={handleAddSelected}
                  disabled={selectedCount === 0}
                  className="flex-1"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add {selectedCount} Question{selectedCount !== 1 ? 's' : ''} to Exam
                </Button>
                <Button variant="outline" onClick={() => handleDialogChange(false)}>
                  Done
                </Button>
              </div>
            </div>
          )}

          {/* Cumulative count + Done (when no questions shown) */}
          {addedCount > 0 && generatedQuestions.length === 0 && (
            <div className="flex items-center justify-between p-3 rounded-lg bg-primary/10 border border-primary/20 text-sm">
              <span className="flex items-center gap-1.5 text-primary">
                <Check className="h-4 w-4" />
                {addedCount} question{addedCount !== 1 ? 's' : ''} added this session
              </span>
              <Button size="sm" variant="outline" onClick={() => handleDialogChange(false)}>
                Done
              </Button>
            </div>
          )}

          {/* Running total shown alongside questions */}
          {addedCount > 0 && generatedQuestions.length > 0 && (
            <p className="text-xs text-muted-foreground text-center">
              {addedCount} question{addedCount !== 1 ? 's' : ''} added so far this session
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
