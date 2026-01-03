import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { 
  CreditCard, 
  Loader2, 
  CheckCircle, 
  Clock, 
  AlertTriangle,
  Calendar,
  Building2
} from 'lucide-react';
import { format } from 'date-fns';

interface Subscription {
  id: string;
  school_id: string;
  plan_type: string;
  status: string;
  start_date: string;
  end_date: string;
  amount: number;
  max_students: number;
  max_teachers: number;
}

const PLAN_PRICES = {
  termly: 50000,
  yearly: 120000,
};

export default function SubscriptionPayment() {
  const { profile } = useAuth();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<'termly' | 'yearly'>('termly');

  useEffect(() => {
    if (profile?.school_id) {
      fetchSubscription();
    }
  }, [profile?.school_id]);

  const fetchSubscription = async () => {
    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('school_id', profile?.school_id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      setSubscription(data);
      if (data?.plan_type) {
        setSelectedPlan(data.plan_type as 'termly' | 'yearly');
      }
    } catch (error) {
      console.error('Error fetching subscription:', error);
      toast.error('Failed to load subscription details');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePayment = async () => {
    if (!profile?.school_id) {
      toast.error('School not found');
      return;
    }

    setIsProcessing(true);
    try {
      const reference = `SUB-${profile.school_id.slice(0, 8)}-${Date.now()}`;
      const amount = PLAN_PRICES[selectedPlan];

      const { data, error } = await supabase.functions.invoke('subscription-payment', {
        body: {
          school_id: profile.school_id,
          plan_type: selectedPlan,
          amount,
          reference,
          email: profile.email,
          callback_url: `${window.location.origin}/admin/subscription`,
        },
      });

      if (error) throw error;

      if (data?.success && data?.authorization_url) {
        window.location.href = data.authorization_url;
      } else {
        throw new Error(data?.error || 'Failed to initialize payment');
      }
    } catch (error) {
      console.error('Payment error:', error);
      toast.error('Failed to initialize payment. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500"><CheckCircle className="h-3 w-3 mr-1" />Active</Badge>;
      case 'trial':
        return <Badge className="bg-purple-500"><Clock className="h-3 w-3 mr-1" />Trial</Badge>;
      case 'expired':
        return <Badge variant="destructive"><AlertTriangle className="h-3 w-3 mr-1" />Expired</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <MainLayout title="Subscription" subtitle="Manage your school subscription">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Subscription" subtitle="Manage your school subscription">
      <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
        {/* Current Subscription Status */}
        {subscription && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    Current Subscription
                  </CardTitle>
                  <CardDescription>Your current plan details</CardDescription>
                </div>
                {getStatusBadge(subscription.status)}
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Plan</p>
                  <p className="font-semibold capitalize">{subscription.plan_type}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Start Date</p>
                  <p className="font-semibold">{format(new Date(subscription.start_date), 'MMM d, yyyy')}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">End Date</p>
                  <p className="font-semibold">{format(new Date(subscription.end_date), 'MMM d, yyyy')}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Amount Paid</p>
                  <p className="font-semibold">{formatCurrency(subscription.amount)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Plan Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              {subscription?.status === 'active' ? 'Renew Subscription' : 'Subscribe Now'}
            </CardTitle>
            <CardDescription>
              Choose a plan to {subscription?.status === 'active' ? 'extend your subscription' : 'continue using EduManage'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Termly Plan */}
              <div
                className={`relative p-6 rounded-xl border-2 cursor-pointer transition-all ${
                  selectedPlan === 'termly'
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50'
                }`}
                onClick={() => setSelectedPlan('termly')}
              >
                <div className="space-y-2">
                  <h3 className="text-xl font-bold">Termly Plan</h3>
                  <p className="text-sm text-muted-foreground">4 months of access</p>
                  <p className="text-3xl font-bold text-primary">{formatCurrency(PLAN_PRICES.termly)}</p>
                  <p className="text-sm text-muted-foreground">per term</p>
                </div>
                <ul className="mt-4 space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Up to 500 students
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Up to 50 teachers
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    All features included
                  </li>
                </ul>
              </div>

              {/* Yearly Plan */}
              <div
                className={`relative p-6 rounded-xl border-2 cursor-pointer transition-all ${
                  selectedPlan === 'yearly'
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50'
                }`}
                onClick={() => setSelectedPlan('yearly')}
              >
                <Badge className="absolute -top-3 right-4 bg-green-500">Save 20%</Badge>
                <div className="space-y-2">
                  <h3 className="text-xl font-bold">Yearly Plan</h3>
                  <p className="text-sm text-muted-foreground">12 months of access</p>
                  <p className="text-3xl font-bold text-primary">{formatCurrency(PLAN_PRICES.yearly)}</p>
                  <p className="text-sm text-muted-foreground">per year</p>
                </div>
                <ul className="mt-4 space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Up to 500 students
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Up to 50 teachers
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    All features included
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Priority support
                  </li>
                </ul>
              </div>
            </div>

            <div className="flex justify-center">
              <Button
                size="lg"
                className="bg-gradient-primary hover:opacity-90 px-8"
                onClick={handlePayment}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <CreditCard className="mr-2 h-4 w-4" />
                )}
                Pay {formatCurrency(PLAN_PRICES[selectedPlan])} Now
              </Button>
            </div>

            <p className="text-center text-sm text-muted-foreground">
              Secure payment powered by Paystack. You'll be redirected to complete payment.
            </p>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
