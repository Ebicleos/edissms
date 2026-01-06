import { useState, useEffect, useRef } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { PasswordInput } from '@/components/ui/password-input';
import { School, User, Lock, Bell, Shield, Save, Loader2, FileText, CreditCard, Upload, Camera } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { SchoolLogoUpload } from '@/components/settings/SchoolLogoUpload';
import { PaymentGatewaySettings } from '@/components/settings/PaymentGatewaySettings';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export default function Settings() {
  const { user, profile, refreshProfile } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // School settings
  const [schoolName, setSchoolName] = useState('');
  const [motto, setMotto] = useState('');
  const [schoolEmail, setSchoolEmail] = useState('');
  const [schoolPhone, setSchoolPhone] = useState('');
  const [address, setAddress] = useState('');
  const [academicYear, setAcademicYear] = useState('');
  const [term, setTerm] = useState('');

  // Report card settings
  const [principalName, setPrincipalName] = useState('');
  const [closingDate, setClosingDate] = useState('');
  const [nextTermBegins, setNextTermBegins] = useState('');
  const [logoUrl, setLogoUrl] = useState('');

  // Account settings
  const [fullName, setFullName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPhone, setAdminPhone] = useState('');
  const [profilePhotoUrl, setProfilePhotoUrl] = useState('');

  // Security settings
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Notification settings
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [smsAlerts, setSmsAlerts] = useState(false);
  const [feeReminders, setFeeReminders] = useState(true);
  const [attendanceReports, setAttendanceReports] = useState(true);
  const [isSavingNotifications, setIsSavingNotifications] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, [profile]);

  const fetchSettings = async () => {
    if (!user) return;
    setIsLoading(true);

    // Fetch school settings
    const { data: schoolData } = await supabase
      .from('school_settings')
      .select('*')
      .limit(1)
      .maybeSingle();

    if (schoolData) {
      setSchoolName(schoolData.school_name || '');
      setMotto(schoolData.motto || '');
      setSchoolEmail(schoolData.email || '');
      setSchoolPhone(schoolData.phone || '');
      setAddress(schoolData.address || '');
      setAcademicYear(schoolData.academic_year || '');
      setTerm(schoolData.term || '');
      setPrincipalName(schoolData.principal_name || '');
      setClosingDate(schoolData.closing_date || '');
      setNextTermBegins(schoolData.next_term_begins || '');
      setLogoUrl(schoolData.logo_url || '');
    }

    // Set account settings from profile
    if (profile) {
      setFullName(profile.full_name || '');
      setAdminEmail(profile.email || '');
      setProfilePhotoUrl(profile.photo_url || '');
    }

    // Fetch full profile for phone contact
    if (user) {
      const { data: fullProfile } = await supabase
        .from('profiles')
        .select('phone_contact')
        .eq('id', user.id)
        .maybeSingle();
      
      if (fullProfile) {
        setAdminPhone(fullProfile.phone_contact || '');
      }
    }

    // Fetch notification preferences
    const { data: notifPrefs } = await supabase
      .from('notification_preferences')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (notifPrefs) {
      setEmailNotifications(notifPrefs.email_notifications ?? true);
      setSmsAlerts(notifPrefs.sms_alerts ?? false);
      setFeeReminders(notifPrefs.fee_reminders ?? true);
      setAttendanceReports(notifPrefs.attendance_reports ?? true);
    }

    setIsLoading(false);
  };

  const handleSaveSchoolSettings = async () => {
    setIsSaving(true);

    const { data: existing } = await supabase
      .from('school_settings')
      .select('id')
      .limit(1)
      .maybeSingle();

    const settingsData = {
      school_name: schoolName,
      motto,
      email: schoolEmail,
      phone: schoolPhone,
      address,
      academic_year: academicYear,
      term,
      principal_name: principalName,
      closing_date: closingDate || null,
      next_term_begins: nextTermBegins || null,
      logo_url: logoUrl || null,
      updated_at: new Date().toISOString(),
    };

    let error;
    if (existing) {
      ({ error } = await supabase
        .from('school_settings')
        .update(settingsData)
        .eq('id', existing.id));
    } else {
      ({ error } = await supabase.from('school_settings').insert(settingsData));
    }

    setIsSaving(false);

    if (error) {
      toast.error('Failed to save school settings');
      return;
    }

    toast.success('School settings saved successfully!');
  };

  const handleSaveAccountSettings = async () => {
    if (!user) return;

    setIsSaving(true);

    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: fullName,
        phone_contact: adminPhone,
      })
      .eq('id', user.id);

    setIsSaving(false);

    if (error) {
      toast.error('Failed to save account settings');
      return;
    }

    toast.success('Account settings saved successfully!');
  };

  const handleUpdatePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast.error("Passwords don't match");
      return;
    }

    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setIsSaving(true);

    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    setIsSaving(false);

    if (error) {
      toast.error('Failed to update password');
      return;
    }

    toast.success('Password updated successfully!');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  const handleSaveNotifications = async () => {
    if (!user) return;
    setIsSavingNotifications(true);

    const prefsData = {
      user_id: user.id,
      school_id: profile?.school_id || null,
      email_notifications: emailNotifications,
      sms_alerts: smsAlerts,
      fee_reminders: feeReminders,
      attendance_reports: attendanceReports,
    };

    const { error } = await supabase
      .from('notification_preferences')
      .upsert(prefsData, { onConflict: 'user_id' });

    setIsSavingNotifications(false);

    if (error) {
      toast.error('Failed to save notification preferences');
      return;
    }

    toast.success('Notification preferences saved!');
  };

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error('File size must be less than 2MB');
      return;
    }

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    setIsUploadingPhoto(true);

    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}-${Date.now()}.${fileExt}`;
    const filePath = `profiles/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('student-photos')
      .upload(filePath, file, { upsert: true });

    if (uploadError) {
      toast.error('Failed to upload photo');
      setIsUploadingPhoto(false);
      return;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('student-photos')
      .getPublicUrl(filePath);

    const { error: updateError } = await supabase
      .from('profiles')
      .update({ photo_url: filePath })
      .eq('id', user.id);

    if (updateError) {
      toast.error('Failed to update profile');
      setIsUploadingPhoto(false);
      return;
    }

    setProfilePhotoUrl(filePath);
    await refreshProfile();
    toast.success('Profile photo updated!');
    setIsUploadingPhoto(false);
  };

  if (isLoading) {
    return (
      <MainLayout title="Settings" subtitle="Manage your school settings and preferences">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Settings" subtitle="Manage your school settings and preferences">
      <div className="max-w-4xl animate-fade-in">
        <Tabs defaultValue="school" className="space-y-6">
          <TabsList>
            <TabsTrigger value="school" className="gap-2">
              <School className="h-4 w-4" />
              School
            </TabsTrigger>
            <TabsTrigger value="account" className="gap-2">
              <User className="h-4 w-4" />
              Account
            </TabsTrigger>
            <TabsTrigger value="security" className="gap-2">
              <Lock className="h-4 w-4" />
              Security
            </TabsTrigger>
            <TabsTrigger value="notifications" className="gap-2">
              <Bell className="h-4 w-4" />
              Notifications
            </TabsTrigger>
            <TabsTrigger value="report-cards" className="gap-2">
              <FileText className="h-4 w-4" />
              Report Cards
            </TabsTrigger>
            <TabsTrigger value="payment-gateway" className="gap-2">
              <CreditCard className="h-4 w-4" />
              Payment Gateway
            </TabsTrigger>
          </TabsList>

          {/* School Settings */}
          <TabsContent value="school">
            <Card>
              <CardHeader>
                <CardTitle>School Information</CardTitle>
                <CardDescription>
                  Update your school's basic information and branding
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Logo Upload */}
                <div className="space-y-2">
                  <Label>School Logo</Label>
                  <SchoolLogoUpload
                    currentLogoUrl={logoUrl}
                    onUploadComplete={(url) => setLogoUrl(url)}
                    schoolId={profile?.school_id || undefined}
                  />
                </div>

                <Separator />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="schoolName">School Name</Label>
                    <Input 
                      id="schoolName" 
                      value={schoolName}
                      onChange={(e) => setSchoolName(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="motto">School Motto</Label>
                    <Input 
                      id="motto" 
                      value={motto}
                      onChange={(e) => setMotto(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">School Email</Label>
                    <Input 
                      id="email" 
                      type="email" 
                      value={schoolEmail}
                      onChange={(e) => setSchoolEmail(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input 
                      id="phone" 
                      value={schoolPhone}
                      onChange={(e) => setSchoolPhone(e.target.value)}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="address">Address</Label>
                    <Input 
                      id="address" 
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                    />
                  </div>
                </div>

                <Separator />

                <div>
                  <h4 className="font-medium text-foreground mb-4">Academic Settings</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="academicYear">Current Academic Year</Label>
                      <Input 
                        id="academicYear" 
                        value={academicYear}
                        onChange={(e) => setAcademicYear(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="term">Current Term</Label>
                      <Input 
                        id="term" 
                        value={term}
                        onChange={(e) => setTerm(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button 
                    className="bg-gradient-primary hover:opacity-90"
                    onClick={handleSaveSchoolSettings}
                    disabled={isSaving}
                  >
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
          </TabsContent>

          {/* Account Settings */}
          <TabsContent value="account">
            <Card>
              <CardHeader>
                <CardTitle>Account Settings</CardTitle>
                <CardDescription>
                  Manage your personal account information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center gap-6">
                  <div className="relative">
                    <Avatar className="h-20 w-20">
                      {profilePhotoUrl ? (
                        <AvatarImage 
                          src={supabase.storage.from('student-photos').getPublicUrl(profilePhotoUrl).data.publicUrl} 
                          alt={fullName}
                        />
                      ) : null}
                      <AvatarFallback className="bg-gradient-primary text-2xl font-bold text-primary-foreground">
                        {fullName.split(' ').map(n => n[0]).join('').toUpperCase() || 'AD'}
                      </AvatarFallback>
                    </Avatar>
                    {isUploadingPhoto && (
                      <div className="absolute inset-0 bg-background/80 rounded-full flex items-center justify-center">
                        <Loader2 className="h-6 w-6 animate-spin" />
                      </div>
                    )}
                  </div>
                  <div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handlePhotoUpload}
                    />
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploadingPhoto}
                    >
                      <Camera className="h-4 w-4 mr-2" />
                      Change Photo
                    </Button>
                    <p className="text-xs text-muted-foreground mt-1">JPG, PNG. Max 2MB</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="fullName">Full Name</Label>
                    <Input 
                      id="fullName" 
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="adminEmail">Email</Label>
                    <Input 
                      id="adminEmail" 
                      type="email" 
                      value={adminEmail}
                      disabled
                    />
                  </div>
                  <div>
                    <Label htmlFor="role">Role</Label>
                    <Input id="role" defaultValue="Administrator" disabled />
                  </div>
                  <div>
                    <Label htmlFor="adminPhone">Phone</Label>
                    <Input 
                      id="adminPhone" 
                      value={adminPhone}
                      onChange={(e) => setAdminPhone(e.target.value)}
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button 
                    className="bg-gradient-primary hover:opacity-90"
                    onClick={handleSaveAccountSettings}
                    disabled={isSaving}
                  >
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
          </TabsContent>

          {/* Security Settings */}
          <TabsContent value="security">
            <Card>
              <CardHeader>
                <CardTitle>Security Settings</CardTitle>
                <CardDescription>
                  Manage password and security preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h4 className="font-medium text-foreground">Change Password</h4>
                  <div className="grid grid-cols-1 gap-4 max-w-md">
                    <div>
                      <Label htmlFor="currentPassword">Current Password</Label>
                      <PasswordInput 
                        id="currentPassword" 
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="newPassword">New Password</Label>
                      <PasswordInput 
                        id="newPassword" 
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="confirmPassword">Confirm New Password</Label>
                      <PasswordInput 
                        id="confirmPassword" 
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                      />
                    </div>
                  </div>
                  <Button 
                    variant="outline"
                    onClick={handleUpdatePassword}
                    disabled={isSaving}
                  >
                    {isSaving ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : null}
                    Update Password
                  </Button>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h4 className="font-medium text-foreground">Two-Factor Authentication</h4>
                  <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-3">
                      <Shield className="h-5 w-5 text-success" />
                      <div>
                        <p className="font-medium text-foreground">Enable 2FA</p>
                        <p className="text-sm text-muted-foreground">
                          Add an extra layer of security to your account
                        </p>
                      </div>
                    </div>
                    <Switch />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notification Settings */}
          <TabsContent value="notifications">
            <Card>
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
                <CardDescription>
                  Choose what notifications you want to receive
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                    <div>
                      <p className="font-medium text-foreground">Email Notifications</p>
                      <p className="text-sm text-muted-foreground">
                        Receive updates about admissions and payments
                      </p>
                    </div>
                    <Switch 
                      checked={emailNotifications}
                      onCheckedChange={setEmailNotifications}
                    />
                  </div>
                  <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                    <div>
                      <p className="font-medium text-foreground">SMS Alerts</p>
                      <p className="text-sm text-muted-foreground">
                        Get SMS for urgent notifications
                      </p>
                    </div>
                    <Switch 
                      checked={smsAlerts}
                      onCheckedChange={setSmsAlerts}
                    />
                  </div>
                  <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                    <div>
                      <p className="font-medium text-foreground">Fee Reminders</p>
                      <p className="text-sm text-muted-foreground">
                        Automatic reminders for pending fees
                      </p>
                    </div>
                    <Switch 
                      checked={feeReminders}
                      onCheckedChange={setFeeReminders}
                    />
                  </div>
                  <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                    <div>
                      <p className="font-medium text-foreground">Attendance Reports</p>
                      <p className="text-sm text-muted-foreground">
                        Daily attendance summary reports
                      </p>
                    </div>
                    <Switch 
                      checked={attendanceReports}
                      onCheckedChange={setAttendanceReports}
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button 
                    className="bg-gradient-primary hover:opacity-90"
                    onClick={handleSaveNotifications}
                    disabled={isSavingNotifications}
                  >
                    {isSavingNotifications ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="mr-2 h-4 w-4" />
                    )}
                    Save Preferences
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Report Card Settings */}
          <TabsContent value="report-cards">
            <Card>
              <CardHeader>
                <CardTitle>Report Card Settings</CardTitle>
                <CardDescription>
                  Configure report card display and academic calendar
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="principalName">Principal/Proprietor Name</Label>
                    <Input 
                      id="principalName" 
                      value={principalName}
                      onChange={(e) => setPrincipalName(e.target.value)}
                      placeholder="Enter principal's name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="closingDate">Term Closing Date</Label>
                    <Input 
                      id="closingDate" 
                      type="date"
                      value={closingDate}
                      onChange={(e) => setClosingDate(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="nextTermBegins">Next Term Begins</Label>
                    <Input 
                      id="nextTermBegins" 
                      type="date"
                      value={nextTermBegins}
                      onChange={(e) => setNextTermBegins(e.target.value)}
                    />
                  </div>
                </div>

                <Separator />

                <div>
                  <h4 className="font-medium text-foreground mb-4">Grading Scale</h4>
                  <div className="grid grid-cols-4 gap-2 text-sm font-medium text-muted-foreground mb-2">
                    <span>Score Range</span>
                    <span>Grade</span>
                    <span>Remarks</span>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="grid grid-cols-4 gap-2 items-center">
                      <span>80 - 100</span>
                      <span className="font-semibold">A</span>
                      <span className="text-success">Excellent</span>
                    </div>
                    <div className="grid grid-cols-4 gap-2 items-center">
                      <span>75 - 79</span>
                      <span className="font-semibold">B+</span>
                      <span className="text-success">Very Good</span>
                    </div>
                    <div className="grid grid-cols-4 gap-2 items-center">
                      <span>70 - 74</span>
                      <span className="font-semibold">B</span>
                      <span className="text-primary">Good</span>
                    </div>
                    <div className="grid grid-cols-4 gap-2 items-center">
                      <span>60 - 69</span>
                      <span className="font-semibold">C</span>
                      <span className="text-primary">Credit</span>
                    </div>
                    <div className="grid grid-cols-4 gap-2 items-center">
                      <span>50 - 59</span>
                      <span className="font-semibold">D</span>
                      <span className="text-warning">Pass</span>
                    </div>
                    <div className="grid grid-cols-4 gap-2 items-center">
                      <span>0 - 49</span>
                      <span className="font-semibold">F</span>
                      <span className="text-destructive">Fail</span>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Contact support to customize grading scale
                  </p>
                </div>

                <div className="flex justify-end">
                  <Button 
                    className="bg-gradient-primary hover:opacity-90"
                    onClick={handleSaveSchoolSettings}
                    disabled={isSaving}
                  >
                    {isSaving ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="mr-2 h-4 w-4" />
                    )}
                    Save Settings
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Payment Gateway Settings */}
          <TabsContent value="payment-gateway">
            <PaymentGatewaySettings schoolId={profile?.school_id || undefined} />
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
