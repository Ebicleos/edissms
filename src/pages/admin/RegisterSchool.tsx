import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SchoolLogoUpload } from '@/components/settings/SchoolLogoUpload';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { School, Building2, Loader2, CheckCircle, X } from 'lucide-react';
import { toast } from 'sonner';
import { addMonths, format } from 'date-fns';

export default function RegisterSchool() {
  const navigate = useNavigate();
  const { user, profile, signOut } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  const handleCancel = async () => {
    await signOut();
    navigate('/auth', { replace: true });
  };
  
  const [formData, setFormData] = useState({
    schoolName: '',
    schoolCode: '',
    schoolEmail: '',
    schoolPhone: '',
    schoolAddress: '',
    schoolInitials: '',
    logoUrl: '',
    planType: 'termly',
  });

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Auto-generate initials from school name
    if (field === 'schoolName') {
      const initials = value.split(' ')
        .map(word => word[0])
        .join('')
        .toUpperCase()
        .slice(0, 4);
      setFormData(prev => ({ ...prev, schoolInitials: initials }));
    }
    
    // Auto-generate code from school name
    if (field === 'schoolName' && !formData.schoolCode) {
      const code = value.split(' ')
        .map(word => word[0])
        .join('')
        .toUpperCase() + Math.floor(Math.random() * 1000);
      setFormData(prev => ({ ...prev, schoolCode: code.slice(0, 10) }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error('You must be logged in');
      return;
    }

    if (!formData.schoolName || !formData.schoolCode || !formData.schoolEmail) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsLoading(true);

    try {
      // 1. Create the school
      const { data: schoolData, error: schoolError } = await supabase
        .from('schools')
        .insert({
          name: formData.schoolName,
          code: formData.schoolCode.toUpperCase(),
          email: formData.schoolEmail,
          phone: formData.schoolPhone,
          address: formData.schoolAddress,
          initials: formData.schoolInitials,
          logo_url: formData.logoUrl,
          created_by: user.id,
        })
        .select()
        .single();

      if (schoolError) throw schoolError;

      // 2. Create the subscription (trial)
      const startDate = new Date();
      const trialEndDate = addMonths(startDate, 1);

      const { error: subError } = await supabase
        .from('subscriptions')
        .insert({
          school_id: schoolData.id,
          plan_type: formData.planType,
          status: 'trial',
          start_date: format(startDate, 'yyyy-MM-dd'),
          end_date: format(trialEndDate, 'yyyy-MM-dd'),
          amount: 0,
        });

      if (subError) throw subError;

      // 3. Update the profile with school_id
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ school_id: schoolData.id })
        .eq('id', user.id);

      if (profileError) console.warn('Failed to update profile with school_id:', profileError);

      // 4. Add admin role with school_id
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({ 
          user_id: user.id, 
          role: 'admin',
          school_id: schoolData.id,
        });

      if (roleError && !roleError.message?.includes('duplicate')) {
        throw roleError;
      }

      // 5. Create school settings
      const { error: settingsError } = await supabase
        .from('school_settings')
        .insert({
          school_id: schoolData.id,
          school_name: formData.schoolName,
          school_initials: formData.schoolInitials,
          email: formData.schoolEmail,
          phone: formData.schoolPhone,
          address: formData.schoolAddress,
          logo_url: formData.logoUrl,
        });

      if (settingsError) console.warn('Failed to create school settings:', settingsError);

      setIsComplete(true);
      toast.success('School registered successfully!');
      
      // Redirect to dashboard after short delay
      setTimeout(() => {
        window.location.href = '/';
      }, 2000);
    } catch (error: any) {
      console.error('Registration error:', error);
      toast.error('Registration failed', { description: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  if (isComplete) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-xl text-center">
          <CardContent className="pt-8 pb-8">
            <div className="mx-auto w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center mb-6">
              <CheckCircle className="h-12 w-12 text-green-500" />
            </div>
            <h2 className="text-2xl font-bold mb-2">School Registered!</h2>
            <p className="text-muted-foreground mb-6">
              Your school has been registered successfully. Redirecting to dashboard...
            </p>
            <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary">
            <School className="h-7 w-7 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-bold text-2xl">EduManage</h1>
            <p className="text-sm text-muted-foreground">Register Your School</p>
          </div>
        </div>

        <Card className="shadow-xl">
          <CardHeader className="text-center pb-4">
            <CardTitle className="flex items-center justify-center gap-2">
              <Building2 className="h-5 w-5" /> School Information
            </CardTitle>
            <CardDescription>
              Welcome, {profile?.full_name}! Complete your school registration to get started.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Logo Upload */}
              <div className="space-y-2">
                <Label>School Logo</Label>
                <SchoolLogoUpload
                  currentLogoUrl={formData.logoUrl}
                  onUploadComplete={(url) => setFormData(prev => ({ ...prev, logoUrl: url }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="schoolName">School Name *</Label>
                <Input
                  id="schoolName"
                  value={formData.schoolName}
                  onChange={(e) => updateField('schoolName', e.target.value)}
                  placeholder="Enter school name"
                  required
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="schoolCode">School Code *</Label>
                  <Input
                    id="schoolCode"
                    value={formData.schoolCode}
                    onChange={(e) => updateField('schoolCode', e.target.value.toUpperCase())}
                    placeholder="e.g., SMS001"
                    maxLength={10}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="schoolInitials">Initials</Label>
                  <Input
                    id="schoolInitials"
                    value={formData.schoolInitials}
                    onChange={(e) => updateField('schoolInitials', e.target.value.toUpperCase())}
                    placeholder="e.g., SMS"
                    maxLength={4}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="schoolEmail">School Email *</Label>
                  <Input
                    id="schoolEmail"
                    type="email"
                    value={formData.schoolEmail}
                    onChange={(e) => updateField('schoolEmail', e.target.value)}
                    placeholder="school@example.com"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="schoolPhone">Phone</Label>
                  <Input
                    id="schoolPhone"
                    value={formData.schoolPhone}
                    onChange={(e) => updateField('schoolPhone', e.target.value)}
                    placeholder="+234..."
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="schoolAddress">Address</Label>
                <Input
                  id="schoolAddress"
                  value={formData.schoolAddress}
                  onChange={(e) => updateField('schoolAddress', e.target.value)}
                  placeholder="Enter school address"
                />
              </div>

              {/* Plan Selection */}
              <div className="space-y-2">
                <Label>Select Plan</Label>
                <div className="grid grid-cols-2 gap-4">
                  <div 
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      formData.planType === 'termly' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                    }`}
                    onClick={() => updateField('planType', 'termly')}
                  >
                    <h3 className="font-semibold">Termly</h3>
                    <p className="text-sm text-muted-foreground">₦50,000/term</p>
                  </div>
                  <div 
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      formData.planType === 'yearly' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                    }`}
                    onClick={() => updateField('planType', 'yearly')}
                  >
                    <h3 className="font-semibold">Yearly</h3>
                    <p className="text-sm text-muted-foreground">₦120,000/year</p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Start with a 30-day free trial. No payment required now.
                </p>
              </div>

              <div className="flex gap-3">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button type="button" variant="outline" className="flex-1" disabled={isLoading}>
                      <X className="mr-2 h-4 w-4" />
                      Cancel
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Cancel Registration?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to cancel? You will be logged out and will need to sign in again to continue registration.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Continue Registration</AlertDialogCancel>
                      <AlertDialogAction onClick={handleCancel}>
                        Yes, Cancel
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
                
                <Button type="submit" className="flex-1 bg-gradient-primary" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Registering...
                    </>
                  ) : (
                    'Complete Registration'
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
