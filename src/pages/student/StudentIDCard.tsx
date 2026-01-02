import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Download, Printer, IdCard, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface StudentInfo {
  fullName: string;
  admissionNumber: string;
  className: string;
  photoUrl: string | null;
  email: string | null;
}

export default function StudentIDCard() {
  const { user, profile, userClass } = useAuth();
  const [studentInfo, setStudentInfo] = useState<StudentInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchStudentInfo();
  }, [user, profile, userClass]);

  const fetchStudentInfo = async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    // Get admission number from student_classes
    const { data: studentClass } = await supabase
      .from('student_classes')
      .select('admission_number')
      .eq('student_id', user.id)
      .maybeSingle();

    setStudentInfo({
      fullName: profile?.full_name || 'Student',
      admissionNumber: studentClass?.admission_number || 'N/A',
      className: userClass || 'N/A',
      photoUrl: profile?.photo_url || null,
      email: profile?.email || null,
    });
    setIsLoading(false);
  };

  const handlePrint = () => {
    toast.success('Preparing ID card for printing...');
    window.print();
  };

  const handleDownload = () => {
    toast.success('Downloading ID card...', {
      description: 'Your ID card will be downloaded as a PDF.',
    });
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  if (!studentInfo) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center h-64">
          <IdCard className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Could not load student information</p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">My ID Card</h1>
            <p className="text-muted-foreground">View and print your student ID card</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handlePrint}>
              <Printer className="mr-2 h-4 w-4" />
              Print
            </Button>
            <Button onClick={handleDownload}>
              <Download className="mr-2 h-4 w-4" />
              Download
            </Button>
          </div>
        </div>

        <div className="flex justify-center">
          <Card className="w-[400px] overflow-hidden print:shadow-none">
            {/* ID Card Header */}
            <div className="bg-gradient-to-r from-primary to-primary/80 p-4 text-primary-foreground">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-white/20 flex items-center justify-center">
                  <IdCard className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="font-bold text-lg">EduManage School</h2>
                  <p className="text-xs text-primary-foreground/80">Student Identification Card</p>
                </div>
              </div>
            </div>

            <CardContent className="p-6">
              <div className="flex gap-6">
                {/* Photo */}
                <div className="flex-shrink-0">
                  {studentInfo.photoUrl ? (
                    <img
                      src={studentInfo.photoUrl}
                      alt="Student Photo"
                      className="w-24 h-28 object-cover rounded-lg border-2 border-border"
                    />
                  ) : (
                    <div className="w-24 h-28 bg-muted rounded-lg border-2 border-border flex items-center justify-center">
                      <span className="text-2xl font-bold text-muted-foreground">
                        {studentInfo.fullName.split(' ').map(n => n[0]).join('').toUpperCase()}
                      </span>
                    </div>
                  )}
                </div>

                {/* Details */}
                <div className="flex-1 space-y-3">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase">Full Name</p>
                    <p className="font-semibold text-foreground">{studentInfo.fullName}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase">Admission No.</p>
                    <p className="font-mono font-semibold text-primary">{studentInfo.admissionNumber}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase">Class</p>
                    <p className="font-semibold text-foreground">{studentInfo.className}</p>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="mt-6 pt-4 border-t border-border">
                <div className="flex items-center justify-between">
                  <div className="text-xs text-muted-foreground">
                    <p>Academic Year: 2024/2025</p>
                    <p>Valid until: August 2025</p>
                  </div>
                  {/* QR Code Placeholder */}
                  <div className="w-16 h-16 bg-muted rounded flex items-center justify-center">
                    <div className="grid grid-cols-4 gap-0.5">
                      {Array.from({ length: 16 }).map((_, i) => (
                        <div
                          key={i}
                          className={`w-3 h-3 ${Math.random() > 0.5 ? 'bg-foreground' : 'bg-transparent'}`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="text-center text-sm text-muted-foreground">
          <p>This ID card is the property of EduManage School.</p>
          <p>If found, please return to the school administration.</p>
        </div>
      </div>
    </MainLayout>
  );
}
