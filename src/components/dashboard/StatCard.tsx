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
      'stat-card card-hover',
      variantStyles[variant]
    )}>
      <div className="flex items-start justify-between">
        <div>
          <p className={cn(
            'text-sm font-medium',
            variant === 'default' ? 'text-muted-foreground' : 'text-current/80'
          )}>
            {title}
          </p>
          <p className="text-3xl font-bold mt-2">{value}</p>
          {subtitle && (
            <p className={cn(
              'text-sm mt-1',
              variant === 'default' ? 'text-muted-foreground' : 'text-current/70'
            )}>
              {subtitle}
            </p>
          )}
          {trend && (
            <p className={cn(
              'text-sm font-medium mt-2 flex items-center gap-1',
              trend.isPositive ? 'text-success' : 'text-destructive',
              variant !== 'default' && 'text-current/80'
            )}>
              {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
              <span className="opacity-70 ml-1">vs last term</span>
            </p>
          )}
        </div>
        <div className={cn(
          'rounded-xl p-3',
          iconStyles[variant]
        )}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  );
}
