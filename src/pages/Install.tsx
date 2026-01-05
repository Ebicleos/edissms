import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import { Download, CheckCircle, Share, Plus, Smartphone, Monitor, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

export default function Install() {
  const { isInstallable, isInstalled, isIOS, promptInstall } = usePWAInstall();
  const navigate = useNavigate();

  const handleInstall = async () => {
    const success = await promptInstall();
    if (success) {
      toast.success('App installed successfully!');
    }
  };

  if (isInstalled) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-primary/10 to-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl">Already Installed!</CardTitle>
            <CardDescription>
              EDISSMS is already installed on your device. You can access it from your home screen.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate('/auth')} className="w-full">
              Open App <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/10 to-background flex flex-col">
      {/* Hero Section */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-lg space-y-6">
          {/* App Icon & Title */}
          <div className="text-center space-y-4">
            <div className="mx-auto h-24 w-24 rounded-2xl bg-primary shadow-lg flex items-center justify-center overflow-hidden">
              <img 
                src="/pwa-icon-512.png" 
                alt="EDISSMS" 
                className="h-full w-full object-cover"
              />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">EDISSMS</h1>
              <p className="text-muted-foreground mt-1">School Management System</p>
            </div>
          </div>

          {/* Install Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2">
                <Smartphone className="h-5 w-5" />
                Install App
              </CardTitle>
              <CardDescription>
                Install EDISSMS on your device for quick access and offline capabilities.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {isInstallable && !isIOS && (
                <Button onClick={handleInstall} className="w-full" size="lg">
                  <Download className="mr-2 h-5 w-5" />
                  Install Now
                </Button>
              )}

              {isIOS && (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    To install on iOS:
                  </p>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-semibold text-primary">1</span>
                      </div>
                      <div>
                        <p className="font-medium text-sm">Tap Share</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                          Tap the <Share className="h-3 w-3" /> share button in Safari
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-semibold text-primary">2</span>
                      </div>
                      <div>
                        <p className="font-medium text-sm">Add to Home Screen</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                          Scroll and tap <Plus className="h-3 w-3" /> "Add to Home Screen"
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-semibold text-primary">3</span>
                      </div>
                      <div>
                        <p className="font-medium text-sm">Confirm</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Tap "Add" to complete installation
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {!isInstallable && !isIOS && (
                <div className="text-center py-4">
                  <Monitor className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                  <p className="text-sm text-muted-foreground">
                    Open this page on your mobile device to install the app, or look for the install button in your browser's address bar.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Features */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-4 rounded-lg bg-card border text-center">
              <div className="h-10 w-10 mx-auto rounded-full bg-primary/10 flex items-center justify-center mb-2">
                <Smartphone className="h-5 w-5 text-primary" />
              </div>
              <p className="text-sm font-medium">Works Offline</p>
            </div>
            <div className="p-4 rounded-lg bg-card border text-center">
              <div className="h-10 w-10 mx-auto rounded-full bg-primary/10 flex items-center justify-center mb-2">
                <Download className="h-5 w-5 text-primary" />
              </div>
              <p className="text-sm font-medium">Fast Loading</p>
            </div>
          </div>

          {/* Continue to App */}
          <Button 
            variant="outline" 
            onClick={() => navigate('/auth')} 
            className="w-full"
          >
            Continue in Browser
          </Button>
        </div>
      </div>
    </div>
  );
}
