import { ReactNode } from 'react';
import { Bell, ChevronRight, Sparkles } from 'lucide-react';
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
    primary: 'from-[hsl(230,85%,55%)] via-[hsl(260,85%,55%)] to-[hsl(270,85%,60%)]',
    purple: 'from-[hsl(270,85%,55%)] via-[hsl(300,75%,50%)] to-[hsl(330,85%,55%)]',
    maroon: 'from-[hsl(330,70%,45%)] via-[hsl(350,70%,45%)] to-[hsl(15,80%,50%)]',
    green: 'from-[hsl(155,75%,40%)] via-[hsl(170,75%,40%)] to-[hsl(185,80%,42%)]',
    orange: 'from-[hsl(35,95%,50%)] via-[hsl(25,95%,52%)] to-[hsl(15,90%,55%)]',
  };

  const shadowStyles = {
    primary: 'shadow-[0_20px_50px_-12px_hsl(230,85%,55%/0.4)]',
    purple: 'shadow-[0_20px_50px_-12px_hsl(270,85%,60%/0.4)]',
    maroon: 'shadow-[0_20px_50px_-12px_hsl(330,70%,45%/0.4)]',
    green: 'shadow-[0_20px_50px_-12px_hsl(155,75%,40%/0.4)]',
    orange: 'shadow-[0_20px_50px_-12px_hsl(35,95%,50%/0.4)]',
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
      'relative overflow-hidden rounded-3xl p-6 md:p-8 text-white',
      'bg-gradient-to-br',
      variantStyles[variant],
      shadowStyles[variant]
    )}>
      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-32 translate-x-32 blur-3xl" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/10 rounded-full translate-y-24 -translate-x-24 blur-2xl" />
      <div className="absolute top-1/2 right-1/4 w-32 h-32 bg-white/5 rounded-full blur-2xl animate-float" />
      
      {/* Sparkle decorations */}
      <Sparkles className="absolute top-4 right-4 h-6 w-6 text-white/20 animate-pulse-slow" />
      <Sparkles className="absolute bottom-8 right-16 h-4 w-4 text-white/15 animate-bounce-gentle" />
      
      <div className="relative flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16 md:h-20 md:w-20 border-3 border-white/30 shadow-xl ring-4 ring-white/10">
            <AvatarImage src={avatarUrl || undefined} alt={name} />
            <AvatarFallback className="bg-white/20 text-white font-bold text-xl backdrop-blur-sm">
              {getInitials(name)}
            </AvatarFallback>
          </Avatar>
          
          <div className="min-w-0">
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-display font-bold truncate drop-shadow-sm">
              Welcome, {name.split(' ')[0]}! {emoji}
            </h1>
            <div className="flex items-center gap-2 mt-2">
              <Badge 
                variant="secondary" 
                className="bg-white/20 text-white border-none font-semibold text-xs backdrop-blur-sm shadow-sm"
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
            <button className="relative p-3 rounded-2xl bg-white/15 hover:bg-white/25 transition-all duration-300 backdrop-blur-sm hover:scale-105 active:scale-95">
              <Bell className="h-5 w-5 md:h-6 md:w-6" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 h-6 w-6 flex items-center justify-center bg-gradient-to-br from-pink-500 to-coral text-white text-xs font-bold rounded-full shadow-lg animate-bounce-gentle">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-0 border-border/50 shadow-xl" align="end">
            <div className="p-4 border-b border-border/50 bg-gradient-to-r from-primary/5 to-purple/5">
              <h4 className="font-bold text-sm flex items-center gap-2">
                <Bell className="h-4 w-4 text-primary" />
                Notifications
              </h4>
            </div>
            <div className="max-h-80 overflow-auto">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-sm text-muted-foreground">
                  <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-3">
                    <Bell className="h-8 w-8 opacity-40" />
                  </div>
                  <p className="font-medium">No notifications yet</p>
                  <p className="text-xs mt-1 opacity-60">We'll notify you when something happens</p>
                </div>
              ) : (
                notifications.slice(0, 5).map((notification) => (
                  <div
                    key={notification.id}
                    className={cn(
                      'p-4 border-b border-border/30 last:border-0 cursor-pointer hover:bg-muted/50 transition-all duration-200',
                      !notification.is_read && 'bg-gradient-to-r from-primary/5 to-transparent'
                    )}
                    onClick={() => markAsRead(notification.id)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium line-clamp-2">{notification.title}</p>
                      {!notification.is_read && (
                        <span className="h-2.5 w-2.5 rounded-full bg-gradient-to-br from-primary to-purple flex-shrink-0 mt-1.5 animate-pulse" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1.5">
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
        <div className="relative mt-5">
          {children}
        </div>
      )}
    </div>
  );
}
