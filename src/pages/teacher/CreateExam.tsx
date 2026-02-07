import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Plus, Trash2, Save, Loader2, Sparkles, ImagePlus, X } from 'lucide-react';
import { toast } from 'sonner';
import { CLASS_LIST } from '@/types';
import { examDetailsSchema, examQuestionSchema, validateInput, validateArray } from '@/lib/validations';
import { AIQuestionGenerator } from '@/components/exams/AIQuestionGenerator';

interface Question {
  id: string;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_option: string;
  marks: number;
  image_url?: string;
}

export default function CreateExam() {
  const navigate = useNavigate();
  const { user, userClass } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [aiGeneratorOpen, setAiGeneratorOpen] = useState(false);

  const [examData, setExamData] = useState({
    title: '',
    subject: '',
    class_id: userClass || '',
    duration_minutes: 60,
  });

  const [questions, setQuestions] = useState<Question[]>([
    {
      id: crypto.randomUUID(),
      question_text: '',
      option_a: '',
      option_b: '',
      option_c: '',
      option_d: '',
      correct_option: 'A',
      marks: 1,
    },
  ]);

  const addQuestion = () => {
    setQuestions([
      ...questions,
      {
        id: crypto.randomUUID(),
        question_text: '',
        option_a: '',
        option_b: '',
        option_c: '',
        option_d: '',
        correct_option: 'A',
        marks: 1,
      },
    ]);
  };

  const removeQuestion = (id: string) => {
    if (questions.length === 1) {
      toast.error('You need at least one question');
      return;
    }
    setQuestions(questions.filter(q => q.id !== id));
  };

  const updateQuestion = (id: string, field: keyof Question, value: string | number) => {
    setQuestions(questions.map(q => 
      q.id === id ? { ...q, [field]: value } : q
    ));
  };

  const handleAddAIQuestions = (generatedQuestions: Omit<Question, 'id'>[]) => {
    const newQuestions = generatedQuestions.map(q => ({
      ...q,
      id: crypto.randomUUID(),
    }));
    setQuestions([...questions, ...newQuestions]);
  };

  const handleDiagramUpload = async (questionId: string, file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB');
      return;
    }
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    const fileExt = file.name.split('.').pop();
    const fileName = `${questionId}-${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('exam-assets')
      .upload(fileName, file, { upsert: true });

    if (uploadError) {
      toast.error('Failed to upload diagram');
      return;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('exam-assets')
      .getPublicUrl(fileName);

    updateQuestion(questionId, 'image_url', publicUrl);
    toast.success('Diagram uploaded!');
  };

  const removeDiagram = (questionId: string) => {
    updateQuestion(questionId, 'image_url', '');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate exam details using Zod schema
    const examValidation = validateInput(examDetailsSchema, examData);
    if (!examValidation.success) {
      toast.error((examValidation as { success: false; error: string }).error);
      return;
    }

    // Validate all questions
    const questionsValidation = validateArray(examQuestionSchema, questions);
    if (!questionsValidation.success) {
      const failed = questionsValidation as { success: false; error: string; index: number };
      toast.error(`Question ${failed.index + 1}: ${failed.error}`);
      return;
    }

    setIsLoading(true);

    // Create exam
    const { data: exam, error: examError } = await supabase
      .from('exams')
      .insert({
        ...examData,
        teacher_id: user?.id,
      })
      .select('id')
      .single();

    if (examError || !exam) {
      toast.error('Failed to create exam');
      setIsLoading(false);
      return;
    }

    // Create questions
    const questionsToInsert = questions.map((q, idx) => ({
      exam_id: exam.id,
      question_text: q.question_text,
      option_a: q.option_a,
      option_b: q.option_b,
      option_c: q.option_c || null,
      option_d: q.option_d || null,
      correct_option: q.correct_option,
      marks: q.marks,
      order_index: idx,
      image_url: q.image_url || null,
    }));

    const { error: questionsError } = await supabase
      .from('questions')
      .insert(questionsToInsert);

    if (questionsError) {
      toast.error('Failed to create questions');
      setIsLoading(false);
      return;
    }

    toast.success('Exam created successfully!');
    navigate('/teacher/exams');
  };

  return (
    <MainLayout>
      <div className="space-y-6 max-w-4xl mx-auto">
        <Button variant="ghost" onClick={() => navigate('/teacher/exams')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Exams
        </Button>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Exam Details */}
          <Card>
            <CardHeader>
              <CardTitle>Exam Details</CardTitle>
              <CardDescription>Basic information about the exam</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Exam Title</Label>
                  <Input
                    id="title"
                    placeholder="e.g., Mid-Term Mathematics Test"
                    value={examData.title}
                    onChange={(e) => setExamData({ ...examData, title: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="subject">Subject</Label>
                  <Input
                    id="subject"
                    placeholder="e.g., Mathematics"
                    value={examData.subject}
                    onChange={(e) => setExamData({ ...examData, subject: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Class</Label>
                  <Select
                    value={examData.class_id}
                    onValueChange={(value) => setExamData({ ...examData, class_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select class" />
                    </SelectTrigger>
                    <SelectContent>
                      {CLASS_LIST.map((cls) => (
                        <SelectItem key={cls} value={cls}>
                          {cls}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="duration">Duration (minutes)</Label>
                  <Input
                    id="duration"
                    type="number"
                    min="5"
                    max="180"
                    value={examData.duration_minutes}
                    onChange={(e) => setExamData({ ...examData, duration_minutes: parseInt(e.target.value) })}
                    required
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Questions */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Questions</CardTitle>
                  <CardDescription>{questions.length} question(s)</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button type="button" variant="outline" onClick={() => setAiGeneratorOpen(true)}>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Generate with AI
                  </Button>
                  <Button type="button" variant="outline" onClick={addQuestion}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Question
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {questions.map((question, idx) => (
                <div key={question.id} className="p-4 border rounded-lg space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Question {idx + 1}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeQuestion(question.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>

                  <div className="space-y-2">
                    <Label>Question Text</Label>
                    <Textarea
                      placeholder="Enter your question"
                      value={question.question_text}
                      onChange={(e) => updateQuestion(question.id, 'question_text', e.target.value)}
                      required
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Option A *</Label>
                      <Input
                        placeholder="Option A"
                        value={question.option_a}
                        onChange={(e) => updateQuestion(question.id, 'option_a', e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Option B *</Label>
                      <Input
                        placeholder="Option B"
                        value={question.option_b}
                        onChange={(e) => updateQuestion(question.id, 'option_b', e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Option C</Label>
                      <Input
                        placeholder="Option C (optional)"
                        value={question.option_c}
                        onChange={(e) => updateQuestion(question.id, 'option_c', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Option D</Label>
                      <Input
                        placeholder="Option D (optional)"
                        value={question.option_d}
                        onChange={(e) => updateQuestion(question.id, 'option_d', e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Diagram Upload */}
                  <div className="space-y-2">
                    <Label className="text-sm text-muted-foreground">📊 Diagram / Image (Optional)</Label>
                    {question.image_url ? (
                      <div className="relative inline-block">
                        <img src={question.image_url} alt="Question diagram" className="max-h-40 rounded-lg border" />
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="absolute -top-2 -right-2 h-6 w-6"
                          onClick={() => removeDiagram(question.id)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ) : (
                      <label className="flex items-center gap-2 px-3 py-2 border-2 border-dashed rounded-lg cursor-pointer hover:border-primary/50 transition-colors w-fit">
                        <ImagePlus className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">Attach diagram</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleDiagramUpload(question.id, file);
                            e.target.value = '';
                          }}
                        />
                      </label>
                    )}
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Correct Answer</Label>
                      <Select
                        value={question.correct_option}
                        onValueChange={(value) => updateQuestion(question.id, 'correct_option', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="A">A</SelectItem>
                          <SelectItem value="B">B</SelectItem>
                          <SelectItem value="C">C</SelectItem>
                          <SelectItem value="D">D</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Marks</Label>
                      <Input
                        type="number"
                        min="1"
                        max="10"
                        value={question.marks}
                        onChange={(e) => updateQuestion(question.id, 'marks', parseInt(e.target.value))}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Submit */}
          <div className="flex justify-end gap-4">
            <Button type="button" variant="outline" onClick={() => navigate('/teacher/exams')}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Create Exam
                </>
              )}
            </Button>
          </div>
        </form>

        <AIQuestionGenerator
          open={aiGeneratorOpen}
          onOpenChange={setAiGeneratorOpen}
          subject={examData.subject}
          classLevel={examData.class_id}
          onAddQuestions={handleAddAIQuestions}
        />
      </div>
    </MainLayout>
  );
}
