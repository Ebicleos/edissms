import { cn } from '@/lib/utils';
import { CheckCircle, Clock, AlertCircle, XCircle, Shield, Zap } from 'lucide-react';

type StatusVariant = 'success' | 'warning' | 'error' | 'info' | 'pending' | 'active' | 'inactive' | 'default';

interface StatusBadgeProps {
  status: StatusVariant;
  label?: string;
  showIcon?: boolean;
  className?: string;
}

const statusConfig: Record<StatusVariant, { icon: React.ElementType; classes: string; defaultLabel: string }> = {
  success: {
    icon: CheckCircle,
    classes: 'bg-success/10 text-success border-success/20',
    defaultLabel: 'Success',
  },
  warning: {
    icon: Clock,
    classes: 'bg-warning/10 text-warning border-warning/20',
    defaultLabel: 'Warning',
  },
  error: {
    icon: XCircle,
    classes: 'bg-destructive/10 text-destructive border-destructive/20',
    defaultLabel: 'Error',
  },
  info: {
    icon: AlertCircle,
    classes: 'bg-info/10 text-info border-info/20',
    defaultLabel: 'Info',
  },
  pending: {
    icon: Clock,
    classes: 'bg-warning/10 text-warning border-warning/20',
    defaultLabel: 'Pending',
  },
  active: {
    icon: Zap,
    classes: 'bg-success/10 text-success border-success/20',
    defaultLabel: 'Active',
  },
  inactive: {
    icon: Shield,
    classes: 'bg-muted text-muted-foreground border-border',
    defaultLabel: 'Inactive',
  },
  default: {
    icon: AlertCircle,
    classes: 'bg-muted text-muted-foreground border-border',
    defaultLabel: 'Unknown',
  },
};

export function StatusBadge({ status, label, showIcon = true, className }: StatusBadgeProps) {
  const config = statusConfig[status] || statusConfig.default;
  const Icon = config.icon;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border',
        config.classes,
        className
      )}
    >
      {showIcon && <Icon className="h-3 w-3" />}
      {label || config.defaultLabel}
    </span>
  );
}
