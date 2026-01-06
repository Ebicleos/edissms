import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Settings, Save, Bell, Shield, CreditCard, Globe, Loader2 } from 'lucide-react';

export default function SystemSettings() {
  const [isSaving, setIsSaving] = useState(false);
  
  // Platform settings
  const [platformName, setPlatformName] = useState('EduManage');
  const [supportEmail, setSupportEmail] = useState('support@edumanage.com');
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [newRegistrations, setNewRegistrations] = useState(true);
  
  // Pricing settings
  const [termlyPrice, setTermlyPrice] = useState('50000');
  const [yearlyPrice, setYearlyPrice] = useState('120000');
  const [trialDays, setTrialDays] = useState('14');
  
  // Notification settings
  const [systemAnnouncement, setSystemAnnouncement] = useState('');

  const handleSave = async () => {
    setIsSaving(true);
    // Simulate save
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsSaving(false);
    toast.success('System settings saved successfully!');
  };

  return (
    <MainLayout title="System Settings" subtitle="Configure platform-wide settings">
      <div className="max-w-4xl space-y-6 animate-fade-in">
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
