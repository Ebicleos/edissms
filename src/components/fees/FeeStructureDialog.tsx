import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CLASS_LIST_DETAILED, ACADEMIC_YEARS, getCurrentAcademicYear } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface FeeStructureDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

const TERMS = ['First Term', 'Second Term', 'Third Term'];

export function FeeStructureDialog({ open, onOpenChange, onSuccess }: FeeStructureDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState(() => ({
    class_id: '',
    term: '',
    academic_year: getCurrentAcademicYear(),
    tuition_fee: '',
    development_fee: '',
    uniform_fee: '',
    books_fee: '',
    exam_fee: '',
    other_fees: '',
  }));

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const calculateTotal = () => {
    return (
      (parseFloat(formData.tuition_fee) || 0) +
      (parseFloat(formData.development_fee) || 0) +
      (parseFloat(formData.uniform_fee) || 0) +
      (parseFloat(formData.books_fee) || 0) +
      (parseFloat(formData.exam_fee) || 0) +
      (parseFloat(formData.other_fees) || 0)
    );
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.class_id || !formData.term || !formData.academic_year) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('fee_structures').insert({
        class_id: formData.class_id,
        term: formData.term,
        academic_year: formData.academic_year,
        tuition_fee: parseFloat(formData.tuition_fee) || 0,
        development_fee: parseFloat(formData.development_fee) || 0,
        uniform_fee: parseFloat(formData.uniform_fee) || 0,
        books_fee: parseFloat(formData.books_fee) || 0,
        exam_fee: parseFloat(formData.exam_fee) || 0,
        other_fees: parseFloat(formData.other_fees) || 0,
      });

      if (error) throw error;

      toast.success('Fee structure created successfully');
      onOpenChange(false);
      onSuccess?.();
      setFormData({
        class_id: '',
        term: '',
        academic_year: getCurrentAcademicYear(),
        tuition_fee: '',
        development_fee: '',
        uniform_fee: '',
        books_fee: '',
        exam_fee: '',
        other_fees: '',
      });
    } catch (error: any) {
      toast.error('Failed to create fee structure', { description: error.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Fee Structure</DialogTitle>
          <DialogDescription>
            Define the fee breakdown for a class and term
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label htmlFor="class">Class *</Label>
              <Select value={formData.class_id} onValueChange={(v) => handleInputChange('class_id', v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  {CLASS_LIST_DETAILED.map((cls) => (
                    <SelectItem key={cls.id} value={cls.id}>{cls.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="term">Term *</Label>
              <Select value={formData.term} onValueChange={(v) => handleInputChange('term', v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  {TERMS.map((term) => (
                    <SelectItem key={term} value={term}>{term}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="year">Year *</Label>
              <Select value={formData.academic_year} onValueChange={(v) => handleInputChange('academic_year', v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  {ACADEMIC_YEARS.map((year) => (
                    <SelectItem key={year} value={year}>{year}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="tuition">Tuition Fee (₦)</Label>
              <Input
                id="tuition"
                type="number"
                value={formData.tuition_fee}
                onChange={(e) => handleInputChange('tuition_fee', e.target.value)}
                placeholder="0"
              />
            </div>
            <div>
              <Label htmlFor="development">Development Fee (₦)</Label>
              <Input
                id="development"
                type="number"
                value={formData.development_fee}
                onChange={(e) => handleInputChange('development_fee', e.target.value)}
                placeholder="0"
              />
            </div>
            <div>
              <Label htmlFor="uniform">Uniform Fee (₦)</Label>
              <Input
                id="uniform"
                type="number"
                value={formData.uniform_fee}
                onChange={(e) => handleInputChange('uniform_fee', e.target.value)}
                placeholder="0"
              />
            </div>
            <div>
              <Label htmlFor="books">Books Fee (₦)</Label>
              <Input
                id="books"
                type="number"
                value={formData.books_fee}
                onChange={(e) => handleInputChange('books_fee', e.target.value)}
                placeholder="0"
              />
            </div>
            <div>
              <Label htmlFor="exam">Exam Fee (₦)</Label>
              <Input
                id="exam"
                type="number"
                value={formData.exam_fee}
                onChange={(e) => handleInputChange('exam_fee', e.target.value)}
                placeholder="0"
              />
            </div>
            <div>
              <Label htmlFor="other">Other Fees (₦)</Label>
              <Input
                id="other"
                type="number"
                value={formData.other_fees}
                onChange={(e) => handleInputChange('other_fees', e.target.value)}
                placeholder="0"
              />
            </div>
          </div>

          <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
            <div className="flex justify-between items-center">
              <span className="font-medium">Total Amount:</span>
              <span className="text-xl font-bold text-primary">{formatCurrency(calculateTotal())}</span>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="bg-gradient-primary">
              {isSubmitting ? 'Creating...' : 'Create Fee Structure'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
