import { cn } from '@/lib/utils';

interface EmojiStatCardProps {
  emoji: string;
  value: string | number;
  label: string;
  variant?: 'blue' | 'purple' | 'green' | 'orange' | 'pink' | 'cyan' | 'yellow' | 'default';
  onClick?: () => void;
}

export function EmojiStatCard({ emoji, value, label, variant = 'default', onClick }: EmojiStatCardProps) {
  const variantStyles = {
    blue: 'bg-gradient-to-br from-blue-50 to-blue-100/50 border-blue-200/50 hover:border-blue-300',
    purple: 'bg-gradient-to-br from-purple-50 to-purple-100/50 border-purple-200/50 hover:border-purple-300',
    green: 'bg-gradient-to-br from-emerald-50 to-emerald-100/50 border-emerald-200/50 hover:border-emerald-300',
    orange: 'bg-gradient-to-br from-orange-50 to-orange-100/50 border-orange-200/50 hover:border-orange-300',
    pink: 'bg-gradient-to-br from-pink-50 to-pink-100/50 border-pink-200/50 hover:border-pink-300',
    cyan: 'bg-gradient-to-br from-cyan-50 to-cyan-100/50 border-cyan-200/50 hover:border-cyan-300',
    yellow: 'bg-gradient-to-br from-amber-50 to-amber-100/50 border-amber-200/50 hover:border-amber-300',
    default: 'bg-gradient-to-br from-muted/50 to-muted/30 border-border/50 hover:border-border',
  };

  const textStyles = {
    blue: 'text-blue-700',
    purple: 'text-purple-700',
    green: 'text-emerald-700',
    orange: 'text-orange-700',
    pink: 'text-pink-700',
    cyan: 'text-cyan-700',
    yellow: 'text-amber-700',
    default: 'text-foreground',
  };

  return (
    <div 
      className={cn(
        'relative rounded-2xl border p-4 md:p-5 transition-all duration-300',
        'flex flex-col items-center justify-center text-center',
        'hover:shadow-md hover:-translate-y-0.5',
        onClick && 'cursor-pointer active:scale-[0.98]',
        variantStyles[variant]
      )}
      onClick={onClick}
    >
      <span className="text-3xl md:text-4xl mb-2" role="img" aria-label={label}>
        {emoji}
      </span>
      <span className={cn('text-2xl md:text-3xl font-bold', textStyles[variant])}>
        {value}
      </span>
      <span className="text-xs md:text-sm font-medium text-muted-foreground mt-1 capitalize">
        {label}
      </span>
    </div>
  );
}
