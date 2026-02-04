import { Link } from 'react-router-dom';
import { UserPlus, Receipt, ClipboardCheck, FileText, Calendar, Mail, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

const actions = [
  { 
    icon: UserPlus, 
    label: 'New Admission', 
    path: '/admission', 
    gradient: 'from-primary/15 to-purple/10',
    iconBg: 'bg-gradient-to-br from-primary to-purple',
    hoverShadow: 'hover:shadow-[0_8px_24px_-6px_hsl(230,85%,55%/0.3)]'
  },
  { 
    icon: Receipt, 
    label: 'Record Payment', 
    path: '/fees', 
    gradient: 'from-secondary/15 to-coral/10',
    iconBg: 'bg-gradient-to-br from-secondary to-coral',
    hoverShadow: 'hover:shadow-[0_8px_24px_-6px_hsl(35,95%,55%/0.3)]'
  },
  { 
    icon: ClipboardCheck, 
    label: 'Attendance', 
    path: '/attendance', 
    gradient: 'from-accent/15 to-lime/10',
    iconBg: 'bg-gradient-to-br from-accent to-lime',
    hoverShadow: 'hover:shadow-[0_8px_24px_-6px_hsl(170,75%,42%/0.3)]'
  },
  { 
    icon: FileText, 
    label: 'Upload Exam', 
    path: '/exams', 
    gradient: 'from-info/15 to-cyan/10',
    iconBg: 'bg-gradient-to-br from-info to-cyan',
    hoverShadow: 'hover:shadow-[0_8px_24px_-6px_hsl(200,90%,50%/0.3)]'
  },
  { 
    icon: Calendar, 
    label: 'Schedule', 
    path: '/online-classes', 
    gradient: 'from-purple/15 to-pink/10',
    iconBg: 'bg-gradient-to-br from-purple to-pink',
    hoverShadow: 'hover:shadow-[0_8px_24px_-6px_hsl(270,85%,60%/0.3)]'
  },
  { 
    icon: Mail, 
    label: 'Message', 
    path: '/messages', 
    gradient: 'from-pink/15 to-coral/10',
    iconBg: 'bg-gradient-to-br from-pink to-coral',
    hoverShadow: 'hover:shadow-[0_8px_24px_-6px_hsl(330,85%,60%/0.3)]'
  },
];

export function QuickActions() {
  return (
    <div className="glass-card p-5 sm:p-6">
      <h3 className="section-heading mb-4 sm:mb-5 flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-primary" />
        Quick Actions
      </h3>
      <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-6 gap-3 sm:gap-4">
        {actions.map((action) => (
          <Link
            key={action.path}
            to={action.path}
            className={cn(
              'group flex flex-col items-center gap-3 p-4 sm:p-5 rounded-2xl transition-all duration-300',
              'bg-gradient-to-br border border-border/30',
              'hover:-translate-y-1 active:scale-[0.98]',
              action.gradient,
              action.hoverShadow
            )}
          >
            <div className={cn(
              "h-12 w-12 sm:h-14 sm:w-14 rounded-2xl flex items-center justify-center shadow-lg transition-transform duration-300 group-hover:scale-110",
              action.iconBg
            )}>
              <action.icon className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
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
