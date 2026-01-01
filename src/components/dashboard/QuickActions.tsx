import { Link } from 'react-router-dom';
import { UserPlus, Receipt, ClipboardCheck, FileText, Calendar, Mail } from 'lucide-react';
import { cn } from '@/lib/utils';

const actions = [
  { icon: UserPlus, label: 'New Admission', path: '/admission', color: 'bg-primary/10 text-primary hover:bg-primary/20' },
  { icon: Receipt, label: 'Record Payment', path: '/fees', color: 'bg-secondary/10 text-secondary hover:bg-secondary/20' },
  { icon: ClipboardCheck, label: 'Mark Attendance', path: '/attendance', color: 'bg-accent/10 text-accent hover:bg-accent/20' },
  { icon: FileText, label: 'Upload Exam', path: '/exams', color: 'bg-info/10 text-info hover:bg-info/20' },
  { icon: Calendar, label: 'View Schedule', path: '/online-classes', color: 'bg-warning/10 text-warning hover:bg-warning/20' },
  { icon: Mail, label: 'Send Message', path: '/messages', color: 'bg-destructive/10 text-destructive hover:bg-destructive/20' },
];

export function QuickActions() {
  return (
    <div className="bg-card rounded-xl border border-border/50 p-6 shadow-sm">
      <h3 className="font-semibold text-foreground mb-4">Quick Actions</h3>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {actions.map((action) => (
          <Link
            key={action.path}
            to={action.path}
            className={cn(
              'flex flex-col items-center gap-2 p-4 rounded-xl transition-all duration-200',
              action.color
            )}
          >
            <action.icon className="h-6 w-6" />
            <span className="text-sm font-medium text-center">{action.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
