import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/contexts/AuthContext';
import { useSchoolSettings } from '@/hooks/useSchoolSettings';
import { supabase } from '@/integrations/supabase/client';
import { Download, Printer, Loader2, School, QrCode, User } from 'lucide-react';
import { toast } from 'sonner';

interface StudentInfo {
  fullName: string;
  admissionNumber: string;
  className: string;
  photoUrl: string | null;
}

export default function StudentIDCard() {
  const { user } = useAuth();
  const { settings: schoolSettings, isLoading: settingsLoading } = useSchoolSettings();
  const [studentInfo, setStudentInfo] = useState<StudentInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [signedPhotoUrl, setSignedPhotoUrl] = useState<string | null>(null);
  const [photoLoading, setPhotoLoading] = useState(false);

  useEffect(() => {
    fetchStudentInfo();
  }, [user]);

  const fetchStudentInfo = async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    try {
      // Get admission number from student_classes for current user
      const { data: studentClass } = await supabase
        .from('student_classes')
        .select('admission_number, class_id')
        .eq('student_id', user.id)
        .maybeSingle();

      if (!studentClass?.admission_number) {
        setIsLoading(false);
        return;
      }

      // Fetch student data from students table using admission number
      const { data: studentData } = await supabase
        .from('students')
        .select('full_name, admission_number, photo_url, class_id')
        .eq('admission_number', studentClass.admission_number)
        .maybeSingle();

      // Fetch class name
      const { data: classData } = await supabase
        .from('classes')
        .select('name')
        .eq('id', studentClass.class_id)
        .maybeSingle();

      const info: StudentInfo = {
        fullName: studentData?.full_name || 'Student',
        admissionNumber: studentData?.admission_number || studentClass.admission_number,
        className: classData?.name || 'N/A',
        photoUrl: studentData?.photo_url || null,
      };
      
      setStudentInfo(info);

      // Get signed URL for photo
      if (info.photoUrl) {
        setPhotoLoading(true);
        if (info.photoUrl.startsWith('http')) {
          setSignedPhotoUrl(info.photoUrl);
        } else {
          const { data } = await supabase.storage
            .from('student-photos')
            .createSignedUrl(info.photoUrl, 3600);
          
          if (data?.signedUrl) {
            // Preload image
            const img = new Image();
            img.src = data.signedUrl;
            img.onload = () => setPhotoLoading(false);
            img.onerror = () => setPhotoLoading(false);
            setSignedPhotoUrl(data.signedUrl);
          } else {
            setPhotoLoading(false);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching student info:', error);
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

  if (isLoading || settingsLoading) {
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
                {schoolSettings.logo_url ? (
                  <img src={schoolSettings.logo_url} alt="School Logo" className="h-8 w-8 object-contain rounded" />
                ) : (
                  <School className="h-6 w-6" />
                )}
                <span className="font-bold text-lg">{schoolSettings.school_name}</span>
              </div>
              <p className="text-xs opacity-90">{schoolSettings.motto}</p>
            </div>

            {/* Body */}
            <CardContent className="p-6 text-center">
              {/* Photo */}
              <div className="h-28 w-28 mx-auto rounded-full bg-muted border-4 border-primary/20 flex items-center justify-center mb-4 overflow-hidden">
                {photoLoading ? (
                  <Skeleton className="h-full w-full rounded-full" />
                ) : signedPhotoUrl ? (
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
              <p>Valid for Academic Year {schoolSettings.academic_year}</p>
              <p>If found, please return to school</p>
              {schoolSettings.phone && <p>Tel: {schoolSettings.phone}</p>}
            </div>
          </div>
        </div>

        <div className="text-center text-sm text-muted-foreground">
          <p>This ID card is the property of {schoolSettings.school_name}.</p>
          <p>If found, please return to the school administration.</p>
        </div>
      </div>
    </MainLayout>
  );
}