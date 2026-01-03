import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PasswordInput } from '@/components/ui/password-input';
import { SchoolLogoUpload } from '@/components/settings/SchoolLogoUpload';
import { School, Building2, User, CreditCard, Loader2, ArrowLeft, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { z } from 'zod';
import { addMonths, format } from 'date-fns';

const registrationSchema = z.object({
  schoolName: z.string().min(3, 'School name must be at least 3 characters'),
  schoolCode: z.string().min(3, 'School code must be at least 3 characters').max(10, 'School code must be at most 10 characters'),
  schoolEmail: z.string().email('Invalid email address'),
  schoolPhone: z.string().min(10, 'Phone number must be at least 10 digits'),
  schoolAddress: z.string().min(5, 'Address must be at least 5 characters'),
  adminName: z.string().min(2, 'Admin name must be at least 2 characters'),
  adminEmail: z.string().email('Invalid email address'),
  adminPassword: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
  planType: z.enum(['termly', 'yearly']),
}).refine(data => data.adminPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

export default function SchoolRegistration() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [isComplete, setIsComplete] = useState(false);
  
  const [formData, setFormData] = useState({
    schoolName: '',
    schoolCode: '',
    schoolEmail: '',
    schoolPhone: '',
    schoolAddress: '',
    schoolInitials: '',
    logoUrl: '',
    adminName: '',
    adminEmail: '',
    adminPassword: '',
    confirmPassword: '',
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
    
    const result = registrationSchema.safeParse(formData);
    if (!result.success) {
      toast.error(result.error.errors[0].message);
      return;
    }

    setIsLoading(true);

    try {
      // 1. Create the auth user
      const redirectUrl = `${window.location.origin}/`;
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.adminEmail,
        password: formData.adminPassword,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            full_name: formData.adminName,
          },
        },
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('Failed to create user');

      // 2. Create the school
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
          created_by: authData.user.id,
        })
        .select()
        .single();

      if (schoolError) throw schoolError;

      // 3. Create the subscription (trial)
      const startDate = new Date();
      const trialEndDate = addMonths(startDate, 1); // 1 month trial

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

      // 4. Update the profile with school_id
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ school_id: schoolData.id })
        .eq('id', authData.user.id);

      if (profileError) console.warn('Failed to update profile with school_id:', profileError);

      // 5. Add admin role with school_id
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({ 
          user_id: authData.user.id, 
          role: 'admin',
          school_id: schoolData.id,
        });

      if (roleError) throw roleError;

      setIsComplete(true);
      toast.success('School registered successfully!');
    } catch (error: any) {
      console.error('Registration error:', error);
      
      // Handle user already exists error
      if (error.message?.includes('already registered') || error.code === 'user_already_exists') {
        toast.error('Email already registered', {
          description: 'This email is already in use. Please log in first, then register your school from the dashboard.',
          action: {
            label: 'Go to Login',
            onClick: () => navigate('/auth'),
          },
          duration: 10000,
        });
      } else {
        toast.error('Registration failed', { description: error.message });
      }
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
            <h2 className="text-2xl font-bold mb-2">Registration Complete!</h2>
            <p className="text-muted-foreground mb-6">
              Your school has been registered successfully. You can now log in to access your admin dashboard.
            </p>
            <div className="p-4 rounded-lg bg-muted/50 mb-6 text-left">
              <p className="text-sm font-medium mb-1">Your Trial Period</p>
              <p className="text-sm text-muted-foreground">
                You have 30 days to explore all features. After that, you'll need to subscribe to continue using the platform.
              </p>
            </div>
            <Button className="w-full bg-gradient-primary" onClick={() => navigate('/auth')}>
              Go to Login
            </Button>
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
            <p className="text-sm text-muted-foreground">School Registration</p>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-2">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step >= s ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                }`}>
                  {s}
                </div>
                {s < 3 && <div className={`w-12 h-1 mx-1 ${step > s ? 'bg-primary' : 'bg-muted'}`} />}
              </div>
            ))}
          </div>
        </div>

        <Card className="shadow-xl">
          <CardHeader className="text-center pb-4">
            <CardTitle className="flex items-center justify-center gap-2">
              {step === 1 && <><Building2 className="h-5 w-5" /> School Information</>}
              {step === 2 && <><User className="h-5 w-5" /> Admin Account</>}
              {step === 3 && <><CreditCard className="h-5 w-5" /> Select Plan</>}
            </CardTitle>
            <CardDescription>
              {step === 1 && 'Enter your school details'}
              {step === 2 && 'Create the administrator account'}
              {step === 3 && 'Choose your subscription plan'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Step 1: School Information */}
              {step === 1 && (
                <>
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
                      <Label htmlFor="schoolPhone">Phone *</Label>
                      <Input
                        id="schoolPhone"
                        value={formData.schoolPhone}
                        onChange={(e) => updateField('schoolPhone', e.target.value)}
                        placeholder="+234..."
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="schoolAddress">Address *</Label>
                    <Input
                      id="schoolAddress"
                      value={formData.schoolAddress}
                      onChange={(e) => updateField('schoolAddress', e.target.value)}
                      placeholder="Enter school address"
                      required
                    />
                  </div>
                </>
              )}

              {/* Step 2: Admin Account */}
              {step === 2 && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="adminName">Administrator Name *</Label>
                    <Input
                      id="adminName"
                      value={formData.adminName}
                      onChange={(e) => updateField('adminName', e.target.value)}
                      placeholder="Enter full name"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="adminEmail">Administrator Email *</Label>
                    <Input
                      id="adminEmail"
                      type="email"
                      value={formData.adminEmail}
                      onChange={(e) => updateField('adminEmail', e.target.value)}
                      placeholder="admin@example.com"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="adminPassword">Password *</Label>
                    <PasswordInput
                      id="adminPassword"
                      value={formData.adminPassword}
                      onChange={(e) => updateField('adminPassword', e.target.value)}
                      placeholder="Create a password"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm Password *</Label>
                    <PasswordInput
                      id="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={(e) => updateField('confirmPassword', e.target.value)}
                      placeholder="Confirm your password"
                      required
                    />
                  </div>
                </>
              )}

              {/* Step 3: Plan Selection */}
              {step === 3 && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div 
                      className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                        formData.planType === 'termly' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                      }`}
                      onClick={() => updateField('planType', 'termly')}
                    >
                      <h3 className="font-semibold">Termly Plan</h3>
                      <p className="text-sm text-muted-foreground">4 months access</p>
                      <p className="text-lg font-bold mt-2">₦50,000</p>
                      <p className="text-xs text-muted-foreground">per term</p>
                    </div>
                    <div 
                      className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                        formData.planType === 'yearly' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                      }`}
                      onClick={() => updateField('planType', 'yearly')}
                    >
                      <h3 className="font-semibold">Yearly Plan</h3>
                      <p className="text-sm text-muted-foreground">12 months access</p>
                      <p className="text-lg font-bold mt-2">₦120,000</p>
                      <p className="text-xs text-muted-foreground">per year (Save 20%)</p>
                    </div>
                  </div>
                  <div className="p-4 rounded-lg bg-muted/50">
                    <p className="text-sm font-medium">Start with a 30-day free trial</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      No payment required now. You'll be notified before the trial ends.
                    </p>
                  </div>
                </>
              )}

              {/* Navigation Buttons */}
              <div className="flex justify-between pt-4">
                {step > 1 ? (
                  <Button type="button" variant="outline" onClick={() => setStep(step - 1)}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back
                  </Button>
                ) : (
                  <Link to="/auth">
                    <Button type="button" variant="ghost">
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Back to Login
                    </Button>
                  </Link>
                )}
                
                {step < 3 ? (
                  <Button type="button" onClick={() => setStep(step + 1)}>
                    Continue
                  </Button>
                ) : (
                  <Button type="submit" className="bg-gradient-primary" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Registering...
                      </>
                    ) : (
                      'Complete Registration'
                    )}
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
