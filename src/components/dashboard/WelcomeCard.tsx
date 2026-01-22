import { ReactNode } from 'react';
import { Bell, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useNotifications } from '@/hooks/useNotifications';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { formatDistanceToNow } from 'date-fns';

interface WelcomeCardProps {
  name: string;
  role: string;
  subtitle?: string;
  avatarUrl?: string | null;
  emoji?: string;
  variant?: 'primary' | 'purple' | 'maroon' | 'green' | 'orange';
  children?: ReactNode;
}

export function WelcomeCard({ 
  name, 
  role, 
  subtitle, 
  avatarUrl, 
  emoji = '👋',
  variant = 'primary',
  children 
}: WelcomeCardProps) {
  const { notifications, unreadCount, markAsRead } = useNotifications();

  const variantStyles = {
    primary: 'from-primary via-primary/95 to-primary/80',
    purple: 'from-[hsl(280,80%,50%)] via-[hsl(280,80%,45%)] to-[hsl(280,80%,40%)]',
    maroon: 'from-[hsl(330,70%,40%)] via-[hsl(330,65%,35%)] to-[hsl(330,60%,30%)]',
    green: 'from-accent via-accent/95 to-accent/80',
    orange: 'from-secondary via-secondary/95 to-[hsl(25,90%,45%)]',
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className={cn(
      'relative overflow-hidden rounded-2xl md:rounded-3xl p-5 md:p-8 text-white',
      'bg-gradient-to-br',
      variantStyles[variant]
    )}>
      {/* Decorative circles */}
      <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-20 translate-x-20 blur-2xl" />
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-black/10 rounded-full translate-y-16 -translate-x-16 blur-xl" />
      
      <div className="relative flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <Avatar className="h-14 w-14 md:h-16 md:w-16 border-2 border-white/30 shadow-lg">
            <AvatarImage src={avatarUrl || undefined} alt={name} />
            <AvatarFallback className="bg-white/20 text-white font-semibold text-lg">
              {getInitials(name)}
            </AvatarFallback>
          </Avatar>
          
          <div className="min-w-0">
            <h1 className="text-xl md:text-2xl lg:text-3xl font-bold truncate">
              Welcome, {name.split(' ')[0]}! {emoji}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge 
                variant="secondary" 
                className="bg-white/20 text-white border-none font-medium text-xs"
              >
                {role}
              </Badge>
              {subtitle && (
                <span className="text-white/80 text-sm truncate">{subtitle}</span>
              )}
            </div>
          </div>
        </div>
        
        {/* Notification Bell */}
        <Popover>
          <PopoverTrigger asChild>
            <button className="relative p-2 rounded-xl bg-white/15 hover:bg-white/25 transition-colors">
              <Bell className="h-5 w-5 md:h-6 md:w-6" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center bg-destructive text-destructive-foreground text-xs font-bold rounded-full">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-0" align="end">
            <div className="p-3 border-b border-border">
              <h4 className="font-semibold text-sm">Notifications</h4>
            </div>
            <div className="max-h-80 overflow-auto">
              {notifications.length === 0 ? (
                <div className="p-6 text-center text-sm text-muted-foreground">
                  <Bell className="h-8 w-8 mx-auto mb-2 opacity-40" />
                  No notifications yet
                </div>
              ) : (
                notifications.slice(0, 5).map((notification) => (
                  <div
                    key={notification.id}
                    className={cn(
                      'p-3 border-b border-border/50 last:border-0 cursor-pointer hover:bg-muted/50 transition-colors',
                      !notification.is_read && 'bg-primary/5'
                    )}
                    onClick={() => markAsRead(notification.id)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium line-clamp-2">{notification.title}</p>
                      {!notification.is_read && (
                        <span className="h-2 w-2 rounded-full bg-primary flex-shrink-0 mt-1.5" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                    </p>
                  </div>
                ))
              )}
            </div>
          </PopoverContent>
        </Popover>
      </div>
      
      {children && (
        <div className="relative mt-4">
          {children}
        </div>
      )}
    </div>
  );
}
