import { cn } from '@/lib/utils';

interface DataCardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  gradient?: 'blue' | 'purple' | 'green' | 'orange' | 'pink' | 'cyan' | 'none';
}

const gradientClasses: Record<string, string> = {
  blue: 'stat-card-blue',
  purple: 'stat-card-purple',
  green: 'stat-card-green',
  orange: 'stat-card-orange',
  pink: 'stat-card-pink',
  cyan: '',
  none: 'bg-card rounded-2xl border border-border/40 shadow-sm',
};

export function DataCard({ children, className, hover = true, gradient = 'none' }: DataCardProps) {
  return (
    <div
      className={cn(
        gradientClasses[gradient] || gradientClasses.none,
        hover && 'card-hover',
        'transition-all duration-300',
        className
      )}
    >
      {children}
    </div>
  );
}

interface DataCardGridProps {
  children: React.ReactNode;
  columns?: 1 | 2 | 3 | 4;
  className?: string;
}

export function DataCardGrid({ children, columns = 3, className }: DataCardGridProps) {
  const colClasses = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
  };

  return (
    <div className={cn('grid gap-3 md:gap-4', colClasses[columns], className)}>
      {children}
    </div>
  );
}
