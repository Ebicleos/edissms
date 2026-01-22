import { cn } from '@/lib/utils';
import { Clock, MapPin, User } from 'lucide-react';
import { format, parseISO } from 'date-fns';

interface ScheduleItem {
  id: string;
  title: string;
  subject?: string;
  time?: string | null;
  duration?: string;
  location?: string | null;
  teacher?: string;
  className?: string;
  type?: 'class' | 'event' | 'exam';
}

interface ScheduleCarouselProps {
  items: ScheduleItem[];
  title?: string;
  onViewAll?: () => void;
  emptyMessage?: string;
}

export function ScheduleCarousel({ 
  items, 
  title = 'Upcoming Schedule', 
  onViewAll,
  emptyMessage = 'No upcoming items'
}: ScheduleCarouselProps) {
  const colorVariants = [
    'from-blue-500/90 to-blue-600',
    'from-purple-500/90 to-purple-600',
    'from-emerald-500/90 to-emerald-600',
    'from-orange-500/90 to-orange-600',
    'from-pink-500/90 to-pink-600',
    'from-cyan-500/90 to-cyan-600',
  ];

  const formatTime = (timeStr?: string | null) => {
    if (!timeStr) return null;
    try {
      // Handle ISO string
      if (timeStr.includes('T')) {
        return format(parseISO(timeStr), 'h:mm a');
      }
      // Handle time string like "14:30"
      const [hours, minutes] = timeStr.split(':');
      const date = new Date();
      date.setHours(parseInt(hours), parseInt(minutes));
      return format(date, 'h:mm a');
    } catch {
      return timeStr;
    }
  };

  if (items.length === 0) {
    return (
      <div className="content-card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="section-heading">{title}</h3>
        </div>
        <div className="flex items-center justify-center py-8 text-muted-foreground">
          <Clock className="h-5 w-5 mr-2 opacity-50" />
          <span className="text-sm">{emptyMessage}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="content-card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="section-heading">{title}</h3>
        {onViewAll && (
          <button 
            onClick={onViewAll}
            className="text-sm font-medium text-primary hover:text-primary/80 transition-colors"
          >
            See All →
          </button>
        )}
      </div>
      
      <div className="flex gap-3 overflow-x-auto pb-2 -mx-2 px-2 no-scrollbar snap-x snap-mandatory">
        {items.slice(0, 6).map((item, index) => {
          const colorVariant = colorVariants[index % colorVariants.length];
          const formattedTime = formatTime(item.time);
          
          return (
            <div
              key={item.id}
              className={cn(
                'flex-shrink-0 w-36 md:w-44 rounded-2xl p-4 text-white snap-start',
                'bg-gradient-to-br shadow-md',
                colorVariant
              )}
            >
              {/* Time Badge */}
              {formattedTime && (
                <div className="inline-flex items-center gap-1 px-2 py-1 bg-white/20 rounded-full text-xs font-medium mb-3">
                  <Clock className="h-3 w-3" />
                  {formattedTime}
                </div>
              )}
              
              {/* Subject/Title */}
              <h4 className="font-bold text-sm md:text-base line-clamp-2 mb-1">
                {item.subject || item.title}
              </h4>
              
              {/* Class Name */}
              {item.className && (
                <p className="text-white/80 text-xs font-medium mb-2">
                  {item.className}
                </p>
              )}
              
              {/* Teacher */}
              {item.teacher && (
                <div className="flex items-center gap-1 text-white/70 text-xs mt-2">
                  <User className="h-3 w-3" />
                  <span className="truncate">{item.teacher}</span>
                </div>
              )}
              
              {/* Location */}
              {item.location && (
                <div className="flex items-center gap-1 text-white/70 text-xs mt-1">
                  <MapPin className="h-3 w-3" />
                  <span className="truncate">{item.location}</span>
                </div>
              )}
              
              {/* Duration */}
              {item.duration && (
                <div className="mt-2 text-xs text-white/60">
                  {item.duration}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
