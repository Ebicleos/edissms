import { useSubscription } from '@/hooks/useSubscription';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Clock, CreditCard, X, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export function SubscriptionBanner() {
  const navigate = useNavigate();
  const { isLoading, isTrial, isExpiringSoon, isExpired, daysUntilExpiry } = useSubscription();
  const [isDismissed, setIsDismissed] = useState(false);

  if (isLoading || isDismissed) return null;

  // No banner needed for active, non-expiring subscriptions
  if (!isTrial && !isExpiringSoon && !isExpired) return null;

  const handleSubscribe = () => {
    navigate('/admin/subscription');
  };

  if (isExpired) {
    return (
      <Alert variant="destructive" className="rounded-none border-x-0 border-t-0">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Subscription Expired</AlertTitle>
        <AlertDescription className="flex items-center justify-between">
          <span>Your subscription has expired. Please renew to continue using all features.</span>
          <Button size="sm" variant="outline" className="ml-4" onClick={handleSubscribe}>
            <CreditCard className="mr-2 h-4 w-4" />
            Renew Now
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  if (isExpiringSoon) {
    return (
      <Alert className="rounded-none border-x-0 border-t-0 bg-orange-500/10 border-orange-500/20 text-orange-700 dark:text-orange-400">
        <Clock className="h-4 w-4" />
        <AlertTitle>Subscription Expiring Soon</AlertTitle>
        <AlertDescription className="flex items-center justify-between">
          <span>Your subscription expires in {daysUntilExpiry} day{daysUntilExpiry !== 1 ? 's' : ''}. Renew now to avoid interruption.</span>
          <div className="flex items-center gap-2 ml-4">
            <Button size="sm" variant="outline" className="border-orange-500/50 hover:bg-orange-500/10" onClick={handleSubscribe}>
              <CreditCard className="mr-2 h-4 w-4" />
              Renew Now
            </Button>
            <Button size="icon" variant="ghost" onClick={() => setIsDismissed(true)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  if (isTrial) {
    return (
      <Alert className="rounded-none border-x-0 border-t-0 bg-purple-500/10 border-purple-500/20 text-purple-700 dark:text-purple-400">
        <Clock className="h-4 w-4" />
        <AlertTitle>Trial Period</AlertTitle>
        <AlertDescription className="flex items-center justify-between">
          <span>You have {daysUntilExpiry} day{daysUntilExpiry !== 1 ? 's' : ''} left in your trial. Subscribe to continue after the trial ends.</span>
          <div className="flex items-center gap-2 ml-4">
            <Button size="sm" variant="outline" className="border-purple-500/50 hover:bg-purple-500/10" onClick={handleSubscribe}>
              <CreditCard className="mr-2 h-4 w-4" />
              Subscribe Now
            </Button>
            <Button size="icon" variant="ghost" onClick={() => setIsDismissed(true)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  return null;
}
