import { Link } from 'react-router-dom';
import { UserPlus, Receipt, ClipboardCheck, FileText, Calendar, Mail } from 'lucide-react';
import { cn } from '@/lib/utils';

const actions = [
  { icon: UserPlus, label: 'New Admission', path: '/admission', color: 'bg-primary/10 text-primary hover:bg-primary/20 active:bg-primary/30' },
  { icon: Receipt, label: 'Record Payment', path: '/fees', color: 'bg-secondary/10 text-secondary hover:bg-secondary/20 active:bg-secondary/30' },
  { icon: ClipboardCheck, label: 'Attendance', path: '/attendance', color: 'bg-accent/10 text-accent hover:bg-accent/20 active:bg-accent/30' },
  { icon: FileText, label: 'Upload Exam', path: '/exams', color: 'bg-info/10 text-info hover:bg-info/20 active:bg-info/30' },
  { icon: Calendar, label: 'Schedule', path: '/online-classes', color: 'bg-warning/10 text-warning hover:bg-warning/20 active:bg-warning/30' },
  { icon: Mail, label: 'Message', path: '/messages', color: 'bg-destructive/10 text-destructive hover:bg-destructive/20 active:bg-destructive/30' },
];

export function QuickActions() {
  return (
    <div className="bg-card rounded-xl border border-border/50 p-4 sm:p-6 shadow-sm">
      <h3 className="font-semibold text-foreground mb-3 sm:mb-4 text-sm sm:text-base">Quick Actions</h3>
      <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-6 gap-2 sm:gap-3">
        {actions.map((action) => (
          <Link
            key={action.path}
            to={action.path}
            className={cn(
              'flex flex-col items-center gap-1.5 sm:gap-2 p-3 sm:p-4 rounded-xl',
              'transition-all duration-200 touch-manipulation',
              'active:scale-95',
              action.color
            )}
          >
            <action.icon className="h-5 w-5 sm:h-6 sm:w-6" />
            <span className="text-[10px] sm:text-xs md:text-sm font-medium text-center leading-tight">
              {action.label}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
