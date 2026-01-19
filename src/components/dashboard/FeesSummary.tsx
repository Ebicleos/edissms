import { useState, useEffect } from 'react';
import { TrendingUp, AlertCircle, Wallet } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

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
    <div className="content-card">
      <div className="flex items-center justify-between mb-4 sm:mb-5">
        <h3 className="section-heading flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-accent" />
          Fees Collection
        </h3>
        <span className="text-xs sm:text-sm text-muted-foreground font-medium px-2.5 py-1 bg-muted/50 rounded-lg">
          Current Term
        </span>
      </div>

      <div className="space-y-4 sm:space-y-5">
        {/* Progress Bar */}
        <div>
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-xs sm:text-sm text-muted-foreground font-medium">Collection Progress</span>
            <span className={cn(
              "text-sm sm:text-base font-bold",
              percentage >= 70 ? "text-success" : percentage >= 40 ? "text-warning" : "text-destructive"
            )}>
              {feesData.isLoading ? '...' : `${percentage.toFixed(1)}%`}
            </span>
          </div>
          <div className="progress-enhanced">
            <div 
              className="progress-enhanced-bar"
              style={{ width: feesData.isLoading ? '0%' : `${percentage}%` }}
            />
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          <div className="summary-card summary-card-success">
            <div className="flex items-center gap-2 mb-2">
              <div className="h-8 w-8 rounded-lg bg-success/15 flex items-center justify-center">
                <TrendingUp className="h-4 w-4 text-success" />
              </div>
              <span className="text-xs sm:text-sm text-success font-semibold">Collected</span>
            </div>
            <p className="text-base sm:text-xl font-bold text-foreground truncate">
              {feesData.isLoading ? '...' : formatCurrency(feesData.collected)}
            </p>
          </div>
          <div className="summary-card summary-card-warning">
            <div className="flex items-center gap-2 mb-2">
              <div className="h-8 w-8 rounded-lg bg-warning/15 flex items-center justify-center">
                <AlertCircle className="h-4 w-4 text-warning" />
              </div>
              <span className="text-xs sm:text-sm text-warning font-semibold">Pending</span>
            </div>
            <p className="text-base sm:text-xl font-bold text-foreground truncate">
              {feesData.isLoading ? '...' : formatCurrency(feesData.pending)}
            </p>
          </div>
        </div>

        {/* Total Expected */}
        <div className="pt-3 sm:pt-4 border-t border-border/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center">
                <Wallet className="h-3.5 w-3.5 text-primary" />
              </div>
              <span className="text-xs sm:text-sm text-muted-foreground font-medium">Total Expected</span>
            </div>
            <span className="font-bold text-foreground text-base sm:text-lg">
              {feesData.isLoading ? '...' : formatCurrency(feesData.totalExpected)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}