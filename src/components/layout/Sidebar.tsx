import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  UserPlus,
  Users,
  GraduationCap,
  Wallet,
  ClipboardList,
  Video,
  IdCard,
  Mail,
  UserCog,
  Calendar,
  Settings,
  LogOut,
  School,
  Trophy,
  PenTool,
  Plus,
  FileText,
  ArrowUpRight,
  Megaphone,
  CalendarDays,
  ChevronDown,
  Shield,
  ShieldCheck,
  Check,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth, AppRole } from '@/contexts/AuthContext';
import { useViewMode } from '@/contexts/ViewModeContext';
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
  roles: AppRole[];
}

const menuItems: MenuItem[] = [
  // Super Admin items
  { icon: LayoutDashboard, label: 'Dashboard', path: '/superadmin', roles: ['superadmin'] },
  { icon: School, label: 'Schools', path: '/superadmin/schools', roles: ['superadmin'] },
  { icon: Wallet, label: 'Subscriptions', path: '/superadmin/subscriptions', roles: ['superadmin'] },
  { icon: Users, label: 'Platform Users', path: '/superadmin/users', roles: ['superadmin'] },
  { icon: Settings, label: 'System Settings', path: '/superadmin/settings', roles: ['superadmin'] },
  { icon: FileText, label: 'Audit Logs', path: '/superadmin/audit-logs', roles: ['superadmin'] },
  
  // Admin items
  { icon: LayoutDashboard, label: 'Dashboard', path: '/', roles: ['admin'] },
  { icon: UserPlus, label: 'Admission', path: '/admission', roles: ['admin'] },
  { icon: Users, label: 'Students', path: '/students', roles: ['admin'] },
  { icon: GraduationCap, label: 'Classes', path: '/classes', roles: ['admin'] },
  { icon: UserCog, label: 'Teachers', path: '/teachers', roles: ['admin'] },
  { icon: Wallet, label: 'Fees', path: '/fees', roles: ['admin'] },
  { icon: ClipboardList, label: 'Exams', path: '/exams', roles: ['admin'] },
  { icon: PenTool, label: 'CBT Portal', path: '/admin/cbt', roles: ['admin'] },
  { icon: FileText, label: 'Report Cards', path: '/report-cards', roles: ['admin'] },
  { icon: ArrowUpRight, label: 'Promotion', path: '/promotion', roles: ['admin'] },
  { icon: Video, label: 'Online Classes', path: '/online-classes', roles: ['admin', 'teacher', 'student'] },
  { icon: Calendar, label: 'Attendance', path: '/attendance', roles: ['admin', 'teacher'] },
  { icon: IdCard, label: 'ID Cards', path: '/id-cards', roles: ['admin'] },
  { icon: Megaphone, label: 'Announcements', path: '/announcements', roles: ['admin'] },
  { icon: CalendarDays, label: 'Events', path: '/events', roles: ['admin', 'teacher'] },
  { icon: Mail, label: 'Messages', path: '/messages', roles: ['admin', 'teacher'] },
  { icon: UserCog, label: 'User Management', path: '/user-management', roles: ['admin'] },
  { icon: Settings, label: 'Settings', path: '/settings', roles: ['admin'] },
  { icon: GraduationCap, label: 'Subjects', path: '/subjects', roles: ['admin'] },
  
  // Teacher items
  { icon: LayoutDashboard, label: 'Dashboard', path: '/teacher', roles: ['teacher'] },
  { icon: Users, label: 'My Students', path: '/teacher/students', roles: ['teacher'] },
  { icon: ClipboardList, label: 'My Exams', path: '/teacher/exams', roles: ['teacher'] },
  { icon: Plus, label: 'Create Exam', path: '/teacher/exams/create', roles: ['teacher'] },
  { icon: FileText, label: 'Assignments', path: '/teacher/assignments', roles: ['teacher'] },
  { icon: FileText, label: 'Grade Entry', path: '/teacher/grades', roles: ['teacher'] },
  
  // Student items
  { icon: LayoutDashboard, label: 'Dashboard', path: '/student', roles: ['student'] },
  { icon: PenTool, label: 'CBT Portal', path: '/cbt', roles: ['student'] },
  { icon: Trophy, label: 'My Results', path: '/student/results', roles: ['student'] },
  { icon: Megaphone, label: 'Announcements', path: '/student/announcements', roles: ['student'] },
  { icon: CalendarDays, label: 'Events', path: '/student/events', roles: ['student'] },
  { icon: Calendar, label: 'My Attendance', path: '/student/attendance', roles: ['student'] },
  { icon: FileText, label: 'Assignments', path: '/student/assignments', roles: ['student'] },
  { icon: IdCard, label: 'My ID Card', path: '/student/id-card', roles: ['student'] },
  { icon: Wallet, label: 'School Fees', path: '/student/fees', roles: ['student'] },
];

