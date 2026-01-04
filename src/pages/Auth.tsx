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
import { School, ShieldCheck, GraduationCap, Users, Loader2, KeyRound } from 'lucide-react';
import { toast } from 'sonner';
import { CLASS_LIST_DETAILED } from '@/types';
import { z } from 'zod';

const loginSchema = z.object({
  identifier: z.string().min(1, 'Email or Admission Number is required'),
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

const roleColors = {
  admin: 'from-red-500 to-orange-500',
  teacher: 'from-blue-500 to-cyan-500',
  student: 'from-green-500 to-emerald-500',
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
    // Reset login form
    setLoginIdentifier('');
    setLoginPassword('');
    
    // Reset signup form
    setSignupFullName('');
    setSignupEmail('');
    setSignupPassword('');
    setSignupConfirmPassword('');
    setSelectedClass('');
    setStudentAdmissionNumber('');
  }, [selectedRole]);

  // Redirect if already logged in
  useEffect(() => {
    // Don't redirect while auth is still loading
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
    
    const { error } = await supabase.auth.resetPasswordForEmail(forgotPasswordEmail, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });

    setIsLoading(false);

    if (error) {
      toast.error('Failed to send reset email', { description: error.message });
      return;
    }

    toast.success('Password reset email sent!', {
      description: 'Check your inbox for the reset link.',
    });
    setShowForgotPassword(false);
    setForgotPasswordEmail('');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const result = loginSchema.safeParse({ identifier: loginIdentifier, password: loginPassword });
    if (!result.success) {
      toast.error(result.error.errors[0].message);
      return;
    }

    setIsLoading(true);
    
    let emailToUse = loginIdentifier;
    
    // Check if it's an admission number (for students)
    if (selectedRole === 'student' && !loginIdentifier.includes('@')) {
      // Look up the email by admission number
      const { data: studentData, error: lookupError } = await supabase
        .from('student_classes')
        .select('student_id')
        .eq('admission_number', loginIdentifier)
        .maybeSingle();
      
      if (lookupError || !studentData) {
        setIsLoading(false);
        toast.error('Invalid admission number');
        return;
      }
      
      // Get the email from profiles
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('email')
        .eq('id', studentData.student_id)
        .maybeSingle();
      
      if (profileError || !profileData?.email) {
        setIsLoading(false);
        toast.error('Could not find account for this admission number');
        return;
      }
      
      emailToUse = profileData.email;
    }

    const { error } = await signIn(emailToUse, loginPassword);
    setIsLoading(false);

    if (error) {
      if (error.message.includes('Invalid login credentials')) {
        toast.error('Invalid credentials');
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

    // Check if admin signup is allowed
    if (selectedRole === 'admin' && adminExists) {
      toast.error('Admin account already exists. Please contact the existing admin.');
      return;
    }

    setIsLoading(true);

    // For students, validate against existing student records
    if (selectedRole === 'student') {
      // Check if student already has an account
      const { data: existingStudentClass } = await supabase
        .from('student_classes')
        .select('student_id')
        .eq('admission_number', studentAdmissionNumber)
        .maybeSingle();

      if (existingStudentClass) {
        setIsLoading(false);
        toast.error('This student already has an account. Please login instead.');
        return;
      }

      // Check if student record exists in students table
      const { data: studentRecord } = await supabase
        .from('students')
        .select('id, full_name, class_id')
        .eq('admission_number', studentAdmissionNumber)
        .maybeSingle();

      if (!studentRecord) {
        setIsLoading(false);
        toast.error('No student record found with this admission number. Please contact admin.');
        return;
      }

      // Validate name matches (case-insensitive with normalized whitespace)
      const normalizedDbName = studentRecord.full_name.toLowerCase().replace(/\s+/g, ' ').trim();
      const normalizedInputName = signupFullName.toLowerCase().replace(/\s+/g, ' ').trim();
      
      if (normalizedDbName !== normalizedInputName) {
        setIsLoading(false);
        toast.error('Name does not match the student record', {
          description: `Expected: "${studentRecord.full_name}". Please use your exact registered name.`,
        });
        return;
      }

      // Validate class matches
      if (studentRecord.class_id !== selectedClass) {
        setIsLoading(false);
        toast.error('Class does not match the student record. Please select the correct class.');
        return;
      }
    }
    
    // Check if email already exists
    const { data: existingProfiles } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', signupEmail)
      .maybeSingle();
    
    if (existingProfiles) {
      setIsLoading(false);
      toast.error('An account with this email already exists. Please login instead.');
      return;
    }

    const { error } = await signUp(
      signupEmail,
      signupPassword,
      signupFullName,
      selectedRole,
      selectedRole !== 'admin' ? selectedClass : undefined
    );

    if (error) {
      setIsLoading(false);
      if (error.message.includes('already registered')) {
        toast.error('An account with this email already exists');
      } else {
        toast.error(error.message);
      }
      return;
    }

    // For students, update the student_classes with admission number
    if (selectedRole === 'student' && studentAdmissionNumber) {
      // This will be handled by the AuthContext signUp function
      // The student_classes entry is created there
    }

    setIsLoading(false);
    toast.success('Account created successfully!');
  };

  const RoleIcon = roleIcons[selectedRole];

  // Filter roles for signup (hide admin if one already exists)
  const availableRoles = adminExists 
    ? (['teacher', 'student'] as AppRole[])
    : (['admin', 'teacher', 'student'] as AppRole[]);

  if (showForgotPassword) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary">
              <School className="h-7 w-7 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-bold text-2xl">EduManage</h1>
              <p className="text-sm text-muted-foreground">Password Recovery</p>
            </div>
          </div>

          <Card className="shadow-xl">
            <CardHeader className="text-center pb-4">
              <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <KeyRound className="h-8 w-8 text-primary" />
              </div>
              <CardTitle>Reset Password</CardTitle>
              <CardDescription>Enter your email to receive a password reset link</CardDescription>
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
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    'Send Reset Link'
                  )}
                </Button>
                <Button 
                  type="button" 
                  variant="ghost" 
                  className="w-full"
                  onClick={() => setShowForgotPassword(false)}
                >
                  Back to Login
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary">
            <School className="h-7 w-7 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-bold text-2xl">EduManage</h1>
            <p className="text-sm text-muted-foreground">School Management System</p>
          </div>
        </div>

        {/* Role Selection */}
        <div className="flex justify-center gap-2 mb-6">
          {(['admin', 'teacher', 'student'] as AppRole[]).map((r) => {
            const Icon = roleIcons[r];
            return (
              <button
                key={r}
                onClick={() => setSelectedRole(r)}
                className={`flex flex-col items-center gap-1 p-3 rounded-lg border-2 transition-all ${
                  selectedRole === r
                    ? 'border-primary bg-primary/10'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <div className={`p-2 rounded-lg bg-gradient-to-br ${roleColors[r]}`}>
                  <Icon className="h-5 w-5 text-white" />
                </div>
                <span className="text-xs font-medium capitalize">{r}</span>
              </button>
            );
          })}
        </div>

        <Card className="shadow-xl">
          <CardHeader className="text-center pb-4">
            <div className={`mx-auto w-16 h-16 rounded-full bg-gradient-to-br ${roleColors[selectedRole]} flex items-center justify-center mb-4`}>
              <RoleIcon className="h-8 w-8 text-white" />
            </div>
            <CardTitle className="capitalize">{selectedRole} Portal</CardTitle>
            <CardDescription>{roleDescriptions[selectedRole]}</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>
              
              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-identifier">
                      {selectedRole === 'student' ? 'Email or Admission Number' : 'Email'}
                    </Label>
                    <Input
                      id="login-identifier"
                      type={selectedRole === 'student' ? 'text' : 'email'}
                      placeholder={selectedRole === 'student' ? 'Enter email or admission number' : 'Enter your email'}
                      value={loginIdentifier}
                      onChange={(e) => setLoginIdentifier(e.target.value)}
                      required
                    />
                    {selectedRole === 'student' && (
                      <p className="text-xs text-muted-foreground">
                        Students can login with their admission number (e.g., 0001)
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
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Signing in...
                      </>
                    ) : (
                      'Sign In'
                    )}
                  </Button>
                  {/* Password reset is handled by admin only */}
                  <p className="text-xs text-center text-muted-foreground">
                    Forgot your password? Contact your school administrator.
                  </p>
                </form>
              </TabsContent>
              
              <TabsContent value="signup">
                <form onSubmit={handleSignup} className="space-y-4">
                  {selectedRole === 'admin' && adminExists && (
                    <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                      An admin account already exists. Please contact the existing admin for access.
                    </div>
                  )}
                  
                  {selectedRole === 'student' && (
                    <div className="space-y-2">
                      <Label htmlFor="admission-number">Admission Number *</Label>
                      <Input
                        id="admission-number"
                        type="text"
                        placeholder="Enter your admission number (e.g., 0001)"
                        value={studentAdmissionNumber}
                        onChange={(e) => setStudentAdmissionNumber(e.target.value)}
                        required
                      />
                      <p className="text-xs text-muted-foreground">
                        Your admission number was provided during registration
                      </p>
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
                    />
                    {selectedRole === 'student' && (
                      <p className="text-xs text-muted-foreground">
                        Must match the name on your student record
                      </p>
                    )}
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
                    />
                  </div>
                  {selectedRole !== 'admin' && (
                    <div className="space-y-2">
                      <Label>Class</Label>
                      <Select value={selectedClass} onValueChange={setSelectedClass}>
                        <SelectTrigger>
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
                    />
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full" 
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
            <Link to="/auth/register-school" className="text-primary hover:underline font-medium">
              Register School
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
