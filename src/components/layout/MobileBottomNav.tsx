import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Home, Users, Wallet, Settings, PenTool, Trophy, Calendar, GraduationCap, FileText, MoreHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { MobileSidebar } from './MobileSidebar';

interface NavItem {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  path: string;
  isMore?: boolean;
}

const adminNavItems: NavItem[] = [
  { icon: Home, label: 'Home', path: '/' },
  { icon: Users, label: 'Students', path: '/students' },
  { icon: Wallet, label: 'Fees', path: '/fees' },
  { icon: PenTool, label: 'CBT', path: '/admin/cbt' },
  { icon: MoreHorizontal, label: 'More', path: '#more', isMore: true },
];

const teacherNavItems: NavItem[] = [
  { icon: Home, label: 'Home', path: '/teacher' },
  { icon: PenTool, label: 'Exams', path: '/teacher/exams' },
  { icon: FileText, label: 'Grades', path: '/teacher/grades' },
  { icon: Calendar, label: 'Attend', path: '/attendance' },
  { icon: MoreHorizontal, label: 'More', path: '#more', isMore: true },
];

const studentNavItems: NavItem[] = [
  { icon: Home, label: 'Home', path: '/student' },
  { icon: PenTool, label: 'CBT', path: '/cbt' },
  { icon: Trophy, label: 'Results', path: '/student/results' },
  { icon: Wallet, label: 'Fees', path: '/student/fees' },
  { icon: MoreHorizontal, label: 'More', path: '#more', isMore: true },
];

export function MobileBottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { role } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

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

  const handleNavClick = (item: NavItem) => {
    if (item.isMore) {
      setSidebarOpen(true);
    } else {
      navigate(item.path);
    }
  };

  return (
    <>
      <nav 
        className={cn(
          "md:hidden fixed bottom-0 left-0 right-0 z-50",
          "bg-background/95 backdrop-blur-md border-t border-border",
          "safe-area-inset-bottom"
        )}
        role="navigation"
        aria-label="Main navigation"
      >
        <div 
          className="flex items-stretch justify-around"
          style={{ height: 'calc(env(safe-area-inset-bottom) + 3.5rem)', minHeight: '56px' }}
        >
          {navItems.map((item) => {
            const isActive = !item.isMore && (
              location.pathname === item.path || 
              (item.path !== '/' && item.path !== '/student' && item.path !== '/teacher' && 
               location.pathname.startsWith(item.path))
            );
            
            return (
              <button
                key={item.path}
                onClick={() => handleNavClick(item)}
                className={cn(
                  "flex flex-col items-center justify-center flex-1 gap-0.5 py-2",
                  "transition-all duration-200 touch-manipulation",
                  "active:scale-95 active:bg-muted/50",
                  "min-h-[44px] min-w-[44px]",
                  isActive 
                    ? "text-primary" 
                    : "text-muted-foreground hover:text-foreground"
                )}
                aria-current={isActive ? 'page' : undefined}
              >
                <item.icon className={cn(
                  "h-5 w-5 transition-transform",
                  isActive && "scale-110"
                )} />
                <span className={cn(
                  "text-[10px] sm:text-xs leading-tight",
                  isActive && "font-semibold"
                )}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
      
      {/* Full sidebar for "More" menu */}
      <MobileSidebar open={sidebarOpen} onOpenChange={setSidebarOpen} />
    </>
  );
}