export function Sidebar() {
  const location = useLocation();
  const { role, profile, signOut } = useAuth();
  const { viewMode, setViewMode, canSwitchView } = useViewMode();

  // For superadmins, use viewMode to determine which menu items to show
  const effectiveRole = (role === 'superadmin' && viewMode === 'admin') 
    ? 'admin' 
    : role;

  const filteredItems = menuItems.filter(item => 
    effectiveRole ? item.roles.includes(effectiveRole) : false
  );

  const handleViewModeChange = (mode: 'superadmin' | 'admin') => {
    setViewMode(mode);
    toast.success(`Switched to ${mode === 'superadmin' ? 'SuperAdmin' : 'Admin'} view`);
  };

  const handleLogout = async () => {
    await signOut();
  };

  const getRoleBadgeStyles = (r: AppRole | null) => {
    switch (r) {
      case 'superadmin': return 'bg-gradient-to-r from-purple-500 to-pink-500';
      case 'admin': return 'bg-gradient-to-r from-primary to-purple-500';
      case 'teacher': return 'bg-gradient-to-r from-cyan-500 to-info';
      case 'student': return 'bg-gradient-to-r from-accent to-lime-500';
      default: return 'bg-muted-foreground';
    }
  };

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 bg-sidebar overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-0 right-0 w-40 h-40 bg-purple-500/10 rounded-full -translate-y-20 translate-x-20 blur-3xl" />
      <div className="absolute bottom-20 left-0 w-32 h-32 bg-secondary/10 rounded-full translate-y-10 -translate-x-10 blur-3xl" />
      
      <div className="relative flex h-full flex-col">
        {/* Logo Header */}
        <div className="flex items-center gap-3 px-5 py-6 border-b border-white/5 flex-shrink-0">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-secondary via-secondary to-coral shadow-lg shadow-secondary/30">
            <School className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="font-display font-bold text-lg text-sidebar-foreground tracking-tight flex items-center gap-1.5">
              EduManage
              <Sparkles className="h-4 w-4 text-secondary" />
            </h1>
            <p className="text-xs text-sidebar-foreground/50 font-medium">School Portal</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 px-3 py-5 overflow-y-auto no-scrollbar" style={{ overscrollBehavior: 'contain' }}>
          <div className="space-y-1">
            {filteredItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={cn(
                    'sidebar-link group relative overflow-hidden',
                    isActive && 'active'
                  )}
                >
                  {isActive && (
                    <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-purple-500/10 to-transparent" />
                  )}
                  <item.icon className={cn(
                    "relative h-5 w-5 transition-all duration-300",
                    isActive 
                      ? "text-secondary scale-110" 
                      : "text-sidebar-foreground/50 group-hover:text-sidebar-foreground group-hover:scale-105"
                  )} />
                  <span className="relative truncate">{item.label}</span>
                </NavLink>
              );
            })}
          </div>
        </nav>

        {/* User Section */}
        <div className="flex-shrink-0 border-t border-white/5 p-4 bg-gradient-to-t from-black/20 to-transparent">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-secondary via-secondary to-pink-500 flex items-center justify-center shadow-lg shadow-secondary/20">
              <span className="text-sm font-bold text-white tracking-wide">
                {profile?.full_name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-sidebar-foreground truncate">
                {profile?.full_name || 'User'}
              </p>
              {canSwitchView ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className={cn(
                      "text-xs px-3 py-1.5 rounded-full text-white capitalize inline-flex items-center gap-1.5 hover:opacity-90 transition-all font-semibold shadow-md",
                      getRoleBadgeStyles(viewMode === 'admin' ? 'admin' : 'superadmin')
                    )}>
                      {viewMode === 'admin' ? 'Admin View' : 'SuperAdmin'}
                      <ChevronDown className="h-3 w-3" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-48 bg-popover border border-border z-50">
                    <DropdownMenuItem 
                      onClick={() => handleViewModeChange('superadmin')}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <Shield className="h-4 w-4" />
                      <span>SuperAdmin View</span>
                      {viewMode === 'superadmin' && <Check className="h-4 w-4 ml-auto text-primary" />}
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => handleViewModeChange('admin')}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <ShieldCheck className="h-4 w-4" />
                      <span>Admin View</span>
                      {viewMode === 'admin' && <Check className="h-4 w-4 ml-auto text-primary" />}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <span className={cn(
                  "text-xs px-3 py-1.5 rounded-full text-white capitalize font-semibold shadow-md inline-block",
                  getRoleBadgeStyles(role)
                )}>
                  {role || 'Guest'}
                </span>
              )}
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
    </aside>
  );
}
