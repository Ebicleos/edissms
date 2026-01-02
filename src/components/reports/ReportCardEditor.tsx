import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ReportCardData } from '@/hooks/useReportCards';
import { Save, Loader2 } from 'lucide-react';

interface ReportCardEditorProps {
  data: ReportCardData;
  onSave: (updatedData: ReportCardData) => Promise<void>;
  onClose: () => void;
}

export function ReportCardEditor({ data, onSave, onClose }: ReportCardEditorProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    attitude: data.attitude || '',
    interest: data.interest || '',
    conduct: data.conduct || '',
    teacherRemarks: data.teacherRemarks || '',
    principalRemarks: data.principalRemarks || '',
    promotionStatus: data.promotionStatus || '',
  });

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave({
        ...data,
        ...formData,
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Report Card - {data.studentName}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="attitude">Attitude</Label>
              <Input
                id="attitude"
                value={formData.attitude}
                onChange={(e) => setFormData({ ...formData, attitude: e.target.value })}
                placeholder="e.g., Brilliant, Hardworking"
              />
            </div>
            <div>
              <Label htmlFor="interest">Interest</Label>
              <Input
                id="interest"
                value={formData.interest}
                onChange={(e) => setFormData({ ...formData, interest: e.target.value })}
                placeholder="e.g., Sports, Music"
              />
            </div>
            <div>
              <Label htmlFor="conduct">Conduct</Label>
              <Input
                id="conduct"
                value={formData.conduct}
                onChange={(e) => setFormData({ ...formData, conduct: e.target.value })}
                placeholder="e.g., Respectful, Polite"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="teacherRemarks">Class Teacher's Remarks</Label>
            <Textarea
              id="teacherRemarks"
              value={formData.teacherRemarks}
              onChange={(e) => setFormData({ ...formData, teacherRemarks: e.target.value })}
              placeholder="Enter teacher's remarks..."
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="principalRemarks">Head Teacher's Remarks</Label>
            <Textarea
              id="principalRemarks"
              value={formData.principalRemarks}
              onChange={(e) => setFormData({ ...formData, principalRemarks: e.target.value })}
              placeholder="Enter head teacher's remarks..."
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="promotionStatus">Promotion Status</Label>
            <Input
              id="promotionStatus"
              value={formData.promotionStatus}
              onChange={(e) => setFormData({ ...formData, promotionStatus: e.target.value })}
              placeholder="e.g., PASSED AND PROMOTED TO PRIMARY 4"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
