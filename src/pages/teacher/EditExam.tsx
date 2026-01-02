import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';

const CLASS_LIST = [
  'Creche', 'Pre-Nursery', 'Nursery 1', 'Nursery 2',
  'Primary 1', 'Primary 2', 'Primary 3', 'Primary 4', 'Primary 5', 'Primary 6',
  'JSS 1', 'JSS 2', 'JSS 3',
  'SSS 1', 'SSS 2', 'SSS 3'
];

export default function EditExam() {
  const { examId } = useParams<{ examId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    subject: '',
    class_id: '',
    duration_minutes: 60,
  });

  useEffect(() => {
    async function fetchExam() {
      if (!examId) return;
      
      try {
        const { data, error } = await supabase
          .from('exams')
          .select('*')
          .eq('id', examId)
          .single();

        if (error) throw error;

        if (data) {
          setFormData({
            title: data.title,
            subject: data.subject,
            class_id: data.class_id,
            duration_minutes: data.duration_minutes,
          });
        }
      } catch (error) {
        console.error('Error fetching exam:', error);
        toast.error('Failed to load exam');
        navigate('/teacher/exams');
      } finally {
        setIsLoading(false);
      }
    }

    fetchExam();
  }, [examId, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.subject || !formData.class_id) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('exams')
        .update({
          title: formData.title,
          subject: formData.subject,
          class_id: formData.class_id,
          duration_minutes: formData.duration_minutes,
        })
        .eq('id', examId);

      if (error) throw error;

      toast.success('Exam updated successfully');
      navigate('/teacher/exams');
    } catch (error) {
      console.error('Error updating exam:', error);
      toast.error('Failed to update exam');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <MainLayout title="Edit Exam">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Edit Exam" subtitle="Update exam details">
      <div className="max-w-2xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => navigate('/teacher/exams')}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Exams
        </Button>

        <Card>
          <CardHeader>
            <CardTitle>Exam Details</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Exam Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Enter exam title"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="subject">Subject *</Label>
                <Input
                  id="subject"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  placeholder="Enter subject"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="class">Class *</Label>
                <Select
                  value={formData.class_id}
                  onValueChange={(value) => setFormData({ ...formData, class_id: value })}
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
                  min={1}
                  value={formData.duration_minutes}
                  onChange={(e) => setFormData({ ...formData, duration_minutes: parseInt(e.target.value) || 60 })}
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button type="submit" disabled={isSaving}>
                  {isSaving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/teacher/exams')}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
