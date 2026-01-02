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
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth, AppRole } from '@/contexts/AuthContext';

interface MenuItem {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  path: string;
  roles: AppRole[];
}

const menuItems: MenuItem[] = [
  // Admin items
  { icon: LayoutDashboard, label: 'Dashboard', path: '/', roles: ['admin'] },
  { icon: UserPlus, label: 'Admission', path: '/admission', roles: ['admin'] },
  { icon: Users, label: 'Students', path: '/students', roles: ['admin'] },
  { icon: GraduationCap, label: 'Classes', path: '/classes', roles: ['admin'] },
  { icon: UserCog, label: 'Teachers', path: '/teachers', roles: ['admin'] },
  { icon: Wallet, label: 'Fees', path: '/fees', roles: ['admin'] },
  { icon: ClipboardList, label: 'Exams', path: '/exams', roles: ['admin'] },
  { icon: Video, label: 'Online Classes', path: '/online-classes', roles: ['admin', 'teacher', 'student'] },
  { icon: Calendar, label: 'Attendance', path: '/attendance', roles: ['admin', 'teacher'] },
  { icon: IdCard, label: 'ID Cards', path: '/id-cards', roles: ['admin'] },
  { icon: Mail, label: 'Messages', path: '/messages', roles: ['admin', 'teacher'] },
  { icon: Settings, label: 'Settings', path: '/settings', roles: ['admin'] },
  
  // Teacher items
  { icon: LayoutDashboard, label: 'Dashboard', path: '/teacher', roles: ['teacher'] },
  { icon: Users, label: 'My Students', path: '/teacher/students', roles: ['teacher'] },
  { icon: ClipboardList, label: 'My Exams', path: '/teacher/exams', roles: ['teacher'] },
  { icon: Plus, label: 'Create Exam', path: '/teacher/exams/create', roles: ['teacher'] },
  
  // Student items
  { icon: LayoutDashboard, label: 'Dashboard', path: '/student', roles: ['student'] },
  { icon: PenTool, label: 'CBT Portal', path: '/cbt', roles: ['student'] },
  { icon: Trophy, label: 'My Results', path: '/student/results', roles: ['student'] },
  { icon: IdCard, label: 'My ID Card', path: '/student/id-card', roles: ['student'] },
];

export function Sidebar() {
  const location = useLocation();
  const { role, profile, signOut } = useAuth();

  const filteredItems = menuItems.filter(item => 
    role ? item.roles.includes(role) : false
  );

  const handleLogout = async () => {
    await signOut();
  };

  const getRoleBadgeColor = (r: AppRole | null) => {
    switch (r) {
      case 'admin': return 'bg-red-500';
      case 'teacher': return 'bg-blue-500';
      case 'student': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 bg-sidebar border-r border-sidebar-border">
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-sidebar-border">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sidebar-primary">
            <School className="h-6 w-6 text-sidebar-primary-foreground" />
          </div>
          <div>
            <h1 className="font-bold text-lg text-sidebar-foreground">EduManage</h1>
            <p className="text-xs text-sidebar-foreground/60">School Management</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto">
          {filteredItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={cn(
                  'sidebar-link',
                  isActive && 'active'
                )}
              >
                <item.icon className="h-5 w-5" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* User Section */}
        <div className="border-t border-sidebar-border p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-10 w-10 rounded-full bg-sidebar-primary flex items-center justify-center">
              <span className="text-sm font-semibold text-sidebar-primary-foreground">
                {profile?.full_name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-sidebar-foreground truncate">
                {profile?.full_name || 'User'}
              </p>
              <span className={cn(
                "text-xs px-2 py-0.5 rounded-full text-white capitalize",
                getRoleBadgeColor(role)
              )}>
                {role || 'Guest'}
              </span>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="sidebar-link w-full text-destructive/80 hover:text-destructive hover:bg-destructive/10"
          >
            <LogOut className="h-5 w-5" />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
