import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

interface PillOption {
  value: string;
  label: string;
}

interface PillSelectorProps {
  options: PillOption[];
  value: string[];
  onChange: (value: string[]) => void;
  multiSelect?: boolean;
  variant?: 'primary' | 'purple' | 'green' | 'orange';
}

export function PillSelector({ 
  options, 
  value, 
  onChange, 
  multiSelect = true,
  variant = 'primary'
}: PillSelectorProps) {
  const variantStyles = {
    primary: {
      active: 'bg-primary text-primary-foreground border-primary',
      inactive: 'bg-muted/50 text-foreground border-border hover:border-primary/50 hover:bg-primary/5',
    },
    purple: {
      active: 'bg-[hsl(280,80%,50%)] text-white border-[hsl(280,80%,50%)]',
      inactive: 'bg-purple-50 text-purple-700 border-purple-200 hover:border-purple-300 hover:bg-purple-100',
    },
    green: {
      active: 'bg-accent text-accent-foreground border-accent',
      inactive: 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:border-emerald-300 hover:bg-emerald-100',
    },
    orange: {
      active: 'bg-secondary text-secondary-foreground border-secondary',
      inactive: 'bg-orange-50 text-orange-700 border-orange-200 hover:border-orange-300 hover:bg-orange-100',
    },
  };

  const handleClick = (optionValue: string) => {
    if (multiSelect) {
      if (value.includes(optionValue)) {
        onChange(value.filter(v => v !== optionValue));
      } else {
        onChange([...value, optionValue]);
      }
    } else {
      onChange([optionValue]);
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => {
        const isSelected = value.includes(option.value);
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => handleClick(option.value)}
            className={cn(
              'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-sm font-medium transition-all duration-200',
              isSelected ? variantStyles[variant].active : variantStyles[variant].inactive
            )}
          >
            {isSelected && <Check className="h-3.5 w-3.5" />}
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
