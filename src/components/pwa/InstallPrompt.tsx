import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import { Download, X } from 'lucide-react';

export function InstallPrompt() {
  const { isInstallable, isInstalled, promptInstall } = usePWAInstall();
  const [dismissed, setDismissed] = useState(false);
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Check if user has previously dismissed
    const wasDismissed = localStorage.getItem('pwa-install-dismissed');
    if (wasDismissed) {
      const dismissedAt = new Date(wasDismissed);
      const hoursSinceDismissed = (Date.now() - dismissedAt.getTime()) / (1000 * 60 * 60);
      // Show again after 24 hours
      if (hoursSinceDismissed < 24) {
        setDismissed(true);
      }
    }
    
    // Delay showing the prompt
    const timer = setTimeout(() => {
      setShow(true);
    }, 3000);
    
    return () => clearTimeout(timer);
  }, []);

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem('pwa-install-dismissed', new Date().toISOString());
  };

  const handleInstall = async () => {
    const success = await promptInstall();
    if (success) {
      setDismissed(true);
    }
  };

  if (!show || !isInstallable || isInstalled || dismissed) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:w-80 animate-slide-up">
      <div className="bg-card border rounded-lg shadow-lg p-4">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center flex-shrink-0">
            <Download className="h-5 w-5 text-primary-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm">Install EDISSMS</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Add to home screen for quick access
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 -mt-1 -mr-1"
            onClick={handleDismiss}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex gap-2 mt-3">
          <Button variant="outline" size="sm" className="flex-1" onClick={handleDismiss}>
            Not now
          </Button>
          <Button size="sm" className="flex-1" onClick={handleInstall}>
            Install
          </Button>
        </div>
      </div>
    </div>
  );
}
