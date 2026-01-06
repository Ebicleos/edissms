import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

export type AppRole = 'admin' | 'teacher' | 'student' | 'superadmin';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  role: AppRole | null;
  profile: {
    full_name: string;
    email: string | null;
    photo_url: string | null;
    school_id: string | null;
  } | null;
  userClass: string | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, fullName: string, role: AppRole, classId?: string, admissionNumber?: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [profile, setProfile] = useState<AuthContextType['profile']>(null);
  const [userClass, setUserClass] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUserData = async (userId: string, userEmail?: string | null) => {
    // Fetch all roles for user to handle multiple roles
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId);
    
    let assignedRole: AppRole | null = null;
    if (roleData && roleData.length > 0) {
      // Priority: superadmin > admin > teacher > student
      const rolePriority: AppRole[] = ['superadmin', 'admin', 'teacher', 'student'];
      const userRoles = roleData.map(r => r.role as AppRole);
      assignedRole = rolePriority.find(r => userRoles.includes(r)) || null;
      setRole(assignedRole);
    }

    // Fetch profile
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('full_name, email, photo_url, school_id')
      .eq('id', userId)
      .maybeSingle();
    
    if (profileData) {
      setProfile(profileData);
    } else if (profileError || !profileData) {
      // Profile missing - create it in database to prevent login issues
      console.warn('Profile missing for user, creating profile in database');
      const defaultProfile = {
        full_name: userEmail?.split('@')[0] || 'User',
        email: userEmail || null,
        photo_url: null,
        school_id: null,
      };
      
      // Insert profile into database
      const { error: insertError } = await supabase
        .from('profiles')
        .upsert({
          id: userId,
          full_name: defaultProfile.full_name,
          email: defaultProfile.email,
          photo_url: defaultProfile.photo_url,
          school_id: defaultProfile.school_id,
        }, { onConflict: 'id' });
      
      if (insertError) {
        console.error('Failed to create profile:', insertError);
      }
      
      setProfile(defaultProfile);
    }

    // Fetch class if student
    if (assignedRole === 'student') {
      const { data: classData } = await supabase
        .from('student_classes')
        .select('class_id')
        .eq('student_id', userId)
        .maybeSingle();
      
      if (classData) {
        setUserClass(classData.class_id);
      }
    }

    // Fetch classes if teacher
    if (assignedRole === 'teacher') {
      const { data: classData } = await supabase
        .from('teacher_classes')
        .select('class_id')
        .eq('teacher_id', userId)
        .limit(1)
        .maybeSingle();
      
      if (classData) {
        setUserClass(classData.class_id);
      }
    }
  };

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Defer Supabase calls with setTimeout and wait for completion
          setTimeout(async () => {
            await fetchUserData(session.user.id, session.user.email);
            setIsLoading(false);
          }, 0);
        } else {
          setRole(null);
          setProfile(null);
          setUserClass(null);
          setIsLoading(false);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        await fetchUserData(session.user.id, session.user.email);
      }
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signUp = async (email: string, password: string, fullName: string, role: AppRole, classId?: string, admissionNumber?: string) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          full_name: fullName,
        },
      },
    });

    if (error) return { error };

    // If signup succeeded, add role and class
    if (data.user) {
      // Add user role
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({ user_id: data.user.id, role });

      if (roleError) return { error: roleError };

      // Add class assignment if provided
      if (classId) {
        if (role === 'student') {
          // Link student record to auth user via user_id
          if (admissionNumber) {
            // Update existing student record with user_id
            const { error: linkError } = await supabase
              .from('students')
              .update({ user_id: data.user.id, email })
              .eq('admission_number', admissionNumber);
            
            if (linkError) {
              console.error('Failed to link student record:', linkError);
            }
          }
          
          // Create student_classes entry
          const { error: classError } = await supabase
            .from('student_classes')
            .insert({ 
              student_id: data.user.id, 
              class_id: classId,
              admission_number: admissionNumber || `STU${Date.now().toString().slice(-8)}`
            });
          if (classError) return { error: classError };
        } else if (role === 'teacher') {
          const { error: classError } = await supabase
            .from('teacher_classes')
            .insert({ teacher_id: data.user.id, class_id: classId });
          if (classError) return { error: classError };
        }
      }
    }

    return { error: null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setRole(null);
    setProfile(null);
    setUserClass(null);
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchUserData(user.id, user.email);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        role,
        profile,
        userClass,
        isLoading,
        signIn,
        signUp,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
