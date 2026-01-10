import { Navigate, useLocation } from 'react-router-dom';
import { useAuth, AppRole } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: AppRole[];
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, role, profile, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // UX-only check: If user is admin but has no school_id, redirect to school registration
  // Note: This is a UX convenience - actual data access is enforced by RLS policies
  // (except when already on the registration page)
  if (role === 'admin' && profile && !profile.school_id && location.pathname !== '/admin/register-school') {
    return <Navigate to="/admin/register-school" replace />;
  }

  // UX-only check: Determine if user has access to this route
  // Note: Actual authorization is enforced server-side via RLS policies
  // Superadmins can access all routes
  const isSuperadmin = role === 'superadmin';
  const hasAccess = !allowedRoles || 
    (role && allowedRoles.includes(role)) ||
    isSuperadmin;

  if (!hasAccess && role) {
    // Redirect to appropriate dashboard based on role
    if (isSuperadmin) {
      return <Navigate to="/superadmin" replace />;
    }
    if (role === 'admin') {
      return <Navigate to="/" replace />;
    }
    if (role === 'teacher') {
      return <Navigate to="/teacher" replace />;
    }
    if (role === 'student') {
      return <Navigate to="/student" replace />;
    }
  }

  return <>{children}</>;
}
