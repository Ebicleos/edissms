import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Menu, LogOut, ChevronDown } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { NavLink } from '@/components/NavLink';
import { useAuth } from '@/contexts/AuthContext';
import { useViewMode } from '@/contexts/ViewModeContext';
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  BookOpen,
  Calendar,
  ClipboardList,
  CreditCard,
  MessageSquare,
  Bell,
  Settings,
  CalendarDays,
  Video,
  UserPlus,
  IdCard,
  FileText,
  ArrowUpDown,
  Building,
  Shield,
  BookOpenCheck,
  Megaphone,
  CalendarCheck,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';

interface MenuItem {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  path: string;
  roles: string[];
}

const menuItems: MenuItem[] = [
  // Admin items
  { icon: LayoutDashboard, label: 'Dashboard', path: '/', roles: ['admin'] },
  { icon: Users, label: 'Students', path: '/students', roles: ['admin'] },
  { icon: GraduationCap, label: 'Teachers', path: '/teachers', roles: ['admin'] },
  { icon: BookOpen, label: 'Classes', path: '/classes', roles: ['admin'] },
  { icon: BookOpenCheck, label: 'Subjects', path: '/subjects', roles: ['admin'] },
  { icon: Calendar, label: 'Attendance', path: '/attendance', roles: ['admin'] },
  { icon: ClipboardList, label: 'Exams', path: '/exams', roles: ['admin'] },
  { icon: FileText, label: 'Report Cards', path: '/report-cards', roles: ['admin'] },
  { icon: CreditCard, label: 'Fees', path: '/fees', roles: ['admin'] },
  { icon: ArrowUpDown, label: 'Promotion', path: '/promotion', roles: ['admin'] },
  { icon: MessageSquare, label: 'Messages', path: '/messages', roles: ['admin'] },
  { icon: Bell, label: 'Announcements', path: '/announcements', roles: ['admin'] },
  { icon: CalendarDays, label: 'Events', path: '/events', roles: ['admin'] },
  { icon: Video, label: 'Online Classes', path: '/online-classes', roles: ['admin'] },
  { icon: UserPlus, label: 'New Admission', path: '/admission', roles: ['admin'] },
  { icon: IdCard, label: 'ID Cards', path: '/id-cards', roles: ['admin'] },
  { icon: Shield, label: 'User Management', path: '/user-management', roles: ['admin'] },
  { icon: Settings, label: 'Settings', path: '/settings', roles: ['admin'] },
  
  // Superadmin items
  { icon: LayoutDashboard, label: 'Dashboard', path: '/superadmin', roles: ['superadmin'] },
  { icon: Building, label: 'Schools', path: '/superadmin/schools', roles: ['superadmin'] },
  { icon: CreditCard, label: 'Subscriptions', path: '/superadmin/subscriptions', roles: ['superadmin'] },
  { icon: Users, label: 'Platform Users', path: '/superadmin/users', roles: ['superadmin'] },
  { icon: Settings, label: 'System Settings', path: '/superadmin/settings', roles: ['superadmin'] },
  
  // Teacher items
  { icon: LayoutDashboard, label: 'Dashboard', path: '/teacher', roles: ['teacher'] },
  { icon: ClipboardList, label: 'My Exams', path: '/teacher/exams', roles: ['teacher'] },
  { icon: FileText, label: 'Grade Entry', path: '/teacher/grades', roles: ['teacher'] },
  { icon: FileText, label: 'Assignments', path: '/teacher/assignments', roles: ['teacher'] },
  { icon: Calendar, label: 'Attendance', path: '/attendance', roles: ['teacher'] },
  { icon: MessageSquare, label: 'Messages', path: '/messages', roles: ['teacher'] },
  { icon: Video, label: 'Online Classes', path: '/online-classes', roles: ['teacher'] },
  { icon: CalendarDays, label: 'Events', path: '/events', roles: ['teacher'] },
  
  // Student items
  { icon: LayoutDashboard, label: 'Dashboard', path: '/student', roles: ['student'] },
  { icon: ClipboardList, label: 'CBT Portal', path: '/cbt', roles: ['student'] },
  { icon: GraduationCap, label: 'My Results', path: '/student/results', roles: ['student'] },
  { icon: CreditCard, label: 'School Fees', path: '/student/fees', roles: ['student'] },
  { icon: IdCard, label: 'My ID Card', path: '/student/id-card', roles: ['student'] },
  { icon: Megaphone, label: 'Announcements', path: '/student/announcements', roles: ['student'] },
  { icon: CalendarDays, label: 'Events', path: '/student/events', roles: ['student'] },
  { icon: CalendarCheck, label: 'Attendance', path: '/student/attendance', roles: ['student'] },
  { icon: BookOpen, label: 'Assignments', path: '/student/assignments', roles: ['student'] },
  { icon: Video, label: 'Online Classes', path: '/online-classes', roles: ['student'] },
];

