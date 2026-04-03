import { cn } from '@/lib/utils';
import { Button } from './button';

interface EmptyStateProps {
  icon?: React.ReactNode;
  emoji?: string;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyState({ icon, emoji, title, description, actionLabel, onAction, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-16 px-4 text-center', className)}>
      {emoji && (
        <div className="h-20 w-20 rounded-3xl bg-gradient-to-br from-muted/80 to-muted/40 flex items-center justify-center mb-5 shadow-sm">
          <span className="text-4xl">{emoji}</span>
        </div>
      )}
      {icon && !emoji && (
        <div className="h-20 w-20 rounded-3xl bg-gradient-to-br from-muted/80 to-muted/40 flex items-center justify-center mb-5 shadow-sm text-muted-foreground">
          {icon}
        </div>
      )}
      <h3 className="text-lg font-semibold text-foreground mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-muted-foreground max-w-sm mb-5">{description}</p>
      )}
      {actionLabel && onAction && (
        <Button onClick={onAction} className="bg-gradient-primary hover:opacity-90">
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
