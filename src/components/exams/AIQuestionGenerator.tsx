import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Sparkles, Plus, RefreshCw } from 'lucide-react';
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
    toast.success(`Added ${selectedQuestions.length} questions to exam`);
    setGeneratedQuestions([]);
    setTopic('');
    onOpenChange(false);
  };

  const selectedCount = generatedQuestions.filter(q => q.selected).length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
            disabled={isGenerating || !topic.trim()}
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
                            <div className={q.correct_option === 'A' ? 'text-green-600 font-medium' : 'text-muted-foreground'}>
                              A. {q.option_a}
                            </div>
                            <div className={q.correct_option === 'B' ? 'text-green-600 font-medium' : 'text-muted-foreground'}>
                              B. {q.option_b}
                            </div>
                            <div className={q.correct_option === 'C' ? 'text-green-600 font-medium' : 'text-muted-foreground'}>
                              C. {q.option_c}
                            </div>
                            <div className={q.correct_option === 'D' ? 'text-green-600 font-medium' : 'text-muted-foreground'}>
                              D. {q.option_d}
                            </div>
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
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add {selectedCount} Question{selectedCount !== 1 ? 's' : ''} to Exam
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
