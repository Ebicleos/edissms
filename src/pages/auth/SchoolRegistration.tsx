import { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PasswordInput } from '@/components/ui/password-input';
import { School, Building2, User, CreditCard, Loader2, ArrowLeft, CheckCircle, Download, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { z } from 'zod';
import { addMonths, format } from 'date-fns';
import { generatePaymentReceipt } from '@/utils/generatePaymentReceipt';

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

const PLAN_PRICES = {
  termly: 50000,
  yearly: 120000,
};

export default function SchoolRegistration() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [isComplete, setIsComplete] = useState(false);
  const [paymentMode, setPaymentMode] = useState<'trial' | 'pay'>('trial');
  const [verifyingPayment, setVerifyingPayment] = useState(false);
  const [receiptData, setReceiptData] = useState<{
    schoolName: string;
    planType: string;
    amount: number;
    reference: string;
    subscriptionEnd: string;
    adminEmail: string;
  } | null>(null);
  
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

  // Check for payment callback
  useEffect(() => {
    const reference = searchParams.get('reference');
    const trxref = searchParams.get('trxref');
    
    if (reference || trxref) {
      verifyPayment(reference || trxref!);
    }
  }, [searchParams]);

  const verifyPayment = async (reference: string) => {
    setVerifyingPayment(true);
    
    try {
      const response = await supabase.functions.invoke('registration-payment', {
        body: { reference },
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.error) {
        throw new Error(response.error.message || 'Payment verification failed');
      }

      const data = response.data;

      if (data.success) {
        setReceiptData({
          schoolName: data.school_name,
          planType: data.plan_type,
          amount: data.amount_paid,
          reference: data.reference,
          subscriptionEnd: data.subscription_end,
          adminEmail: data.admin_email,
        });
        setIsComplete(true);
        toast.success('Payment verified successfully!');
      } else {
        toast.error('Payment verification failed', { description: data.error });
      }
    } catch (error: any) {
      console.error('Payment verification error:', error);
      toast.error('Payment verification failed', { description: error.message });
    } finally {
      setVerifyingPayment(false);
    }
  };

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

  const handlePayNow = async () => {
    const result = registrationSchema.safeParse(formData);
    if (!result.success) {
      toast.error(result.error.errors[0].message);
      return;
    }

    setIsLoading(true);

    try {
      // Check if email already exists
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', formData.adminEmail)
        .maybeSingle();

      if (existingProfile) {
        toast.error('Email already registered', {
          description: 'This email is already in use. Please log in first.',
        });
        setIsLoading(false);
        return;
      }

      // Initialize payment
      const response = await supabase.functions.invoke('registration-payment', {
        body: {
          school_data: {
            name: formData.schoolName,
            code: formData.schoolCode.toUpperCase(),
            email: formData.schoolEmail,
            phone: formData.schoolPhone,
            address: formData.schoolAddress,
            initials: formData.schoolInitials,
            logo_url: formData.logoUrl,
          },
          admin_data: {
            name: formData.adminName,
            email: formData.adminEmail,
            password: formData.adminPassword,
          },
          plan_type: formData.planType,
          callback_url: `${window.location.origin}/auth/register-school`,
        },
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.error) {
        throw new Error(response.error.message || 'Failed to initialize payment');
      }

      const data = response.data;

      if (data.success && data.authorization_url) {
        // Redirect to Paystack
        window.location.href = data.authorization_url;
      } else {
        throw new Error(data.error || 'Failed to initialize payment');
      }
    } catch (error: any) {
      console.error('Payment initialization error:', error);
      toast.error('Payment initialization failed', { description: error.message });
      setIsLoading(false);
    }
  };

  const handleTrialSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const result = registrationSchema.safeParse(formData);
    if (!result.success) {
      toast.error(result.error.errors[0].message);
      return;
    }

    setIsLoading(true);

    try {
      // Pre-check if email already exists in profiles
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', formData.adminEmail)
        .maybeSingle();

      if (existingProfile) {
        toast.error('Email already registered', {
          description: 'This email is already in use. Please log in first, then register your school from the dashboard.',
          action: {
            label: 'Go to Login',
            onClick: () => navigate('/auth'),
          },
          duration: 10000,
        });
        setIsLoading(false);
        return;
      }

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

      // Wait for session to be established before proceeding
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Refresh session to ensure auth is ready
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        // Session not ready, wait a bit more
        await new Promise(resolve => setTimeout(resolve, 1500));
      }

      // 2. Create the school with retry mechanism
      let schoolData;
      let schoolError;
      
      for (let attempt = 0; attempt < 3; attempt++) {
        const result = await supabase
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
        
        schoolData = result.data;
        schoolError = result.error;
        
        if (!schoolError) break;
        
        // If RLS error, wait and retry
        if (schoolError.code === '42501' || schoolError.message?.includes('row-level security')) {
          console.log(`School insert attempt ${attempt + 1} failed, retrying...`);
          await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
        } else {
          break; // Different error, don't retry
        }
      }

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

      // 4. Create the profile explicitly (trigger might not work)
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: authData.user.id,
          full_name: formData.adminName,
          email: formData.adminEmail,
          school_id: schoolData.id,
        }, { onConflict: 'id' });

      if (profileError) {
        console.error('Failed to create/update profile:', profileError);
      }

      // 5. Add admin role with school_id
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({ 
          user_id: authData.user.id, 
          role: 'admin',
          school_id: schoolData.id,
        });

      if (roleError) throw roleError;

      // 6. Send welcome notifications (non-blocking)
      try {
        await supabase.functions.invoke('send-email-notification', {
          body: {
            to: formData.adminEmail,
            type: 'welcome',
            data: {
              name: formData.adminName,
              schoolName: formData.schoolName,
            },
          },
        });
      } catch (e) {
        console.warn('Failed to send welcome email:', e);
      }

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

  const handlePrintReceipt = () => {
    if (!receiptData) return;

    generatePaymentReceipt({
      type: 'subscription',
      schoolName: receiptData.schoolName,
      schoolAddress: '',
      schoolPhone: '',
      schoolEmail: receiptData.adminEmail,
      amount: receiptData.amount,
      reference: receiptData.reference,
      paymentDate: new Date(),
      planType: receiptData.planType,
      description: `School Registration - ${receiptData.planType === 'yearly' ? 'Yearly' : 'Termly'} Plan`,
    });
  };

  // Show payment verification loading
  if (verifyingPayment) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-xl text-center">
          <CardContent className="pt-8 pb-8">
            <Loader2 className="h-12 w-12 animate-spin mx-auto mb-6 text-primary" />
            <h2 className="text-xl font-bold mb-2">Verifying Payment...</h2>
            <p className="text-muted-foreground">
              Please wait while we verify your payment and complete registration.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

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
              Your school has been registered successfully. 
              {receiptData ? ' Your subscription is now active.' : ' You can now log in to access your admin dashboard.'}
            </p>
            
            {receiptData ? (
              <div className="p-4 rounded-lg bg-muted/50 mb-6 text-left">
                <div className="flex justify-between items-center mb-2">
                  <p className="text-sm font-medium">Payment Receipt</p>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={handlePrintReceipt}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                </div>
                <div className="space-y-1 text-sm text-muted-foreground">
                  <p>School: {receiptData.schoolName}</p>
                  <p>Plan: {receiptData.planType === 'yearly' ? 'Yearly' : 'Termly'}</p>
                  <p>Amount: ₦{receiptData.amount.toLocaleString()}</p>
                  <p>Reference: {receiptData.reference}</p>
                  <p>Valid Until: {receiptData.subscriptionEnd}</p>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-lg bg-muted/50 mb-6 text-left">
                <p className="text-sm font-medium mb-1">Your Trial Period</p>
                <p className="text-sm text-muted-foreground">
                  You have 30 days to explore all features. After that, you'll need to subscribe to continue using the platform.
                </p>
              </div>
            )}
            
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
            <form onSubmit={handleTrialSubmit} className="space-y-4">
              {/* Step 1: School Information */}
              {step === 1 && (
                <>
                  {/* Note about logo */}
                  <div className="p-3 rounded-lg bg-muted/50 text-sm text-muted-foreground">
                    <p>💡 You can upload your school logo from Settings after registration.</p>
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

                  {/* Payment Mode Selection */}
                  <div className="space-y-3 mt-4">
                    <Label>How would you like to start?</Label>
                    <div className="grid grid-cols-2 gap-4">
                      <div 
                        className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                          paymentMode === 'trial' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                        }`}
                        onClick={() => setPaymentMode('trial')}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <AlertCircle className="h-4 w-4 text-primary" />
                          <h4 className="font-semibold">Free Trial</h4>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Start with 30 days free. No payment required now.
                        </p>
                      </div>
                      <div 
                        className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                          paymentMode === 'pay' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                        }`}
                        onClick={() => setPaymentMode('pay')}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <CreditCard className="h-4 w-4 text-green-600" />
                          <h4 className="font-semibold">Pay Now</h4>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Pay ₦{PLAN_PRICES[formData.planType as keyof typeof PLAN_PRICES].toLocaleString()} and get instant access.
                        </p>
                      </div>
                    </div>
                  </div>

                  {paymentMode === 'trial' && (
                    <div className="p-4 rounded-lg bg-muted/50">
                      <p className="text-sm font-medium">Start with a 30-day free trial</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        No payment required now. You'll be notified before the trial ends.
                      </p>
                    </div>
                  )}

                  {paymentMode === 'pay' && (
                    <div className="p-4 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900">
                      <p className="text-sm font-medium text-green-800 dark:text-green-200">Secure Payment via Paystack</p>
                      <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                        You'll be redirected to Paystack to complete your payment of ₦{PLAN_PRICES[formData.planType as keyof typeof PLAN_PRICES].toLocaleString()}.
                      </p>
                    </div>
                  )}
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
                  <Button 
                    type="button" 
                    onClick={(e) => {
                      e.preventDefault();
                      setStep(step + 1);
                    }}
                  >
                    Continue
                  </Button>
                ) : paymentMode === 'pay' ? (
                  <Button 
                    type="button" 
                    className="bg-green-600 hover:bg-green-700" 
                    disabled={isLoading}
                    onClick={handlePayNow}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <CreditCard className="mr-2 h-4 w-4" />
                        Pay ₦{PLAN_PRICES[formData.planType as keyof typeof PLAN_PRICES].toLocaleString()}
                      </>
                    )}
                  </Button>
                ) : (
                  <Button type="submit" className="bg-gradient-primary" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Registering...
                      </>
                    ) : (
                      'Start Free Trial'
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
