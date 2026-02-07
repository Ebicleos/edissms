import { ReactNode } from 'react';

interface PageGradientHeaderProps {
  emoji: string;
  title: string;
  subtitle?: string;
  gradient: string;
  children?: ReactNode;
}

export function PageGradientHeader({ emoji, title, subtitle, gradient, children }: PageGradientHeaderProps) {
  return (
    <div className={`rounded-2xl p-6 mb-6 bg-gradient-to-r ${gradient} border border-border/30`}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <span className="text-2xl">{emoji}</span>
            {title}
          </h2>
          {subtitle && (
            <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
          )}
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
