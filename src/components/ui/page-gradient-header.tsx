import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface PageGradientHeaderProps {
  emoji: string;
  title: string;
  subtitle?: string;
  gradient: string;
  children?: ReactNode;
  className?: string;
}

export function PageGradientHeader({ emoji, title, subtitle, gradient, children, className }: PageGradientHeaderProps) {
  return (
    <div className={cn(
      `relative overflow-hidden rounded-2xl p-5 sm:p-6 mb-5 sm:mb-6 bg-gradient-to-r ${gradient} border border-border/20`,
      'shadow-sm',
      className
    )}>
      {/* Decorative element */}
      <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-white/5 blur-2xl pointer-events-none" />
      <div className="absolute -bottom-8 -left-8 w-24 h-24 rounded-full bg-white/5 blur-2xl pointer-events-none" />
      
      <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 sm:h-12 sm:w-12 rounded-xl bg-white/80 dark:bg-white/10 flex items-center justify-center shadow-sm flex-shrink-0">
            <span className="text-xl sm:text-2xl">{emoji}</span>
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight leading-tight">
              {title}
            </h2>
            {subtitle && (
              <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 font-medium">{subtitle}</p>
            )}
          </div>
        </div>
        {children && (
          <div className="flex items-center gap-2 flex-wrap">
            {children}
          </div>
        )}
      </div>
    </div>
  );
}
