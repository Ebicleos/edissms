import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useStudentRecord } from '@/hooks/useStudentRecord';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { User, Mail, Phone, MapPin, Calendar, Loader2, Save, GraduationCap } from 'lucide-react';
import { formatClassName } from '@/lib/formatClassName';

interface StudentInfo {
  id: string;
  full_name: string;
  admission_number: string;
  email: string | null;
  phone_contact: string | null;
  address: string | null;
  date_of_birth: string | null;
  gender: string;
  guardian_name: string | null;
  class_name: string | null;
  photo_url: string | null;
}

export default function StudentProfile() {
  const { user, profile } = useAuth();
  const { studentRecord, isLoading: studentLoading } = useStudentRecord();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [studentInfo, setStudentInfo] = useState<StudentInfo | null>(null);
  const [phoneContact, setPhoneContact] = useState('');
  const [address, setAddress] = useState('');

  useEffect(() => {
    if (studentRecord) {
      fetchStudentInfo();
    } else if (!studentLoading) {
      setIsLoading(false);
    }
  }, [studentRecord, studentLoading]);

  const fetchStudentInfo = async () => {
    if (!studentRecord) {
      setIsLoading(false);
      return;
    }

    try {
      // Get class name - try database first, fallback to class_id as display name
      let className: string | null = null;
      
      if (studentRecord.class_id) {
        // First try to query by UUID
        const { data: classData } = await supabase
          .from('classes')
          .select('name')
          .eq('id', studentRecord.class_id)
          .maybeSingle();

        if (classData?.name) {
          className = classData.name;
        } else {
          // Fallback: use shared utility to format class_id
          className = formatClassName(studentRecord.class_id);
        }
      }

      setStudentInfo({
        id: studentRecord.id,
        full_name: studentRecord.full_name,
        admission_number: studentRecord.admission_number,
        email: studentRecord.email,
        phone_contact: studentRecord.phone_contact,
        address: studentRecord.address,
        date_of_birth: studentRecord.date_of_birth,
        gender: studentRecord.gender,
        guardian_name: studentRecord.guardian_name,
        class_name: className,
        photo_url: studentRecord.photo_url,
      });
      setPhoneContact(studentRecord.phone_contact || '');
      setAddress(studentRecord.address || '');
    } catch (error) {
      console.error('Error fetching student info:', error);
      toast.error('Failed to load profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user || !studentRecord) return;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('students')
        .update({
          phone_contact: phoneContact || null,
          address: address || null,
        })
        .eq('id', studentRecord.id);

      if (error) throw error;
      toast.success('Profile updated successfully');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <MainLayout title="My Profile" subtitle="View and manage your profile">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="My Profile" subtitle="View and manage your profile">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Profile Header */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <Avatar className="h-24 w-24">
                <AvatarImage src={studentInfo?.photo_url || profile?.photo_url || ''} />
                <AvatarFallback className="text-2xl bg-primary text-primary-foreground">
                  {studentInfo?.full_name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'ST'}
                </AvatarFallback>
              </Avatar>
              <div className="text-center sm:text-left">
                <h2 className="text-2xl font-bold">{studentInfo?.full_name || 'Student'}</h2>
                <p className="text-muted-foreground flex items-center gap-2 justify-center sm:justify-start">
                  <GraduationCap className="h-4 w-4" />
                  {studentInfo?.class_name || 'No class assigned'}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Admission No: {studentInfo?.admission_number || 'N/A'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Personal Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Personal Information
            </CardTitle>
            <CardDescription>Your personal details (some fields are read-only)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>Full Name</Label>
                <Input value={studentInfo?.full_name || ''} disabled />
              </div>
              <div>
                <Label>Gender</Label>
                <Input value={studentInfo?.gender || ''} disabled className="capitalize" />
              </div>
              <div>
                <Label>Date of Birth</Label>
                <Input value={studentInfo?.date_of_birth || 'Not set'} disabled />
              </div>
              <div>
                <Label>Guardian Name</Label>
                <Input value={studentInfo?.guardian_name || 'Not set'} disabled />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Contact Information
            </CardTitle>
            <CardDescription>Update your contact details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>Email</Label>
                <Input value={studentInfo?.email || profile?.email || ''} disabled />
              </div>
              <div>
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  value={phoneContact}
                  onChange={(e) => setPhoneContact(e.target.value)}
                  placeholder="Enter phone number"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Enter your address"
              />
            </div>
            <div className="flex justify-end">
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                Save Changes
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
