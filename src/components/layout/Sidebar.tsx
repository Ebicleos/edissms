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
  BookOpen,
  Calendar,
  Settings,
  LogOut,
  School,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const menuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
  { icon: UserPlus, label: 'Admission', path: '/admission' },
  { icon: Users, label: 'Students', path: '/students' },
  { icon: GraduationCap, label: 'Classes', path: '/classes' },
  { icon: UserCog, label: 'Teachers', path: '/teachers' },
  { icon: Wallet, label: 'Fees', path: '/fees' },
  { icon: ClipboardList, label: 'Exams', path: '/exams' },
  { icon: Video, label: 'Online Classes', path: '/online-classes' },
  { icon: Calendar, label: 'Attendance', path: '/attendance' },
  { icon: IdCard, label: 'ID Cards', path: '/id-cards' },
  { icon: Mail, label: 'Messages', path: '/messages' },
  { icon: Settings, label: 'Settings', path: '/settings' },
];

export function Sidebar() {
  const location = useLocation();

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
          {menuItems.map((item) => {
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
              <span className="text-sm font-semibold text-sidebar-primary-foreground">AD</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-sidebar-foreground truncate">Admin User</p>
              <p className="text-xs text-sidebar-foreground/60 truncate">admin@school.edu</p>
            </div>
          </div>
          <button className="sidebar-link w-full text-destructive/80 hover:text-destructive hover:bg-destructive/10">
            <LogOut className="h-5 w-5" />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
