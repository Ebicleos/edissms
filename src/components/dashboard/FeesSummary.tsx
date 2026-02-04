import { useState, useEffect } from 'react';
import { TrendingUp, AlertCircle, Wallet, Sparkles } from 'lucide-react';
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
    <div className="glass-card p-5 sm:p-6">
      <div className="flex items-center justify-between mb-4 sm:mb-5">
        <h3 className="section-heading flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-accent" />
          Fees Collection
        </h3>
        <span className="text-xs sm:text-sm text-muted-foreground font-semibold px-3 py-1.5 bg-gradient-to-r from-muted/60 to-muted/40 rounded-full">
          Current Term
        </span>
      </div>

      <div className="space-y-4 sm:space-y-5">
        {/* Progress Bar */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs sm:text-sm text-muted-foreground font-medium">Collection Progress</span>
            <span className={cn(
              "text-sm sm:text-base font-bold",
              percentage >= 70 ? "text-success" : percentage >= 40 ? "text-warning" : "text-destructive"
            )}>
              {feesData.isLoading ? '...' : `${percentage.toFixed(1)}%`}
            </span>
          </div>
          <div className="h-3 rounded-full bg-muted/50 overflow-hidden">
            <div 
              className={cn(
                "h-full rounded-full transition-all duration-700 ease-out",
                percentage >= 70 
                  ? "bg-gradient-to-r from-accent to-lime" 
                  : percentage >= 40 
                    ? "bg-gradient-to-r from-warning to-secondary" 
                    : "bg-gradient-to-r from-destructive to-pink"
              )}
              style={{ width: feesData.isLoading ? '0%' : `${percentage}%` }}
            />
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          <div className="relative overflow-hidden rounded-2xl p-4 border border-accent/20 bg-gradient-to-br from-accent/10 to-lime/5">
            <div className="absolute -top-4 -right-4 w-16 h-16 bg-accent/20 rounded-full blur-2xl" />
            <div className="relative">
              <div className="flex items-center gap-2 mb-2">
                <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-accent to-lime flex items-center justify-center shadow-lg">
                  <TrendingUp className="h-4 w-4 text-white" />
                </div>
                <span className="text-xs sm:text-sm text-accent font-semibold">Collected</span>
              </div>
              <p className="text-lg sm:text-xl font-bold text-foreground truncate">
                {feesData.isLoading ? '...' : formatCurrency(feesData.collected)}
              </p>
            </div>
          </div>
          <div className="relative overflow-hidden rounded-2xl p-4 border border-warning/20 bg-gradient-to-br from-warning/10 to-secondary/5">
            <div className="absolute -top-4 -right-4 w-16 h-16 bg-warning/20 rounded-full blur-2xl" />
            <div className="relative">
              <div className="flex items-center gap-2 mb-2">
                <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-warning to-secondary flex items-center justify-center shadow-lg">
                  <AlertCircle className="h-4 w-4 text-white" />
                </div>
                <span className="text-xs sm:text-sm text-warning font-semibold">Pending</span>
              </div>
              <p className="text-lg sm:text-xl font-bold text-foreground truncate">
                {feesData.isLoading ? '...' : formatCurrency(feesData.pending)}
              </p>
            </div>
          </div>
        </div>

        {/* Total Expected */}
        <div className="pt-4 border-t border-border/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-primary/20 to-purple/10 flex items-center justify-center">
                <Wallet className="h-4 w-4 text-primary" />
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
