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
          "bg-background/90 backdrop-blur-xl border-t border-border/40",
          "safe-area-inset-bottom shadow-[0_-4px_20px_-8px_rgba(0,0,0,0.1)]"
        )}
        role="navigation"
        aria-label="Main navigation"
      >
        <div 
          className="flex items-stretch justify-around px-2"
          style={{ height: 'calc(env(safe-area-inset-bottom) + 4rem)', minHeight: '64px' }}
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
                  "flex flex-col items-center justify-center flex-1 gap-1 py-2.5 mx-0.5 rounded-xl",
                  "transition-all duration-300 touch-manipulation",
                  "active:scale-90",
                  "min-h-[48px] min-w-[48px]",
                  isActive 
                    ? "text-primary bg-primary/10" 
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
                aria-current={isActive ? 'page' : undefined}
              >
                <div className={cn(
                  "p-1.5 rounded-lg transition-all duration-300",
                  isActive && "bg-primary/10"
                )}>
                  <item.icon className={cn(
                    "h-5 w-5 transition-transform duration-300",
                    isActive && "scale-110"
                  )} />
                </div>
                <span className={cn(
                  "text-[10px] leading-tight font-medium",
                  isActive && "font-semibold text-primary"
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
