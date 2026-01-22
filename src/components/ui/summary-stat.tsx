import { cn } from '@/lib/utils';

interface SummaryStatProps {
  label: string;
  value: string | number;
  variant?: 'success' | 'danger' | 'warning' | 'info' | 'primary' | 'default';
  icon?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

export function SummaryStat({ label, value, variant = 'default', icon, size = 'md' }: SummaryStatProps) {
  const variantStyles = {
    success: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    danger: 'bg-red-100 text-red-700 border-red-200',
    warning: 'bg-amber-100 text-amber-700 border-amber-200',
    info: 'bg-blue-100 text-blue-700 border-blue-200',
    primary: 'bg-primary/10 text-primary border-primary/20',
    default: 'bg-muted text-foreground border-border',
  };

  const sizeStyles = {
    sm: 'p-2 rounded-lg',
    md: 'p-3 md:p-4 rounded-xl',
    lg: 'p-4 md:p-5 rounded-2xl',
  };

  const valueSizes = {
    sm: 'text-lg',
    md: 'text-xl md:text-2xl',
    lg: 'text-2xl md:text-3xl',
  };

  const labelSizes = {
    sm: 'text-[10px]',
    md: 'text-xs',
    lg: 'text-sm',
  };

  return (
    <div 
      className={cn(
        'border flex flex-col items-center justify-center text-center transition-all',
        variantStyles[variant],
        sizeStyles[size]
      )}
    >
      {icon && <div className="mb-1">{icon}</div>}
      <span className={cn('font-bold', valueSizes[size])}>{value}</span>
      <span className={cn('font-medium uppercase tracking-wide opacity-80', labelSizes[size])}>
        {label}
      </span>
    </div>
  );
}

interface SummaryStatGridProps {
  children: React.ReactNode;
  columns?: 2 | 3 | 4 | 5;
}

export function SummaryStatGrid({ children, columns = 4 }: SummaryStatGridProps) {
  const columnClasses = {
    2: 'grid-cols-2',
    3: 'grid-cols-3',
    4: 'grid-cols-2 md:grid-cols-4',
    5: 'grid-cols-2 md:grid-cols-5',
  };

  return (
    <div className={cn('grid gap-2 md:gap-3', columnClasses[columns])}>
      {children}
    </div>
  );
}