interface MobileSidebarProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MobileSidebar({ open, onOpenChange }: MobileSidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { role, profile, signOut } = useAuth();
  const { viewMode, setViewMode } = useViewMode();

  const effectiveRole = role === 'superadmin' && viewMode === 'admin' ? 'admin' : role;

  const filteredItems = menuItems.filter((item) =>
    item.roles.includes(effectiveRole || '')
  );

  const handleLogout = async () => {
    await signOut();
    onOpenChange(false);
    navigate('/auth');
  };

  const handleViewModeChange = (mode: 'superadmin' | 'admin') => {
    setViewMode(mode);
    toast.success(`Switched to ${mode === 'superadmin' ? 'Super Admin' : 'Admin'} view`);
    onOpenChange(false);
    navigate(mode === 'superadmin' ? '/superadmin' : '/');
  };

  const getRoleBadgeColor = () => {
    switch (effectiveRole) {
      case 'superadmin':
        return 'bg-red-500/10 text-red-600';
      case 'admin':
        return 'bg-primary/10 text-primary';
      case 'teacher':
        return 'bg-blue-500/10 text-blue-600';
      case 'student':
        return 'bg-green-500/10 text-green-600';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-72 p-0 bg-sidebar border-sidebar-border" aria-describedby={undefined}>
        <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
        <div className="flex flex-col h-full relative overflow-hidden">
          {/* Decorative background elements */}
          <div className="absolute top-0 right-0 w-40 h-40 bg-purple-500/10 rounded-full -translate-y-20 translate-x-20 blur-3xl" />
          <div className="absolute bottom-20 left-0 w-32 h-32 bg-secondary/10 rounded-full translate-y-10 -translate-x-10 blur-3xl" />
          
          {/* Logo */}
          <div className="relative p-4 border-b border-white/5">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-secondary via-secondary to-coral shadow-lg shadow-secondary/30 flex items-center justify-center">
                <GraduationCap className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="font-display font-bold text-lg text-sidebar-foreground tracking-tight">EDISSMS</h1>
                <p className="text-xs text-sidebar-foreground/50">School Management</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="relative flex-1 overflow-y-auto p-3">
            <ul className="space-y-1">
              {filteredItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <li key={item.path}>
                    <NavLink
                      to={item.path}
                      className={`sidebar-link group relative overflow-hidden ${
                        isActive ? 'active' : ''
                      }`}
                      onClick={() => onOpenChange(false)}
                    >
                      {isActive && (
                        <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-purple-500/10 to-transparent" />
                      )}
                      <Icon className={`relative h-5 w-5 transition-all duration-300 ${
                        isActive 
                          ? 'text-secondary scale-110' 
                          : 'text-sidebar-foreground/50 group-hover:text-sidebar-foreground'
                      }`} />
                      <span className="relative text-sidebar-foreground truncate">{item.label}</span>
                    </NavLink>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* User Section */}
          <div className="relative flex-shrink-0 border-t border-white/5 p-4 bg-gradient-to-t from-black/20 to-transparent">
            {/* View Mode Switcher for Superadmin */}
            {role === 'superadmin' && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="w-full justify-between mb-3 border-white/10 bg-white/5 text-sidebar-foreground hover:bg-white/10">
                    <span className="text-sm">{viewMode === 'superadmin' ? 'Super Admin View' : 'Admin View'}</span>
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-56">
                  <DropdownMenuItem onClick={() => handleViewModeChange('superadmin')}>
                    Super Admin View
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleViewModeChange('admin')}>
                    Admin View
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            <div className="flex items-center gap-3 mb-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-secondary via-secondary to-pink-500 flex items-center justify-center shadow-lg shadow-secondary/20">
                <span className="text-sm font-bold text-white">
                  {profile?.full_name?.split(' ').map((n) => n[0]).join('').slice(0, 2) || 'U'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-sidebar-foreground truncate">
                  {profile?.full_name || 'User'}
                </p>
                <span className={`text-xs px-2.5 py-1 rounded-full font-semibold inline-block ${getRoleBadgeColor()}`}>
                  {effectiveRole || 'User'}
                </span>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="sidebar-link w-full text-red-400/80 hover:text-red-400 hover:bg-red-500/15 group"
            >
              <LogOut className="h-5 w-5 group-hover:scale-110 transition-transform" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

export function MobileSidebarTrigger({ onClick }: { onClick: () => void }) {
  return (
    <Button variant="ghost" size="icon" className="md:hidden" onClick={onClick}>
      <Menu className="h-5 w-5" />
    </Button>
  );
}
