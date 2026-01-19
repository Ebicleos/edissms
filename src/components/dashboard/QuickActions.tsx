import { Link } from 'react-router-dom';
import { UserPlus, Receipt, ClipboardCheck, FileText, Calendar, Mail } from 'lucide-react';
import { cn } from '@/lib/utils';

const actions = [
  { 
    icon: UserPlus, 
    label: 'New Admission', 
    path: '/admission', 
    bgColor: 'bg-primary/10 hover:bg-primary/15',
    iconColor: 'text-primary',
    shadowColor: 'hover:shadow-primary/10'
  },
  { 
    icon: Receipt, 
    label: 'Record Payment', 
    path: '/fees', 
    bgColor: 'bg-secondary/10 hover:bg-secondary/15',
    iconColor: 'text-secondary',
    shadowColor: 'hover:shadow-secondary/10'
  },
  { 
    icon: ClipboardCheck, 
    label: 'Attendance', 
    path: '/attendance', 
    bgColor: 'bg-accent/10 hover:bg-accent/15',
    iconColor: 'text-accent',
    shadowColor: 'hover:shadow-accent/10'
  },
  { 
    icon: FileText, 
    label: 'Upload Exam', 
    path: '/exams', 
    bgColor: 'bg-info/10 hover:bg-info/15',
    iconColor: 'text-info',
    shadowColor: 'hover:shadow-info/10'
  },
  { 
    icon: Calendar, 
    label: 'Schedule', 
    path: '/online-classes', 
    bgColor: 'bg-warning/10 hover:bg-warning/15',
    iconColor: 'text-warning',
    shadowColor: 'hover:shadow-warning/10'
  },
  { 
    icon: Mail, 
    label: 'Message', 
    path: '/messages', 
    bgColor: 'bg-destructive/10 hover:bg-destructive/15',
    iconColor: 'text-destructive',
    shadowColor: 'hover:shadow-destructive/10'
  },
];

export function QuickActions() {
  return (
    <div className="content-card">
      <h3 className="section-heading mb-4 sm:mb-5 flex items-center gap-2">
        <span className="h-1.5 w-1.5 rounded-full bg-primary" />
        Quick Actions
      </h3>
      <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-6 gap-2.5 sm:gap-3">
        {actions.map((action) => (
          <Link
            key={action.path}
            to={action.path}
            className={cn(
              'quick-action-btn',
              action.bgColor,
              action.shadowColor,
              'hover:shadow-lg'
            )}
          >
            <div className={cn(
              "h-10 w-10 sm:h-12 sm:w-12 rounded-xl flex items-center justify-center",
              action.bgColor
            )}>
              <action.icon className={cn("h-5 w-5 sm:h-6 sm:w-6", action.iconColor)} />
            </div>
            <span className="text-[10px] sm:text-xs md:text-sm font-semibold text-center leading-tight text-foreground">
              {action.label}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}