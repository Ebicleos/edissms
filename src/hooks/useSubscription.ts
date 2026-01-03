import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

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

interface SubscriptionState {
  subscription: Subscription | null;
  isLoading: boolean;
  isActive: boolean;
  isTrial: boolean;
  isExpired: boolean;
  isExpiringSoon: boolean;
  daysUntilExpiry: number;
}

export function useSubscription() {
  const { user, role } = useAuth();
  const [state, setState] = useState<SubscriptionState>({
    subscription: null,
    isLoading: true,
    isActive: false,
    isTrial: false,
    isExpired: false,
    isExpiringSoon: false,
    daysUntilExpiry: 0,
  });

  useEffect(() => {
    if (!user) {
      setState(prev => ({ ...prev, isLoading: false }));
      return;
    }

    // Superadmins don't need subscriptions
    if (role === 'superadmin') {
      setState({
        subscription: null,
        isLoading: false,
        isActive: true,
        isTrial: false,
        isExpired: false,
        isExpiringSoon: false,
        daysUntilExpiry: Infinity,
      });
      return;
    }

    const fetchSubscription = async () => {
      try {
        // Get user's school_id from profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('school_id')
          .eq('id', user.id)
          .maybeSingle();

        if (!profile?.school_id) {
          setState(prev => ({ ...prev, isLoading: false }));
          return;
        }

        // Get subscription for the school
        const { data: subscription } = await supabase
          .from('subscriptions')
          .select('*')
          .eq('school_id', profile.school_id)
          .order('created_at', { ascending: false })
          .maybeSingle();

        if (!subscription) {
          setState(prev => ({ ...prev, isLoading: false }));
          return;
        }

        const endDate = new Date(subscription.end_date);
        const now = new Date();
        const daysUntilExpiry = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

        setState({
          subscription,
          isLoading: false,
          isActive: subscription.status === 'active' && daysUntilExpiry > 0,
          isTrial: subscription.status === 'trial',
          isExpired: subscription.status === 'expired' || daysUntilExpiry <= 0,
          isExpiringSoon: daysUntilExpiry > 0 && daysUntilExpiry <= 7,
          daysUntilExpiry: Math.max(0, daysUntilExpiry),
        });
      } catch (error) {
        console.error('Failed to fetch subscription:', error);
        setState(prev => ({ ...prev, isLoading: false }));
      }
    };

    fetchSubscription();
  }, [user, role]);

  return state;
}
