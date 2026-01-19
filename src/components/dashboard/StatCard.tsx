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
    primary: 'bg-gradient-to-br from-primary via-primary/95 to-primary/85 text-primary-foreground',
    secondary: 'bg-gradient-to-br from-secondary via-secondary/95 to-secondary/85 text-secondary-foreground',
    accent: 'bg-gradient-to-br from-accent via-accent/95 to-accent/85 text-accent-foreground',
    default: 'bg-card border border-border/40 hover:border-border/60',
  };

  const shadowStyles = {
    primary: 'shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/25',
    secondary: 'shadow-lg shadow-secondary/20 hover:shadow-xl hover:shadow-secondary/25',
    accent: 'shadow-lg shadow-accent/20 hover:shadow-xl hover:shadow-accent/25',
    default: 'shadow-sm hover:shadow-md',
  };

  const iconContainerStyles = {
    primary: 'bg-white/20 text-white backdrop-blur-sm',
    secondary: 'bg-white/20 text-white backdrop-blur-sm',
    accent: 'bg-white/20 text-white backdrop-blur-sm',
    default: 'bg-gradient-to-br from-primary/12 to-primary/5 text-primary',
  };

  return (
    <div className={cn(
      'relative overflow-hidden rounded-2xl p-4 sm:p-5 md:p-6',
      'transition-all duration-300 active:scale-[0.98]',
      'md:hover:-translate-y-1',
      variantStyles[variant],
      shadowStyles[variant]
    )}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1 space-y-1">
          <p className={cn(
            'text-xs sm:text-sm font-semibold truncate uppercase tracking-wide',
            variant === 'default' ? 'text-muted-foreground' : 'text-white/80'
          )}>
            {title}
          </p>
          <p className="text-2xl sm:text-3xl md:text-4xl font-bold truncate tracking-tight leading-none">
            {value}
          </p>
          {subtitle && (
            <p className={cn(
              'text-xs sm:text-sm truncate font-medium',
              variant === 'default' ? 'text-muted-foreground' : 'text-white/70'
            )}>
              {subtitle}
            </p>
          )}
          {trend && (
            <div className={cn(
              'inline-flex items-center gap-1.5 mt-2 px-2.5 py-1 rounded-full text-xs font-semibold',
              trend.isPositive 
                ? variant === 'default' ? 'bg-success/12 text-success' : 'bg-white/20 text-white' 
                : variant === 'default' ? 'bg-destructive/12 text-destructive' : 'bg-white/20 text-white'
            )}>
              <span className="text-sm leading-none">{trend.isPositive ? '↑' : '↓'}</span>
              {Math.abs(trend.value)}%
              <span className="opacity-70 ml-0.5 hidden sm:inline">vs last term</span>
            </div>
          )}
        </div>
        <div className={cn(
          'rounded-xl p-2.5 sm:p-3 flex-shrink-0 transition-transform duration-300 md:group-hover:scale-110',
          iconContainerStyles[variant]
        )}>
          <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
        </div>
      </div>
      
      {/* Decorative elements for colored variants */}
      {variant !== 'default' && (
        <>
          <div className="absolute top-0 right-0 w-36 h-36 bg-white/8 rounded-full -translate-y-18 translate-x-18 blur-sm" />
          <div className="absolute bottom-0 left-0 w-28 h-28 bg-black/8 rounded-full translate-y-14 -translate-x-14 blur-sm" />
        </>
      )}
    </div>
  );
}