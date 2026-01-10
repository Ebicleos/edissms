import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Json } from '@/integrations/supabase/types';

interface MaintenanceMode {
  enabled: boolean;
  message: string;
}

interface SystemAnnouncement {
  message: string;
  type: 'info' | 'warning' | 'error';
}

interface PlatformConfig {
  name: string;
  support_email: string;
  allow_registrations: boolean;
}

interface Pricing {
  termly: number;
  yearly: number;
  trial_days: number;
}

interface PlatformSettings {
  maintenanceMode: MaintenanceMode;
  systemAnnouncement: SystemAnnouncement;
  platformConfig: PlatformConfig;
  pricing: Pricing;
}

const defaultSettings: PlatformSettings = {
  maintenanceMode: { enabled: false, message: '' },
  systemAnnouncement: { message: '', type: 'info' },
  platformConfig: { name: 'EduManage', support_email: 'support@edumanage.com', allow_registrations: true },
  pricing: { termly: 50000, yearly: 120000, trial_days: 30 },
};

export function usePlatformSettings() {
  const [settings, setSettings] = useState<PlatformSettings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchSettings();

    // Subscribe to realtime updates
    const channel = supabase
      .channel('platform-settings-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'platform_settings' }, () => {
        fetchSettings();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchSettings = async () => {
    const { data, error } = await supabase
      .from('platform_settings')
      .select('key, value');

    if (error) {
      console.error('Error fetching platform settings:', error);
      setIsLoading(false);
      return;
    }

    const newSettings = { ...defaultSettings };
    
    data?.forEach((row) => {
      const value = row.value as Record<string, unknown>;
      switch (row.key) {
        case 'maintenance_mode':
          newSettings.maintenanceMode = value as unknown as MaintenanceMode;
          break;
        case 'system_announcement':
          newSettings.systemAnnouncement = value as unknown as SystemAnnouncement;
          break;
        case 'platform_config':
          newSettings.platformConfig = value as unknown as PlatformConfig;
          break;
        case 'pricing':
          newSettings.pricing = value as unknown as Pricing;
          break;
      }
    });

    setSettings(newSettings);
    setIsLoading(false);
  };

  const updateSetting = async (key: string, value: MaintenanceMode | SystemAnnouncement | PlatformConfig | Pricing) => {
    const { error } = await supabase
      .from('platform_settings')
      .update({ value: value as unknown as Json })
      .eq('key', key);

    if (error) {
      console.error('Error updating setting:', error);
      throw error;
    }

    await fetchSettings();
  };

  return {
    settings,
    isLoading,
    updateMaintenanceMode: (value: MaintenanceMode) => updateSetting('maintenance_mode', value),
    updateSystemAnnouncement: (value: SystemAnnouncement) => updateSetting('system_announcement', value),
    updatePlatformConfig: (value: PlatformConfig) => updateSetting('platform_config', value),
    updatePricing: (value: Pricing) => updateSetting('pricing', value),
    refetch: fetchSettings,
  };
}
