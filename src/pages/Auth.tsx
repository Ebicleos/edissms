import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth, AppRole } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PasswordInput } from '@/components/ui/password-input';
import { School, ShieldCheck, GraduationCap, Users, Loader2, KeyRound, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { CLASS_LIST_DETAILED } from '@/types';
import { z } from 'zod';
import { SystemAnnouncementBanner } from '@/components/layout/SystemAnnouncementBanner';

const loginSchema = z.object({
  identifier: z.string().min(1, 'Email or Admission Number is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const studentLoginSchema = z.object({
  identifier: z.string().min(1, 'Admission Number is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const signupSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

const roleIcons = {
  admin: ShieldCheck,
  teacher: GraduationCap,
  student: Users,
};

const roleGradients = {
  admin: 'from-rose-500 via-pink-500 to-purple-500',
  teacher: 'from-blue-500 via-cyan-500 to-teal-500',
  student: 'from-emerald-500 via-green-500 to-lime-500',
};

const roleBgColors = {
  admin: 'bg-gradient-to-br from-rose-50 to-pink-50 dark:from-rose-950/30 dark:to-pink-950/30',
  teacher: 'bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/30',
  student: 'bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-950/30 dark:to-green-950/30',
};

const roleDescriptions = {
  admin: 'Full system access and management',
  teacher: 'Manage classes, exams, and students',
  student: 'Access lessons, take exams, view results',
};

export default function Auth() {
  const navigate = useNavigate();
  const { signIn, signUp, user, role, isLoading: authLoading } = useAuth();
  const [selectedRole, setSelectedRole] = useState<AppRole>('student');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedClass, setSelectedClass] = useState('');
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
  const [adminExists, setAdminExists] = useState(false);
  const [resetLimitReached, setResetLimitReached] = useState(false);
  
  // Student signup fields
  const [studentAdmissionNumber, setStudentAdmissionNumber] = useState('');
  
  // Login form
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  
  // Signup form
  const [signupFullName, setSignupFullName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirmPassword, setSignupConfirmPassword] = useState('');

  // Check if admin exists
  useEffect(() => {
    const checkAdminExists = async () => {
      const { data, error } = await supabase
        .from('user_roles')
        .select('id')
        .eq('role', 'admin')
        .limit(1);
      
      if (!error && data && data.length > 0) {
        setAdminExists(true);
      }
    };
    checkAdminExists();
  }, []);

  // Reset form fields when role changes
  useEffect(() => {
    setLoginIdentifier('');
    setLoginPassword('');
    setSignupFullName('');
    setSignupEmail('');
    setSignupPassword('');
    setSignupConfirmPassword('');
    setSelectedClass('');
    setStudentAdmissionNumber('');
  }, [selectedRole]);

  // Redirect if already logged in
  useEffect(() => {
    if (authLoading) return;
    
    if (user && role) {
      if (role === 'superadmin') {
        navigate('/superadmin', { replace: true });
      } else if (role === 'admin') {
        navigate('/', { replace: true });
      } else if (role === 'teacher') {
        navigate('/teacher', { replace: true });
      } else {
        navigate('/student', { replace: true });
      }
    }
  }, [user, role, authLoading, navigate]);

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!forgotPasswordEmail || !forgotPasswordEmail.includes('@')) {
      toast.error('Please enter a valid email address');
      return;
    }

    setIsLoading(true);
    
    const { data: existingProfile, error: lookupError } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', forgotPasswordEmail)
      .maybeSingle();

    if (lookupError) {
      setIsLoading(false);
      toast.error('Error checking email', { description: 'Please try again.' });
      return;
    }

    if (!existingProfile) {
      setIsLoading(false);
      toast.error('Email not registered', {
        description: 'This email is not registered in our system.',
      });
      return;
    }

    const { data: userRole } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', existingProfile.id)
      .maybeSingle();

    if (userRole?.role === 'teacher' || userRole?.role === 'student') {
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      
      const { count, error: countError } = await supabase
        .from('password_reset_requests')
        .select('*', { count: 'exact', head: true })
        .eq('email', forgotPasswordEmail)
        .gte('requested_at', twentyFourHoursAgo);

      if (!countError && count !== null && count >= 3) {
        setIsLoading(false);
        setResetLimitReached(true);
        toast.error('Reset limit reached');
        return;
      }

      await supabase.from('password_reset_requests').insert({
        user_id: existingProfile.id,
        email: forgotPasswordEmail,
        role: userRole.role,
        status: 'pending',
      });
    }
    
    const { error } = await supabase.auth.resetPasswordForEmail(forgotPasswordEmail, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });

    setIsLoading(false);

    if (error) {
      toast.error('Failed to send reset email', { description: error.message });
      return;
    }

    toast.success('Password reset email sent!');
    setShowForgotPassword(false);
    setForgotPasswordEmail('');
    setResetLimitReached(false);
  };

  const handleContactAdmin = () => {
    toast.info('Contact Administrator', {
      description: 'Please visit the school administration office for assistance.',
      duration: 10000,
    });
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Use different validation schema for students
    const schema = selectedRole === 'student' ? studentLoginSchema : loginSchema;
    const result = schema.safeParse({ identifier: loginIdentifier, password: loginPassword });
    if (!result.success) {
      toast.error(result.error.errors[0].message);
      return;
    }

    setIsLoading(true);
    
    let emailToUse = loginIdentifier;
    
    // Student login: ONLY admission number allowed (no email, no name)
    if (selectedRole === 'student') {
      const normalizedAdmission = loginIdentifier.trim();
      
      console.log('[Student Login] Looking up admission:', normalizedAdmission);
      
      // Step 1: Use RPC function to find student (bypasses RLS for anon users)
      const { data: studentRecords, error: studentError } = await supabase
        .rpc('lookup_student_for_login', { p_admission_number: normalizedAdmission });
      
      console.log('[Student Login] RPC result:', { studentRecords, studentError });
      
      const studentRecord = studentRecords?.[0];
      
      if (studentError || !studentRecord) {
        setIsLoading(false);
        toast.error('Student not found', {
          description: 'No student exists with this admission number.',
        });
        return;
      }
      
      // Step 2: Get email from linked user account
      let studentEmail: string | null = null;
      
      // Try via user_id in students table
      if (studentRecord.user_id) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('email')
          .eq('id', studentRecord.user_id)
          .maybeSingle();
        
        if (profileData?.email) {
          studentEmail = profileData.email;
        }
      }
      
      // Fallback: Try via student_classes admission_number
      if (!studentEmail) {
        const { data: classData } = await supabase
          .from('student_classes')
          .select('student_id')
          .ilike('admission_number', normalizedAdmission)
          .maybeSingle();
        
        if (classData?.student_id) {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('email')
            .eq('id', classData.student_id)
            .maybeSingle();
          
          if (profileData?.email) {
            studentEmail = profileData.email;
          }
        }
      }
      
      // Final fallback: Use email from students table
      if (!studentEmail && studentRecord.email) {
        studentEmail = studentRecord.email;
      }
      
      if (!studentEmail) {
        setIsLoading(false);
        toast.error('Account not created yet', {
          description: 'Please sign up first using your admission number.',
        });
        return;
      }
      
      emailToUse = studentEmail;
    }

    const { error } = await signIn(emailToUse, loginPassword);
    setIsLoading(false);

    if (error) {
      if (error.message.includes('Invalid login credentials')) {
        // For students, we know the admission number exists at this point
        // so it must be a password issue
        if (selectedRole === 'student') {
          toast.error('Incorrect password', {
            description: 'Please check your password and try again.',
          });
        } else {
          toast.error('Invalid credentials');
        }
      } else {
        toast.error(error.message);
      }
      return;
    }

    toast.success('Welcome back!');
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const result = signupSchema.safeParse({
      fullName: signupFullName,
      email: signupEmail,
      password: signupPassword,
      confirmPassword: signupConfirmPassword,
    });
    
    if (!result.success) {
      toast.error(result.error.errors[0].message);
      return;
    }

    if ((selectedRole === 'student' || selectedRole === 'teacher') && !selectedClass) {
      toast.error('Please select a class');
      return;
    }

    if (selectedRole === 'admin' && adminExists) {
      toast.error('Admin account already exists.');
      return;
    }

    setIsLoading(true);

    if (selectedRole === 'student') {
      const { data: existingStudentClass } = await supabase
        .from('student_classes')
        .select('student_id')
        .eq('admission_number', studentAdmissionNumber)
        .maybeSingle();

      if (existingStudentClass) {
        setIsLoading(false);
        toast.error('This student already has an account.');
        return;
      }

      const { data: isValidStudent, error: validationError } = await supabase
        .rpc('validate_student_for_signup', {
          admission_num: studentAdmissionNumber.trim(),
          student_name: signupFullName.trim()
        });

      if (validationError) {
        setIsLoading(false);
        toast.error('Error validating student record.');
        return;
      }

      if (!isValidStudent) {
        setIsLoading(false);
        toast.error('Student record not found or name mismatch');
        return;
      }
    }
    
    const { data: existingProfiles } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', signupEmail)
      .maybeSingle();
    
    if (existingProfiles) {
      setIsLoading(false);
      toast.error('Email already exists. Please login.');
      return;
    }

    const { error } = await signUp(
      signupEmail,
      signupPassword,
      signupFullName,
      selectedRole,
      selectedRole !== 'admin' ? selectedClass : undefined,
      selectedRole === 'student' ? studentAdmissionNumber : undefined
    );

    if (error) {
      setIsLoading(false);
      toast.error(error.message);
      return;
    }

    setIsLoading(false);
    toast.success('Account created successfully!');
  };

  const RoleIcon = roleIcons[selectedRole];

  const availableRoles = adminExists 
    ? (['teacher', 'student'] as AppRole[])
    : (['admin', 'teacher', 'student'] as AppRole[]);

  if (showForgotPassword) {
    return (
      <div className="min-h-screen flex flex-col relative overflow-hidden">
        {/* Animated gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-background via-muted/30 to-background" />
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-0 -left-40 w-80 h-80 bg-primary/20 rounded-full blur-3xl animate-pulse-slow" />
          <div className="absolute bottom-0 -right-40 w-80 h-80 bg-secondary/20 rounded-full blur-3xl animate-pulse-slow" />
        </div>
        
        <SystemAnnouncementBanner />
        <div className="flex-1 flex items-center justify-center p-4 relative z-10">
          <div className="w-full max-w-md">
            <div className="flex items-center justify-center gap-3 mb-8">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/80 shadow-lg shadow-primary/25">
                <School className="h-7 w-7 text-primary-foreground" />
              </div>
              <div>
                <h1 className="font-bold text-2xl bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">EduManage</h1>
                <p className="text-sm text-muted-foreground">Password Recovery</p>
              </div>
            </div>

            <Card className="shadow-2xl border-0 bg-card/80 backdrop-blur-sm">
              <CardHeader className="text-center pb-4">
                <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mb-4">
                  <KeyRound className="h-8 w-8 text-primary" />
                </div>
                <CardTitle>Reset Password</CardTitle>
                <CardDescription>Enter your email to receive a reset link</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleForgotPassword} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="forgot-email">Email Address</Label>
                    <Input
                      id="forgot-email"
                      type="email"
                      placeholder="Enter your email"
                      value={forgotPasswordEmail}
                      onChange={(e) => setForgotPasswordEmail(e.target.value)}
                      required
                      className="h-11"
                    />
                  </div>
                  {resetLimitReached ? (
                    <>
                      <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 text-center">
                        <p className="text-sm text-destructive mb-2">
                          Maximum reset attempts exceeded (3 per 24 hours).
                        </p>
                      </div>
                      <Button 
                        type="button" 
                        className="w-full bg-gradient-to-r from-primary to-primary/80 hover:opacity-90"
                        onClick={handleContactAdmin}
                      >
                        Contact Administrator
                      </Button>
                    </>
                  ) : (
                    <Button type="submit" className="w-full h-11 bg-gradient-to-r from-primary to-primary/80" disabled={isLoading}>
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        'Send Reset Link'
                      )}
                    </Button>
                  )}
                  <Button 
                    type="button" 
                    variant="ghost" 
                    className="w-full"
                    onClick={() => {
                      setShowForgotPassword(false);
                      setResetLimitReached(false);
                    }}
                  >
                    Back to Login
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-muted/30 to-background" />
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-20 -left-40 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute top-40 -right-40 w-80 h-80 bg-secondary/20 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute -bottom-20 left-1/3 w-72 h-72 bg-accent/20 rounded-full blur-3xl animate-pulse-slow" />
      </div>

      <SystemAnnouncementBanner />
      <div className="flex-1 flex items-center justify-center p-3 md:p-4 relative z-10">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="flex items-center justify-center gap-3 mb-6 md:mb-8">
            <div className="relative">
              <div className="flex h-12 w-12 md:h-14 md:w-14 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/80 shadow-lg shadow-primary/25">
                <School className="h-6 w-6 md:h-8 md:w-8 text-primary-foreground" />
              </div>
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-secondary rounded-full flex items-center justify-center shadow-lg">
                <Sparkles className="h-2.5 w-2.5 text-secondary-foreground" />
              </div>
            </div>
            <div>
              <h1 className="font-bold text-xl md:text-2xl bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">EduManage</h1>
              <p className="text-xs md:text-sm text-muted-foreground">School Management System</p>
            </div>
          </div>

          {/* Role Selection - Enhanced */}
          <div className="flex justify-center gap-2 md:gap-3 mb-4 md:mb-6">
            {(['admin', 'teacher', 'student'] as AppRole[]).map((r) => {
              const Icon = roleIcons[r];
              const isSelected = selectedRole === r;
              return (
                <button
                  key={r}
                  onClick={() => setSelectedRole(r)}
                  className={`role-card flex flex-col items-center gap-1.5 p-3 md:p-4 transition-all duration-300 ${
                    isSelected
                      ? `border-transparent ${roleBgColors[r]} shadow-lg`
                      : 'border-border/50 hover:border-primary/30 bg-card/50'
                  }`}
                >
                  <div className={`p-2 md:p-2.5 rounded-xl bg-gradient-to-br ${roleGradients[r]} shadow-md transition-transform duration-300 ${isSelected ? 'scale-110' : ''}`}>
                    <Icon className="h-4 w-4 md:h-5 md:w-5 text-white" />
                  </div>
                  <span className="text-[10px] md:text-xs font-semibold capitalize">{r}</span>
                </button>
              );
            })}
          </div>

          <Card className="shadow-2xl border-0 bg-card/80 backdrop-blur-sm">
            <CardHeader className="text-center pb-2 md:pb-4 px-4 md:px-6">
              <div className={`mx-auto w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-gradient-to-br ${roleGradients[selectedRole]} flex items-center justify-center mb-3 md:mb-4 shadow-lg`}>
                <RoleIcon className="h-7 w-7 md:h-8 md:w-8 text-white" />
              </div>
              <CardTitle className="capitalize text-lg md:text-xl">{selectedRole} Portal</CardTitle>
              <CardDescription className="text-xs md:text-sm">{roleDescriptions[selectedRole]}</CardDescription>
            </CardHeader>
            <CardContent className="px-4 md:px-6">
              <Tabs defaultValue="login" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-6 h-11">
                  <TabsTrigger value="login" className="text-sm">Login</TabsTrigger>
                  <TabsTrigger value="signup" className="text-sm">Sign Up</TabsTrigger>
                </TabsList>
                
                <TabsContent value="login">
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="login-identifier">
                        {selectedRole === 'student' ? 'Admission Number' : 'Email'}
                      </Label>
                      <Input
                        id="login-identifier"
                        type={selectedRole === 'student' ? 'text' : 'email'}
                        placeholder={selectedRole === 'student' ? 'Enter your admission number' : 'Enter your email'}
                        value={loginIdentifier}
                        onChange={(e) => setLoginIdentifier(e.target.value)}
                        required
                        className="h-11"
                      />
                      {selectedRole === 'student' && (
                        <p className="text-xs text-muted-foreground">
                          Use your admission number (e.g., GIS20252002)
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="login-password">Password</Label>
                      <PasswordInput
                        id="login-password"
                        placeholder="Enter your password"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        required
                        className="h-11"
                      />
                    </div>
                    <Button type="submit" className={`w-full h-11 bg-gradient-to-r ${roleGradients[selectedRole]} hover:opacity-90 shadow-md`} disabled={isLoading}>
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Signing in...
                        </>
                      ) : (
                        'Sign In'
                      )}
                    </Button>
                    <div className="text-center">
                      <button 
                        type="button"
                        className="text-sm text-primary hover:underline font-medium"
                        onClick={() => setShowForgotPassword(true)}
                      >
                        Forgot your password?
                      </button>
                    </div>
                  </form>
                </TabsContent>
                
                <TabsContent value="signup">
                  <form onSubmit={handleSignup} className="space-y-4">
                    {selectedRole === 'admin' && adminExists && (
                      <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm border border-destructive/20">
                        Admin account exists. Contact existing admin.
                      </div>
                    )}
                    
                    {selectedRole === 'student' && (
                      <div className="space-y-2">
                        <Label htmlFor="admission-number">Admission Number *</Label>
                        <Input
                          id="admission-number"
                          type="text"
                          placeholder="Enter admission number (e.g., 0001)"
                          value={studentAdmissionNumber}
                          onChange={(e) => setStudentAdmissionNumber(e.target.value)}
                          required
                          className="h-11"
                        />
                      </div>
                    )}
                    
                    <div className="space-y-2">
                      <Label htmlFor="signup-name">Full Name</Label>
                      <Input
                        id="signup-name"
                        type="text"
                        placeholder="Enter your full name"
                        value={signupFullName}
                        onChange={(e) => setSignupFullName(e.target.value)}
                        required
                        className="h-11"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-email">Email</Label>
                      <Input
                        id="signup-email"
                        type="email"
                        placeholder="Enter your email"
                        value={signupEmail}
                        onChange={(e) => setSignupEmail(e.target.value)}
                        required
                        className="h-11"
                      />
                    </div>
                    {selectedRole !== 'admin' && (
                      <div className="space-y-2">
                        <Label>Class</Label>
                        <Select value={selectedClass} onValueChange={setSelectedClass}>
                          <SelectTrigger className="h-11">
                            <SelectValue placeholder="Select your class" />
                          </SelectTrigger>
                          <SelectContent>
                            {CLASS_LIST_DETAILED.map((cls) => (
                              <SelectItem key={cls.id} value={cls.id}>
                                {cls.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                    <div className="space-y-2">
                      <Label htmlFor="signup-password">Password</Label>
                      <PasswordInput
                        id="signup-password"
                        placeholder="Create a password"
                        value={signupPassword}
                        onChange={(e) => setSignupPassword(e.target.value)}
                        required
                        className="h-11"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-confirm">Confirm Password</Label>
                      <PasswordInput
                        id="signup-confirm"
                        placeholder="Confirm your password"
                        value={signupConfirmPassword}
                        onChange={(e) => setSignupConfirmPassword(e.target.value)}
                        required
                        className="h-11"
                      />
                    </div>
                    <Button 
                      type="submit" 
                      className={`w-full h-11 bg-gradient-to-r ${roleGradients[selectedRole]} hover:opacity-90 shadow-md`}
                      disabled={isLoading || (selectedRole === 'admin' && adminExists)}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Creating account...
                        </>
                      ) : (
                        'Create Account'
                      )}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* School Registration Link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              Want to register your school?{' '}
              <Link to="/auth/register-school" className="text-primary hover:underline font-semibold">
                Register School
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}