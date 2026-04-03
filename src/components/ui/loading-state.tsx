import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LoadingStateProps {
  message?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function LoadingState({ message = 'Loading...', className, size = 'md' }: LoadingStateProps) {
  const sizeClasses = {
    sm: 'h-5 w-5',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
  };

  const containerClasses = {
    sm: 'py-8',
    md: 'py-16',
    lg: 'py-24',
  };

  return (
    <div className={cn('flex flex-col items-center justify-center', containerClasses[size], className)}>
      <div className="relative">
        <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping" />
        <Loader2 className={cn('animate-spin text-primary relative', sizeClasses[size])} />
      </div>
      <p className="text-sm text-muted-foreground mt-4 font-medium">{message}</p>
    </div>
  );
}
