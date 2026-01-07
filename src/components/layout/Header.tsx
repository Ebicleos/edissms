import { Bell, Search, Menu } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface HeaderProps {
  title: string;
  subtitle?: string;
  onMobileMenuToggle?: () => void;
}

export function Header({ title, subtitle, onMobileMenuToggle }: HeaderProps) {
  return (
    <header 
      className={cn(
        "sticky top-0 z-30",
        "flex items-center justify-between",
        "border-b border-border bg-background/95 backdrop-blur-md",
        "supports-[backdrop-filter]:bg-background/80",
        "px-3 sm:px-4 md:px-6 py-2.5 sm:py-3 md:py-4",
        "min-h-[56px] md:min-h-[64px]"
      )}
    >
      <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
        {/* Mobile Menu Button */}
        <Button 
          variant="ghost" 
          size="icon" 
          className="md:hidden h-10 w-10 flex-shrink-0 touch-manipulation" 
          onClick={onMobileMenuToggle}
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </Button>
        
        <div className="min-w-0 flex-1">
          <h1 className="text-base sm:text-lg md:text-2xl font-bold text-foreground truncate">
            {title}
          </h1>
          {subtitle && (
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 truncate hidden sm:block">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1.5 sm:gap-2 md:gap-4 flex-shrink-0">
        {/* Search - Hidden on mobile, shown on tablet+ */}
        <div className="relative hidden lg:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search students, teachers..."
            className="w-48 xl:w-64 pl-10 bg-muted/50 border-0 focus-visible:ring-1"
          />
        </div>

        {/* Mobile Search Button */}
        <Button 
          variant="ghost" 
          size="icon" 
          className="lg:hidden h-10 w-10 touch-manipulation"
          aria-label="Search"
        >
          <Search className="h-5 w-5" />
        </Button>

        {/* Notifications */}
        <Button 
          variant="ghost" 
          size="icon" 
          className="relative h-10 w-10 touch-manipulation"
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5" />
          <Badge className="absolute -top-0.5 -right-0.5 h-4 w-4 sm:h-5 sm:w-5 flex items-center justify-center p-0 text-[10px] sm:text-xs bg-destructive">
            3
          </Badge>
        </Button>
      </div>
    </header>
  );
}

