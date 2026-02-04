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
    blue: 'bg-gradient-to-br from-[hsl(220,100%,97%)] via-white to-[hsl(230,100%,98%)] border-[hsl(230,85%,55%/0.2)] hover:border-[hsl(230,85%,55%/0.4)] hover:shadow-[0_12px_32px_-8px_hsl(230,85%,55%/0.3)]',
    purple: 'bg-gradient-to-br from-[hsl(270,100%,97%)] via-white to-[hsl(280,100%,98%)] border-[hsl(270,85%,60%/0.2)] hover:border-[hsl(270,85%,60%/0.4)] hover:shadow-[0_12px_32px_-8px_hsl(270,85%,60%/0.3)]',
    green: 'bg-gradient-to-br from-[hsl(155,100%,96%)] via-white to-[hsl(160,100%,97%)] border-[hsl(155,75%,45%/0.2)] hover:border-[hsl(155,75%,45%/0.4)] hover:shadow-[0_12px_32px_-8px_hsl(155,75%,45%/0.3)]',
    orange: 'bg-gradient-to-br from-[hsl(35,100%,96%)] via-white to-[hsl(40,100%,97%)] border-[hsl(35,95%,55%/0.2)] hover:border-[hsl(35,95%,55%/0.4)] hover:shadow-[0_12px_32px_-8px_hsl(35,95%,55%/0.3)]',
    pink: 'bg-gradient-to-br from-[hsl(330,100%,97%)] via-white to-[hsl(340,100%,98%)] border-[hsl(330,85%,60%/0.2)] hover:border-[hsl(330,85%,60%/0.4)] hover:shadow-[0_12px_32px_-8px_hsl(330,85%,60%/0.3)]',
    cyan: 'bg-gradient-to-br from-[hsl(185,100%,96%)] via-white to-[hsl(190,100%,97%)] border-[hsl(185,85%,45%/0.2)] hover:border-[hsl(185,85%,45%/0.4)] hover:shadow-[0_12px_32px_-8px_hsl(185,85%,45%/0.3)]',
    yellow: 'bg-gradient-to-br from-[hsl(45,100%,96%)] via-white to-[hsl(50,100%,97%)] border-[hsl(45,95%,50%/0.2)] hover:border-[hsl(45,95%,50%/0.4)] hover:shadow-[0_12px_32px_-8px_hsl(45,95%,50%/0.3)]',
    default: 'bg-gradient-to-br from-muted/50 via-white to-muted/30 border-border/50 hover:border-border hover:shadow-lg',
  };

  const textStyles = {
    blue: 'text-[hsl(230,85%,45%)]',
    purple: 'text-[hsl(270,80%,50%)]',
    green: 'text-[hsl(155,75%,35%)]',
    orange: 'text-[hsl(35,90%,40%)]',
    pink: 'text-[hsl(330,80%,45%)]',
    cyan: 'text-[hsl(185,80%,35%)]',
    yellow: 'text-[hsl(45,85%,35%)]',
    default: 'text-foreground',
  };

  const iconBgStyles = {
    blue: 'bg-gradient-to-br from-[hsl(230,85%,55%/0.15)] to-[hsl(270,85%,60%/0.1)]',
    purple: 'bg-gradient-to-br from-[hsl(270,85%,60%/0.15)] to-[hsl(330,85%,60%/0.1)]',
    green: 'bg-gradient-to-br from-[hsl(155,75%,45%/0.15)] to-[hsl(170,75%,42%/0.1)]',
    orange: 'bg-gradient-to-br from-[hsl(35,95%,55%/0.15)] to-[hsl(15,90%,60%/0.1)]',
    pink: 'bg-gradient-to-br from-[hsl(330,85%,60%/0.15)] to-[hsl(15,90%,60%/0.1)]',
    cyan: 'bg-gradient-to-br from-[hsl(185,85%,45%/0.15)] to-[hsl(200,90%,50%/0.1)]',
    yellow: 'bg-gradient-to-br from-[hsl(45,95%,50%/0.15)] to-[hsl(35,95%,55%/0.1)]',
    default: 'bg-muted/50',
  };

  return (
    <div 
      className={cn(
        'glass-card relative rounded-2xl border-2 p-4 md:p-5 transition-all duration-300',
        'flex flex-col items-center justify-center text-center',
        'hover:-translate-y-1',
        onClick && 'cursor-pointer active:scale-[0.98]',
        variantStyles[variant]
      )}
      onClick={onClick}
    >
      {/* Decorative blur circle */}
      <div className={cn(
        'absolute -top-4 -right-4 w-20 h-20 rounded-full blur-2xl opacity-40',
        variant === 'blue' && 'bg-[hsl(230,85%,55%)]',
        variant === 'purple' && 'bg-[hsl(270,85%,60%)]',
        variant === 'green' && 'bg-[hsl(155,75%,45%)]',
        variant === 'orange' && 'bg-[hsl(35,95%,55%)]',
        variant === 'pink' && 'bg-[hsl(330,85%,60%)]',
        variant === 'cyan' && 'bg-[hsl(185,85%,45%)]',
        variant === 'yellow' && 'bg-[hsl(45,95%,50%)]',
        variant === 'default' && 'bg-primary',
      )} />
      
      <div className={cn(
        'relative w-14 h-14 md:w-16 md:h-16 rounded-2xl flex items-center justify-center mb-3',
        iconBgStyles[variant]
      )}>
        <span className="text-3xl md:text-4xl" role="img" aria-label={label}>
          {emoji}
        </span>
      </div>
      
      <span className={cn('relative text-2xl md:text-3xl font-bold', textStyles[variant])}>
        {value}
      </span>
      <span className="relative text-xs md:text-sm font-semibold text-muted-foreground mt-1 capitalize">
        {label}
      </span>
    </div>
  );
}
