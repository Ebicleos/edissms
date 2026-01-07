import { useState, useEffect } from 'react';
import { TrendingUp, AlertCircle } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';

export function FeesSummary() {
  const [feesData, setFeesData] = useState({
    totalExpected: 0,
    collected: 0,
    pending: 0,
    isLoading: true,
  });

  useEffect(() => {
    async function fetchFeesData() {
      try {
        const { data, error } = await supabase
          .from('fee_payments')
          .select('amount_payable, amount_paid');

        if (error) throw error;

        let totalExpected = 0;
        let collected = 0;

        if (data) {
          data.forEach((fee) => {
            totalExpected += Number(fee.amount_payable) || 0;
            collected += Number(fee.amount_paid) || 0;
          });
        }

        setFeesData({
          totalExpected,
          collected,
          pending: totalExpected - collected,
          isLoading: false,
        });
      } catch (error) {
        console.error('Error fetching fees data:', error);
        setFeesData((prev) => ({ ...prev, isLoading: false }));
      }
    }

    fetchFeesData();
  }, []);

  const percentage = feesData.totalExpected > 0 
    ? (feesData.collected / feesData.totalExpected) * 100 
    : 0;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="bg-card rounded-xl border border-border/50 p-4 sm:p-6 shadow-sm">
      <div className="flex items-center justify-between mb-3 sm:mb-4">
        <h3 className="font-semibold text-foreground text-sm sm:text-base">Fees Collection</h3>
        <span className="text-xs sm:text-sm text-muted-foreground">Current Term</span>
      </div>

      <div className="space-y-3 sm:space-y-4">
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs sm:text-sm text-muted-foreground">Collection Progress</span>
            <span className="text-xs sm:text-sm font-medium text-foreground">
              {feesData.isLoading ? '...' : `${percentage.toFixed(1)}%`}
            </span>
          </div>
          <Progress value={feesData.isLoading ? 0 : percentage} className="h-2" />
        </div>

        <div className="grid grid-cols-2 gap-2 sm:gap-4">
          <div className="p-2.5 sm:p-3 rounded-lg bg-success/10">
            <div className="flex items-center gap-1.5 sm:gap-2 mb-1">
              <TrendingUp className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-success" />
              <span className="text-xs sm:text-sm text-success font-medium">Collected</span>
            </div>
            <p className="text-sm sm:text-lg font-bold text-foreground truncate">
              {feesData.isLoading ? '...' : formatCurrency(feesData.collected)}
            </p>
          </div>
          <div className="p-2.5 sm:p-3 rounded-lg bg-warning/10">
            <div className="flex items-center gap-1.5 sm:gap-2 mb-1">
              <AlertCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-warning" />
              <span className="text-xs sm:text-sm text-warning font-medium">Pending</span>
            </div>
            <p className="text-sm sm:text-lg font-bold text-foreground truncate">
              {feesData.isLoading ? '...' : formatCurrency(feesData.pending)}
            </p>
          </div>
        </div>

        <div className="pt-2 sm:pt-3 border-t border-border">
          <div className="flex items-center justify-between">
            <span className="text-xs sm:text-sm text-muted-foreground">Total Expected</span>
            <span className="font-semibold text-foreground text-sm sm:text-base">
              {feesData.isLoading ? '...' : formatCurrency(feesData.totalExpected)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
