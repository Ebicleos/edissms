import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

interface ActionCardProps {
  title: string;
  description?: string;
  icon: LucideIcon;
  path: string;
  variant?: 'blue' | 'purple' | 'green' | 'orange' | 'pink' | 'cyan' | 'default';
  compact?: boolean;
}

export function ActionCard({ 
  title, 
  description, 
  icon: Icon, 
  path, 
  variant = 'default',
  compact = false
}: ActionCardProps) {
  const navigate = useNavigate();

  const iconBgStyles = {
    blue: 'bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-blue-500/25',
    purple: 'bg-gradient-to-br from-purple-500 to-purple-600 text-white shadow-purple-500/25',
    green: 'bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-emerald-500/25',
    orange: 'bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-orange-500/25',
    pink: 'bg-gradient-to-br from-pink-500 to-pink-600 text-white shadow-pink-500/25',
    cyan: 'bg-gradient-to-br from-cyan-500 to-cyan-600 text-white shadow-cyan-500/25',
    default: 'bg-gradient-to-br from-primary to-primary/90 text-white shadow-primary/25',
  };

  const cardHoverStyles = {
    blue: 'hover:border-blue-200',
    purple: 'hover:border-purple-200',
    green: 'hover:border-emerald-200',
    orange: 'hover:border-orange-200',
    pink: 'hover:border-pink-200',
    cyan: 'hover:border-cyan-200',
    default: 'hover:border-primary/20',
  };

  return (
    <div
      onClick={() => navigate(path)}
      className={cn(
        'group cursor-pointer rounded-xl md:rounded-2xl border border-border/50 bg-card',
        'transition-all duration-300 hover:shadow-lg hover:-translate-y-1 active:scale-[0.98]',
        cardHoverStyles[variant],
        compact ? 'p-3 md:p-4' : 'p-4 md:p-5'
      )}
    >
      <div className={cn(
        'flex items-center',
        compact ? 'gap-3' : 'gap-4',
        !compact && !description && 'flex-col text-center'
      )}>
        <div className={cn(
          'flex items-center justify-center rounded-xl shadow-lg transition-transform duration-300 group-hover:scale-110',
          compact ? 'h-10 w-10 md:h-12 md:w-12' : 'h-12 w-12 md:h-14 md:w-14',
          iconBgStyles[variant]
        )}>
          <Icon className={cn(
            compact ? 'h-5 w-5 md:h-6 md:w-6' : 'h-6 w-6 md:h-7 md:w-7'
          )} />
        </div>
        
        <div className={cn('min-w-0', compact ? 'flex-1' : '')}>
          <h3 className={cn(
            'font-semibold text-foreground truncate',
            compact ? 'text-sm md:text-base' : 'text-base md:text-lg'
          )}>
            {title}
          </h3>
          {description && (
            <p className="text-xs md:text-sm text-muted-foreground truncate mt-0.5">
              {description}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
