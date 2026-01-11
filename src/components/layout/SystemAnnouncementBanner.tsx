import { useState, useEffect } from 'react';
import { AlertTriangle, Info, X, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface SystemAnnouncement {
  message: string;
  type: 'info' | 'warning' | 'error';
}

interface MaintenanceMode {
  enabled: boolean;
  message: string;
}

export function SystemAnnouncementBanner() {
  const [announcement, setAnnouncement] = useState<SystemAnnouncement | null>(null);
  const [maintenance, setMaintenance] = useState<MaintenanceMode | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    fetchSettings();

    // Subscribe to realtime updates
    const channel = supabase
      .channel('system-announcement-banner')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'platform_settings' }, () => {
        fetchSettings();
        setDismissed(false); // Show new announcements
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchSettings = async () => {
    const { data } = await supabase
      .from('platform_settings')
      .select('key, value')
      .in('key', ['maintenance_mode', 'system_announcement']);

    data?.forEach((row) => {
      const value = row.value as Record<string, unknown>;
      if (row.key === 'maintenance_mode') {
        setMaintenance(value as unknown as MaintenanceMode);
      } else if (row.key === 'system_announcement') {
        setAnnouncement(value as unknown as SystemAnnouncement);
      }
    });
  };

  // Show maintenance mode banner (cannot be dismissed)
  if (maintenance?.enabled) {
    const maintenanceMessage = maintenance.message || 'System is currently under maintenance. Please check back later.';
    return (
      <div className="bg-destructive text-destructive-foreground px-4 py-3 flex items-center justify-center gap-3">
        <AlertTriangle className="h-5 w-5 flex-shrink-0" />
        <p className="text-sm font-medium text-center">{maintenanceMessage}</p>
      </div>
    );
  }

  // Show system announcement (can be dismissed)
  if (announcement?.message && !dismissed) {
    const Icon = announcement.type === 'error' ? AlertCircle : announcement.type === 'warning' ? AlertTriangle : Info;
    
    return (
      <div 
        className={cn(
          "px-4 py-3 flex items-center justify-between gap-3",
          announcement.type === 'error' && "bg-destructive text-destructive-foreground",
          announcement.type === 'warning' && "bg-warning text-warning-foreground",
          announcement.type === 'info' && "bg-info text-info-foreground"
        )}
      >
        <div className="flex items-center gap-3 flex-1 justify-center">
          <Icon className="h-5 w-5 flex-shrink-0" />
          <p className="text-sm font-medium">{announcement.message}</p>
        </div>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-6 w-6 flex-shrink-0 hover:bg-white/20"
          onClick={() => setDismissed(true)}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return null;
}
