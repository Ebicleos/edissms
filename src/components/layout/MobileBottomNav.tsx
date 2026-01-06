import { useLocation, useNavigate } from 'react-router-dom';
import { Home, Users, Wallet, Settings, PenTool, Trophy, Calendar, Megaphone } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';

interface NavItem {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  path: string;
}

const adminNavItems: NavItem[] = [
  { icon: Home, label: 'Home', path: '/' },
  { icon: Users, label: 'Students', path: '/students' },
  { icon: Wallet, label: 'Fees', path: '/fees' },
  { icon: Settings, label: 'Settings', path: '/settings' },
];

const teacherNavItems: NavItem[] = [
  { icon: Home, label: 'Home', path: '/teacher' },
  { icon: PenTool, label: 'Exams', path: '/teacher/exams' },
  { icon: Calendar, label: 'Attendance', path: '/attendance' },
  { icon: Settings, label: 'Grades', path: '/teacher/grades' },
];

const studentNavItems: NavItem[] = [
  { icon: Home, label: 'Home', path: '/student' },
  { icon: PenTool, label: 'CBT', path: '/cbt' },
  { icon: Trophy, label: 'Results', path: '/student/results' },
  { icon: Megaphone, label: 'News', path: '/student/announcements' },
];

export function MobileBottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { role } = useAuth();

  const getNavItems = () => {
    switch (role) {
      case 'admin':
        return adminNavItems;
      case 'teacher':
        return teacherNavItems;
      case 'student':
        return studentNavItems;
      default:
        return [];
    }
  };

  const navItems = getNavItems();

  if (navItems.length === 0 || role === 'superadmin') {
    return null;
  }

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border safe-area-inset-bottom">
      <div className="flex items-center justify-around h-16">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={cn(
                'flex flex-col items-center justify-center flex-1 h-full gap-1 transition-colors',
                'active:bg-muted/50 touch-manipulation',
                isActive ? 'text-primary' : 'text-muted-foreground'
              )}
            >
              <item.icon className={cn('h-5 w-5', isActive && 'text-primary')} />
              <span className={cn('text-xs', isActive && 'font-medium')}>{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
