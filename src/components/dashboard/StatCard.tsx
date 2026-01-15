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
    primary: 'bg-gradient-to-br from-primary via-primary to-primary/80 text-primary-foreground shadow-primary',
    secondary: 'bg-gradient-to-br from-secondary via-secondary to-secondary/80 text-secondary-foreground shadow-secondary',
    accent: 'bg-gradient-to-br from-accent via-accent to-accent/80 text-accent-foreground shadow-accent',
    default: 'bg-card hover:bg-muted/30',
  };

  const iconContainerStyles = {
    primary: 'bg-white/20 text-white',
    secondary: 'bg-white/20 text-white',
    accent: 'bg-white/20 text-white',
    default: 'bg-gradient-to-br from-primary/15 to-primary/5 text-primary',
  };

  const iconBgAnimated = {
    primary: 'animate-pulse-slow',
    secondary: 'animate-pulse-slow',
    accent: 'animate-pulse-slow',
    default: '',
  };

  return (
    <div className={cn(
      'stat-card-enhanced group',
      'rounded-xl p-3 sm:p-4 md:p-6',
      'transition-all duration-300 active:scale-[0.98] md:hover:shadow-xl md:hover:-translate-y-1',
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
          <p className="text-xl sm:text-2xl md:text-3xl font-bold mt-1 sm:mt-2 truncate tracking-tight">{value}</p>
          {subtitle && (
            <p className={cn(
              'text-xs sm:text-sm mt-0.5 sm:mt-1 truncate',
              variant === 'default' ? 'text-muted-foreground' : 'text-current/70'
            )}>
              {subtitle}
            </p>
          )}
          {trend && (
            <div className={cn(
              'inline-flex items-center gap-1 mt-1 sm:mt-2 px-2 py-0.5 rounded-full text-xs sm:text-sm font-medium',
              trend.isPositive 
                ? variant === 'default' ? 'bg-success/10 text-success' : 'bg-white/20 text-white' 
                : variant === 'default' ? 'bg-destructive/10 text-destructive' : 'bg-white/20 text-white'
            )}>
              <span className="text-base">{trend.isPositive ? '↑' : '↓'}</span>
              {Math.abs(trend.value)}%
              <span className="opacity-70 ml-1 hidden sm:inline">vs last term</span>
            </div>
          )}
        </div>
        <div className={cn(
          'rounded-lg sm:rounded-xl p-2 sm:p-3 flex-shrink-0 transition-transform duration-300 group-hover:scale-110',
          iconContainerStyles[variant],
          iconBgAnimated[variant]
        )}>
          <Icon className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6" />
        </div>
      </div>
      
      {/* Decorative elements for colored variants */}
      {variant !== 'default' && (
        <>
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-16 translate-x-16" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-black/5 rounded-full translate-y-12 -translate-x-12" />
        </>
      )}
    </div>
  );
}