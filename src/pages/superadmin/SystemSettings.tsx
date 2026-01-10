import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Save, Bell, Shield, CreditCard, Globe, Loader2, Database, Users } from 'lucide-react';
import { usePlatformSettings } from '@/hooks/usePlatformSettings';

interface PlatformStats {
  totalSchools: number;
  totalUsers: number;
  activeSubscriptions: number;
  trialSubscriptions: number;
}

export default function SystemSettings() {
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<PlatformStats>({
    totalSchools: 0,
    totalUsers: 0,
    activeSubscriptions: 0,
    trialSubscriptions: 0,
  });
  
  const { settings, updateMaintenanceMode, updateSystemAnnouncement, updatePlatformConfig, updatePricing } = usePlatformSettings();
  
  // Local form state initialized from settings
  const [platformName, setPlatformName] = useState(settings.platformConfig.name);
  const [supportEmail, setSupportEmail] = useState(settings.platformConfig.support_email);
  const [maintenanceMode, setMaintenanceMode] = useState(settings.maintenanceMode.enabled);
  const [maintenanceMessage, setMaintenanceMessage] = useState(settings.maintenanceMode.message);
  const [newRegistrations, setNewRegistrations] = useState(settings.platformConfig.allow_registrations);
  const [termlyPrice, setTermlyPrice] = useState(String(settings.pricing.termly));
  const [yearlyPrice, setYearlyPrice] = useState(String(settings.pricing.yearly));
  const [trialDays, setTrialDays] = useState(String(settings.pricing.trial_days));
  const [systemAnnouncement, setSystemAnnouncement] = useState(settings.systemAnnouncement.message);

  // Sync form state when settings load
  useEffect(() => {
    setPlatformName(settings.platformConfig.name);
    setSupportEmail(settings.platformConfig.support_email);
    setMaintenanceMode(settings.maintenanceMode.enabled);
    setMaintenanceMessage(settings.maintenanceMode.message);
    setNewRegistrations(settings.platformConfig.allow_registrations);
    setTermlyPrice(String(settings.pricing.termly));
    setYearlyPrice(String(settings.pricing.yearly));
    setTrialDays(String(settings.pricing.trial_days));
    setSystemAnnouncement(settings.systemAnnouncement.message);
  }, [settings]);

  useEffect(() => {
    fetchPlatformStats();

    // Set up realtime subscriptions for live updates
    const channel = supabase
      .channel('system-settings-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'schools' }, () => fetchPlatformStats())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => fetchPlatformStats())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'subscriptions' }, () => fetchPlatformStats())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchPlatformStats = async () => {
    try {
      const [schoolsResult, usersResult, subsResult] = await Promise.all([
        supabase.from('schools').select('id', { count: 'exact', head: true }),
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('subscriptions').select('status'),
      ]);

      const activeCount = subsResult.data?.filter(s => s.status === 'active').length || 0;
      const trialCount = subsResult.data?.filter(s => s.status === 'trial').length || 0;

      setStats({
        totalSchools: schoolsResult.count || 0,
        totalUsers: usersResult.count || 0,
        activeSubscriptions: activeCount,
        trialSubscriptions: trialCount,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await Promise.all([
        updateMaintenanceMode({ enabled: maintenanceMode, message: maintenanceMessage }),
        updateSystemAnnouncement({ message: systemAnnouncement, type: 'info' }),
        updatePlatformConfig({ name: platformName, support_email: supportEmail, allow_registrations: newRegistrations }),
        updatePricing({ termly: Number(termlyPrice), yearly: Number(yearlyPrice), trial_days: Number(trialDays) }),
      ]);
      toast.success('System settings saved successfully!');
    } catch (error) {
      toast.error('Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <MainLayout title="System Settings" subtitle="Configure platform-wide settings (live updates enabled)">
      <div className="max-w-4xl space-y-6 animate-fade-in">
        {/* Platform Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Database className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.totalSchools}</p>
                  <p className="text-xs text-muted-foreground">Schools</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-info/10">
                  <Users className="h-5 w-5 text-info" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.totalUsers}</p>
                  <p className="text-xs text-muted-foreground">Users</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-success/10">
                  <CreditCard className="h-5 w-5 text-success" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.activeSubscriptions}</p>
                  <p className="text-xs text-muted-foreground">Active Subs</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-warning/10">
                  <Shield className="h-5 w-5 text-warning" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.trialSubscriptions}</p>
                  <p className="text-xs text-muted-foreground">Trial Subs</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Platform Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Platform Settings
            </CardTitle>
            <CardDescription>
              General platform configuration
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="platformName">Platform Name</Label>
                <Input
                  id="platformName"
                  value={platformName}
                  onChange={(e) => setPlatformName(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="supportEmail">Support Email</Label>
                <Input
                  id="supportEmail"
                  type="email"
                  value={supportEmail}
                  onChange={(e) => setSupportEmail(e.target.value)}
                />
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                <div>
                  <p className="font-medium">Maintenance Mode</p>
                  <p className="text-sm text-muted-foreground">
                    Temporarily disable access for all users
                  </p>
                </div>
                <Switch
                  checked={maintenanceMode}
                  onCheckedChange={setMaintenanceMode}
                />
              </div>
              {maintenanceMode && (
                <div className="pl-4">
                  <Label htmlFor="maintenanceMessage">Maintenance Message</Label>
                  <Input
                    id="maintenanceMessage"
                    value={maintenanceMessage}
                    onChange={(e) => setMaintenanceMessage(e.target.value)}
                    placeholder="System is under maintenance..."
                  />
                </div>
              )}
              <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                <div>
                  <p className="font-medium">Allow New Registrations</p>
                  <p className="text-sm text-muted-foreground">
                    Enable schools to register on the platform
                  </p>
                </div>
                <Switch
                  checked={newRegistrations}
                  onCheckedChange={setNewRegistrations}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pricing Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Subscription Pricing
            </CardTitle>
            <CardDescription>
              Configure subscription plans and pricing
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="termlyPrice">Termly Price (₦)</Label>
                <Input
                  id="termlyPrice"
                  type="number"
                  value={termlyPrice}
                  onChange={(e) => setTermlyPrice(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="yearlyPrice">Yearly Price (₦)</Label>
                <Input
                  id="yearlyPrice"
                  type="number"
                  value={yearlyPrice}
                  onChange={(e) => setYearlyPrice(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="trialDays">Trial Period (Days)</Label>
                <Input
                  id="trialDays"
                  type="number"
                  value={trialDays}
                  onChange={(e) => setTrialDays(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* System Announcement */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              System Announcement
            </CardTitle>
            <CardDescription>
              Display a message to all users on the platform
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="announcement">Announcement Message</Label>
              <Textarea
                id="announcement"
                placeholder="Enter a system-wide announcement..."
                value={systemAnnouncement}
                onChange={(e) => setSystemAnnouncement(e.target.value)}
                rows={3}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Leave empty to hide the announcement banner
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button
            className="bg-gradient-primary hover:opacity-90"
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Save Settings
          </Button>
        </div>
      </div>
    </MainLayout>
  );
}
