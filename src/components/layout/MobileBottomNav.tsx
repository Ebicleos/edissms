import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Home, Users, Wallet, Settings, PenTool, Trophy, Calendar, GraduationCap, FileText, MoreHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useViewMode } from '@/contexts/ViewModeContext';
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
  const { viewMode } = useViewMode();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Use effective role: superadmin in admin view mode should see admin nav
  const effectiveRole = role === 'superadmin' && viewMode === 'admin' ? 'admin' : role;

  const getNavItems = () => {
    switch (effectiveRole) {
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

  if (navItems.length === 0 || effectiveRole === 'superadmin') {
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
          "bg-card/80 backdrop-blur-2xl border-t border-border/20",
          "safe-area-inset-bottom",
          "shadow-[0_-8px_32px_-8px_hsl(230,50%,15%/0.15)]"
        )}
        role="navigation"
        aria-label="Main navigation"
      >
        <div 
          className="flex items-stretch justify-around px-2"
          style={{ height: 'calc(env(safe-area-inset-bottom) + 4rem)', minHeight: '68px' }}
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
                  "flex flex-col items-center justify-center flex-1 gap-1.5 py-2.5 mx-0.5 rounded-2xl",
                  "transition-all duration-300 touch-manipulation",
                  "active:scale-90",
                  "min-h-[52px] min-w-[52px]",
                  isActive 
                    ? "text-primary" 
                    : "text-muted-foreground hover:text-foreground"
                )}
                aria-current={isActive ? 'page' : undefined}
              >
                <div className={cn(
                  "p-2 rounded-xl transition-all duration-300",
                  isActive 
                    ? "bg-gradient-to-br from-primary/15 to-purple/10 shadow-sm" 
                    : "hover:bg-muted/50"
                )}>
                  <item.icon className={cn(
                    "h-5 w-5 transition-all duration-300",
                    isActive && "scale-110 text-primary"
                  )} />
                </div>
                <span className={cn(
                  "text-[10px] leading-tight font-medium transition-all duration-300",
                  isActive && "font-bold text-primary"
                )}>
                  {item.label}
                </span>
                {isActive && (
                  <div className="absolute bottom-1 w-5 h-1 rounded-full bg-gradient-to-r from-primary to-purple" />
                )}
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
