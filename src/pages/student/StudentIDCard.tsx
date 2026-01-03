import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Download, Printer, Loader2, School, QrCode, User } from 'lucide-react';
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
  const [signedPhotoUrl, setSignedPhotoUrl] = useState<string | null>(null);

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

    const info = {
      fullName: profile?.full_name || 'Student',
      admissionNumber: studentClass?.admission_number || 'N/A',
      className: userClass || 'N/A',
      photoUrl: profile?.photo_url || null,
      email: profile?.email || null,
    };
    
    setStudentInfo(info);

    // Get signed URL for photo
    if (info.photoUrl) {
      const { data } = await supabase.storage
        .from('student-photos')
        .createSignedUrl(info.photoUrl, 3600);
      
      if (data?.signedUrl) {
        setSignedPhotoUrl(data.signedUrl);
      }
    }

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
          <User className="h-12 w-12 text-muted-foreground mb-4" />
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
          {/* ID Card - Matching Admin Style */}
          <div className="bg-card rounded-2xl border-2 border-primary/20 shadow-lg overflow-hidden max-w-sm print:shadow-none">
            {/* Header */}
            <div className="bg-gradient-primary p-4 text-center text-primary-foreground">
              <div className="flex items-center justify-center gap-2 mb-1">
                <School className="h-6 w-6" />
                <span className="font-bold text-lg">EduManage School</span>
              </div>
              <p className="text-xs opacity-90">Excellence in Education</p>
            </div>

            {/* Body */}
            <CardContent className="p-6 text-center">
              {/* Photo */}
              <div className="h-28 w-28 mx-auto rounded-full bg-muted border-4 border-primary/20 flex items-center justify-center mb-4 overflow-hidden">
                {signedPhotoUrl ? (
                  <img
                    src={signedPhotoUrl}
                    alt={studentInfo.fullName}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="text-3xl font-bold text-muted-foreground">
                    {studentInfo.fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                  </span>
                )}
              </div>

              {/* Details */}
              <h4 className="font-bold text-xl text-foreground mb-1">{studentInfo.fullName}</h4>
              <p className="text-sm text-muted-foreground mb-3">{studentInfo.className}</p>
              
              <div className="bg-muted/50 rounded-lg p-3 mb-4">
                <p className="text-xs text-muted-foreground mb-1">Admission Number</p>
                <p className="font-mono font-bold text-primary text-lg">{studentInfo.admissionNumber}</p>
              </div>

              {/* QR Code placeholder */}
              <div className="inline-flex items-center justify-center h-20 w-20 bg-foreground rounded-lg">
                <QrCode className="h-16 w-16 text-background" />
              </div>
            </CardContent>

            {/* Footer */}
            <div className="bg-muted/50 p-3 text-center text-xs text-muted-foreground">
              <p>Valid for Academic Year 2024/2025</p>
              <p>If found, please return to school</p>
            </div>
          </div>
        </div>

        <div className="text-center text-sm text-muted-foreground">
          <p>This ID card is the property of EduManage School.</p>
          <p>If found, please return to the school administration.</p>
        </div>
      </div>
    </MainLayout>
  );
}
