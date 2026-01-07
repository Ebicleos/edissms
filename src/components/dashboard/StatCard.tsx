import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  variant?: 'primary' | 'secondary' | 'accent' | 'default';
}

export function StatCard({ title, value, subtitle, icon: Icon, trend, variant = 'default' }: StatCardProps) {
  const variantStyles = {
    primary: 'bg-gradient-primary text-primary-foreground',
    secondary: 'bg-gradient-secondary text-secondary-foreground',
    accent: 'bg-gradient-accent text-accent-foreground',
    default: 'bg-card',
  };

  const iconStyles = {
    primary: 'bg-primary-foreground/20 text-primary-foreground',
    secondary: 'bg-secondary-foreground/20 text-secondary-foreground',
    accent: 'bg-accent-foreground/20 text-accent-foreground',
    default: 'bg-primary/10 text-primary',
  };

  return (
    <div className={cn(
      'relative overflow-hidden rounded-xl p-3 sm:p-4 md:p-6 bg-card shadow-sm border border-border/50',
      'transition-all duration-300 active:scale-[0.98] md:hover:shadow-lg md:hover:-translate-y-0.5',
      variantStyles[variant]
    )}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className={cn(
            'text-xs sm:text-sm font-medium truncate',
            variant === 'default' ? 'text-muted-foreground' : 'text-current/80'
          )}>
            {title}
          </p>
          <p className="text-xl sm:text-2xl md:text-3xl font-bold mt-1 sm:mt-2 truncate">{value}</p>
          {subtitle && (
            <p className={cn(
              'text-xs sm:text-sm mt-0.5 sm:mt-1 truncate',
              variant === 'default' ? 'text-muted-foreground' : 'text-current/70'
            )}>
              {subtitle}
            </p>
          )}
          {trend && (
            <p className={cn(
              'text-xs sm:text-sm font-medium mt-1 sm:mt-2 flex items-center gap-1',
              trend.isPositive ? 'text-success' : 'text-destructive',
              variant !== 'default' && 'text-current/80'
            )}>
              {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
              <span className="opacity-70 ml-1 hidden sm:inline">vs last term</span>
            </p>
          )}
        </div>
        <div className={cn(
          'rounded-lg sm:rounded-xl p-2 sm:p-3 flex-shrink-0',
          iconStyles[variant]
        )}>
          <Icon className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6" />
        </div>
      </div>
    </div>
  );
}
