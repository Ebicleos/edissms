import { Bell, Search, Menu } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { useNotifications } from '@/hooks/useNotifications';
import { formatDistanceToNow } from 'date-fns';

interface HeaderProps {
  title: string;
  subtitle?: string;
  onMobileMenuToggle?: () => void;
}

export function Header({ title, subtitle, onMobileMenuToggle }: HeaderProps) {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();

  return (
    <header 
      className={cn(
        "sticky top-0 z-30",
        "flex items-center justify-between",
        "border-b border-border/50 bg-background/80 backdrop-blur-xl",
        "supports-[backdrop-filter]:bg-background/70",
        "px-4 sm:px-5 md:px-6 py-3 sm:py-3.5 md:py-4",
        "min-h-[60px] md:min-h-[68px]",
        "shadow-sm"
      )}
    >
      <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
        {/* Mobile Menu Button */}
        <Button 
          variant="ghost" 
          size="icon" 
          className="md:hidden h-10 w-10 flex-shrink-0 touch-manipulation rounded-xl hover:bg-muted/80" 
          onClick={onMobileMenuToggle}
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </Button>
        
        <div className="min-w-0 flex-1">
          <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-foreground truncate tracking-tight">
            {title}
          </h1>
          {subtitle && (
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 truncate hidden sm:block font-medium">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-2.5 md:gap-4 flex-shrink-0">
        {/* Search - Hidden on mobile, shown on tablet+ */}
        <div className="relative hidden lg:block">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search students, teachers..."
            className="w-52 xl:w-72 pl-10 bg-muted/40 border-border/50 focus-visible:ring-1 focus-visible:ring-primary/30 rounded-xl h-10"
          />
        </div>

        {/* Mobile Search Button */}
        <Button 
          variant="ghost" 
          size="icon" 
          className="lg:hidden h-10 w-10 touch-manipulation rounded-xl hover:bg-muted/80"
          aria-label="Search"
        >
          <Search className="h-5 w-5" />
        </Button>

        {/* Notifications */}
        <Popover>
          <PopoverTrigger asChild>
            <Button 
              variant="ghost" 
              size="icon" 
              className="relative h-10 w-10 touch-manipulation rounded-xl hover:bg-muted/80"
              aria-label="Notifications"
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <Badge className="absolute -top-0.5 -right-0.5 h-5 w-5 flex items-center justify-center p-0 text-[10px] bg-destructive border-2 border-background">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 sm:w-96 p-0 rounded-2xl shadow-xl border-border/50" align="end">
            <div className="flex items-center justify-between p-4 border-b border-border/50 bg-muted/30">
              <h4 className="font-semibold text-base">Notifications</h4>
              {unreadCount > 0 && (
                <Button variant="ghost" size="sm" onClick={markAllAsRead} className="text-xs font-medium text-primary hover:text-primary">
                  Mark all read
                </Button>
              )}
            </div>
            <ScrollArea className="h-[320px]">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  <div className="h-14 w-14 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-3">
                    <Bell className="h-7 w-7 opacity-40" />
                  </div>
                  <p className="text-sm font-medium">No notifications yet</p>
                  <p className="text-xs text-muted-foreground mt-1">We'll notify you when something arrives</p>
                </div>
              ) : (
                <div className="divide-y divide-border/30">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={cn(
                        "p-4 hover:bg-muted/40 cursor-pointer transition-colors duration-200",
                        !notification.is_read && "bg-primary/5"
                      )}
                      onClick={() => markAsRead(notification.id)}
                    >
                      <div className="flex items-start gap-3">
                        <div className={cn(
                          "h-2 w-2 rounded-full mt-2 flex-shrink-0",
                          !notification.is_read ? "bg-primary" : "bg-transparent"
                        )} />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm">{notification.title}</p>
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                            {notification.content}
                          </p>
                          <p className="text-xs text-muted-foreground/70 mt-2">
                            {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </PopoverContent>
        </Popover>
      </div>
    </header>
  );
}
