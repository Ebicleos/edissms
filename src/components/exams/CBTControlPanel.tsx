import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Shield, Power, AlertTriangle, Users, Clock, Activity, StopCircle } from 'lucide-react';

interface CBTControlPanelProps {
  isExamActive: boolean;
  onToggle: (active: boolean) => void;
  examCount: number;
}

interface ActiveSession {
  exam_id: string;
  student_count: number;
  exam_title: string;
}

export function CBTControlPanel({ isExamActive, onToggle, examCount }: CBTControlPanelProps) {
  const [isToggling, setIsToggling] = useState(false);
  const [activeSessions, setActiveSessions] = useState<ActiveSession[]>([]);
  const [totalActiveStudents, setTotalActiveStudents] = useState(0);

  useEffect(() => {
    if (isExamActive) {
      fetchActiveSessions();
      // Set up polling for real-time updates
      const interval = setInterval(fetchActiveSessions, 30000);
      return () => clearInterval(interval);
    }
  }, [isExamActive]);

  const fetchActiveSessions = async () => {
    try {
      const { data: sessions, error } = await supabase
        .from('exam_sessions')
        .select('exam_id, exams(title)')
        .eq('is_active', true);

      if (error) throw error;

      // Group by exam
      const grouped = (sessions || []).reduce((acc: Record<string, any>, session: any) => {
        const examId = session.exam_id;
        if (!acc[examId]) {
          acc[examId] = {
            exam_id: examId,
            exam_title: session.exams?.title || 'Unknown Exam',
            student_count: 0,
          };
        }
        acc[examId].student_count++;
        return acc;
      }, {});

      const sessionsList = Object.values(grouped) as ActiveSession[];
      setActiveSessions(sessionsList);
      setTotalActiveStudents(sessions?.length || 0);
    } catch (error) {
      console.error('Failed to fetch active sessions:', error);
    }
  };

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

  const handleEmergencyStop = async () => {
    setIsToggling(true);
    try {
      // Deactivate all exams
      await supabase
        .from('exams')
        .update({ is_exam_active: false })
        .eq('is_published', true);

      // End all active sessions
      await supabase
        .from('exam_sessions')
        .update({ is_active: false })
        .eq('is_active', true);

      onToggle(false);
      setActiveSessions([]);
      setTotalActiveStudents(0);
      toast.success('Emergency stop executed', { 
        description: 'All exams deactivated and sessions ended' 
      });
    } catch (error: any) {
      toast.error('Failed to execute emergency stop', { description: error.message });
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
          <div className="flex items-center gap-2">
            {isExamActive && totalActiveStudents > 0 && (
              <Badge variant="secondary" className="bg-blue-500/10 text-blue-600">
                <Users className="mr-1 h-3 w-3" />
                {totalActiveStudents} Active
              </Badge>
            )}
            <Badge variant={isExamActive ? 'default' : 'secondary'} className={isExamActive ? 'bg-success' : ''}>
              {isExamActive ? 'Active' : 'Inactive'}
            </Badge>
          </div>
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
          <>
            <div className="flex items-start gap-2 p-3 rounded-lg bg-success/10 border border-success/20 text-sm">
              <Shield className="h-4 w-4 text-success mt-0.5" />
              <div>
                <p className="font-medium text-success">Exam Mode Active</p>
                <p className="text-muted-foreground">
                  Anti-cheating measures are enabled. Tab switches and suspicious activities are being monitored.
                </p>
              </div>
            </div>

            {/* Active Sessions Summary */}
            {activeSessions.length > 0 && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">Active Sessions</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {activeSessions.slice(0, 4).map((session) => (
                    <div key={session.exam_id} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                      <div className="flex items-center gap-2">
                        <Activity className="h-3 w-3 text-success" />
                        <span className="text-sm truncate max-w-[150px]">{session.exam_title}</span>
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {session.student_count} student{session.student_count !== 1 ? 's' : ''}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Emergency Stop Button */}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="w-full" disabled={isToggling}>
                  <StopCircle className="mr-2 h-4 w-4" />
                  Emergency Stop All Exams
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle className="flex items-center gap-2 text-destructive">
                    <AlertTriangle className="h-5 w-5" />
                    Emergency Stop - Confirm
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    This will immediately:
                    <ul className="list-disc list-inside mt-2 space-y-1">
                      <li>Deactivate all published exams</li>
                      <li>End all active student sessions</li>
                      <li>Students will lose unsaved progress</li>
                    </ul>
                    <p className="mt-2 font-medium text-destructive">
                      This action cannot be undone. Use only in emergencies.
                    </p>
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={handleEmergencyStop}
                    className="bg-destructive hover:bg-destructive/90"
                  >
                    Execute Emergency Stop
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </>
        )}
      </CardContent>
    </Card>
  );
}
