import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Shield, Power, AlertTriangle } from 'lucide-react';

interface CBTControlPanelProps {
  isExamActive: boolean;
  onToggle: (active: boolean) => void;
  examCount: number;
}

export function CBTControlPanel({ isExamActive, onToggle, examCount }: CBTControlPanelProps) {
  const [isToggling, setIsToggling] = useState(false);

  const handleGlobalToggle = async (active: boolean) => {
    setIsToggling(true);
    try {
      // Update all published exams
      const { error } = await supabase
        .from('exams')
        .update({ is_exam_active: active })
        .eq('is_published', true);

      if (error) throw error;

      onToggle(active);
      toast.success(
        active ? 'All CBT exams are now active' : 'All CBT exams are now deactivated',
        { description: active ? 'Students can now take published exams' : 'Students cannot access exams' }
      );
    } catch (error: any) {
      toast.error('Failed to update exam status', { description: error.message });
    } finally {
      setIsToggling(false);
    }
  };

  return (
    <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">CBT Control Panel</CardTitle>
          </div>
          <Badge variant={isExamActive ? 'default' : 'secondary'} className={isExamActive ? 'bg-success' : ''}>
            {isExamActive ? 'Active' : 'Inactive'}
          </Badge>
        </div>
        <CardDescription>
          Control access to all Computer-Based Tests
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between p-4 rounded-lg bg-card border border-border">
          <div className="flex items-center gap-3">
            <Power className={`h-5 w-5 ${isExamActive ? 'text-success' : 'text-muted-foreground'}`} />
            <div>
              <Label htmlFor="global-toggle" className="font-medium">
                Global CBT Access
              </Label>
              <p className="text-sm text-muted-foreground">
                {examCount} published exam{examCount !== 1 ? 's' : ''} will be affected
              </p>
            </div>
          </div>
          
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Switch
                id="global-toggle"
                checked={isExamActive}
                disabled={isToggling}
              />
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-warning" />
                  {isExamActive ? 'Deactivate All Exams?' : 'Activate All Exams?'}
                </AlertDialogTitle>
                <AlertDialogDescription>
                  {isExamActive 
                    ? 'This will prevent all students from accessing any CBT exams. Students currently taking exams will be interrupted.'
                    : 'This will allow students to access all published CBT exams. Make sure all exams are properly configured before activating.'
                  }
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction 
                  onClick={() => handleGlobalToggle(!isExamActive)}
                  className={isExamActive ? 'bg-destructive hover:bg-destructive/90' : 'bg-success hover:bg-success/90'}
                >
                  {isExamActive ? 'Deactivate' : 'Activate'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

        {isExamActive && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-success/10 border border-success/20 text-sm">
            <Shield className="h-4 w-4 text-success mt-0.5" />
            <div>
              <p className="font-medium text-success">Exam Mode Active</p>
              <p className="text-muted-foreground">
                Anti-cheating measures are enabled. Tab switches and suspicious activities are being monitored.
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
